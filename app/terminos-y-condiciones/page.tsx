import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { createPublicPageMetadata } from "@/lib/seo/public-metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Términos y condiciones | FlyPath",
  description: "Condiciones de uso de los servicios y contenidos de FlyPath.",
  path: "/terminos-y-condiciones",
});

export default function TermsAndConditionsPage() {
  return (
    <LegalPageShell
      eyebrow="Condiciones de uso"
      title="Términos y condiciones"
      description="Estas condiciones regulan el acceso y uso de FlyPath, sus herramientas, contenidos, productos digitales y servicios asociados."
      updatedAt="22 de julio de 2026"
    >
      <h2>Uso del servicio</h2>
      <p>
        FlyPath ofrece herramientas de planificación, información sobre formación aeronáutica,
        contenidos educativos, AeroComms, productos digitales y servicios de mentoría. Debes usar el
        servicio de forma lícita, respetuosa y conforme a estas condiciones.
      </p>

      <h2>Información orientativa</h2>
      <p>
        Los contenidos de FlyPath tienen carácter informativo y educativo. No sustituyen asesoramiento
        profesional financiero, médico, legal, académico ni la información oficial de escuelas,
        autoridades aeronáuticas o aerolíneas. Antes de tomar una decisión económica o formativa,
        verifica las condiciones vigentes directamente con la entidad correspondiente.
      </p>

      <h2>Cuentas y acceso</h2>
      <p>
        Algunas funciones requieren una cuenta FlyPath. Eres responsable de facilitar información
        correcta y de proteger el acceso a tu email. El acceso a AeroComms Pro depende del entitlement
        activo asociado a una suscripción confirmada, no de datos guardados localmente en el navegador.
      </p>

      <h2>Productos, pagos y entregas</h2>
      <p>
        Los precios, condiciones y disponibilidad se muestran antes de iniciar un pago. Los pagos se
        procesan mediante Stripe cuando el producto lo requiere. La confirmación de una página de éxito
        no sustituye la confirmación del pago por el proveedor. Las descargas digitales se entregan de
        forma protegida tras la confirmación correspondiente.
      </p>

      <h2>Mentorías</h2>
      <p>
        Las reservas de mentoría se gestionan mediante Cal.com, que administra disponibilidad,
        calendario, videollamada y sus comunicaciones operativas. Las condiciones específicas de cada
        reserva se muestran durante ese proceso.
      </p>

      <h2>Opiniones de escuelas</h2>
      <p>
        Las opiniones deben ser veraces, respetuosas y relativas a experiencias reales. FlyPath puede
        verificar, moderar, rechazar, ocultar o retirar contenido que incumpla estas condiciones, incluya
        datos personales innecesarios o infrinja derechos de terceros.
      </p>

      <h2>Propiedad intelectual</h2>
      <p>
        Los contenidos, marcas, diseños, informes y materiales de FlyPath están protegidos. No puedes
        reproducir, redistribuir ni explotar comercialmente los materiales sin autorización expresa,
        salvo los usos permitidos por la ley.
      </p>

      <h2>Contacto y cambios</h2>
      <p>
        Para consultas sobre estas condiciones puedes visitar <Link href="/contacto">Contacto</Link>.
        FlyPath podrá actualizar estas condiciones cuando sea necesario; la versión vigente será la
        publicada en esta página.
      </p>
    </LegalPageShell>
  );
}
