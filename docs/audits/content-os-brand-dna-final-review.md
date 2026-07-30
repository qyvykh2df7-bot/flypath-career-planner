# Auditoría independiente — Content OS 12A.7

**Fecha:** 2026-07-30
**Alcance:** Brand DNA + Historical Content Library antes de aplicar `20260729150000_add_content_os_brand_dna_and_historical_library.sql` en Supabase remoto.

## Veredicto

**APROBADO** para pasar a la revisión de esquema remoto, aplicación trazable de la migración y QA sintético posterior.

No se detectan problemas críticos o mayores en la implementación local. La migración no se ha aplicado durante esta auditoría y el informe no sustituye la comprobación del esquema real remoto.

## Resumen de hallazgos

| Área | Resultado | Severidad |
|---|---|---|
| Integración con Content OS y Warhome | Correcta | OK |
| Separación de contenido planificado e histórico | Correcta | OK |
| Brand DNA consumido por el Strategist | Correcto | OK |
| Migración y RPC | Coherentes e idempotentes a nivel nominal | OK |
| RLS, ACL y acceso server-side | Cerrados | OK |
| Importación histórica y métricas | Atómica y validada | OK |
| Pilares personalizados frente a salida cerrada del Strategist | Observación no bloqueante | MINOR |
| Validación contra Supabase remoto | Pendiente de aplicación/QA | OPERATIVO |

## 1. Arquitectura

12A.7 reutiliza el modelo actual de Content OS y no crea una aplicación, un workspace ni un sistema de permisos paralelo.

- Brand DNA se expone en `/warhome/content/brand`.
- La importación histórica vive en `/warhome/content/library/import`.
- La biblioteca existente se divide visualmente entre `planned` y `historical`.
- Las Server Actions permanecen en `app/warhome/(protected)/content/actions.ts`.
- La persistencia se mantiene en módulos server-only con `getSupabaseAdmin()`.
- La navegación y el layout protegido siguen siendo los de Warhome.

La separación de origen queda almacenada en `content_items.content_origin`. Las piezas futuras y las promovidas desde ideas usan `planned`; las publicaciones importadas usan `historical` y quedan obligatoriamente en estado `published`.

La lectura del calendario filtra explícitamente `content_origin = 'planned'`, por lo que importar histórico no crea bloques editoriales ni introduce publicaciones anteriores en la planificación operativa.

**Resultado: OK.**

## 2. Migración y modelo de datos

### `content_brand_profiles`

La tabla es un perfil singleton por `workspace_key`, cerrado por constraint a `pilotfeliu`. Contiene:

- identidad y descripción;
- audiencias;
- contexto de productos;
- pilares;
- objetivos;
- estilo, personalidad, comunicación y límites de tono;
- autoría y timestamps.

La migración inserta valores iniciales con `ON CONFLICT (workspace_key) DO NOTHING`, de modo que una aplicación nominal no sobrescribe una configuración existente.

### Extensión de `content_items`

Se añaden:

- `content_origin`;
- `source_url`;
- `content_pillar`;
- `related_product_key`.

La migración conserva la tabla y sus relaciones existentes. Las constraints diferencian plataformas permitidas para contenido planificado e histórico, exigen estado publicado y fecha de publicación para histórico, validan URL HTTP/HTTPS, productos cerrados y longitudes máximas.

Se añade un índice por workspace, origen y fecha de publicación.

### Extensión de `content_metrics`

Se añade `saves` con valor inicial cero y se mantiene el límite no negativo y máximo para todas las métricas. La relación existente con `content_items` conserva el aislamiento privado del workspace.

### RPCs

`upsert_content_os_brand_profile`:

- es `SECURITY DEFINER`;
- fija `search_path = public, pg_temp`;
- valida administrador Warhome activo con rol `admin` u `owner`;
- actualiza únicamente el perfil `pilotfeliu`;
- conserva el `created_by` en actualizaciones.

`import_content_os_historical_item`:

- valida título, plataforma, fecha, URL, contexto, producto y métricas;
- inserta una pieza histórica publicada;
- crea opcionalmente su snapshot inicial de métricas;
- realiza ambas operaciones en la misma transacción;
- devuelve únicamente el UUID de la pieza creada.

Las funciones se crean con `CREATE OR REPLACE`; tabla, columnas, trigger e índice usan patrones nominalmente idempotentes. La aplicación remota debe comprobar previamente que las entidades base de Content OS tienen la estructura esperada, especialmente `content_items`, `content_metrics` y `set_content_os_updated_at()`.

**Resultado: OK, pendiente de verificación remota.**

## 3. Seguridad

La protección de acceso es consistente con Warhome:

- las páginas están bajo el layout protegido;
- `getContentOsBrandProfile`, `upsertContentOsBrandProfile` e importación exigen `requireWarhomeAdmin()`;
- las funciones de datos están marcadas `server-only`;
- los componentes cliente solo reciben datos de presentación y Server Actions;
- la RPC vuelve a validar el administrador dentro de la base de datos;
- `content_brand_profiles` habilita RLS y revoca acceso a `PUBLIC`, `anon` y `authenticated`;
- las RPC revocan `EXECUTE` a `PUBLIC`, `anon` y `authenticated` y solo lo conceden a `service_role`;
- no existe una ruta pública para leer o escribir Brand DNA o histórico;
- no se almacenan prompts, respuestas crudas del proveedor ni secretos;
- las URL históricas solo aceptan `http` y `https` y se renderizan como enlaces React normales.

