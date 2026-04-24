import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { eq, asc } from "drizzle-orm";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { chatMessages, orders } from "@/db/schema";
import { auth } from "@/auth";
import { sendNewMessageEmail } from "@/lib/email";
import { getDisplayOrderNumber } from "@/lib/order-number";

type Params = { params: Promise<{ orderId: string }> };
const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim() || "receipt";
  return trimmed
    .replace(/[^\p{L}\p{N}._ -]/gu, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function getFileExtension(file: File) {
  if (file.type === "application/pdf") return ".pdf";
  if (file.type === "image/jpeg") return ".jpg";
  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  const fromName = path.extname(file.name).toLowerCase();
  if (fromName) return fromName;
  return "";
}

async function saveAttachment(file: File) {
  if (!ALLOWED_FILE_TYPES.has(file.type)) {
    return { ok: false as const, error: "Unsupported file type" };
  }
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE) {
    return { ok: false as const, error: "Invalid file size" };
  }

  const ext = getFileExtension(file);
  const baseName = sanitizeFileName(file.name.replace(/\.[^/.]+$/, "")) || "receipt";
  const storedName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "chat-receipts");
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, storedName), bytes);

  return {
    ok: true as const,
    url: `/uploads/chat-receipts/${storedName}`,
    originalName: `${baseName}${ext}`,
  };
}

async function parseIncomingMessage(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const text = (formData.get("text")?.toString() || "").trim();
    const candidate = formData.get("attachment");
    const attachment = candidate instanceof File && candidate.size > 0 ? candidate : null;
    return { text, attachment };
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  return { text, attachment: null as File | null };
}

async function resolveAccess(
  req: NextRequest,
  orderId: number,
): Promise<{ sender: "customer" | "admin" } | null> {
  // If a chat token is present → customer auth takes priority over admin session.
  // This prevents a logged-in admin testing in the same browser from having
  // their customer messages saved as sender "admin".
  const token =
    req.nextUrl.searchParams.get("token") ??
    req.headers.get("x-chat-token");

  if (token) {
    const [order] = await db
      .select({ chatToken: orders.chatToken })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (!order || order.chatToken !== token) return null;
    return { sender: "customer" };
  }

  // No token → must be admin with a valid session
  const session = await auth();
  if (session?.user?.id) return { sender: "admin" };
  return null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { orderId } = await params;
  const oid = Number(orderId);
  if (!Number.isFinite(oid))
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const access = await resolveAccess(req, oid);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.orderId, oid))
    .orderBy(asc(chatMessages.createdAt));

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { orderId } = await params;
  const oid = Number(orderId);
  if (!Number.isFinite(oid))
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const access = await resolveAccess(req, oid);
  if (!access) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = await parseIncomingMessage(req);
  let text = parsed.text;

  if (parsed.attachment) {
    const upload = await saveAttachment(parsed.attachment);
    if (!upload.ok) {
      return NextResponse.json({ error: upload.error }, { status: 400 });
    }

    const receiptMetaLine =
      parsed.attachment.type.startsWith("image/")
        ? `[receipt-image]${upload.url}`
        : `[receipt-file]${upload.url}`;
    const attachmentPart = `Файл чека: ${upload.originalName}\n${upload.url}\n${receiptMetaLine}`;
    text = text ? `${text}\n\n${attachmentPart}` : attachmentPart;
  }

  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const [msg] = await db
    .insert(chatMessages)
    .values({ orderId: oid, sender: access.sender, text })
    .returning();

  revalidatePath("/admin");
  revalidatePath("/admin/chats");
  revalidatePath(`/admin/chats/${oid}`);

  // Notify customer by email when admin replies
  if (access.sender === "admin") {
    const [order] = await db
      .select({
        email: orders.email,
        customerName: orders.customerName,
        chatToken: orders.chatToken,
        publicOrderNumber: orders.publicOrderNumber,
      })
      .from(orders)
      .where(eq(orders.id, oid))
      .limit(1);

    if (order?.chatToken) {
      sendNewMessageEmail({
        to: order.email,
        customerName: order.customerName,
        orderId: oid,
        orderNumber: getDisplayOrderNumber({ id: oid, publicOrderNumber: order.publicOrderNumber }),
        orderRef: order.publicOrderNumber ?? String(oid),
        chatToken: order.chatToken,
        messageText: text,
      }).catch(() => {});
    }
  }

  return NextResponse.json(msg, { status: 201 });
}
