"use client";

/**
 * Informe gratuito V2 — copia fiel de /free-report-preview (@react-pdf).
 */
import React, { type ReactElement } from "react";
import {
  Document,
  Font,
  Image,
  Link,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { REPORT_PAGE_IMAGES } from "@/components/report-preview/report-preview-assets";
import { flypathProductHref } from "@/components/report-preview/flypath-product-links";
import {
  FREE_REPORT_NAVY_DIVIDER,
  FREE_REPORT_VALIDATION_BODY,
  FREE_REPORT_VALIDATION_BULLETS,
  FREE_REPORT_VALIDATION_LEAD,
  FREE_REPORT_VALIDATION_TITLE,
  mapSnapshotToFreeReportData,
  type FreeReportData,
} from "@/lib/free-report-data";
import {
  PREMIUM_REPORT_CHECKOUT_CTA_LABEL,
  PREMIUM_REPORT_CHECKOUT_URL,
} from "@/lib/premium-report-checkout";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

Font.registerHyphenationCallback((word: string) => [word]);

const PAGE_W = 841.89;
const PAGE_H = 595.28;
const IMAGE_W = 421;
const CONTENT_W = PAGE_W - IMAGE_W;
const PAD_X = 44;
const PAD_Y = 48;
const PAD_BOTTOM = 44;
const INNER_W = CONTENT_W - PAD_X * 2;

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
  sepBeige: "#e7e2d8",
  sepGold: "#d8c392",
  sepGray: "#eef0f2",
  navyTint: "#f7f4ee",
  white70: "rgba(255,255,255,0.7)",
  white85: "rgba(255,255,255,0.85)",
  white65: "rgba(255,255,255,0.65)",
};

function txt(s: string): string {
  return s.replace(/\u00ad/g, "").replace(/\u200b/g, "");
}

/** Checklist premium — check vectorial dorado (sin depender de glifos de fuente). */
function PdfGoldCheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 12 12" style={s.ctaBulletIcon}>
      <Path
        d="M2 6.2 L4.6 8.8 L10 3.2"
        stroke={c.gold}
        strokeWidth={2.1}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PdfGoldCheckItem({ label }: { label: string }) {
  return (
    <View style={s.ctaBulletRow} wrap={false}>
      <PdfGoldCheckIcon />
      <View style={s.ctaBulletTextWrap}>
        <Text style={s.ctaBulletText}>{txt(label)}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { backgroundColor: c.cream, fontFamily: FONT, fontSize: 10, color: c.navy },
  row: { flexDirection: "row", width: PAGE_W, height: PAGE_H },
  imgCol: { width: IMAGE_W, height: PAGE_H, backgroundColor: c.navy },
  imgCover: { width: IMAGE_W, height: PAGE_H, objectFit: "cover" },
  contentCol: {
    width: CONTENT_W,
    height: PAGE_H,
    paddingLeft: PAD_X,
    paddingRight: PAD_X,
    paddingTop: PAD_Y,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  fullPage: {
    width: PAGE_W,
    height: PAGE_H,
    paddingLeft: 36,
    paddingRight: 36,
    paddingTop: 36,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "flex-start",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 3.2,
    color: c.gold,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  pageTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 22,
    color: c.navy,
    lineHeight: 1.12,
    marginBottom: 20,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  kpiCell: {
    width: INNER_W / 2 - 6,
    marginBottom: 14,
    marginRight: 6,
  },
  kpiLabel: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: c.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  kpiValue: {
    fontFamily: FONT_BOLD,
    fontSize: 11,
    color: c.navy,
    lineHeight: 1.25,
  },
  kpiValueSerif: {
    fontFamily: FONT_SERIF,
    fontSize: 20,
    color: c.navy,
    lineHeight: 1.1,
  },
  kpiScoreSuffix: {
    fontSize: 9,
    fontFamily: FONT,
    color: c.mutedLight,
  },
  recoBox: {
    backgroundColor: c.navyTint,
    borderLeftWidth: 4,
    borderLeftColor: c.sepGold,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 16,
    paddingRight: 14,
  },
  recoLabel: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: c.goldDark,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  recoBody: {
    fontFamily: FONT_SERIF,
    fontSize: 13.5,
    lineHeight: 1.4,
    color: c.navy,
  },
  stepRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: c.sepBeige,
    paddingBottom: 10,
    marginBottom: 10,
  },
  stepLabel: {
    width: 156,
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: c.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    paddingRight: 10,
  },
  stepValue: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.45,
    color: c.slate700,
  },
  stepValueStrong: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 12,
    color: c.navy,
    lineHeight: 1.3,
  },
  stepLevelMuted: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    color: c.muted,
  },
  schoolHint: {
    fontSize: 8.5,
    lineHeight: 1.45,
    color: c.muted,
    marginTop: 4,
  },
  ctaNavy: {
    flexDirection: "row",
    backgroundColor: c.navy,
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: "stretch",
  },
  ctaColLeft: {
    flex: 1.05,
    paddingRight: 14,
    paddingVertical: 4,
  },
  ctaColMid: {
    flex: 1.15,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: FREE_REPORT_NAVY_DIVIDER,
  },
  ctaColRight: {
    width: 162,
    paddingLeft: 14,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: FREE_REPORT_NAVY_DIVIDER,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaNavyTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 15,
    color: c.cream,
    lineHeight: 1.25,
    marginBottom: 10,
  },
  ctaBody: {
    fontSize: 9,
    lineHeight: 1.5,
    color: c.white70,
  },
  ctaBodyLead: {
    fontSize: 9,
    lineHeight: 1.5,
    color: c.white70,
    marginBottom: 8,
  },
  ctaBulletRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ctaBulletIcon: {
    width: 14,
    height: 14,
    marginRight: 10,
    flexShrink: 0,
  },
  ctaBulletTextWrap: {
    flex: 1,
  },
  ctaBulletText: {
    fontSize: 9,
    lineHeight: 1.44,
    color: c.white85,
  },
  ctaButton: {
    backgroundColor: c.gold,
    paddingVertical: 10,
    paddingHorizontal: 18,
    width: "100%",
    alignItems: "center",
  },
  ctaButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: 9,
    color: c.navy,
    textAlign: "center",
    lineHeight: 1.28,
  },
  ctaMentoria: {
    marginTop: 14,
    fontSize: 8,
    lineHeight: 1.45,
    color: c.white65,
    textAlign: "center",
  },
  ctaMentoriaLink: {
    fontFamily: FONT_BOLD,
    color: c.gold,
    textDecoration: "underline",
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: PAD_X,
    right: PAD_X,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: c.sepGray,
    paddingTop: 6,
  },
  footerFull: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: c.sepGray,
    paddingTop: 6,
  },
  footerTxt: { fontSize: 7.5, color: c.muted },
});

