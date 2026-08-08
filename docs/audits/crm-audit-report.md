# Auditoría CRM de FlyPath

**Fecha:** 29 de julio de 2026
**Alcance:** código, migraciones y documentación presentes en el repositorio. No se han consultado ni modificado datos de producción. Por ello, el informe confirma el modelo y las integraciones implementadas, pero no infiere volúmenes ni calidad de los registros remotos.

## 1. Estado actual general

FlyPath no tiene todavía un CRM unificado como módulo de producto. Tiene una **base CRM operativa y privada**, formada por piezas separadas y ya utilizables:

- identidad en Supabase Auth y `profiles`;
- captación comercial explícita en `leads` y `lead_product_interests`;
- consentimiento por lista en `email_subscriptions` y su historial;
- actividad y conversiones en `user_events`;
- correo transaccional y de marketing con Resend, jobs, entregas y webhooks;
- catálogo, compras, suscripciones y entitlements en Commerce;
- vistas protegidas de Warhome para leads, usuarios, emails y opiniones;
- proyección operativa independiente de reservas Cal.com.

La separación conceptual es correcta: una cuenta no crea un lead, usar AeroComms no crea un lead, una compra de invitado no se vincula por coincidencia de email y una suscripción de marketing no se deduce de tener cuenta. Aun así, falta la capa que convierta estas piezas en un **contacto operativo único**, con timeline, reglas de enlace transparentes, seguimiento comercial, segmentación y automatizaciones gobernadas por consentimiento.

### Implementado

- Captura de cuatro fuentes comerciales explícitas: newsletter, informe gratuito de Career Planner, waitlist Pre-PPL y solicitud de acompañamiento.
- Doble opt-in para newsletter e interés de marketing de Career Planner.
- Intereses por producto y actividad de conversión asociada a un lead.
- Envíos transaccionales, entrega, aperturas/clics y supresiones de Resend.
- Listado y detalle de leads, usuarios y emails dentro de Warhome con autorización administrativa.
- Catálogo comercial, pedidos, pagos, suscripciones y grants de entitlement server-only.

### Parcial

- Identidad unificada: existe vínculo opcional `leads.user_id`, pero no un modelo de contacto transversal ni reglas de resolución auditables desde Warhome.
- Funnel: hay campos de etapa y estado, pero no hay pipeline, propietario, tareas, SLA, historial de cambios ni automatización de etapa.
- Email automation: el esquema de secuencias existe, pero no se encontró scheduler/worker de secuencias ni editor operativo.
- Analytics: se registran eventos permitidos y conversiones, pero no hay modelo de atribución de ventas o leads por contenido/campaña ni panel analítico transversal.
- Warhome: funciona como MVP operacional; productos, campañas, contenido, analytics, notas y agentes siguen señalados como futuros.

### No existe todavía

- Tabla o DTO de `contacts` que consolide cuenta, lead, comprador invitado y reservante Cal.com sin confundirlos.
- Automatizaciones de CRM activas basadas en segmentos, etapas, eventos o compras.
- Gestión de campañas, UTMs persistidos como entidad, lead scoring, asignación de responsables, tareas y seguimiento comercial.
- Vista de producto/cliente, customer 360 o timeline unificado en Warhome.
- Integración de Content OS PilotFeliu; su diseño queda preparado para una fase posterior.

## 2. Base de datos Supabase

### Identidad, CRM y consentimiento

