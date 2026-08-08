# Content OS PilotFeliu - AI Content Command Center

## Estado y propósito

**Estado:** MVP 12A completado dentro de Warhome. El AI Content Strategist 12A.6.3, Brand DNA 12A.7 y TikTok Content Intelligence 12A.8 están aplicados y validados sintéticamente en remoto. TikTok queda pendiente de configuración OAuth y QA con una cuenta real. No hay agentes autónomos ni automatizaciones activas.

Content OS PilotFeliu es una herramienta interna y personal para PilotFeliu. No es un producto SaaS ni una superficie para clientes de FlyPath. Su objetivo es ordenar la creación de contenido de la marca personal y convertirla en una práctica sostenible que ayude a crecer la audiencia y, cuando corresponda, aumente ventas y leads de FlyPath.

La especificación sigue siendo el contrato funcional. La auditoría CRM de Fase 11 está completada y Content OS se ha adelantado como bloque 12A dentro de Warhome, sin activar el resto del Command Center.

## Implementación MVP 12A

La primera implementación reutiliza la autenticación y autorización privadas de Warhome y mantiene todas las lecturas y escrituras de Supabase en servidor.

Superficies:

- `/warhome/content`: calendario semanal por defecto y mensual como vista secundaria.
- `/warhome/content/ideas`: banco de ideas.
- `/warhome/content/library`: biblioteca e histórico.
- `/warhome/content/library/new`: alta de una pieza.
- `/warhome/content/library/[contentId]`: ficha, planificación y métricas.

Modelo:

- `content_items`: catálogo privado existente, ampliado para las piezas PilotFeliu.
- `content_ideas`: ideas manuales y propuestas futuras.
- `content_calendar_events`: bloques de grabación, edición y publicación.
- `content_metrics`: snapshots manuales por pieza y fecha.

Las métricas del MVP son snapshots acumulados. El histórico se conserva por fecha y las superficies de resumen muestran el snapshot más reciente, no la suma entre snapshots.

La migración `20260729120000_create_content_os_pilotfeliu_mvp.sql` está aplicada en Supabase remoto. Mantiene RLS cerrada, revoca acceso a `PUBLIC`, `anon` y `authenticated`, y limita la promoción atómica de ideas a `service_role` y administradores activos de Warhome.

Las columnas `proposal_source` y `proposal_status` preparan el flujo futuro **IA propone -> PilotFeliu revisa -> PilotFeliu decide**. En el MVP las altas manuales quedan aprobadas; no existe generación automática.

## Bloque 12A.6 — Roster y planificador IA MVP

El roster manual y el primer planificador IA están completados como la siguiente capa privada de Content OS. La migración `20260729130000_add_content_os_roster_and_ai_planner.sql` está aplicada en Supabase remoto y el QA sintético remoto está completado.

La disponibilidad registra trabajo, descanso, viaje y franjas disponibles para grabación. Impide solapamientos del mismo tipo y cualquier cruce que incluya trabajo o viaje; una franja de grabación puede quedar dentro de una franja de descanso.

El planificador crea propuestas editoriales de hasta dos semanas a partir del roster, ideas y contenido pendiente. Una propuesta nunca modifica el calendario al generarse: requiere aprobación manual transaccional. Antes de aprobarla se rechazan conflictos con eventos existentes y solapamientos internos. La generación tiene un intervalo mínimo configurable para evitar ejecuciones repetidas accidentales.

Este bloque no introduce un agente autónomo, memoria avanzada, ejecución continua, publicación automática, APIs sociales ni movimientos de calendario sin aprobación.

## Bloque 12A.6.3 — AI Content Strategist MVP

El AI Content Strategist MVP está completado en la aplicación y auditado como una
segunda herramienta de propuesta, separada del planificador. Su pregunta operativa es qué contenido
debería crearse a partir de la marca, la audiencia, los productos y el histórico;
no cuándo debe entrar en calendario.

La configuración estratégica incorpora:

- la identidad y los límites profesionales de PilotFeliu;
- futuros pilotos, estudiantes, pilotos jóvenes y público interesado en aviación;
- guía, Career Planner, AeroComms y mentorías con su función comercial;
- pilares editoriales evolutivos de aviación, carrera, formación, escuelas,
  errores, consejo profesional, inglés, fraseología, historias y comunidad;
