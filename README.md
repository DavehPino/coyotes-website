# Coyotes Volley

Un único deploy con dos apps:

- **`<dominio>`**: web pública del equipo. Por defecto es una landing mínima (escudo, nombre y eslogan);
  con `VITE_HOME_VARIANT=full` se publica la página completa (Sobre el equipo, Entrenamientos y Contacto).
  Los textos viven en `src/content/public.ts`.
- **`<dominio>/dashboard`**: dashboard interno con **Actividades** (tablero semanal) y **Partidos** (partidos
  pasados con sus videos). Por ahora es de solo lectura y no pide login.

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
2. Crea un API token con permiso **Object Read** sobre ese bucket y cópialo en `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`.
3. Usa `S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com` y `S3_REGION=auto`.
4. Sube los videos de cada partido a `games/<slug-del-partido>/` (ver [convención del bucket](#convención-del-bucket-de-videos)).
5. Para la reproducción: deja `STORAGE_PUBLIC_BASE_URL` vacío si quieres URLs firmadas temporales (bucket privado),
   o pon ahí el dominio público del bucket.
6. Define `CRON_SECRET` (cualquier cadena larga): protege el cron de sincronización.

Para usar **AWS S3**, deja `S3_ENDPOINT` vacío y pon la región real.

### 4. Variables de entorno

```bash
cp .env.example .env.local   # y rellena los valores
```

Carga las mismas variables en Vercel → Settings → Environment Variables.

### 5. Dominio en Vercel

Un solo proyecto y un solo dominio: la web pública en la raíz y el dashboard en `/dashboard`.
La app decide qué montar según la ruta (`src/config.ts`), así que funciona igual en `coyotes.vercel.app/dashboard`
que en `tudominio.com/dashboard`, también en las URLs de preview.

### 6. Desarrollo

```bash
npm run dev          # solo frontend
npm run dev:full     # frontend + /api con vercel dev (requiere `vercel link`)
```

| App | `npm run dev` | `npm run dev:full` |
|---|---|---|
| Web pública | <http://localhost:5173> | <http://localhost:3000> |
| Dashboard | <http://localhost:5173/dashboard> | <http://localhost:3000/dashboard> |

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev` / `dev:full` | Desarrollo |
| `npm run build` | Typecheck (app + api) y build de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run db:types` | Genera los tipos de Supabase (`shared/database.types.ts`) tras cada migración |

Con `npm run dev` las llamadas a `/api` no tienen servidor. Para desarrollar el frontend contra otro backend local,
`API_PROXY=http://localhost:3000 npm run dev` reenvía `/api` a ese puerto.

## Acceso al dashboard

`<dominio>/dashboard` no está enlazado desde la web pública y va marcado como `noindex`, pero **no tiene login**:
cualquiera que conozca la URL puede ver actividades, partidos y videos. Usuarios y roles están previstos más adelante.

## Cómo cargar actividades y partidos

Todavía no hay administración en el dashboard: los datos se editan en **Supabase → Table Editor**
(o con SQL). `supabase/seed.sql` es un ejemplo completo y se puede ejecutar varias veces sin duplicar filas:
`npx supabase db query --linked -f supabase/seed.sql`.

1. **Equipos** (`teams`): un registro con `is_own_team = true` (Coyotes) y uno por rival. `short_name` (3 letras)
   se usa como escudo cuando no hay `logo_url`.
2. **Actividades** (`weekly_activities`): una fila por actividad con `activity_date` (día), `start_time`/`end_time`
   (hora local, opcionales), `activity_type` (`entrenamiento`, `partido`, `amistoso`, `torneo`, `fisico`,
   `video_analisis`, `reunion`, `otro`), `location`, `description`, `opponent_team_id` (rival, opcional) e
   `is_cancelled`. La semana (`week_start`) se calcula sola. El tablero muestra la semana actual y permite navegar
   con `/dashboard/activities?week=YYYY-MM-DD`.
3. **Partidos** (`matches`): `slug` único en kebab-case (p.ej. `2026-09-06-vs-onas`; es la URL
   `/dashboard/matches/<slug>` y la carpeta del bucket), `played_on`, `start_time`, `opponent_team_id`, `is_home`,
   `location`, `competition`, `phase`, `sets_won`, `sets_lost` y `set_scores` con los parciales:
   `[{"us":25,"them":20},{"us":22,"them":25}]`. `summary` admite saltos de línea y `cover_image_url` es la portada
   del carrusel (sin ella se muestran los escudos). Solo aparecen los partidos con `played_on <= hoy`.
4. **Videos** (`videos`): los del bucket los crea el cron (abajo). Para enlaces externos crea una fila con
   `source = 'external'`, `url` (YouTube se incrusta; el resto abre en pestaña nueva), `match_id`, `set_number`
   (opcional) y `status = 'ready'`. Los videos con `status = 'archived'` no se muestran.

### Convención del bucket de videos

Los archivos se suben fuera de la app (consola de R2, rclone, Cyberduck…):

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

Después del sync, edita en el Table Editor el `title` de cada video y, si hace falta, `set_number` y `sort_order`.

## API (solo lectura)

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/activities?week=YYYY-MM-DD` | Actividades de la semana (lunes) con el rival embebido |
| GET | `/api/matches?until=YYYY-MM-DD&limit=50` | Partidos jugados hasta la fecha, del más reciente al más antiguo |
| GET | `/api/matches/:slug` | Detalle con parciales y videos ordenados (404 si no existe) |
| GET | `/api/videos/:id/playback` | URL de reproducción (pública o firmada temporal) |
| GET | `/api/cron/sync-videos` | Sincroniza el bucket; requiere `Authorization: Bearer <CRON_SECRET>` |

Los contratos viven en `shared/schemas.ts`; el acceso a datos está centralizado en `api/_lib/` para poder añadir
autenticación más adelante sin rehacer rutas.
