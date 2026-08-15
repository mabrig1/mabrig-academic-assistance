import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystack } from "@/lib/paystack";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();
    if (!reference) return NextResponse.json({ error: "Payment reference is required." }, { status: 400 });
    const result = await verifyPaystack(reference);
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) return NextResponse.json({ error: "Payment record not found." }, { status: 404 });

    const paid = result.status === "success" && Number(result.amount) === payment.amount * 100;
    if (!paid) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID", paidAt: new Date() } }),
      prisma.order.update({ where: { id: payment.orderId }, data: { status: "PAID" } }),
    ]);
    return NextResponse.json({ ok: true, status: "PAID" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 500 });
  }
}
