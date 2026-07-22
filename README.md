# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase 10 — Pagos, monetización y entitlements.** El bloque **10G — AeroComms Pro Subscription Billing** está **CLOSED / COMPLETED** en `main` mediante `1c84833`. AeroComms Pro requiere una cuenta FlyPath, usa Stripe Checkout server-side con un precio cerrado de **7,37 EUR/mes** y activa el acceso exclusivamente mediante el entitlement `aerocomms_pro` confirmado por webhook. Incluye cancelación al final del periodo, gracia de 48 horas ante `invoice.payment_failed` y revocación inmediata ante reembolso o disputa. Stripe live sigue desactivado.

## Comandos

```bash
npm run dev    # servidor de desarrollo
npm run build  # build de producción
npm run lint   # ESLint
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; nunca en cliente)
- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` (solo Stripe test y solo servidor)

## Documentación operativa

| Documento | Contenido |
|-----------|-----------|
| [CURRENT_PHASE.md](./CURRENT_PHASE.md) | Fase actual, flujos de captación, estado real |
| [ACTIVE_TASK.md](./ACTIVE_TASK.md) | Tarea activa de Fase 10 |
| [ROADMAP.md](./ROADMAP.md) | Roadmap por fases |
| [BACKLOG.md](./BACKLOG.md) | Mejoras pospuestas y pendientes |
| [LAST_SESSION.md](./LAST_SESSION.md) | Último handoff operativo |
