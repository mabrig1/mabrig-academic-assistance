import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const columns = [
  ["NEW", "New orders"],
  ["AWAITING_PAYMENT", "Awaiting payment"],
  ["PAID", "Paid"],
  ["IN_PROGRESS", "In progress"],
  ["QUALITY_CHECK", "Quality check"],
  ["PRINTING", "Printing"],
  ["OUT_FOR_DELIVERY", "Out for delivery"],
  ["DELIVERED", "Delivered"],
] as const;

export default async function AdminPage() {
  const [total, students, recent, ...counts] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: true, service: true },
    }),
    ...columns.map(([status]) => prisma.order.count({ where: { status: status as any } })),
  ]);

  return (
    <main className="section container">
      <div className="nav"><div><span className="badge">MABRIG OPERATIONS</span><h1 style={{fontSize:42}}>Admin Dashboard</h1></div><a className="btn secondary" href="/">Student Storefront</a></div>
      <div className="grid">
        <div className="card"><h3>Total Orders</h3><div style={{fontSize:34,fontWeight:800}}>{total}</div></div>
        <div className="card"><h3>Registered Students</h3><div style={{fontSize:34,fontWeight:800}}>{students}</div></div>
        {columns.map(([status, label], index) => <div className="card" key={status}><h3>{label}</h3><div style={{fontSize:34,fontWeight:800}}>{counts[index]}</div></div>)}
      </div>

      <section className="section">
        <div className="card">
          <h2>Recent Orders</h2>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr><th style={{textAlign:"left",padding:10}}>Order</th><th style={{textAlign:"left",padding:10}}>Student</th><th style={{textAlign:"left",padding:10}}>Service</th><th style={{textAlign:"left",padding:10}}>Status</th><th style={{textAlign:"left",padding:10}}>Created</th></tr></thead>
              <tbody>{recent.map(order => <tr key={order.id}><td style={{padding:10,borderTop:"1px solid #dce7e2"}}>{order.orderNumber}</td><td style={{padding:10,borderTop:"1px solid #dce7e2"}}>{order.user.name}</td><td style={{padding:10,borderTop:"1px solid #dce7e2"}}>{order.service.name}</td><td style={{padding:10,borderTop:"1px solid #dce7e2"}}>{order.status}</td><td style={{padding:10,borderTop:"1px solid #dce7e2"}}>{order.createdAt.toLocaleString()}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
