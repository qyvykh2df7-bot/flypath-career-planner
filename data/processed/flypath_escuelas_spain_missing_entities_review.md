# Revisión de cobertura - Escuelas España

Fecha: 2026-05-06  
Objetivo: revisar cobertura de `lib/schools/schoolsSpain.ts` frente a `data/processed/flypath_escuelas_spain_entity_index.md` y fuentes oficiales/primarias.

Fuentes usadas en esta revisión:
- `lib/schools/schoolsSpain.ts`
- `data/processed/flypath_escuelas_spain_entity_index.md`
- AESA ATO: https://www.seguridadaerea.gob.es/es/ambitos/formacion-y-examenes/formacion-al-personal-de-vuelo/organizacion-de-entrenamiento-aprobada-ato
- AESA DTO (página oficial DTO): https://www.seguridadaerea.gob.es/en/ambitos/formacion-y-examenes/formacion-al-personal-de-vuelo/organizacion-de-entrenamiento-declarada-dto
- Web oficial DreamAir: https://www.dreamair.net/
- Web oficial BAA Training (Lleida): https://www.baatraining.com/about-us/lleida-alguaire/
- Web Aerofan (actualmente en mantenimiento): https://aerofan.es/
- Pistas secundarias (no fuente principal): búsquedas de AFN/Aeroflota del Noroeste, Gestair, separación EAS/BFS.

---

## 1) Entidades ya presentes en `schoolsSpain.ts`

| slug | name | city | routeType | dataStatus | dataConfidence |
|---|---|---|---|---|---|
| `adventia-usal` | Adventia (European College of Aeronautics) | Salamanca | university_plus_license | partial | low |
| `european-flyers` | European Flyers | Madrid | integrated | partial | low |
| `one-air` | One Air Aviacion | Malaga | integrated | partial | low |
| `eas-barcelona` | EAS Barcelona | Barcelona | integrated | partial | low |
| `barcelona-flight-school` | Barcelona Flight School | Sabadell | integrated | partial | low |
| `cesda-urv` | CESDA / Universitat Rovira i Virgili | Reus | university_plus_license | partial | low |
| `fte-jerez` | FTE Jerez | Jerez de la Frontera | integrated | unknown | low |
| `quality-fly` | Quality Fly | Madrid | integrated | unknown | low |
| `flyby-aviation-academy` | FlyBy Aviation Academy | Burgos | integrated | unknown | low |
| `canavia-flight-school` | Canavia Flight School | Gran Canaria / Tenerife | integrated | unknown | low |
| `corflight-school` | Corflight School | Madrid | integrated | unknown | low |
| `flyschool-air-academy` | Flyschool Air Academy | Madrid / Mallorca | integrated | unknown | low |
| `airpull-aviation-academy` | Airpull Aviation Academy | Requena (Valencia) | integrated | unknown | low |
| `world-aviation-ato` | World Aviation ATO | Málaga / Madrid | modular | unknown | low |
| `aerotec` | AEROTEC Escuela de Pilotos | Madrid / Sevilla / Palma | integrated | unknown | low |
| `aerodynamics-academy` | Aerodynamics Academy | Málaga / Granada / Madrid | integrated | unknown | low |
| `panamedia-escuela-de-pilotos` | Panamedia Escuela de Pilotos | Manises (Valencia) / Mallorca | integrated | unknown | low |
| `aero-link-flight-academy` | Aero Link Flight Academy | Sabadell | integrated | unknown | low |
| `aerotablada` | Aerotablada | Sevilla | modular | unknown | low |
| `aero2mil` | Aero2mil | Sevilla | modular | unknown | low |
| `lecu-aviation` | LECU Aviation | Madrid | modular | unknown | low |
| `aeroclub-barcelona-sabadell` | L'Aeroclub Barcelona-Sabadell | Sabadell | modular | unknown | low |
| `real-aeroclub-gran-canaria` | Real Aeroclub de Gran Canaria | San Bartolomé de Tirajana | modular | unknown | low |
| `real-aero-club-zaragoza` | Real Aero Club de Zaragoza | Zaragoza | modular | unknown | low |
| `universidad-salamanca-grado-piloto` | Universidad de Salamanca (Grado Piloto) | Salamanca | university_plus_license | unknown | low |
| `uam-gestion-aeronautica` | UAM - Grado en Gestión Aeronáutica | Madrid | university_plus_license | unknown | low |
| `uab-gestion-aeronautica` | UAB - Grado en Gestión Aeronáutica | Sabadell (Barcelona) | university_plus_license | unknown | low |
| `upm-gestion-operaciones-transporte-aereo` | UPM - Grado en Gestión y Operaciones del Transporte Aéreo | Madrid | university_plus_license | unknown | low |

Total actual en dataset: **28**

---

## 2) Entidades detectadas en el índice pero no importadas todavía

Resultado de contraste directo índice vs dataset actual:
- **No hay entidades del índice pendientes de importar**.
- Diferencia de conteo (29 vs 28): el índice declara 29, pero la tabla de entidades contiene 28 filas reales.

---

## 3) Entidades nuevas faltantes (fuera del índice actual) para añadir o verificar

### Tabla de recomendación

