import type { ReactNode } from "react";
import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

/** Desactiva guionización automática (evita cortes tipo "man￾tener", "pa￾gos"). */
Font.registerHyphenationCallback((word: string) => [word]);

const FONT = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

/** Elimina guiones blandos y zero-width que a veces provocan glifos raros en PDF. */
export function stripPdfText(s: string): string {
  return s.replace(/\u00ad/g, "").replace(/\u200b/g, "");
}

const c = {
  navy: "#0f1a33",
  navyMid: "#1a2744",
  gold: "#c9a454",
  goldMuted: "rgba(201,164,84,0.35)",
  goldSoft: "#f2ddaa",
  creamPage: "#fefdfb",
  creamCard: "#fffdf8",
  white: "#ffffff",
  text: "#0f1a33",
  muted: "#64748b",
  mutedLight: "#94a3b8",
  line: "#e5e7eb",
  panel: "#f4f6f8",
  overlay: "rgba(15,26,51,0.58)",
  goldDark: "#8a7344",
};

const ASSET_PATHS = {
  logoWhite: "/flypath-logo-white.png",
  hero: "/hero-aircraft.jpg",
  comoSer: "/como-ser-piloto-cover.jpeg",
  mentoria: "/mentoria-flypath.jpg",
  ingles: "/ingles-aeronautico.jpg",
  atpl: "/atpl-planner.jpg",
} as const;

export type PdfResolvedAssets = {
  origin: string;
  logoHeaderUrl: string | null;
  heroUrl: string | null;
  productUrl: string | null;
};

