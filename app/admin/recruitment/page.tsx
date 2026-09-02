"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Application = {
  _id: string;
  applicationNumber: string;
  name: string;
  whatsapp: string;
  department: string;
  level: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  assignedReferralCode?: string | null;
  standardCommissionRate: number;
  performanceCommissionRate: number;
  createdAt: string;
};

const SITE_URL = "https://academic.mabrigkorie.org";

export default function RecruitmentAdminPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("Loading promoter applications...");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/recruitment", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Unable to load applications.");
      return;
    }
    setApplications(data.applications || []);
    setMessage((data.applications || []).length ? "" : "No student promoter applications yet.");
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pendingCount = useMemo(() => applications.filter(application => application.status === "PENDING").length, [applications]);
  const approvedCount = useMemo(() => applications.filter(application => application.status === "APPROVED").length, [applications]);

  async function updateStatus(applicationNumber: string, status: Application["status"]) {
    setBusy(applicationNumber);
    const response = await fetch("/api/admin/recruitment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationNumber, status }),
    });
    const data = await response.json();
    setBusy("");
    if (!response.ok) {
      setMessage(data.error || "Unable to update application.");
      return;
    }
    setMessage(`${applicationNumber} updated to ${status}.`);
    await load();
  }

  async function copyPartnerLink(code: string) {
    await navigator.clipboard.writeText(`${SITE_URL}/?ref=${encodeURIComponent(code)}`);
    setMessage(`Referral link copied for ${code}.`);
  }

  return <main className="section">
    <div className="container" style={{maxWidth: 1180}}>
      <span className="badge">UNN Student Marketer Intake</span>
      <h1>Recruitment Applications</h1>
      <p className="lead">Review student marketers and campus promoters, approve suitable applicants, and issue their official referral code.</p>

      <div className="grid" style={{marginTop: 20}}>
        <div className="card"><h3>Pending</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{pendingCount}</p></div>
        <div className="card"><h3>Approved</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{approvedCount}</p></div>
        <div className="card"><h3>Total Applications</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{applications.length}</p></div>
      </div>

      {message && <div className="notice" style={{marginTop: 18}}>{message}</div>}

      <div style={{display: "grid", gap: 16, marginTop: 20}}>
        {applications.map(application => {
          const code = application.assignedReferralCode || "";
          const whatsappDigits = application.whatsapp.replace(/\D/g, "");
          const approvalText = code
            ? `Hello ${application.name}, your Mabrig Academic Assistance UNN Student Promoter application has been approved. Your official referral code is ${code}. Create/share your referral link here: ${SITE_URL}/partners`
            : `Hello ${application.name}, we are reviewing your Mabrig Academic Assistance student promoter application ${application.applicationNumber}.`;
          return <article className="card" key={application.applicationNumber}>
            <div style={{display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap"}}>
              <div>
                <span className="badge">{application.status}</span>
                <h2 style={{marginBottom: 6}}>{application.name}</h2>
                <p style={{margin: 0}}><strong>{application.department}</strong> • {application.level} Level</p>
                <p style={{marginTop: 6}}>WhatsApp: {application.whatsapp}<br />Application: {application.applicationNumber}<br />Applied: {new Date(application.createdAt).toLocaleString()}</p>
              </div>
              <div style={{minWidth: 260}}>
                <p><strong>Commission:</strong> {application.standardCommissionRate}% standard • {application.performanceCommissionRate}% performance</p>
                {code && <div className="notice"><strong>Referral code:</strong> {code}<br /><span style={{wordBreak: "break-all"}}>{SITE_URL}/?ref={code}</span></div>}
              </div>
            </div>

            <div className="actions" style={{marginTop: 14}}>
              {application.status !== "APPROVED" && <button className="btn primary" disabled={busy === application.applicationNumber} onClick={() => updateStatus(application.applicationNumber, "APPROVED")}>Approve & Issue Code</button>}
              {application.status !== "REJECTED" && <button className="btn secondary" disabled={busy === application.applicationNumber} onClick={() => updateStatus(application.applicationNumber, "REJECTED")}>Reject</button>}
              {application.status === "APPROVED" && <button className="btn secondary" disabled={busy === application.applicationNumber} onClick={() => updateStatus(application.applicationNumber, "SUSPENDED")}>Suspend</button>}
              {application.status === "SUSPENDED" && <button className="btn secondary" disabled={busy === application.applicationNumber} onClick={() => updateStatus(application.applicationNumber, "APPROVED")}>Reactivate</button>}
              {code && <button className="btn secondary" onClick={() => copyPartnerLink(code)}>Copy Referral Link</button>}
              <a className="btn whatsapp" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(approvalText)}`}>{code ? "Send Approval on WhatsApp" : "WhatsApp Applicant"}</a>
            </div>
          </article>;
        })}
      </div>
    </div>
  </main>;
}