| Tabla o sistema | Estado | Propósito, relaciones y observaciones |
| --- | --- | --- |
| `auth.users` | Existe (Supabase Auth) | Fuente canónica de identidad y email de cuenta. No se expone directamente al navegador. `profiles.user_id`, `leads.user_id`, compras, grants y otras tablas pueden referenciarlo. |
| `profiles` | Existe | Perfil 1:1 con `auth.users` mediante PK/FK `user_id` y borrado en cascada. Guarda nombre, país, idioma, zona horaria, etapa/objetivo formativo, avatar y un booleano de marketing. RLS: cada usuario autenticado solo lee/crea/actualiza su propio perfil. Puede faltar hasta el bootstrap de cuenta. |
| `leads` | Existe | Identidad comercial explícita por `email citext UNIQUE`; opcionalmente enlaza una cuenta con `user_id UNIQUE`. Guarda nombre, fuentes primera/última, etapa de funnel, estado, idioma, país, fechas y booleano de marketing. Es privada: service role/servidor. |
| `lead_product_interests` | Existe | Unión N:M entre lead y `products`, única por `(lead_id, product_id)`. Guarda fuente inicial/última, estado de interés y fechas. Borra en cascada al borrar el lead o producto. |
| `email_subscriptions` | Existe | Consentimiento por lead y lista, único por `(lead_id, list_key)`. Mantiene estado, fuente, texto y fecha de consentimiento, y fechas de baja/rebote/queja/bloqueo. Privada. |
| `email_subscription_events` | Existe | Historial append-only de altas, reactivaciones, bajas y supresiones por lista. Relaciona suscripción y lead. |
| `email_marketing_confirmation_tokens` | Existe | Doble opt-in de newsletter y Career Planner. Tokens opacos almacenados como hash SHA-256, con expiración, consumo/revocación e idempotencia por solicitud. |
| `email_unsubscribe_tokens` | Existe | Baja segura por token opaco hasheado. Una RPC server-only consume el token de forma idempotente. |
| `admin_users` | Existe | Allowlist de administradores de Warhome (`admin`/`owner`), con estado activo. No contiene email ni se crea automáticamente. |
| `admin_notes` | Existe, sin módulo activo | Notas internas enlazables a usuario, lead, producto o contenido. Tiene tipo, prioridad, estado, responsables y metadatos. El enlace de navegación de Notas en Warhome sigue como `coming_soon`. |

### Actividad, email y automatización

| Tabla | Estado | Propósito, relaciones y observaciones |
| --- | --- | --- |
| `user_events` | Existe | Ledger append-only de actividad. Puede enlazar de forma opcional un usuario, lead y producto. Guarda nombre/categoría de evento, fuente, sesión/anon ID, ruta, referrer, UTMs en metadata y clave de idempotencia. No hay retención ni agregados persistidos. |
| `email_sequences` | Existe | Definición de secuencias: producto/lista opcionales, trigger previsto y estado editorial. Sin acceso público. |
| `email_sequence_steps` | Existe | Pasos ordenados con retardo, asunto y cuerpo. La estructura admite automatización, pero no se encontró un procesador programado de secuencias. |
| `email_enrollments` | Existe | Inscripción de lead en secuencia, con estado, paso, siguiente ejecución y error. Impide más de una inscripción abierta por lead/secuencia. |
| `email_jobs` | Existe y se usa | Cola privada para secuencias y transaccionales. Los flujos actuales crean jobs transaccionales e intentan enviarlos inline; no se encontró un worker/cron de secuencias recurrentes. |
| `email_deliveries` | Existe y se usa | Historial por intento: proveedor, estado, destinatario, asunto, respuesta técnica y métricas de entrega/apertura/clic. |
| `email_webhook_events` | Existe y se usa | Ledger idempotente de eventos de Resend. No guarda el payload del proveedor. Actualiza delivery y propaga rebotes/quejas/supresiones a listas existentes del lead. |
| `public_form_rate_limits` | Existe | Infraestructura de abuso de formularios. Solo persiste hashes HMAC de sujetos y ventanas; no es CRM, pero protege la calidad de captación. |

### Productos, compras y acceso

