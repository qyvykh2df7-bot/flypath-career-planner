# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase 10 — Pagos, monetización y entitlements.** La Fase 9 — Backend de opiniones de escuelas está cerrada técnicamente: catálogo público endurecido, migraciones `20260712130000`, `20260712140000` y `20260712150000` aplicadas en Supabase, formulario con verificación por email, lectura pública exclusiva de reseñas aprobadas, moderación atómica privada en Warhome y estrellas del Career Planner basadas únicamente en opiniones aprobadas. Cuenta, lead, marketing y opiniones permanecen separados; crear una opinión no crea captación ni consentimiento. La QA manual y responsive final de opiniones sigue siendo el único cierre operativo pendiente antes de su publicación.

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

## Documentación operativa

| Documento | Contenido |
|-----------|-----------|
| [CURRENT_PHASE.md](./CURRENT_PHASE.md) | Fase actual, flujos de captación, estado real |
| [ACTIVE_TASK.md](./ACTIVE_TASK.md) | Tarea activa de Fase 10 |
| [ROADMAP.md](./ROADMAP.md) | Roadmap por fases |
| [BACKLOG.md](./BACKLOG.md) | Mejoras pospuestas y pendientes |
| [LAST_SESSION.md](./LAST_SESSION.md) | Último handoff operativo |
