# Lógica automática de tipos de sesión (planificación)

**Fuente de verdad:** `lib/study-planner/planning/subject-maturity.ts` vía `session-type-picker.ts`.

## Qué existe hoy

- **Fases por asignatura** (`getSubjectMaturityPhase`): initial → building → consolidation → review → exam, según teoría acumulada, errores/repasos pendientes y proximidad de examen.
- **Tipo por bloque** (`pickSessionTypeForMaturity`): secuencias por fase; interceptos globales para errores pendientes, repasos atrasados y simulacro en fase examen.
- **Prioridad de asignaturas** (`planning-engine.ts`): score por progreso, mock, recencia y examen; reparto de minutos y bloques 90/60/45.
- **`class`**: solo manual (calendario / formulario); el motor **no** asigna clases automáticamente.

## Reglas resumidas

| Señal | Efecto típico |
|--------|----------------|
| Errores pendientes | `error_correction` (slot limitado) |
| Repasos pendientes / fase review | `review` |
| Examen cercano / mock bajo | `mock` en fase exam |
| Mucha teoría sin banco | `question_bank` en consolidation |
| Inicio de asignatura | `theory` |

## Qué falta (no implementar aún)

- Recomendación automática al **añadir sesión manual** en calendario (el usuario elige tipo).
- Integración Cal.com / disponibilidad real para Clase PPL/ATPL.
- Registro de errores/repasos **directamente** desde completar sesión en calendario (sigue en Evaluación / Registro).