El helper interno `loadContentOsBrandProfile()` no repite la comprobación de Warhome porque se utiliza como dependencia server-only del flujo Strategist, que ya llama a `requireWarhomeAdmin()`. La API pública de lectura y la escritura sí mantienen la autorización explícita.

**Resultado: OK.**

## 4. Flujo funcional

### Brand DNA

El formulario permite crear y editar:

- nombre y descripción de PilotFeliu;
- audiencias separadas por líneas;
- contexto de productos;
- pilares;
- objetivos de crecimiento, comunidad, autoridad y conversión;
- estilo, personalidad, comunicación y aspectos a evitar.

La acción valida el `FormData`, llama a la RPC autorizada y revalida las superficies de Content OS.

### Biblioteca histórica

El flujo “Importar contenido publicado” permite:

- título, plataforma y fecha obligatorios;
- URL opcional;
- descripción, hook, CTA y pilar;
- objetivo y producto relacionado;
- visualizaciones, likes, comentarios, compartidos, guardados, seguidores, leads y ventas.

El contenido importado aparece en la sección “Histórico publicado”, separado de “En producción”. No se ofrece como una pieza futura, no entra en el calendario operativo y no se convierte en idea o evento.

La biblioteca mantiene la creación normal de nuevas piezas y la conversión existente de ideas sin mezclar su origen.

**Resultado: OK.**

## 5. Integración con AI Content Strategist

`loadStrategyContext()` carga conjuntamente:

- Brand DNA persistido;
- ideas existentes;
- piezas de `content_items`, incluidas las históricas;
- la métrica más reciente de cada pieza, incluyendo `saves`.

El contexto enviado al Strategist incluye identidad, descripción, audiencias, productos, pilares, objetivos, tono y límites profesionales. También incluye los metadatos del histórico: origen, plataforma, hook, pilar, producto y métricas.

La integración conserva:

- salida JSON estructurada;
- validación local del contrato;
- `store: false`;
- límite de generación;
- revisión manual de propuestas;
- ausencia de publicación, calendario automático, APIs sociales o agentes autónomos.

El histórico sirve como contexto editorial y no se deriva al Planner ni al calendario.

### Observación MINOR — taxonomía de salida

El Brand DNA permite introducir pilares personalizados, mientras que el campo `pillar` de la salida del Strategist sigue limitado a la taxonomía cerrada existente. Los pilares personalizados sí se envían como contexto y no rompen el flujo, pero el Strategist no puede devolverlos como valor estructurado hasta una futura ampliación del contrato.

No bloquea la migración ni el MVP actual; conviene decidirlo antes de permitir una taxonomía de pilares más abierta.

## 6. Datos estratégicos cubiertos

La configuración inicial contempla los cuatro productos requeridos:

- guía “Cómo ser Piloto” y recursos educativos;
- Career Planner;
- AeroComms;
- mentorías.

También cubre los pilares solicitados:

- vida de piloto/lifestyle;
- formación;
- escuelas;
- carrera aeronáutica;
- entrevistas;
- errores comunes;
- inglés aeronáutico y ATC/fraseología;
- historias personales;
- productos.

Las audiencias iniciales incluyen futuros pilotos, estudiantes, pilotos jóvenes y personas interesadas en la carrera aeronáutica.

**Resultado: OK.**

## 7. Riesgos y comprobaciones pendientes

No hay bloqueos de código identificados. Antes de aplicar remotamente se debe:

1. verificar que la migración base de Content OS y sus constraints están presentes;
2. comprobar que no existe una tabla o constraint incompatible con los nombres nuevos;
3. aplicar la migración en el flujo habitual del repositorio;
4. confirmar RLS, ACL, funciones, índices y columnas en Supabase;
5. realizar QA sintético de edición Brand DNA, importación histórica con y sin métricas, separación del calendario, consumo del Strategist e idempotencia nominal;
6. eliminar todos los datos sintéticos de QA.

La migración es transaccional, pero la reejecución nominal de sus `DROP CONSTRAINT`/`ADD CONSTRAINT` debe validarse en un entorno controlado si existiera una aplicación parcial previa. No se debe asumir que `IF NOT EXISTS` puede corregir una tabla remota preexistente con estructura incompatible.

## 8. Archivos revisados

- `docs/ai/content-os/pilotfeliu-content-os-command-center.md`
- `ROADMAP.md`
- `CURRENT_PHASE.md`
- `ACTIVE_TASK.md`
- `LAST_SESSION.md`
- `supabase/migrations/20260729150000_add_content_os_brand_dna_and_historical_library.sql`
- `lib/warhome/content-os-brand-contract.ts`
- `lib/warhome/content-os-brand.ts`
- `lib/warhome/content-os-history-contract.ts`
- `lib/warhome/content-os-history.ts`
- `lib/warhome/content-os-strategy.ts`
- `components/warhome/content/ContentBrandProfileForm.tsx`
- `components/warhome/content/ContentHistoricalImportForm.tsx`
- `components/warhome/content/ContentLibrary.tsx`
- `app/warhome/(protected)/content/actions.ts`
- `lib/warhome/content-os.ts`
- `lib/warhome/auth.ts`

## Estado de cambios

- Archivo creado: `docs/audits/content-os-brand-dna-final-review.md`.
- Archivos de código modificados durante esta auditoría: ninguno.
- Migraciones modificadas durante esta auditoría: ninguna.
- Migración Supabase remota aplicada durante esta auditoría: no.
- Commit o push: no.
