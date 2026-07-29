# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase actual: 10.5 — Production Launch & Hardening.** La Fase 10 — Pagos, monetización y entitlements está **COMPLETADA**: Stripe Live preparado con productos y Price IDs de AeroComms Pro, Career Planner Premium y la guía Cómo ser Piloto; Checkout, webhooks, Customer Portal, entitlements y separación Test/Live validados. También está integrada la sincronización operativa de mentorías con Cal.com; su QA de reserva real sigue bloqueada por un problema externo del checkout de Cal.com. Antes del lanzamiento quedan el diseño público de opiniones de escuelas, la auditoría de datos del comparador, rendimiento y la migración al dominio definitivo. Validación técnica: 698 tests, TypeScript y lint correctos.

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
- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` (solo servidor; el entorno Test/Live se separa por configuración)

## Documentación operativa

| Documento | Contenido |
|-----------|-----------|
| [CURRENT_PHASE.md](./CURRENT_PHASE.md) | Fase actual, flujos de captación, estado real |
| [ACTIVE_TASK.md](./ACTIVE_TASK.md) | Continuidad y siguiente validación externa |
| [ROADMAP.md](./ROADMAP.md) | Roadmap por fases |
| [BACKLOG.md](./BACKLOG.md) | Mejoras pospuestas y pendientes |
| [LAST_SESSION.md](./LAST_SESSION.md) | Último handoff operativo |
