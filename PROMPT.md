# Prompt de construcción — Coyotes Volley (web pública + dashboard)

> **Cómo usarlo:** abre Claude Code en la raíz del proyecto y ejecuta:
> `Lee PROMPT.md y constrúyelo completo siguiendo sus fases y criterios de aceptación.`

---

## 1. Rol y objetivo

Eres un ingeniero full-stack senior (React + TypeScript + Vercel Functions + Postgres).
Vas a construir la aplicación del equipo de vóley **Coyotes** sobre el stack **ya preparado** en este
repositorio. Un único deploy de Vercel sirve dos apps según el host:

1. **Web pública** en `<dominio>`: presentación del equipo con el escudo y la paleta de marca.
2. **Dashboard interno** en `dashboard.<dominio>`: uso del equipo, **solo lectura**, con dos secciones:
   - **Actividades** (por defecto): tablero semanal tipo Trello con los anuncios de la semana.
   - **Partidos**: partidos pasados en un carrusel; cada uno abre su detalle con videos y metadata.

Trabaja en fases (sección 9). Al terminar cada fase: `npm run build` sin errores y verifica el
comportamiento real antes de seguir.

---

## 2. Reglas de trabajo (obligatorias)

- **No re-generes el scaffold.** El stack ya existe: amplíalo. No cambies de framework, router,
  gestor de estado ni librería de estilos.
- Lee primero: `package.json`, `vercel.json`, `src/main.tsx`, `src/config.ts`, `src/index.css`,
  `src/dashboard/*`, `src/public/*`, `api/_lib/*`, `shared/*` y **todas** las migraciones en
  `supabase/migrations/` (en orden; la segunda modifica la primera).
- TypeScript estricto, sin `any`. Los contratos viven en `shared/schemas.ts` y `shared/domain.ts`; frontend
  y backend los importan desde ahí. Si cambias un enum, cámbialo también en SQL con una migración nueva.
- En `api/` y `shared/` los imports relativos **llevan extensión `.js`** (ESM NodeNext en Vercel).
  Los archivos o carpetas que empiezan por `_` dentro de `api/` no se publican como endpoints.
- Toda la interfaz está **en español**. Identificadores de código en inglés.
- No añadas dependencias sin necesidad. Permitidas si hacen falta: `date-fns` para fechas y
  `embla-carousel-react` para el carrusel. Cualquier otra requiere justificarla.
- Nunca expongas secretos al cliente: solo las variables `VITE_*` llegan al navegador y ninguna es secreta.
- Accesibilidad: foco visible, contraste AA, navegación por teclado y `aria-*` en carrusel y modales.
- **Mobile first:** el equipo lo usará sobre todo desde el móvil.

---

## 3. Stack (ya instalado)

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite 8, TypeScript, React Router 7 (`react-router`, `createBrowserRouter`), TanStack Query 5, Tailwind CSS 4 |
| Backend | Vercel Functions (Node.js, firma Web: `export const GET = handle(async (request: Request) => Response)`) en `/api` |
| Validación | Zod 4 (en `shared/`) |
| Base de datos | Supabase Postgres (plan Free), acceso **solo desde el backend** con `SUPABASE_SECRET_KEY` |
| Videos | Bucket compatible con S3: Cloudflare R2 (recomendado) o AWS S3, vía `@aws-sdk/client-s3` |
| Hosting | Vercel (Hobby), dominio raíz y subdominio `dashboard` en el **mismo proyecto** |

### Cómo se elige la app (ya implementado)

`src/main.tsx` llama a `resolveAppTarget()` (`src/config.ts`). Si el primer label del host es `dashboard`,
carga `src/dashboard/router.tsx`; si no, `src/public/router.tsx`. Cada app va en su propio chunk.
`VITE_APP_TARGET` fuerza una de las dos en las URLs de preview de Vercel. En local:
`http://localhost:5173` para la web pública y `http://dashboard.localhost:5173` para el dashboard.

### Estructura existente

