# AeroComms — Hardening de APIs de voz

## Estado

Completado y desplegado en Production con la migración `20260712310000_add_aerocomms_voice_rate_limits.sql`.

## Política de acceso y cuota

| Perfil | TTS | STT |
|---|---:|---:|
| Anónimo | 8 por 10 minutos | 2 por hora |
| FlyPath autenticado Free | 30 por 10 minutos | 8 por hora |
| AeroComms Pro | 90 por 10 minutos | 100 por hora |

La identidad se resuelve con `auth.getUser()` en servidor. Pro se determina únicamente desde el entitlement server-side `aerocomms_pro`; el estado local no autoriza ninguna cuota ni acceso.

## Controles aplicados

- La tabla `aerocomms_voice_rate_limits` almacena únicamente hashes HMAC de sujetos de cuota. Tiene RLS activa y no concede acceso directo a `PUBLIC`, `anon`, `authenticated` ni `service_role`.
- La RPC `consume_aerocomms_voice_rate_limit` es `SECURITY DEFINER`, fija `search_path` y solo puede ejecutarse mediante `service_role`. Usa bloqueo de fila e inserción tolerante a carreras para mantener la cuota distribuida.
- `AEROCOMMS_VOICE_RATE_LIMIT_SALT` es obligatorio, aleatorio y sensible; está configurado en Vercel Production y Preview, pero nunca en Git.
- TTS acepta solo `text` y un `profileId` cerrado. Modelo, voz, formato y estilo se resuelven en servidor.
- STT limita `Content-Length`, tamaño real, MIME, campos multipart y lenguaje. No acepta modelo, prompt ni otros parámetros del proveedor desde el cliente.
- Si faltan auth, cuota, salt, RPC o configuración, las rutas devuelven `503` y no llaman a OpenAI.

## QA de Production

Se validaron TTS y STT con solicitudes mínimas válidas, rechazos de body, longitud y MIME, multipart inválido y agotamiento controlado de la cuota anónima STT con respuesta `429` y `Retry-After`. Las pruebas con cuenta Free y Pro quedan para QA manual porque no se utilizaron cuentas reales durante este cierre.

## Hardening posterior no bloqueante

1. Sustituir el parsing multipart por una alternativa streaming para limitar memoria cuando no existe `Content-Length` fiable.
2. Añadir una limpieza programada de cuotas inactivas basada en `updated_at`.
3. Ejecutar una prueba de concurrencia real contra la RPC Supabase.
