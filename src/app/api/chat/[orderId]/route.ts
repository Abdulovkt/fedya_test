import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, orders } from "@/db/schema";
import { auth } from "@/auth";
import { sendNewMessageEmail } from "@/lib/email";

type Params = { params: Promise<{ orderId: string }> };

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

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  const [msg] = await db
    .insert(chatMessages)
    .values({ orderId: oid, sender: access.sender, text })
    .returning();

  // Notify customer by email when admin replies
  if (access.sender === "admin") {
    const [order] = await db
      .select({
        email: orders.email,
        customerName: orders.customerName,
        chatToken: orders.chatToken,
      })
      .from(orders)
      .where(eq(orders.id, oid))
      .limit(1);

    if (order?.chatToken) {
      sendNewMessageEmail({
        to: order.email,
        customerName: order.customerName,
        orderId: oid,
        chatToken: order.chatToken,
        messageText: text,
      }).catch(() => {});
    }
  }

  return NextResponse.json(msg, { status: 201 });
}