async function probeImageUrl(absUrl: string): Promise<boolean> {
  try {
    const res = await fetch(absUrl, { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    return ct.startsWith("image/") || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(absUrl);
  } catch {
    return false;
  }
}

export async function resolvePdfAssets(origin: string, productTitle: string): Promise<PdfResolvedAssets> {
  const base = origin.replace(/\/$/, "");
  const abs = (path: string) => `${base}${path}`;
  const out: PdfResolvedAssets = { origin: base, logoHeaderUrl: null, heroUrl: null, productUrl: null };
  if (!base) return out;

  if (await probeImageUrl(abs(ASSET_PATHS.logoWhite))) out.logoHeaderUrl = abs(ASSET_PATHS.logoWhite);
  if (await probeImageUrl(abs(ASSET_PATHS.hero))) out.heroUrl = abs(ASSET_PATHS.hero);

  const productMap: Record<string, keyof typeof ASSET_PATHS> = {
    "Guía Cómo ser Piloto": "comoSer",
    "Mentoría de decisión": "mentoria",
    "Inglés aeronáutico": "ingles",
    "ATPL Planner": "atpl",
  };
  const key = productMap[productTitle];
  if (key && key !== "logoWhite" && key !== "hero") {
    const p = ASSET_PATHS[key];
    if (await probeImageUrl(abs(p))) out.productUrl = abs(p);
  }
  return out;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 10,
    color: c.text,
    lineHeight: 1.48,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    backgroundColor: c.creamPage,
  },
  headerBlue: {
    backgroundColor: c.navy,
    paddingVertical: 18,
    paddingHorizontal: 44,
    marginLeft: -44,
    marginRight: -44,
    marginTop: -40,
    marginBottom: 0,
  },
  goldHairline: {
    height: 1,
    backgroundColor: c.gold,
    marginLeft: -44,
    marginRight: -44,
    opacity: 0.85,
    marginBottom: 20,
  },
  brandEyebrow: {
    color: c.goldSoft,
    fontSize: 8,
    letterSpacing: 1.6,
    textTransform: "uppercase" as const,
  },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerMeta: { color: c.mutedLight, fontSize: 8.5, textAlign: "right" as const, maxWidth: "46%", lineHeight: 1.35 },
  heroBand: {
    height: 176,
    marginLeft: -44,
    marginRight: -44,
    marginBottom: 22,
    position: "relative" as const,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.overlay,
  },
  heroContent: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, padding: 26, justifyContent: "flex-end" as const },
  heroTitle: { fontFamily: FONT_BOLD, fontSize: 24, color: c.white, letterSpacing: 0.2 },
  heroSubtitle: { fontSize: 10, color: c.goldSoft, marginTop: 8, lineHeight: 1.5, maxWidth: "92%" },
  heroFallback: {
    height: 176,
    marginLeft: -44,
    marginRight: -44,
    marginBottom: 22,
    backgroundColor: c.navyMid,
    borderBottomWidth: 1,
    borderBottomColor: c.goldMuted,
    padding: 26,
    justifyContent: "flex-end" as const,
  },
  sectionEyebrow: {
    fontSize: 8,
    letterSpacing: 2,
    color: c.goldDark,
    textTransform: "uppercase" as const,
    marginBottom: 6,
  },
  sectionTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 13,
    color: c.navy,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: c.goldMuted,
    borderBottomStyle: "solid",
  },
  card: {
    width: "100%",
    borderWidth: 0.5,
    borderColor: c.line,
    borderStyle: "solid",
    borderRadius: 2,
    padding: 14,
    backgroundColor: c.white,
    marginBottom: 10,
  },
  cardRow2: { flexDirection: "row", gap: 12, marginBottom: 10 },
  cardHalf: { width: "48%", borderWidth: 0.5, borderColor: c.line, borderRadius: 2, padding: 14, backgroundColor: c.white },
  cardGoldLeft: {
    borderLeftWidth: 3,
    borderLeftColor: c.gold,
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: c.line,
    borderRightColor: c.line,
    borderBottomColor: c.line,
    padding: 16,
    backgroundColor: c.creamCard,
  },
  labelCaps: {
    fontSize: 7.5,
    color: c.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  valueLg: { fontFamily: FONT_BOLD, fontSize: 15, color: c.navy, lineHeight: 1.2 },
  valueMd: { fontFamily: FONT_BOLD, fontSize: 11, color: c.navy, lineHeight: 1.25 },
  body: { fontSize: 10, color: c.muted, lineHeight: 1.52 },
  bodyTight: { fontSize: 10, color: c.muted, lineHeight: 1.52, marginBottom: 0 },
  criterioBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: c.panel,
    borderLeftWidth: 2,
    borderLeftColor: c.gold,
  },
  criterioLabel: { fontSize: 8, letterSpacing: 1.2, color: "#8a7344", textTransform: "uppercase" as const, marginBottom: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.line, paddingVertical: 8 },
  tableHead: { fontSize: 7.5, color: c.muted, textTransform: "uppercase" as const, letterSpacing: 0.8 },
  tableCell: { fontFamily: FONT_BOLD, fontSize: 11, color: c.navy, marginTop: 4 },
  cellThird: { width: "33.33%", paddingRight: 8 },
  cellReal: {
    width: "33.33%",
    paddingHorizontal: 8,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: c.goldMuted,
    backgroundColor: c.creamCard,
  },
  progressTrack: { height: 6, backgroundColor: c.line, borderRadius: 3, marginTop: 10 },
  progressFill: { height: 6, backgroundColor: c.gold, borderRadius: 3 },
  riskCard: {
    width: "100%",
    marginBottom: 10,
    padding: 14,
    backgroundColor: c.white,
    borderWidth: 0.5,
    borderColor: c.line,
    borderRadius: 2,
  },
  riskNivel: { fontSize: 8, letterSpacing: 0.6, color: c.muted, marginTop: 4 },
  timelineBlock: {
    width: "100%",
    marginBottom: 16,
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: c.gold,
    paddingVertical: 4,
  },
  timelineTitle: { fontFamily: FONT_BOLD, fontSize: 11, color: c.navy },
  timelineSub: { fontSize: 8.5, color: c.muted, marginTop: 3, marginBottom: 8 },
  schoolMeta: { fontSize: 9, color: c.muted, marginTop: 4 },
  ctaDark: {
    width: "100%",
    backgroundColor: c.navy,
    borderWidth: 1,
    borderColor: c.gold,
    borderRadius: 3,
    padding: 22,
    marginTop: 8,
  },
  ctaEyebrow: { fontSize: 8, letterSpacing: 2, color: c.goldSoft, textTransform: "uppercase" as const },
  ctaTitle: { fontFamily: FONT_BOLD, fontSize: 14, color: c.white, marginTop: 8 },
  ctaProduct: { fontFamily: FONT_BOLD, fontSize: 12, color: c.goldSoft, marginTop: 10 },
  ctaBody: { fontSize: 10, color: "#cbd5e1", marginTop: 8, lineHeight: 1.5 },
  ctaLine: { marginTop: 14, fontSize: 10, fontFamily: FONT_BOLD, color: c.gold },
  valoresRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  valorCol: {
    flex: 1,
    padding: 10,
    borderWidth: 0.5,
    borderColor: c.line,
    backgroundColor: c.white,
    borderRadius: 2,
  },
  valorTitle: { fontFamily: FONT_BOLD, fontSize: 8.5, color: c.navy, marginBottom: 4 },
  valorText: { fontSize: 8.5, color: c.muted, lineHeight: 1.4 },
  disclaimer: { fontSize: 7.5, color: c.mutedLight, lineHeight: 1.42, marginTop: 16 },
  footerFixed: { position: "absolute", bottom: 16, left: 44, right: 44 },
  footerLine: { height: 0.5, backgroundColor: c.gold, opacity: 0.5, marginBottom: 8 },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerTxt: { fontSize: 7.5, color: c.muted },
  numRow: { flexDirection: "row", marginBottom: 6, alignItems: "flex-start" as const },
  numCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.navy,
    marginRight: 10,
    marginTop: 1,
  },
  numCircleTxt: { fontSize: 8.5, fontFamily: FONT_BOLD, color: c.white, textAlign: "center" as const, marginTop: 3 },
  listText: { flex: 1, fontSize: 10, color: c.muted, lineHeight: 1.52, width: "100%" },
  checkRow: { flexDirection: "row", marginBottom: 7, alignItems: "flex-start" as const },
  checkMark: { fontSize: 10, color: c.gold, marginRight: 10, marginTop: 1, fontFamily: FONT_BOLD },
  decisionHint: { fontSize: 8.5, color: c.muted, marginTop: 8 },
});