| Tabla | Estado | Propósito, relaciones y observaciones |
| --- | --- | --- |
| `products` | Existe | Catálogo central con `product_key` único, tipo, canal, estado, descripción, URL e imagen. Incluye `internal_notes`, por lo que es privado y se consulta solo server-side. |
| `product_prices` | Existe | Precios comerciales inmutables por producto, con moneda, importe, modalidad, intervalo, `stripe_price_id` e indicador activo. Un cambio de identidad comercial exige nuevo precio. |
| `stripe_catalog_bindings` | Existe | Binding por entorno Stripe para resolver catálogo Test/Live sin mezclar IDs. No es una fuente de acceso de usuario. |
| `stripe_customers` | Existe | Registro técnico de cliente Stripe, opcionalmente asociado a una cuenta. El email hasheado no crea ni infiere vinculación de cuenta. |
| `orders` | Existe | Pedido de compra única, autenticada o invitada. Conserva email normalizado y hash solo para entrega/recuperación, no para enlazar una cuenta automáticamente. |
| `checkout_attempts` | Existe | Intentos idempotentes creados antes de Stripe, relacionados con pedido y usuario opcional. |
| `order_items` | Existe | Snapshot de producto/precio/importe, protegido por trigger para que coincida con el precio comercial. |
| `payments` | Existe | Ledger de pago Stripe por pedido, con unicidad parcial para evitar dos pagos exitosos equivalentes. |
| `subscriptions` | Existe | Suscripciones Stripe de precio recurrente, con periodo, cancelación y estado. AeroComms Pro es el uso actual relevante. |
| `stripe_webhook_events` | Existe | Ledger idempotente y sin payload crudo de eventos Stripe. |
| `entitlements` / `product_entitlements` | Existe | Catálogo de derechos y mapeo de producto a acceso. Permite bundles sin flags de producto por usuario. |
| `entitlement_grants` | Existe | Grant por compra, suscripción, manual o migración. Tiene estado, ventana temporal, revocación e idempotencia. Solo un grant equivalente por origen. |
| `order_claim_tokens` / `checkout_delivery_tokens` | Existe | Tokens opacos y hasheados para reclamación/entrega de compras invitadas. Separan cada entrega digital. |

**No existe una tabla llamada `purchases`.** Su papel está distribuido intencionadamente entre `orders`, `order_items`, `payments`, `subscriptions` y `entitlement_grants`.

### Reservas, opiniones y producto

| Tabla o grupo | Estado | Relevancia CRM |
| --- | --- | --- |
| `mentorship_bookings` / `cal_webhook_events` | Existe | Proyección operativa mínima de Cal.com: reserva, estado, pago, calendario y hash de email. Cal.com sigue siendo fuente de verdad. Los campos `user_id` y `lead_id` son opcionales, pero el webhook no los infiere por email; en la práctica no hay unión automática con CRM. |
| `school_reviews`, tokens, versiones y eventos de moderación | Existe | Sistema de opiniones verificado y moderado. No crea lead, suscripción, cuenta ni compra. Una opinión puede enlazarse a un usuario existente tras autenticación/verificación de email, pero no es un objeto comercial. |
| `aerocomms_*` | Existe | Progreso, sesiones, estadísticas y sincronización de producto. Deben seguir separados del CRM; Warhome los consulta para el directorio de usuarios. |
| `content_items` | Existe, preparado | Catálogo editorial interno con tipos como `idea`, `social_post`, `video` y `email`; no tiene todavía interfaz, agentes ni integración de Content OS. |

### Duplicidades y puntos de atención del esquema

- El consentimiento aparece en tres lugares: `profiles.marketing_consent`, `leads.marketing_consent` y `email_subscriptions` por lista. El estado legalmente operativo es la suscripción por lista y su historial; los booleanos de perfil/lead pueden divergir.
- El email puede existir por separado en Auth, leads, pedidos invitados, reservas Cal.com y opiniones. Esto es deliberado en varios casos, pero exige una política de resolución de identidad antes de construir un CRM unificado.
- `leads.user_id` es uno-a-uno; `auth.users` no representa la totalidad de leads, y una compra invitada no convierte por sí misma al comprador en usuario o lead.
- `mentorship_bookings` conserva email normalizado y hash, mientras Commerce prefiere email/hash solo para entrega. Debe revisarse la política de minimización y retención al diseñar CRM.

## 3. Autenticación e identidad

### Creación y estados

El login usa OTP de Supabase (`lib/auth/otp.ts`) con `shouldCreateUser: true`. La identificación server-side usa `auth.getUser()` mediante `lib/auth/session.ts`, no datos de navegador.

