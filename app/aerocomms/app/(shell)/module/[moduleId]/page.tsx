"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/lib/aerocomms/appState";
import {
  findModule,
  isExerciseAccessible,
  isLevelUnlocked,
  moduleCompletion,
  screenType,
  topicCompletion,
  type Exercise,
  type ExerciseType,
  type ScreenType,
  type Topic,
} from "@/lib/aerocomms/content";
import { trainHref } from "@/lib/aerocomms/trainLevel";
import { AeroCommsProGate, AeroCommsProLockIcon } from "@/components/aerocomms/app/AeroCommsProGate";

const SCREEN_META: Record<ScreenType, { color: string }> = {
  lesson: { color: "text-[#38BDF8]" },
  listening: { color: "text-[#38BDF8]" },
  speaking: { color: "text-[#34D399]" },
  readback: { color: "text-[#FACC15]" },
  phraseology: { color: "text-[#FACC15]" },
  scenario: { color: "text-[#A78BFA]" },
  mission: { color: "text-[#FB923C]" },
};

function TypeGlyph({ type }: { type: ExerciseType }) {
  const common = { className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (screenType(type)) {
    case "lesson":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3z" />
          <path d="M18 8a3 3 0 0 1 3-3v11a3 3 0 0 0-3 3" />
        </svg>
      );
    case "listening":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M11 5 6 9H2v6h4l5 4z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
        </svg>
      );
    case "speaking":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="9" y="2" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      );
    case "readback":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M9 17l-5-5 5-5M4 12h11a5 5 0 0 1 5 5v1" />
        </svg>
      );
    case "phraseology":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M21 11.5a8.5 8.5 0 0 1-12 7.7L3 21l1.8-6A8.5 8.5 0 1 1 21 11.5z" />
        </svg>
      );
    case "scenario":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M8 10h8M8 14h5" />
          <path d="M4 5h16v11H7l-3 3z" />
        </svg>
      );
    case "mission":
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M5 21V5l8-2v3l6 2v6l-6-2v9z" />
        </svg>
      );
  }
}

