# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase actual: 11 — CRM y automatizaciones.** La Fase 10.5 — Production Launch & Hardening está **COMPLETADA**: FlyPath opera en [`https://www.flypath.es`](https://www.flypath.es), con redirección del apex a `www`, seguridad pre-lanzamiento, rendimiento, Vercel Analytics, Speed Insights y SEO técnico validados. El hosting web de Hostinger se retiró; se mantienen el dominio, el correo y sus registros DNS. El primer bloque de Fase 11 es una auditoría sin cambios de código ni migraciones del sistema existente de leads, contactos, consentimiento, emails y automatizaciones.

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
| [Content OS PilotFeliu](./docs/ai/content-os/pilotfeliu-content-os-command-center.md) | Especificación funcional de la herramienta interna de contenido |
