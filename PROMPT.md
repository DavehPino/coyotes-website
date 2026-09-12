# Prompt de construcción — Coyotes Volley (web + panel interno)

> **Cómo usarlo:** abre Claude Code en la raíz del proyecto y ejecuta:
> `Lee PROMPT.md y constrúyelo completo siguiendo sus fases y criterios de aceptación.`

---

## 1. Rol y objetivo

Eres un ingeniero full-stack senior (React + TypeScript + Vercel Functions + Postgres).
Vas a construir la aplicación web del equipo de vóley **Coyotes** sobre el stack **ya
preparado** en este repositorio. Hay dos partes:

1. **Web pública** (`/`): presentación del equipo con el escudo y la paleta de marca.
2. **Panel interno oculto** (`/vestuario`): uso exclusivo del staff para gestionar
   **actividades semanales** y un **catálogo de videos** cuyos archivos están en un bucket S3.

Trabaja en fases (sección 9). Al terminar cada fase: `npm run build` sin errores y verifica el
comportamiento real antes de seguir.

---

## 2. Reglas de trabajo (obligatorias)

- **No re-generes el scaffold.** El stack ya existe: amplíalo. No cambies de framework, router,
  gestor de estado ni librería de estilos.
- Lee primero: `package.json`, `vercel.json`, `src/router.tsx`, `src/config.ts`, `src/index.css`,
  `api/_lib/*`, `shared/*` y `supabase/migrations/*`.
- TypeScript estricto, sin `any`. Los contratos de datos viven en `shared/schemas.ts` y
  `shared/domain.ts`; frontend y backend los importan desde ahí. Si cambias un enum, cámbialo
  también en la migración SQL.
- En `api/` y `shared/` los imports relativos **llevan extensión `.js`** (ESM NodeNext en Vercel).
  Los archivos o carpetas que empiezan por `_` dentro de `api/` no se publican como endpoints.
- Toda la interfaz está **en español**. Identificadores de código en inglés.
- No añadas dependencias sin necesidad. Permitidas si hacen falta: `react-hook-form` +
  `@hookform/resolvers` para formularios y `date-fns` para fechas. Cualquier otra requiere justificarla.
- Nunca expongas secretos al cliente: solo las variables `VITE_*` llegan al navegador y **no hay
  ninguna que sea secreta**.
- Accesibilidad básica: labels en inputs, foco visible, contraste AA, navegación por teclado.
- Mobile first: el staff lo usará sobre todo desde el móvil en la cancha.

---

## 3. Stack (ya instalado)

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, React Router 7 (`react-router`, modo data con `createBrowserRouter`), TanStack Query 5, Tailwind CSS 4 |
| Backend | Vercel Functions (Node.js, firma Web `export const GET = handle(async (request: Request) => Response)`) en `/api` |
| Validación | Zod 4 (compartido en `shared/`) |
| Base de datos | Supabase Postgres (plan Free), acceso **solo desde el backend** con `SUPABASE_SECRET_KEY` |
| Videos | Bucket compatible con S3: **Cloudflare R2** (recomendado, 10 GB gratis y sin coste de salida) o AWS S3, vía `@aws-sdk/client-s3` |
| Sesión staff | Código de acceso compartido → cookie httpOnly con JWT (`jose`) |
| Hosting | Vercel (Hobby). Cron diario `/api/cron/keepalive` para que Supabase Free no se pause |

### Estructura existente

```
api/
  _lib/env.ts         variables de entorno (lectura diferida)
  _lib/http.ts        handle(), json(), parseBody(), parseQuery(), pathParam(), HttpError
  _lib/auth.ts        isValidAccessCode, createSessionCookie, getSession, requireSession
  _lib/supabase.ts    db() → cliente Supabase de servidor
  _lib/storage.ts     s3(), listBucketVideos(), headVideo(), publicUrlFor(), playbackUrlFor(), titleFromKey()
  auth/login.ts · auth/logout.ts · auth/session.ts
  health.ts · cron/keepalive.ts
shared/
  domain.ts           enums + etiquetas en español
  schemas.ts          esquemas Zod de entrada y tipos de salida
src/
  config.ts           INTERNAL_ROUTE = '/vestuario', LOGO_SRC, TEAM_NAME
  router.tsx          rutas; la interna se carga con lazy (chunk aparte)
  lib/api.ts          api(), apiGet/Post/Patch/Delete, ApiError
  features/internal/  InternalLayout (guard + noindex), AccessGate, useSession, InternalHome (placeholder)
  pages/              HomePage, NotFoundPage
supabase/
  migrations/20260912000000_initial_schema.sql
  seed.sql
public/brand/logo-coyotes.jpeg
```

---

## 4. Marca: logo y paleta