```
api/
  _lib/env.ts         variables de entorno (lectura diferida)
  _lib/http.ts        handle(), json(), parseQuery(), pathParam(), HttpError
  _lib/supabase.ts    db() → cliente Supabase de servidor
  _lib/storage.ts     listBucketVideos(), headVideo(), publicUrlFor(), playbackUrlFor(),
                      titleFromKey(), matchSlugFromKey()
  health.ts · cron/keepalive.ts
shared/
  domain.ts           enums, etiquetas en español, MATCH_VIDEOS_FOLDER
  schemas.ts          tipos de respuesta (Activity, WeekActivities, MatchSummary, MatchDetail, Video…) y queries Zod
src/
  config.ts           LOGO_SRC, TEAM_NAME, DASHBOARD_SUBDOMAIN, resolveAppTarget()
  main.tsx            QueryClient + carga la app según el host
  lib/api.ts          apiGet() y ApiError
  public/             router, HomePage, NotFoundPage
  dashboard/
    router.tsx        / → /actividades · /actividades · /partidos · /partidos/:slug
    DashboardLayout   menú lateral (escritorio) / barra inferior (móvil) + noindex
    activities/ActivitiesPage.tsx          (placeholder)
    matches/MatchesPage.tsx, MatchDetailPage.tsx   (placeholders)
supabase/migrations/  20260912000000_initial_schema.sql, 20260912120000_matches.sql
public/brand/logo-coyotes.jpeg
```

---

## 4. Marca: logo y paleta

- Logo: `public/brand/logo-coyotes.jpeg` (coyote negro con contorno dorado y naranja sobre fondo negro,
  con la palabra "COYOTES" en plateado). Como el JPEG tiene fondo negro, colócalo siempre sobre fondos oscuros.
- La paleta está definida como tokens de Tailwind en `src/index.css`. **Usa solo estos tokens**, sin colores
  hex sueltos en componentes:

| Token | Hex | Uso |
|---|---|---|
| `coyote-black` | `#0a0a0a` | fondo principal |
| `coyote-night` | `#151311` | tarjetas, menú lateral, columnas del tablero |
| `coyote-ember` | `#2b170c` | superficies cálidas, hover, ítem activo |
| `coyote-rust` | `#7a3412` | bordes cálidos, separadores |
| `coyote-orange` | `#f07c13` | acento secundario, derrota, cancelado |
| `coyote-gold` | `#f5b014` | acento principal, títulos, victoria |
| `coyote-yellow` | `#f8d31c` | resaltados puntuales (columna "Hoy") |
| `coyote-silver` | `#e4e4e4` | texto principal |
| `coyote-ash` | `#9a9a9a` | texto secundario |
| `coyote-steel` | `#3a3a3a` | bordes neutros |

- Tipografía: `font-display` (Teko, en mayúsculas) para títulos y marcadores; `font-sans` (Inter) para el texto.
- Estética deportiva y enérgica, tema oscuro, bordes dorados finos y degradados sutiles de `coyote-ember` a
  `coyote-black`. No abuses del amarillo.

---

## 5. Requisitos funcionales

### 5.1 Web pública (`<dominio>`)

- Hero con logo, "Coyotes Volley" y un eslogan corto. Secciones **Sobre el equipo**, **Entrenamientos**
  (texto estático) y **Contacto/Redes**. Todo el contenido va en un único archivo, `src/content/public.ts`.
- **Prohibido** enlazar o mencionar el dashboard (ni links, ni textos, ni sitemap).
- SEO básico: `title`, `description` y Open Graph con el logo. La web pública no llama a la API.

### 5.2 Dashboard — Actividades (`/actividades`, sección por defecto)

Tablero **tipo Trello** con los anuncios de actividades de una semana. **Solo lectura**: no hay botones
de crear, editar ni borrar. Los datos se cargan desde Supabase (ver §6.3).

- **Columnas:** Lunes → Domingo. La cabecera de cada columna muestra el día y la fecha ("Mar 15").
  - La columna de **hoy** va resaltada con un borde `coyote-yellow` y la etiqueta "Hoy".
  - En escritorio, las 7 columnas usan scroll horizontal si no caben. En móvil hay una columna por
    pantalla con scroll-snap horizontal, y al cargar la semana actual se desplaza a la columna de hoy.
  - Columna vacía: texto atenuado "Sin actividades".
