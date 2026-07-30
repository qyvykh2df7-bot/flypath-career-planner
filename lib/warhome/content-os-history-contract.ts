import {
  CONTENT_OS_LIMITS,
  CONTENT_OS_OBJECTIVES,
  CONTENT_OS_PLATFORMS,
  isContentOsDate,
  type ContentOsMetricInput,
  type ContentOsObjective,
} from "@/lib/warhome/content-os-contract";
import {
  CONTENT_OS_BRAND_PRODUCTS,
  type ContentOsBrandProduct,
} from "@/lib/warhome/content-os-brand-contract";

export const CONTENT_OS_LIBRARY_PLATFORMS = [
  ...CONTENT_OS_PLATFORMS,
  "other",
] as const;

export type ContentOsLibraryPlatform =
  (typeof CONTENT_OS_LIBRARY_PLATFORMS)[number];

export type ContentOsHistoricalItemInput = {
  title: string;
  platform: ContentOsLibraryPlatform;
  publishedOn: string;
  sourceUrl: string | null;
  description: string | null;
  hook: string | null;
  cta: string | null;
  contentPillar: string | null;
  objective: ContentOsObjective | null;
  relatedProductKey: ContentOsBrandProduct | null;
  metrics: ContentOsMetricInput | null;
};

function includesValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value);
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: string, max: number): string | null | undefined {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;
  return normalized.length <= max ? normalized : undefined;
}

function optionalMetric(formData: FormData): ContentOsMetricInput | null | undefined {
  const names = [
    "views",
    "likes",
    "comments",
    "shares",
    "saves",
    "followersGained",
    "leadsGenerated",
    "salesAttributed",
  ] as const;
  const values = names.map((name) => formString(formData, name));
  if (values.every((value) => value === "")) return null;

  const parsed = Object.fromEntries(
    names.map((name, index) => {
      const value = values[index] || "0";
      if (!/^\d+$/.test(value)) return [name, null];
      const number = Number(value);
      return [
        name,
        Number.isSafeInteger(number) &&
        number >= 0 &&
        number <= CONTENT_OS_LIMITS.metricValue
          ? number
          : null,
      ];
    }),
  ) as Record<(typeof names)[number], number | null>;
  if (Object.values(parsed).some((value) => value === null)) return undefined;

  return {
    recordedOn: formString(formData, "publishedOn"),
    views: parsed.views as number,
    likes: parsed.likes as number,
    comments: parsed.comments as number,
    shares: parsed.shares as number,
    saves: parsed.saves as number,
    followersGained: parsed.followersGained as number,
    leadsGenerated: parsed.leadsGenerated as number,
    salesAttributed: parsed.salesAttributed as number,
  };
}

function safeUrl(value: string): string | null | undefined {
  if (!value) return null;
  if (value.length > CONTENT_OS_LIMITS.itemSourceUrl) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function parseContentOsHistoricalItemForm(
  formData: FormData,
): ContentOsHistoricalItemInput | null {
  const title = optionalText(
    formString(formData, "title"),
    CONTENT_OS_LIMITS.itemTitle,
  );
  const platform = formString(formData, "platform");
  const publishedOn = formString(formData, "publishedOn");
  const sourceUrl = safeUrl(formString(formData, "sourceUrl"));
  const description = optionalText(
    formString(formData, "description"),
    CONTENT_OS_LIMITS.itemSummary,
  );
  const hook = optionalText(
    formString(formData, "hook"),
    CONTENT_OS_LIMITS.itemHook,
  );
  const cta = optionalText(
    formString(formData, "cta"),
    CONTENT_OS_LIMITS.itemCta,
  );
  const contentPillar = optionalText(
    formString(formData, "contentPillar"),
    CONTENT_OS_LIMITS.itemPillar,
  );
  const objectiveValue = formString(formData, "objective");
  const relatedProductValue = formString(formData, "relatedProductKey");
  const metrics = optionalMetric(formData);

  const objective = objectiveValue
    ? includesValue(CONTENT_OS_OBJECTIVES, objectiveValue)
      ? objectiveValue
      : undefined
    : null;
  const relatedProductKey = relatedProductValue
    ? includesValue(CONTENT_OS_BRAND_PRODUCTS, relatedProductValue)
      ? relatedProductValue
      : undefined
    : null;

  if (
    typeof title !== "string" ||
    !includesValue(CONTENT_OS_LIBRARY_PLATFORMS, platform) ||
    !isContentOsDate(publishedOn) ||
    sourceUrl === undefined ||
    description === undefined ||
    hook === undefined ||
    cta === undefined ||
    contentPillar === undefined ||
    objective === undefined ||
    relatedProductKey === undefined ||
    metrics === undefined
  ) {
    return null;
  }

  return {
    title,
    platform,
    publishedOn,
    sourceUrl,
    description,
    hook,
    cta,
    contentPillar,
    objective,
    relatedProductKey,
    metrics,
  };
}
