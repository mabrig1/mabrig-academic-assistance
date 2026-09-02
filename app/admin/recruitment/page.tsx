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
  performanceThreshold: number;
  createdAt: string;
  commissionSummary?: {
    totalReferrals: number;
    eligibleCompleted: number;
    previousMonthEligible?: number;
    currentCommissionRate: number;
    accruedUnpaid: number;
    totalPaidCommission: number;
    unpaidOrderNumbers: string[];
  };
};

const SITE_URL = "https://academic.mabrigkorie.org";

function money(value?: number) {
  return `₦${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

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
  const totalAccrued = useMemo(() => applications.reduce((sum, application) => sum + Number(application.commissionSummary?.accruedUnpaid || 0), 0), [applications]);
  const totalPaid = useMemo(() => applications.reduce((sum, application) => sum + Number(application.commissionSummary?.totalPaidCommission || 0), 0), [applications]);
  const totalReferrals = useMemo(() => applications.reduce((sum, application) => sum + Number(application.commissionSummary?.totalReferrals || 0), 0), [applications]);

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

  async function recordPayout(application: Application) {
    const summary = application.commissionSummary;
    if (!summary || summary.accruedUnpaid <= 0) {
      setMessage(`No cleared unpaid commission for ${application.name}.`);
      return;
    }
    const confirmed = window.confirm(`Record ${money(summary.accruedUnpaid)} as PAID to ${application.name} for ${summary.unpaidOrderNumbers.length} eligible order(s)? Only continue after you have actually paid the promoter.`);
    if (!confirmed) return;
    setBusy(application.applicationNumber);
    const response = await fetch("/api/admin/recruitment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationNumber: application.applicationNumber, action: "PAYOUT" }),
    });
    const data = await response.json();
    setBusy("");
    if (!response.ok) {
      setMessage(data.error || "Unable to record commission payout.");
      return;
    }
    setMessage(`Payout ${data.payout.payoutNumber} recorded: ${money(data.payout.amount)} for ${data.payout.orderCount} eligible order(s).`);
    await load();
  }

  async function copyPartnerLink(code: string) {
    await navigator.clipboard.writeText(`${SITE_URL}/?ref=${encodeURIComponent(code)}`);
    setMessage(`Referral link copied for ${code}.`);
  }

  return <main className="section">
    <div className="container" style={{maxWidth: 1240}}>
      <span className="badge">UNN Student Marketer Intake</span>
      <h1>Recruitment & Commission Operations</h1>
      <p className="lead">Approve campus promoters, issue referral codes, monitor attributed orders, review cleared commissions and record weekly payouts.</p>

      <div className="grid" style={{marginTop: 20}}>
        <div className="card"><h3>Pending</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{pendingCount}</p></div>
        <div className="card"><h3>Approved</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{approvedCount}</p></div>
        <div className="card"><h3>Total Referrals</h3><p style={{fontSize: 34, fontWeight: 800, margin: 0}}>{totalReferrals}</p></div>
        <div className="card"><h3>Accrued Commission</h3><p style={{fontSize: 30, fontWeight: 800, margin: 0}}>{money(totalAccrued)}</p></div>
        <div className="card"><h3>Recorded Paid</h3><p style={{fontSize: 30, fontWeight: 800, margin: 0}}>{money(totalPaid)}</p></div>
      </div>

      <div className="notice" style={{marginTop: 18}}><strong>Commission rule:</strong> an order clears only when it carries the promoter's official referral code, its payment is verified PAID, and the work has reached READY, COLLECTED or DELIVERED. Record a payout here only after the promoter has actually received the money.</div>

      {message && <div className="notice" style={{marginTop: 18}}>{message}</div>}

      <div style={{display: "grid", gap: 16, marginTop: 20}}>
        {applications.map(application => {
          const code = application.assignedReferralCode || "";
          const summary = application.commissionSummary;
          const whatsappDigits = application.whatsapp.replace(/\D/g, "");
          const approvalText = code
            ? `Hello ${application.name}, your Mabrig Academic Assistance UNN Student Promoter application has been approved. Your official referral code is ${code}. Your promoter dashboard is ${SITE_URL}/promoter and your referral link is ${SITE_URL}/?ref=${code}`
            : `Hello ${application.name}, we are reviewing your Mabrig Academic Assistance student promoter application ${application.applicationNumber}.`;
          return <article className="card" key={application.applicationNumber}>
            <div style={{display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap"}}>
              <div style={{flex: "1 1 340px"}}>
                <span className="badge">{application.status}</span>
                <h2 style={{marginBottom: 6}}>{application.name}</h2>
                <p style={{margin: 0}}><strong>{application.department}</strong> • {application.level} Level</p>
                <p style={{marginTop: 6}}>WhatsApp: {application.whatsapp}<br />Application: {application.applicationNumber}<br />Applied: {new Date(application.createdAt).toLocaleString()}</p>
                {code && <div className="notice"><strong>Referral code:</strong> {code}<br /><span style={{wordBreak: "break-all"}}>{SITE_URL}/?ref={code}</span></div>}
              </div>

              <div style={{flex: "1 1 420px"}}>
                <div className="grid">
                  <div className="card" style={{padding: 16}}><strong>Current Rate</strong><p style={{fontSize: 28, fontWeight: 800, margin: "6px 0 0"}}>{summary?.currentCommissionRate ?? application.standardCommissionRate}%</p></div>
                  <div className="card" style={{padding: 16}}><strong>Referrals</strong><p style={{fontSize: 28, fontWeight: 800, margin: "6px 0 0"}}>{summary?.totalReferrals || 0}</p></div>
                  <div className="card" style={{padding: 16}}><strong>Eligible Completed</strong><p style={{fontSize: 28, fontWeight: 800, margin: "6px 0 0"}}>{summary?.eligibleCompleted || 0}</p></div>
                  <div className="card" style={{padding: 16}}><strong>Accrued</strong><p style={{fontSize: 24, fontWeight: 800, margin: "6px 0 0"}}>{money(summary?.accruedUnpaid)}</p></div>
                  <div className="card" style={{padding: 16}}><strong>Paid Commission</strong><p style={{fontSize: 24, fontWeight: 800, margin: "6px 0 0"}}>{money(summary?.totalPaidCommission)}</p></div>
                  <div className="card" style={{padding: 16}}><strong>Performance</strong><p style={{fontSize: 24, fontWeight: 800, margin: "6px 0 0"}}>{summary?.previousMonthEligible || 0}/{application.performanceThreshold || 10}</p></div>
                </div>
                <p style={{marginTop: 10}}><strong>Commission policy:</strong> {application.standardCommissionRate}% standard • {application.performanceCommissionRate}% performance after {application.performanceThreshold || 10} eligible completed referrals in the previous calendar month.</p>
              </div>
            </div>

            <div className="actions" style={{marginTop: 14}}>
              {application.status !== "APPROVED" && <button className="btn primary" disabled={busy === application.applicationNumber} onClick={() => updateStatus(application.applicationNumber, "APPROVED")}>Approve & Issue Code</button>}
              {application.status !== "REJECTED" && <button className="btn secondary" disabled={busy === application.applicationNumber} onClick={() => updateStatus(application.applicationNumber, "REJECTED")}>Reject</button>}
              {application.status === "APPROVED" && <button className="btn secondary" disabled={busy === application.applicationNumber} onClick={() => updateStatus(application.applicationNumber, "SUSPENDED")}>Suspend</button>}
              {application.status === "SUSPENDED" && <button className="btn secondary" disabled={busy === application.applicationNumber} onClick={() => updateStatus(application.applicationNumber, "APPROVED")}>Reactivate</button>}
              {code && <button className="btn secondary" onClick={() => copyPartnerLink(code)}>Copy Referral Link</button>}
              {application.status === "APPROVED" && Number(summary?.accruedUnpaid || 0) > 0 && <button className="btn primary" disabled={busy === application.applicationNumber} onClick={() => recordPayout(application)}>Record {money(summary?.accruedUnpaid)} Payout</button>}
              {code && <a className="btn secondary" target="_blank" rel="noreferrer" href={`/promoter`}>Promoter Dashboard</a>}
              <a className="btn whatsapp" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(approvalText)}`}>{code ? "Send Approval on WhatsApp" : "WhatsApp Applicant"}</a>
            </div>
          </article>;
        })}
      </div>
    </div>
  </main>;
}
