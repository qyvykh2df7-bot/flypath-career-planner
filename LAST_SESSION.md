# Última sesión — Fase 9 completada técnicamente; handoff a Fase 10

**Fecha:** 2026-07-19
**Rama:** `main`
**Estado:** Fase 9 — Backend de opiniones de escuelas: 9A–9F completados técnicamente y desplegados en producción mediante `b5f8e34 feat(schools): close school reviews backend`. La siguiente fase es Fase 10 — Pagos, monetización y entitlements. No se ha declarado la QA manual de opiniones como completada.

## Cierre técnico de Fase 9

- `20260712130000_harden_public_school_catalog_access.sql` está aplicada en remoto: la lectura anónima de catálogo pasa por un contrato público cerrado, sin `internal_notes`, `school_entry_snapshot`, `comparator_exclusion_note`, notas editoriales ni metadata de gestión.
- `20260712140000_create_school_reviews_backend.sql` está aplicada en remoto: crea opiniones privadas, hashes/tokens opacos, versiones y eventos de moderación. No crea leads, suscripciones, cuentas ni compras.
- `20260712150000_make_school_review_moderation_atomic.sql` está aplicada en remoto: `moderate_school_review_atomically` bloquea la opinión, valida la transición, actualiza el estado e inserta el evento append-only en una sola operación. La RPC usa `SECURITY DEFINER`, `search_path` fijo y `EXECUTE` exclusivo de `service_role`.
- `/opiniones-escuelas` elimina previews y muestra solo opiniones `approved`, con agregados dinámicos de media, categorías, distribución y volvería a elegir. El email y toda identidad de cuenta permanecen fuera del DTO público.
- `/schools/[slug]` muestra un resumen real y CTAs; el comparador y Career Planner consultan resúmenes aprobados por lote y mantienen las valoraciones editoriales `school_scores` separadas.
- Career Planner consume ahora ese mismo resumen público por lote: las estrellas convierten la media aprobada de `1–10` a `0–5`, incluyen fracciones visuales y nunca usan `school_scores` como fallback. Sin opiniones aprobadas muestra “Sin opiniones”.
- `/warhome/reviews` y `/warhome/reviews/[reviewId]` están detrás de autorización Warhome. El listado permite filtro y búsqueda privada; el detalle conserva email, textos e historial solo para admins. Aprobar, rechazar, ocultar, restaurar, eliminar y resolver solicitudes usan transiciones cerradas, motivos cerrados y un evento append-only. Las acciones de moderación de Warhome ya se ejecutan mediante la RPC atómica.
- Pruebas técnicas actuales: `npm test` 465 correctas; TypeScript, lint focalizado, build Webpack y `git diff --check` correctos. El aviso de prueba Pre-PPL sigue siendo esperado y no invalida la suite. La exportación inválida `TypeGlyph` de AeroComms se corrigió haciéndola local a su página, sin cambio funcional.
- Deployment de producción de `b5f8e34`: `Ready` en Vercel. La URL canónica sigue siendo `https://flypath-career-planner.vercel.app`.
- QA remota controlada: transición sintética `pending -> approved`, repetición idempotente, conflicto de estado y transición inválida verificados; la opinión sintética y su auditoría se eliminaron al terminar. No se crearon leads, suscripciones, cuentas ni compras.
- Pendiente antes de publicar: QA manual del invitado/verificación, flujo de moderación, edición/eliminación, comparador/ficha, móvil y escritorio.

## Siguiente tarea — Fase 10

- Auditar productos, precios, CTAs, emails transaccionales y cualquier integración Stripe antes de diseñar checkout, pagos y entitlements.
- Mantener cuentas, marketing, leads, opiniones y entitlements como entidades separadas.

## Cierre confirmado de Fase 8

- **8A:** `20260712120000_create_warhome_user_directory.sql` aplicada y validada en Supabase remoto. La RPC usa `SECURITY DEFINER`, `search_path` fijo y `EXECUTE` exclusivamente para `service_role`.
- **8B:** `lib/warhome/users.ts` y `lib/warhome/user-detail.ts` exponen contratos server-only, filtros normalizados, paginación exacta y detalle cerrado.
- **8C:** `/warhome/users` lista todas las cuentas FlyPath/AeroComms, con o sin lead, y permite búsqueda, cinco filtros, orden y paginación de 20.
- **8D:** `/warhome/users/[userId]` muestra identidad, perfil, progreso AeroComms, últimas 20 sesiones, lead opcional, marketing separado y un placeholder de compras/entitlements.
- **8E:** las pruebas confirman que el listado usa una RPC agregada sin N+1; la ficha se acota a `user_id`, usa un número fijo de consultas y no expone metadata Auth, identidades, tokens, hashes, recibos ni IDs de sesión cliente.
- No se crean ni modifican leads, suscripciones, compras o eventos por consultar estas vistas.
- Cuenta, perfil, actividad AeroComms, lead comercial, marketing y cliente futuro siguen siendo entidades distintas.
- Commit `73758c1 feat(warhome): add AeroComms user operations`, publicado en `main`.
- `npm test`: 398 pruebas correctas; TypeScript, lint focalizado y `git diff --check` correctos.
- QA manual aprobado y deployment de Vercel confirmado manualmente.