- una mezcla configurable de crecimiento, autoridad, comunidad y conversión,
  con reparto inicial 40/30/20/10.

Cada generación produce diez propuestas estructuradas con título, desarrollo,
hook, explicación, plataformas, formato, duración, objetivo, producto opcional,
CTA, prioridad y pilar. El histórico de ideas y piezas, incluidas las publicadas,
se incorpora como contexto y se aplica una deduplicación básica por título
normalizado.

Las propuestas se persisten en el banco existente con estado pendiente. Una RPC
transaccional e idempotente permite guardarlas o rechazarlas. Solo una propuesta
aprobada entra en el banco operativo y puede ser consumida posteriormente por el
Planner IA o convertirse en pieza. Nunca crea eventos de calendario.

La capa usa salida JSON estructurada, `store: false`, autorización Warhome,
`service_role` solo en servidor y un límite independiente de generación. No
persiste prompts, respuestas crudas, memoria de conversación ni datos del
proveedor.

La migración local
`20260729140000_add_content_os_ai_strategist.sql` amplía `content_ideas` con los
metadatos estratégicos, añade la protección de coste y las RPC de creación y
revisión. La auditoría final está aprobada; la migración está aplicada en
Supabase remoto y el QA sintético está completado.

## Bloque 12A.7 — Brand DNA e histórico editorial

La mejora 12A.7 está implementada, aplicada en Supabase remoto y validada
mediante QA sintético. La migración correspondiente es
`20260729150000_add_content_os_brand_dna_and_historical_library.sql`.

Brand DNA mantiene una única configuración privada para el workspace
`pilotfeliu`: identidad, descripción, audiencias, contexto de los cuatro
productos, pilares, objetivos y cuatro campos de tono. Se edita desde Warhome y
el AI Content Strategist recibe esta configuración guardada como contexto; la
configuración estática anterior deja de ser la fuente operativa.

La biblioteca distingue explícitamente:

- `planned`: piezas futuras creadas o promovidas desde ideas;
- `historical`: publicaciones ya existentes, siempre con estado `published`.

El flujo “Importar contenido publicado” guarda título, plataforma, fecha, URL y
contexto editorial opcional. También puede crear en la misma transacción un
snapshot inicial con visualizaciones, likes, comentarios, compartidos,
guardados, seguidores, leads y ventas. El histórico se muestra separado de la
producción futura y enriquece el contexto del Strategist, pero no entra en el
Planner ni crea calendario.

La migración mantiene RLS cerrada, acceso exclusivo de `service_role` y
validación de administrador Warhome dentro de las RPC de edición de Brand DNA e
importación histórica. No añade APIs sociales, publicación automática, AI
Analyst ni autonomía. El QA remoto validó persistencia de Brand DNA, importación
histórica con métricas, aislamiento del calendario, consumo real del Strategist,
permisos y limpieza de los datos sintéticos. La validación local del bloque
registra 858 tests, TypeScript, lint focalizado y build Webpack correctos.

## Bloque 12A.8 — TikTok Content Intelligence MVP

La integración está implementada localmente como una superficie privada en
`/warhome/content/integrations/tiktok`. Usa OAuth web de TikTok con los scopes
cerrados `user.info.basic` y `video.list`, protección `state` en cookie
`HttpOnly` y credenciales exclusivamente server-side. Los access y refresh
tokens se cifran con AES-256-GCM antes de persistirse; nunca se envían al cliente
ni se guardan en claro. La desconexión revoca el acceso mediante OAuth antes de
retirar las credenciales locales.

La sincronización pagina los vídeos públicos de la cuenta y actualiza de forma
idempotente un staging privado por ID TikTok. Conserva URL, caption, hashtags
derivados, fecha, duración y las métricas disponibles en Display API:
visualizaciones, likes, comentarios y compartidos. TikTok no expone guardados o
favoritos mediante esta API; el campo permanece nullable y puede completarse en
la importación manual por URL.

El análisis utiliza Brand DNA y una salida JSON estructurada con `store: false`.
Solo recibe caption, URL, duración y métricas; no descarga ni afirma analizar el
audio o la imagen del vídeo. Propone título, resumen, hook, pilar, objetivo y
producto relacionado. El resultado permanece en una cola independiente:

`TikTok importado -> análisis IA -> revisión humana -> biblioteca histórica`

