# Coyotes Volley

Un único deploy con dos apps:

- **`<dominio>`**: web pública del equipo. Por defecto es una landing mínima (escudo, nombre y eslogan);
  con `VITE_HOME_VARIANT=full` se publica la página completa (Sobre el equipo, Entrenamientos y Contacto).
  Los textos viven en `src/content/public.ts`.
- **`dashboard.<dominio>`**: dashboard interno con **Inicio** (resumen: próxima actividad, último partido, números
  del equipo y accesos rápidos), **Actividades** (carrusel de próximas actividades), **Partidos** (partidos pasados
  con sus videos) y **Flyers** (generador de flyers para Instagram con IA). Se consulta sin login; cargar datos pide
  una palabra clave y la sección Flyers tiene otra propia.

Stack:

- **Frontend:** React 19 + Vite + TypeScript + Tailwind 4 + React Router 7 + TanStack Query
- **Backend:** Vercel Functions (`/api`)
- **Base de datos:** Supabase Postgres (plan Free)
- **Videos:** bucket compatible con S3 (Cloudflare R2 recomendado)

El plan de construcción completo está en [`PROMPT.md`](./PROMPT.md).

## Puesta en marcha

### 1. Dependencias

```bash
npm install
npm i -g vercel        # CLI de Vercel para `vercel dev` y deploy
```

### 2. Supabase (gratis)

1. Crea un proyecto en <https://supabase.com/dashboard>.
2. Aplica las migraciones **en orden** con una de estas opciones:
   - SQL Editor: ejecuta cada archivo de `supabase/migrations/` por orden de nombre y después `supabase/seed.sql`.
   - CLI: `npx supabase login`, `npx supabase link --project-ref <ref>` y `npx supabase db push`.
3. En Project Settings → API Keys, copia la URL y la **secret key** en `SUPABASE_URL` y `SUPABASE_SECRET_KEY`.

> El plan Free pausa el proyecto tras 7 días sin actividad. El cron diario `sync-videos` de `vercel.json` lo evita.

### 3. Bucket de videos: Cloudflare R2 (10 GB gratis y sin coste por salida de datos)

1. En Cloudflare → R2, crea el bucket `coyotes-videos`.
2. Crea un API token con permiso **Object Read & Write** sobre ese bucket y cópialo en `S3_ACCESS_KEY_ID` y
   `S3_SECRET_ACCESS_KEY`. Con solo lectura se ven los videos, pero la subida desde el dashboard responde
   "Las credenciales del bucket no permiten subir videos".
3. Usa `S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com` y `S3_REGION=auto`.
4. En Bucket → Settings → **CORS Policy**, añade esta regla. El navegador sube videos, imágenes y flyers directo al
   bucket (`PUT`, exponiendo `ETag`) y el generador de flyers lee las imágenes para dibujarlas en el lienzo (`GET`;
   sin él los logos no aparecen y no se puede exportar el PNG):

   ```json
   [
     {
       "AllowedOrigins": ["https://dashboard.tudominio.com", "http://dashboard.localhost:5173", "http://dashboard.localhost:3000"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   Las URLs de preview de Vercel cambian en cada deploy: si quieres subir desde una preview, añade su dominio.
5. Para la reproducción: deja `STORAGE_PUBLIC_BASE_URL` vacío si quieres URLs firmadas temporales (bucket privado),
   o pon ahí el dominio público del bucket.
6. Define `CRON_SECRET` (cualquier cadena larga): protege el cron de sincronización.
7. Define `ADMIN_SAFEWORD` (una frase larga): es la palabra clave de **Cargar actividad** y **Cargar partido**.
8. Define `FLYERS_SAFEWORD` (otra frase, distinta): es la palabra clave de la sección **Flyers** (ver abajo).

Para usar **AWS S3**, deja `S3_ENDPOINT` vacío y pon la región real.

### 4. Variables de entorno

```bash
cp .env.example .env.local   # y rellena los valores
```

Carga las mismas variables en Vercel → Settings → Environment Variables.

### 5. Dominio en Vercel

Un solo proyecto con dos dominios: la web pública en `tudominio.com` y el dashboard en `dashboard.tudominio.com`.
La app decide qué montar según el host (`src/config.ts`): si el primer label es `dashboard`, monta el dashboard.

1. Vercel → Project → Settings → **Domains**: añade `tudominio.com` (y `www.tudominio.com` redirigiendo a él) y
   `dashboard.tudominio.com`. Los tres apuntan al entorno **Production** del mismo proyecto.
2. En el proveedor DNS crea los registros que indica Vercel: `A @ → 76.76.21.21` para el dominio raíz y
   `CNAME www` / `CNAME dashboard → cname.vercel-dns.com` (o usa los nameservers de Vercel y se crean solos).
3. Define `VITE_SITE_URL=https://tudominio.com` para que Open Graph use el dominio público y vuelve a desplegar.

