"use client";

const LINK_PATTERN = /(https?:\/\/[^\s]+|\/?uploads\/[^\s]+)/;
const RECEIPT_IMAGE_META_PATTERN = /^\[receipt-image\](.+)$/i;
const RECEIPT_FILE_META_PATTERN = /^\[receipt-file\](.+)$/i;

function normalizeDetectedUrl(value: string) {
  const cleaned = value.replace(/[),.;!?]+$/g, "");
  if (cleaned.startsWith("uploads/")) return `/${cleaned}`;
  return cleaned;
}

function isUrlPart(part: string) {
  const normalized = normalizeDetectedUrl(part);
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("uploads/")
  );
}

function sanitizeDisplayText(text: string) {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return (
        !RECEIPT_IMAGE_META_PATTERN.test(trimmed) &&
        !RECEIPT_FILE_META_PATTERN.test(trimmed)
      );
    })
    .join("\n");
}

export function MessageText({ text, isDark = false }: { text: string; isDark?: boolean }) {
  const displayText = sanitizeDisplayText(text);
  const lines = displayText.split("\n");

  return (
    <div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
        {lines.map((line, lineIndex) => {
          const parts = line.split(LINK_PATTERN);
          return (
            <span key={`${line}-${lineIndex}`}>
              {parts.map((part, partIndex) => {
                if (!part) return null;
                if (!isUrlPart(part)) return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
                const normalizedUrl = normalizeDetectedUrl(part);

                return (
                  <a
                    key={`${lineIndex}-${partIndex}`}
                    href={normalizedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`underline underline-offset-2 ${isDark ? "text-white" : "text-brand"}`}
                  >
                    {normalizedUrl}
                  </a>
                );
              })}
              {lineIndex < lines.length - 1 ? <br /> : null}
            </span>
          );
        })}
      </p>
    </div>
  );
}
