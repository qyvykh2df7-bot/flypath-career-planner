# Auditoría independiente — Content OS TikTok Intelligence MVP

**Fecha:** 30 de julio de 2026  
**Alcance:** implementación local del bloque 12A.8 antes de aplicar la migración y conectar una cuenta TikTok real.  
**Restricciones respetadas:** no se modificó código ni la migración, no se aplicó Supabase, no se configuraron secretos y no se hizo commit ni push.

## Veredicto

**APROBADO CON CAMBIOS.**

La arquitectura, el aislamiento de datos y el flujo de revisión humana son adecuados para continuar con la preparación técnica. No recomiendo conectar TikTok en producción todavía por dos riesgos operativos de severidad **MEDIA**:

1. Los análisis que fallan se vuelven a intentar en cada sincronización, sin intervalo mínimo ni presupuesto de reintentos. Un fallo persistente de OpenAI podría generar coste repetido al pulsar sincronizar.
2. Dos sincronizaciones simultáneas pueden intentar refrescar el mismo refresh token a la vez. TikTok puede rotar el refresh token, por lo que una carrera puede dejar una de las credenciales persistidas inválida.

La migración no está aplicada en remoto: `20260729160000` figura localmente y todavía no en la lista remota.

## 1. Arquitectura y flujo

### Separación de responsabilidades

La implementación mantiene tres capas separadas:

- `content_tiktok_videos`: staging privado de vídeos importados y de sus análisis pendientes.
- `content_items`: biblioteca histórica/operativa de Content OS.
- `content_metrics`: snapshots de métricas asociados a una pieza confirmada.

El vídeo importado no crea un `content_item` directamente. La RPC `review_content_os_tiktok_analysis` bloquea la fila, exige revisión y solo en decisión `confirmed` crea una pieza interna histórica con `content_origin = 'historical'`, `visibility = 'internal'` y la URL de origen. La decisión `rejected` no crea contenido.

Flujo comprobado:

```text
TikTok/API o URL manual
        ↓
content_tiktok_videos (staging)
        ↓
análisis estructurado IA
        ↓
pending_review
        ↓ revisión de PilotFeliu
confirmed ───────────────→ content_items histórico + content_metrics
rejected                  → permanece fuera de biblioteca/calendario
        ↓
Strategist puede consumir el histórico confirmado
```

No se observa publicación automática, respuesta a comentarios, creación de vídeos ni llamada a APIs sociales de publicación. La conexión está detrás de `/warhome/content/integrations/tiktok` y las acciones requieren `requireWarhomeAdmin()`.

**Resultado:** OK.

## 2. OAuth TikTok

### State y CSRF

- El endpoint de conexión genera 32 bytes aleatorios con `node:crypto`.
- El valor se guarda en cookie `HttpOnly`, `SameSite=Lax`, con `Secure` en producción, `Max-Age` de 10 minutos y path restringido.
- El callback compara el state recibido y el de la cookie con comparación de tiempo constante.
- La cookie se elimina después del callback.
- El callback exige de nuevo un administrador activo de Warhome.