Los enlaces antiguos `tudominio.com/dashboard/<ruta>` redirigen (308) a `dashboard.tudominio.com/<ruta>` desde
`vercel.json`. No se aplica en `*.vercel.app` ni en `localhost`, donde ese subdominio no existe.

Las URLs `*.vercel.app` (producción y previews) no admiten subdominios y muestran la web pública. Para revisar el
dashboard en una preview, define `VITE_APP_TARGET=dashboard` solo en el entorno **Preview**.

### 6. Desarrollo

```bash
npm run dev          # solo frontend
npm run dev:full     # frontend + /api con vercel dev (requiere `vercel link`)
```

| App | `npm run dev` | `npm run dev:full` |
|---|---|---|
| Web pública | <http://localhost:5173> | <http://localhost:3000> |
| Dashboard | <http://dashboard.localhost:5173> | <http://dashboard.localhost:3000> |

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev` / `dev:full` | Desarrollo |
| `npm run build` | Typecheck (app + api) y build de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run check:functions` | Comprueba que `api/` no supere las 12 Vercel Functions del plan Hobby (corre en `build`) |
| `npm run db:types` | Genera los tipos de Supabase (`shared/database.types.ts`) tras cada migración |

Con `npm run dev` las llamadas a `/api` no tienen servidor. Para desarrollar el frontend contra otro backend local,
`API_PROXY=http://localhost:3000 npm run dev` reenvía `/api` a ese puerto.

## Acceso al dashboard

`dashboard.<dominio>` no está enlazado desde la web pública y va marcado como `noindex`, pero **no tiene login**:
cualquiera que conozca la URL puede ver actividades, partidos y videos. Usuarios y roles están previstos más adelante.

## Cargar datos desde el dashboard

Los botones **Cargar actividad** y **Cargar partido** piden la palabra clave (`ADMIN_SAFEWORD`). Se recuerda en el
navegador para ambas vistas y se vuelve a pedir si el servidor la rechaza.

### Actividad

Un único formulario: título, descripción opcional, fecha y hora (solo futuras), categoría (`General` o `Liga Podio`),
equipo rival opcional (existente o uno nuevo creado al guardar) y lugar opcional. Se guarda con
`activity_type = 'otro'` y sin hora de fin. El carrusel las ordena por fecha y hora, con la de Liga Podio más cercana
al frente.

### Partido

Formulario en tres pasos:

1. **Rival:** uno existente o uno nuevo con nombre, abreviatura y URL del logo opcionales. Se guarda con
   `is_own_team = false` y sin categoría ni ciudad.
2. **Partido:** fecha, hora, competición (`Liga Podio` o `Amistoso`), fase, lugar y parciales. Los sets ganados y
   perdidos se calculan de los parciales y el partido se guarda siempre como visitante (`is_home = false`). El slug
   se genera solo (`2026-09-20-vs-las-onas`, con `-2` si ya existe).
3. **Videos (opcional):** se suben al guardar, directo del navegador al bucket con subida multiparte (trozos de 25 MB,
   3 en paralelo, reintentos automáticos) en `games/<slug>/`, y quedan vinculados al partido. Máximo 10 GB por video.
   Si una subida falla, el partido ya está guardado y se puede reintentar desde la misma pantalla.

En los dos formularios, si el rival es nuevo y la actividad o el partido no se puede guardar, el rival se borra para
no dejar restos.

