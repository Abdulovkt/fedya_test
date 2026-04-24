export const QUALITY_TIERS = ["economy", "standard", "premium"] as const;

export type QualityTier = (typeof QUALITY_TIERS)[number];

export function normalizeQualityTier(raw: string): QualityTier {
  const t = raw.trim().toLowerCase();
  if (t === "economy" || t === "standard" || t === "premium") return t;
  return "standard";
}

export function qualityTierLabel(tier: QualityTier): string {
  switch (tier) {
    case "economy":
      return "Базовое качество";
    case "standard":
      return "Стандарт";
    case "premium":
      return "Премиум";
    default:
      return "Стандарт";
  }
}
