/** Check dorado editorial (preview web). */
export function ParentsGoldCheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6.2 L4.6 8.8 L10 3.2"
        stroke="#c9a454"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ParentsChecklistItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3.5">
      <ParentsGoldCheckIcon />
      <span className="text-[14px] leading-snug text-[#0f1a33]">{label}</span>
    </li>
  );
}
