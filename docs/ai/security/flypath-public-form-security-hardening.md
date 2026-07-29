# FlyPath - Hardening de formularios públicos

## Estado

Completado en Fase 10.5 con la migración
`20260712320000_harden_public_forms_and_marketing_opt_in.sql` aplicada en
Supabase Production.

## Superficies protegidas

- Newsletter de Home.
- Solicitud de informe del Career Planner.
- Waitlist Pre-PPL.
- Solicitud de acompañamiento / mentoría.
- Creación, reenvío y verificación de opiniones de escuelas.

Las rutas validan `Content-Type`, body limitado, claves cerradas, campos
normalizados, same-origin, honeypot vacío y un timestamp de apertura de
formulario. Los rechazos de validación, cuota o infraestructura ocurren antes
de crear leads, opiniones, jobs de email o alertas internas.

## Cuotas distribuidas

La tabla privada `public_form_rate_limits` conserva únicamente subjects HMAC
SHA-256. La RPC `consume_public_form_rate_limit` bloquea la fila de cuota y
solo puede ejecutarse con `service_role`.

| Superficie | IP | Identidad |
|---|---:|---:|
| Newsletter | 3/h | 2/día por email |
| Career Planner | 5/h | 3/día por email |
| Pre-PPL | 5/h | 3/día por email |
| Mentorías | 5/h | 3/día por email |
| Opiniones | 5/h | 5/día por escuela y email o usuario |

Las rutas de reenvío y verificación de opiniones tienen límites propios. La IP
en producción procede exclusivamente de `x-vercel-forwarded-for`; no se usa
un `x-forwarded-for` aportado por el cliente. Si faltan el salt, la RPC o
Supabase, la ruta falla cerrada con `503`. Al superar una cuota devuelve `429`
y `Retry-After`.

`PUBLIC_FORM_RATE_LIMIT_SALT` es un secreto aleatorio server-only de al menos
32 caracteres configurado como variable sensible en local, Vercel Production
y Preview. A pesar del nombre, no es una variable `NEXT_PUBLIC_*` y su único
consumidor está en `lib/security/public-form-security.ts`, marcado
`server-only`.

## Marketing y doble opt-in

El newsletter de Home y el consentimiento explícito del Career Planner ya no
activan marketing durante el primer POST. Se crea un token opaco de un único
propósito, se almacena solo su hash SHA-256, caduca en 48 horas y se entrega
por la cola transaccional existente. La confirmación usa un POST genérico a
`/api/email/confirm-marketing`; no enumera emails ni tokens y es idempotente.

Pre-PPL y mentorías conservan únicamente sus emails operativos. Las opiniones
no crean consentimiento, leads ni suscripciones de marketing.

## Limpieza y seguimiento

La RPC privada `purge_public_form_security_data` elimina cuotas sin actividad
tras tres días y tokens expirados, consumidos o revocados tras 30 días. No se
ha añadido un scheduler nuevo en este bloque: debe invocarse con `service_role`
desde la automatización operativa que se adopte en hardening posterior.

Mejoras no bloqueantes:

1. Programar la invocación segura de limpieza.
2. Evaluar parsing multipart en streaming para cargas públicas grandes.
3. Ejecutar una prueba de concurrencia real de la RPC de cuota.
