import type { ReactNode } from "react";
import {
  Radio,
  Mic,
  Home,
  Dumbbell,
  Map,
  BarChart3,
  User,
  ChevronRight,
  Headphones,
  Pencil,
  MessageSquare,
  Check,
  Star,
  Trophy,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[9/19] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0b1830] p-1.5 shadow-[0_30px_60px_rgba(7,18,36,0.45)] ${className}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-[#0d1b32] to-[#080f1c]">
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1.5 z-10 h-1 w-12 -translate-x-1/2 rounded-full bg-white/12"
        />
        {children}
      </div>
    </div>
  );
}

const WAVE_BARS = [
  28, 52, 74, 40, 66, 88, 36, 58, 82, 46, 70, 34, 60, 92, 50, 38, 68, 48, 78, 42, 56, 30, 54, 72,
  44, 64, 86, 40, 60, 80,
];

export function Waveform({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[2px] ${className}`}>
      {WAVE_BARS.map((h, i) => (
        <span
          key={i}
          className={`w-[2px] shrink-0 rounded-full ${i % 3 === 0 ? "bg-[#f2ddaa]" : "bg-[#c9a454]/55"}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

function MicButton() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#c9a454] shadow-[0_6px_16px_rgba(201,164,84,0.45)]">
      <Mic className="h-4 w-4 text-[#071224]" aria-hidden />
    </span>
  );
}

export function ProgressRing({
  value,
  size = "h-16 w-16",
  label = "text-[13px]",
}: {
  value: number;
  size?: string;
  label?: string;
}) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - value / 100);
  return (
    <span className={`relative inline-flex items-center justify-center ${size}`}>
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#c9a454"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className={`absolute font-bold text-white ${label}`}>{value}%</span>
    </span>
  );
}

function ScreenHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-5">
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#c9a454]/15 ring-1 ring-[#c9a454]/25">
        <Radio className="h-3 w-3 text-[#f2ddaa]" aria-hidden />
      </span>
      <span className="text-[10px] font-semibold text-white">{title}</span>
      {badge ? (
        <span className="ml-auto rounded-full border border-[#c9a454]/25 bg-[#c9a454]/10 px-1.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.12em] text-[#f2ddaa]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

function BottomNav({ active = "Today" }: { active?: string }) {
  const items = [
    { icon: Home, label: "Today" },
    { icon: Dumbbell, label: "Train" },
    { icon: Map, label: "Scenarios" },
    { icon: BarChart3, label: "Progress" },
    { icon: User, label: "Profile" },
  ];
  return (
    <div className="mt-auto flex items-center justify-between border-t border-white/[0.06] px-3 py-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.label === active;
        return (
          <span
            key={item.label}
            className={`flex h-6 w-6 items-center justify-center ${isActive ? "text-[#f2ddaa]" : "text-white/30"}`}
          >
            <Icon className="h-[13px] w-[13px]" aria-hidden />
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

export function TodayScreen() {
  const rows = [
    { label: "Today", sub: "2 ejercicios · Listening", active: true },
    { label: "Train", sub: "Readbacks · Nivel 2", active: false },
    { label: "Scenarios", sub: "VFR · Circuito", active: false },
    { label: "Progress", sub: "Tu semana", active: false },
  ];
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="AeroComms" badge="Beta" />
      <div className="flex-1 space-y-1.5 px-3 pt-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
              row.active
                ? "border border-[#c9a454]/30 bg-[#c9a454]/[0.08]"
                : "border border-white/[0.05] bg-white/[0.03]"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.active ? "bg-[#c9a454]" : "bg-white/20"}`}
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block text-[9px] font-semibold ${row.active ? "text-white" : "text-white/70"}`}
              >
                {row.label}
              </span>
              <span className="block text-[7.5px] text-white/40">{row.sub}</span>
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 text-white/25" aria-hidden />
          </div>
        ))}
        <div className="mt-2 rounded-lg border border-[#c9a454]/20 bg-[#c9a454]/[0.05] px-2 py-2">
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] text-white/45">Sesión recomendada</span>
            <span className="text-[7.5px] font-semibold text-[#f2ddaa]">8 min</span>
          </div>
          <div className="mt-1.5 flex h-6 items-center overflow-hidden">
            <Waveform className="h-full" />
          </div>
          <div className="mt-1.5 flex justify-center">
            <MicButton />
          </div>
        </div>
      </div>
      <BottomNav active="Today" />
    </div>
  );
}

