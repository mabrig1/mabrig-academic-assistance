import { revalidatePath } from "next/cache";
import { connectMongoDB } from "@/lib/mongodb";
import { Delivery, Order, OrderFile, Payment, Service, User } from "@/lib/models";

export const dynamic = "force-dynamic";

const WORKFLOW_STATUSES = [
  "NEW",
  "REVIEW",
  "FORMAT_REQUIRED",
  "READY_TO_PRINT",
  "PRINTING",
  "READY",
  "COLLECTED",
  "CANCELLED",
] as const;

const ALL_STATUSES = new Set<string>([
  ...WORKFLOW_STATUSES,
  "AWAITING_PAYMENT",
  "PAID",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
]);

type OrderRow = {
  _id: unknown;
  orderNumber?: string;
  status?: string;
  userId?: unknown;
  serviceId?: unknown;
  referralCode?: string | null;
  instructions?: string;
  pastedContent?: string | null;
  conversionSource?: string | null;
  conversionWarning?: string | null;
  adminNote?: string | null;
  quotedAmount?: number | null;
  currency?: string;
  printOption?: string;
  printType?: string;
  copies?: number;
  pages?: number;
  binding?: string;
  requestedFormat?: string;
  spacing?: string;
  font?: string;
  fontSize?: number;
  citations?: boolean;
  references?: boolean;
  coverPage?: boolean;
  conversionRequested?: boolean;
  transformationMode?: string;
  bodyAlignment?: string;
  paragraphIndentation?: string;
  boldHeadings?: boolean;
  cleanSpecialCharacters?: boolean;
  pageNumberPosition?: string;
  headingPreset?: string;
  headerText?: string | null;
  footerText?: string | null;
  automaticTableOfContents?: boolean;
  apaFormatting?: boolean;
  widowOrphanControl?: boolean;
  createdAt?: Date | string;
};

type UserRow = { name?: string; whatsapp?: string } | null;
type ServiceRow = { name?: string } | null;
type PaymentRow = { status?: string; amount?: number; reference?: string; paidAt?: Date | string } | null;
type FileRow = { fileName?: string; storageKey?: string; mimeType?: string; sizeBytes?: number } | null;
type DeliveryRow = { status?: string; location?: string; addressNote?: string } | null;

function formatMoney(value?: number | null) {
  return `₦${Number(value || 0).toLocaleString()}`;
}

function whatsappLink(value?: string) {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return digits ? `https://wa.me/${digits}` : "";
}

function label(value?: string) {
  return (value || "—").replaceAll("_", " ");
}

