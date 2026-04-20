import { NextRequest, NextResponse } from "next/server";
import { syncPendingOrderPayments } from "@/lib/paypass-sync";
import { getSettings } from "@/lib/settings";

function readSecret(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return (
    req.headers.get("x-sync-secret")?.trim() ||
    req.nextUrl.searchParams.get("secret")?.trim() ||
    ""
  );
}

async function handleSync(req: NextRequest) {
  const settings = await getSettings();
  const expectedSecret = settings.paypass_sync_secret.trim();
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "PayPass sync secret is not configured" },
      { status: 503 },
    );
  }

  const providedSecret = readSecret(req);
  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 50;
  const result = await syncPendingOrderPayments(Number.isFinite(limit) ? limit : 50);
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}