| Estado | Qué representa | Capacidades actuales |
| --- | --- | --- |
| Anónimo | No hay sesión Supabase válida | Puede navegar, usar producto Free, enviar formularios públicos protegidos y comprar productos digitales de invitado cuando el flujo lo permite. |
| Autenticado | Existe `auth.users` y sesión validada | Puede tener perfil, progreso AeroComms, compras vinculadas, grants y acceso a la cuenta. No implica ser lead ni tener marketing. |
| Usuario de producto | Usuario autenticado con progreso, compra o entitlement | No es un tipo de tabla. En AeroComms Pro, el acceso se resuelve por grants activos de `aerocomms_pro`, no por `localStorage`, perfil o email. |
| Administrador Warhome | Usuario autenticado incluido y activo en `admin_users` | Accede a Warhome server-side. No es un rol CRM multiequipo. |

### Perfil y enlace opcional de lead

Tras verificar OTP o entrar en `/account`, `bootstrapFlyPathIdentity()` crea `profiles` si falta. Si el usuario tiene email confirmado, actualiza los leads con el mismo email que aún no tengan `user_id`.

Esto **no crea un lead ni una suscripción**, pero sí enlaza automáticamente una cuenta con un lead existente. La fase CRM debe decidir si conservarlo como regla actual, registrarlo como evento de resolución de identidad y cómo resolver situaciones futuras de conflicto.

## 4. Captación de leads

| Punto de entrada | Dónde y qué captura | Origen/interés | Consentimiento | Resultado actual |
| --- | --- | --- | --- | --- |
| Newsletter home | `HomeNewsletterForm` → `POST /api/leads/home-newsletter`; email | Lead con fuente `home_newsletter`; evento de solicitud de confirmación | Doble opt-in a lista `home_newsletter`; no se suscribe hasta confirmar | Crea/actualiza lead, evento y token/job de confirmación. |
| Informe gratuito Career Planner | `app/career-planner/page.tsx` → `POST /api/leads/career-planner-report`; email y checkbox opcional | Lead, interés en `career_planner` y evento de descarga solicitada | Solo si marca marketing: doble opt-in a `career_planner`. El informe transaccional no depende de marketing. | Crea/actualiza lead e interés, registra conversión y envía confirmación del informe. |
| Waitlist Pre-PPL | `PrePplWaitlistModal` → `POST /api/leads/preppl-waitlist`; email | Lead, interés `preppl_guide` con estado `waitlist`, evento de waitlist | No hay consentimiento de marketing implícito | Envía confirmación transaccional de waitlist. |
| Solicitud de acompañamiento | `MentorshipSupportModal` → `POST /api/leads/mentorship-support`; nombre, email, teléfono opcional, situación y texto de ayuda | Lead en etapa `qualified`, interés `flypath_accompaniment`, evento de solicitud | No hay consentimiento de marketing implícito | Envía confirmación transaccional y alerta interna. El teléfono y el texto no se normalizan como columnas CRM separadas; se usan para la alerta. |
| Comparador de escuelas | CTAs rastreados; no hay formulario propio de lead identificado | Eventos de selección y CTAs de comparador | Solo tracking con consentimiento analítico | Puede derivar a mentoría/Career Planner, pero no crea lead por comparar. |
| AeroComms | Auth, progreso, sesiones y eventos de producto separados | No crea lead ni interés por uso, onboarding, sesión o importación | No infiere consentimiento | Correctamente separado; Pro se concede por entitlement. |
| Productos digitales | Checkout y webhooks Commerce | Pedido/pago/grant, no lead automático | No crea marketing por compra | Invitados y cuentas se mantienen separados; no se vincula por email. |
| Mentoría Cal.com | Cal.com → webhook operativo | Reserva en `mentorship_bookings`; no crea lead ni pago Commerce | Cal.com opera reserva/correo/pago; no hay consentimiento FlyPath inferido | La proyección no une lead/usuario por email. |
| Opiniones de escuelas | `POST /api/school-reviews`; datos de opinión y email de verificación si es invitado | No es captación comercial | Consentimiento propio de opinión, no marketing | No crea lead, cuenta, suscripción ni compra. |
| Registro FlyPath | OTP Supabase | Crea cuenta, no lead | No supone marketing | El bootstrap solo puede enlazar un lead que ya existía. |
| Waitlists futuras | No implementadas | El modelo de fuente admite más orígenes, pero no hay endpoint adicional identificado | Deben requerir consentimiento explícito si implican marketing | Pendiente. |