export default function ModulePage() {
  const router = useRouter();
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const { state, access } = useAppState();

  const found = findModule(moduleId);

  if (!found) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-400">Module not found.</p>
        <button onClick={() => router.push(trainHref())} className="primary-btn max-w-[200px]">
          Back to Train
        </button>
      </div>
    );
  }

  const { level, module } = found;
  const isPro = access.isPro;
  const completed = new Set(state.completedExercises);
  const progress = moduleCompletion(module, completed);
  const levelUnlocked = isLevelUnlocked(level, completed, isPro);

  // Compact Goal/Objective line shown near the top.
  const childCount = module.topics ? module.topics.length : module.exercises.length;
  const childUnit = module.unit ?? (module.topics ? "topics" : "exercises");
  const objective = module.subtitle ?? `Work through all ${childCount} ${childUnit} to complete this module.`;

  const openExercise = (ex: Exercise) => {
    if (!isExerciseAccessible(ex, level, completed, isPro)) {
      router.push("/aerocomms/app/paywall");
      return;
    }
    const q = new URLSearchParams({
      type: ex.type,
      title: ex.title,
      moduleId: module.id,
      exerciseId: ex.id,
      minutes: ex.type === "Mission" ? "6" : "4",
      returnTo: `/aerocomms/app/module/${module.id}`,
    });
    router.push(`/aerocomms/app/session?${q.toString()}`);
  };

  const openTopic = (topic: Topic) => {
    if (!topic.exercises.some((ex) => isExerciseAccessible(ex, level, completed, isPro))) {
      router.push("/aerocomms/app/paywall");
      return;
    }
    // Skip the intermediate topic / training-path screen when a section has
    // exactly one exercise. Navigate directly to the session and return here.
    if (topic.exercises.length === 1) {
      const ex = topic.exercises[0];
      if (!isExerciseAccessible(ex, level, completed, isPro)) {
        router.push("/aerocomms/app/paywall");
        return;
      }
      const q = new URLSearchParams({
        type: ex.type,
        title: ex.content?.isFoundationPlaceholder ? topic.name : ex.title,
        moduleId: module.id,
        exerciseId: ex.id,
        minutes: ex.type === "Mission" ? "6" : "4",
        returnTo: `/aerocomms/app/module/${module.id}`,
      });
      router.push(`/aerocomms/app/session?${q.toString()}`);
      return;
    }
    router.push(`/aerocomms/app/topic/${topic.id}`);
  };

  const renderRow = (ex: Exercise, showType: boolean) => {
    const done = completed.has(ex.id);
    const accessible = isExerciseAccessible(ex, level, completed, isPro);
    const meta = SCREEN_META[screenType(ex.type)];
    return (
      <button
        key={ex.id}
        type="button"
        onClick={() => openExercise(ex)}
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
          done ? "border-[#FACC15]/25 bg-[#0F1A2E]" : "border-white/[0.04] bg-[#0B1322] hover:border-white/10"
        } ${!accessible ? "opacity-60" : ""}`}
      >
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 ${meta.color}`}>
          <TypeGlyph type={ex.type} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold leading-snug">{ex.title}</p>
          {showType && <p className={`text-[13px] font-medium ${meta.color}`}>{ex.type}</p>}
        </div>

        {done ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4 4 10-11" />
            </svg>
          </span>
        ) : accessible ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="4.5" y="11" width="15" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 lg:h-auto lg:mx-auto lg:max-w-2xl">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.push(trainHref(level.id))}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">{level.name}</p>
          <h1 className="truncate text-xl font-bold tracking-tight">{module.name}</h1>
        </div>
      </header>

      {/* Goal + progress combined */}
      <div className="rounded-2xl border border-white/[0.04] bg-[#0B1322] px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FACC15]">Goal</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{objective}</p>
        <div className="mt-3 flex items-center justify-between text-[13px]">
          <span className="text-slate-300">
            {module.topics
              ? `${module.topics.filter((t) => topicCompletion(t, completed) === 100).length}/${module.topics.length} ${module.unit ?? "topics"}`
              : `${module.exercises.filter((e) => completed.has(e.id)).length}/${module.exercises.length} ${module.unit ?? "exercises"}`}
          </span>
          <span className="font-semibold text-[#FACC15]">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#FACC15]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Topic cards (foundations) or exercise list (practice/missions) */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-1">
        {module.topics
          ? module.topics.map((topic) => {
              const tProgress = topicCompletion(topic, completed);
              const tDone = topic.exercises.filter((e) => completed.has(e.id)).length;
              const tTotal = topic.exercises.length;
              // Scenario topics keep their purple scenario badge; all other topic modules keep the blue lesson book.
              const firstType = topic.exercises[0]?.type;
              const isScenarioTopic = firstType ? screenType(firstType) === "scenario" : false;
              const topicAccessible = topic.exercises.some((ex) =>
                isExerciseAccessible(ex, level, completed, isPro));
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => openTopic(topic)}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                    tProgress === 100 ? "border-[#FACC15]/25 bg-[#0F1A2E]" : "border-white/[0.04] bg-[#0B1322] hover:border-white/10"
                  } ${!topicAccessible ? "opacity-60" : ""}`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 ${isScenarioTopic ? "text-[#A78BFA]" : "text-[#38BDF8]"}`}>
                    {isScenarioTopic && firstType ? (
                      <TypeGlyph type={firstType} />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 5h11a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3z" />
                        <path d="M18 8a3 3 0 0 1 3-3v11a3 3 0 0 0-3 3" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold leading-snug">{topic.name}</p>
                    <p className="truncate text-[13px] leading-snug text-slate-400">{topic.description}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#FACC15] transition-all" style={{ width: `${tProgress}%` }} />
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {!topicAccessible ? (
                      <AeroCommsProLockIcon className="h-5 w-5 text-slate-500" />
                    ) : tProgress === 100 ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4 4 10-11" />
                        </svg>
                      </span>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    )}
                    <span className="whitespace-nowrap text-xs tabular-nums text-slate-300">{tDone}/{tTotal} {topic.unit ?? "steps"}</span>
                  </div>
                </button>
              );
            })
          : module.exercises.map((ex) => renderRow(ex, true))}

        {!isPro && module.exercises.some((ex) => !ex.free) && (
          <AeroCommsProGate
            compact
            title={levelUnlocked ? "Continúa este bloque con Pro" : "Nivel disponible con Pro"}
            description={levelUnlocked
              ? "El tramo inicial de este bloque es Free. Desbloquea el resto del contenido con AeroComms Pro."
              : "Los niveles posteriores a Cadet requieren AeroComms Pro."}
          />
        )}
      </div>
    </div>
  );
}
