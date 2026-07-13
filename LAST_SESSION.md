# Última sesión — handoff operativo

**Fecha:** 2026-07-13
**Rama:** `feature/emails-operativos-phase-5` (sincronizada con `origin`; **no mergeada** a `main`)

---

## Resumen

- **Fase 5 — Emails operativos** cerrada en implementación y validación.
- Resend operativo; webhooks productivos; Warhome Emails validado.
- Bloque **5D** (consentimiento, bajas, historial, supresiones) implementado; **código pendiente de commit**.
- **Siguiente fase:** Fase 6 — Login y cuentas FlyPath.

---

## Rama y estado git

| Item | Valor |
|------|-------|
| Rama actual | `feature/emails-operativos-phase-5` |
| Último commit remoto | `68a5918` — *Show email delivery and engagement in Warhome* |
| Bloque 5D | En working tree (modificados + untracked); **sin commit** |
| Merge a `main` | **No realizado** |

### Working tree esperado (5D, sin commit)

**Modificados:** separación transaccional, textos de consentimiento, Warhome detalle lead, templates, captación.

**Sin seguimiento (nuevos):**

- `app/api/email/unsubscribe/`, `app/email/unsubscribe/`, `components/email/`
- `lib/email/unsubscribe.ts`, tests asociados
- `lib/leads/consent-texts.test.ts`, `lib/leads/email-subscription-policy.test.ts`
- `lib/email/subscription-suppressions.test.ts`
- `supabase/migrations/20260712090000_add_email_subscription_consent_history.sql`
- `supabase/migrations/20260712100000_propagate_email_subscription_suppressions.sql`

---

## Commits principales — Fase 5

| Commit | Descripción |
|--------|-------------|
| `aac5ceb` | Add Career Planner transactional email foundation |
| `eacbe5d` | Add Pre-PPL transactional confirmation email |
| `40849ac` | Add mentorship confirmation and internal alert emails |
| `b8a6382` | Add Warhome operational email monitoring |
| `c4a9fb3` | Add secure Resend webhook processing |
| `68a5918` | Show email delivery and engagement in Warhome |

Integración Warhome MVP en esta rama: merge `b335d10`.

---

## Migraciones Supabase

**Aplicadas en remoto hasta `20260712100000`:**

| Migración | Alcance |
|-----------|---------|
| `20260712050000` | Jobs transaccionales |
| `20260712060000` | Template key Pre-PPL |
| `20260712070000` | Template keys mentoría |
| `20260712080000` | Webhooks Resend + engagement en deliveries |
| `20260712090000` | Historial consentimiento + tokens de baja |
| `20260712100000` | Propagación supresiones a suscripciones |

Archivos `90000` y `100000` existen en el working tree; **pendientes de commit** en la rama.

---

## Resend y webhooks

| Aspecto | Estado |
|---------|--------|
| Proveedor | Resend configurado; dominio con SPF/DKIM/DMARC |
| Envíos transaccionales | Operativos (Career Planner, Pre-PPL, Acompañamiento, alerta interna) |
| Webhook productivo | Funcionando (`/api/webhooks/resend`) |
| Eventos `email.opened` / `email.clicked` | **Desactivados** en configuración Resend (reputación del dominio) |
| Esquema open/click | Implementado en `email_deliveries`; Warhome lo muestra cuando hay datos |

---

## Warhome Emails

- Vista `/warhome/emails` validada: filtros, listado de entregas, estados y engagement.
- Separada de Leads; ficha de lead muestra suscripciones, resumen marketing y último cambio por lista.
- Historial de email individual por lead: aplazado a fases posteriores.

---

## Consentimiento y bajas (5D)

| Entrega | Estado |
|---------|--------|
| Separación transaccional / marketing | Implementado |
| Textos UI = constantes servidor | Implementado |
| Baja segura por lista (token hash) | Implementado |
| Historial `email_subscription_events` | Implementado |
| Propagación `bounced` / `complained` / `suppressed` | Implementado (migración `12100000`) |
| Commit en git | **Pendiente** |

---

## Validaciones de sesión

| Comando | Resultado |
|---------|-----------|
| `npm test` | 218 tests OK |
| `npx tsc --noEmit` | OK |
| `npm run build` | OK |
| Revisión migraciones `90000` / `100000` | APROBADO |
| Revisión Bloque 5D | APROBADO (tras corrección contrato RPC `RETURNS TABLE`) |

---

## Estado del proyecto

| Área | Estado |
|------|--------|
| AeroComms (`/aerocomms/app`) | Operativa (Fase 0) |
| Captación pública | Operativa (Fase 2) |
| Tracking | Completada en `main` (Fase 3) |
| Warhome MVP | En rama; pendiente merge `main` |
| Emails operativos | **Completada** (Fase 5; 5D sin commit) |
| Login y cuentas | **Siguiente** (Fase 6) |

---

## Próximo paso

1. Validación final del working tree 5D.
2. **Commit** del bloque 5D en `feature/emails-operativos-phase-5`.
3. **Push** de la rama.
4. Definir alcance inicial de **Fase 6** (ver `ACTIVE_TASK.md`).

---

## Referencias

- `CURRENT_PHASE.md` — Fase 6 como actual.
- `ACTIVE_TASK.md` — sin tareas activas de Fase 5.
- `ROADMAP.md` — Fase 5 completada; trabajo diferido documentado.
