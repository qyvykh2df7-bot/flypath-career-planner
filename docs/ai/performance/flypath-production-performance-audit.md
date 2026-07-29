# Auditoría de rendimiento pre-lanzamiento — FlyPath

**Fecha:** 2026-07-29
**Base:** Next.js `16.2.12`, build Webpack de producción y Lighthouse 13.4.1 con Chrome local.

## Alcance revisado

- Públicas: `/`, `/escuelas`, `/schools/european-flyers`, `/opiniones-escuelas`, `/shop` y `/login`.
- Producto: `/career-planner`, `/aerocomms`, `/aerocomms/app/today`, `/aerocomms/app/train` y Mission Library.
- Producción: Lighthouse y comprobación visual de la home y rutas públicas representativas después del despliegue.

Las métricas de superficies autenticadas son orientativas cuando no hay una sesión real: no se usaron datos de cuentas, pagos ni contenido privado para mejorar artificialmente la medición.

## Hallazgos y correcciones

1. La home entregaba los PNG originales de los mockups de recursos. Cuatro imágenes descargaban entre 1 MiB y 2 MiB aunque se visualizaban en tarjetas de hasta 280 px.
   - `HomeResourcesShowcase` usa ahora `next/image`, conserva el mismo encuadre y reserva el espacio existente.
   - Define `sizes` por breakpoint; la carga continúa siendo diferida fuera de la vista.
2. El modal de la waitlist Pre-PPL se incluía con la home aun cuando el usuario no lo abría.
   - Se importa dinámicamente al solicitarlo, sin cambiar su flujo, tracking ni formulario.
3. Las imágenes de tarjetas, portada y hero del blog se entregaban como archivos fuente mediante `<img>`.
   - Se han pasado al pipeline de `next/image` con dimensiones responsivas y el mismo comportamiento de fallback.

## Línea base y resultado medido

| Ruta / perfil | Antes | Después | Observación |
|---|---:|---:|---|
| `/` móvil local, Performance | 91 | 92 | Medición caliente reproducible. |
| `/` móvil local, LCP | 3,57 s | 3,32 s | El LCP sigue siendo el hero, ya preloaded. |
| `/` móvil local, transferencia | 6,21 MiB | 676 KiB | -89 %; el cambio procede de mockups responsivos. |
| `/` móvil local, TBT / CLS | 4 ms / 0,001 | 0 ms / 0,000 | Sin regresión visual observada. |
| `/` escritorio local, transferencia | 7,54 MiB | 820 KiB | -89 %; Performance 99 → 100. |
| `/` móvil Production | 6,24 MiB, score 97 | 709 KiB, score 96 | -89 % de transferencia; TBT 0 ms y CLS 0,001. El LCP de laboratorio fluctúa de 2,59 s a 2,73 s según red/CPU. |

Lighthouse local inicial: `/escuelas` 91, ficha 88, opiniones 91, shop 87 y login 95 en móvil. Las rutas no tocadas mantienen transferencias de 261–510 KiB y CLS de 0–0,001. Las superficies de producto medidas sin sesión se mantienen en rangos razonables: Career Planner 90, landing AeroComms 94, Today 82 y Train 83; no se cambió su comportamiento ni se cargaron sus módulos en páginas públicas.

## QA de producción tras el despliegue

Deployment Production `dpl_AgUdS8Zz5cbuxUb8dtViheBkPQWx` quedó `Ready` y sirve `https://flypath-career-planner.vercel.app`.

| Ruta móvil Production | Performance | LCP | Transferencia |
|---|---:|---:|---:|
| `/` | 96 | 2,73 s | 709 KiB |
| `/escuelas` | 97 | 2,59 s | 474 KiB |
| `/schools/european-flyers` | 90 | 1,23 s | 282 KiB |
| `/opiniones-escuelas` | 96 | 2,74 s | 414 KiB |
| `/shop` | 95 | 2,88 s | 537 KiB |
| `/login` | 98 | 2,29 s | 334 KiB |
| `/aerocomms` | 96 | 2,77 s | 438 KiB |

La portada publicada entrega los mockups mediante `/_next/image`; no conserva las referencias a los PNG originales. La comprobación visual a 390 px no encontró desbordamiento horizontal, las imágenes relevantes cargan y no se registraron errores de consola. Se preservó el comportamiento de los CTA y no se ejercitaron flujos que creen datos, pagos o sesiones de usuario.

## Decisiones de caché y renderizado

- Las páginas públicas estables permanecen estáticas o SSG según el build.
- Las cuentas, pagos, entitlements y progreso AeroComms siguen dinámicos y sin caché pública.
- El catálogo público de escuelas ya usa una respuesta cacheable de cinco minutos con `stale-while-revalidate`; no se modificó su fallback local ni se introdujo una migración de datos.
- Career Planner ya carga los generadores PDF de `@react-pdf/renderer` bajo demanda. No se modificó esta división.

## Pendiente no bloqueante

- Añadir medición de usuarios reales con Vercel Speed Insights y contrastar PageSpeed sobre el dominio definitivo.
- Repetir Lighthouse con sesión real para Today, Train y Mission Library antes de declarar objetivos de INP de producto.
- Revisar el bundle de `/schools` si el catálogo público crece materialmente; su fallback local actual es una decisión de resiliencia y no se ha sustituido sin evidencia.
