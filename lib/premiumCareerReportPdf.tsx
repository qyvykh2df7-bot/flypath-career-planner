/**
 * PDF premium compartido por la descarga del navegador y la entrega server-side.
 * Medidas fijas A4 landscape; sin Tailwind ni html2canvas.
 */
import React, { type ReactElement, type ReactNode } from "react";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { buildExecutiveReading } from "@/components/report-preview/executive-reading";
import { flypathProductHref } from "@/components/report-preview/flypath-product-links";
import { PREMIUM_PDF_PAGE_IMAGES } from "@/components/report-preview/report-preview-assets";
import {
  financialInsightMessage,
  flypathSecondaryProductLabel,
  formatEuro,
  formatPriorityAction,
  objetivoLabel,
  paymentDecisionHeadline,
  programaLabel,
  schoolRecommendedAction,
  schoolsInsightMessage,
  verificacionLabel,
} from "@/components/report-preview/report-preview-utils";
import {
  FLYPATH_PARTNER_DISCOUNT_CODE,
  isFlyPathPartnerDiscountEligible,
} from "@/lib/flypath-partner-discount";
import {
  PREMIUM_SCHOOLS_PER_PAGE,
  buildComparativeAdvisory,
  buildInformedDecisionAdvisory,
  buildValidationBlocks,
  buildValidationPriorityMessage,
  chunkItems,
  chunkValidationBlocks,
  type AdvisoryBlock,
  type SchoolValidationBlock,
} from "@/lib/premium-report-advisory";
import type { ReportSnapshotSchoolSummaryItem, ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

Font.registerHyphenationCallback((word: string) => [word]);

/* —— A4 landscape (pt) —— */
const PAGE_W = 841.89;
const PAGE_H = 595.28;
const IMAGE_W_40 = 337;
const IMAGE_W_50 = 421;
const CONTENT_W_40 = PAGE_W - IMAGE_W_40;
const CONTENT_W_50 = PAGE_W - IMAGE_W_50;

/* Preview export padding: px-11 py-12 ≈ 44/48; compact px-9 py-10 */
const PAD_X = 44;
const PAD_Y = 48;
const PAD_X_COMPACT = 36;
const PAD_Y_COMPACT = 40;
const PAD_BOTTOM = 44;

/** Ancho útil columna contenido 40% (menos padding horizontal). */
const INNER_W_40 = CONTENT_W_40 - PAD_X * 2;
const RISK_COL_W = (PAGE_W - 36 * 2 - 16) / 2;

const FONT = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";
const FONT_SERIF = "Times-Roman";
const FONT_SERIF_BOLD = "Times-Bold";

const c = {
  navy: "#0f1a33",
  gold: "#c9a454",
  goldDark: "#8a6520",
  cream: "#faf8f4",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  slate700: "#334155",
  /** Separadores premium — nunca rojo/rose/salmón */
  sepBeige: "#e7e2d8",
  sepGold: "#d8c392",
  sepGray: "#eef0f2",
  sepDivider: "#e7e2d8",
  navyTint: "#f7f4ee",
  insightBg: "#f7f4ee",
  white80: "rgba(255,255,255,0.8)",
  cardBg: "#f7f4ee",
  cardBorder: "#e7e2d8",
};

/** Escala tipográfica premium (+10% cuerpo/insights, +15% bullets/checklists). */
const T = {
  body: 11,
  bodySm: 10,
  bullet: 11,
  bulletDot: 11.5,
  desc: 11,
  insight: 11,
  label: 9,
  labelSm: 8.3,
  title: 22,
  titleLg: 26,
  titleMd: 20,
  subtitle: 11,
  serifMd: 15,
  serifLg: 24,
  number: 10,
  cta: 12,
  coverBrand: 29,
  coverMeta: 12,
  coverName: 24,
  coverScore: 22,
};

function txt(s: string): string {
  return s.replace(/\u00ad/g, "").replace(/\u200b/g, "");
}

const s = StyleSheet.create({
  page: { backgroundColor: c.cream, fontFamily: FONT, fontSize: T.body, color: c.navy },
  row: { flexDirection: "row", width: PAGE_W, height: PAGE_H },
  img40: { width: IMAGE_W_40, height: PAGE_H, backgroundColor: c.navy },
  img50: { width: IMAGE_W_50, height: PAGE_H, backgroundColor: c.navy },
  imgCover: { width: IMAGE_W_50, height: PAGE_H, objectFit: "cover" },
  imgCover40: { width: IMAGE_W_40, height: PAGE_H, objectFit: "cover" },
  content40: {
    width: CONTENT_W_40,
    height: PAGE_H,
    paddingLeft: PAD_X,
    paddingRight: PAD_X,
    paddingTop: PAD_Y,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  content40Top: {
    width: CONTENT_W_40,
    height: PAGE_H,
    paddingLeft: PAD_X,
    paddingRight: PAD_X,
    paddingTop: 34,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "flex-start",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  content50: {
    width: CONTENT_W_50,
    height: PAGE_H,
    paddingLeft: PAD_X,
    paddingRight: PAD_X,
    paddingTop: PAD_Y,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  full: {
    width: PAGE_W,
    height: PAGE_H,
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: PAD_Y_COMPACT,
    paddingBottom: PAD_BOTTOM,
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  sectionLabel: {
    fontSize: T.label,
    letterSpacing: 3.2,
    color: c.gold,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  sectionTitleWrap: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: T.title,
    color: c.navy,
    lineHeight: 1.15,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: PAD_X,
    flexDirection: "row",
    justifyContent: "space-between",
    width: PAGE_W - PAD_X * 2,
    borderTopWidth: 0.5,
    borderTopColor: c.sepGray,
    paddingTop: 6,
  },
  footerFull: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: c.sepGray,
    paddingTop: 6,
  },
  footerTxt: { fontSize: T.labelSm, color: c.muted },
  /* Página 3 — Ruta (columna izquierda densa) */
  routeCol: {
    width: CONTENT_W_40,
    height: PAGE_H,
    paddingLeft: PAD_X,
    paddingRight: PAD_X,
    paddingTop: 38,
    paddingBottom: 38,
    justifyContent: "flex-start",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  routeContentInner: {
    width: INNER_W_40,
    marginTop: 70,
  },
  routeEyebrow: {
    fontSize: T.label,
    letterSpacing: 3.2,
    color: c.gold,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  routeTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: T.titleLg,
    color: c.navy,
    lineHeight: 1.1,
    marginBottom: 6,
  },
  routeReason: {
    fontSize: T.body,
    lineHeight: 1.45,
    color: c.muted,
    marginBottom: 12,
    width: INNER_W_40,
  },
  routePriorityHero: {
    width: INNER_W_40,
    backgroundColor: c.navyTint,
    borderLeftWidth: 4,
    borderLeftColor: c.sepGold,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 20,
    paddingRight: 18,
    marginBottom: 16,
  },
  routePriorityLabel: {
    fontSize: T.label,
    fontFamily: FONT_BOLD,
    color: c.goldDark,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  routePriorityBody: {
    fontFamily: FONT_SERIF,
    fontSize: 19,
    lineHeight: 1.3,
    color: c.navy,
  },
  routeBarsBlock: {
    width: INNER_W_40,
    marginTop: 2,
    marginBottom: 6,
  },
  routeBarRow: {
    marginBottom: 14,
  },
  routeBarRowLast: {
    marginBottom: 0,
  },
  routeBarLabel: {
    fontSize: T.body,
    fontFamily: FONT_BOLD,
    color: c.navy,
    marginBottom: 6,
  },
  routeBarLabelMuted: {
    fontSize: T.body,
    color: c.muted,
    marginBottom: 6,
  },
  routeBarTrack: {
    width: INNER_W_40,
    height: 10,
    backgroundColor: c.sepGray,
  },
  routeBarFillGold: {
    height: 10,
    backgroundColor: c.gold,
  },
  routeBarFillMuted: {
    height: 10,
    backgroundColor: "#d4dae2",
  },
  routeInsightBox: {
    width: INNER_W_40 + 28,
    marginLeft: -14,
    borderLeftWidth: 3,
    borderLeftColor: c.sepGold,
    paddingLeft: 14,
    paddingVertical: 7,
    marginTop: 6,
    marginBottom: 6,
  },
  routeInsightLabel: {
    fontSize: T.labelSm,
    fontFamily: FONT_BOLD,
    color: c.goldDark,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  routeInsightBody: {
    fontSize: T.bodySm,
    lineHeight: 1.48,
    color: c.slate700,
  },
  routeBlockLine: {
    fontSize: T.bodySm,
    color: c.muted,
    marginTop: 0,
    width: INNER_W_40,
  },
  /* Página 4 — Riesgos (grid 2×3, bloque centrado verticalmente) */
  risksPage: {
    width: PAGE_W,
    height: PAGE_H,
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  risksContentStack: {
    width: PAGE_W - 72,
  },
  risksPrincipalHero: {
    backgroundColor: c.navyTint,
    borderLeftWidth: 4,
    borderLeftColor: c.sepGold,
    paddingTop: 20,
    paddingBottom: 18,
    paddingLeft: 22,
    paddingRight: 20,
    marginBottom: 16,
  },
  risksPrincipalEyebrow: {
    fontSize: T.label,
    fontFamily: FONT_BOLD,
    color: c.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  risksPrincipalTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: T.title,
    color: c.navy,
    lineHeight: 1.18,
    marginBottom: 10,
  },
  risksPrincipalBody: {
    fontSize: T.body,
    lineHeight: 1.52,
    color: c.slate700,
    maxWidth: 640,
  },
  risksPrincipalBadgeRow: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  risksPrincipalBadge: {
    fontSize: T.bodySm,
    fontFamily: FONT_BOLD,
    color: c.cream,
    textTransform: "uppercase",
    backgroundColor: c.navy,
    paddingVertical: 6,
    paddingHorizontal: 13,
    letterSpacing: 1,
  },
  risksGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  risksCol: {
    width: RISK_COL_W,
  },
  riskCard: {
    backgroundColor: c.cardBg,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderLeftWidth: 0.5,
    borderTopColor: c.cardBorder,
    borderRightColor: c.cardBorder,
    borderBottomColor: c.cardBorder,
    borderLeftColor: c.cardBorder,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 10,
    minHeight: 98,
  },
  riskCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  riskCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    width: RISK_COL_W - 108,
    paddingRight: 10,
  },
  riskCardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
    marginTop: 3,
  },
  riskCardTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: T.serifMd,
    color: c.navy,
    lineHeight: 1.28,
    flex: 1,
  },
  riskCardBadge: {
    fontSize: 9,
    fontFamily: FONT_BOLD,
    textTransform: "uppercase",
    paddingVertical: 3,
    paddingHorizontal: 7,
    letterSpacing: 0.6,
  },
  riskCardBody: {
    fontSize: T.bodySm,
    lineHeight: 1.45,
    color: c.mutedLight,
    paddingLeft: 16,
  },
});

export const PREMIUM_PDF_ERROR_MESSAGE =
  "No se pudo generar el PDF premium. Inténtalo de nuevo o usa Chrome.";

export type PremiumPdfAssets = {
  origin: string;
  images: Record<keyof typeof PREMIUM_PDF_PAGE_IMAGES, string | null>;
};

async function probeImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    return ct.startsWith("image/") || /\.(png|jpe?g)(\?|$)/i.test(url);
  } catch {
    return false;
  }
}

export async function resolvePremiumPdfAssets(_snapshot: ReportSnapshotV1): Promise<PremiumPdfAssets> {
  const origin =
    typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const abs = (path: string) => `${origin}${path}`;
  const images = {} as PremiumPdfAssets["images"];
  await Promise.all(
    (Object.entries(PREMIUM_PDF_PAGE_IMAGES) as [keyof typeof PREMIUM_PDF_PAGE_IMAGES, string][]).map(
      async ([key, path]) => {
        const url = abs(path);
        images[key] = origin && (await probeImageUrl(url)) ? url : null;
      },
    ),
  );
  return { origin, images };
}

function productLink(origin: string, productId: string): string | null {
  const href = flypathProductHref(productId);
  if (!href) return null;
  return href.startsWith("http") ? href : `${origin}${href}`;
}

function PageFooter({ full }: { full?: boolean }) {
  return (
    <View style={full ? s.footerFull : s.footer} fixed>
      <Text style={s.footerTxt}>FlyPath Career Report · flypath.es</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={s.sectionLabel}>{txt(children)}</Text>;
}

function SectionTitle({ children, compact }: { children: string; compact?: boolean }) {
  return (
    <View style={{ marginBottom: compact ? 14 : 24 }}>
      <Text style={s.sectionTitle}>{txt(children)}</Text>
    </View>
  );
}

function FlyPathInsightBox({
  children,
  goldBg,
  compact,
}: {
  children: string;
  goldBg?: boolean;
  compact?: boolean;
}) {
  return (
    <View
      style={{
        borderLeftWidth: 2,
        borderLeftColor: c.sepGold,
        paddingLeft: 20,
        paddingVertical: 4,
        marginTop: compact ? 12 : goldBg ? 20 : 24,
        backgroundColor: goldBg ? c.insightBg : "transparent",
        paddingTop: goldBg ? 16 : 4,
        paddingBottom: goldBg ? 16 : 4,
        paddingRight: goldBg ? 8 : 0,
      }}
    >
      <Text
        style={{
          fontSize: T.label,
          fontFamily: FONT_BOLD,
          color: c.goldDark,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        FlyPath Insight
      </Text>
      <Text style={{ fontSize: T.insight, lineHeight: 1.52, color: c.slate700 }}>{txt(children)}</Text>
    </View>
  );
}

function InterpretationBlock({
  title,
  body,
  first,
}: {
  title: string;
  body: string;
  first?: boolean;
}) {
  return (
    <View
      style={{
        borderTopWidth: first ? 0 : 0.5,
        borderTopColor: c.sepDivider,
        paddingTop: first ? 0 : 20,
        marginTop: first ? 0 : 0,
      }}
    >
      <Text
        style={{
          fontSize: T.label,
          fontFamily: FONT_BOLD,
          color: c.gold,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {txt(title)}
      </Text>
      <Text style={{ fontSize: T.desc, lineHeight: 1.45, color: c.slate700 }}>{txt(body)}</Text>
    </View>
  );
}

function SideImage({ src, wide }: { src: string | null; wide?: boolean }) {
  const box = wide ? s.img50 : s.img40;
  const style = wide ? s.imgCover : s.imgCover40;
  return (
    <View style={box}>
      {src ? <Image src={src} style={style} /> : <View style={{ width: "100%", height: PAGE_H, backgroundColor: "#1a2744" }} />}
    </View>
  );
}

function FullContentPage({
  sectionLabel,
  children,
  compact,
}: {
  sectionLabel: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={compact ? [s.full, { paddingTop: 32, paddingBottom: 36 }] : s.full}>
        <Text style={compact ? [s.sectionLabel, { marginBottom: 14 }] : s.sectionLabel}>{txt(sectionLabel)}</Text>
        {children}
      </View>
      <PageFooter full />
    </Page>
  );
}

function PdfSubtitle({ children, compact }: { children: string; compact?: boolean }) {
  return (
    <Text
      style={{
        fontSize: T.subtitle,
        lineHeight: 1.5,
        color: c.muted,
        marginBottom: compact ? 12 : 18,
        marginTop: compact ? -8 : -12,
      }}
    >
      {txt(children)}
    </Text>
  );
}

function PdfBulletItem({ children, compact }: { children: string; compact?: boolean }) {
  return (
    <View style={{ flexDirection: "row", marginTop: compact ? 4 : 6 }}>
      <Text style={{ width: 14, fontSize: T.bulletDot, color: c.gold }}>·</Text>
      <Text style={{ fontSize: T.bullet, lineHeight: 1.48, color: c.slate700, width: 680 }}>{txt(children)}</Text>
    </View>
  );
}

function PdfAdvisoryCalloutBox({ title, body }: { title: string; body: string }) {
  return (
    <View
      style={{
        backgroundColor: c.insightBg,
        borderLeftWidth: 3,
        borderLeftColor: c.sepGold,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginTop: 14,
      }}
    >
      <Text
        style={{
          fontSize: T.label,
          fontFamily: FONT_BOLD,
          color: c.goldDark,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {txt(title)}
      </Text>
      <Text style={{ fontSize: T.body, fontFamily: FONT_SERIF, color: c.navy, lineHeight: 1.5 }}>{txt(body)}</Text>
    </View>
  );
}

function comparativeBlockShortTitle(title: string): string {
  if (title.includes("precio")) return "Mejor por precio";
  if (title.includes("seguridad")) return "Más segura";
  if (title.includes("validación")) return "Requiere validación";
  if (title.includes("sólida")) return "Escuela más sólida";
  return title;
}

function PdfAdvisoryGridCell({ block, width }: { block: AdvisoryBlock | null; width: number }) {
  if (!block) return <View style={{ width }} />;

  return (
    <View
      style={{
        width,
        backgroundColor: c.cardBg,
        borderTopWidth: 0.5,
        borderRightWidth: 0.5,
        borderBottomWidth: 0.5,
        borderLeftWidth: 0.5,
        borderTopColor: c.cardBorder,
        borderRightColor: c.cardBorder,
        borderBottomColor: c.cardBorder,
        borderLeftColor: c.cardBorder,
        paddingVertical: 14,
        paddingHorizontal: 14,
        minHeight: 128,
      }}
    >
      <Text
        style={{
          fontSize: T.label,
          fontFamily: FONT_BOLD,
          color: c.goldDark,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {txt(comparativeBlockShortTitle(block.title))}
      </Text>
      <Text
        style={{
          fontFamily: FONT_SERIF_BOLD,
          fontSize: 13,
          color: c.navy,
          marginTop: 8,
          lineHeight: 1.25,
        }}
      >
        {txt(block.schoolName)}
      </Text>
      {block.reasons.slice(0, 3).map((reason) => (
        <Text key={reason} style={{ fontSize: T.bullet, color: c.slate700, marginTop: 5, lineHeight: 1.4 }}>
          · {txt(reason)}
        </Text>
      ))}
    </View>
  );
}

function PdfComparativeGrid({ blocks, innerWidth }: { blocks: AdvisoryBlock[]; innerWidth: number }) {
  const gap = 12;
  const cellWidth = (innerWidth - gap) / 2;
  const slots: (AdvisoryBlock | null)[] = [blocks[0] ?? null, blocks[1] ?? null, blocks[2] ?? null, blocks[3] ?? null];

  return (
    <View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: gap }}>
        <PdfAdvisoryGridCell block={slots[0]} width={cellWidth} />
        <PdfAdvisoryGridCell block={slots[1]} width={cellWidth} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <PdfAdvisoryGridCell block={slots[2]} width={cellWidth} />
        <PdfAdvisoryGridCell block={slots[3]} width={cellWidth} />
      </View>
    </View>
  );
}

function PdfValidationExecutiveCard({ block, width }: { block: SchoolValidationBlock; width: number }) {
  const items = block.shortItems.length > 0 ? block.shortItems : ["Documentación base"];

  return (
    <View
      style={{
        width,
        backgroundColor: c.cardBg,
        borderTopWidth: 0.5,
        borderRightWidth: 0.5,
        borderBottomWidth: 0.5,
        borderLeftWidth: 3,
        borderTopColor: c.cardBorder,
        borderRightColor: c.cardBorder,
        borderBottomColor: c.cardBorder,
        borderLeftColor: c.sepGold,
        paddingVertical: 16,
        paddingHorizontal: 14,
        minHeight: 120,
      }}
    >
      <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 13, color: c.navy, lineHeight: 1.2 }}>
        {txt(block.schoolName)}
      </Text>
      <Text
        style={{
          fontSize: T.label,
          color: c.muted,
          letterSpacing: 1,
          textTransform: "uppercase",
          marginTop: 10,
          marginBottom: 8,
        }}
      >
        Validar antes de pagar
      </Text>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: "row", marginTop: 4 }}>
          <Text style={{ width: 14, fontSize: T.bullet, color: c.gold }}>✓</Text>
          <Text style={{ fontSize: T.bullet, color: c.slate700, lineHeight: 1.35, flex: 1 }}>{txt(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function PdfValidationExecutiveGrid({ blocks }: { blocks: SchoolValidationBlock[] }) {
  const pageInner = PAGE_W - 80;
  const gap = 14;
  const cardWidth = (pageInner - gap) / 2;
  const rows: SchoolValidationBlock[][] = [];
  for (let i = 0; i < blocks.length; i += 2) {
    rows.push(blocks.slice(i, i + 2));
  }

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View
          key={`validation-row-${rowIndex}`}
          style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: rowIndex < rows.length - 1 ? gap : 0 }}
        >
          {row.map((block) => (
            <PdfValidationExecutiveCard key={block.schoolName} block={block} width={cardWidth} />
          ))}
          {row.length === 1 ? <View style={{ width: cardWidth }} /> : null}
        </View>
      ))}
    </View>
  );
}

function PdfSchoolCard({
  school,
  bestSchoolName,
}: {
  school: ReportSnapshotSchoolSummaryItem;
  bestSchoolName: string | null;
}) {
  const loc = [school.ciudad, school.pais].filter(Boolean).join(" · ");
  const action = schoolRecommendedAction(school, bestSchoolName);
  const showAction = action && !/^Cerrar pendientes:/i.test(action);

  return (
    <View style={{ borderTopWidth: 0.5, borderTopColor: c.sepDivider, paddingTop: 14, marginTop: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: 14, maxWidth: 300 }}>
          <Text style={{ fontFamily: FONT_SERIF, fontSize: 15, lineHeight: 1.25 }}>{txt(school.nombre)}</Text>
          <Text style={{ fontSize: T.bodySm, color: c.muted, marginTop: 4, lineHeight: 1.35 }}>
            {txt(loc)} · {txt(programaLabel(school.programa))}
          </Text>
        </View>
        <Text style={{ fontFamily: FONT_SERIF, fontSize: 16, color: c.navy, minWidth: 72, textAlign: "right" }}>
          {formatEuro(school.precioAnunciado)}
        </Text>
      </View>
      <Text style={{ fontSize: T.bodySm, marginTop: 10 }}>
        <Text style={{ fontSize: T.label, color: c.muted, letterSpacing: 1, textTransform: "uppercase" }}>Verificación · </Text>
        <Text style={{ fontFamily: FONT_BOLD }}>{txt(verificacionLabel(school.estadoVerificacion))}</Text>
      </Text>
      <Text style={{ fontSize: T.bodySm, lineHeight: 1.45, color: c.slate700, marginTop: 8 }}>
        <Text style={{ fontFamily: FONT_BOLD, color: c.navy }}>Pendientes · </Text>
        {school.pendientes.length > 0
          ? txt(school.pendientes.slice(0, 3).join(" · "))
          : "Documentación base completa"}
      </Text>
      {showAction ? (
        <Text style={{ fontSize: T.bodySm, color: c.goldDark, marginTop: 10, lineHeight: 1.4 }}>{txt(action)}</Text>
      ) : null}
    </View>
  );
}

function SplitPage({
  imageSrc,
  imageLeft,
  ratio50,
  alignTop,
  sectionLabel,
  children,
}: {
  imageSrc: string | null;
  imageLeft: boolean;
  ratio50?: boolean;
  alignTop?: boolean;
  sectionLabel?: string;
  children: ReactNode;
}) {
  const contentStyle = ratio50 ? s.content50 : alignTop ? s.content40Top : s.content40;
  const image = <SideImage src={imageSrc} wide={ratio50} />;
  const content = (
    <View style={contentStyle}>
      {sectionLabel ? (
        <Text style={alignTop ? { ...s.sectionLabel, marginBottom: 14 } : s.sectionLabel}>{txt(sectionLabel)}</Text>
      ) : null}
      {children}
    </View>
  );
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.row}>
        {imageLeft ? image : content}
        {imageLeft ? content : image}
      </View>
      <PageFooter />
    </Page>
  );
}

function riskLevelDot(nivel: string): string {
  if (nivel === "Crítico") return "#c9a454";
  if (nivel === "Alto") return "#94a3b8";
  if (nivel === "Medio") return "#d8c392";
  return "#cbd5e1";
}

/** Badges de nivel — tonos neutros, sin rosa/salmón */
function riskBadgeColors(nivel: string) {
  if (nivel === "Crítico") return { bg: "#f2edd8", text: c.goldDark };
  if (nivel === "Alto") return { bg: c.sepGray, text: "#475569" };
  if (nivel === "Medio") return { bg: c.sepBeige, text: "#6b5a3e" };
  return { bg: c.sepGray, text: "#3d5c48" };
}

function proximosPasosSectionTitle(count: number): string {
  if (count <= 0) return "Próximos pasos";
  if (count === 1) return "Próximo paso";
  return `Próximos ${count} pasos`;
}

function resolveRoutePriorityText(route: ReportSnapshotV1["routeRecommendation"]): string {
  const priority = route.warnings.find((w) => /^Prioridad:/i.test(w));
  if (priority) return formatPriorityAction(priority);
  return "Confirma contrato y calendario de pagos por escrito.";
}

/** Insight editorial ruta (PDF p.3) — copy por ruta recomendada, sin motores. */
function routePdfInsightBody(recommended: string): string {
  const route = txt(recommended).trim();
  if (route === "Modular") {
    return "La ruta modular reduce exposición financiera porque permite avanzar por fases y validar cada pago antes de comprometer el siguiente.";
  }
  if (route === "Integrada") {
    return "La ruta integrada concentra la formación en un solo itinerario; valida contrato, extras y calendario de pagos antes de comprometer el importe total.";
  }
  return "La fase de preparación acota el riesgo inicial; úsala para confirmar financiación y documentación antes de escalar inversión.";
}

function riskLevelRankPdf(nivel: string): number {
  if (nivel === "Crítico") return 4;
  if (nivel === "Alto") return 3;
  if (nivel === "Medio") return 2;
  return 1;
}

function resolvePrincipalRiskItem(
  items: ReportSnapshotV1["risks"]["items"],
  highestLevel: string,
): ReportSnapshotV1["risks"]["items"][number] | null {
  if (items.length === 0) return null;
  const atLevel = items.filter((r) => r.nivel === highestLevel);
  const pool = atLevel.length > 0 ? atLevel : items;
  return [...pool].sort((a, b) => riskLevelRankPdf(b.nivel) - riskLevelRankPdf(a.nivel))[0] ?? null;
}

function riskPrincipalDisplayTitle(label: string): string {
  const raw = txt(label).trim();
  const lower = raw.toLowerCase();
  if (lower.includes("marketing") || lower.includes("promesas")) {
    return "Marketing y promesas comerciales";
  }
  if (lower.includes("médico") || lower.includes("medico")) return "Riesgo médico";
  if (lower.includes("financiero")) return "Riesgo financiero";
  if (lower.includes("inglés") || lower.includes("ingles")) return "Riesgo de inglés";
  if (lower.includes("documental")) return "Riesgo documental";
  if (lower.includes("timing") || lower.includes("calendario")) return "Riesgo de calendario";
  return raw;
}

function principalRiskHeroBody(risk: ReportSnapshotV1["risks"]["items"][number]): string {
  const accion = risk.accion?.trim();
  if (accion) return accion;
  return risk.explicacion;
}

function RiskGridCard({
  label,
  nivel,
  explicacion,
}: {
  label: string;
  nivel: string;
  explicacion: string;
}) {
  const badge = riskBadgeColors(nivel);
  const dot = riskLevelDot(nivel);
  return (
    <View style={s.riskCard}>
      <View style={s.riskCardTopRow}>
        <View style={s.riskCardTitleRow}>
          <View style={[s.riskCardDot, { backgroundColor: dot }]} />
          <Text style={s.riskCardTitle}>{txt(label)}</Text>
        </View>
        <Text style={[s.riskCardBadge, { backgroundColor: badge.bg, color: badge.text }]}>{txt(nivel)}</Text>
      </View>
      <Text style={s.riskCardBody}>{txt(explicacion)}</Text>
    </View>
  );
}

/* —— Página 1: ReportCover + FullBleedCover (50/50) —— */
function PdfCoverPage({ snapshot, assets }: { snapshot: ReportSnapshotV1; assets: PremiumPdfAssets }) {
  const displayName = snapshot.profile.nombre.trim() || "Aspirante a piloto";
  const route = snapshot.routeRecommendation;

  return (
    <SplitPage imageSrc={assets.images.cover} imageLeft ratio50>
      <View>
        <Text>
          <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 29, color: c.navy }}>Fly</Text>
          <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 29, color: c.gold }}>Path</Text>
        </Text>
        <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 29, color: c.navy, marginTop: 24, lineHeight: 1.08 }}>
          Briefing de decisión
        </Text>
        <Text style={{ fontSize: 12, color: c.muted, marginTop: 12 }}>Antes de comprometer pagos o elegir escuela</Text>

        <View
          style={{
            borderTopWidth: 0.5,
            borderTopColor: c.sepDivider,
            borderBottomWidth: 0.5,
            borderBottomColor: c.sepDivider,
            paddingVertical: 20,
            marginTop: 24,
          }}
        >
          <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 2, textTransform: "uppercase" }}>
            Preparado para
          </Text>
          <Text style={{ fontFamily: FONT_SERIF, fontSize: 24, color: c.navy, marginTop: 6, lineHeight: 1.15 }}>
            {txt(displayName)}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 20 }}>
            <View style={{ width: 200, marginBottom: 12, marginRight: 16 }}>
              <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.4, textTransform: "uppercase" }}>Ruta</Text>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 12, marginTop: 3 }}>{txt(route.recommended)}</Text>
            </View>
            <View style={{ width: 200, marginBottom: 12 }}>
              <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.4, textTransform: "uppercase" }}>
                Índice de decisión
              </Text>
              <Text style={{ fontFamily: FONT_SERIF, fontSize: 22, marginTop: 3 }}>
                {snapshot.readiness.score}
                <Text style={{ fontSize: 12, color: c.mutedLight }}> /100</Text>
              </Text>
            </View>
            <View style={{ width: 200, marginBottom: 12, marginRight: 16 }}>
              <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.4, textTransform: "uppercase" }}>Riesgo</Text>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 12, marginTop: 3 }}>{txt(snapshot.risks.highestLevel)}</Text>
            </View>
            <View style={{ width: 200, marginBottom: 12 }}>
              <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.4, textTransform: "uppercase" }}>Decisión</Text>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 12, marginTop: 3 }}>
                {txt(paymentDecisionHeadline(snapshot.readiness.decision))}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <Text style={{ fontSize: 11, color: c.muted, marginRight: 32 }}>
            <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.2, textTransform: "uppercase" }}>Objetivo · </Text>
            {txt(objetivoLabel(snapshot.profile.objetivo))}
          </Text>
          <Text style={{ fontSize: 11, color: c.muted }}>
            <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.2, textTransform: "uppercase" }}>Fecha · </Text>
            {txt(snapshot.generatedAt)}
          </Text>
        </View>
      </View>
    </SplitPage>
  );
}

