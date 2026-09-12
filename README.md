# Coyotes Volley

Un único deploy con dos apps:

- **`<dominio>`**: web pública del equipo.
- **`dashboard.<dominio>`**: dashboard interno con **Actividades** (tablero semanal) y **Partidos** (partidos
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

> El plan Free pausa el proyecto tras 7 días sin actividad. El cron diario de `vercel.json` lo evita.

### 3. Bucket de videos: Cloudflare R2 (10 GB gratis y sin coste por salida de datos)

1. En Cloudflare → R2, crea el bucket `coyotes-videos`.
2. Crea un API token con permiso **Object Read** sobre ese bucket y cópialo en `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`.
3. Usa `S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com` y `S3_REGION=auto`.
4. Sube los videos de cada partido a `games/<slug-del-partido>/`, por ejemplo
   `games/2026-09-06-vs-onas/set-1.mp4`. El slug debe coincidir con `matches.slug`.
5. Para la reproducción: deja `STORAGE_PUBLIC_BASE_URL` vacío si quieres URLs firmadas temporales (bucket privado),
   o pon ahí el dominio público del bucket.

Para usar **AWS S3**, deja `S3_ENDPOINT` vacío y pon la región real.

### 4. Variables de entorno

```bash
cp .env.example .env.local   # y rellena los valores
```

Carga las mismas variables en Vercel → Settings → Environment Variables.

### 5. Dominios en Vercel

En Project → Settings → Domains, añade **los dos** al mismo proyecto:

- `tudominio.com` (web pública)
- `dashboard.tudominio.com` (dashboard)

La app decide qué mostrar según el host (`src/config.ts`). Las URLs de preview de Vercel no tienen subdominio:
para previsualizar el dashboard allí, define `VITE_APP_TARGET=dashboard` en el entorno Preview.

### 6. Desarrollo

```bash
npm run dev          # solo frontend
npm run dev:full     # frontend + /api con vercel dev (requiere `vercel link`)
```

| App | `npm run dev` | `npm run dev:full` |
|---|---|---|
| Web pública | <http://localhost:5173> | <http://localhost:3000> |
| Dashboard | <http://dashboard.localhost:5173> | <http://dashboard.localhost:3000> |

Los navegadores resuelven `*.localhost` a tu máquina sin configurar nada.

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev` / `dev:full` | Desarrollo |
| `npm run build` | Typecheck (app + api) y build de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run db:types` | Genera los tipos de Supabase |

## Acceso al dashboard

`dashboard.<dominio>` no está enlazado desde la web pública y va marcado como `noindex`, pero **no tiene login**:
cualquiera que conozca la URL puede ver actividades, partidos y videos. Usuarios y roles están previstos más adelante.
