import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { Delivery, Order, Service, User } from "@/lib/models";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await connectMongoDB();
  const body = await request.json().catch(() => ({}));
  const orderNumber = String(body.orderNumber || "").trim();
  const whatsapp = String(body.whatsapp || "").trim();
  if (!orderNumber || !whatsapp) return NextResponse.json({ error: "Order number and WhatsApp number are required." }, { status: 400 });

  const user = await User.findOne({ whatsapp }).lean();
  if (!user) return NextResponse.json({ error: "Order not found. Check the order number and WhatsApp number." }, { status: 404 });
  const order = await Order.findOne({ orderNumber, userId: user._id }).lean();
  if (!order) return NextResponse.json({ error: "Order not found. Check the order number and WhatsApp number." }, { status: 404 });
  const [service, delivery] = await Promise.all([Service.findById(order.serviceId).lean(), Delivery.findOne({ orderId: order._id }).lean()]);

  return NextResponse.json({ ok: true, order: { orderNumber: order.orderNumber, status: order.status, quotedAmount: order.quotedAmount, currency: order.currency, createdAt: order.createdAt, updatedAt: order.updatedAt, service: { name: service?.name || "Academic service" }, delivery: delivery ? { status: delivery.status, location: delivery.location } : null } });
}