Todos los formularios públicos revisados validan el body, tamaño, honeypot, tiempo mínimo, mismo origen, idempotencia y cuotas distribuidas en Supabase. Los identificadores de cuota se almacenan hasheados.

## 5. Productos y compras

### Catálogo actual

`products` es el catálogo de referencia para FlyPath: plataforma, digitales, servicios, externos Amazon y suscripciones. El precio no vive en el frontend: `product_prices` conserva identidad comercial inmutable y `stripe_catalog_bindings` separa las credenciales/bindings Test y Live.

### Relación persona-producto

| Caso | Registro comercial | Relación con identidad |
| --- | --- | --- |
| Career Planner Premium | Pedido, línea, pago Stripe y token de entrega de PDF | Puede comprar como invitado. El acceso al PDF se gestiona con token seguro; no se crea cuenta ni lead. |
| Guía Cómo ser Piloto digital | Mismo patrón de compra y entrega separada | Puede comprar como invitado; no tiene entitlement. |
| AeroComms Pro | Checkout de suscripción, `subscriptions`, eventos Stripe y grant `aerocomms_pro` | Requiere cuenta autenticada. El entitlement activo es la fuente de acceso. |
| Guía física / logbooks | Producto externo Amazon | No se registra pedido FlyPath ni comprador. |
| Mentorías | Cal.com, no Commerce FlyPath | FlyPath guarda una proyección de reserva, no orden ni pago propio. |

No hay todavía una vista CRM que reúna de forma segura “intereses + pedidos + suscripciones + entitlements + reservas” para una persona. La unión debe hacerse por relaciones existentes y nunca por una coincidencia de email que convierta automáticamente a un invitado en cliente autenticado.

## 6. Eventos y tracking

### Qué se registra

- `user_events` admite categorías de auth, lead, producto, contenido, email, compra, navegación, engagement y sistema.
- El endpoint público de tracking solo acepta un catálogo cerrado de eventos: vistas de página, apertura/completado de formularios, apertura de popups y CTAs definidos.
- El tracking de navegador requiere consentimiento analítico, mismo origen e idempotencia. Guarda sesión, ID anónimo, ruta, referrer y UTMs sanitizados.
- Las captaciones server-side escriben eventos de conversión vinculados a `lead_id` y, cuando aplica, a `product_id`.
- Resend complementa las entregas con aceptación, entrega, apertura, clic, bounce, queja y supresión.
- AeroComms conserva sus sesiones y progreso canónicos en sus propias tablas; Warhome puede mostrar actividad sin duplicar cada sesión en `user_events`.
- Vercel Analytics y Speed Insights recogen analítica de plataforma, pero no están integrados como identidad CRM ni atribución comercial.

### Qué falta para funnels futuros

- Enlazar de forma gobernada actividad anónima con lead o cuenta tras una conversión, sin inferencias peligrosas.
- Modelo de campaña/canal/UTM persistido y atribución de primer/último toque.
- Eventos de ciclo de vida normalizados para pedido pagado, activación de entitlement, reserva Cal.com y cambios de funnel.
- Agregados para evitar reconstruir funnels completos sobre `user_events` en cada consulta.
- Retención, archivado y política de acceso para datos de evento y metadata.

## 7. Emails y automatizaciones

