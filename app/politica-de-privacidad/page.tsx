import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Política de privacidad | FlyPath",
  description: "Información sobre el tratamiento de datos personales en FlyPath.",
  path: "/politica-de-privacidad",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacidad"
      title="Política de privacidad"
      description="Esta política explica qué datos tratamos, para qué los usamos y cómo puedes ejercer tus derechos al utilizar FlyPath."
      updatedAt="22 de julio de 2026"
    >
      <h2>Responsable y contacto</h2>
      <p>
        FlyPath es responsable del tratamiento de los datos personales recogidos a través de este
        sitio. Para cualquier consulta sobre privacidad puedes escribir a{" "}
        <a href="mailto:info@flypath.es">info@flypath.es</a>.
      </p>

      <h2>Datos que podemos tratar</h2>
      <ul>
        <li>Datos de cuenta, como email y nombre, cuando creas o utilizas una cuenta FlyPath.</li>
        <li>Datos de contacto que envías en formularios, listas de espera o solicitudes de mentoría.</li>
        <li>Datos necesarios para prestar los productos y servicios que solicitas, incluido tu progreso en AeroComms cuando eliges sincronizarlo con tu cuenta.</li>
        <li>Datos asociados a compras y suscripciones. FlyPath no almacena los datos completos de tu tarjeta.</li>
        <li>Información técnica y de seguridad necesaria para operar el servicio y prevenir abusos.</li>
        <li>Datos que aportas al enviar una opinión de escuela o una solicitud de eliminación de esa opinión.</li>
      </ul>

      <h2>Finalidades y base jurídica</h2>
      <ul>
        <li>Prestar los servicios solicitados y gestionar tu cuenta, pedidos, descargas y suscripciones.</li>
        <li>Responder a tus consultas y gestionar reservas de mentoría.</li>
        <li>Enviar comunicaciones comerciales solo cuando hayas dado tu consentimiento; puedes retirarlo en cualquier momento.</li>
        <li>Proteger el servicio, prevenir fraude y cumplir obligaciones legales aplicables.</li>
        <li>Publicar opiniones de escuelas únicamente conforme al flujo de verificación y moderación previsto por FlyPath.</li>
      </ul>

      <h2>Proveedores que intervienen</h2>
      <p>
        Utilizamos proveedores que actúan como encargados o prestadores necesarios para el servicio:
        Vercel para alojamiento y entrega de la aplicación, Supabase para infraestructura de datos y
        autenticación, Stripe para pagos, Resend para comunicaciones transaccionales y Cal.com para
        reservas de mentoría. Cada proveedor trata datos según su propia documentación y las
        salvaguardas aplicables.
      </p>

      <h2>Conservación</h2>
      <p>
        Conservamos los datos mientras sean necesarios para prestar el servicio, atender obligaciones
        legales, resolver incidencias o defender posibles reclamaciones. Las comunicaciones comerciales
        se mantienen hasta que retires tu consentimiento o solicites su supresión.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Puedes solicitar acceso, rectificación, supresión, oposición, limitación del tratamiento o
        portabilidad escribiendo a <a href="mailto:info@flypath.es">info@flypath.es</a>. También puedes
        presentar una reclamación ante la Agencia Española de Protección de Datos si consideras que el
        tratamiento no se ajusta a la normativa aplicable.
      </p>

      <h2>Cookies y almacenamiento local</h2>
      <p>
        Consulta nuestra <Link href="/politica-de-cookies">Política de cookies</Link> para conocer el
        uso de cookies técnicas, preferencias y almacenamiento local del navegador.
      </p>

      <h2>Actualizaciones</h2>
      <p>
        Podremos actualizar esta política para reflejar cambios legales o del servicio. Publicaremos la
        fecha de la última actualización en esta página.
      </p>
    </LegalPageShell>
  );
}
