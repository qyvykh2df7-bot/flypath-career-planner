import type { BlogPostMeta } from "./blog-types";

export type BlogCtaVariant = "routes" | "english" | "atpl" | "class1";

export type BlogCtaContent = {
  variant: BlogCtaVariant;
  title: string;
  text: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

const ROUTES_CTA: BlogCtaContent = {
  variant: "routes",
  title: "¿Quieres revisar tu ruta antes de tomar una decisión?",
  text: "Si estás comparando escuelas, costes o rutas de formación, empieza por la guía o reserva una mentoría FlyPath para revisar tu caso.",
  primary: { label: "Ver guía", href: "/guia-como-ser-piloto" },
  secondary: { label: "Reservar mentoría", href: "/mentorias" },
};

const ENGLISH_CTA: BlogCtaContent = {
  variant: "english",
  title: "¿El inglés te está frenando?",
  text: "Si quieres practicar speaking, fraseología o comunicaciones ATC, puedes ver las clases de inglés aeronáutico FlyPath.",
  primary: { label: "Ver clases de inglés", href: "/ingles-aeronautico" },
  secondary: { label: "Reservar mentoría", href: "/mentorias" },
};

const ATPL_CTA: BlogCtaContent = {
  variant: "atpl",
  title: "¿Necesitas ayuda con tus asignaturas?",
  text: "Si una asignatura se te está atascando, puedes reservar una clase PPL/ATPL para resolver dudas y preparar el estudio con más orden.",
  primary: { label: "Ver clases PPL/ATPL", href: "/clases-ppl-atpl" },
  secondary: { label: "Ver guía", href: "/guia-como-ser-piloto" },
};

const CLASS1_CTA: BlogCtaContent = {
  variant: "class1",
  title: "¿Quieres revisar tu ruta antes de tomar una decisión?",
  text: "Si estás comparando escuelas, costes o rutas de formación, empieza por la guía o reserva una mentoría FlyPath para revisar tu caso.",
  primary: { label: "Ver guía", href: "/guia-como-ser-piloto" },
  secondary: { label: "Reservar mentoría", href: "/mentorias" },
};

const ATPL_SLUGS = new Set([
  "que-es-atpl",
  "como-organizar-atpl",
  "errores-estudiando-atpl",
  "bancos-preguntas-atpl",
  "que-es-ppl",
]);

export function getBlogCtaForPost(post: Pick<BlogPostMeta, "category" | "slug">): BlogCtaContent {
  if (post.category === "Inglés aeronáutico") return ENGLISH_CTA;
  if (post.category === "Clase 1") return CLASS1_CTA;
  if (post.category === "ATPL" || ATPL_SLUGS.has(post.slug)) return ATPL_CTA;
  return ROUTES_CTA;
}