| Capacidad | Estado | Evidencia y alcance |
| --- | --- | --- |
| Proveedor de envío Resend | ✅ Implementado | Cliente server-only, configuración de remitente/respuesta y webhook firmado. |
| Emails transaccionales de captación | ✅ Implementado | Career Planner, waitlist Pre-PPL, solicitud de mentoría, alerta interna, verificación de opiniones y confirmación de marketing. |
| Doble opt-in de marketing | ✅ Implementado | Newsletter home y Career Planner usan tokens opacos, expiración y confirmación server-side. |
| Baja y supresiones | ✅ Implementado | Baja por token y propagación de rebote/queja/supresión de Resend a listas existentes. |
| Historial de entrega y engagement de email | ✅ Implementado | `email_jobs`, `email_deliveries`, `email_webhook_events`; Warhome Emails muestra estado operativo. |
| Definición de secuencias | ⚠️ Parcial | Tablas de secuencias, pasos e inscripciones existen, con estados y retardos. |
| Ejecución programada de secuencias | ❌ No existe | No se identificó cron/worker que consuma `email_enrollments` y pasos programados. Los envíos transaccionales actuales se intentan inline. |
| Segmentación, campañas y editor | ❌ No existe | Warhome navega a Emails, pero Campañas y Productos siguen como futuros; no hay campaña/segmento/plantilla editorial operativos. |
| Automatizaciones CRM por etapa, compra o actividad | ❌ No existe | Hay `trigger_type` previsto en secuencias, pero no hay reglas ni orquestación activas. |

## 8. Problemas y riesgos

### Alta prioridad para Fase 11

1. **Fuentes de verdad de consentimiento duplicadas.** `profiles.marketing_consent` y `leads.marketing_consent` pueden diferir de `email_subscriptions`, que ya expresa consentimiento por lista e historial. Antes de automatizar debe fijarse cuál es el dato operativo y cómo se deriva cualquier resumen.
2. **Identidad repartida sin modelo de resolución.** Auth, lead, pedidos invitados, Cal.com y opiniones manejan email de formas deliberadamente distintas. La regla actual de bootstrap enlaza leads no asignados por email confirmado, pero no registra una decisión de resolución ni cubre el resto de fuentes.
3. **No hay customer/lead 360.** Warhome separa Leads, Usuarios y Emails. Faltan pedidos, suscripciones, grants, reservas, notas y actividad en una vista operativa consistente.
4. **Funnel sin historial.** `funnel_stage` y `status` son valores actuales; no hay auditoría de transiciones, dueño, siguiente acción, razón de pérdida ni tareas.
5. **Cal.com queda aislado intencionadamente.** La reserva no se vincula por email a lead/usuario. Es seguro frente a asociaciones erróneas, pero impide operar la reserva junto al contexto comercial hasta diseñar una relación explícita y consentida.

### Prioridad media

1. **Secuencias de email solo preparadas.** El esquema es suficiente para empezar, pero no hay ejecución, observabilidad ni control de elegibilidad por consentimiento.
2. **Metadata libre en eventos y notas.** La validación de entrada protege los eventos web actuales, pero `metadata jsonb` sin esquema compartido dificulta consultas, cumplimiento y limpieza futura.
3. **Atribución incompleta.** Se guardan UTMs sanitizados en eventos y contexto de conversión, pero no hay entidad ni regla de atribución para leads, ventas o contenido.
4. **Datos de solicitud de acompañamiento.** Teléfono y necesidad se usan en correo de alerta; no quedan estructurados como atributos CRM de seguimiento. Hay que decidir qué es necesario conservar y durante cuánto tiempo.
5. **Sin política de retención visible.** Eventos, entregas, emails de compra, tokens históricos, reservas y metadata necesitan reglas de minimización, retención y borrado/anonimización.

### Riesgos aceptables o de diseño deliberado

- No crear leads automáticamente por cuentas, AeroComms, onboarding, progreso, opiniones o compras: es una decisión correcta y debe preservarse.
- No asociar compras de invitado ni reservas Cal.com a cuentas por coincidencia de email: evita asignaciones erróneas; cualquier futura conciliación debe ser explícita.
- La tabla `content_items` no debe convertirse todavía en una segunda base de Content OS sin la auditoría CRM y definición de entidades previstas.

## 9. Recomendaciones futuras

Estas propuestas no implican implementación ni migración en esta auditoría.

### Modelo CRM objetivo

1. Mantener las entidades canónicas separadas: `auth.users`/`profiles`, `leads`, consentimiento por lista, Commerce, reservas Cal.com, opiniones y progreso de AeroComms.
2. Diseñar una capa de **contacto operativo** o una proyección server-only que las presente juntas sin copiar emails, compras o consentimientos innecesariamente.
3. Definir una política explícita de resolución de identidad: enlace por cuenta verificada, invitado que reclama una compra, y reservas Cal.com. Cada unión debería ser trazable, reversible cuando corresponda y no crear entidades comerciales implícitas.
4. Elegir `email_subscriptions` + `email_subscription_events` como fuente de verdad por lista; convertir los booleanos heredados en resúmenes derivados o deprecarlos de forma controlada más adelante.

