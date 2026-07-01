import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Career Planner", href: "/career-planner" },
  { label: "Guía Cómo ser piloto", href: "/guia-como-ser-piloto" },
  { label: "Escuelas", href: "/escuelas" },
  { label: "AeroComms", href: "/aerocomms" },
  { label: "Mentorías", href: "/mentorias" },
  { label: "Blog", href: "/blog" },
] as const;

export function HomeFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#06111F]">
      <div className="mx-auto max-w-[76rem] px-6 py-10 lg:px-8 lg:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="text-[15px] font-semibold tracking-tight text-white">FlyPath</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/55">
              Tu copiloto durante toda tu ruta en aviación. Planifica, compara y decide con
              criterio antes de pagar una matrícula.
            </p>
          </div>

          <nav aria-label="Enlaces de FlyPath" className="grid grid-cols-2 gap-x-8 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-white/65 transition hover:text-[#f2ddaa]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FlyPath. Todos los derechos reservados.</p>
          <p>Hecho para futuros pilotos.</p>
        </div>
      </div>
    </footer>
  );
}