## Siguiente tarea — Fase 9

- Auditar el sistema actual de escuelas, opiniones, fichas, comparador y Warhome antes de diseñar la migración y la moderación.
- Identificar datos y flujos existentes, dependencias de Supabase, posibles superficies de moderación y límites de seguridad.
- No crear migraciones ni implementar UI antes de cerrar esa auditoría.

## Siguiente fase

**Fase 9 — Backend de opiniones de escuelas.**

## Cierre histórico de Fase 7

- Fase 6 permanece completada e integrada en `main`.
- Se creó la referencia `docs/ai/aerocomms/aerocomms-phase-7-persistence-design.md`.
- Se añadió y aplicó la migración `20260712110000_create_aerocomms_progress_persistence.sql`.
- El modelo usa estado durable + historial mínimo idempotente: `aerocomms_progress`, progreso de ejercicios/misiones, estadísticas, sesiones y recibos de sincronización.
- `/api/aerocomms/progress/sync` y `/api/aerocomms/progress/reset` autentican con `auth.getUser()`, validan el límite y usan RPC solo desde `service_role`.
- `aerocomms.v2` continúa para anónimos y nunca se borra tras una sincronización. Perfil permite importar explícitamente un blob anónimo sin dueño o empezar desde cero.
- Los intentos y métricas posteriores a la importación se derivan únicamente de sesiones idempotentes; un `operation_id` reutilizado con hash distinto se rechaza.
- El reset autenticado persiste un corte remoto: sesiones anteriores no pueden restaurar progreso eliminado en otro dispositivo. El owner tiene fallback en memoria y la sincronización reintenta errores transitorios.
- `rfr` se persiste como `ready-for-radio`; audio, transcripciones, blobs, UI state y `subscription` local quedan excluidos.
- El nombre no entra en la persistencia de progreso: anónimos mantienen el onboarding local y cuentas autenticadas muestran `profiles.full_name`. Perfil pide una decisión explícita antes de promover un nombre local distinto.

## Cierre confirmado

- Commit: `aaa5f4e feat(aerocomms): close phase 7 persistence`.
- Push realizado a `main`.
- Deployment completado correctamente.
- `npm test`: 359 tests correctos.
- TypeScript correcto.
- `git diff --check`: correcto.
- QA funcional: importación anónima, recuperación en otro navegador, aislamiento entre cuentas y nombre de perfil consistente.
- El build local con Webpack solo quedó limitado por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; no hubo errores propios de Fase 7.

## Archivos clave

- `lib/aerocomms/persistence-contract.ts`, `persistence-server.ts`, `persistence-client.ts`, `persistence-merge.ts`.
- `lib/aerocomms/appState.tsx`.
- `app/api/aerocomms/progress/sync/route.ts`, `app/api/aerocomms/progress/reset/route.ts`.
- `supabase/migrations/20260712110000_create_aerocomms_progress_persistence.sql`.

## Validación

- `npm test`: 359 tests correctos.
- `npx tsc --noEmit --pretty false`: correcto.
- `npm run build -- --webpack`: bloqueado únicamente por `ENOTFOUND fonts.googleapis.com` al descargar Geist y Geist Mono; validar en Vercel o en un entorno con red.
- ESLint focalizado y `git diff --check`: correctos.

## Handoff histórico hacia Fase 8

La auditoría inicial ya se completó y dio lugar al directorio y la ficha operativa de usuarios. Fase 8 quedó cerrada y desplegada; el siguiente paso vigente está documentado arriba.

## Decisión estratégica de roadmap

- Se descarta crear leads automáticamente por usar AeroComms, completar onboarding, crear una cuenta, importar progreso o completar actividades.
- Todos los usuarios con cuenta deben poder verse operativamente en Warhome, aunque no tengan lead.
- Cuenta/perfil, actividad de producto, lead comercial, consentimiento de marketing y cliente futuro son entidades separadas.
- La Fase 8 pasa a ser Usuarios y actividad de AeroComms.
- La revisión final de AeroComms se mantiene al final del roadmap como Fase 13.
- El backend de opiniones de escuelas se incorpora como Fase 9 propia.
- Pagos y entitlements pasan a Fase 10.
- CRM y automatizaciones avanzadas pasan a Fase 11.
- Warhome / Warboard completo pasa a Fase 12, ampliando el Warhome MVP ya completado.

## Restricciones de alcance

- No añadir Stripe, compras, entitlements, AeroComms Pro, audio, transcripciones, persistencia de Career Planner ni cambios de ejercicios.
- Mantener identidad FlyPath separada de autorización `admin_users` y no convertir uso normal de AeroComms en captación comercial.
- La migración de Fase 7 ya está aplicada; cualquier cambio posterior de Supabase requiere una verificación previa de migraciones pendientes.
- Mantener la separación entre identidad FlyPath y autorización Warhome.