- **Tarjetas** (orden por `start_time`, sin hora primero): chip del tipo con su color (mapa tipo → token de la
  paleta en un único archivo), rango horario, título, lugar y rival si lo hay (con logo si existe) y las
  2 primeras líneas de la descripción.
  - Canceladas: título tachado, opacidad reducida y chip "Cancelada" en `coyote-orange`.
- Al hacer clic o pulsar Enter en una tarjeta se abre un **modal de detalle** de solo lectura con todos los
  campos. Se cierra con Esc y devuelve el foco a la tarjeta.
- **Navegación de semana** en la cabecera: ◀ · rango de fechas ("15 – 21 sep 2026") · ▶ · botón "Esta semana".
  La semana va en la URL, `?semana=YYYY-MM-DD` (lunes); con un valor inválido se usa la semana actual.
  Precarga la semana siguiente y la anterior con TanStack Query.
- Estados: skeleton de columnas mientras carga y error con botón "Reintentar".
- Semanas de lunes a domingo, fechas en español (`es`). Las horas y fechas son locales, sin conversión de zona horaria.

### 5.3 Dashboard — Partidos (`/partidos`)

Por ahora **solo partidos pasados** (`played_on <= hoy`), del más reciente al más antiguo.

- **Carrusel "Últimos partidos"** (los 10 más recientes) con `embla-carousel-react`:
  - Tarjeta grande con portada: `cover_image_url`, o si no hay, un degradado `coyote-ember` → `coyote-black`
    con el logo propio y el del rival enfrentados.
  - Encima de la portada: "COYOTES vs RIVAL" (o "RIVAL vs COYOTES" si `is_home = false`), marcador de sets
    grande en `font-display`, badge **Victoria** (`coyote-gold`) o **Derrota** (`coyote-orange`),
    fecha, competición y fase, y el número de videos.
  - Flechas ◀ ▶, indicadores de posición, swipe en móvil, teclado (←/→) y `aria-roledescription="carousel"`.
    Sin autoplay. Toda la tarjeta enlaza a `/partidos/:slug`.
- **Debajo, "Todos los partidos":** lista compacta agrupada por mes ("Septiembre 2026"). Cada fila muestra
  fecha, rival, marcador, resultado y competición, y enlaza al detalle.
- Estados: skeleton, vacío ("Todavía no hay partidos cargados") y error con reintento.

### 5.4 Dashboard — Detalle del partido (`/partidos/:slug`)

- Enlace "← Partidos". **Cabecera** con los equipos (logos), marcador de sets, resultado, fecha y hora,
  local o visitante, lugar, competición y fase.
- **Parciales** (`set_scores`): tabla o fila de chips "25-20 · 22-25 · 25-18"; en cada set gana el color
  del equipo ganador.
- **Videos del partido**, ordenados por `set_number` (null primero), `sort_order` y `title`:
  - Reproductor principal `<video controls playsInline preload="metadata">` con la URL de
    `GET /api/videos/:id/playback`. Si la URL firmada expira (error de reproducción), se pide otra y se
    retoma en el mismo segundo.
  - Playlist lateral en escritorio y debajo en móvil: título, etiqueta "Set N" o categoría, y duración. El
    video activo va resaltado y la selección se refleja en `?video=<id>`.
  - Videos `external` (YouTube/Drive): iframe si es YouTube; si no, un botón "Abrir video".
  - Sin videos: estado vacío "Este partido no tiene videos todavía".
- **Resumen** (`summary`) como texto con saltos de línea.
- Slug inexistente: página 404 dentro del layout.

### 5.5 Sincronización de videos del bucket

Los archivos **se suben fuera de la app** (consola de R2, rclone, Cyberduck). Convención de carpetas:

```
<S3_VIDEO_PREFIX>games/<slug-del-partido>/<archivo>.mp4   → se vincula al partido con ese slug
<S3_VIDEO_PREFIX><cualquier-otra-ruta>.mp4               → queda sin partido

Ejemplo real: games/2026-09-06-vs-onas/set-1.mp4  (S3_VIDEO_PREFIX vacío)
```

