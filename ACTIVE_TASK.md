# Tarea activa — Fase 6A.1 (arranque documental)

## Estado de la plataforma

- Fase 4 — Warhome MVP: completada e integrada en `main`.
- Fase 5 — Emails operativos: completada e integrada en `main`.
- Merge actual de `main`: `aa4f4fe Merge operational emails phase`.
- Fase actual: Fase 6 — Login, cuentas y perfiles.

## Contrato de cuenta

- Una única cuenta general FlyPath para toda la plataforma.
- La cuenta no es un producto ni un plan gratuito.
- Identidad en Supabase Auth.
- Login público mediante email y código OTP, sin contraseña inicialmente.
- Sesión persistente.
- Warhome conserva autorización separada mediante `admin_users`.

## Decisiones de producto

### AeroComms

- Se puede usar sin cuenta, con acceso gratuito aproximado al 30 % de Cadet y una misión gratuita.
- El progreso permanece local en esta fase.
- Crear una cuenta no desbloquea contenido; permitirá sincronizar progreso más adelante.
- AeroComms Pro, cuenta obligatoria y Stripe quedan para una fase posterior.

### Career Planner

- El flujo gratuito sigue sin exigir login.
- Guardar planes y funciones premium quedan fuera de Fase 6.

## División de Fase 6

| Bloque | Alcance | Criterio de cierre |
|--------|---------|--------------------|
| 6A | Helpers de sesión, contrato de cuenta y coexistencia con Warhome | Un usuario normal conserva su sesión al visitar Warhome; `admin_users` sigue siendo autorización separada |
| 6B | `/login`, `/login/verify`, OTP, `next` seguro, sesión persistente y logout | Login OTP usable y protegido sin contraseñas nuevas |
| 6C | `profiles` idempotente y vínculo de lead por email verificado | Perfil reutilizado, lead existente vinculado solo cuando procede, sin crear leads |
| 6D | `/account` y estados del header | Nombre, email y logout sin dashboard complejo |
| 6E | Contrato versionado del progreso local de AeroComms | Datos sincronizables definidos; audio y transcripciones excluidos; sin sync remoto |
| 6F | QA, documentación y merge | Desktop, móvil, Safari y coexistencia usuario/admin validados |

## Fuera de alcance

- Stripe, compras, entitlements y AeroComms Pro real.
- Persistencia remota de progreso y guardado real de Career Planner.
- Google/Apple login, contraseñas, cambio de email y eliminación automática de cuenta.
- Dashboard avanzado y notificaciones.

## Próximo trabajo

Definir en 6A los helpers de sesión y el contrato compartido de cuenta, revisar la coexistencia con el proxy de Warhome y corregir el comportamiento de sesión antes de construir el login OTP.
