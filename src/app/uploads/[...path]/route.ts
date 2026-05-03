import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Раздача загрузок с учётом регистра имени файла (Linux): запрос /uploads/id.JPG найдёт id.jpg.
 * Перехватывает /uploads/* раньше, чем статика из public (маршрут приложения имеет приоритет).
 */
export async function GET(_request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  if (!segments?.length) return new NextResponse("Not Found", { status: 404 });

  const requested = segments.join("/");
  if (requested.includes("..") || path.isAbsolute(requested)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  let entries: string[];
  try {
    entries = await fs.readdir(uploadsRoot);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }

  const wantLower = requested.toLowerCase();
  const match = entries.find((name) => name.toLowerCase() === wantLower);
  if (!match) return new NextResponse("Not Found", { status: 404 });

  const fullPath = path.resolve(uploadsRoot, match);
  const rel = path.relative(uploadsRoot, fullPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await fs.readFile(fullPath);
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(match).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
