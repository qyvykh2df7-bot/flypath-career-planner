import Link from "next/link";
import { Mail } from "lucide-react";

const CONTACT_EMAIL = "info@flypath.es";

const FOOTER_TOOLS_LINKS = [
  { label: "Career Planner", href: "/career-planner" },
  { label: "Comparador de escuelas", href: "/schools" },
  { label: "Mentorías", href: "/mentorias" },
  { label: "AeroComms", href: "/aerocomms" },
] as const;

const FOOTER_RESOURCES_LINKS = [
  { label: "Guía Cómo ser piloto", href: "/guia-como-ser-piloto" },
  { label: "Blog", href: "/blog" },
  { label: "Pre-PPL", href: "#" },
  { label: "Recursos gratuitos", href: "/recursos" },
] as const;

// TODO: sustituir href placeholder por rutas reales cuando existan.
const FOOTER_COMPANY_LINKS = [
  { label: "Sobre FlyPath", href: "#" },
  { label: "Contacto", href: "#" },
  { label: "Soporte", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Política de privacidad", href: "#" },
  { label: "Términos del servicio", href: "#" },
] as const;

// TODO: sustituir href placeholder por URLs reales de redes sociales.
const SOCIAL_LINKS = [
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "TikTok", href: "#", Icon: TikTokIcon },
  { label: "YouTube", href: "#", Icon: YouTubeIcon },
] as const;

const FOOTER_LINK_CLASS =
  "text-[14px] font-medium leading-[1.4] text-white/65 transition hover:text-[#f2ddaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a33] max-sm:text-[13px]";

const FOOTER_COLUMN_TITLE_CLASS =
  "text-[12px] font-semibold uppercase tracking-[0.14em] text-[#D6AE4F]";

const SOCIAL_BUTTON_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-white/65 transition hover:border-[#D6AE4F]/55 hover:text-[#f2ddaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a33] sm:h-9 sm:w-9";

function FooterLinkItem({ label, href }: { label: string; href: string }) {
  if (href === "#") {
    return (
      <a href="#" className={FOOTER_LINK_CLASS}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={FOOTER_LINK_CLASS}>
      {label}
    </Link>
  );
}

function FooterLinkColumn({
  title,
  links,
  mobileTwoColumn = false,
  className = "",
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
  mobileTwoColumn?: boolean;
  className?: string;
}) {
  return (
    <nav aria-label={title} className={className}>
      <h3 className={FOOTER_COLUMN_TITLE_CLASS}>{title}</h3>
      <ul
        className={`mt-3 space-y-2.5 max-sm:space-y-2 ${
          mobileTwoColumn
            ? "max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-4 max-sm:gap-y-2 max-sm:space-y-0"
            : ""
        }`}
      >
        {links.map((link) => (
          <li key={link.href + link.label}>
            <FooterLinkItem label={link.label} href={link.href} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function FooterContactColumn({ className = "" }: { className?: string }) {
  return (
    <div aria-label="Contacto" className={className}>
      <h3 className={FOOTER_COLUMN_TITLE_CLASS}>Contacto</h3>
      <div className="mt-3 space-y-3">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex min-w-0 items-center gap-1.5 text-[14px] font-medium leading-[1.4] text-white/65 transition hover:text-[#f2ddaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a33] max-sm:text-[13px]"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {CONTACT_EMAIL}
        </a>

        <div className="flex items-center gap-2">
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <a key={label} href={href} aria-label={label} className={SOCIAL_BUTTON_CLASS}>
              <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0f1a33]">
      <div className="mx-auto max-w-[76rem] px-6 pb-7 pt-12 lg:px-8 lg:pb-9 lg:pt-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-x-8 sm:gap-y-7 lg:grid-cols-4 lg:gap-x-10">
          <FooterContactColumn className="col-span-2 lg:col-span-1" />
          <FooterLinkColumn title="Herramientas" links={FOOTER_TOOLS_LINKS} />
          <FooterLinkColumn title="Recursos" links={FOOTER_RESOURCES_LINKS} />
          <FooterLinkColumn
            title="Empresa"
            links={FOOTER_COMPANY_LINKS}
            mobileTwoColumn
            className="col-span-2 lg:col-span-1"
          />
        </div>

        <div className="mt-6 flex flex-col gap-1.5 border-t border-white/10 pt-4 text-[12px] leading-[1.4] text-white/40 max-sm:mt-5 max-sm:pt-3.5 max-sm:text-[11px] sm:flex-row sm:items-center sm:justify-between sm:pt-5">
          <p>© {new Date().getFullYear()} FlyPath. Todos los derechos reservados.</p>
          <p>Hecho para futuros pilotos.</p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.75" />
      <circle cx="17.2" cy="6.8" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82a4.28 4.28 0 0 1-.97-2.8 4.25 4.25 0 0 1-2.5-1.02v8.01a5.99 5.99 0 1 1-5.18-5.94v2.05a3.94 3.94 0 1 0 2.86 3.79V3h2.05a4.25 4.25 0 0 0 3.74 2.82Z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M22.5 8.2a2.6 2.6 0 0 0-1.83-1.84C18.88 6 12 6 12 6s-6.88 0-8.67.36A2.6 2.6 0 0 0 1.5 8.2 27.1 27.1 0 0 0 1.5 12a27.1 27.1 0 0 0 .36 3.8 2.6 2.6 0 0 0 1.83 1.84C5.12 18 12 18 12 18s6.88 0 8.67-.36a2.6 2.6 0 0 0 1.83-1.84A27.1 27.1 0 0 0 22.5 12a27.1 27.1 0 0 0-.36-3.8Z" />
      <path d="m9.75 15.02 5.75-3.02-5.75-3.02v6.04Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
