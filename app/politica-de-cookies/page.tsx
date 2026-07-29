import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Política de cookies | FlyPath",
  description: "Información sobre cookies y almacenamiento local utilizados por FlyPath.",
  path: "/politica-de-cookies",
});

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Cookies"
      title="Política de cookies"
      description="Explicamos qué tecnologías de almacenamiento utiliza FlyPath y cómo se usan para que el servicio funcione."
      updatedAt="22 de julio de 2026"
    >
      <h2>Qué son las cookies</h2>
      <p>
        Las cookies son pequeños archivos que el navegador guarda para recordar información entre
        solicitudes. FlyPath también utiliza almacenamiento local o de sesión cuando es necesario para
        que determinadas funciones del producto funcionen correctamente.
      </p>

      <h2>Cookies y tecnologías necesarias</h2>
      <p>
        Usamos cookies técnicas para mantener sesiones autenticadas, proteger procesos sensibles y
        completar flujos como la entrega segura de compras. Estas tecnologías son necesarias para el
        funcionamiento de las funciones que solicitas.
      </p>

      <h2>Almacenamiento local</h2>
      <p>
        El navegador puede almacenar preferencias y progreso local de AeroComms, además de datos de
        planificación de Career Planner. Este almacenamiento permite mantener la experiencia local-first
        y no concede acceso Pro ni sustituye la autorización gestionada en servidor.
      </p>

      <h2>Analítica opcional</h2>
      <p>
        La analítica no esencial permanece desactivada hasta que exista consentimiento explícito. Cuando
        se habilite, la preferencia se guardará para recordar tu elección y se explicará antes de activar
        mediciones no necesarias.
      </p>

      <h2>Cómo gestionar estas tecnologías</h2>
      <p>
        Puedes borrar o bloquear cookies desde la configuración de tu navegador. Ten en cuenta que ello
        puede impedir el uso de funciones como iniciar sesión, mantener una sesión, recuperar una compra
        o conservar progreso local.
      </p>

      <h2>Más información</h2>
      <p>
        Para conocer el tratamiento de datos personales asociado, consulta la{" "}
        <Link href="/politica-de-privacidad">Política de privacidad</Link>.
      </p>
    </LegalPageShell>
  );
}
