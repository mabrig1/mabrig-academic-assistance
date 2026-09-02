import { connectMongoDB } from "@/lib/mongodb";
import { PartnerLead } from "@/lib/partner-models";

export const dynamic = "force-dynamic";

function label(value?: string) {
  return String(value || "—").replaceAll("_", " ");
}

function whatsappLink(value?: string | null) {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return digits ? `https://wa.me/${digits}` : "";
}

export default async function PartnershipsAdminPage() {
  await connectMongoDB();
  const leads = await PartnerLead.find({}).sort({ createdAt: -1 }).limit(300).lean() as any[];
  const newCount = leads.filter(lead => lead.status === "NEW").length;
  const referredCount = leads.filter(lead => lead.referralCode).length;

  return <main className="section"><div className="container" style={{maxWidth: 1180}}>
    <span className="badge">Recruiters & Partnership Pipeline</span>
    <h1>Organisation Leads</h1>
    <p className="lead">Recruiters, employers, sponsors, campuses, training organisations and technology partners who submitted interest through the public partnership page.</p>

    <div className="grid" style={{marginTop: 20}}>
      <article className="card"><h3>New</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{newCount}</p></article>
      <article className="card"><h3>Total Leads</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{leads.length}</p></article>
      <article className="card"><h3>Promoter Introduced</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{referredCount}</p></article>
    </div>

    <div style={{display: "grid", gap: 16, marginTop: 20}}>
      {leads.length === 0 && <div className="notice">No recruiter or partnership enquiries yet.</div>}
      {leads.map(lead => {
        const wa = whatsappLink(lead.whatsapp);
        return <article className="card" key={String(lead._id)}>
          <div style={{display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap"}}>
            <div>
              <span className="badge">{label(lead.interestType)}</span>
              <h2 style={{marginBottom: 4}}>{lead.organisation}</h2>
              <p style={{marginTop: 0}}><strong>{lead.contactName}</strong><br />{lead.email || "No email"}<br />{lead.whatsapp || "No WhatsApp"}</p>
            </div>
            <div style={{minWidth: 250}}>
              <p><strong>Lead:</strong> {lead.leadNumber}<br /><strong>Status:</strong> {label(lead.status)}<br /><strong>Promoter:</strong> {lead.referralCode || "Direct / unattributed"}<br /><strong>Received:</strong> {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—"}</p>
            </div>
          </div>
          {lead.message && <div className="notice" style={{marginTop: 12, whiteSpace: "pre-wrap"}}>{lead.message}</div>}
          <div className="actions" style={{marginTop: 14}}>
            {lead.email && <a className="btn secondary" href={`mailto:${lead.email}?subject=${encodeURIComponent(`Mabrig partnership follow-up — ${lead.leadNumber}`)}`}>Email Contact</a>}
            {wa && <a className="btn whatsapp" href={wa} target="_blank" rel="noreferrer">WhatsApp Contact</a>}
          </div>
        </article>;
      })}
    </div>
  </div></main>;
}