- Crea `api/cron/sync-videos.ts` y **sustituye el cron `keepalive`** por este en `vercel.json`
  (diario; así también evita que Supabase Free se pause). Elimina `api/cron/keepalive.ts`. Protégelo con
  `Authorization: Bearer <CRON_SECRET>` (lo envía Vercel Cron y permite lanzarlo a mano con `curl`).
- Algoritmo idempotente:
  1. Recorre `listBucketVideos()`.
  2. Clave nueva: inserta `{ source: 'bucket', storage_key, title: titleFromKey(key), size_bytes,
     url: publicUrlFor(key), status: 'pending', category: 'sin_clasificar', last_synced_at }`.
     - Si `matchSlugFromKey(key)` coincide con un partido: `match_id`, `category: 'partido'`, `status: 'ready'`
       y `recorded_on = played_on`.
     - Si el archivo se llama `set-N...`, pon `set_number = N`.
  3. Clave existente: actualiza `size_bytes`, `url` y `last_synced_at`. Si no tiene `match_id`, intenta
     vincularlo. Nunca pises la metadata editada a mano.
  4. Filas `bucket` cuya clave ya no está en el bucket: no se borran, solo se cuentan (`missing_in_bucket`).
  5. Hace upserts por lotes y devuelve `SyncResult`. `maxDuration` de la función: 60 s en `vercel.json`.

---

## 6. Datos

### 6.1 Modelo (resultado de las dos migraciones)

- **teams**: `id, name, short_name, is_own_team, category, city, logo_url, …`
- **weekly_activities**: `id, title, activity_type, activity_date, week_start (generada, lunes),
  start_time, end_time, location, description, opponent_team_id → teams, is_cancelled, …`
- **matches**: `id, slug (único, kebab-case), played_on, start_time, opponent_team_id → teams, is_home,
  location, competition, phase, sets_won, sets_lost, set_scores jsonb [{us, them}], summary,
  cover_image_url, activity_id → weekly_activities, …`
- **videos**: `id, title, description, source, storage_key, url, thumbnail_url, content_type, size_bytes,
  duration_seconds, category, recorded_on, tags, status, match_id → matches, set_number, sort_order,
  activity_id, last_synced_at, …`
- RLS activo sin políticas y permisos revocados a `anon` y `authenticated`: solo el backend accede.

`outcome` se calcula en la API: `win` si `sets_won > sets_lost`, `loss` si es menor y `pending` si falta
algún dato. Si necesitas cambios, crea una **migración nueva**; no edites las existentes. Después ejecuta
`npm run db:types` y tipa `db()` con `Database`.

### 6.2 Contrato de la API (solo lectura, JSON)