- Logo: `public/brand/logo-coyotes.jpeg` (coyote negro con contorno dorado y naranja sobre fondo
  negro, con la palabra "COYOTES" en plateado). Úsalo en la home, en el acceso y en la cabecera interna.
  Como el JPEG tiene fondo negro, colócalo siempre sobre fondos oscuros.
- La paleta ya está definida como tokens de Tailwind en `src/index.css`. **Usa solo estos tokens**,
  sin colores hex sueltos en componentes:

| Token | Hex | Uso |
|---|---|---|
| `coyote-black` | `#0a0a0a` | fondo principal |
| `coyote-night` | `#151311` | tarjetas y superficies |
| `coyote-ember` | `#2b170c` | superficies cálidas, hover |
| `coyote-rust` | `#7a3412` | bordes cálidos, separadores |
| `coyote-orange` | `#f07c13` | acento secundario, estados de error y aviso |
| `coyote-gold` | `#f5b014` | acento principal, CTAs, títulos |
| `coyote-yellow` | `#f8d31c` | resaltados puntuales (hover de CTA, "hoy") |
| `coyote-silver` | `#e4e4e4` | texto principal |
| `coyote-ash` | `#9a9a9a` | texto secundario |
| `coyote-steel` | `#3a3a3a` | bordes neutros, inputs |

- Tipografía: `font-display` (Teko, en mayúsculas) para títulos y `font-sans` (Inter) para el texto.
- Estética: deportiva y enérgica, tema oscuro. Detalles con bordes dorados finos y degradados sutiles
  de `coyote-ember` a `coyote-black`. No abuses del amarillo.

---

## 5. Requisitos funcionales

### 5.1 Web pública (`/`)

- Hero con logo, "Coyotes Volley" y un eslogan corto.
- Secciones simples: **Sobre el equipo**, **Entrenamientos** (texto estático de días y lugar,
  editable en un único archivo de contenido `src/content/public.ts`) y **Contacto/Redes**
  (enlaces configurables en el mismo archivo).
- **Prohibido** enlazar, mencionar o precargar la ruta interna: nada de links, textos, `sitemap`,
  `robots.txt` que la nombre ni `prefetch` del chunk interno.
- SEO básico: `title`, `description` y Open Graph con el logo.
- La web pública **no llama a la API** (por ahora es contenido estático).

### 5.2 Ruta oculta y acceso (`/vestuario`)

- Se entra solo escribiendo la URL. Ya existe el guard: sin sesión muestra `AccessGate`.
- La sesión dura 30 días (cookie `coyotes_session`). Botón "Salir" en la cabecera.
- `noindex` ya está aplicado (meta en cliente y header `X-Robots-Tag` en `vercel.json`); mantenlo.
- **Cada endpoint interno empieza con `await requireSession(request)`.** Ocultar la ruta no es seguridad.
- Subrutas del panel (lazy, dentro de `InternalLayout`), con navegación en la cabecera (tabs abajo en móvil):
  - `/vestuario` → **Resumen**: actividades de hoy y de los próximos 7 días, más los últimos 6
    videos y un aviso si hay videos `pending` por catalogar.
  - `/vestuario/actividades` → planificación semanal.
  - `/vestuario/videos` → catálogo; `/vestuario/videos/:id` → detalle y reproductor.
  - `/vestuario/equipos` → gestión de equipos (propio y rivales).

### 5.3 Actividades semanales

Tabla `weekly_activities`: fecha concreta más horas locales, y `week_start` (lunes) generado.

- Vista **semana** (lunes a domingo) con navegación ◀ semana anterior · Hoy · semana siguiente ▶.
  La semana se refleja en la URL: `?semana=YYYY-MM-DD` (lunes).
  - Escritorio: 7 columnas. Móvil: lista agrupada por día. Resalta el día actual.
  - Cada tarjeta muestra hora, título, tipo (chip de color por tipo, usando solo tokens de la
    paleta), lugar y rival si lo hay. Las canceladas aparecen tachadas y atenuadas.
- Crear, editar y eliminar (con confirmación) en un modal o drawer con validación de `activityInput`.
  - Si el tipo es `partido`, `amistoso` o `torneo`, se muestra el selector de rival (`opponent_team_id`),
    que permite crear un equipo nuevo en el momento.
- **Duplicar semana**: copia todas las actividades de la semana visible a la siguiente (desplaza las
  fechas 7 días y no copia las canceladas). Pide confirmación e indica cuántas se crearon.
- En el detalle de una actividad, lista los videos vinculados (`videos.activity_id`).

### 5.4 Videos

Los archivos **se suben fuera de la app** (consola de R2/S3, rclone, Cyberduck…) dentro del prefijo
`S3_VIDEO_PREFIX`. La app **no sube archivos**: descubre los objetos del bucket y gestiona su metadata.

