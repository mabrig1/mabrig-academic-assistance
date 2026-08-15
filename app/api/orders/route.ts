import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();
    const department = String(form.get("department") || "").trim() || null;
    const serviceName = String(form.get("service") || "").trim();
    const instructions = String(form.get("instructions") || "").trim();
    const file = form.get("file");

    if (!name || !whatsapp || !serviceName || !instructions) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    const service = await prisma.service.upsert({
      where: { name: serviceName },
      update: {},
      create: { name: serviceName },
    });

    const user = await prisma.user.upsert({
      where: { whatsapp },
      update: { name, department, optedIn: true },
      create: { name, whatsapp, department, optedIn: true },
    });

    const orderNumber = `MAB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(10000 + Math.random() * 90000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        serviceId: service.id,
        instructions,
        files: file instanceof File && file.size > 0
          ? {
              create: {
                fileName: file.name,
                storageKey: `pending/${orderNumber}/${file.name}`,
                mimeType: file.type || null,
                sizeBytes: file.size,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json({ ok: true, orderId: order.orderNumber, status: order.status });
  } catch (error) {
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "We could not create the order. Check the database configuration and try again." }, { status: 500 });
  }
}
