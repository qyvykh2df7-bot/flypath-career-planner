"use client";

// AeroComms — AtisAndClearancePanel (Student Pilot Alpha).
// Styled operational display for ATIS, local/VFR clearance, or combined.
// Dark cockpit aesthetic, clear hierarchy, mobile-first.

import type { AtisInfo, ClearanceInfo } from "@/lib/aerocomms/studentPilotVisuals";

export type AtisDisplayMode = "atis" | "clearance" | "combined";

export interface AtisAndClearancePanelProps {
  mode: AtisDisplayMode;
  atis?: AtisInfo;
  clearance?: ClearanceInfo;
  /** Highlight specific field keys (e.g. "runwayInUse", "squawk"). */
  activeFields?: string[];
  className?: string;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PanelDivider() {
  return <div className="my-2 h-px bg-white/[0.06]" />;
}

function FieldRow({
  label,
  value,
  active = false,
  mono = true,
}: {
  label: string;
  value: string;
  active?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <span
        className={`text-right text-[13px] font-semibold leading-snug ${
          mono ? "font-mono" : ""
        } ${active ? "text-[#FACC15]" : "text-slate-200"}`}
      >
        {value}
      </span>
    </div>
  );
}

function PanelHeader({
  title,
  badge,
  badgeColor = "green",
}: {
  title: string;
  badge?: string;
  badgeColor?: "green" | "sky";
}) {
  const badgeClass =
    badgeColor === "sky"
      ? "bg-[#38BDF8]/10 text-[#38BDF8] ring-1 ring-[#38BDF8]/25"
      : "bg-[#FACC15]/10 text-[#FACC15] ring-1 ring-[#FACC15]/25";
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </span>
      {badge && (
        <span className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${badgeClass}`}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── ATIS block ──────────────────────────────────────────────────────────────

function AtisBlock({
  atis,
  activeFields = [],
}: {
  atis: AtisInfo;
  activeFields: string[];
}) {
  return (
    <div>
      <PanelHeader
        title="Brindale ATIS"
        badge={`INFO ${atis.informationLetter}`}
        badgeColor="sky"
      />
      <div className="mt-2 space-y-0">
        <FieldRow
          label="RWY"
          value={atis.runwayInUse}
          active={activeFields.includes("runwayInUse")}
        />
        <FieldRow
          label="Wind"
          value={atis.wind}
          active={activeFields.includes("wind")}
        />
        <FieldRow
          label="QNH"
          value={`${atis.qnh} hPa`}
          active={activeFields.includes("qnh")}
        />
        <FieldRow
          label="Vis"
          value={atis.visibility}
          active={activeFields.includes("visibility")}
        />
        {atis.tempDewpoint && (
          <FieldRow
            label="Temp/Dew"
            value={atis.tempDewpoint}
            active={activeFields.includes("tempDewpoint")}
          />
        )}
      </div>
    </div>
  );
}

// ── Clearance block ─────────────────────────────────────────────────────────

function ClearanceBlock({
  clearance,
  activeFields = [],
}: {
  clearance: ClearanceInfo;
  activeFields: string[];
}) {
  return (
    <div>
      <PanelHeader
        title="Local VFR Clearance"
        badge={clearance.callsign}
        badgeColor="green"
      />
      <div className="mt-2 space-y-0">
        <FieldRow
          label="Squawk"
          value={clearance.squawk}
          active={activeFields.includes("squawk")}
        />
        <FieldRow
          label="Depart"
          value={clearance.departureDirection}
          active={activeFields.includes("departureDirection")}
        />
        <FieldRow
          label="Alt Restrict"
          value={clearance.altitudeRestriction}
          active={activeFields.includes("altitudeRestriction")}
          mono={false}
        />
        {clearance.frequency && (
          <FieldRow
            label={clearance.frequencyLabel ?? "TWR Freq"}
            value={clearance.frequency}
            active={activeFields.includes("frequency")}
          />
        )}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function AtisAndClearancePanel({
  mode,
  atis,
  clearance,
  activeFields = [],
  className = "",
}: AtisAndClearancePanelProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-[#08141F] px-4 py-3.5 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* Scanline texture — pure CSS, no images */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.015]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)",
        }}
      />

      {(mode === "atis" || mode === "combined") && atis && (
        <AtisBlock atis={atis} activeFields={activeFields} />
      )}

      {mode === "combined" && atis && clearance && <PanelDivider />}

      {(mode === "clearance" || mode === "combined") && clearance && (
        <ClearanceBlock clearance={clearance} activeFields={activeFields} />
      )}
    </div>
  );
}
