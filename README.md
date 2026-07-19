# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase 7 — Persistencia AeroComms.** Implementada con progreso autenticado local-first, sesiones idempotentes, reset remoto persistente e importación explícita del progreso anónimo. La migración remota está aplicada y el QA funcional está aprobado. El nombre permanece local para anónimos y, con cuenta, usa `profiles.full_name` tras una decisión explícita ante conflictos. El build local queda pendiente únicamente por el acceso a Google Fonts; debe validarse en Vercel o en un entorno con red. Sin pagos, entitlements ni cambios Free/Pro.

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
| [ACTIVE_TASK.md](./ACTIVE_TASK.md) | Tarea activa de Fase 7 |
| [ROADMAP.md](./ROADMAP.md) | Roadmap por fases |
| [BACKLOG.md](./BACKLOG.md) | Mejoras pospuestas y pendientes |
| [LAST_SESSION.md](./LAST_SESSION.md) | Último handoff operativo |
