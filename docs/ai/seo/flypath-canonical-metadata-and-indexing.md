# FlyPath — Canonicals, metadata social e indexación

## Decisión

La única fuente de las URLs públicas de FlyPath es `FLYPATH_CANONICAL_ORIGIN`, resuelta en servidor por `lib/security/canonical-origin.ts`. En producción es `https://www.flypath.es`; las rutas no derivan sus canonicals, callbacks ni metadata desde `Host` o `request.url`.

## Contrato público

- `app/layout.tsx` define `metadataBase` y el fallback social global desde el origen canónico.
- `lib/seo/public-metadata.ts` genera el contrato completo de cada página pública: canonical absoluto, `og:url`, `og:image`, `og:siteName` y tarjeta Twitter.
- Cada ruta pública usa su propia URL canónica. Las imágenes sociales proceden de assets públicos existentes de FlyPath; no se usan previews ni URLs de Vercel.
- Las fichas `/schools/[slug]` generan metadata desde `SchoolEntry` público. Una ficha inexistente es `noindex` y mantiene el `404`; la lectura se memoiza con `React.cache` entre metadata y render.

## Sitemap y robots

- `app/sitemap.ts` contiene solo rutas públicas reales, artículos y fichas comparables de escuelas.
- No incluye login, cuenta, Warhome, previews, QA, `/dashboard`, `/premium-report-thumb`, `/review/*` ni `/aerocomms/app/*`.
- `app/robots.ts` permite el rastreo público y declara únicamente el sitemap canónico. No se utiliza como barrera de privacidad.

## Rutas internas

- `/dashboard` y `/premium-report-thumb` son herramientas de desarrollo/test: devuelven `404` fuera de esos entornos y conservan `noindex, nofollow` como defensa adicional.
- `/aerocomms/app/*` sigue operativa para usuarios, pero su layout y sus cabeceras incluyen `noindex, nofollow`.
- Cuenta, Warhome, flujos de login y páginas de confirmación continúan fuera de indexación.

## Validación operativa

La implementación se validó localmente con 778 tests, TypeScript, lint focalizado, build Webpack, `git diff --check` y `npm audit --omit=dev` sin vulnerabilidades de producción. El QA Production del deployment `dpl_6UvzDTHyiekhuA39qj4XbKaFqLgX` confirmó redirección `308` del apex a `www`, metadata social/canonical, imágenes OG y sitemap público sin rutas internas.

Después de cada despliegue comprobar:

1. `https://flypath.es` redirige en un salto permanente a `https://www.flypath.es/`.
2. Canonical, `og:url`, imagen OG y Twitter en home, comparador, una ficha de escuela, opiniones, shop, AeroComms, login y Career Planner.
3. `sitemap.xml` contiene solo URLs `www` y no expone rutas internas.
4. `/dashboard`, `/premium-report-thumb` y `/review/*` devuelven `404` en producción; `/aerocomms/app/today` funciona con `noindex`.
