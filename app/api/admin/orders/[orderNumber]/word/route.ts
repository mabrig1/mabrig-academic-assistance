import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { Order, Service, User } from "@/lib/models";
import { buildAcademicWordDocument } from "@/lib/word-document";
import {
  DocumentTransformationError,
  parseDocumentTransformationMode,
  transformAcademicText,
} from "@/lib/ai-document-transform";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

type OrderDoc = {
  orderNumber?: string;
  documentTitle?: string | null;
  userId?: unknown;
  serviceId?: unknown;
  pastedContent?: string | null;
  font?: string;
  fontSize?: number;
  spacing?: string;
  coverPage?: boolean;
  references?: boolean;
  transformationMode?: string;
};

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 100);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { orderNumber: rawOrderNumber } = await context.params;
    const orderNumber = decodeURIComponent(rawOrderNumber || "").trim();
    if (!orderNumber) return NextResponse.json({ error: "Order number is required." }, { status: 400 });

    await connectMongoDB();
    const result = await Order.findOne({ orderNumber }).lean().exec();
    const order = result as OrderDoc | null;
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const text = order.pastedContent?.trim() || "";
    if (!text) {
      return NextResponse.json(
        { error: "This order has no stored convertible text. Ask the student to paste the text or submit a new supported upload." },
        { status: 409 },
      );
    }

    const [userResult, serviceResult] = await Promise.all([
      User.findById(order.userId).lean().exec(),
      Service.findById(order.serviceId).lean().exec(),
    ]);

    const user = userResult as { name?: string } | null;
    const service = serviceResult as { name?: string } | null;
    const title = order.documentTitle || service?.name || "Academic Document";
    const transformationMode = parseDocumentTransformationMode(order.transformationMode);
    const transformed = await transformAcademicText({ text, title, mode: transformationMode });

    const buffer = await buildAcademicWordDocument({
      text: transformed.text,
      title,
      studentName: user?.name || "",
      orderNumber: order.orderNumber || orderNumber,
      font: order.font || "Times New Roman",
      fontSize: order.fontSize || 12,
      spacing: order.spacing || "1.5",
      coverPage: Boolean(order.coverPage),
      references: Boolean(order.references),
    });

    const filename = safeFilename(`${title}-${user?.name || "student"}-${order.orderNumber || orderNumber}.docx`);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Text-Transformation": transformationMode,
      },
    });
  } catch (error) {
    if (error instanceof DocumentTransformationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Order Word generation failed", error);
    return NextResponse.json({ error: "Unable to generate the Word document." }, { status: 500 });
  }
}