/* —— Página 2: ExecutiveSummary (40% img izq) —— */
function PdfExecutivePage({ snapshot, assets }: { snapshot: ReportSnapshotV1; assets: PremiumPdfAssets }) {
  const reading = buildExecutiveReading(snapshot);
  return (
    <SplitPage imageSrc={assets.images.executive} imageLeft sectionLabel="I · Lectura ejecutiva">
      <View>
        <SectionTitle>Lectura ejecutiva</SectionTitle>
        <Text style={{ fontFamily: FONT_SERIF, fontSize: 21, lineHeight: 1.28, color: c.navy }}>{txt(reading.headline)}</Text>
        <View style={{ marginTop: 28 }}>
          <InterpretationBlock title="Qué significa" body={reading.whatItMeans} first />
          <InterpretationBlock title="Qué evitar ahora" body={reading.whatToAvoid} />
          <InterpretationBlock title="Qué validar primero" body={reading.whatToValidate} />
        </View>
      </View>
    </SplitPage>
  );
}

/* —— Página 3: Ruta — layout editorial dedicado (columna izq. densa) —— */
function PdfRoutePage({ snapshot, assets }: { snapshot: ReportSnapshotV1; assets: PremiumPdfAssets }) {
  const route = snapshot.routeRecommendation;
  const max = Math.max(route.scores.integrated, route.scores.modular, route.scores.prep, 1);
  const priorityText = resolveRoutePriorityText(route);
  const barTrackW = INNER_W_40;
  const routes = [
    { label: "Integrada", score: route.scores.integrated, rec: route.recommended === "Integrada" },
    { label: "Modular", score: route.scores.modular, rec: route.recommended === "Modular" },
    { label: "Preparación", score: route.scores.prep, rec: route.recommended === "Preparación" },
  ] as const;

  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.row}>
        <View style={s.routeCol}>
          <View style={s.routeContentInner}>
            <Text style={s.routeEyebrow}>II · Ruta</Text>
            <Text style={s.routeTitle}>{txt(route.recommended)}</Text>
            <Text style={s.routeReason}>{txt(route.reason)}</Text>

            <View style={s.routePriorityHero}>
              <Text style={s.routePriorityLabel}>Prioridad · Acción ahora</Text>
              <Text style={s.routePriorityBody}>{txt(priorityText)}</Text>
            </View>

            <View style={s.routeBarsBlock}>
              {routes.map((r, idx) => {
                const fillW = Math.max(20, Math.round((r.score / max) * barTrackW));
                const isLast = idx === routes.length - 1;
                return (
                  <View key={r.label} style={isLast ? s.routeBarRowLast : s.routeBarRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                      <Text style={r.rec ? s.routeBarLabel : s.routeBarLabelMuted}>{r.label}</Text>
                      {r.rec ? (
                        <Text
                          style={{
                            fontSize: 9,
                            color: c.gold,
                            textTransform: "uppercase",
                            letterSpacing: 0.6,
                            marginLeft: 8,
                          }}
                        >
                          · Recomendada
                        </Text>
                      ) : null}
                    </View>
                    <View style={s.routeBarTrack}>
                      <View
                        style={[
                          r.rec ? s.routeBarFillGold : s.routeBarFillMuted,
                          { width: fillW },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={s.routeInsightBox}>
              <Text style={s.routeInsightLabel}>FlyPath insight</Text>
              <Text style={s.routeInsightBody}>{routePdfInsightBody(route.recommended)}</Text>
            </View>

            <Text style={s.routeBlockLine}>
              Bloqueo principal · <Text style={{ fontFamily: FONT_BOLD, color: c.navy }}>{txt(route.principalBlock)}</Text>
            </Text>
          </View>
        </View>
        <SideImage src={assets.images.route} />
      </View>
      <PageFooter />
    </Page>
  );
}

/* —— Página 4: Riesgos — grid 2 columnas × 3 filas (cards) —— */
function PdfRisksPage({ snapshot }: { snapshot: ReportSnapshotV1 }) {
  const { risks } = snapshot;
  const items = risks.items.slice(0, 6);
  const leftCol = items.filter((_, i) => i % 2 === 0);
  const rightCol = items.filter((_, i) => i % 2 === 1);
  const principal = resolvePrincipalRiskItem(risks.items, risks.highestLevel);

  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.risksPage}>
        <View style={s.risksContentStack}>
          <Text style={{ ...s.sectionLabel, marginBottom: 8 }}>III · Riesgos</Text>
          <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 24, color: c.navy, marginBottom: 12 }}>Mapa de riesgos</Text>

          {principal ? (
            <View style={s.risksPrincipalHero}>
              <Text style={s.risksPrincipalEyebrow}>Riesgo principal detectado</Text>
              <Text style={s.risksPrincipalTitle}>{riskPrincipalDisplayTitle(principal.label)}</Text>
              <Text style={s.risksPrincipalBody}>{txt(principalRiskHeroBody(principal))}</Text>
              <View style={s.risksPrincipalBadgeRow}>
                <Text style={s.risksPrincipalBadge}>{txt(principal.nivel)}</Text>
              </View>
            </View>
          ) : null}

          <View style={s.risksGridRow}>
            <View style={s.risksCol}>
              {leftCol.map((risk) => (
                <RiskGridCard
                  key={risk.label}
                  label={risk.label}
                  nivel={risk.nivel}
                  explicacion={risk.explicacion}
                />
              ))}
            </View>
            <View style={s.risksCol}>
              {rightCol.map((risk) => (
                <RiskGridCard
                  key={risk.label}
                  label={risk.label}
                  nivel={risk.nivel}
                  explicacion={risk.explicacion}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
      <PageFooter full />
    </Page>
  );
}

/* —— Página 5: FinancialOverview (40% img izq) —— */
function PdfFinancesPage({ snapshot, assets }: { snapshot: ReportSnapshotV1; assets: PremiumPdfAssets }) {
  const sum = snapshot.costs.summary;
  return (
    <SplitPage imageSrc={assets.images.finances} imageLeft alignTop sectionLabel="IV · Finanzas">
      <View>
        <SectionTitle>Panorama de inversión</SectionTitle>
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontFamily: FONT_SERIF, fontSize: 35, color: c.navy, lineHeight: 1.05 }}>
            {formatEuro(sum.totalRealista)}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 9,
            fontFamily: FONT_BOLD,
            color: c.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginTop: 2,
            marginBottom: 4,
          }}
        >
          Escenario realista
        </Text>

        <View style={{ borderLeftWidth: 3, borderLeftColor: c.sepGold, paddingLeft: 20, marginTop: 20, marginBottom: 18 }}>
          <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.8, textTransform: "uppercase" }}>Brecha financiera</Text>
          <Text style={{ fontFamily: FONT_SERIF, fontSize: 26, color: c.navy, marginTop: 4 }}>{formatEuro(sum.brechaFinanciacion)}</Text>
          <Text style={{ fontSize: 11, color: c.muted, marginTop: 4 }}>
            Cobertura {sum.coveragePct}%
            {sum.mesesCerrarBrecha > 0 ? ` · ~${sum.mesesCerrarBrecha} meses` : ""}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            borderTopWidth: 0.5,
            borderTopColor: c.sepDivider,
            borderBottomWidth: 0.5,
            borderBottomColor: c.sepDivider,
            paddingVertical: 16,
            marginBottom: 16,
          }}
        >
          {[
            { label: "Optimista", value: formatEuro(sum.totalOptimista) },
            { label: "Conservador", value: formatEuro(sum.totalConservador) },
            { label: "Margen seguridad", value: formatEuro(sum.buffer) },
          ].map((cell) => (
            <View key={cell.label} style={{ width: 128, marginRight: 6 }}>
              <Text
                style={{
                  fontSize: 9,
                  color: c.muted,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  lineHeight: 1.35,
                }}
              >
                {cell.label}
              </Text>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 11, color: c.navy, marginTop: 9, lineHeight: 1.2 }}>
                {cell.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", marginBottom: 14, width: INNER_W_40 }}>
          <View style={{ width: INNER_W_40 / 2 - 6 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: 1 }}>Formación</Text>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 11, marginTop: 6 }}>{formatEuro(sum.subtotalFormacion)}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: 1 }}>Extras</Text>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 11, marginTop: 6 }}>{formatEuro(sum.subtotalExtras)}</Text>
            </View>
          </View>
          <View style={{ width: INNER_W_40 / 2 - 6 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: 1 }}>Vida</Text>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 11, marginTop: 6 }}>{formatEuro(sum.subtotalVida)}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: c.muted, textTransform: "uppercase", letterSpacing: 1 }}>Riesgo</Text>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 11, marginTop: 6 }}>{txt(sum.riesgoFinanciero)}</Text>
            </View>
          </View>
        </View>

        <FlyPathInsightBox goldBg>
          {financialInsightMessage(sum.brechaFinanciacion, sum.coveragePct)}
        </FlyPathInsightBox>
      </View>
    </SplitPage>
  );
}

