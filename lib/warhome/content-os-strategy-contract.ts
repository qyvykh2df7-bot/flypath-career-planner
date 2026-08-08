import {
  CONTENT_OS_CATEGORIES,
  CONTENT_OS_LIMITS,
  CONTENT_OS_OBJECTIVES,
  CONTENT_OS_PLATFORMS,
  type ContentOsCategory,
  type ContentOsObjective,
  type ContentOsPlatform,
  type ContentOsProposalStatus,
} from "@/lib/warhome/content-os-contract";
import type { ContentOsBrandProfile } from "@/lib/warhome/content-os-brand-contract";

export const CONTENT_OS_STRATEGY_PILLARS = [
  "pilot_life",
  "aviation_career",
  "training",
  "schools_and_decisions",
  "common_mistakes",
  "professional_advice",
  "aviation_english",
  "atc_phraseology",
  "personal_stories",
  "community",
  "product_sales",
] as const;

export const CONTENT_OS_STRATEGY_FORMATS = [
  "talking_head",
  "story",
  "tutorial",
  "list",
  "opinion",
  "comparison",
] as const;

export const CONTENT_OS_STRATEGY_PRODUCTS = [
  "guide",
  "career_planner",
  "aerocomms",
  "mentorships",
] as const;

export const CONTENT_OS_STRATEGY_PRIORITIES = [
  "high",
  "medium",
  "low",
] as const;

export const CONTENT_OS_STRATEGY_DECISIONS = [
  "approved",
  "rejected",
] as const;

export const CONTENT_OS_STRATEGY_LIMITS = {
  proposalCount: 10,
  idea: 2_000,
  explanation: CONTENT_OS_LIMITS.ideaDescription,
  hook: 1_000,
  cta: 1_000,
  pillar: 100,
  durationSecondsMin: 15,
  durationSecondsMax: 3_600,
} as const;

export const CONTENT_OS_DEFAULT_OBJECTIVE_BALANCE = {
  growth: 40,
  authority: 30,
  community: 20,
  conversion: 10,
} satisfies ContentOsStrategyObjectiveBalance;

export type ContentOsStrategyPillar =
  (typeof CONTENT_OS_STRATEGY_PILLARS)[number];
export type ContentOsStrategyFormat =
  (typeof CONTENT_OS_STRATEGY_FORMATS)[number];
export type ContentOsStrategyProduct =
  (typeof CONTENT_OS_STRATEGY_PRODUCTS)[number];
export type ContentOsStrategyPriority =
  (typeof CONTENT_OS_STRATEGY_PRIORITIES)[number];
export type ContentOsStrategyDecision =
  (typeof CONTENT_OS_STRATEGY_DECISIONS)[number];

export type ContentOsStrategyObjectiveBalance = Record<
  ContentOsObjective,
  number
>;

export type ContentOsStrategySuggestion = {
  title: string;
  idea: string;
  hook: string;
  explanation: string;
  platforms: ContentOsPlatform[];
  format: ContentOsStrategyFormat;
  durationSeconds: number;
  objective: ContentOsObjective;
  relatedProduct: ContentOsStrategyProduct | null;
  cta: string;
  priority: ContentOsStrategyPriority;
  pillar: ContentOsStrategyPillar;
};

export type ContentOsStrategyOutput = {
  summary: string;
  suggestions: ContentOsStrategySuggestion[];
};

export type ContentOsStrategyHistoryEntry = {
  title: string;
  objective: ContentOsObjective | null;
  category: ContentOsCategory | null;
  platform: ContentOsPlatform | "other" | null;
  hook: string | null;
  contentPillar: string | null;
  relatedProductKey: ContentOsStrategyProduct | null;
  contentOrigin: "idea" | "planned" | "historical";
  status: string;
  published: boolean;
  metrics: {
    views: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    followersGained: number | null;
    leadsGenerated: number | null;
    salesAttributed: number | null;
  } | null;
};

export type ContentOsStrategyContext = {
  brand: ContentOsBrandProfile;
  balance: ContentOsStrategyObjectiveBalance;
  history: ContentOsStrategyHistoryEntry[];
};

export type ContentOsStrategyProposal = ContentOsStrategySuggestion & {
  id: string;
  proposalStatus: ContentOsProposalStatus;
  modelName: string;
  createdAt: string;
  reviewedAt: string | null;
};

export type ContentOsStrategistWorkspace = {
  proposals: ContentOsStrategyProposal[];
  historyCount: number;
  publishedCount: number;
  defaultBalance: ContentOsStrategyObjectiveBalance;
};

function includesValue<T extends readonly string[]>(
  values: T,
  value: string,
): value is T[number] {
  return values.includes(value);
}

function normalizedTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

function boundedString(
  value: unknown,
  max: number,
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\r\n/g, "\n");
  return normalized && normalized.length <= max ? normalized : null;
}

