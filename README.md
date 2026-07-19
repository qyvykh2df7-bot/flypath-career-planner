# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase 8 — Usuarios y actividad de AeroComms.** Implementación técnica terminada y pendiente de QA manual final, commit, push y deployment. Warhome dispone de directorio y ficha protegida para todas las cuentas FlyPath/AeroComms, tengan o no lead; cuenta, perfil, actividad de producto, lead y consentimiento de marketing permanecen separados. 398 pruebas, TypeScript, lint focalizado y `git diff --check` correctos. El build local con webpack sigue bloqueado únicamente por la resolución de Google Fonts. El uso normal de AeroComms, el onboarding, la cuenta y la importación de progreso no crean leads ni consentimiento de marketing. Compras y entitlements se abordarán en Fase 10.

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
| [ACTIVE_TASK.md](./ACTIVE_TASK.md) | Tarea activa de Fase 8 |
| [ROADMAP.md](./ROADMAP.md) | Roadmap por fases |
| [BACKLOG.md](./BACKLOG.md) | Mejoras pospuestas y pendientes |
| [LAST_SESSION.md](./LAST_SESSION.md) | Último handoff operativo |
