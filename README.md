# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase 10 — Pagos, monetización y entitlements.** La Fase 9 — Backend de opiniones de escuelas está **CLOSED / COMPLETED / DEPLOY READY**: catálogo público endurecido, migraciones `20260712130000`, `20260712140000` y `20260712150000` aplicadas en Supabase, formulario con verificación por email, lectura pública exclusiva de reseñas aprobadas y moderación atómica privada en Warhome. En Career Planner, las estrellas representan únicamente `school_reviews` aprobadas; las escuelas sin opiniones muestran “Sin opiniones” y el ajuste al perfil se presenta como un score independiente. La QA manual ya validó el flujo completo. Cuenta, lead, marketing y opiniones permanecen separados; crear una opinión no crea captación ni consentimiento. Como mejora futura, la presentación visual de las opiniones públicas requiere una iteración de diseño.

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
