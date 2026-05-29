"use client";

/**
 * Informe para padres — PDF fiel a /parents-report-preview (@react-pdf).
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
import { flypathProductHref } from "@/components/report-preview/flypath-product-links";
import { REPORT_PAGE_IMAGES } from "@/components/report-preview/report-preview-assets";
import {
  PARENTS_REPORT_MENTORIA_BODY,
  PARENTS_REPORT_TRUST_LINE_1,
  PARENTS_REPORT_TRUST_LINE_2,
  mapSnapshotToParentsReportData,
  type ParentsReportData,
} from "@/lib/parents-report-data";
import type { ReportSnapshotV1 } from "@/lib/reporting/types/report-snapshot";

Font.registerHyphenationCallback((word: string) => [word]);

const PAGE_W = 841.89;
const PAGE_H = 595.28;
const IMAGE_W = 337;
const CONTENT_W = PAGE_W - IMAGE_W;
const PAD_X = 44;
const PAD_Y = 48;
const PAD_Y_TOP_COMPACT = 34;
const PAD_BOTTOM = 44;
const PAD_FULL_X = 36;
const PAD_X_PAGE3 = 40;
const INNER_W = CONTENT_W - PAD_X * 2;
const INNER_W_PAGE3 = CONTENT_W - PAD_X_PAGE3 * 2;
const INNER_FULL_W = PAGE_W - PAD_FULL_X * 2;

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
  slate600: "#475569",
  slate700: "#334155",
  sepBeige: "#e7e2d8",
  sepGold: "#d8c392",
  sepGray: "#eef0f2",
  navyTint: "#f7f4ee",
  white80: "rgba(250,248,244,0.8)",
  white75: "rgba(250,248,244,0.75)",
};

function txt(s: string): string {
  return s.replace(/\u00ad/g, "").replace(/\u200b/g, "");
}

function PdfGoldCheckIcon({ large }: { large?: boolean }) {
  const size = large ? 16 : 14;
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" style={large ? s.page2CheckIcon : s.checkIcon}>
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

function PdfChecklistItem({ label, large }: { label: string; large?: boolean }) {
  return (
    <View style={large ? s.page2CheckRow : s.checkRow} wrap={false}>
      <PdfGoldCheckIcon large={large} />
      <Text style={large ? s.page2CheckLabel : s.checkLabel}>{txt(label)}</Text>
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
  contentColTop: {
    width: CONTENT_W,
    height: PAGE_H,
    paddingLeft: PAD_X,
    paddingRight: PAD_X,
    paddingTop: PAD_Y_TOP_COMPACT,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "flex-start",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  fullPage: {
    width: PAGE_W,
    height: PAGE_H,
    paddingLeft: PAD_FULL_X,
    paddingRight: PAD_FULL_X,
    paddingTop: 36,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "flex-start",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  parentsPage2: {
    width: PAGE_W,
    height: PAGE_H,
    paddingLeft: PAD_FULL_X,
    paddingRight: PAD_FULL_X,
    paddingTop: 36,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  page2ContentStack: {
    width: INNER_FULL_W,
    /** Desplaza el bloque ~18 pt por encima del centro óptico (sin pegarlo arriba). */
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 8,
    letterSpacing: 3.2,
    color: c.gold,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  eyebrowCompact: {
    fontSize: 8,
    letterSpacing: 3.2,
    color: c.gold,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  pageTitle: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 20,
    color: c.navy,
    lineHeight: 1.15,
    marginBottom: 16,
  },
  pageTitleCompact: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 19,
    color: c.navy,
    lineHeight: 1.12,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 1.45,
    color: c.muted,
    marginTop: -8,
    marginBottom: 18,
    maxWidth: 320,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  statCell: {
    width: INNER_W / 2 - 8,
    marginRight: 8,
    marginBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: c.sepBeige,
    paddingBottom: 12,
  },
  statLabel: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: c.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FONT_BOLD,
    fontSize: 11,
    color: c.navy,
    lineHeight: 1.25,
  },
  statValueGold: {
    fontFamily: FONT_SERIF,
    fontSize: 20,
    color: c.goldDark,
    lineHeight: 1.1,
  },
  decisionBox: {
    backgroundColor: c.navyTint,
    borderLeftWidth: 4,
    borderLeftColor: c.gold,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 16,
    paddingRight: 12,
  },
  decisionLabel: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: c.goldDark,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  decisionTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 14,
    color: c.navy,
    lineHeight: 1.25,
    marginBottom: 8,
  },
  decisionHint: {
    fontSize: 10,
    lineHeight: 1.45,
    color: c.muted,
  },
  decisionDetail: {
    fontSize: 8.5,
    lineHeight: 1.4,
    color: c.slate600,
    marginTop: 8,
  },
  page2Eyebrow: {
    fontSize: 8,
    letterSpacing: 3.2,
    color: c.gold,
    textTransform: "uppercase",
    marginBottom: 28,
  },
  page2Title: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 22,
    color: c.navy,
    lineHeight: 1.14,
    marginBottom: 18,
  },
  page2Row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  page2Left: {
    flex: 1,
    paddingRight: 18,
  },
  page2Right: {
    flex: 1.28,
  },
  page2RiskBox: {
    backgroundColor: c.navy,
    borderLeftWidth: 4,
    borderLeftColor: c.gold,
    paddingVertical: 28,
    paddingHorizontal: 26,
    width: "100%",
  },
  page2RiskEyebrow: {
    fontSize: 8.5,
    fontFamily: FONT_BOLD,
    color: c.gold,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  page2RiskTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 18,
    color: c.cream,
    lineHeight: 1.22,
    marginBottom: 14,
  },
  page2RiskBody: {
    fontSize: 11,
    lineHeight: 1.48,
    color: c.white80,
  },
  page2CheckRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  page2CheckIcon: {
    width: 16,
    height: 16,
    marginRight: 13,
    flexShrink: 0,
  },
  page2CheckLabel: {
    fontSize: 12.5,
    lineHeight: 1.35,
    color: c.navy,
    flex: 1,
  },
  riskBox: {
    backgroundColor: c.navy,
    borderLeftWidth: 4,
    borderLeftColor: c.gold,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  riskEyebrow: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: c.gold,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  riskTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 16,
    color: c.cream,
    lineHeight: 1.2,
    marginBottom: 12,
  },
  riskBody: {
    fontSize: 10,
    lineHeight: 1.45,
    color: c.white80,
  },
  twoColRow: {
    flexDirection: "row",
    marginTop: 2,
    marginBottom: 14,
  },
  twoCol: {
    width: (INNER_W - 28) / 2,
    marginRight: 28,
  },
  twoColLast: {
    width: (INNER_W - 28) / 2,
  },
  colEyebrow: {
    fontSize: 8,
    fontFamily: FONT_BOLD,
    color: c.goldDark,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  colBodySerif: {
    fontFamily: FONT_SERIF,
    fontSize: 10,
    lineHeight: 1.38,
    color: c.navy,
  },
  colBodySans: {
    fontSize: 10,
    lineHeight: 1.38,
    color: c.slate700,
  },
  mentorBlock: {
    backgroundColor: c.navy,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginTop: 4,
  },
  mentorTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 14,
    color: c.cream,
    lineHeight: 1.2,
    marginBottom: 8,
  },
  mentorBody: {
    fontSize: 10,
    lineHeight: 1.38,
    color: c.white80,
    maxWidth: 420,
  },
  mentorButton: {
    backgroundColor: c.gold,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 14,
    alignSelf: "flex-start",
  },
  mentorButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    color: c.navy,
  },
  mentorTrust: {
    fontSize: 10,
    lineHeight: 1.38,
    color: c.white75,
    marginTop: 12,
    maxWidth: 420,
  },
  parentsPage3Col: {
    width: CONTENT_W,
    height: PAGE_H,
    paddingLeft: PAD_X_PAGE3,
    paddingRight: PAD_X_PAGE3,
    paddingTop: 32,
    paddingBottom: PAD_BOTTOM,
    justifyContent: "flex-start",
    borderTopWidth: 1,
    borderTopColor: c.sepGold,
  },
  page3Eyebrow: {
    fontSize: 8,
    letterSpacing: 3.2,
    color: c.gold,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  page3Title: {
    fontFamily: FONT_SERIF_BOLD,
    fontSize: 22,
    color: c.navy,
    lineHeight: 1.12,
    marginBottom: 18,
  },
  page3TwoColRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 20,
  },
  page3TwoCol: {
    width: (INNER_W_PAGE3 - 22) / 2,
    marginRight: 22,
  },
  page3TwoColLast: {
    width: (INNER_W_PAGE3 - 22) / 2,
  },
  page3ColEyebrow: {
    fontSize: 8.5,
    fontFamily: FONT_BOLD,
    color: c.goldDark,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  page3ColBody: {
    fontFamily: FONT,
    fontSize: 11.5,
    lineHeight: 1.42,
    color: c.slate700,
  },
  page3MentorBlock: {
    backgroundColor: c.navy,
    paddingVertical: 22,
    paddingHorizontal: 26,
    marginTop: 8,
    width: "100%",
  },
  page3MentorTitle: {
    fontFamily: FONT_SERIF,
    fontSize: 16,
    color: c.cream,
    lineHeight: 1.22,
    marginBottom: 10,
  },
  page3MentorBody: {
    fontSize: 11,
    lineHeight: 1.42,
    color: c.white80,
  },
  page3MentorButton: {
    backgroundColor: c.gold,
    paddingVertical: 12,
    paddingHorizontal: 26,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  page3MentorButtonText: {
    fontFamily: FONT_BOLD,
    fontSize: 11,
    color: c.navy,
  },
  page3MentorTrust: {
    fontSize: 10.5,
    lineHeight: 1.42,
    color: c.white75,
    marginTop: 14,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkIcon: {
    width: 14,
    height: 14,
    marginRight: 12,
    flexShrink: 0,
  },
  checkLabel: {
    fontSize: 11,
    lineHeight: 1.3,
    color: c.navy,
    flex: 1,
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
    left: PAD_FULL_X,
    right: PAD_FULL_X,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: c.sepGray,
    paddingTop: 6,
  },
  footerTxt: { fontSize: 7.5, color: c.muted },
});

export const PARENTS_PDF_ERROR_MESSAGE =
  "No se pudo generar el resumen para padres. Inténtalo de nuevo o usa Chrome.";

export type ParentsPdfAssets = {
  origin: string;
  closeUrl: string | null;
  executiveUrl: string | null;
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

export async function resolveParentsPdfAssets(): Promise<ParentsPdfAssets> {
  const origin =
    typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "";
  const abs = (path: string) => (origin ? `${origin}${path}` : null);
  const closeAbs = abs(REPORT_PAGE_IMAGES.close);
  const executiveAbs = abs(REPORT_PAGE_IMAGES.executive);
  const [closeOk, executiveOk] = await Promise.all([
    closeAbs ? probeImageUrl(closeAbs) : Promise.resolve(false),
    executiveAbs ? probeImageUrl(executiveAbs) : Promise.resolve(false),
  ]);
  return {
    origin,
    closeUrl: closeOk && closeAbs ? closeAbs : null,
    executiveUrl: executiveOk && executiveAbs ? executiveAbs : null,
  };
}

function mentoriaHref(origin: string): string | null {
  const href = flypathProductHref("mentoria");
  if (!href) return null;
  return href.startsWith("http") ? href : `${origin}${href}`;
}

function PageFooter({ full, studentName }: { full?: boolean; studentName?: string }) {
  const left = studentName?.trim()
    ? `FlyPath · Guía para familias · ${txt(studentName.trim())}`
    : "FlyPath · Guía para familias";
  return (
    <View style={full ? s.footerFull : s.footer} fixed>
      <Text style={s.footerTxt}>{left}</Text>
      <Text style={s.footerTxt} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function PdfPageOne({
  data,
  imageUrl,
}: {
  data: ParentsReportData;
  imageUrl: string | null;
}) {
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.row}>
        <View style={s.contentCol}>
          <Text style={s.eyebrow}>Para familias</Text>
          <Text style={s.pageTitle}>Guía para tomar una decisión segura</Text>
          <Text style={s.subtitle}>
            {txt(
              "Resumen claro para entender coste, riesgos y el momento adecuado de decisión antes de comprometer dinero con una escuela.",
            )}
          </Text>

          <View style={s.statGrid}>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Objetivo del alumno</Text>
              <Text style={s.statValue}>{txt(data.objetivo)}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Ruta recomendada</Text>
              <Text style={s.statValue}>{txt(data.routeRecommended)}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Coste estimado (realista)</Text>
              <Text style={s.statValueGold}>{txt(data.totalRealista)}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>Brecha financiera</Text>
              <Text style={s.statValue}>{txt(data.brecha)}</Text>
            </View>
          </View>

          <View style={s.decisionBox}>
            <Text style={s.decisionLabel}>Decisión actual</Text>
            <Text style={s.decisionTitle}>{txt(data.decision)}</Text>
            <Text style={s.decisionHint}>{txt(data.decisionHint)}</Text>
            {data.brechaDetail ? (
              <Text style={s.decisionDetail}>Brecha · {txt(data.brechaDetail)}</Text>
            ) : null}
          </View>
        </View>
        <View style={s.imgCol}>
          {imageUrl ? <Image src={imageUrl} style={s.imgCover} /> : null}
        </View>
      </View>
      <PageFooter studentName={data.studentName} />
    </Page>
  );
}

function PdfPageTwo({ data }: { data: ParentsReportData }) {
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.parentsPage2}>
        <View style={s.page2ContentStack}>
          <Text style={s.page2Eyebrow}>Validación familiar</Text>
          <View style={s.page2Row}>
            <View style={s.page2Left}>
              <Text style={s.page2Title}>Qué debería validar una familia antes de pagar</Text>
              <View style={{ marginTop: 6 }}>
                {data.familyChecklist.map((item) => (
                  <PdfChecklistItem key={item} label={item} large />
                ))}
              </View>
            </View>
            <View style={s.page2Right}>
              <View style={s.page2RiskBox}>
                <Text style={s.page2RiskEyebrow}>Riesgo principal detectado</Text>
                <Text style={s.page2RiskTitle}>{txt(data.principalRiskTitle)}</Text>
                <Text style={s.page2RiskBody}>{txt(data.principalRiskExplanation)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      <PageFooter full studentName={data.studentName} />
    </Page>
  );
}

function PdfPageThree({
  data,
  imageUrl,
  assets,
}: {
  data: ParentsReportData;
  imageUrl: string | null;
  assets: ParentsPdfAssets;
}) {
  const href = mentoriaHref(assets.origin);

  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <View style={s.row}>
        <View style={s.imgCol}>
          {imageUrl ? <Image src={imageUrl} style={s.imgCover} /> : null}
        </View>
        <View style={s.parentsPage3Col}>
          <Text style={s.page3Eyebrow}>Recomendación</Text>
          <Text style={s.page3Title}>Nuestra recomendación</Text>

          <View style={s.page3TwoColRow}>
            <View style={s.page3TwoCol}>
              <Text style={s.page3ColEyebrow}>Resumen ejecutivo</Text>
              <Text style={s.page3ColBody}>{txt(data.executiveSummary)}</Text>
            </View>
            <View style={s.page3TwoColLast}>
              <Text style={s.page3ColEyebrow}>Siguiente paso recomendado</Text>
              <Text style={s.page3ColBody}>{txt(data.nextStep)}</Text>
            </View>
          </View>

          <View style={s.page3MentorBlock}>
            <Text style={s.page3MentorTitle}>Mentoría familiar FlyPath</Text>
            <Text style={s.page3MentorBody}>{txt(PARENTS_REPORT_MENTORIA_BODY)}</Text>
            {href ? (
              <Link src={href} style={s.page3MentorButton}>
                <Text style={s.page3MentorButtonText}>Hablar con un piloto profesional</Text>
              </Link>
            ) : (
              <View style={s.page3MentorButton}>
                <Text style={s.page3MentorButtonText}>Hablar con un piloto profesional</Text>
              </View>
            )}
            <Text style={s.page3MentorTrust}>
              {txt(PARENTS_REPORT_TRUST_LINE_1)}
              {"\n"}
              {txt(PARENTS_REPORT_TRUST_LINE_2)}
            </Text>
          </View>
        </View>
      </View>
      <PageFooter studentName={data.studentName} />
    </Page>
  );
}

