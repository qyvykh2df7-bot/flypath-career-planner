# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase actual: 10.5 — Production Launch & Hardening.** La Fase 10 — Pagos, monetización y entitlements está **COMPLETADA**. El hardening web previo al lanzamiento incorpora origen canónico server-side, cabeceras de seguridad, límites de webhooks y bloqueo de herramientas internas en producción. `next` está actualizado a `16.2.12`; la auditoría de dependencias de producción queda en cero vulnerabilidades. Validación local: 771 tests, TypeScript, lint y build Webpack correctos.

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
- `FLYPATH_CANONICAL_ORIGIN` (URL HTTPS pública aprobada; requerida fuera de desarrollo)

## Documentación operativa

| Documento | Contenido |
|-----------|-----------|
| [CURRENT_PHASE.md](./CURRENT_PHASE.md) | Fase actual, flujos de captación, estado real |
| [ACTIVE_TASK.md](./ACTIVE_TASK.md) | Continuidad y siguiente validación externa |
| [ROADMAP.md](./ROADMAP.md) | Roadmap por fases |
| [BACKLOG.md](./BACKLOG.md) | Mejoras pospuestas y pendientes |
| [LAST_SESSION.md](./LAST_SESSION.md) | Último handoff operativo |
