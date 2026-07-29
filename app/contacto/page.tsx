import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Contacto | FlyPath",
  description: "Canales de contacto y soporte de FlyPath.",
  path: "/contacto",
});

export default function ContactPage() {
  return (
    <LegalPageShell
      eyebrow="Contacto"
      title="Estamos aquí para ayudarte"
      description="Escríbenos para consultas generales, soporte de productos, privacidad o incidencias relacionadas con FlyPath."
      updatedAt="22 de julio de 2026"
    >
      <h2>Canal de contacto</h2>
      <p>
        Puedes escribir a <a href="mailto:info@flypath.es">info@flypath.es</a>. Indica el producto o
        servicio relacionado para que podamos orientarte mejor.
      </p>

      <h2>Soporte de compras y suscripciones</h2>
      <p>
        Para una descarga digital, Career Planner Premium o AeroComms Pro, incluye en tu mensaje el
        email utilizado en la compra y una descripción breve del problema. No envíes datos de tarjeta ni
        información sensible por email.
      </p>

      <h2>Privacidad y comunicaciones</h2>
      <p>
        Puedes usar este mismo canal para ejercer derechos sobre tus datos personales o solicitar ayuda
        con tus preferencias de email. Consulta también nuestra Política de privacidad y la página de
        baja incluida en las comunicaciones comerciales.
      </p>

      <h2>Mentorías</h2>
      <p>
        Las reservas de mentoría se realizan mediante Cal.com. Para incidencias relacionadas con una
        reserva ya creada, indícanos la fecha de la sesión y el email de reserva, sin incluir información
        de pago.
      </p>
    </LegalPageShell>
  );
}