### Editar o eliminar una actividad

Al abrir una tarjeta del carrusel, el detalle tiene **Editar** y **Eliminar** (con la palabra clave). La edición usa
el mismo formulario del alta; el tipo no cambia y la hora de fin de las cargadas a mano se conserva solo si sigue
siendo posterior a la de inicio. Eliminar borra la fila (los partidos o videos vinculados quedan sin actividad).

### Editar un partido

En el detalle de un partido (`dashboard.<dominio>/matches/<slug>`), **Editar partido** abre un diálogo con dos pestañas (también
con la palabra clave):

- **Datos del partido:** rival (existente o uno nuevo), fecha, hora, competición, fase, lugar y parciales. El slug
  **no cambia** aunque cambien la fecha o el rival: es la URL del partido y la carpeta de sus videos en el bucket. Si
  cambia la fecha, los videos que tenían la fecha anterior en `recorded_on` pasan a la nueva. El rival anterior no se
  borra.
- **Videos:** cambiar el título y el set de cada video, eliminarlo (se borra el archivo del bucket y después la fila;
  en los externos solo la fila) y subir videos nuevos a `games/<slug>/`, igual que en el alta. El botón
  **Gestionar** de la sección de videos abre directamente esta pestaña.

**Eliminar** (junto a Editar partido) pide confirmación y borra el partido con todos sus videos: primero los archivos
del bucket (la carpeta `games/<slug>/` completa y cualquier otro video vinculado), después las filas de `videos` y por
último el partido. Si el bucket falla no se borra nada de la base de datos. El rival se conserva.

### Sincronizar con CourtTrack

El botón **Sincronizar** de Partidos (con la palabra clave) importa los resultados de **Liga Podio** desde la app
CourtTrack a través del microservicio [`courtrack-service`](../courtrack-service) (repo y deploy aparte, misma base de
datos). El diálogo muestra el cupo restante (**3 sincronizaciones por 24 h**) y las últimas ejecuciones, y ofrece:

- **Vista previa:** qué crearía, actualizaría u omitiría, y qué rivales nuevos daría de alta. No escribe ni gasta cupo.
  Conviene revisarla antes de la primera sincronización para detectar rivales que ya existen con otro nombre (se
  unen con `COURTRACK_TEAM_ALIASES` en el microservicio).
- **Sincronizar:** crea los partidos jugados con parciales, rival, fase y cancha; actualiza los ya importados y
  **vincula** los cargados a mano el mismo día contra el mismo rival en vez de duplicarlos (`matches.courtrack_id`).
  El slug, el resumen, la portada y los videos no se tocan. Los partidos importados aparecen como local o visitante
  según CourtTrack; si se editan a mano, la siguiente sincronización vuelve a poner los datos de CourtTrack.

Requiere `COURTRACK_SYNC_URL` y `COURTRACK_SYNC_SECRET` (sin ellos el botón responde 503) y las migraciones
`20260916000000_matches_courtrack_id.sql` y `20260916000100_sync_log.sql` (después, `npm run db:types`).

## Flyers para Instagram

La sección **Flyers** (`dashboard.<dominio>/flyers`) genera PNG listos para publicar en tres formatos: post 4:5
(1080×1350), cuadrado (1080×1080) e historia (1080×1920). El flyer se dibuja en un `<canvas>` en el navegador, así
que la vista previa es exactamente la imagen que se descarga. **Compartir** aparece en los móviles que admiten
compartir archivos.

- **Plantillas:** Día de partido, Entrenamiento, Resultado y Anuncio, con textos de ejemplo. Viven en
  `src/dashboard/flyers/templates.ts` (textos y campos) y `render.ts` (diseño y paletas).
- **Editar:** formato, paleta de marca (Brasa, Dorado, Atardecer, Liga Podio), logo, foto de fondo y textos. La foto
  solo se usa en el navegador: no se sube ni se envía a la IA. El borrador se recuerda en `localStorage`.