export const FREE_PDF_ERROR_MESSAGE =
  "No se pudo generar el informe gratuito. Inténtalo de nuevo o usa Chrome.";

export type FreePdfAssets = {
  origin: string;
  heroUrl: string | null;
};

async function probeImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    return ct.startsWith("image/") || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
  } catch {
    return false;
  }
}

export async function resolveFreePdfAssets(): Promise<FreePdfAssets> {
  const origin =
    typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const heroAbs = origin ? `${origin}${REPORT_PAGE_IMAGES.cover}` : null;
  const heroUrl = heroAbs && (await probeImageUrl(heroAbs)) ? heroAbs : null;
  return { origin, heroUrl };
}

function productLink(origin: string, productId: string): string | null {
  const href = flypathProductHref(productId);
  if (!href) return null;
  return href.startsWith("http") ? href : `${origin}${href}`;
}

function PageFooter({ full }: { full?: boolean }) {
  return (
    <View style={full ? s.footerFull : s.footer} fixed>
      <Text style={s.footerTxt}>FlyPath · Resumen ejecutivo</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function FreePdfPageOne({ data, heroUrl }: { data: FreeReportData; heroUrl: string | null }) {
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.row}>
        <View style={s.contentCol}>
          <Text style={s.eyebrow}>Informe ejecutivo</Text>
          <Text style={s.pageTitle}>Resumen de situación</Text>

          <View style={s.kpiGrid}>
            <View style={s.kpiCell}>
              <Text style={s.kpiLabel}>Ruta recomendada</Text>
              <Text style={s.kpiValue}>{txt(data.routeRecommended)}</Text>
            </View>
            <View style={s.kpiCell}>
              <Text style={s.kpiLabel}>Preparación</Text>
              <Text style={s.kpiValueSerif}>
                {data.decisionScore}
                <Text style={s.kpiScoreSuffix}> /100</Text>
              </Text>
            </View>
            <View style={s.kpiCell}>
              <Text style={s.kpiLabel}>Riesgo principal</Text>
              <Text style={s.kpiValue}>{txt(data.principalRiskLabel)}</Text>
            </View>
            <View style={s.kpiCell}>
              <Text style={s.kpiLabel}>Decisión de pago</Text>
              <Text style={s.kpiValue}>{txt(data.paymentDecision)}</Text>
            </View>
          </View>

          <View style={s.recoBox}>
            <Text style={s.recoLabel}>Recomendación FlyPath</Text>
            <Text style={s.recoBody}>{txt(data.recommendation)}</Text>
          </View>
        </View>
        <View style={s.imgCol}>
          {heroUrl ? <Image src={heroUrl} style={s.imgCover} /> : null}
        </View>
      </View>
      <PageFooter />
    </Page>
  );
}

