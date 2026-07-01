import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ResourceType = "HERRAMIENTA" | "GUÍA" | "APP" | "MENTORÍA";

type HomeResource = {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  cta: string;
  href: string;
  mockupSrc: string;
  mockupAlt: string;
};

// TODO: sustituir href cuando exista landing de Guía Pre-PPL
const HOME_RESOURCES: HomeResource[] = [
  {
    id: "career-planner",
    type: "HERRAMIENTA",
    title: "Career Planner",
    description: "Descubre tu ruta ideal según edad, presupuesto, tiempo e inglés.",
    cta: "Probar ahora",
    href: "/career-planner",
    mockupSrc: "/aerocomms/mockups/plannerhome.png",
    mockupAlt: "Mockup del Career Planner de FlyPath",
  },
  {
    id: "guia-como-ser-piloto",
    type: "GUÍA",
    title: "Cómo ser Piloto",
    description: "La guía completa para entender el proceso desde cero.",
    cta: "Ver guía",
    href: "/guia-como-ser-piloto",
    mockupSrc: "/aerocomms/mockups/pilotohome.png",
    mockupAlt: "Portada de la guía Cómo ser Piloto",
  },
  {
    id: "guia-pre-ppl",
    type: "GUÍA",
    title: "Pre-PPL",
    description: "Conceptos básicos antes de empezar tu formación.",
    cta: "Próximamente",
    href: "#",
    mockupSrc: "/aerocomms/mockups/preppl.png",
    mockupAlt: "Portada de la guía Pre-PPL",
  },
  {
    id: "aerocomms",
    type: "APP",
    title: "AeroComms",
    description: "Practica radio real en inglés con escenarios ATC.",
    cta: "Descubrir app",
    href: "/aerocomms",
    mockupSrc: "/aerocomms/mockups/aerohome.png",
    mockupAlt: "Mockup móvil de la app AeroComms",
  },
  {
    id: "mentoria",
    type: "MENTORÍA",
    title: "Mentoría 1 a 1",
    description: "Sesiones personalizadas para resolver dudas y avanzar con seguridad.",
    cta: "Saber más",
    href: "/mentorias",
    mockupSrc: "/aerocomms/mockups/mentoriahome.png",
    mockupAlt: "Mockup de sesión de mentoría 1 a 1 con un piloto",
  },
];

const RESOURCE_CTA_CLASS =
  "text-[#2563EB] transition hover:text-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";

function ResourceMockupImage({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="h-full w-full max-h-[260px] object-contain object-center sm:max-h-[280px]"
    />
  );
}

function ResourceTypeChip({ type }: { type: ResourceType }) {
  return (
    <span className="absolute left-3.5 top-3.5 z-10 inline-flex rounded-full border border-[#D6AE4F] bg-[#0f1a33] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#D6AE4F] shadow-[0_2px_8px_rgba(7,18,36,0.12)]">
      {type}
    </span>
  );
}

function ResourceCard({ resource }: { resource: HomeResource }) {
  const isPlaceholderLink = resource.href === "#";

  return (
    <article className="flex w-[min(78vw,280px)] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-[#071224]/[0.07] bg-white shadow-[0_16px_44px_rgba(7,18,36,0.07)] sm:w-[300px] lg:w-[calc((min(76rem,100vw-3rem)-4*1.25rem)/5)] lg:min-w-[220px] lg:max-w-[280px]">
      <div className="relative flex min-h-[260px] items-center justify-center bg-[#F8F9FA] px-2 py-2 sm:min-h-[280px]">
        <ResourceTypeChip type={resource.type} />
        <ResourceMockupImage src={resource.mockupSrc} alt={resource.mockupAlt} />
      </div>
      <div className="flex flex-1 flex-col border-t border-[#071224]/[0.05] bg-white px-5 pb-6 pt-4">
        <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-[#071224] sm:text-[18px]">
          {resource.title}
        </h3>
        <p className="mt-2 flex-1 text-[14px] leading-relaxed text-[#4B5563]">
          {resource.description}
        </p>
        {isPlaceholderLink ? (
          <span className={`mt-4 inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold ${RESOURCE_CTA_CLASS}`}>
            {resource.cta}
            <ArrowRight className="h-4 w-4 shrink-0 text-current" aria-hidden />
          </span>
        ) : (
          <Link
            href={resource.href}
            className={`group mt-4 inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold ${RESOURCE_CTA_CLASS}`}
          >
            {resource.cta}
            <ArrowRight className="h-4 w-4 shrink-0 text-current" aria-hidden />
          </Link>
        )}
      </div>
    </article>
  );
}

export function HomeResourcesShowcase() {
  return (
    <section className="overflow-hidden border-t border-[#071224]/[0.06] bg-[#F7F8FA]">
      <div className="mx-auto max-w-[76rem] px-6 py-12 lg:px-8 lg:py-14">
        <header className="mx-auto max-w-2xl text-center lg:max-w-5xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8923F]">
            Recursos para tu ruta
          </p>
          <h2 className="mt-3 text-[1.9rem] font-semibold leading-[1.15] tracking-tight text-[#071224] sm:text-[2.3rem] lg:text-[2.35rem] lg:whitespace-nowrap xl:text-[2.5rem]">
            Todo lo que necesitas, en un solo lugar.
          </h2>
        </header>

        <div className="relative mt-8 lg:mt-9">
          <div className="-mx-6 overflow-x-auto overflow-y-hidden px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-4 sm:gap-5">
              {HOME_RESOURCES.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
