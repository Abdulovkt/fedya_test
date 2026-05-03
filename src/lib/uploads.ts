import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
  ".tif",
  ".tiff",
  ".bmp",
  ".avif",
]);

/** Linux FS чувствителен к регистру: всегда сохраняем расширение в нижнем регистре = URL совпадает с файлом. */
function normalizedRasterExtension(kind: "jpeg" | "png" | "webp" | "gif"): string {
  if (kind === "jpeg") return ".jpg";
  return `.${kind}`;
}

/** JPEG / PNG / WebP / GIF по сигнатуре (MIME на телефонах часто пустой). */
function sniffRasterKind(buf: Buffer): "jpeg" | "png" | "webp" | "gif" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  )
    return "png";
  if (
    buf.length >= 12 &&
    buf.slice(0, 4).toString("ascii") === "RIFF" &&
    buf.slice(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";
  if (
    buf.length >= 6 &&
    (buf.slice(0, 6).toString("ascii") === "GIF87a" || buf.slice(0, 6).toString("ascii") === "GIF89a")
  )
    return "gif";
  return null;
}

/** ISO BMFF — часто HEIF/HEIC с камеры iPhone. */
function looksLikeHeifContainer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  if (buf.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buf.toString("ascii", 8, 12);
  return ["heic", "heix", "hevc", "heim", "heis", "hevm", "hevs", "mif1", "msf1"].includes(brand);
}

function hasAllowedExtension(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase();
  return ALLOWED_EXT.has(ext);
}

function passesFileGate(file: File, buf: Buffer): boolean {
  const t = file.type.trim().toLowerCase();
  if (t.startsWith("image/")) return true;
  if (t === "" || t === "application/octet-stream" || t === "binary/octet-stream") {
    return sniffRasterKind(buf) !== null || looksLikeHeifContainer(buf) || hasAllowedExtension(file.name);
  }
  return false;
}

async function saveOneImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_BYTES) return null;

  const buf = Buffer.from(await file.arrayBuffer());
  if (!passesFileGate(file, buf)) return null;

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });

  try {
    const jpegBuf = await sharp(buf)
      .rotate()
      .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    const name = `${crypto.randomUUID()}.jpg`;
    await writeFile(path.join(dir, name), jpegBuf);
    return `/uploads/${name}`;
  } catch {
    const kind = sniffRasterKind(buf);
    if (!kind) return null;
    const ext = normalizedRasterExtension(kind);
    const name = `${crypto.randomUUID()}${ext}`;
    await writeFile(path.join(dir, name), buf);
    return `/uploads/${name}`;
  }
}

/** Одно изображение (как в админке товара). */
export async function saveUploadedImage(file: File | null): Promise<string | null> {
  return saveOneImage(file);
}

/**
 * Сохраняет до `maxFiles` файлов из FormData с именами `photo0`, `photo1`, …
 * или одно поле `photos` с несколькими файлами.
 */
export async function saveReviewPhotosFromFormData(formData: FormData, maxFiles: number): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < maxFiles; i += 1) {
    const key = `photo${i}`;
    const file = formData.get(key) as File | null;
    const url = await saveOneImage(file);
    if (url) urls.push(url);
  }
  if (urls.length > 0) return urls;
  const multi = formData.getAll("photos") as File[];
  for (const file of multi) {
    if (urls.length >= maxFiles) break;
    const url = await saveOneImage(file);
    if (url) urls.push(url);
  }
  return urls;
}