export type FlyPathInformePdfInput = {
  generatedAt: string;
  nombre: string;
  routeRecommended: string;
  routeReason: string;
  principalBlock: string;
  decision: string;
  score: number;
  shouldPayNow: boolean;
  conclusionEjecutiva: string;
  totalOptimista: string;
  totalRealista: string;
  totalConservador: string;
  dineroDisponible: string;
  brecha: string;
  coverage: string;
  mesesCerrarBrecha: number;
  costEstimateNote: string;
  riskRows: { label: string; nivel: string; explicacion: string; accion: string }[];
  faltanDatos: string[];
  proximosPasos: string[];
  sevenDays: string[];
  thirtyDays: string[];
  ninetyDays: string[];
  schoolsCount: number;
  verifiedCount: number;
  pendingCount: number;
  schoolSummaries: {
    id: string;
    nombre: string;
    pais: string;
    ciudad?: string;
    precio: string;
    estado: string;
    pendientes: string;
  }[];
  nextPrimary: { title: string; body: string; cta: string };
  disclaimer: string;
};

export type FlyPathResumenPadresPdfInput = {
  generatedAt: string;
  nombre: string;
  routeRecommended: string;
  decision: string;
  shouldPayNow: boolean;
  totalRealista: string;
  brecha: string;
  riesgosSimple: string;
  faltanDatos: string[];
  sevenDays: string[];
  thirtyDays: string[];
  ninetyDays: string[];
  disclaimer: string;
};

type PrimaryId = "guia" | "mentoria" | "ingles" | "atpl";

const PRODUCTS: Record<PrimaryId, { title: string; body: string; cta: string }> = {
  guia: {
    title: "Guía Cómo ser Piloto",
    body: "Entiende el camino completo antes de hablar con escuelas: licencias, rutas, costes, tiempos y errores típicos.",
    cta: "Ver la guía",
  },
  mentoria: {
    title: "Mentoría de decisión",
    body: "Revisa tu caso, presupuesto y escuelas candidatas con un piloto profesional.",
    cta: "Reservar mentoría",
  },
  ingles: {
    title: "Inglés aeronáutico",
    body: "Trabaja inglés operativo, comunicaciones y confianza antes de avanzar a fases críticas.",
    cta: "Ver clases de inglés",
  },
  atpl: {
    title: "ATPL Planner",
    body: "Organiza asignaturas, horas semanales, repasos y exámenes con un plan realista.",
    cta: "Ver ATPL Planner",
  },
};

export function getFlyPathPrimaryProductForPdf(input: {
  class1: "si" | "no" | "reservado";
  ingles: "bajo" | "medio" | "alto";
  preocupacionIngles: "si" | "no";
  objetivo: "aerolinea" | "ejecutivo" | "instructor" | "no_lo_se";
  urgencia: "baja" | "media" | "alta";
  dineroDisponible: number;
  inversionMaxima: number;
  routeRecommended: "Integrada" | "Modular" | "Preparación";
  schoolsLength: number;
  decision: string;
  faltanDatosLength: number;
  atplTheory: number;
}): { title: string; body: string; cta: string } {
  const isInitial =
    input.class1 !== "si" || input.routeRecommended === "Preparación" || input.objetivo === "no_lo_se";
  const totallyInitial = isInitial && input.schoolsLength === 0;
  const englishFirst =
    input.ingles === "bajo" || (input.preocupacionIngles === "si" && !totallyInitial);
  const sigSchools = input.schoolsLength > 0;
  const sigUrgent = input.urgencia === "alta";
  const sigMoney = input.dineroDisponible >= 45000;
  const sigInv = input.inversionMaxima >= 90000;
  const sigData = input.faltanDatosLength >= 2;
  const sigInvestigateWithSchools =
    input.decision === "Puedes seguir investigando, pero no pagar" && sigSchools;
  const mentoriaSignalCount = [
    sigSchools,
    sigUrgent,
    sigMoney,
    sigInv,
    sigData,
    sigInvestigateWithSchools,
  ].filter(Boolean).length;
  const mentoriaWins = !isInitial && sigSchools && mentoriaSignalCount >= 2;
  const atplCandidate =
    input.class1 === "si" &&
    input.ingles !== "bajo" &&
    input.atplTheory > 0 &&
    input.objetivo !== "no_lo_se" &&
    input.routeRecommended !== "Preparación";
  const strongPaymentBlock =
    sigSchools &&
    input.decision === "No estás listo para pagar" &&
    (sigData || mentoriaSignalCount >= 3);

  let primary: PrimaryId;
  if (englishFirst) primary = "ingles";
  else if (mentoriaWins) primary = "mentoria";
  else if (atplCandidate && !strongPaymentBlock) primary = "atpl";
  else if (isInitial || input.schoolsLength === 0) primary = "guia";
  else primary = "guia";

  const p = PRODUCTS[primary];
  return { title: p.title, body: p.body, cta: p.cta };
}