- **Sincronizar bucket** (botón "Sincronizar" en el catálogo → `POST /api/videos/sync`):
  1. `listBucketVideos()` recorre el prefijo (paginado; solo extensiones de video).
  2. Por cada clave sin fila en la tabla, inserta `{ source: 'bucket', storage_key, title: titleFromKey(key),
     size_bytes, url: publicUrlFor(key), status: 'pending', category: 'sin_clasificar', last_synced_at }`.
     Si el nombre empieza por una fecha `YYYY-MM-DD`, úsala como `recorded_on`.
  3. Si la fila ya existe, actualiza `size_bytes`, `url` y `last_synced_at`, sin tocar la metadata editada.
  4. Filas `bucket` cuya clave ya no existe en el bucket: **no se borran**. Se cuentan en
     `missing_in_bucket` y se marcan en la UI con "Archivo no encontrado".
  5. Hace upserts por lotes y es idempotente. Devuelve `SyncResult`, que se muestra en un toast.
- **Catálogo**: cuadrícula de tarjetas (miniatura o placeholder con el logo, título, fecha, categoría,
  equipos y duración). Filtros en la URL: búsqueda por texto (título, descripción y competición),
  categoría, estado, equipo y rango de fechas. Paginación. Pestaña o chip "Por catalogar" (`pending`).
- **Añadir video externo**: formulario con `source: 'external'` y una `url` (YouTube, Drive…).
- **Editar metadata**: título, descripción, categoría, fecha, competición, resultado, tags (input de
  chips), actividad vinculada (selector de actividades cercanas a `recorded_on`) y **equipos
  involucrados** con rol `home` / `away` / `involved`. Al guardar un video `pending`, pasa a `ready`.
- **Detalle y reproductor**: `<video controls playsInline preload="metadata">` con la URL de
  `GET /api/videos/:id/playback` (URL pública, o firmada si el bucket es privado, que se renueva al
  expirar). Los externos se abren en un enlace o iframe si es YouTube. Muestra toda la metadata y un
  botón "Copiar enlace".
  - Al cargar metadata en el reproductor, si `duration_seconds` es null, envíalo con `PATCH` (best effort).
- **Archivar/Eliminar**: archivar pone `status: 'archived'`. Eliminar borra solo la fila, **nunca el
  objeto del bucket**, y lo explica en el diálogo de confirmación.

### 5.5 Equipos

- CRUD simple de `teams`. Solo puede haber un equipo con `is_own_team = true`; valídalo en el
  backend. El seed ya crea "Coyotes".
- No se puede borrar un equipo con videos o actividades vinculadas sin confirmar. Mediante FK, la
  actividad pasa a null y se borra la relación `video_teams`.

---

## 6. Modelo de datos (ya migrado en `supabase/migrations`)

- **teams**: `id, name, short_name, is_own_team, category, city, logo_url, created_at, updated_at`.
  Único por `(lower(name), category)`.
- **weekly_activities**: `id, title, activity_type, activity_date, week_start (generada), start_time,
  end_time, location, description, opponent_team_id → teams, is_cancelled, created_at, updated_at`.
- **videos**: `id, title, description, source ('bucket'|'external'), storage_key (única), url,
  thumbnail_url, content_type, size_bytes, duration_seconds, category, recorded_on, competition,
  result, tags text[], status ('pending'|'ready'|'archived'), activity_id → weekly_activities,
  last_synced_at, created_at, updated_at`.
- **video_teams**: `(video_id, team_id)` PK, `role ('home'|'away'|'involved')`.
- RLS activo sin políticas y permisos revocados a `anon` y `authenticated`: solo el backend accede.

Si necesitas cambios, crea una **nueva** migración (`supabase migration new <nombre>`); nunca edites
la inicial una vez aplicada. Después ejecuta `npm run db:types` y tipa `db()` con `Database`.

---

## 7. Contrato de la API

