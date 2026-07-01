"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import {
  PLATFORM_HOME,
  PLATFORM_NAV_SECTIONS,
  isPlatformNavCurrent,
  type PlatformModuleStatus,
  type PlatformNavSection,
} from "@/lib/platform-navigation";

function isSectionActive(currentModuleId: string, section: PlatformNavSection): boolean {
  if (isPlatformNavCurrent(currentModuleId, section.id)) return true;
  return section.items.some((item) => isPlatformNavCurrent(currentModuleId, item.id));
}

function NavStatusBadge({
  status,
  isCurrent,
}: {
  status: PlatformModuleStatus;
  isCurrent: boolean;
}) {
  if (status === "soon") {
    return (
      <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">
        En desarrollo
      </span>
    );
  }
  if (isCurrent) {
    return (
      <span className="shrink-0 pl-1 text-[9px] font-medium uppercase tracking-[0.14em] text-[#a5802a]">
        Actual
      </span>
    );
  }
  return null;
}

function NavRowButton({
  label,
  status,
  isCurrent,
  onClick,
  indent = false,
}: {
  label: string;
  status: PlatformModuleStatus;
  isCurrent: boolean;
  onClick: () => void;
  indent?: boolean;
}) {
  const isClickable = status === "available" || status === "soon";
  return (
    <button
      type="button"
      role="option"
      aria-selected={isCurrent}
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-4 rounded-lg py-2 text-left transition-colors ${
        indent ? "pl-5 pr-3" : "px-3"
      } ${isClickable ? "cursor-pointer" : "cursor-not-allowed"} ${isCurrent ? "bg-[#fff8e8]" : "hover:bg-slate-50"}`}
    >
      <span
        className={`min-w-0 flex-1 truncate text-[0.9rem] font-medium leading-snug ${
          status === "soon" ? "text-slate-500" : isCurrent ? "text-[#7a5a16]" : "text-slate-700"
        }`}
      >
        {label}
      </span>
      <NavStatusBadge status={status} isCurrent={isCurrent} />
    </button>
  );
}

function navigateTo(
  router: ReturnType<typeof useRouter>,
  href: string,
  status: PlatformModuleStatus,
  onSoonClick?: (message?: string) => void,
) {
  if (status === "soon") {
    onSoonClick?.("Próximamente");
    if (href && href !== "#") router.push(href);
    return;
  }
  if (href) router.push(href);
}

function SectionAccordion({
  section,
  currentModuleId,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  section: PlatformNavSection;
  currentModuleId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (href: string, status: PlatformModuleStatus) => void;
}) {
  const hubHref = section.hubHref ?? "#";
  const sectionActive = isSectionActive(currentModuleId, section);
  const sectionCurrent = isPlatformNavCurrent(currentModuleId, section.id);
  const activeChild = section.items.some((item) => isPlatformNavCurrent(currentModuleId, item.id));
  const panelId = `nav-section-${section.id}`;

  return (
    <li role="presentation" className="py-0.5">
      <div
        className={`flex w-full items-stretch gap-0.5 rounded-lg transition-colors ${
          sectionActive ? "bg-[#fff8e8]/80" : "hover:bg-slate-50"
        }`}
      >
        <button
          type="button"
          onClick={() => onNavigate(hubHref, section.status)}
          className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2.5 text-left text-[0.9375rem] font-medium leading-snug ${
            sectionActive ? "text-[#7a5a16]" : "text-slate-700"
          }`}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="truncate">{section.label}</span>
            {sectionCurrent && !activeChild ? (
              <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.14em] text-[#a5802a]">
                Actual
              </span>
            ) : null}
          </span>
        </button>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={panelId}
          aria-label={`${isExpanded ? "Contraer" : "Expandir"} ${section.label}`}
          onClick={onToggle}
          className="inline-flex shrink-0 items-center justify-center rounded-lg px-2 py-2.5 text-slate-400 hover:bg-white/60 hover:text-slate-600"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>
      {isExpanded ? (
        <ul id={panelId} className="ml-2 mt-0.5 space-y-0.5 border-l border-slate-200/80 py-0.5 pl-2">
          {section.items.map((item) => (
            <li key={item.id} role="presentation">
              <NavRowButton
                label={item.label}
                status={item.status}
                isCurrent={isPlatformNavCurrent(currentModuleId, item.id)}
                indent
                onClick={() => onNavigate(item.href, item.status)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function DirectSectionLink({
  section,
  currentModuleId,
  onNavigate,
}: {
  section: PlatformNavSection;
  currentModuleId: string;
  onNavigate: (href: string, status: PlatformModuleStatus) => void;
}) {
  const hubHref = section.hubHref ?? "#";
  const isCurrent = isPlatformNavCurrent(currentModuleId, section.id);

  return (
    <li role="presentation">
      <NavRowButton
        label={section.label}
        status={section.status}
        isCurrent={isCurrent}
        onClick={() => onNavigate(hubHref, section.status)}
      />
    </li>
  );
}

const menuTriggerClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] text-white transition-colors hover:border-white/24 hover:bg-white/[0.14] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a454]/55";

type FlyPathPlatformModuleMenuProps = {
  currentModuleId: string;
  onSoonClick?: (message?: string) => void;
  /** Alineación del panel respecto al botón */
  menuAlignClassName?: string;
  /** Estilo del botón trigger. Por defecto oscuro (header de plataforma). */
  triggerClassName?: string;
};

export function FlyPathPlatformModuleMenu({
  currentModuleId,
  onSoonClick,
  menuAlignClassName = "right-0",
  triggerClassName = menuTriggerClass,
}: FlyPathPlatformModuleMenuProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const activeIds = PLATFORM_NAV_SECTIONS.filter(
      (section) => section.items.length > 0 && isSectionActive(currentModuleId, section),
    ).map((section) => section.id);
    setExpandedSectionIds(new Set(activeIds));
  }, [open, currentModuleId]);

  const handleNavigate = (href: string, status: PlatformModuleStatus) => {
    setOpen(false);
    navigateTo(router, href, status, onSoonClick);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Menú de módulos FlyPath Platform"
      >
        <Menu className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-header-navy/50 md:hidden"
            aria-label="Cerrar menú de navegación"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className={`absolute top-full z-50 mt-3 max-h-[min(72vh,34rem)] w-[min(22rem,calc(100vw-2rem))] max-w-[min(96vw,26rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/90 bg-white px-1.5 py-2 shadow-[0_24px_52px_rgba(15,26,51,0.11),0_12px_32px_rgba(15,26,51,0.06)] ring-1 ring-slate-200/45 ${menuAlignClassName}`}
          >
            <li role="presentation">
              <NavRowButton
                label={PLATFORM_HOME.label}
                status={PLATFORM_HOME.status}
                isCurrent={isPlatformNavCurrent(currentModuleId, PLATFORM_HOME.id)}
                onClick={() => handleNavigate(PLATFORM_HOME.href, PLATFORM_HOME.status)}
              />
            </li>
            <li role="separator" className="my-1.5 border-t border-slate-100" aria-hidden />
            {PLATFORM_NAV_SECTIONS.map((section) =>
              section.items.length > 0 ? (
                <SectionAccordion
                  key={section.id}
                  section={section}
                  currentModuleId={currentModuleId}
                  isExpanded={expandedSectionIds.has(section.id)}
                  onToggle={() => toggleSection(section.id)}
                  onNavigate={handleNavigate}
                />
              ) : (
                <DirectSectionLink
                  key={section.id}
                  section={section}
                  currentModuleId={currentModuleId}
                  onNavigate={handleNavigate}
                />
              ),
            )}
          </ul>
        </>
      ) : null}
    </div>
  );
}
