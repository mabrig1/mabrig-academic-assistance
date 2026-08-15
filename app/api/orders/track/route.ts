import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const orderNumber = String(body.orderNumber || "").trim();
  const whatsapp = String(body.whatsapp || "").trim();

  if (!orderNumber || !whatsapp) return NextResponse.json({ error: "Order number and WhatsApp number are required." }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { orderNumber, user: { whatsapp } },
    select: { orderNumber: true, status: true, quotedAmount: true, currency: true, createdAt: true, updatedAt: true, service: { select: { name: true } }, delivery: { select: { status: true, location: true } } },
  });

  if (!order) return NextResponse.json({ error: "Order not found. Check the order number and WhatsApp number." }, { status: 404 });
  return NextResponse.json({ ok: true, order });
}