Todas las respuestas son JSON. Errores: `{ error: { code, message, details? } }` (ya lo implementa `handle()`).
Todas requieren sesión salvo `health`, `auth/*` y `cron/*`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | ✅ ya existe |
| POST | `/api/auth/logout` | ✅ ya existe |
| GET | `/api/auth/session` | ✅ ya existe |
| GET | `/api/activities?week=YYYY-MM-DD` | actividades de la semana (con `opponent` embebido), ordenadas por fecha y hora |
| GET | `/api/activities/upcoming?days=7` | desde hoy hasta N días |
| POST | `/api/activities` | crear (`activityInput`) → 201 |
| GET/PATCH/DELETE | `/api/activities/:id` | detalle (con videos vinculados), editar parcial, borrar → 204 |
| POST | `/api/activities/duplicate-week` | `{ from_week }` → `{ created }` |
| GET | `/api/videos?q&category&status&team_id&from&to&page&page_size` | `{ items: Video[], total, page, page_size }` |
| POST | `/api/videos` | crear externo o manual (`videoInput`) → 201 |
| GET/PATCH/DELETE | `/api/videos/:id` | detalle con equipos, editar (reemplaza `video_teams` si llega `teams`), borrar fila |
| GET | `/api/videos/:id/playback` | `{ url, expiresAt }` |
| POST | `/api/videos/sync` | `SyncResult` |
| GET/POST | `/api/teams` | listar (orden: propio primero y luego alfabético) / crear |
| PATCH/DELETE | `/api/teams/:id` | editar / borrar |

Implementación: un archivo por ruta (`api/activities/index.ts`, `api/activities/[id].ts`,
`api/videos/[id]/playback.ts`…), usando `handle`, `parseBody`/`parseQuery` con los esquemas de `shared/`
y `pathParam`. Para PATCH usa el esquema base con `.partial()` (define la versión parcial en `shared/`
antes del `.refine`). Traduce los errores de Postgres: `23505` → 409 y `23503` → 409 con mensaje claro,
y fila inexistente → 404. En `vercel.json` sube `maxDuration` de `api/videos/sync.ts` a 60 s.

En el frontend, crea un hook de TanStack Query por recurso (`features/internal/activities/api.ts`, etc.)
con query keys estables, e invalida tras cada mutación.

---

## 8. Requisitos no funcionales

- **Seguridad:** `requireSession` en cada endpoint interno. Valida todo input con Zod. No devuelvas
  stack traces. Las URLs firmadas duran como máximo `SIGNED_URL_TTL_SECONDS`. No pongas CORS abierto:
  la API solo la usa el mismo origen.
- **Rendimiento:** chunk interno separado (ya configurado). Imágenes con `loading="lazy"`.
  Nada de reproducir videos automáticamente en la cuadrícula.
- **Estados de UI:** cada vista tiene estados de carga (skeletons), vacío (con CTA útil) y error (con reintento).
- **Fechas:** se muestran en español (`es`), con semanas de lunes a domingo. Las fechas y horas son
  locales y se guardan tal cual, sin conversiones de zona horaria.
- **Límites del plan gratuito:** Supabase Free tiene 500 MB de base de datos (solo metadata, suficiente)
  y R2 Free 10 GB de almacenamiento. No se guardan binarios en Postgres.

---

## 9. Fases de implementación

1. **Base del panel:** subrutas lazy, navegación responsive, componentes UI reutilizables en
   `src/components/ui/` (Button, Input, Select, Textarea, Modal/Drawer, Chip, Card, Skeleton,
   EmptyState, ConfirmDialog, Toast) con la paleta.
2. **Equipos:** API más UI (las demás fases dependen de esta).
3. **Actividades:** API más vista semanal, CRUD y duplicar semana.
4. **Videos:** sync, catálogo con filtros, edición de metadata con equipos, reproductor y video externo.
5. **Resumen** del panel y **home pública** final.
6. **Pulido:** accesibilidad, estados vacíos y de error, revisión móvil (375 px) y README actualizado.

---

## 10. Criterios de aceptación

- [ ] `npm run build` pasa sin errores ni warnings de TypeScript.
- [ ] La home no muestra ni enlaza `/vestuario`: no hay `<a>`, texto, sitemap ni prefetch. `dist/index.html` no
      la contiene y los componentes del panel solo están en chunks lazy. El string de la ruta en el router es
      inevitable y aceptable: la protección real es la sesión.
- [ ] Sin cookie, cualquier endpoint interno responde 401. Con un código incorrecto, el login responde 401.
- [ ] Se puede crear, editar, cancelar y borrar una actividad, y navegar entre semanas desde la URL.
- [ ] "Duplicar semana" crea las copias con la fecha +7 días.
- [ ] Al subir `videos/2026-09-10 Coyotes vs Pumas.mp4` al bucket y pulsar "Sincronizar", aparece como
      "Por catalogar" con `recorded_on = 2026-09-10`. Una segunda sincronización no crea duplicados.
- [ ] Se puede catalogar ese video (categoría, equipos local y visitante, tags, actividad) y reproducirlo
      tanto con bucket público como privado (URL firmada).
- [ ] Borrar un video no borra el objeto del bucket.
- [ ] Todas las vistas funcionan a 375 px de ancho y con teclado.

---

## 11. Fuera de alcance (no implementar)

Subida de archivos desde la app, cuentas individuales o roles, asistencia de jugadores, estadísticas,
notificaciones, i18n y PWA offline.