Solo la confirmación manual crea la pieza `historical` y su snapshot de métricas
mediante una RPC atómica. Rechazar no crea contenido y una propuesta pendiente
no entra en el Planner ni en el calendario. Una vez confirmada, la pieza pasa a
la biblioteca existente y el Strategist la consume por el flujo histórico ya
implantado.

La migración
`20260729160000_add_content_os_tiktok_intelligence.sql` está aplicada en
Supabase remoto: crea `content_tiktok_connections`, `content_tiktok_videos` y
las RPC privadas de conexión, upsert, análisis, revisión y locks de sync/refresh.
El QA sintético remoto validó RLS/ACL, deduplicación, rotación exclusiva,
reintentos IA con máximo de tres intentos y cooldown, revisión humana, métricas
parciales como `NULL` y limpieza sin residuos. La activación real aún requiere
registrar la aplicación y redirect URI en TikTok, aprobar los scopes
`user.info.basic` y `video.list`, y configurar las variables server-side. TikTok
Display API no aporta guardados/favoritos, seguidores ganados, retención, leads
ni ventas; esos valores permanecen manuales o `NULL`. No hay publicación,
respuesta a comentarios, generación de vídeos, AI Analyst ni automatización
autónoma. La validación local actual registra 887 tests correctos, TypeScript,
lint focalizado, build Webpack y `git diff --check`.

### Límites editoriales del MVP

La ficha inicial cubre los campos operativos cerrados para 12A: título, plataforma, objetivo, categoría, hook, guion, CTA, estado, fechas y notas. La persistencia aplica los mismos límites de longitud que el contrato y los formularios para conservar la integridad del contenido.

Quedan diferidos expresamente, sin perder su sitio en la evolución del módulo: audiencia, estructura detallada, cámara, planos, brief de edición, copy, hashtags y retención. No son un requisito cerrado del MVP manual; se incorporarán junto con producción asistida y análisis de plataformas, para no convertir la primera versión en una ficha editorial sobredimensionada.

Los eventos de calendario pertenecen explícitamente al único workspace privado actual, `pilotfeliu`. Cuando se asocian a una pieza, la relación exige además que ambas pertenezcan al mismo workspace; los bloques independientes siguen siendo válidos en ese espacio. Esta separación evita que un futuro módulo interno reutilice sus bloques por accidente, sin introducir equipos, multiusuario ni permisos adicionales.

## Arquitectura dentro de FlyPath

Warhome forma parte de FlyPath Career Planner. Es un Command Center interno y privado, no una aplicación separada. Content OS PilotFeliu es un módulo dentro de Warhome y su entrada está en la barra lateral del Warhome.

Estructura conceptual:

```text
FlyPath Career Planner
└── Warhome
    ├── Dashboard
    ├── CRM
    ├── Leads
    ├── Productos
    ├── Analytics
    └── Content OS PilotFeliu
```

No existe una aplicación separada para Content OS y no existe acceso público.

## Uso privado

- Warhome y Content OS son exclusivamente para PilotFeliu.
- La primera versión no se diseña para equipos.
- No necesita multiusuario.
- No necesita roles ni permisos de usuarios internos.

La autorización reutiliza la protección interna de Warhome. Content OS no introduce usuarios, roles ni permisos paralelos.

## Modelo operativo de agentes IA

Los agentes funcionan de forma semi-autónoma:

**IA propone -> PilotFeliu revisa -> PilotFeliu decide.**

Los agentes pueden:

- preparar propuestas;
- generar planes;
- analizar datos;
- recomendar acciones.

Los agentes no pueden:

- publicar automáticamente;
- mover el calendario sin aprobación;
- ejecutar acciones comerciales sensibles;
- modificar datos críticos sin aprobación.

## 1. Visión del módulo

El módulo debe reunir en un mismo sistema:

- la planificación de tiempo disponible;
- el banco de ideas y experiencias;
- la producción de cada pieza;
- la publicación por plataforma;
- el aprendizaje a partir de resultados.

La IA propone, estructura y prioriza. PilotFeliu conserva siempre la decisión final: puede mover, editar, rechazar o no publicar una propuesta. El sistema no bloquea horarios ni publica contenido automáticamente.

## 2. Alcance

### Incluido

- TikTok PilotFeliu.
- Instagram PilotFeliu.
- Instagram FlyPath.
- YouTube.

### Excluido