function formInteger(formData: FormData, key: string): number | null {
  const value = formData.get(key);
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseContentOsStrategyBalanceForm(
  formData: FormData,
): ContentOsStrategyObjectiveBalance | null {
  const balance = {
    growth: formInteger(formData, "growth"),
    authority: formInteger(formData, "authority"),
    community: formInteger(formData, "community"),
    conversion: formInteger(formData, "conversion"),
  };
  if (
    Object.values(balance).some(
      (value) => value === null || value < 0 || value > 100,
    ) ||
    Object.values(balance).reduce<number>(
      (total, value) => total + (value ?? 0),
      0,
    ) !== 100
  ) {
    return null;
  }
  return balance as ContentOsStrategyObjectiveBalance;
}

export function getContentOsStrategyObjectiveTargets(
  balance: ContentOsStrategyObjectiveBalance,
  count = CONTENT_OS_STRATEGY_LIMITS.proposalCount,
): Record<ContentOsObjective, number> {
  const entries = CONTENT_OS_OBJECTIVES.map((objective, index) => {
    const exact = (balance[objective] / 100) * count;
    return {
      objective,
      index,
      count: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });
  let remaining = count - entries.reduce((total, entry) => total + entry.count, 0);
  for (const entry of [...entries].sort(
    (first, second) =>
      second.remainder - first.remainder || first.index - second.index,
  )) {
    if (remaining <= 0) break;
    entry.count += 1;
    remaining -= 1;
  }
  return Object.fromEntries(
    entries.map(({ objective, count: target }) => [objective, target]),
  ) as Record<ContentOsObjective, number>;
}

export function parseContentOsStrategyOutput(
  value: unknown,
  context: ContentOsStrategyContext,
): ContentOsStrategyOutput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const summary = boundedString(candidate.summary, 5_000);
  if (
    !summary ||
    !Array.isArray(candidate.suggestions) ||
    candidate.suggestions.length !== CONTENT_OS_STRATEGY_LIMITS.proposalCount
  ) {
    return null;
  }

  const existingTitles = new Set(
    context.history.map((entry) => normalizedTitle(entry.title)),
  );
  const generatedTitles = new Set<string>();
  const suggestions: ContentOsStrategySuggestion[] = [];

  for (const rawSuggestion of candidate.suggestions) {
    if (
      !rawSuggestion ||
      typeof rawSuggestion !== "object" ||
      Array.isArray(rawSuggestion)
    ) {
      return null;
    }
    const suggestion = rawSuggestion as Record<string, unknown>;
    const title = boundedString(
      suggestion.title,
      CONTENT_OS_LIMITS.ideaTitle,
    );
    const idea = boundedString(
      suggestion.idea,
      CONTENT_OS_STRATEGY_LIMITS.idea,
    );
    const hook = boundedString(
      suggestion.hook,
      CONTENT_OS_STRATEGY_LIMITS.hook,
    );
    const explanation = boundedString(
      suggestion.explanation,
      CONTENT_OS_STRATEGY_LIMITS.explanation,
    );
    const cta = boundedString(
      suggestion.cta,
      CONTENT_OS_STRATEGY_LIMITS.cta,
    );
    const format =
      typeof suggestion.format === "string" ? suggestion.format : "";
    const objective =
      typeof suggestion.objective === "string" ? suggestion.objective : "";
    const relatedProduct =
      suggestion.relatedProduct === null ? null : suggestion.relatedProduct;
    const priority =
      typeof suggestion.priority === "string" ? suggestion.priority : "";
    const pillar =
      typeof suggestion.pillar === "string" ? suggestion.pillar : "";
    const durationSeconds = suggestion.durationSeconds;
    const platforms = suggestion.platforms;
    const titleKey = title ? normalizedTitle(title) : "";

    if (
      !title ||
      !idea ||
      !hook ||
      !explanation ||
      !cta ||
      !includesValue(CONTENT_OS_STRATEGY_FORMATS, format) ||
      !includesValue(CONTENT_OS_OBJECTIVES, objective) ||
      (relatedProduct !== null &&
        (typeof relatedProduct !== "string" ||
          !includesValue(CONTENT_OS_STRATEGY_PRODUCTS, relatedProduct))) ||
      !includesValue(CONTENT_OS_STRATEGY_PRIORITIES, priority) ||
      !includesValue(CONTENT_OS_STRATEGY_PILLARS, pillar) ||
      typeof durationSeconds !== "number" ||
      !Number.isSafeInteger(durationSeconds) ||
      durationSeconds < CONTENT_OS_STRATEGY_LIMITS.durationSecondsMin ||
      durationSeconds > CONTENT_OS_STRATEGY_LIMITS.durationSecondsMax ||
      !Array.isArray(platforms) ||
      platforms.length < 1 ||
      platforms.length > CONTENT_OS_PLATFORMS.length ||
      platforms.some(
        (platform) =>
          typeof platform !== "string" ||
          !includesValue(CONTENT_OS_PLATFORMS, platform),
      ) ||
      new Set(platforms).size !== platforms.length ||
      existingTitles.has(titleKey) ||
      generatedTitles.has(titleKey)
    ) {
      return null;
    }

    generatedTitles.add(titleKey);
    suggestions.push({
      title,
      idea,
      hook,
      explanation,
      platforms: platforms as ContentOsPlatform[],
      format,
      durationSeconds,
      objective,
      relatedProduct: relatedProduct as ContentOsStrategyProduct | null,
      cta,
      priority,
      pillar,
    });
  }

  const targets = getContentOsStrategyObjectiveTargets(context.balance);
  const actual = Object.fromEntries(
    CONTENT_OS_OBJECTIVES.map((objective) => [
      objective,
      suggestions.filter((suggestion) => suggestion.objective === objective)
        .length,
    ]),
  ) as Record<ContentOsObjective, number>;
  if (
    CONTENT_OS_OBJECTIVES.some(
      (objective) => actual[objective] !== targets[objective],
    )
  ) {
    return null;
  }

  return { summary, suggestions };
}

export function isContentOsStrategyDecision(
  value: string,
): value is ContentOsStrategyDecision {
  return includesValue(CONTENT_OS_STRATEGY_DECISIONS, value);
}

export function contentOsStrategyCategoryForPillar(
  pillar: ContentOsStrategyPillar,
): ContentOsCategory {
  if (pillar === "personal_stories" || pillar === "community") {
    return "personal_brand";
  }
  return CONTENT_OS_CATEGORIES[0];
}
