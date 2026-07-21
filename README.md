# FlyPath Career Planner

Plataforma FlyPath para aspirantes a piloto: Career Planner, comparador de escuelas, mentorías, AeroComms y captación de leads conectada a Supabase.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase.

## Estado actual

**Fase 10 — Pagos, monetización y entitlements.** 10C y 10D están **CLOSED / COMPLETED / TESTED** en Stripe sandbox para Career Planner Premium (5,95 EUR, pago único, invitado o autenticado). El webhook firmado es la fuente de verdad, registra el pago interno y deja los estados de éxito y fallo coherentes. La success URL solo muestra un popup de verificación y la entrega usa un token opaco `HttpOnly`, hasheado, limitado a cinco descargas y con caducidad. No crea entitlements y Stripe live permanece desactivado.

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
