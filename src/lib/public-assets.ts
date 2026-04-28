/** Admin загрузки лежат под /uploads — для них на VPS без sharp часто ломается next/image optimizer. */
export function isPublicUploadPath(src: string | null | undefined): boolean {
  return typeof src === "string" && src.startsWith("/uploads/");
}