| nombre oficial | slug sugerido | ciudad | CCAA | base/aeropuerto | web oficial | tipo_entidad | tipo_formación_detectada | prioridad | motivo | estado recomendado | notas duplicado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DreamAir | `dreamair` | Barcelona / Sabadell | Catalunya | Sabadell (LELL) | https://www.dreamair.net/ | ATO | PPL, LAPL, UAS, otro | media | Web oficial visible; foco claro en PPL/privado, útil para mapa amplio | add_minimal_now | No duplicada |
| AFN / Aeroflota del Noroeste (AFN Grupo / Atlantic Air Academy) | `afn-aeroflota-del-noroeste` | Culleredo (A Coruña) | Galicia | Aeropuerto de A Coruña (Alvedro) | https://afngrupo.com/en/ *(verificación parcial por timeout)* | ATO (probable) | integrado/modular (pendiente verificar en fuente oficial directa) | alta | Cobertura Galicia + entidad pedida explícitamente | research_before_add | No mezclar con Aerofan |
| Gestair Flying Academy | `gestair-flying-academy` | Madrid | Comunidad de Madrid | Cuatro Vientos (por fuentes secundarias) | **pendiente de confirmar URL oficial vigente de academia** | dudosa | ATPL/CPL/IR (pendiente confirmar) | media | Aparece en fuentes secundarias, pero falta trazabilidad oficial clara actual | research_before_add | Tratar separada de AFN/Aerofan |
| BAA Training Spain (Lleida/Barcelona training) | `baa-training-spain` | Lleida / Barcelona | Catalunya | Lleida-Alguaire | https://www.baatraining.com/about-us/lleida-alguaire/ | centro_training | Ab-initio / formación de aerolínea (pendiente alcance exacto para comparador escuelas) | media | Entidad real con infraestructura en España, validar encaje funcional en comparador de escuelas iniciales | research_before_add | No duplicada |
| Aerofan | `aerofan` | Madrid | Comunidad de Madrid | Cuatro Vientos | https://aerofan.es/ *(sitio en construcción)* | dudosa | PPL/ATPL teórico (según fuentes secundarias) | media | Existe entidad separada, pero fuente oficial operativa insuficiente hoy | research_before_add | **Separada de AFN** |

### Otras líneas de cobertura oficial pendientes

- ATOs/DTOs de AESA:
  - La página ATO sí publica enlace a PDF oficial (`atos.pdf`).
  - La página DTO consultada no mostró en esta pasada un listado descargable de DTOs equivalente con nombres, por lo que queda revisión adicional de trazabilidad DTO.
- Recomendación: siguiente revisión debe recorrer el PDF oficial de ATOs de AESA y detectar entidades españolas no presentes en dataset para cerrar huecos estructurales.

---

## 4) Confirmaciones explícitas obligatorias

1. **EAS Barcelona vs Barcelona Flight School**  
   - Confirmación: **entidades separadas**.  
   - Evidencia práctica en dataset y webs distintas:
     - `eas-barcelona` (dominio `easbcn.com`)
     - `barcelona-flight-school` (dominio `barcelonaflightschool.com`)
   - Estado: mantener separadas (no duplicar).

2. **DreamAir**  
   - Confirmación: debe entrar como escuela con foco **PPL/privado** (y formación relacionada), según web oficial.
   - Recomendación actual: `add_minimal_now`.

3. **AFN / Aeroflota del Noroeste**  
   - Confirmación semántica: **AFN se refiere a Aeroflota del Noroeste** (no Aerofan).
   - Estado: entidad plausible y relevante; en esta pasada faltó carga completa de página oficial (timeout), por eso `research_before_add` antes de importación.

4. **Aerofan**  
   - Confirmación: tratar como entidad **separada** de AFN.
   - Web oficial detectada (`aerofan.es`) está en mantenimiento; falta contenido verificable.
   - Estado recomendado: `research_before_add`.

---

## Resumen de cobertura y próximos pasos

- Entidades faltantes recomendadas para **add_minimal_now**: **1**
  - DreamAir

- Entidades faltantes que requieren **research_before_add**: **4**
  - AFN / Aeroflota del Noroeste
  - Gestair Flying Academy
  - BAA Training Spain
  - Aerofan

- Entidades marcadas como **duplicate_existing**: **0**
  - (EAS y BFS confirmadas separadas)

- Entidades recomendadas **ignore_for_now**: **0**  
  - (BAA podría pasar a `ignore_for_now` si se decide que no encaja por alcance de training center vs escuela inicial, pero hoy queda en `research_before_add`)

### Lista recomendada para siguiente batch de importación mínima

1. DreamAir (`add_minimal_now`)
2. AFN / Aeroflota del Noroeste (si se confirma web y alcance formativo con fuente oficial)
3. Aerofan (solo tras confirmación oficial operativa)

### Evaluación general

El dataset actual es **amplio respecto al índice interno**, pero **todavía faltan fuentes oficiales externas por revisar sistemáticamente** (especialmente cruce completo con listado ATO/DTO oficial AESA y verificación de entidades nuevas en Galicia/Madrid/Barcelona como AFN, DreamAir, Aerofan, Gestair y BAA Training Spain).