function parseCoveragePct(coverageStr: string): number {
  const m = stripPdfText(coverageStr).match(/(\d+)/);
  if (!m) return 0;
  return Math.min(100, Math.max(0, parseInt(m[1], 10)));
}

function formatSchoolPending(pend: string): { shown: string; extra: number } {
  const parts = stripPdfText(pend)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 5) return { shown: parts.join(", "), extra: 0 };
  return { shown: parts.slice(0, 5).join(", "), extra: parts.length - 5 };
}

function splitRiesgosPadresParaCards(s: string): string[] {
  const t = stripPdfText(s).trim();
  if (!t) return [];
  if (!/\([^)]+\):/.test(t)) return [t];
  const parts = t.split(
    /\s+(?=Riesgo médico \(|Riesgo financiero \(|Riesgo de inglés \(|Riesgo documental \(|Comercial o promesas exageradas \(|Calendario y plazos \()/
  );
  const cleaned = parts.map((p) => p.trim()).filter(Boolean);
  if (cleaned.length <= 1) return [t];
  return cleaned.slice(0, 4);
}

function riskCardAccent(nivel: string): { bg: string; borderLeft: string } {
  const n = nivel.toLowerCase();
  if (n.includes("crít") || n.includes("crit") || n.includes("alto"))
    return { bg: "#faf8f3", borderLeft: c.gold };
  if (n.includes("medio")) return { bg: c.white, borderLeft: "#cbd5e1" };
  return { bg: c.white, borderLeft: c.line };
}

function MiniPlaneMark({ light }: { light?: boolean }) {
  const wing = light ? c.goldSoft : c.gold;
  const fuselage = light ? c.white : c.navy;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 22, height: 14, position: "relative" }}>
        <View style={{ position: "absolute", left: 0, top: 5, width: 18, height: 5, backgroundColor: fuselage, borderRadius: 2 }} />
        <View style={{ position: "absolute", left: 6, top: 2, width: 12, height: 3, backgroundColor: wing, borderRadius: 1 }} />
        <View style={{ position: "absolute", left: 6, top: 10, width: 12, height: 3, backgroundColor: wing, borderRadius: 1 }} />
      </View>
      <Text style={{ fontFamily: FONT_BOLD, fontSize: 11, color: light ? c.white : c.navy }}>FlyPath</Text>
    </View>
  );
}

function BrandHeader({ assets, right }: { assets: PdfResolvedAssets; right?: string }) {
  return (
    <View style={styles.headerBlue}>
      <View style={styles.brandRow}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {assets.logoHeaderUrl ? (
            <Image src={assets.logoHeaderUrl} style={{ width: 76, height: 24, objectFit: "contain" as const }} />
          ) : (
            <MiniPlaneMark light />
          )}
          <View style={{ borderLeftWidth: 1, borderLeftColor: "rgba(255,255,255,0.22)", paddingLeft: 12 }}>
            <Text style={styles.brandEyebrow}>Career Planner</Text>
          </View>
        </View>
        {right ? <Text style={styles.headerMeta}>{stripPdfText(right)}</Text> : <Text style={styles.headerMeta}> </Text>}
      </View>
    </View>
  );
}

function HeroBand({
  assets,
  title,
  subtitle,
}: {
  assets: PdfResolvedAssets;
  title: string;
  subtitle: string;
}) {
  if (assets.heroUrl) {
    return (
      <View style={styles.heroBand}>
        <Image
          src={assets.heroUrl}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" as const }}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{stripPdfText(title)}</Text>
          <Text style={styles.heroSubtitle}>{stripPdfText(subtitle)}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.heroFallback}>
      <Text style={styles.heroTitle}>{stripPdfText(title)}</Text>
      <Text style={styles.heroSubtitle}>{stripPdfText(subtitle)}</Text>
    </View>
  );
}

function PageFooter() {
  return (
    <View style={styles.footerFixed} fixed>
      <View style={styles.footerLine} />
      <View style={styles.footerRow}>
        <Text style={styles.footerTxt}>FlyPath Career Planner · flypath.es</Text>
        <Text style={styles.footerTxt} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </View>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, idx) => (
        <View key={`${idx}-${item.slice(0, 20)}`} style={styles.numRow} wrap={false}>
          <View style={styles.numCircle}>
            <Text style={styles.numCircleTxt}>{idx + 1}</Text>
          </View>
          <Text style={styles.listText}>{stripPdfText(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, idx) => (
        <View key={`${idx}-${item.slice(0, 24)}`} style={styles.checkRow} wrap={false}>
          <Text style={styles.checkMark}>·</Text>
          <Text style={styles.listText}>{stripPdfText(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, idx) => (
        <View key={`${idx}-${item.slice(0, 24)}`} style={styles.checkRow} wrap={false}>
          <Text style={[styles.checkMark, { fontFamily: FONT }]}>·</Text>
          <Text style={styles.listText}>{stripPdfText(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function TimelineBlock({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <View style={styles.timelineBlock}>
      <Text style={styles.timelineTitle}>{stripPdfText(title)}</Text>
      <Text style={styles.timelineSub}>{stripPdfText(subtitle)}</Text>
      {items.length ? <NumberedList items={items} /> : <Text style={styles.bodyTight}>—</Text>}
    </View>
  );
}

function InformePdfDoc({ d, assets }: { d: FlyPathInformePdfInput; assets: PdfResolvedAssets }) {
  const meta = `Generado: ${stripPdfText(d.generatedAt)}${d.nombre.trim() ? ` · ${stripPdfText(d.nombre.trim())}` : ""}`;
  const cov = parseCoveragePct(d.coverage);
  const decisionHint = d.shouldPayNow
    ? "Lectura prudente: avanza solo si contrato, precio final y condiciones están cerrados por escrito."
    : "Lectura prudente: prioriza cerrar bloqueos y datos antes de transferir dinero a una escuela.";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <BrandHeader assets={assets} right={meta} />
        <View style={styles.goldHairline} />
        <HeroBand
          assets={assets}
          title="Informe de decisión FlyPath"
          subtitle="Diagnóstico de ruta, costes, riesgos y próximos pasos antes de tomar una decisión económica."
        />

        <Text style={styles.sectionEyebrow}>Resumen</Text>
        <Text style={styles.sectionTitle}>Resumen ejecutivo</Text>

        <View style={styles.cardRow2}>
          <View style={styles.cardHalf}>
            <Text style={styles.labelCaps}>Ruta recomendada</Text>
            <Text style={styles.valueLg}>{stripPdfText(d.routeRecommended)}</Text>
          </View>
          <View style={styles.cardHalf}>
            <Text style={styles.labelCaps}>Decisión de pago</Text>
            <Text style={styles.valueMd}>{stripPdfText(d.decision)}</Text>
            <Text style={styles.decisionHint}>{decisionHint}</Text>
          </View>
        </View>
        <View style={styles.cardRow2}>
          <View style={styles.cardHalf}>
            <Text style={styles.labelCaps}>Coste realista</Text>
            <Text style={[styles.valueLg, { color: c.goldDark }]}>{stripPdfText(d.totalRealista)}</Text>
          </View>
          <View style={styles.cardHalf}>
            <Text style={styles.labelCaps}>Score de decisión</Text>
            <Text style={styles.valueLg}>{d.score}/100</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.labelCaps}>Bloqueo principal</Text>
          <Text style={styles.valueMd}>{stripPdfText(d.principalBlock)}</Text>
        </View>

        <View style={{ marginTop: 6 }}>
          <Text style={styles.sectionEyebrow}>Síntesis</Text>
          <Text style={styles.sectionTitle}>Conclusión ejecutiva</Text>
          <View style={styles.cardGoldLeft}>
            <Text style={[styles.body, { color: c.text }]}>{stripPdfText(d.conclusionEjecutiva)}</Text>
          </View>
        </View>
        <PageFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandHeader assets={assets} right="Informe de decisión · continuación" />
        <View style={styles.goldHairline} />

        <Text style={styles.sectionTitle}>Ruta recomendada</Text>
        <View style={styles.card}>
          <Text style={styles.valueLg}>{stripPdfText(d.routeRecommended)}</Text>
          <Text style={[styles.body, { marginTop: 10 }]}>
            <Text style={{ fontFamily: FONT_BOLD, color: c.navy }}>Razón. </Text>
            {stripPdfText(d.routeReason)}
          </Text>
          <Text style={styles.body}>
            <Text style={{ fontFamily: FONT_BOLD, color: c.navy }}>Bloqueo principal. </Text>
            {stripPdfText(d.principalBlock)}
          </Text>
          <View style={styles.criterioBox}>
            <Text style={styles.criterioLabel}>Criterio FlyPath</Text>
            <Text style={styles.bodyTight}>
              Antes de elegir escuela, valida primero los bloqueos que pueden cambiar toda la decisión: médico,
              financiación, documentación y condiciones por escrito.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Costes y financiación</Text>
        <View style={[styles.card, { padding: 0 }]}>
          <View style={[styles.tableRow, { paddingHorizontal: 14, paddingTop: 10 }]}>
            <View style={styles.cellThird}>
              <Text style={styles.tableHead}>Optimista</Text>
              <Text style={styles.tableCell}>{stripPdfText(d.totalOptimista)}</Text>
            </View>
            <View style={styles.cellReal}>
              <Text style={styles.tableHead}>Realista (referencia)</Text>
              <Text style={[styles.tableCell, { color: c.goldDark }]}>{stripPdfText(d.totalRealista)}</Text>
            </View>
            <View style={[styles.cellThird, { paddingLeft: 8 }]}>
              <Text style={styles.tableHead}>Conservador</Text>
              <Text style={styles.tableCell}>{stripPdfText(d.totalConservador)}</Text>
            </View>
          </View>
          <View style={{ padding: 14, paddingTop: 4 }}>
            <View style={styles.cardRow2}>
              <View style={{ width: "48%" }}>
                <Text style={styles.labelCaps}>Dinero disponible</Text>
                <Text style={styles.valueMd}>{stripPdfText(d.dineroDisponible)}</Text>
              </View>
              <View style={{ width: "48%" }}>
                <Text style={styles.labelCaps}>Dinero que falta</Text>
                <Text style={styles.valueMd}>{stripPdfText(d.brecha)}</Text>
              </View>
            </View>
            <View style={styles.cardRow2}>
              <View style={{ width: "48%" }}>
                <Text style={styles.labelCaps}>Cobertura aproximada</Text>
                <Text style={styles.valueMd}>{stripPdfText(d.coverage)}</Text>
              </View>
              <View style={{ width: "48%" }}>
                <Text style={styles.labelCaps}>Meses para cerrar brecha</Text>
                <Text style={styles.valueMd}>{d.mesesCerrarBrecha > 0 ? String(d.mesesCerrarBrecha) : "—"}</Text>
              </View>
            </View>
            <Text style={styles.labelCaps}>Cobertura sobre el escenario realista</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${cov}%` }]} />
            </View>
            <Text style={[styles.body, { marginTop: 10 }]}>{stripPdfText(d.costEstimateNote)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Riesgos principales</Text>
        {d.riskRows.map((r, idx) => {
          const acc = riskCardAccent(r.nivel);
          return (
            <View
              key={`${idx}-${r.label}`}
              style={[
                styles.riskCard,
                { backgroundColor: acc.bg, borderLeftWidth: 2, borderLeftColor: acc.borderLeft },
              ]}
            >
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 10.5, color: c.navy }}>{stripPdfText(r.label)}</Text>
              <Text style={styles.riskNivel}>Nivel: {stripPdfText(r.nivel)}</Text>
              <Text style={[styles.body, { marginTop: 6 }]}>{stripPdfText(r.explicacion)}</Text>
              <Text style={[styles.body, { marginTop: 4, marginBottom: 0 }]}>
                <Text style={{ fontFamily: FONT_BOLD, color: c.navy }}>Antes de pagar, valida esto. </Text>
                {stripPdfText(r.accion)}
              </Text>
            </View>
          );
        })}
        <PageFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandHeader assets={assets} right="Informe de decisión · continuación" />
        <View style={styles.goldHairline} />

        <Text style={styles.sectionTitle}>Datos pendientes antes de pagar</Text>
        {d.faltanDatos.length ? (
          <View style={styles.card}>
            <Checklist items={d.faltanDatos} />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.bodyTight}>Sin pendientes críticos detectados en este momento.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Plan de acción</Text>
        <TimelineBlock title="Próximos 7 días" subtitle="Prioridades inmediatas" items={d.sevenDays} />
        <TimelineBlock title="Próximos 30 días" subtitle="Consolidar información" items={d.thirtyDays} />
        <TimelineBlock title="Próximos 90 días" subtitle="Medio plazo" items={d.ninetyDays} />

        <Text style={styles.sectionTitle}>Próximos pasos del diagnóstico</Text>
        <View style={styles.card}>
          {d.proximosPasos.length ? <BulletList items={d.proximosPasos} /> : <Text style={styles.bodyTight}>—</Text>}
        </View>

        <Text style={styles.sectionTitle}>Escuelas</Text>
        <View style={styles.card}>
          <Text style={{ fontFamily: FONT_BOLD, fontSize: 10.5, color: c.navy }}>
            {d.schoolsCount} escuela{d.schoolsCount === 1 ? "" : "s"} comparada{d.schoolsCount === 1 ? "" : "s"} ·{" "}
            {d.verifiedCount} verificada{d.verifiedCount === 1 ? "" : "s"} · {d.pendingCount} pendiente
            {d.pendingCount === 1 ? "" : "s"}
          </Text>
        </View>
        {d.schoolSummaries.map((s) => {
          const { shown, extra } = formatSchoolPending(s.pendientes);
          const loc = [stripPdfText(s.pais), s.ciudad ? stripPdfText(s.ciudad) : ""].filter(Boolean).join(" · ");
          return (
            <View key={s.id} style={styles.riskCard}>
              <Text style={{ fontFamily: FONT_BOLD, fontSize: 10.5, color: c.navy }}>{stripPdfText(s.nombre)}</Text>
              <Text style={styles.schoolMeta}>{loc}</Text>
              <Text style={[styles.body, { marginTop: 4 }]}>
                Precio anunciado: <Text style={{ fontFamily: FONT_BOLD }}>{stripPdfText(s.precio)}</Text>
                {" · "}
                Estado: {stripPdfText(s.estado)}
              </Text>
              <Text style={[styles.bodyTight, { marginTop: 4 }]}>
                <Text style={{ fontFamily: FONT_BOLD, color: c.navy }}>Datos pendientes. </Text>
                {stripPdfText(shown)}
                {extra > 0 ? ` (+${extra} adicionales)` : ""}
              </Text>
            </View>
          );
        })}
        <PageFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandHeader assets={assets} right="Informe de decisión · cierre" />
        <View style={styles.goldHairline} />

        <View style={styles.ctaDark}>
          <Text style={styles.ctaEyebrow}>PROFUNDIZA CON FLYPATH</Text>
          <Text style={styles.ctaTitle}>Tu siguiente paso FlyPath</Text>
          <View style={{ flexDirection: "row", gap: 14, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaProduct}>{stripPdfText(d.nextPrimary.title)}</Text>
              <Text style={styles.ctaBody}>{stripPdfText(d.nextPrimary.body)}</Text>
              <Text style={styles.ctaLine}>{stripPdfText(d.nextPrimary.cta)}</Text>
            </View>
            {assets.productUrl ? (
              <Image
                src={assets.productUrl}
                style={{ width: 72, height: 96, borderRadius: 2, objectFit: "cover" as const }}
              />
            ) : (
              <View
                style={{
                  width: 72,
                  height: 96,
                  borderRadius: 2,
                  borderWidth: 0.5,
                  borderColor: c.gold,
                  backgroundColor: c.navyMid,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <MiniPlaneMark light />
              </View>
            )}
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>Principios</Text>
        <Text style={styles.sectionTitle}>Valores FlyPath</Text>
        <View style={styles.valoresRow}>
          <View style={styles.valorCol}>
            <Text style={styles.valorTitle}>Transparencia</Text>
            <Text style={styles.valorText}>Antes de pagar, exige por escrito qué incluye el precio y qué no.</Text>
          </View>
          <View style={styles.valorCol}>
            <Text style={styles.valorTitle}>Costes realistas</Text>
            <Text style={styles.valorText}>Evita precios gancho: valida extras, tasas y calendario de pagos.</Text>
          </View>
          <View style={styles.valorCol}>
            <Text style={styles.valorTitle}>Decisiones con datos</Text>
            <Text style={styles.valorText}>Decide con checklist y riesgos claros, no con presión comercial.</Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>{stripPdfText(d.disclaimer)}</Text>
        <PageFooter />
      </Page>
    </Document>
  );
}

function ResumenPadresPdfDoc({ d, assets }: { d: FlyPathResumenPadresPdfInput; assets: PdfResolvedAssets }) {
  const meta = `Generado: ${stripPdfText(d.generatedAt)}${d.nombre.trim() ? ` · ${stripPdfText(d.nombre.trim())}` : ""}`;
  const riesgoCards = splitRiesgosPadresParaCards(d.riesgosSimple);
  const queSignifica = d.shouldPayNow
    ? `Podéis acercaros a una decisión, siempre con contrato y condiciones claras por escrito. Decisión del planner: ${stripPdfText(d.decision)}. El resumen no sustituye leer los documentos vosotros mismos.`
    : `No conviene transferir dinero a una escuela hasta cerrar lagunas importantes. Decisión del planner: ${stripPdfText(d.decision)}. El resumen no sustituye leer los documentos vosotros mismos.`;

  const preguntas = [
    "¿Qué incluye exactamente el precio?",
    "¿Qué no está incluido?",
    "¿Hay contrato antes de pagar?",
    "¿Cuál es la política de reembolso?",
    "¿Está incluido MCC/JOC?",
    "¿Está incluido Advanced UPRT?",
    "¿Están incluidas tasas y skill tests?",
    "¿Cuál es el calendario de pagos?",
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <BrandHeader assets={assets} right={meta} />
        <View style={styles.goldHairline} />
        <HeroBand
          assets={assets}
          title="Resumen para padres"
          subtitle="Resumen sencillo para entender la situación antes de comprometer dinero con una escuela de vuelo."
        />

        <View style={styles.cardRow2}>
          <View style={styles.cardHalf}>
            <Text style={styles.labelCaps}>Ruta recomendada</Text>
            <Text style={styles.valueLg}>{stripPdfText(d.routeRecommended)}</Text>
          </View>
          <View style={styles.cardHalf}>
            <Text style={styles.labelCaps}>¿Conviene pagar ahora?</Text>
            <Text style={styles.valueMd}>
              {d.shouldPayNow ? "Solo con condiciones claras." : "No conviene pagar todavía."}
            </Text>
          </View>
        </View>
        <View style={styles.cardRow2}>
          <View style={styles.cardHalf}>
            <Text style={styles.labelCaps}>Coste realista</Text>
            <Text style={[styles.valueLg, { color: c.goldDark }]}>{stripPdfText(d.totalRealista)}</Text>
          </View>
          <View style={styles.cardHalf}>
            <Text style={styles.labelCaps}>Dinero que falta</Text>
            <Text style={styles.valueMd}>{stripPdfText(d.brecha)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Qué significa esto</Text>
        <View style={styles.cardGoldLeft}>
          <Text style={styles.body}>{queSignifica}</Text>
        </View>
        <PageFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandHeader assets={assets} right="Resumen para padres · continuación" />
        <View style={styles.goldHairline} />

        <Text style={styles.sectionTitle}>Riesgos principales</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {riesgoCards.map((block, idx) => (
            <View
              key={idx}
              style={[
                styles.riskCard,
                { width: riesgoCards.length === 1 ? "100%" : "48%" },
              ]}
            >
              <Text style={styles.bodyTight}>{stripPdfText(block)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Qué falta confirmar antes de pagar</Text>
        <View style={styles.card}>
          {d.faltanDatos.length ? <Checklist items={d.faltanDatos} /> : (
            <Text style={styles.bodyTight}>Nada crítico detectado; pedid siempre condiciones por escrito.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Preguntas clave para una escuela</Text>
        <View style={styles.card}>
          <NumberedList items={preguntas} />
        </View>
        <PageFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <BrandHeader assets={assets} right="Resumen para padres · cierre" />
        <View style={styles.goldHairline} />

        <View style={styles.ctaDark}>
          <Text style={styles.ctaEyebrow}>Mentoría</Text>
          <Text style={styles.ctaTitle}>Antes de tomar una decisión económica</Text>
          <Text style={styles.ctaBody}>
            Podéis revisar el caso con FlyPath para alinear ruta, costes y riesgos con alguien que ha pasado por el
            proceso.
          </Text>
          <Text style={styles.ctaLine}>Reservar mentoría de decisión</Text>
        </View>

        <View style={[styles.card, { marginTop: 14 }]}>
          <Text style={styles.criterioLabel}>Nota del mentor</Text>
          <Text style={styles.bodyTight}>
            FlyPath no vende escuelas. Ayuda a entender ruta, costes y riesgos antes de comprometer dinero.
          </Text>
        </View>

        <Text style={styles.disclaimer}>{stripPdfText(d.disclaimer)}</Text>
        <PageFooter />
      </Page>
    </Document>
  );
}

export async function renderInformePdfToBlob(d: FlyPathInformePdfInput): Promise<Blob> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const assets = await resolvePdfAssets(origin, d.nextPrimary.title);
  return pdf(<InformePdfDoc d={d} assets={assets} />).toBlob();
}

export async function renderResumenPadresPdfToBlob(d: FlyPathResumenPadresPdfInput): Promise<Blob> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const assets = await resolvePdfAssets(origin, "Mentoría de decisión");
  return pdf(<ResumenPadresPdfDoc d={d} assets={assets} />).toBlob();
}

function triggerDownload(blob: Blob, filename: string) {
  if (typeof window === "undefined") {
    throw new Error("FlyPath PDF: la descarga solo está disponible en el navegador.");
  }
  if (!blob || blob.size < 1) {
    throw new Error(`FlyPath PDF: archivo generado vacío o inválido (${blob?.size ?? 0} bytes).`);
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export async function downloadFlyPathInformePdf(d: FlyPathInformePdfInput) {
  const blob = await renderInformePdfToBlob(d);
  triggerDownload(blob, "flypath-informe-decision.pdf");
}

export async function downloadFlyPathResumenPadresPdf(d: FlyPathResumenPadresPdfInput) {
  const blob = await renderResumenPadresPdfToBlob(d);
  triggerDownload(blob, "flypath-resumen-padres.pdf");
}
