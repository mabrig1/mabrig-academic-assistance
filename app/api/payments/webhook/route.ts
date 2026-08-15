import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Paystack is not configured." }, { status: 500 });
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  if (signature !== expected) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

  const event = JSON.parse(raw);
  if (event.event === "charge.success") {
    const reference = String(event.data?.reference || "");
    const amount = Number(event.data?.amount || 0);
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (payment && amount === payment.amount * 100) {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID", paidAt: new Date() } }),
        prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } }),
      ]);
    }
  }
  return NextResponse.json({ received: true });
}