- AeroComms.
- Un producto SaaS o cuentas de terceros.
- Publicación automática.
- Bloqueo automático de calendario.
- Cambios a CRM, Warhome, base de datos, pagos o automatizaciones mientras este documento sea solo diseño.

## 3. Identidad de marca

La marca personal se apoya en:

- piloto de medio radio;
- ambición y evolución profesional;
- resiliencia, mentalidad y cercanía;
- historias y cambios personales;
- lifestyle, viajes y deporte.

### Límites editoriales y profesionales

- No tratar política.
- No exponer familia.
- No exponer patrimonio ni dinero personal.
- No crear conflictos con la compañía ni revelar información profesional sensible.
- Respetar siempre las restricciones profesionales, operativas y de seguridad de aviación.

Estos límites deben condicionar las propuestas de ideas, guiones, copies y recomendaciones de IA.

## 4. Objetivos del contenido

Cada pieza debe tener al menos un objetivo principal explícito.

| Objetivo | Qué busca | Señales de aprendizaje |
| --- | --- | --- |
| Crecimiento | Alcance y nuevos seguidores. | Visualizaciones, alcance, compartidos, seguidores ganados. |
| Comunidad | Conexión personal mediante reflexiones, historias y conversaciones. | Comentarios, guardados, compartidos y visitas al perfil. |
| Autoridad | Demostrar experiencia como piloto, educar y aportar contexto de aviación. | Retención, guardados, comentarios cualificados y visitas al perfil. |
| Conversión | Generar ventas o leads de FlyPath de forma natural y relevante. | Leads y ventas asociadas. |

Una pieza puede contribuir a más de un objetivo, pero el sistema debe evitar que la planificación se limite a conversión.

## 5. Plataformas y cadencia orientativa

| Plataforma | Papel | Cadencia orientativa | Tratamiento editorial |
| --- | --- | --- | --- |
| TikTok PilotFeliu | Motor principal de crecimiento. | 4-5 videos por semana. | Contenido directo, historias, aviación, reflexiones y tendencias compatibles con la marca. |
| Instagram PilotFeliu | Lifestyle y marca personal. | Fotos o carruseles cada 2-3 días. | Vida personal pública, viajes, deporte, reflexiones y momentos profesionales permitidos. |
| Instagram FlyPath | Producto, educación y aviación. | Publicaciones cada 2-3 días. | Productos, formación y contenido educativo; PilotFeliu no es el protagonista principal. |
| YouTube | Videos largos y profundos. | Aproximadamente uno cada 3 semanas. | Piezas cuidadas sobre aviación, carrera, historias o educación. |

Las frecuencias son objetivos de planificación, no obligaciones automáticas. La disponibilidad real de roster, viajes y vida personal debe tener prioridad.

## 6. Pilares de contenido

### Aviación

- Vida de piloto.
- Carrera y formación.
- Escuelas y decisiones de formación.
- Costes y planificación profesional.
- Curiosidades y educación aeronáutica.

### Marca personal

- Historias y reflexiones.
- Retos y aprendizajes.
- Cambios vitales y evolución personal.
- Mentalidad, resiliencia y ambición.

### Lifestyle

- Madrid.
- Viajes.
- Deporte.
- Jeep.
- Experiencias compatibles con los límites de marca.

### Deporte

- Pádel.
- Tenis.
- Gym.
- CrossFit.
- Golf.
- Escalada.
- Nuevas experiencias deportivas.

Cada idea debe poder relacionarse con uno o varios pilares, sin forzar la relación si no aporta valor.

## 7. Equipo de creación

Equipo disponible:

- iPhone.
- Sony ZV-E10.
- Micrófono inalámbrico Rode.
- Trípode alto.
- Trípode bajo.
- Foco.

### Reglas de uso

- iPhone para contenido rápido, espontáneo y de baja fricción.
- Sony ZV-E10 para contenido cuidado, lifestyle y YouTube.
- La planificación de producción puede recomendar cámara, audio, luz y planos, pero no debe impedir grabar con el equipo disponible.

## 8. Calendario Content OS

El calendario es la pantalla principal del módulo.

### Vistas

- Vista semanal por defecto.
- Vista mensual disponible.
- Calendario vacío al inicio, sin bloques de ejemplo obligatorios.

### Flujo de trabajo

