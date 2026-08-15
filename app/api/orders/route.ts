import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const whatsapp = String(form.get("whatsapp") || "").trim();
  const service = String(form.get("service") || "").trim();
  const instructions = String(form.get("instructions") || "").trim();

  if (!name || !whatsapp || !service || !instructions) {
    return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
  }

  const orderId = `MAB-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.floor(10000 + Math.random() * 90000)}`;

  // MVP: persist this request to PostgreSQL/Supabase in the next stage.
  // Paystack, WhatsApp, Telegram and file storage should be connected through
  // server-side integrations after environment variables are configured.
  console.log({ orderId, name, whatsapp, service, instructions, file: form.get("file") instanceof File ? (form.get("file") as File).name : null });

  return NextResponse.json({ ok: true, orderId });
}
