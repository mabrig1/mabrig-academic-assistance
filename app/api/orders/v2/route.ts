import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { Delivery, Order, OrderFile, Service, User } from "@/lib/models";
import { calculateQuote } from "@/lib/pricing";

export const runtime = "nodejs";

const PRINT_OPTIONS = ["DIGITAL_ONLY", "PRINT_ONLY", "DIGITAL_AND_PRINT", "DIGITAL_PRINT_DELIVERY"];
const PRINT_TYPES = ["BLACK_WHITE", "COLOUR"];
const BINDINGS = ["NONE", "SPIRAL", "SOFT", "HARD"];

export async function POST(request: Request) {
  try {
    await connectMongoDB();
    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase() || null;
    const department = String(form.get("department") || "").trim() || null;
    const serviceName = String(form.get("service") || "").trim();
    const instructions = String(form.get("instructions") || "").trim();
    const printOption = PRINT_OPTIONS.includes(String(form.get("printOption"))) ? String(form.get("printOption")) : "DIGITAL_ONLY";
    const printType = PRINT_TYPES.includes(String(form.get("printType"))) ? String(form.get("printType")) : "BLACK_WHITE";
    const copies = Math.max(1, Math.min(100, Number(form.get("copies") || 1)));
    const binding = BINDINGS.includes(String(form.get("binding"))) ? String(form.get("binding")) : "NONE";
    const deliveryLocation = String(form.get("deliveryLocation") || "").trim();
    const deliveryNote = String(form.get("deliveryNote") || "").trim();
    const file = form.get("file");

    if (!name || !whatsapp || !serviceName || !instructions) return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    if (printOption === "DIGITAL_PRINT_DELIVERY" && !deliveryLocation) return NextResponse.json({ error: "Choose a delivery location." }, { status: 400 });

    const service = await Service.findOneAndUpdate({ name: serviceName }, { $setOnInsert: { name: serviceName } }, { upsert: true, new: true });
    const user = await User.findOneAndUpdate({ whatsapp }, { $set: { name, email, department, optedIn: true } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const orderNumber = `MAB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(10000 + Math.random() * 90000)}`;
    const quotedAmount = calculateQuote({ service: serviceName, printOption, printType, copies, binding, delivery: printOption === "DIGITAL_PRINT_DELIVERY" });

    const order = await Order.create({ orderNumber, userId: user._id, serviceId: service._id, instructions, quotedAmount, printOption, printType, copies, binding });
    if (file instanceof File && file.size > 0) await OrderFile.create({ orderId: order._id, fileName: file.name, storageKey: `pending/${orderNumber}/${file.name}`, mimeType: file.type || null, sizeBytes: file.size });
    if (printOption === "DIGITAL_PRINT_DELIVERY") await Delivery.create({ orderId: order._id, location: deliveryLocation, addressNote: deliveryNote || null });

    return NextResponse.json({ ok: true, orderId: order.orderNumber, quotedAmount, currency: "NGN", emailAvailable: Boolean(user.email), status: order.status });
  } catch (error) {
    console.error("MongoDB order creation failed", error);
    return NextResponse.json({ error: "We could not create the order. Check MONGODB_URI and try again." }, { status: 500 });
  }
}
