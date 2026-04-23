import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 4 * 1024 * 1024;

async function saveOneImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) return null;
  if (file.size > MAX_BYTES) return null;
  const ext = path.extname(file.name) || ".jpg";
  const name = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

/** Одно изображение (как в админке товара). */
export async function saveUploadedImage(file: File | null): Promise<string | null> {
  return saveOneImage(file);
}

/**
 * Сохраняет до `maxFiles` файлов из FormData с именами `photo0`, `photo1`, …
 * или одно поле `photos` с несколькими файлами.
 */
export async function saveReviewPhotosFromFormData(
  formData: FormData,
  maxFiles: number,
): Promise<string[]> {
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