El MVP permite crear, editar, asociar y mover manualmente bloques de grabación, edición y publicación. El bloque 12A.6 añade roster manual y una primera herramienta de propuesta quincenal:

1. PilotFeliu introduce roster y compromisos relevantes.
2. Pulsa generar calendario.
3. La IA prepara una propuesta separada para las dos semanas siguientes.
4. PilotFeliu revisa y aprueba o rechaza la propuesta.
5. Solo una propuesta aprobada se materializa en el calendario; sus bloques siguen siendo editables.

### Propuestas de la IA

La IA puede sugerir cuándo:

- grabar;
- editar;
- publicar.

No puede:

- bloquear horarios automáticamente;
- publicar automáticamente;
- asumir disponibilidad no introducida por el usuario.

### Roster manual

La disponibilidad se introduce dentro de Warhome, sin calendarios externos, y usa
cuatro tipos cerrados:

- trabajo;
- descanso o día libre;
- viaje;
- disponible para grabación.

Cada franja conserva inicio, fin, zona horaria `Europe/Madrid` y notas opcionales.
El planificador solo puede proponer dentro de franjas de descanso o disponibilidad
de grabación y debe respetar trabajo y viajes como bloqueos.

### Primera capa IA

El planificador es una herramienta server-side de propuesta, no un agente autónomo.
Recibe un contexto acotado de catorce días con roster, ideas activas, piezas
pendientes y objetivos editoriales. La respuesta usa un contrato estructurado y
solo puede referenciar identificadores ya existentes.

Las propuestas y sus bloques se guardan aparte del calendario. La aprobación se
resuelve mediante una operación transaccional e idempotente; el rechazo no crea
eventos. No se persisten prompts, respuestas crudas del proveedor ni memoria de
conversación. El modelo operativo sigue siendo:

**IA propone → PilotFeliu revisa → PilotFeliu decide.**

La planificación debe aspirar a conservar un margen aproximado de una semana de contenido preparado, sin tratarlo como una cuota rígida.

## 9. Modelo de contenido

### Banco de ideas

El banco conserva material sin necesidad de convertirlo inmediatamente en producción:

- ideas rápidas;
- experiencias;
- comentarios;
- tendencias;
- reflexiones.

El objetivo es reducir la pérdida de ideas y ofrecer a la IA un contexto reutilizable para proponer contenido.

### Content Library

Cada video o pieza producida debe poder registrar:

- título;
- hook;
- objetivo;
- audiencia;
- guion;
- estructura;
- CTA;
- plataforma;
- cámara;
- planos;
- edición;
- copy;
- hashtags;
- fecha de publicación.

La biblioteca no sustituye al banco de ideas: una idea pasa a ser una pieza solo cuando PilotFeliu decide producirla.

## 10. Métricas y Analytics

### Modelo híbrido

En el MVP, PilotFeliu introducirá manualmente las métricas después de publicar. El diseño queda preparado para incorporar integraciones o APIs de plataformas en el futuro.

Datos a registrar, cuando estén disponibles:

- visualizaciones;
- likes;
- comentarios;
- compartidos;
- seguidores ganados;
- retención.

El sistema podrá ampliar el registro con visitas al perfil, leads y ventas asociadas cuando exista una fuente fiable o una atribución explícita.

El objetivo es aprender qué contenido genera crecimiento, comunidad y ventas. Las atribuciones a leads o ventas deben tratarse como señales operativas, no como una certeza automática cuando no exista una relación verificable.

## Atribución de leads y ventas

### Primera versión

La primera versión utilizará atribución simple mediante un origen declarado por el usuario, por ejemplo mediante la pregunta: **"¿Cómo nos conociste?"**

Opciones previstas:

- TikTok PilotFeliu.
- Instagram PilotFeliu.
- Instagram FlyPath.
- YouTube.
- Google.
- Recomendación.
- Otro.

La respuesta será una señal de origen declarada, no una prueba de causalidad ni una vinculación automática entre contenido, usuario y compra.

### Futuro

El diseño queda preparado para incorporar:

- UTMs;
- campañas;
- tracking más avanzado.

## 11. Agentes IA previstos