La implementación sigue el flujo recomendado por TikTok: redirect URI HTTPS, estático y sin query/hash, y validación del state para evitar request forgery. [Documentación oficial de Login Kit Web](https://developers.tiktok.com/doc/login-kit-web)

**Resultado:** OK.

### Scopes y callback

Se solicitan únicamente `user.info.basic` y `video.list`. El intercambio de código valida que la respuesta contiene ambos scopes y que el `open_id` obtenido con el token coincide con el recibido en el intercambio.

La redirect URI se valida contra `FLYPATH_CANONICAL_ORIGIN` cuando está configurado y no se construye a partir del `Host` de la petición. Los errores no devuelven secretos ni payloads del proveedor.

**Resultado:** OK.

### Expiración, refresco y desconexión

- Se almacenan expiraciones de access y refresh token.
- El access token se refresca cuando quedan cinco minutos o menos.
- Se persiste el refresh token nuevo, importante porque TikTok puede devolver uno distinto al anterior.
- Al desconectar, se revoca el access token en TikTok antes de borrar la conexión local. Si la revocación falla, la conexión local se conserva para poder reintentar.

TikTok documenta access tokens de aproximadamente 24 horas, refresh tokens de hasta 365 días y posible rotación del refresh token. [Gestión oficial de tokens de usuario](https://developers.tiktok.com/doc/oauth-user-access-token-management)

**Resultado:** OK con riesgo operativo de concurrencia descrito en la sección de hallazgos.

## 3. Seguridad

### Tokens y secretos

- `client_secret`, access token y refresh token solo se usan en módulos server-only.
- Los tokens se cifran antes de llegar a Supabase mediante AES-256-GCM.
- La representación persistida incluye versión, IV, tag de autenticación y ciphertext; no guarda el token en claro.
- La clave de cifrado se obtiene de `CONTENT_OS_TIKTOK_TOKEN_ENCRYPTION_KEY`, debe ser una clave Base64 de 32 bytes y no está en `.env.example` con valor real.
- Las respuestas y errores de TikTok se reducen a categorías internas; no se reenvían bodies del proveedor.

**Resultado:** OK.

### RLS, ACL y Warhome

La migración:

- habilita RLS en `content_tiktok_connections` y `content_tiktok_videos`;
- revoca acceso a `PUBLIC`, `anon` y `authenticated`;
- concede tablas y RPC únicamente a `service_role`;
- fija `search_path = public, pg_temp` en las funciones `SECURITY DEFINER`;
- comprueba en cada RPC que el `p_admin_user_id` corresponde a un `admin_users` activo con rol `admin` u `owner`.

El cliente no recibe los campos privados de conexión; la lectura pública de la integración selecciona solo nombre, scopes y estados de sincronización.

**Resultado:** OK.

## 4. Base de datos y migración

### `content_tiktok_connections`

Incluye una única conexión para `workspace_key = 'pilotfeliu'`, identidad TikTok, scopes, ciphertexts, expiraciones, estado de sync y timestamps. El índice único sobre `tiktok_open_id` evita duplicar la misma cuenta.

Los checks cubren longitudes, scopes mínimos, expiración de tokens, estados de sincronización y códigos de error acotados.

### `content_tiktok_videos`

Incluye ID TikTok, URL, caption, hashtags, fecha, duración, métricas, origen de importación, origen de métricas, análisis y enlace opcional a `content_items`.

Índices y restricciones relevantes:

- único por `(workspace_key, tiktok_video_id)`;
- un único `content_item_id` cuando existe;
- índice de cola de revisión por workspace, estado y fecha;
- rangos para métricas, duración y texto;
- estados explícitos `pending_analysis`, `pending_review`, `confirmed`, `rejected`, `failed`;
- check que evita que una fila confirmada o revisable carezca de los campos de su estado.

### RPC

Las cuatro operaciones sensibles están encapsuladas en RPCs con `SECURITY DEFINER`:

- `upsert_content_os_tiktok_connection`;
- `upsert_content_os_tiktok_video`;
- `save_content_os_tiktok_analysis`;
- `review_content_os_tiktok_analysis`.

La promoción a biblioteca usa `FOR UPDATE` y ocurre en la misma transacción que la creación del `content_item` y su snapshot de métricas. Los upserts son idempotentes por workspace/ID TikTok.

**Resultado:** OK para una primera aplicación en un remoto que no tenga estas tablas. Conviene verificar después de aplicar que las constraints y ACL coinciden con la migración, porque `CREATE TABLE IF NOT EXISTS` no repara una tabla preexistente con una definición divergente.

## 5. Importación y métricas

### Dedupe y sincronización

- La API usa el ID de vídeo TikTok como clave natural.
- La importación manual normaliza URL HTTPS de TikTok y deriva un ID determinista: ID de vídeo cuando está en la ruta o hash SHA-256 de la URL normalizada.
- Los upserts conservan métricas previas cuando el proveedor no devuelve un valor y marcan `metrics_source = mixed` cuando se combinan datos API y manuales.
- Un vídeo confirmado conserva su enlace a biblioteca y las nuevas métricas actualizan un snapshot del día.

**Resultado:** OK, con la limitación de cuenta descrita abajo: los vídeos no tienen una `connection_id` o `tiktok_open_id` propia; el aislamiento actual depende del workspace único `pilotfeliu`.

### Datos que se pueden obtener

Con `video.list`, la implementación importa ID, URL, caption/description, título cuando está disponible, duración, fecha de creación y métricas de visualizaciones, likes, comentarios y compartidos. El Display API documenta precisamente esos campos y permite paginar con un máximo de 20 vídeos por página. [Display API](https://developers.tiktok.com/doc/display-api-overview/) · [List Videos](https://developers.tiktok.com/doc/tiktok-api-v2-video-list/) · [Video Object](https://developers.tiktok.com/doc/tiktok-api-v2-video-object/)

### Datos no disponibles o manuales

- Guardados/favoritos no forman parte del conjunto de campos solicitado por esta integración; quedan como columna nullable y pueden introducirse manualmente.
- Seguidores ganados, retención, leads y ventas no proceden de esta API; requieren carga manual o integraciones futuras.
- Los hashtags se extraen del caption, no de un campo independiente de TikTok.
- El análisis IA recibe metadata, caption, URL, duración y métricas; no recibe ni afirma haber visto el vídeo o audio.
- TikTok devuelve datos de vídeos públicos recientes, no un histórico analítico completo por sí solo.

## 6. IA y revisión humana

- La llamada a OpenAI es server-side y usa salida JSON estructurada.
- El parser local valida IDs exactos, ausencia de duplicados, enums, campos obligatorios y límites de longitud.
- Se usa `store: false` y no se persiste el prompt ni la respuesta completa.
- El análisis se guarda como `pending_review`, nunca como histórico definitivo.
- Solo la RPC de revisión humana crea `content_items` históricos.
- Las propuestas no crean eventos de calendario ni llegan al Planner.

**Resultado:** OK respecto al modelo `IA propone → PilotFeliu revisa → sistema aprende`.

## 7. Hallazgos

| Severidad | Hallazgo | Evidencia | Recomendación |
|---|---|---|---|
| MEDIA | Los estados `failed` se reintentan en cada sync y no existe cooldown, presupuesto o contador de reintentos IA. | `lib/warhome/content-os-tiktok.ts`, `analyzeVideos()` selecciona `pending_analysis` y `failed` y vuelve a llamar a OpenAI. | Añadir antes de conectar la cuenta real un intervalo mínimo y/o límite de reintentos por vídeo. Mantenerlo server-side y distribuido si el endpoint se escala. |
| MEDIA | Dos sincronizaciones concurrentes pueden refrescar el mismo refresh token y competir al persistir su rotación. | `getAccessToken()` refresca y `persistRefreshedTokens()` actualiza sin lock/compare-and-swap. | Serializar sync por workspace o persistir la rotación con control de versión/expiración antes de activar sync real. |
| BAJA | Una conexión nueva reutiliza el workspace único y los vídeos staging anteriores no llevan la identidad de la conexión. | `content_tiktok_videos` solo tiene `workspace_key`; no existe `connection_id`. | Aceptable para la cuenta única de PilotFeliu; documentar y revisar si el producto admite otra cuenta o histórico multi-cuenta. |
| BAJA | Al confirmar un vídeo sin una métrica API, el snapshot de `content_metrics` usa `0`, por lo que downstream no distingue “no disponible” de “cero”. | RPC de revisión, `COALESCE(source_video.<metric>, 0)`. | Mantener la columna staging nullable y, en una iteración posterior, conservar null o una marca de disponibilidad en snapshots. |
| BAJA | El callback devuelve JSON 400 ante errores de configuración/proveedor en vez de redirigir siempre a la pantalla de integración. | `app/api/warhome/content/integrations/tiktok/callback/route.ts`. | Mejorar la UX en un bloque posterior; no es una apertura de seguridad. |
| BAJA | La acción de rechazar exige que el formulario incluya también todos los campos del análisis, aunque no se usen para rechazar. | `actions.ts` y `parseContentOsTikTokReviewForm`. | Permitir un payload de rechazo mínimo en una mejora UX posterior. |

No se encontraron hallazgos críticos de exposición de tokens, acceso público a tablas, bypass de revisión humana ni publicación automática.

## 8. Compatibilidad y alcance

La implementación reutiliza Content OS, `content_items`, `content_metrics`, Brand DNA y el acceso privado de Warhome. No crea Commerce, pagos, entitlements, APIs sociales de publicación ni automatizaciones externas. La migración no modifica tablas comerciales ni datos existentes; únicamente añade las tablas y funciones TikTok previstas.

El worktree contiene además cambios ajenos de otras tareas. Esta auditoría no los incluye ni los clasifica como parte del bloque 12A.8.

## 9. Evidencia de validación local

- Tests focalizados TikTok/OAuth: **25 tests correctos en 8 archivos**.
- La validación local documentada del bloque registra **883 tests correctos**.
- TypeScript, build Webpack y lint focalizado del bloque fueron correctos.
- `git diff --check` correcto.
- El lint global tiene errores preexistentes en otros módulos de Warhome; no se atribuyen a TikTok.
- `supabase migration list --linked`: la migración `20260729160000` está local y pendiente en remoto.

## 10. Condiciones antes de avanzar

1. Resolver o aceptar explícitamente los dos hallazgos MEDIA, en especial el control de coste de reintentos IA.
2. Aplicar la migración en remoto y verificar tablas, checks, RLS, ACL y funciones.
3. Configurar únicamente secretos server-side y registrar la redirect URI HTTPS exacta en TikTok.
4. Ejecutar QA con datos sintéticos: conexión, sync, dedupe, refresh, desconexión, análisis, revisión y limpieza.
5. Confirmar que el primer sync real está limitado al máximo configurado y no produce publicación ni cambios en calendario.

## Fuentes externas

- [TikTok Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web)
- [TikTok User Access Token Management](https://developers.tiktok.com/doc/oauth-user-access-token-management)
- [TikTok Display API Overview](https://developers.tiktok.com/doc/display-api-overview/)
- [TikTok List Videos API](https://developers.tiktok.com/doc/tiktok-api-v2-video-list/)
- [TikTok Video Object](https://developers.tiktok.com/doc/tiktok-api-v2-video-object/)