function FreePdfPageTwo({
  data,
  assets,
}: {
  data: FreeReportData;
  assets: FreePdfAssets;
}) {
  const schoolLine = data.leadingSchool ?? "Añade escuelas al comparador para obtener una referencia";
  const checkoutHref = PREMIUM_REPORT_CHECKOUT_URL;
  const mentoriaHref = productLink(assets.origin, "mentoria");

  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.fullPage}>
        <Text style={s.eyebrow}>Siguiente paso</Text>
        <Text style={s.pageTitle}>Tu siguiente paso recomendado</Text>

        <View style={s.stepRow}>
          <Text style={s.stepLabel}>Riesgo principal detectado</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.stepValueStrong}>
              {txt(data.principalRiskLabel)}
              <Text style={s.stepLevelMuted}> · {txt(data.principalRiskLevel)}</Text>
            </Text>
          </View>
        </View>
        <View style={s.stepRow}>
          <Text style={s.stepLabel}>Brecha financiera</Text>
          <Text style={s.stepValue}>
            <Text style={{ fontFamily: FONT_BOLD, color: c.navy }}>{txt(data.financialGap)}</Text>
            {data.financialGapDetail ? (
              <Text style={{ color: c.slate700 }}> · {txt(data.financialGapDetail)}</Text>
            ) : null}
          </Text>
        </View>
        <View style={s.stepRow}>
          <Text style={s.stepLabel}>Escuela líder</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.stepValueStrong}>{txt(schoolLine)}</Text>
            {data.leadingSchoolHint ? (
              <Text style={s.schoolHint}>{txt(data.leadingSchoolHint)}</Text>
            ) : null}
          </View>
        </View>
        <View style={[s.stepRow, { borderBottomWidth: 0, marginBottom: 14 }]}>
          <Text style={s.stepLabel}>Próxima acción</Text>
          <Text style={s.stepValue}>{txt(data.nextAction)}</Text>
        </View>

        <View style={s.ctaNavy}>
          <View style={s.ctaColLeft}>
            <Text style={s.ctaNavyTitle}>{txt(FREE_REPORT_VALIDATION_TITLE)}</Text>
            <Text style={s.ctaBodyLead}>{txt(FREE_REPORT_VALIDATION_LEAD)}</Text>
            <Text style={s.ctaBody}>{txt(FREE_REPORT_VALIDATION_BODY)}</Text>
          </View>
          <View style={[s.ctaColMid, { paddingTop: 6 }]}>
            {FREE_REPORT_VALIDATION_BULLETS.map((item) => (
              <PdfGoldCheckItem key={item} label={item} />
            ))}
          </View>
          <View style={s.ctaColRight}>
            <Link src={checkoutHref} style={s.ctaButton}>
              <Text style={s.ctaButtonText}>{txt(PREMIUM_REPORT_CHECKOUT_CTA_LABEL)}</Text>
            </Link>
            <Text style={s.ctaMentoria}>
              También puedes{" "}
              {mentoriaHref ? (
                <Link src={mentoriaHref} style={s.ctaMentoriaLink}>
                  reservar una mentoría FlyPath
                </Link>
              ) : (
                <Text style={s.ctaMentoriaLink}>reservar una mentoría FlyPath</Text>
              )}
              .
            </Text>
          </View>
        </View>
      </View>
      <PageFooter full />
    </Page>
  );
}

export function FreeReportDocument({
  data,
  assets,
}: {
  data: FreeReportData;
  assets: FreePdfAssets;
}): ReactElement {
  return (
    <Document>
      <FreePdfPageOne data={data} heroUrl={assets.heroUrl} />
      <FreePdfPageTwo data={data} assets={assets} />
    </Document>
  );
}

export function buildFreeCareerReportPdfFilename(snapshot: ReportSnapshotV1): string {
  const raw = snapshot.profile.nombre.trim();
  const slug = raw
    ? raw
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48)
    : "resumen";
  return `flypath-resumen-ejecutivo-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
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

export async function renderFreeCareerReportPdfToBlob(
  snapshot: ReportSnapshotV1,
  assets: FreePdfAssets,
): Promise<Blob> {
  const data = mapSnapshotToFreeReportData(snapshot);
  const element = <FreeReportDocument data={data} assets={assets} />;

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
              : "FlyPath PDF: no se montó el documento.",
          ),
        );
      }
    }, 30_000);
  });
}

export async function downloadFreeCareerReportPdf(
  snapshot: ReportSnapshotV1 | null | undefined,
): Promise<void> {
  if (!snapshot) {
    throw new Error("Missing ReportSnapshotV1");
  }
  if (typeof window === "undefined") {
    throw new Error("FlyPath PDF: la descarga solo está disponible en el navegador.");
  }

  let assets: FreePdfAssets = { origin: "", heroUrl: null };
  try {
    assets = await resolveFreePdfAssets();
  } catch {
    assets = {
      origin: window.location.origin.replace(/\/$/, ""),
      heroUrl: null,
    };
  }

  const blob = await renderFreeCareerReportPdfToBlob(snapshot, assets);
  triggerDownload(blob, buildFreeCareerReportPdfFilename(snapshot));
}
