/**
 * Rutas de mockup para la Home (orden = prioridad).
 * Añade el archivo en /public y se usará automáticamente el primero que exista.
 */
export const HOME_PRODUCT_MOCKUPS = {
  careerPlanner: {
    placeholderLabel: "Career Planner",
    alt: "Captura del Career Planner de FlyPath",
    candidates: [
      "/career-planner.jpg",
      "/career-planner.png",
      "/planner.jpg",
    ],
  },
  schoolsComparator: {
    placeholderLabel: "Comparador de escuelas",
    alt: "Captura del comparador de escuelas de FlyPath",
    candidates: ["/comparador.jpg", "/schools.jpg", "/escuelas.jpg"],
  },
  atplPlanner: {
    placeholderLabel: "ATPL Planner",
    alt: "Captura del ATPL Planner de FlyPath",
    candidates: ["/atpl-planner.jpg", "/atpl-planner.png", "/atpl.jpg"],
  },
} as const;

export type HomeProductMockupId = keyof typeof HOME_PRODUCT_MOCKUPS;