export function ParentsReportDocument({
  data,
  assets,
}: {
  data: ParentsReportData;
  assets: ParentsPdfAssets;
}): ReactElement {
  return (
    <Document>
      <PdfPageOne data={data} imageUrl={assets.closeUrl} />
      <PdfPageTwo data={data} />
      <PdfPageThree data={data} imageUrl={assets.executiveUrl} assets={assets} />
    </Document>
  );
}

export function buildParentsReportPdfFilename(snapshot: ReportSnapshotV1): string {
  const raw = snapshot.profile.nombre.trim();
  const slug = raw
    ? raw
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48)
    : "familia";
  return `flypath-guia-familias-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
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

export async function renderParentsReportPdfToBlob(
  snapshot: ReportSnapshotV1,
  assets: ParentsPdfAssets,
): Promise<Blob> {
  const data = mapSnapshotToParentsReportData(snapshot);
  const element = <ParentsReportDocument data={data} assets={assets} />;

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

export async function downloadParentsReportPdf(
  snapshot: ReportSnapshotV1 | null | undefined,
): Promise<void> {
  if (!snapshot) {
    throw new Error("Missing ReportSnapshotV1");
  }
  if (typeof window === "undefined") {
    throw new Error("FlyPath PDF: la descarga solo está disponible en el navegador.");
  }

  let assets: ParentsPdfAssets = { origin: "", closeUrl: null, executiveUrl: null };
  try {
    assets = await resolveParentsPdfAssets();
  } catch {
    assets = {
      origin: window.location.origin.replace(/\/$/, ""),
      closeUrl: null,
      executiveUrl: null,
    };
  }

  const blob = await renderParentsReportPdfToBlob(snapshot, assets);
  triggerDownload(blob, buildParentsReportPdfFilename(snapshot));
}