/* —— Página 6: ActionPlan (reverse 40%) —— */
function PdfActionPage({ snapshot, assets }: { snapshot: ReportSnapshotV1; assets: PremiumPdfAssets }) {
  const { roadmap, readiness } = snapshot;
  const phases = [
    { days: "7", hint: "Inmediato", items: roadmap.sevenDays },
    { days: "30", hint: "Consolidar", items: roadmap.thirtyDays },
    { days: "90", hint: "Trimestre", items: roadmap.ninetyDays },
  ] as const;
  const steps = readiness.proximosPasos.slice(0, 3);
  const proximosTitle = proximosPasosSectionTitle(steps.length);

  return (
    <SplitPage imageSrc={assets.images.action} imageLeft={false} sectionLabel="V · Plan de acción">
      <View>
        <SectionTitle>Hoja de ruta</SectionTitle>
        {phases.map((ph, i) => (
          <View key={ph.days} style={{ marginBottom: i < 2 ? 26 : 0 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontFamily: FONT_SERIF, fontSize: 20, color: c.gold, width: 88 }}>
                <Text>{ph.days} </Text>
                <Text style={{ fontSize: 15 }}>días</Text>
              </Text>
              <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.4, textTransform: "uppercase", marginLeft: 4 }}>
                {ph.hint}
              </Text>
            </View>
            <View style={{ borderLeftWidth: 1, borderLeftColor: c.sepBeige, paddingLeft: 20, marginTop: 12, marginLeft: 4 }}>
              {(ph.items.length ? ph.items.slice(0, 2) : ["—"]).map((item) => (
                <Text key={item} style={{ fontSize: 11, lineHeight: 1.5, color: c.navy, marginBottom: 10 }}>
                  {txt(item)}
                </Text>
              ))}
            </View>
          </View>
        ))}
        {steps.length > 0 ? (
          <View style={{ paddingTop: 18, marginTop: 6 }}>
            <Text style={{ fontSize: 9, fontFamily: FONT_BOLD, color: c.muted, letterSpacing: 2.2, textTransform: "uppercase" }}>
              {proximosTitle}
            </Text>
            {steps.map((step, i) => (
              <View key={step} style={{ flexDirection: "row", marginTop: i === 0 ? 12 : 10 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: c.navy,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: FONT_BOLD, color: c.cream }}>{i + 1}</Text>
                </View>
                <Text style={{ fontSize: 11, lineHeight: 1.5, color: c.slate700, width: 380, paddingTop: 5 }}>
                  {txt(step)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </SplitPage>
  );
}

/* —— Páginas VI: SchoolsOverview (máx. 3 escuelas/página) —— */
function PdfSchoolsEmptyState({ schoolsUrl }: { schoolsUrl: string }) {
  return (
    <View>
      <SectionTitle>Comparativa documental</SectionTitle>
      <View
        style={{
          backgroundColor: c.insightBg,
          borderLeftWidth: 3,
          borderLeftColor: c.sepGold,
          paddingVertical: 24,
          paddingHorizontal: 22,
          marginTop: 8,
        }}
      >
        <Text style={{ fontFamily: FONT_SERIF, fontSize: 20, color: c.navy, marginBottom: 10 }}>
          Aún no hay escuelas comparadas
        </Text>
        <Text style={{ fontSize: 12, color: c.navy, lineHeight: 1.5, marginBottom: 18 }}>
          Añade al menos 2 escuelas para desbloquear la comparativa documental.
        </Text>
        <Link
          src={schoolsUrl}
          style={{
            backgroundColor: c.gold,
            paddingVertical: 10,
            paddingHorizontal: 18,
            alignSelf: "flex-start",
            marginBottom: 20,
          }}
        >
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 11.5, color: c.navy }}>Añadir escuelas al comparador</Text>
        </Link>
        {["Contrato y condiciones por escrito", "Calendario de pagos confirmado", "Política de reembolso y extras incluidos"].map(
          (bullet) => (
            <View key={bullet} style={{ flexDirection: "row", marginTop: 6 }}>
              <Text style={{ width: 14, fontSize: 11, color: c.gold }}>·</Text>
              <Text style={{ fontSize: 11, color: c.muted, width: 360 }}>{bullet}</Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

function PdfSchoolsChunkPage({
  snapshot,
  assets,
  schools,
  chunkIndex,
  totalChunks,
}: {
  snapshot: ReportSnapshotV1;
  assets: PremiumPdfAssets;
  schools: ReportSnapshotSchoolSummaryItem[];
  chunkIndex: number;
  totalChunks: number;
}) {
  const { schoolsSummary } = snapshot;
  const isFirst = chunkIndex === 0;
  const isLast = chunkIndex === totalChunks - 1;
  const sectionLabel =
    totalChunks > 1 ? `VI · Escuelas (${chunkIndex + 1}/${totalChunks})` : "VI · Escuelas";

  const body = (
    <View>
      {isFirst ? (
        <SectionTitle compact>Comparativa documental</SectionTitle>
      ) : (
        <SectionTitle compact>Comparativa documental · continuación</SectionTitle>
      )}
      {schools.map((school) => (
        <PdfSchoolCard key={school.id} school={school} bestSchoolName={schoolsSummary.bestSchoolName} />
      ))}
      {isLast ? (
        <FlyPathInsightBox>
          {schoolsInsightMessage(schoolsSummary.verifiedCount, schoolsSummary.total, schoolsSummary.bestSchoolName)}
        </FlyPathInsightBox>
      ) : null}
    </View>
  );

  if (isFirst) {
    return (
      <SplitPage imageSrc={assets.images.schools} imageLeft ratio50 sectionLabel={sectionLabel}>
        {body}
      </SplitPage>
    );
  }

  return <FullContentPage sectionLabel={sectionLabel}>{body}</FullContentPage>;
}

function PdfSchoolsPages(snapshot: ReportSnapshotV1, assets: PremiumPdfAssets): ReactElement[] {
  const { schoolsSummary } = snapshot;
  const schoolsUrl = `${assets.origin}/schools`;

  if (schoolsSummary.total === 0 || schoolsSummary.items.length === 0) {
    return [
      <SplitPage key="schools-empty" imageSrc={assets.images.schools} imageLeft ratio50 sectionLabel="VI · Escuelas">
        <PdfSchoolsEmptyState schoolsUrl={schoolsUrl} />
      </SplitPage>,
    ];
  }

  const chunks = chunkItems(schoolsSummary.items, PREMIUM_SCHOOLS_PER_PAGE);
  return chunks.map((schools, index) => (
    <PdfSchoolsChunkPage
      key={`schools-${index}`}
      snapshot={snapshot}
      assets={assets}
      schools={schools}
      chunkIndex={index}
      totalChunks={chunks.length}
    />
  ));
}

/* —— VIII · Análisis comparativo FlyPath —— */
function PdfComparativePage({ snapshot, assets }: { snapshot: ReportSnapshotV1; assets: PremiumPdfAssets }) {
  const advisory = buildComparativeAdvisory(snapshot);
  const blocks = [advisory.mostSolid, advisory.bestPrice, advisory.bestSecurity, advisory.needsValidation].filter(
    Boolean,
  ) as AdvisoryBlock[];

  return (
    <SplitPage imageSrc={assets.images.executive} imageLeft={false} alignTop sectionLabel="VIII · Análisis comparativo FlyPath">
      <View>
        <SectionTitle compact>Análisis comparativo FlyPath</SectionTitle>
        <PdfSubtitle compact>Interpretación FlyPath — lectura rápida por escenario.</PdfSubtitle>
        {blocks.length > 0 ? (
          <PdfComparativeGrid blocks={blocks} innerWidth={INNER_W_40} />
        ) : (
          <FlyPathInsightBox>
            Añade escuelas al comparador para recibir el análisis comparativo FlyPath personalizado.
          </FlyPathInsightBox>
        )}
      </View>
    </SplitPage>
  );
}

function PdfValidationChunkPage({
  snapshot,
  blocks,
  chunkIndex,
  totalChunks,
}: {
  snapshot: ReportSnapshotV1;
  blocks: SchoolValidationBlock[];
  chunkIndex: number;
  totalChunks: number;
}) {
  const sectionLabel =
    totalChunks > 1
      ? `IX · Validaciones pendientes (${chunkIndex + 1}/${totalChunks})`
      : "IX · Validaciones pendientes";

  return (
    <FullContentPage sectionLabel={sectionLabel} compact>
      {chunkIndex === 0 ? (
        <>
          <SectionTitle compact>Validaciones pendientes por escuela</SectionTitle>
          <PdfSubtitle compact>Qué pedir por escrito antes de transferir dinero o reservar plaza.</PdfSubtitle>
        </>
      ) : (
        <SectionTitle compact>Validaciones pendientes · continuación</SectionTitle>
      )}
      <PdfValidationExecutiveGrid blocks={blocks} />
      {chunkIndex === totalChunks - 1 ? (
        <PdfAdvisoryCalloutBox
          title="Prioridad de validación"
          body={buildValidationPriorityMessage(snapshot)}
        />
      ) : null}
    </FullContentPage>
  );
}

function PdfValidationPages(snapshot: ReportSnapshotV1): ReactElement[] {
  const blocks = buildValidationBlocks(snapshot);
  if (blocks.length === 0) {
    return [
      <FullContentPage key="validation-empty" sectionLabel="IX · Validaciones pendientes" compact>
        <SectionTitle compact>Validaciones pendientes por escuela</SectionTitle>
        <PdfSubtitle compact>Qué pedir por escrito antes de transferir dinero o reservar plaza.</PdfSubtitle>
        <FlyPathInsightBox>
          Cuando añadas escuelas al comparador, generaremos aquí la lista de confirmaciones específicas para cada una.
        </FlyPathInsightBox>
      </FullContentPage>,
    ];
  }

  const chunks = chunkValidationBlocks(blocks);
  return chunks.map((chunk, index) => (
    <PdfValidationChunkPage
      key={`validation-${index}`}
      snapshot={snapshot}
      blocks={chunk}
      chunkIndex={index}
      totalChunks={chunks.length}
    />
  ));
}

/* —— X · Qué haríamos en tu situación —— */
function PdfInformedDecisionPage({ snapshot, assets }: { snapshot: ReportSnapshotV1; assets: PremiumPdfAssets }) {
  const decision = buildInformedDecisionAdvisory(snapshot);

  return (
    <SplitPage imageSrc={assets.images.route} imageLeft alignTop sectionLabel="X · Qué haríamos en tu situación">
      <View>
        <SectionTitle>Qué haríamos en tu situación</SectionTitle>
        <PdfSubtitle>Decisiones y acciones concretas para esta semana.</PdfSubtitle>

        <Text
          style={{
            fontSize: T.label,
            fontFamily: FONT_BOLD,
            color: c.goldDark,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          Qué evitaríamos
        </Text>
        {decision.avoid.map((item) => (
          <PdfBulletItem key={item}>{item}</PdfBulletItem>
        ))}

        <Text
          style={{
            fontSize: T.label,
            fontFamily: FONT_BOLD,
            color: c.goldDark,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            marginTop: 18,
          }}
        >
          Lo que haríamos esta semana
        </Text>
        {decision.thisWeek.map((item, index) => (
          <View key={item} style={{ flexDirection: "row", marginTop: 8 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: c.navy,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: T.number, fontFamily: FONT_BOLD, color: c.cream }}>{index + 1}</Text>
            </View>
            <Text style={{ fontSize: T.body, lineHeight: 1.5, color: c.slate700, width: 360, paddingTop: 4 }}>
              {txt(item)}
            </Text>
          </View>
        ))}

        <PdfAdvisoryCalloutBox title="Decisión práctica" body={decision.practicalDecision} />
      </View>
    </SplitPage>
  );
}

function PdfPartnerDiscountBadge() {
  return (
    <View
      style={{
        marginTop: 18,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderTopWidth: 0.5,
        borderRightWidth: 0.5,
        borderBottomWidth: 0.5,
        borderLeftWidth: 0.5,
        borderTopColor: c.sepGold,
        borderRightColor: c.sepGold,
        borderBottomColor: c.sepGold,
        borderLeftColor: c.sepGold,
        backgroundColor: "rgba(247, 244, 238, 0.12)",
        alignSelf: "flex-start",
        maxWidth: 340,
      }}
    >
      <Text
        style={{
          fontSize: T.label,
          fontFamily: FONT_BOLD,
          color: c.gold,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        20% de descuento incluido
      </Text>
      <Text style={{ fontSize: T.bodySm, color: c.cream, marginTop: 5 }}>
        Código: {FLYPATH_PARTNER_DISCOUNT_CODE}
      </Text>
      <Text style={{ fontSize: T.bodySm, color: c.white80, marginTop: 3, lineHeight: 1.4 }}>
        Aplicable a tu siguiente paso recomendado.
      </Text>
    </View>
  );
}

/* —— XI · Cierre / mentoría —— */
function PdfClosePage({ snapshot, assets }: { snapshot: ReportSnapshotV1; assets: PremiumPdfAssets }) {
  const { flypathNextStep, readiness } = snapshot;
  const primaryHref = productLink(assets.origin, flypathNextStep.primaryId);
  const showPartnerDiscount = isFlyPathPartnerDiscountEligible(flypathNextStep.primaryId);

  const ctaContent = (
    <View>
      <Text style={{ fontFamily: FONT_BOLD, fontSize: 12, color: c.navy }}>{txt(flypathNextStep.primary.cta)}</Text>
      {showPartnerDiscount ? (
        <Text style={{ fontSize: 9, fontFamily: FONT_BOLD, color: c.navy, marginTop: 3, letterSpacing: 0.6 }}>
          Código {FLYPATH_PARTNER_DISCOUNT_CODE}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SplitPage imageSrc={assets.images.close} imageLeft={false} alignTop sectionLabel="XI · Cierre">
      <View>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontFamily: FONT_SERIF_BOLD, fontSize: 22, color: c.navy, lineHeight: 1.15 }}>
            Siguiente paso recomendado
          </Text>
        </View>
        <View style={{ backgroundColor: c.navy, paddingVertical: 26, paddingHorizontal: 28 }}>
          <Text style={{ fontFamily: FONT_SERIF, fontSize: 20, color: c.cream, lineHeight: 1.2 }}>{txt(flypathNextStep.primary.title)}</Text>
          <Text style={{ fontSize: 11, lineHeight: 1.52, color: c.white80, marginTop: 12 }}>{txt(flypathNextStep.primary.body)}</Text>
          {showPartnerDiscount ? <PdfPartnerDiscountBadge /> : null}
          {primaryHref ? (
            <Link
              src={primaryHref}
              style={{
                backgroundColor: c.gold,
                paddingVertical: 10,
                paddingHorizontal: 20,
                marginTop: showPartnerDiscount ? 16 : 24,
                alignSelf: "flex-start",
              }}
            >
              {ctaContent}
            </Link>
          ) : (
            <View
              style={{
                backgroundColor: c.gold,
                paddingVertical: 10,
                paddingHorizontal: 20,
                marginTop: showPartnerDiscount ? 16 : 24,
                alignSelf: "flex-start",
              }}
            >
              {ctaContent}
            </View>
          )}
        </View>

        {flypathNextStep.secondaryIds.length > 0 ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.4, textTransform: "uppercase" }}>También útil</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
              {flypathNextStep.secondaryIds.map((id) => {
                const href = productLink(assets.origin, id);
                const label = flypathSecondaryProductLabel(id);
                return href ? (
                  <Link key={id} src={href} style={{ fontSize: 11, color: c.navy, textDecoration: "underline", marginRight: 16, marginBottom: 6 }}>
                    {label}
                  </Link>
                ) : (
                  <Text key={id} style={{ fontSize: 11, color: c.muted, marginRight: 16 }}>
                    {label}
                  </Text>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={{ borderTopWidth: 0.5, borderTopColor: c.sepDivider, paddingTop: 24, marginTop: 24 }}>
          <Text style={{ fontSize: 9, color: c.muted, letterSpacing: 1.6, textTransform: "uppercase" }}>Decisión de pago</Text>
          <Text style={{ fontFamily: FONT_SERIF, fontSize: 20, color: c.navy, marginTop: 4 }}>{txt(paymentDecisionHeadline(readiness.decision))}</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.48, color: c.muted, marginTop: 16 }}>{txt(snapshot.disclaimer)}</Text>
        </View>
      </View>
    </SplitPage>
  );
}

export function PremiumReportDocument({
  snapshot,
  assets,
}: {
  snapshot: ReportSnapshotV1;
  assets: PremiumPdfAssets;
}): ReactElement {
  const schoolPages = PdfSchoolsPages(snapshot, assets);
  const validationPages = PdfValidationPages(snapshot);

  return (
    <Document>
      <PdfCoverPage snapshot={snapshot} assets={assets} />
      <PdfExecutivePage snapshot={snapshot} assets={assets} />
      <PdfRoutePage snapshot={snapshot} assets={assets} />
      <PdfRisksPage snapshot={snapshot} />
      <PdfFinancesPage snapshot={snapshot} assets={assets} />
      <PdfActionPage snapshot={snapshot} assets={assets} />
      {schoolPages}
      <PdfComparativePage snapshot={snapshot} assets={assets} />
      {validationPages}
      <PdfInformedDecisionPage snapshot={snapshot} assets={assets} />
      <PdfClosePage snapshot={snapshot} assets={assets} />
    </Document>
  );
}

export function buildPremiumCareerReportPdfFilename(snapshot: ReportSnapshotV1): string {
  const raw = snapshot.profile.nombre.trim();
  const slug = raw
    ? raw
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48)
    : "informe";
  return `flypath-career-report-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

function emptyPremiumPdfAssets(origin = ""): PremiumPdfAssets {
  const images = {} as PremiumPdfAssets["images"];
  for (const key of Object.keys(PREMIUM_PDF_PAGE_IMAGES) as (keyof typeof PREMIUM_PDF_PAGE_IMAGES)[]) {
    images[key] = null;
  }
  return { origin, images };
}

function normalizePremiumPdfAssets(assets: PremiumPdfAssets): PremiumPdfAssets {
  const origin = assets.origin?.replace(/\/$/, "") ?? "";
  const fallback = emptyPremiumPdfAssets(origin);
  return {
    origin,
    images: { ...fallback.images, ...assets.images },
  };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Genera el Blob con la API pública de @react-pdf/renderer.
 * En React 19 el commit puede ser asíncrono: hay que esperar el evento `change`
 * antes de `toBlob()` (mismo patrón que usePDF / BlobProvider).
 */
export async function renderPremiumCareerReportPdfToBlob(
  snapshot: ReportSnapshotV1,
  assets: PremiumPdfAssets,
): Promise<Blob> {
  const element = <PremiumReportDocument snapshot={snapshot} assets={normalizePremiumPdfAssets(assets)} />;

  return new Promise<Blob>((resolve, reject) => {
    const instance = pdf();
    let settled = false;

    const finish = async () => {
      if (settled) return;
      if (!instance.container.document) return;
      settled = true;
      instance.removeListener("change", onChange);
      try {
        const blob = await instance.toBlob();
        if (!blob?.size) {
          reject(new Error("FlyPath PDF: archivo generado vacío."));
          return;
        }
        resolve(blob);
      } catch (err) {
        reject(err);
      }
    };

    const onChange = () => {
      void finish();
    };

    instance.on("change", onChange);
    instance.updateContainer(element);

    queueMicrotask(() => {
      void finish();
    });

    window.setTimeout(() => {
      if (!settled) {
        instance.removeListener("change", onChange);
        reject(
          new Error(
            instance.container.document
              ? "FlyPath PDF: timeout al renderizar."
              : "FlyPath PDF: no se montó el documento (Document inválido o null).",
          ),
        );
      }
    }, 30_000);
  });
}

export async function downloadPremiumCareerReportPdf(
  snapshot: ReportSnapshotV1 | null | undefined,
): Promise<void> {
  if (!snapshot) {
    throw new Error("Missing ReportSnapshotV1");
  }
  if (typeof window === "undefined") {
    throw new Error("FlyPath PDF: la descarga solo está disponible en el navegador.");
  }

  const origin = window.location.origin.replace(/\/$/, "");
  let assets = emptyPremiumPdfAssets(origin);
  try {
    assets = normalizePremiumPdfAssets(await resolvePremiumPdfAssets(snapshot));
  } catch {
    assets = emptyPremiumPdfAssets(origin);
  }

  const blob = await renderPremiumCareerReportPdfToBlob(snapshot, assets);
  triggerDownload(blob, buildPremiumCareerReportPdfFilename(snapshot));
}