### Preparación para Warhome

- Construir un detalle de contacto/lead con timeline compuesto: captación, intereses, suscripciones, entregas, pedidos, subscriptions, grants, reservas y actividad relevante.
- Activar las áreas hoy declaradas futuras: Notas, Productos, Analytics, Campañas y tareas de seguimiento, una por una y sobre relaciones existentes.
- Añadir historial de transición de funnel y tareas internas antes de automatizar cambios de etapa.

### Preparación para Content OS PilotFeliu

- Reutilizar `content_items` solo después de definir si cubre las entidades necesarias de ideas, piezas, calendario, métricas y atribución.
- Añadir a captación un origen declarado normalizado (TikTok PilotFeliu, Instagram PilotFeliu, Instagram FlyPath, YouTube, Google, recomendación, otro), como ya define la especificación de Content OS.
- Diseñar atribución de contenido primero como dato declarado y UTM, sin mezclarla todavía con consentimiento ni convertir visitantes en leads.

### Automatizaciones futuras

- Activar secuencias únicamente cuando exista elegibilidad verificable por lista, estado y consentimiento.
- Automatizar propuestas y alertas, no cambios comerciales irreversibles: por ejemplo, aviso de lead cualificado, reserva Cal.com sin contexto, o entrega fallida.
- Mantener el patrón de “IA propone, PilotFeliu revisa y decide” para Content OS y cualquier automatización de operación comercial sensible.

## 10. Resumen ejecutivo

| Elemento | Estado | Prioridad |
| --- | --- | --- |
| Captación explícita de leads e intereses | Operativo | Mantener y consolidar |
| Consentimiento por lista, doble opt-in y bajas | Operativo | Mantener como fuente de verdad |
| Auth, perfiles y directorio de usuarios | Operativo | Integrar operativamente sin crear leads implícitos |
| Catálogo, compras, suscripciones y entitlements | Operativo | Exponer contexto en Warhome sin duplicarlo |
| Reservas Cal.com | Operativo como proyección aislada | Definir enlace explícito a CRM |
| Eventos y conversiones | Parcial | Normalizar lifecycle y atribución |
| Warhome Leads/Usuarios/Emails | MVP operativo | Construir vista transversal y notas/tareas |
| Secuencias y automatizaciones de email | Esquema preparado, ejecución ausente | Alta para Fase 11 |
| Modelo de contacto y resolución de identidad | No existe | Alta para Fase 11 |
| Campañas, segmentación y funnel auditado | No existe | Alta para Fase 11 |
| Content OS PilotFeliu | Diseño documentado, sin implementación | Posterior, dentro de Fase 12 |

## Anexo: fuentes revisadas

- Estado y roadmap: `README.md`, `ROADMAP.md`, `CURRENT_PHASE.md`, `ACTIVE_TASK.md`, `LAST_SESSION.md`.
- Núcleo CRM: migraciones `20260711180000` a `20260711280000`, migraciones de consentimiento, Commerce, Cal.com y hardening de formularios.
- Captación: `lib/leads/*` y `app/api/leads/*`.
- Identidad: `lib/auth/*`, `lib/account/*`, `lib/supabase/*`.
- Email: `lib/email/*`, `app/api/email/*`, `app/api/webhooks/resend/route.ts`.
- Tracking: `lib/tracking/*`, `app/api/tracking/events/route.ts`.
- Comercio: `lib/commerce/*`, `lib/aerocomms/access-server.ts`, rutas Commerce y Stripe.
- Warhome: `lib/warhome/*`, `app/warhome/(protected)/*`.
- Mentorías y opiniones: `lib/mentorias/calcom-webhooks.ts`, `app/api/webhooks/calcom/route.ts`, `lib/school-reviews/*` y sus rutas.
