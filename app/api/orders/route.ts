import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BindingType, PrintOption, PrintType } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();
    const department = String(form.get("department") || "").trim() || null;
    const serviceName = String(form.get("service") || "").trim();
    const instructions = String(form.get("instructions") || "").trim();
    const printOption = String(form.get("printOption") || "DIGITAL_ONLY");
    const printType = String(form.get("printType") || "BLACK_WHITE");
    const copies = Math.max(1, Math.min(100, Number(form.get("copies") || 1)));
    const binding = String(form.get("binding") || "NONE");
    const deliveryLocation = String(form.get("deliveryLocation") || "").trim();
    const deliveryNote = String(form.get("deliveryNote") || "").trim();
    const file = form.get("file");

    if (!name || !whatsapp || !serviceName || !instructions) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    const service = await prisma.service.upsert({ where: { name: serviceName }, update: {}, create: { name: serviceName } });
    const user = await prisma.user.upsert({
      where: { whatsapp },
      update: { name, department, optedIn: true },
      create: { name, whatsapp, department, optedIn: true },
    });

    const orderNumber = `MAB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(10000 + Math.random() * 90000)}`;
    const needsDelivery = printOption === "DIGITAL_PRINT_DELIVERY";

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        serviceId: service.id,
        instructions,
        printOption: Object.values(PrintOption).includes(printOption as PrintOption) ? printOption as PrintOption : PrintOption.DIGITAL_ONLY,
        printType: Object.values(PrintType).includes(printType as PrintType) ? printType as PrintType : PrintType.BLACK_WHITE,
        copies,
        binding: Object.values(BindingType).includes(binding as BindingType) ? binding as BindingType : BindingType.NONE,
        files: file instanceof File && file.size > 0 ? { create: { fileName: file.name, storageKey: `pending/${orderNumber}/${file.name}`, mimeType: file.type || null, sizeBytes: file.size } } : undefined,
        delivery: needsDelivery && deliveryLocation ? { create: { location: deliveryLocation, addressNote: deliveryNote || null } } : undefined,
      },
    });

    return NextResponse.json({ ok: true, orderId: order.orderNumber, status: order.status });
  } catch (error) {
    console.error("Order creation failed", error);
    return NextResponse.json({ error: "We could not create the order. Check the database configuration and try again." }, { status: 500 });
  }
}
