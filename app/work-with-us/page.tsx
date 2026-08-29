const roles = [
  ["Academic Formatting Assistant", "Format Word documents, projects, references and tables using approved client instructions and UNN presets."],
  ["Printing & Production Assistant", "Prepare print jobs, check page order, support binding, packaging and quality control."],
  ["Campus Delivery Partner", "Collect and deliver completed orders across approved UNN campus zones with proof of delivery."],
  ["Research Support Assistant", "Support legitimate literature organization, data entry, proofreading and research administration under supervision."],
  ["Data Analysis Assistant", "Assist with Excel/SPSS data preparation, tables and charts where competence has been verified."],
  ["Customer Support & Sales Partner", "Respond to enquiries, explain services, follow up orders and earn approved referral commissions."],
];

const stages = ["Apply online", "Identity & UNN status verification", "Skills screening", "Short practical test", "Interview", "Reference/guarantor check where required", "Orientation & academic-integrity training", "Probationary assignments", "Approved worker pool"];

export default function WorkWithUsPage() {
  return <main className="container" style={{paddingTop:40,paddingBottom:60}}>
    <span className="badge">UNN Student Work Programme</span>
    <h1>Earn part-time. Build real work experience.</h1>
    <p className="lead">Mabrig ICT & Academic Assistance recruits capable University of Nigeria students for flexible, task-based and part-time roles that can fit around academic schedules. Recruitment is merit-based and applicants should never pay for a job offer.</p>

    <section className="section"><h2>Available talent pools</h2><div className="grid">{roles.map(([title,text]) => <article className="card" key={title}><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="section"><h2>Minimum standard</h2><div className="card"><ul><li>Current UNN student or other specifically approved applicant.</li><li>Reliable phone number and email address.</li><li>Good communication, punctuality and respect for client confidentiality.</li><li>Role-relevant competence demonstrated through a practical test.</li><li>Agreement to academic-integrity, privacy, quality-control and anti-fraud rules.</li><li>Availability must be declared honestly so assignments do not interfere with classes or examinations.</li></ul></div></section>

    <section className="section"><h2>Recruitment process</h2><div className="card"><ol>{stages.map(stage => <li key={stage}>{stage}</li>)}</ol><p><strong>No recruitment fee:</strong> applicants are not charged to apply, interview or receive a legitimate work offer.</p></div></section>

    <section className="section"><h2>How workers earn</h2><div className="grid"><article className="card"><h3>Task pay</h3><p>Approved rate per completed formatting, production, support or delivery task. The rate is shown before acceptance.</p></article><article className="card"><h3>Shift pay</h3><p>For scheduled office/production support, use a written hourly or shift rate and attendance record.</p></article><article className="card"><h3>Referral commission</h3><p>Eligible sales/referral partners receive a defined commission only after the customer's order is paid and verified.</p></article><article className="card"><h3>Performance bonus</h3><p>Optional bonus for sustained quality, reliability, customer satisfaction and low rework rates.</p></article></div></section>

    <section className="section"><h2>Worker protections & controls</h2><div className="card"><p>Every engagement should state the role, pay basis, expected turnaround, supervisor, confidentiality duties and dispute channel. Workers should only see the minimum customer information needed for their assigned task. Academic support must remain editing, tutoring, research assistance, formatting and other legitimate support; assessed work must not be misrepresented as the student's own work.</p></div></section>

    <section className="section"><div className="notice"><strong>Application form integration:</strong> connect this page to the worker application database/dashboard before public recruitment. Recommended fields: full name, UNN registration number, faculty/department, year, phone, email, role choices, skills, availability, portfolio/sample, emergency/guarantor contact where appropriate, consent and application status.</div></section>
  </main>;
}
