# FlyPath — Hardening web previo al lanzamiento

## Implementado localmente

- Origen público único: `FLYPATH_CANONICAL_ORIGIN`, normalizado y obligatorio fuera de desarrollo. Stripe, confirmaciones por email, contexto de tracking y comprobaciones same-origin ya no derivan URLs públicas desde `Host` ni `request.url`.
- Producción y Preview usan el mismo origen canónico aprobado. Si falta o no es HTTPS, los flujos server-side que generan URLs públicas fallan cerrados.
- Cabeceras globales: CSP cerrada sin `unsafe-eval` en producción, anti-embedding, `nosniff`, política de referrer, permisos restringidos, aislamiento de recursos y HSTS en producción. `unsafe-inline` permanece únicamente para estilos y scripts de Next.js que no exponen hashes estables.
- Webhooks Stripe (1 MiB), Cal.com (256 KiB) y Resend (256 KiB) validan JSON, `Content-Length` y el tamaño real del stream antes de verificar firmas o ejecutar efectos secundarios.
- Previews, herramientas Supabase y `/review/*` quedan disponibles solo en desarrollo/test y devuelven 404 en deployments; además incluyen `noindex`.

## Configuración

- `FLYPATH_CANONICAL_ORIGIN` debe estar configurada en `.env.local`, Vercel Production y Vercel Preview como URL HTTPS sin path, query ni fragment.
- Preview no infiere su origen de headers o de la URL temporal del deployment: usa la URL canónica configurada. Esto evita enlaces de correo o Checkout reflejados desde hosts no aprobados.

## Verificación

- 771 tests correctos, TypeScript, lint focalizado, `git diff --check` y build Webpack correctos en local.
- Deployment Production `dpl_66uEFUVQSeAFSGADCrfVDCvYtD1S` publicado y `Ready`. QA remoto: cabeceras presentes; `/review/cost` y previews internas devuelven `404`; `/opiniones-escuelas` y `/schools` devuelven `200`; los bodies reales por encima de cada límite responden `413` antes de firma.
- Las respuestas y logs de los nuevos controles no incluyen cuerpo de webhook, firma, token, email ni secreto.

## Dependencias auditadas

- `next` y `eslint-config-next`: `16.2.4` → `16.2.12`; React y React DOM permanecen en `19.2.4`, dentro de las peer dependencies oficiales.
- `vitest`: `3.2.4` → `3.2.6`; `vite` `7.3.5` y `esbuild` `0.28.1` solo se usan en desarrollo/pruebas.
- Overrides acotados y trazables de `postcss@8.5.18` y `sharp@0.35.1` corrigen las dependencias exactas que Next 16.2.12 mantenía vulnerables. `js-yaml` se actualizó a `3.15.0` para `gray-matter`.
- `npm audit --omit=dev`: **0 vulnerabilidades**. El audit completo conserva un High de `brace-expansion` y un Low de `esbuild`, ambos transitivos de tooling de desarrollo y no desplegados en Vercel; no hay corrección no disruptiva adicional dentro de sus rangos actuales.
