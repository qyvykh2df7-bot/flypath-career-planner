# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase 9 — Backend de opiniones de escuelas.** La Fase 8 — Usuarios y actividad de AeroComms está CLOSED / COMPLETED / DEPLOYED: commit `73758c1 feat(warhome): add AeroComms user operations`, publicado en `main`, migración `20260712120000_create_warhome_user_directory.sql` aplicada en Supabase remoto, 398 pruebas correctas, TypeScript correcto, QA manual aprobado y deployment de Vercel confirmado manualmente. Warhome muestra todas las cuentas FlyPath/AeroComms, tengan o no lead; cuenta, perfil, actividad de producto, lead y consentimiento de marketing permanecen separados. El uso normal de AeroComms no crea leads ni consentimiento de marketing. La primera tarea de Fase 9 es auditar escuelas, opiniones, fichas, comparador y Warhome antes de diseñar la migración y la moderación.

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
| [ACTIVE_TASK.md](./ACTIVE_TASK.md) | Tarea activa de Fase 9 |
| [ROADMAP.md](./ROADMAP.md) | Roadmap por fases |
| [BACKLOG.md](./BACKLOG.md) | Mejoras pospuestas y pendientes |
| [LAST_SESSION.md](./LAST_SESSION.md) | Último handoff operativo |
