/** Overrides de costes/lectura/alertas por programa (ficha individual). */
export type SchoolProgramCostOverrides = {
  advertisedPrice: string;
  estimatedCost: string;
  gap: string;
};

export type SchoolProgramContentOverrides = {
  costs?: SchoolProgramCostOverrides;
  alerts?: string[];
  reading?: string;
};

const ADVENTIA_INTEGRATED_ALERTS = [
  "Precio pendiente de actualización.",
  "Tasas oficiales no incluidas.",
  "Coste de expedición de licencia no incluido.",
  "Reembolso limitado o condicionado.",
  "Curso sujeto a mínimo de alumnos.",
  "Confirmar contrato completo antes de pagar.",
];

const ADVENTIA_UNIVERSITY_ALERTS = [
  "Coste total no publicado de forma suficiente.",
  "Requiere solicitar información oficial.",
  "Confirmar licencias y horas de vuelo incluidas.",
  "Confirmar contrato, pagos y reembolso antes de pagar.",
];

const PROFILE_OVERRIDES: Record<string, Record<string, SchoolProgramContentOverrides>> = {
  "adventia-usal": {
    integrated: {
      costs: {
        advertisedPrice: "99.470 €",
        estimatedCost: "105.000 €",
        gap: "5.530 €",
      },
      alerts: ADVENTIA_INTEGRATED_ALERTS,
      reading:
        "Adventia publica bastante información del integrado: precio, pagos, duración, horas, flota, incluidos y financiación. Aun así, el precio aparece pendiente de actualización y hay tasas/costes administrativos y de expedición de licencia que quedan fuera.",
    },
    university: {
      costs: {
        advertisedPrice: "No publicado",
        estimatedCost: "Pendiente",
        gap: "Pendiente",
      },
      alerts: ADVENTIA_UNIVERSITY_ALERTS,
      reading:
        "Ruta universitaria con licencia pendiente de completar. Requiere solicitar información oficial para confirmar coste total, estructura de vuelo, licencias incluidas, horas de vuelo, pagos, financiación, contrato y política de reembolso.",
    },
  },
  "european-flyers": {
    modular: {
      costs: {
        advertisedPrice: "56.425 €",
        estimatedCost: "78.000 €",
        gap: "21.575 €",
      },
      alerts: [
        "La suma de módulos no equivale a una ruta completa desde cero.",
        "Faltan costes como hour building u otros conceptos.",
        "Tasas, skill tests y materiales por confirmar.",
        "Confirmar vigencia de cada precio modular.",
      ],
      reading:
        "Ruta modular publicada por módulos. La estimación FlyPath añade módulos/costes necesarios no publicados y un margen prudente por imprevistos antes de considerar la ruta completa.",
    },
  },
};

export function getSchoolProgramContentOverrides(
  slug: string,
  programId: string,
): SchoolProgramContentOverrides | null {
  return PROFILE_OVERRIDES[slug]?.[programId] ?? null;
}
