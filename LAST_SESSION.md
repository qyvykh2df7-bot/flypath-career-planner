# Última sesión — Fase 8 cerrada y desplegada; handoff a Fase 9

**Fecha:** 2026-07-19
**Rama:** `main`
**Estado:** Fase 8 — Usuarios y actividad de AeroComms: CLOSED / COMPLETED / DEPLOYED. La siguiente fase es Fase 9 — Backend de opiniones de escuelas.

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
