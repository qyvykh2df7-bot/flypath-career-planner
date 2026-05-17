import Image from "next/image";
import { Plane } from "lucide-react";

const JORGE_IMAGE = "/jorge.jpg";
const AVATAR_SIZE_PX = 128;

export type FlyPathTeamMember = {
  id: string;
  name: string;
  role: string;
  text: string;
  image: string;
};

type FlyPathTeamSectionProps = {
  description: string;
  members: readonly FlyPathTeamMember[];
  layout?: "two" | "three";
};

const AVATAR_SHELL_CLASS =
  "h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-[#c9a454]/35 bg-slate-100 ring-2 ring-white sm:h-32 sm:w-32";

const PLACEHOLDER_CLASS =
  "flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2 border-[#c9a454]/40 bg-gradient-to-br from-[#0f1a33] to-[#16264a] text-2xl font-semibold text-[#f2ddaa] sm:h-32 sm:w-32";

function memberInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TeamMemberAvatar({ member }: { member: FlyPathTeamMember }) {
  const initials = memberInitials(member.name);
  const isJorgePhoto = member.image === JORGE_IMAGE;

  if (!isJorgePhoto) {
    return (
      <div className={PLACEHOLDER_CLASS}>
        {initials || <Plane className="h-8 w-8" aria-hidden />}
      </div>
    );
  }

  return (
    <div className={AVATAR_SHELL_CLASS}>
      <Image
        src={JORGE_IMAGE}
        alt="Jorge Feliu"
        width={AVATAR_SIZE_PX}
        height={AVATAR_SIZE_PX}
        sizes="(max-width: 640px) 112px, 128px"
        loading="eager"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

const GRID_BY_LAYOUT = {
  two: "mx-auto mt-7 grid max-w-3xl grid-cols-1 gap-5 sm:max-w-4xl md:grid-cols-2",
  three: "mt-7 grid grid-cols-1 gap-5 md:grid-cols-3",
} as const;

export function FlyPathTeamSection({
  description,
  members,
  layout = "two",
}: FlyPathTeamSectionProps) {
  return (
    <section className="border-b border-slate-200/70 bg-[#f4f7fb] py-10 sm:py-11">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <h2 className="text-center text-xl font-semibold tracking-tight text-[#0f1a33] sm:text-2xl">
          El equipo detrás de FlyPath
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] leading-relaxed text-slate-600 sm:text-base">
          {description}
        </p>
        <div className={GRID_BY_LAYOUT[layout]}>
          {members.map((member) => (
            <article
              key={member.id}
              className="flex flex-col items-center rounded-xl border border-slate-200/80 bg-white p-5 text-center shadow-[0_8px_22px_rgba(15,26,51,0.05)] sm:p-6"
            >
              <TeamMemberAvatar member={member} />
              <h3 className="mt-4 text-base font-semibold text-[#0f1a33]">{member.name}</h3>
              <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.12em] text-[#7a5a16]">
                {member.role}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{member.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
