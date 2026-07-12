# FlyPath — Backlog

Ítems pospuestos conscientemente o pendientes fuera de la fase actual. No duplica el roadmap por fases; recoge mejoras concretas de producto y operación.

**Fase actual:** Fase 5 — Emails operativos (ver `CURRENT_PHASE.md`).

---

## Warhome — mejoras pospuestas (Fase 4 cerrada)

| Ítem | Descripción | Prioridad |
|------|-------------|-----------|
| Notas internas | UI para `admin_notes` en ficha de lead | Media |
| Edición de leads | Cambiar etapa, estado y archivar desde Warhome | Media |
| Recorrido anónimo | Timeline con eventos pre-conversión vía `anonymous_id`/`session_id` (requiere eventos cliente en producción y consentimiento operativo) | Baja |
| Analytics | Módulo de analítica en nav (actualmente “Próximamente”) | Baja |
| Refinamiento visual | Pulido UI/UX avanzado del shell y fichas | Baja |
| Diferenciación owner/admin | Permisos distintos por rol | Baja |
| Vista acompañamiento | Bandeja dedicada de solicitudes (hoy operable vía filtro `mentoring` + detalle) | Baja |

---

## Tracking — observación pendiente (no bloquea fases)

| Ítem | Descripción |
|------|-------------|
| Eventos cliente en producción | `page_viewed`, `form_completed`, `cta_clicked`, `form_started`, `popup_opened` sin registros observados en Supabase remoto |
| Consentimiento operativo | CMP/banner que otorgue `flypath_analytics_consent=granted` |

---

## AeroComms — fuera de Warhome

Ver `ROADMAP.md` fases 7–9: persistencia, revisión de voces/QA y pagos Pro.

---

## Referencias

- `ROADMAP.md` — fases y estado global.
- `CURRENT_PHASE.md` — fase actual.
- `ACTIVE_TASK.md` — trabajo inmediato.