- **Guardados:** los flyers de la IA se guardan solos al generarse y cualquier otro con **Guardar** (hasta 50).
  Se guardan en el bucket, así que los ve todo el equipo desde cualquier dispositivo. Abrir uno lo carga en el
  editor sin modificar la copia guardada; la foto de fondo queda en el PNG pero no en la copia editable.
- **Logos de otros equipos:** imágenes propias (PNG, JPG, WebP o SVG; hasta 20) que se reducen a 512 px en el
  navegador y se suben al bucket. El logo del rival va junto al escudo en Día de partido y Resultado, y hay una fila
  de hasta 4 logos (auspiciantes, liga) en todas las plantillas. Se eligen en **Editar** o se le dejan a la IA.
- **Asistente IA:** un pedido en lenguaje natural (con ideas de ejemplo) reescribe el flyer actual. Usa un modelo
  gratuito de [OpenRouter](https://openrouter.ai). El servidor le pasa las próximas 8
  actividades para que pueda usar fechas, horas, lugares y rivales reales. El modelo solo devuelve textos, plantilla,
  paleta, formato y qué imágenes usar; las imágenes no se envían, solo su id y el nombre que les pusiste (nómbralas
  como el equipo). Los campos inválidos o ids desconocidos conservan el valor anterior. **Deshacer** revierte
  plantillas, guardados abiertos y respuestas de la IA.

### Palabra clave de flyers

Ver la sección es libre. Subir, renombrar o borrar imágenes, guardar o borrar flyers y usar la IA piden
`FLYERS_SAFEWORD`, independiente de `ADMIN_SAFEWORD`: alguien puede tener acceso a los flyers sin poder cargar
actividades ni partidos, y al revés. Se pide en un diálogo la primera vez que hace falta y se recuerda en el navegador.
Sin `FLYERS_SAFEWORD` esas acciones responden 503.

### Archivos en el bucket

Todo vive en la carpeta `assets/` del mismo bucket (no hace falta crearla: aparece con el primer archivo). No usa la
base de datos: cada elemento es su archivo más un JSON. El cron de videos solo registra extensiones de video, así que
no los toca.

```
assets/images/<id>.webp|png   imagen reducida
assets/images/<id>.json       { id, name, contentType, createdAt }
assets/flyers/<id>.png        flyer exportado (1080 px de ancho)
assets/flyers/<id>.json       { id, savedAt, source: "ia" | "manual", label, flyer }
```

Los archivos van directo del navegador al bucket con una URL firmada (10 min); la API comprueba que llegaron y su
tamaño (2 MB por imagen, 10 MB por flyer) antes de escribir el JSON. Para verlos, la biblioteca devuelve URLs
públicas (`STORAGE_PUBLIC_BASE_URL`) o firmadas que no cambian durante una hora, para que el navegador las cachee.

### IA

Configuración: crea una clave en OpenRouter → Keys y guárdala en `OPENROUTER_API_KEY`. Sin clave, el asistente
responde 503 y el resto de la sección funciona igual. `OPENROUTER_MODEL` es opcional: por defecto es
`openrouter/free`, que enruta a algún modelo gratuito disponible, así que no se rompe si retiran uno concreto. Los
modelos gratuitos tienen límite de peticiones por minuto y por día; al superarlo se muestra un aviso para reintentar.

## Cómo editar datos a mano

Cancelar actividades, los resúmenes y las portadas todavía se hace en **Supabase → Table Editor**
(o con SQL). `supabase/seed.sql` es un ejemplo completo y se puede ejecutar varias veces sin duplicar filas:
`npx supabase db query --linked -f supabase/seed.sql`.

1. **Equipos** (`teams`): un registro con `is_own_team = true` (Coyotes) y uno por rival. `short_name` (3 letras)
   se usa como escudo cuando no hay `logo_url`.
2. **Actividades** (`weekly_activities`): una fila por actividad con `activity_date` (día), `start_time`/`end_time`
   (hora local, opcionales), `activity_type` (`entrenamiento`, `partido`, `amistoso`, `torneo`, `fisico`,
   `video_analisis`, `reunion`, `otro`), `location`, `description`, `opponent_team_id` (rival, opcional) e
   `is_cancelled`. Las canceladas y las que ya empezaron no se muestran.
3. **Partidos** (`matches`): `slug` único en kebab-case (p.ej. `2026-09-06-vs-onas`; es la URL
   `dashboard.<dominio>/matches/<slug>` y la carpeta del bucket), `played_on`, `start_time`, `opponent_team_id`, `is_home`,
   `location`, `competition`, `phase`, `sets_won`, `sets_lost` y `set_scores` con los parciales:
   `[{"us":25,"them":20},{"us":22,"them":25}]`. `summary` admite saltos de línea y `cover_image_url` es la portada
   del carrusel (sin ella se muestran los escudos). Solo aparecen los partidos con `played_on <= hoy`.
4. **Videos** (`videos`): los del bucket los crea el cron (abajo). Para enlaces externos crea una fila con
   `source = 'external'`, `url` (YouTube se incrusta; el resto abre en pestaña nueva), `match_id`, `set_number`
   (opcional) y `status = 'ready'`. Los videos con `status = 'archived'` no se muestran.

### Convención del bucket de videos

El formulario de alta sube los videos a esta ruta. También se pueden subir por fuera (consola de R2, rclone,
Cyberduck…) siguiendo la misma convención:

```
<S3_VIDEO_PREFIX>games/<slug-del-partido>/<archivo>.mp4   → se vincula al partido con ese slug
<S3_VIDEO_PREFIX><cualquier-otra-ruta>.mp4               → queda sin partido (status "pending")

games/2026-09-06-vs-onas/set-1.mp4      → partido 2026-09-06-vs-onas, "Set 1"
games/2026-09-06-vs-onas/resumen.mp4    → mismo partido, sin set
```

Si el archivo empieza por `set-N` se rellena `set_number`. El cron `GET /api/cron/sync-videos` se ejecuta a diario
desde Vercel y es idempotente: crea filas nuevas, refresca tamaño y URL de las existentes, vincula las que aún no tienen
partido y **nunca** pisa el título, la categoría o el set editados a mano. Los archivos borrados del bucket solo se
cuentan (`missing_in_bucket`); las filas se borran a mano. Para lanzarlo al momento:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/cron/sync-videos
# → {"scanned":3,"created":3,"updated":0,"linked_to_match":3,"missing_in_bucket":0}
```

Después del sync, cambia el título y el set de cada video desde **Editar partido → Videos** (o `sort_order` en el Table
Editor).

## API

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/teams` | Rivales por nombre (sin caché) |
| GET | `/api/activities?from=YYYY-MM-DD&limit=30` | Próximas actividades no canceladas, de la más cercana a la más lejana, con el rival embebido |
| GET | `/api/matches?until=YYYY-MM-DD&limit=50` | Partidos jugados hasta la fecha, del más reciente al más antiguo |
| GET | `/api/matches/:slug` | Detalle con parciales y videos ordenados (404 si no existe) |
| GET | `/api/videos/:id/playback` | URL de reproducción (pública o firmada temporal) |
| GET | `/api/cron/sync-videos` | Sincroniza el bucket; requiere `Authorization: Bearer <CRON_SECRET>` |

Escritura: todas requieren la cabecera `x-admin-safeword` con `ADMIN_SAFEWORD` codificada con `encodeURIComponent`.

| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/api/admin/verify` | `{ ok: true }` o 401 |
| POST | `/api/admin/activities` | 201 Activity: crea la actividad y, si se pide, el rival (409 si el nombre ya existe) |
| POST | `/api/admin/activity-update` | Activity: edita la actividad `id` con los campos del alta |
| POST | `/api/admin/activity-delete` | `{ ok: true }`: borra la actividad |
| POST | `/api/admin/matches` | 201 `{ id, slug, opponent }`: crea el partido y, si se pide, el rival (409 si el nombre ya existe) |
| POST | `/api/admin/match-update` | `{ id, slug, opponent }`: edita el partido `id` con los campos del alta; el slug no cambia |
| POST | `/api/admin/match-delete` | `{ ok: true }`: borra el partido, sus videos y sus archivos del bucket |
| POST | `/api/admin/courtrack-status` | `CourtrackSyncStatus`: cupo restante y últimas sincronizaciones (proxy a courtrack-service; 503 sin configurar) |
| POST | `/api/admin/courtrack-sync` | `CourtrackSyncResult`: importa los partidos de Liga Podio desde CourtTrack (`{ dry_run?: boolean }`); 429 `quota_exceeded` si se agotó el cupo |
| POST | `/api/admin/video-update` | Video: cambia `title` y `set_number` |
| POST | `/api/admin/video-delete` | `{ ok: true }`: borra el archivo del bucket y la fila del video |
| POST | `/api/admin/uploads/start` | Crea la subida multiparte y devuelve una URL firmada por trozo (6 h de validez) |
| POST | `/api/admin/uploads/complete` | 201 Video: cierra la subida y registra el video en el partido |
| POST | `/api/admin/uploads/abort` | Descarta los trozos de una subida cancelada o fallida |

Flyers: `GET /api/flyers/library` es libre; los `POST` requieren la cabecera `x-flyers-safeword` con `FLYERS_SAFEWORD`
codificada con `encodeURIComponent` (la de admin no sirve aquí, ni al revés).

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/flyers/library` | `{ images, flyers }` del bucket con sus URLs de lectura |
| POST | `/api/flyers/verify` | `{ ok: true }` o 401 |
| POST | `/api/flyers/suggest` | `{ flyer, message, model }`: la IA reescribe el flyer (`{ prompt, flyer, today, assets: [{ id, name }] }`); 503 sin `OPENROUTER_API_KEY` |
| POST | `/api/flyers/upload-url` | `{ id, url, headers }`: URL firmada para subir una imagen (`kind: "image"`, WebP o PNG) o el PNG de un flyer (`kind: "flyer"`) |
| POST | `/api/flyers/image-save` | 201 imagen: registra la imagen subida con `{ id, contentType, name }` (409 si ya hay 20) |
| POST | `/api/flyers/image-rename` | Imagen con el nuevo `name` |
| POST | `/api/flyers/image-delete` | `{ ok: true }`: borra la imagen y su JSON |
| POST | `/api/flyers/flyer-save` | 201 flyer: registra el PNG subido con `{ id, source, label, flyer }` (409 si ya hay 50) |
| POST | `/api/flyers/flyer-delete` | `{ ok: true }`: borra el PNG y su JSON |

Los contratos viven en `shared/schemas.ts`; el acceso a datos está centralizado en `api/_lib/` para poder añadir
autenticación más adelante sin rehacer rutas.

### Límite de 12 funciones (plan Hobby de Vercel)

Vercel crea una Serverless Function por **cada archivo** de `api/` (salvo los que empiezan por `_`, como `api/_lib/`)
y el plan Hobby rechaza el deploy con más de 12:
`No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan`.

Por eso las rutas de escritura se agrupan en archivos con un segmento dinámico y una tabla de handlers (`routeFor`
en `api/_lib/http.ts` responde 404 a lo que no esté en la tabla):

| Archivo | Rutas |
|---|---|
| `api/admin/[action].ts` | `/api/admin/verify`, `/activities`, `/activity-update`, `/activity-delete`, `/matches`, `/match-update`, `/match-delete`, `/video-update`, `/video-delete`, `/courtrack-status`, `/courtrack-sync` |
| `api/admin/uploads/[step].ts` | `/api/admin/uploads/start`, `/complete`, `/abort` |
| `api/flyers/[action].ts` | `GET /api/flyers/library`; `POST /api/flyers/verify`, `/suggest`, `/upload-url`, `/image-save`, `/image-rename`, `/image-delete`, `/flyer-save`, `/flyer-delete` |

Al añadir un endpoint:

- **No crees un archivo nuevo** si puede ir en uno existente: una escritura de admin es una entrada más en
  `api/admin/[action].ts`; una lectura nueva puede agruparse igual (p.ej. `api/[resource].ts`).
- La lógica va en `api/_lib/`, que no cuenta como función.
- `npm run build` (y por tanto el deploy) empieza con `npm run check:functions`, que falla si `api/` supera las 12
  funciones y lista cuáles son.