async function updateOrder(formData: FormData) {
  "use server";
  await connectMongoDB();

  const orderNumber = String(formData.get("orderNumber") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const adminNote = String(formData.get("adminNote") || "").trim().slice(0, 3000);

  if (!orderNumber || !ALL_STATUSES.has(status)) return;

  await Order.updateOne(
    { orderNumber },
    { $set: { status, adminNote: adminNote || null } },
  );
  revalidatePath("/admin");
}

export default async function AdminPage() {
  await connectMongoDB();

  const [total, students, rawOrders] = await Promise.all([
    Order.countDocuments(),
    User.countDocuments({ role: "STUDENT" }),
    Order.find().sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const orders = rawOrders as unknown as OrderRow[];
  const counts = await Promise.all(WORKFLOW_STATUSES.map(status => Order.countDocuments({ status })));

  const enriched = await Promise.all(orders.map(async order => {
    const [userResult, serviceResult, paymentResult, fileResult, deliveryResult] = await Promise.all([
      User.findById(order.userId).lean().exec(),
      Service.findById(order.serviceId).lean().exec(),
      Payment.findOne({ orderId: order._id }).lean().exec(),
      OrderFile.findOne({ orderId: order._id }).lean().exec(),
      Delivery.findOne({ orderId: order._id }).lean().exec(),
    ]);

    return {
      ...order,
      user: userResult as UserRow,
      service: serviceResult as ServiceRow,
      payment: paymentResult as PaymentRow,
      file: fileResult as FileRow,
      delivery: deliveryResult as DeliveryRow,
    };
  }));

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <span className="badge">MABRIG PRINT SHOP • PRIVATE ADMIN</span>
          <h1>Printing Operations Dashboard</h1>
          <p>Review student documents, convert text to Word, manage formatting requests, payment details and production status.</p>
        </div>
        <div className="actions">
          <a className="btn conversion-btn" href="/admin/converter">⚡ Word Conversion Studio</a>
          <a className="btn secondary" href="/">Student Site</a>
          <a className="btn secondary" href="/academic-printing">Printing Service</a>
        </div>
      </header>

      <section className="admin-metrics">
        <article className="metric-card power-metric"><span>DOCUMENT SUPERPOWER</span><strong>TEXT → WORD</strong><small>Format and convert from the dashboard</small></article>
        <article className="metric-card"><span>Total Orders</span><strong>{total}</strong></article>
        <article className="metric-card"><span>Students</span><strong>{students}</strong></article>
        {WORKFLOW_STATUSES.map((status, index) => (
          <article className="metric-card" key={status}>
            <span>{label(status)}</span><strong>{counts[index]}</strong>
          </article>
        ))}
      </section>

      <section className="admin-orders">
        <div className="admin-section-title">
          <div><h2>Latest Orders</h2><p>Showing up to 100 most recent orders.</p></div>
        </div>

        {enriched.length === 0 && <div className="card"><p>No orders yet.</p></div>}

        {enriched.map(order => {
          const wa = whatsappLink(order.user?.whatsapp);
          const content = order.pastedContent?.trim() || "";
          const currentStatus = order.status || "NEW";
          const selectableStatus = ALL_STATUSES.has(currentStatus) ? currentStatus : "NEW";
          const conversionReady = Boolean(content && order.orderNumber);

          return (
            <article className="admin-order-card" key={String(order._id)}>
              <div className="admin-order-head">
                <div>
                  <span className="order-number">{order.orderNumber || "Unknown order"}</span>
                  <h3>{order.user?.name || "Unknown student"}</h3>
                  <p>{order.service?.name || "Academic Document Printing"}</p>
                </div>
                <div className="order-head-right">
                  <span className={`status-pill status-${currentStatus.toLowerCase()}`}>{label(currentStatus)}</span>
                  <strong>{formatMoney(order.quotedAmount)}</strong>
                </div>
              </div>

              <div className="admin-detail-grid">
                <div><span>WhatsApp</span><strong>{order.user?.whatsapp || "—"}</strong>{wa && <a href={wa} target="_blank" rel="noreferrer">Message student</a>}</div>
                <div><span>Pages / Copies</span><strong>{order.pages || 1} pages × {order.copies || 1}</strong></div>
                <div><span>Print</span><strong>{label(order.printType)} • {label(order.printOption)}</strong></div>
                <div><span>Binding</span><strong>{label(order.binding)}</strong></div>
                <div><span>Formatting</span><strong>{order.font || "Times New Roman"} {order.fontSize || 12}pt • {order.spacing || "1.5"} spacing</strong></div>
                <div><span>Requested output</span><strong>{order.requestedFormat || "DOCX"}</strong></div>
                <div><span>Academic options</span><strong>{[order.citations && "Citations", order.references && "References", order.coverPage && "Cover page", order.conversionRequested && "Convert/format"].filter(Boolean).join(" • ") || "None selected"}</strong></div>
                <div><span>Text treatment</span><strong>{label(order.transformationMode || "FORMAT")}</strong></div>
                <div><span>Paragraph layout</span><strong>{label(order.bodyAlignment || "JUSTIFIED")} • {label(order.paragraphIndentation || "FIRST-LINE")}</strong></div>
                <div><span>Heading / pages</span><strong>{label(order.headingPreset || "ACADEMIC")} • {label(order.pageNumberPosition || "FOOTER-CENTER")}</strong></div>
                <div><span>Advanced Word options</span><strong>{[order.automaticTableOfContents && "Contents page", order.apaFormatting && "APA 7", order.widowOrphanControl !== false && "Widow/orphan control"].filter(Boolean).join(" • ") || "None selected"}</strong></div>
                <div><span>Header / footer</span><strong>{[order.headerText && `Header: ${order.headerText}`, order.footerText && `Footer: ${order.footerText}`].filter(Boolean).join(" • ") || "No custom text"}</strong></div>
                <div><span>Cleanup</span><strong>{[order.boldHeadings !== false && "Bold headings", order.cleanSpecialCharacters !== false && "Special-character cleanup"].filter(Boolean).join(" • ") || "Disabled"}</strong></div>
                <div><span>Conversion source</span><strong>{order.conversionSource ? label(order.conversionSource) : content ? "PASTE / LEGACY TEXT" : "NOT READY"}</strong></div>
                <div><span>Payment</span><strong>{order.payment?.status || "NO PAYMENT RECORD"}</strong>{order.payment?.reference && <small>{order.payment.reference}</small>}</div>
                <div><span>Delivery</span><strong>{order.delivery ? `${order.delivery.location || "Campus"} • ${order.delivery.status || "PENDING"}` : "No delivery"}</strong>{order.delivery?.addressNote && <small>{order.delivery.addressNote}</small>}</div>
                <div><span>Submitted</span><strong>{order.createdAt ? new Date(order.createdAt).toLocaleString("en-NG") : "—"}</strong></div>
              </div>

              <div className={`conversion-panel ${conversionReady ? "conversion-panel-ready" : ""}`}>
                <div>
                  <span className="conversion-power-badge">⚡ WORD CONVERSION ENGINE</span>
                  <h4>{conversionReady ? "This order is ready for instant Word generation" : "Automatic Word generation is not ready for this order"}</h4>
                  <p>
                    {conversionReady
                      ? `Generate a clean .docx using ${order.font || "Times New Roman"}, ${order.fontSize || 12}pt and ${order.spacing || "1.5"} spacing.`
                      : "Older uploads or unsupported file types may not contain stored convertible text. Use the Conversion Studio and paste the text manually."}
                  </p>
                  {order.conversionWarning && <small className="conversion-warning">{order.conversionWarning}</small>}
                </div>
                <div className="conversion-panel-actions">
                  {conversionReady && <a className="btn conversion-btn" href={`/api/admin/orders/${encodeURIComponent(order.orderNumber || "")}/word`}>Generate Formatted Word (.docx)</a>}
                  <a className="btn secondary" href="/admin/converter">Open Conversion Studio</a>
                </div>
              </div>

              <div className="admin-document-row">
                <div className="admin-doc-box">
                  <h4>Student instructions</h4>
                  <p className="preserve-text">{order.instructions || "No instructions supplied."}</p>
                </div>

                <div className="admin-doc-box">
                  <h4>Uploaded file</h4>
                  {order.file ? <>
                    <p><strong>{order.file.fileName || "Uploaded file"}</strong></p>
                    <small>{order.file.mimeType || "Unknown type"} • {order.file.sizeBytes ? `${Math.ceil(order.file.sizeBytes / 1024)} KB` : "size unknown"}</small>
                    <p className="admin-storage-note">Storage key: {order.file.storageKey || "Not stored"}</p>
                  </> : <p>No file uploaded.</p>}
                </div>
              </div>

              {content && (
                <details className="pasted-document">
                  <summary>View convertible student document text</summary>
                  <div className="pasted-document-content">{content}</div>
                </details>
              )}

              <form action={updateOrder} className="admin-action-form">
                <input type="hidden" name="orderNumber" value={order.orderNumber || ""} />
                <label>
                  <span>Production status</span>
                  <select name="status" defaultValue={selectableStatus}>
                    {Array.from(ALL_STATUSES).map(status => <option value={status} key={status}>{label(status)}</option>)}
                  </select>
                </label>
                <label className="admin-note-field">
                  <span>Printer / admin note</span>
                  <textarea name="adminNote" defaultValue={order.adminNote || ""} placeholder="Formatting issues, collection note, print instructions, follow-up..." />
                </label>
                <button className="btn primary" type="submit">Save Order Update</button>
              </form>
            </article>
          );
        })}
      </section>
    </main>
  );
}