| Agente | Responsabilidad | Inputs | Outputs |
| --- | --- | --- | --- |
| Content Strategist | Definir mezcla de objetivos, plataformas y pilares. | Calendario, objetivos, histórico de contenido y métricas. | Prioridades, cadencia propuesta y huecos de contenido. |
| Idea Generator | Convertir experiencias, tendencias y pilares en ideas accionables. | Banco de ideas, pilares, límites de marca y contexto reciente. | Ideas tituladas con objetivo, plataforma y justificación breve. |
| Script Writer | Estructurar guiones sin perder la voz personal. | Idea aprobada, audiencia, objetivo, plataforma y límites. | Hook, guion, estructura, CTA y variantes. |
| Production Planner | Traducir una pieza aprobada a una grabación viable. | Guion, disponibilidad, equipo y plataforma. | Cámara, planos, audio, luz, checklist y bloque de grabación sugerido. |
| Editor Assistant | Ayudar a organizar la edición y la adaptación por canal. | Material, guion, formato de plataforma y objetivo. | Brief de edición, ritmo, textos en pantalla, copy y hashtags. |
| Analytics Agent | Convertir resultados en aprendizaje práctico. | Métricas por pieza, objetivos y periodo comparado. | Patrones, hipótesis y recomendaciones de contenido. |
| Lifestyle Planner | Detectar oportunidades de contenido en vida personal permitida. | Roster, compromisos, viajes, deporte y límites de marca. | Oportunidades de grabación y propuestas de bajo esfuerzo. |
| FlyPath Growth Agent | Relacionar contenido de FlyPath con necesidades educativas y comerciales reales. | Productos, intereses, campañas aprobadas y consentimiento aplicable. | Ideas y CTA de conversión no invasivos. |
| Brand Manager | Proteger coherencia, tono y límites de marca. | Borradores, guiones, copies, límites y reglas profesionales. | Avisos, ajustes de tono y validación editorial propuesta. |

Los agentes son asistentes de propuesta. Ninguno publica, compra publicidad, contacta usuarios ni modifica datos comerciales por sí solo.

## 12. Automatizaciones futuras

Cuando el modelo esté implementado y validado, podrá preparar:

- generación quincenal de calendario;
- análisis semanal;
- propuestas de contenido;
- avisos si falta roster;
- recomendaciones de oportunidades.

Estas automatizaciones deben ser revisables y no ejecutar publicación ni cambios de agenda de forma automática.

## 13. Roadmap de construcción

| Fase | Objetivo | Resultado esperado |
| --- | --- | --- |
| 1. Documentación y diseño funcional | Consolidar visión, límites, flujos y agentes. | Completada. Esta especificación es la referencia. |
| 2. Base de datos de contenidos | Diseñar y crear el modelo mínimo para ideas, piezas, planificación y métricas. | Completada; migración aplicada en remoto y QA sintético validado. |
| 3. Calendario interactivo | Crear calendario semanal/mensual y el flujo manual de planificación. | Completado dentro de Warhome para crear, asociar, mover, editar y eliminar bloques. |
| 4. Sistema de agentes | Conectar progresivamente asistentes de estrategia, ideas, guion, producción, edición, analytics, lifestyle, crecimiento y marca. | Planificador y Content Strategist MVP implementados como herramientas de propuesta revisable y validados en remoto; los agentes autónomos siguen pendientes. |
| 5. Analytics y conexión con ventas | Registrar rendimiento y relacionar, cuando sea verificable, contenido con leads y ventas. | Aprendizaje por objetivo sin atribución engañosa. |
| 6. Automatizaciones avanzadas | Añadir generación quincenal, análisis semanal, avisos y recomendaciones. | Operación asistida, no autónoma. |

## Almacenamiento

Content OS utiliza la infraestructura Supabase existente de FlyPath. No tiene una base de datos separada.

La auditoría CRM confirmó que `content_items` ya era el catálogo privado adecuado. El MVP lo amplía y crea únicamente las entidades operativas que faltaban, evitando duplicar identidad, CRM, ventas o analítica comercial.

## Estado del diseño

Las decisiones funcionales principales de Content OS PilotFeliu quedan cerradas. El MVP manual, el roster, el primer asistente planificador, el Content Strategist, Brand DNA y TikTok Content Intelligence están completados dentro de Warhome, con sus migraciones remotas aplicadas y QA sintético remoto validado. TikTok mantiene pendiente solo la configuración OAuth y el QA con una cuenta real. La validación actual registra 887 tests correctos. No existen agentes autónomos, memoria avanzada, publicación automática ni automatizaciones sociales.
