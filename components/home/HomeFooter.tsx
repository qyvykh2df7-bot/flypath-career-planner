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
  { label: "Recursos gratuitos", href: "/recursos" },
] as const;

const FOOTER_COMPANY_LINKS = [
  { label: "Contacto", href: "/contacto" },
  { label: "Política de privacidad", href: "/politica-de-privacidad" },
  { label: "Política de cookies", href: "/politica-de-cookies" },
  { label: "Términos y condiciones", href: "/terminos-y-condiciones" },
] as const;

const FOOTER_LINK_CLASS =
  "text-[14px] font-medium leading-[1.4] text-white/65 transition hover:text-[#f2ddaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1a33] max-sm:text-[13px]";

const FOOTER_COLUMN_TITLE_CLASS =
  "text-[12px] font-semibold uppercase tracking-[0.14em] text-[#D6AE4F]";

function FooterLinkItem({ label, href }: { label: string; href: string }) {
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