export function ScenarioScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Scenario" badge="3/12" />
      <div className="flex-1 px-3 pt-3">
        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-white/40">
          VFR Circuit
        </p>
        <div className="mt-2 flex h-9 items-center overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] px-2">
          <Waveform className="h-5 w-full" />
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="rounded-lg bg-white/[0.05] px-2 py-1.5">
            <span className="block text-[7px] font-semibold uppercase tracking-wide text-[#f2ddaa]/70">
              ATC
            </span>
            <span className="mt-0.5 block text-[8px] leading-snug text-white/75">
              Cleared for takeoff, runway two four.
            </span>
          </div>
          <div className="rounded-lg border border-[#c9a454]/20 bg-[#c9a454]/[0.06] px-2 py-1.5">
            <span className="block text-[7px] font-semibold uppercase tracking-wide text-[#f2ddaa]/70">
              Tu readback
            </span>
            <span className="mt-0.5 block text-[8px] leading-snug text-white/60">
              Toca el micro para responder…
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-3 py-3">
        <MicButton />
      </div>
    </div>
  );
}

export function ListeningScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Listening" badge="L1" />
      <div className="flex-1 px-3 pt-3">
        <div className="flex h-10 items-center overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02] px-2">
          <Waveform className="h-6 w-full" />
        </div>
        <p className="mt-3 text-[8px] font-medium text-white/45">¿Qué has escuchado?</p>
        <div className="mt-1.5 space-y-1">
          {["Runway two four", "Runway two zero", "Runway two two"].map((opt, i) => (
            <div
              key={opt}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[8px] ${
                i === 0
                  ? "border border-[#c9a454]/30 bg-[#c9a454]/[0.08] text-white"
                  : "border border-white/[0.05] bg-white/[0.03] text-white/50"
              }`}
            >
              <span
                className={`flex h-2.5 w-2.5 items-center justify-center rounded-full ${i === 0 ? "bg-[#c9a454]" : "border border-white/20"}`}
              >
                {i === 0 ? <Check className="h-2 w-2 text-[#071224]" aria-hidden /> : null}
              </span>
              {opt}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center py-3">
        <MicButton />
      </div>
    </div>
  );
}

export function ReadbacksScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Readbacks" badge="L2" />
      <div className="flex-1 px-3 pt-3">
        <div className="rounded-lg bg-white/[0.05] px-2 py-1.5">
          <span className="block text-[7px] font-semibold uppercase tracking-wide text-[#f2ddaa]/70">
            ATC
          </span>
          <span className="mt-0.5 block text-[8px] leading-snug text-white/75">
            Cleared for takeoff, runway two four.
          </span>
        </div>
        <p className="mt-3 text-[8px] font-medium text-white/45">Repite y responde</p>
        <div className="mt-2 flex h-8 items-center overflow-hidden rounded-lg border border-[#c9a454]/20 bg-[#c9a454]/[0.05] px-2">
          <Waveform className="h-5 w-full" />
        </div>
      </div>
      <div className="flex items-center justify-center py-3">
        <MicButton />
      </div>
    </div>
  );
}

export function PhraseologyScreen() {
  const chips = ["Iberia 325", "request", "taxi to", "holding point", "runway 24"];
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Phraseology" badge="Builder" />
      <div className="flex-1 px-3 pt-3">
        <p className="text-[8px] font-medium text-white/45">Ordena la frase correcta</p>
        <div className="mt-2 space-y-1">
          {chips.map((chip, i) => (
            <div
              key={chip}
              className={`rounded-md px-2 py-1.5 text-[8px] font-medium ${
                i === 0
                  ? "border border-[#c9a454]/30 bg-[#c9a454]/[0.08] text-white"
                  : "border border-white/[0.06] bg-white/[0.03] text-white/60"
              }`}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="rounded-lg bg-[#c9a454] py-1.5 text-center text-[8px] font-bold text-[#071224]">
          Comprobar
        </div>
      </div>
    </div>
  );
}

export function ScenariosScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Scenarios" badge="VFR" />
      <div className="flex-1 px-3 pt-3">
        <div className="relative h-24 overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <svg viewBox="0 0 120 90" className="h-full w-full" aria-hidden>
            <path
              d="M12 74 C 40 60, 55 40, 78 30 S 108 18, 112 14"
              fill="none"
              stroke="#c9a454"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            <circle cx="12" cy="74" r="3" fill="#f2ddaa" />
            <circle cx="112" cy="14" r="3" fill="#c9a454" />
          </svg>
          <span className="absolute bottom-1 left-2 text-[7px] text-white/40">Circuito</span>
        </div>
        <div className="mt-2 flex gap-1">
          {["Taxi", "Takeoff", "Circuit"].map((s, i) => (
            <span
              key={s}
              className={`flex-1 rounded-md px-1 py-1 text-center text-[7px] font-medium ${
                i === 1 ? "bg-[#c9a454]/15 text-[#f2ddaa]" : "bg-white/[0.04] text-white/45"
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center py-3">
        <MicButton />
      </div>
    </div>
  );
}

export function ProgressScreen() {
  const rows = [
    { label: "Listening", stars: 4 },
    { label: "Readbacks", stars: 3 },
    { label: "Phraseology", stars: 4 },
    { label: "Scenarios", stars: 2 },
  ];
  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Progress" />
      <div className="flex-1 px-3 pt-3">
        <div className="flex flex-col items-center">
          <ProgressRing value={68} />
          <span className="mt-1 text-[7.5px] text-white/45">Buen trabajo</span>
        </div>
        <div className="mt-2 space-y-1">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[8px] text-white/60">{row.label}</span>
              <span className="flex gap-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-2 w-2 ${i < row.stars ? "fill-[#c9a454] text-[#c9a454]" : "text-white/20"}`}
                    aria-hidden
                  />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="Progress" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback card (not a phone)                                         */
/* ------------------------------------------------------------------ */

export function MissionCompleteCard({ className = "" }: { className?: string }) {
  const scores = [
    { label: "Clarity", stars: 5 },
    { label: "Phraseology", stars: 4 },
    { label: "Accuracy", stars: 4 },
    { label: "Fluency", stars: 3 },
  ];
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1830] p-5 shadow-[0_24px_52px_rgba(7,18,36,0.35)] ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c9a454]/15 ring-1 ring-[#c9a454]/25">
          <Trophy className="h-3.5 w-3.5 text-[#f2ddaa]" aria-hidden />
        </span>
        <span>
          <span className="block text-[13px] font-semibold text-white">Mission Complete</span>
          <span className="block text-[10px] text-white/45">VFR Circuit · Level 2</span>
        </span>
      </div>

      <div className="mt-4 flex items-end gap-1.5">
        <span className="text-[2.4rem] font-bold leading-none text-white">84</span>
        <span className="mb-1 text-[13px] font-medium text-white/40">/ 100</span>
        <span className="mb-1 ml-auto rounded-full bg-[#c9a454]/15 px-2 py-0.5 text-[10px] font-semibold text-[#f2ddaa]">
          Buen trabajo
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {scores.map((score) => (
          <div key={score.label} className="flex items-center justify-between">
            <span className="text-[12px] text-white/65">{score.label}</span>
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < score.stars ? "fill-[#c9a454] text-[#c9a454]" : "text-white/15"}`}
                  aria-hidden
                />
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/[0.08] pt-3 text-center text-[11px] font-medium text-[#f2ddaa]">
        Ver detalle
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Floating chip                                                       */
/* ------------------------------------------------------------------ */

const CHIP_ICONS = {
  listening: Headphones,
  readbacks: Pencil,
  scenarios: MessageSquare,
  progress: BarChart3,
} as const;

export function FloatingChip({
  icon,
  label,
  className = "",
}: {
  icon: keyof typeof CHIP_ICONS;
  label: string;
  className?: string;
}) {
  const Icon = CHIP_ICONS[icon];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#071224]/[0.08] bg-white px-3 py-2 shadow-[0_10px_28px_rgba(7,18,36,0.14)] ${className}`}
    >
      <Icon className="h-3.5 w-3.5 text-[#7a5a16]" aria-hidden />
      <span className="text-[12px] font-semibold text-[#071224]">{label}</span>
    </span>
  );
}
