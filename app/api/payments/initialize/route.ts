import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initializePaystack } from "@/lib/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { orderNumber, email } = await request.json();
    if (!orderNumber || !email) return NextResponse.json({ error: "Order number and email are required." }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { orderNumber }, include: { payment: true, user: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!order.quotedAmount) return NextResponse.json({ error: "This order has not been quoted yet." }, { status: 409 });
    if (order.payment?.status === "PAID") return NextResponse.json({ error: "This order is already paid." }, { status: 409 });

    const reference = `MAB-${order.orderNumber}-${Date.now()}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/payment/callback`;
    const payment = await initializePaystack({ email, amountNaira: order.quotedAmount, reference, callbackUrl });

    await prisma.payment.upsert({
      where: { orderId: order.id },
      update: { reference, amount: order.quotedAmount, status: "PENDING" },
      create: { orderId: order.id, reference, amount: order.quotedAmount, status: "PENDING" },
    });
    await prisma.order.update({ where: { id: order.id }, data: { status: "AWAITING_PAYMENT" } });

    return NextResponse.json({ ok: true, authorizationUrl: payment.authorization_url, reference });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment initialization failed." }, { status: 500 });
  }
}
