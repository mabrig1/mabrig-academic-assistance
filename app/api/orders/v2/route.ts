import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { Delivery, Order, OrderFile, Service, User } from "@/lib/models";
import { calculateQuote } from "@/lib/pricing";

export const runtime = "nodejs";

const MAX_PAGES = 20;
type PrintOption = "DIGITAL_ONLY" | "PRINT_ONLY" | "DIGITAL_AND_PRINT" | "DIGITAL_PRINT_DELIVERY";
type PrintType = "BLACK_WHITE" | "COLOUR";
type BindingType = "NONE" | "SPIRAL" | "SOFT" | "HARD";

const PRINT_OPTIONS: readonly PrintOption[] = ["DIGITAL_ONLY", "PRINT_ONLY", "DIGITAL_AND_PRINT", "DIGITAL_PRINT_DELIVERY"];
const PRINT_TYPES: readonly PrintType[] = ["BLACK_WHITE", "COLOUR"];
const BINDINGS: readonly BindingType[] = ["NONE", "SPIRAL", "SOFT", "HARD"];
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await connectMongoDB();
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase() || null;
    const department = String(form.get("department") || "").trim() || null;
    const serviceName = String(form.get("service") || "").trim();
    const instructions = String(form.get("instructions") || "").trim();
    const referralCode = String(form.get("referralCode") || "").trim().slice(0, 64) || null;
    const rawPrintOption = String(form.get("printOption") || "");
    const rawPrintType = String(form.get("printType") || "");
    const rawBinding = String(form.get("binding") || "");
    const printOption: PrintOption = PRINT_OPTIONS.includes(rawPrintOption as PrintOption) ? rawPrintOption as PrintOption : "DIGITAL_ONLY";
    const printType: PrintType = PRINT_TYPES.includes(rawPrintType as PrintType) ? rawPrintType as PrintType : "BLACK_WHITE";
    const copies = Math.max(1, Math.min(100, Number(form.get("copies") || 1)));
    const pages = Number(form.get("pages") || 0);
    const binding: BindingType = BINDINGS.includes(rawBinding as BindingType) ? rawBinding as BindingType : "NONE";
    const deliveryLocation = String(form.get("deliveryLocation") || "").trim();
    const deliveryNote = String(form.get("deliveryNote") || "").trim();
    const requestedFormat = String(form.get("requestedFormat") || "PDF").trim();
    const spacing = String(form.get("spacing") || "1.5").trim();
    const font = String(form.get("font") || "Times New Roman").trim();
    const fontSize = Number(form.get("fontSize") || 12);
    const citations = form.get("citations") === "on";
    const references = form.get("references") === "on";
    const coverPage = form.get("coverPage") === "on";
    const conversionRequested = form.get("conversionRequested") === "on";
    const file = form.get("file");

    if (!name || !whatsapp || !serviceName || !instructions) return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    if (!Number.isInteger(pages) || pages < 1 || pages > MAX_PAGES) return NextResponse.json({ error: `Page count must be between 1 and ${MAX_PAGES} pages.` }, { status: 400 });
    if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 30) return NextResponse.json({ error: "Font size must be between 8 and 30pt." }, { status: 400 });
    if (printOption === "DIGITAL_PRINT_DELIVERY" && !deliveryLocation) return NextResponse.json({ error: "Choose a delivery location." }, { status: 400 });
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Uploaded file must not exceed 25MB." }, { status: 413 });
      if (file.type && !ALLOWED_FILE_TYPES.has(file.type)) return NextResponse.json({ error: "Unsupported file type. Upload PDF, Word, PowerPoint or Excel." }, { status: 400 });
    }

    const service = await Service.findOneAndUpdate({ name: serviceName }, { $setOnInsert: { name: serviceName } }, { upsert: true, new: true });
    const user = await User.findOneAndUpdate({ whatsapp }, { $set: { name, email, department, optedIn: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const orderNumber = `MAB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(10000 + Math.random() * 90000)}`;
    const quotedAmount = calculateQuote({ service: serviceName, printOption, printType, copies, pages, binding, delivery: printOption === "DIGITAL_PRINT_DELIVERY" });

    const order = await Order.create({ orderNumber, userId: user._id, serviceId: service._id, referralCode, instructions, quotedAmount, printOption, printType, copies, pages, binding, requestedFormat, spacing, font, fontSize, citations, references, coverPage, conversionRequested });
    if (file instanceof File && file.size > 0) await OrderFile.create({ orderId: order._id, fileName: file.name, storageKey: `pending/${orderNumber}/${file.name}`, mimeType: file.type || null, sizeBytes: file.size });
    if (printOption === "DIGITAL_PRINT_DELIVERY") await Delivery.create({ orderId: order._id, location: deliveryLocation, addressNote: deliveryNote || null });

    return NextResponse.json({ ok: true, orderId: order.orderNumber, quotedAmount, currency: "NGN", emailAvailable: Boolean(user.email), referralCode, status: order.status, maxPages: MAX_PAGES });
  } catch (error) {
    console.error("MongoDB order creation failed", error);
    return NextResponse.json({ error: "We could not create the order. Check MONGODB_URI and try again." }, { status: 500 });
  }
}