Errores: `{ error: { code, message, details? } }` (ya lo implementa `handle()`).

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/activities?week=YYYY-MM-DD` | `WeekActivities`: actividades de la semana con `opponent` embebido, orden por fecha y hora |
| GET | `/api/matches?until=YYYY-MM-DD&limit=50` | `MatchSummary[]` con `played_on <= until` (por defecto hoy), orden descendente, con `video_count` |
| GET | `/api/matches/:slug` | `MatchDetail` con `opponent`, `set_scores` validados con `setScoreSchema` y `videos` ordenados; 404 si no existe |
| GET | `/api/videos/:id/playback` | `Playback` (URL pública o firmada) |
| GET | `/api/cron/sync-videos` | `SyncResult` (requiere `CRON_SECRET`) |

Implementación: un archivo por ruta (`api/activities/index.ts`, `api/matches/index.ts`, `api/matches/[slug].ts`,
`api/videos/[id]/playback.ts`, …), usando `handle`, `parseQuery` y `pathParam`. Usa embeds de PostgREST
(`opponent:teams(id,name,short_name,logo_url)`, `videos(count)`) para evitar consultas N+1.
Respuestas de lectura con `Cache-Control: private, max-age=60` (salvo `playback` y `cron`: `no-store`).
Ajusta `vercel.json` para que el header `no-store` genérico de `/api` no pise ese caché.

En el frontend: hooks de TanStack Query por recurso (`src/dashboard/activities/api.ts`,
`src/dashboard/matches/api.ts`) con query keys estables.

### 6.3 Carga de datos mientras no haya administración

No hay UI de edición: las actividades, partidos y equipos se cargan desde el **Table Editor de Supabase**.
Crea `supabase/seed.sql` con datos de ejemplo realistas: el equipo propio, 3 rivales, dos semanas de actividades
(la actual y la siguiente, con al menos una cancelada) y 4 partidos pasados con parciales. Añade en el README
una sección breve **"Cómo cargar actividades y partidos"**.

---

## 7. Requisitos no funcionales

- **Acceso:** el dashboard **no pide login** por ahora. Debe seguir sin enlaces desde la web pública y marcado
  `noindex` (meta en cliente y `X-Robots-Tag` por host en `vercel.json`, ya configurado). Deja la API
  preparada para añadir autenticación más adelante sin rehacer rutas: centraliza el acceso a datos en `api/_lib`.
- **Solo lectura:** la API solo expone `GET`. Nada de endpoints de escritura hasta que existan roles.
- **Rendimiento:** chunks por app y por sección (ya configurado). Imágenes con `loading="lazy"` salvo la
  primera del carrusel. No reproducir videos automáticamente.
- **Estados de UI:** cada vista tiene carga (skeleton), vacío y error con reintento.
- **Componentes UI reutilizables** en `src/dashboard/ui/` (Card, Chip, Skeleton, EmptyState, ErrorState,
  Modal, PageHeader) usando la paleta.

---

## 8. Hacia dónde va (no implementar, pero no bloquearlo)

Usuarios y roles (Supabase Auth). El administrador podrá crear y editar actividades, partidos y videos
desde el dashboard. También está previsto mostrar partidos próximos en la sección Partidos.

---

## 9. Fases de implementación

1. **Base UI del dashboard:** componentes de `src/dashboard/ui/`, cabecera de página y ajustes del layout.
2. **Actividades:** endpoint semanal + tablero Trello + modal de detalle + navegación de semanas.
3. **Partidos:** endpoints de lista y detalle + carrusel + listado por mes + página de detalle con parciales.
4. **Videos:** endpoint `playback` + reproductor con playlist + cron `sync-videos`.
5. **Seed, web pública final y README** (subdominio en Vercel, carga de datos, convención del bucket).
6. **Pulido:** accesibilidad, revisión móvil (375 px), estados vacíos y de error.

---

## 10. Criterios de aceptación

- [ ] `npm run build` pasa sin errores de TypeScript.
- [ ] `localhost:5173` muestra la web pública y `dashboard.localhost:5173` el dashboard, sin pedir código.
- [ ] La web pública no enlaza ni menciona el dashboard, y su chunk no incluye componentes del dashboard.
- [ ] `dashboard.<host>/` redirige a `/actividades`; el menú lateral (barra inferior en móvil) marca la sección activa.
- [ ] El tablero muestra 7 columnas con las actividades del seed, resalta hoy y permite navegar semanas desde la URL.
      No existe ningún control de edición.
- [ ] El carrusel muestra los partidos pasados del seed con marcador y resultado, y funciona con swipe, flechas y teclado.
- [ ] El detalle de un partido muestra parciales y videos, reproduce un video del bucket (público o con URL firmada)
      y cambia de video desde la playlist.
- [ ] Subir `games/<slug>/set-1.mp4` y ejecutar el cron (`curl` con `CRON_SECRET`) lo vincula al partido
      como "Set 1". Una segunda ejecución no crea duplicados.
- [ ] La API solo responde a `GET`; `sync-videos` responde 401 sin `CRON_SECRET`.
- [ ] Todas las vistas funcionan a 375 px de ancho y con teclado.

---

## 11. Fuera de alcance (no implementar)

Login, usuarios, roles, cualquier UI o endpoint de escritura, partidos próximos, subida de archivos desde la app,
asistencia, estadísticas, notificaciones, i18n y PWA offline.
