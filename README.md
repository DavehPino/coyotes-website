# Coyotes Volley

Web pública del equipo y panel interno oculto (`/vestuario`) para gestionar actividades semanales y videos.

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
2. Aplica el esquema con **una** de estas opciones:
   - SQL Editor → pega `supabase/migrations/20260912000000_initial_schema.sql` y luego `supabase/seed.sql`.
   - CLI: `npx supabase login`, `npx supabase link --project-ref <ref>` y `npx supabase db push`.
3. En Project Settings → API Keys, copia la URL y la **secret key** en `SUPABASE_URL` y `SUPABASE_SECRET_KEY`.
4. (Opcional) Ejecuta `npm run db:types` para generar `shared/database.types.ts`.

> El plan Free pausa el proyecto tras 7 días sin actividad. El cron diario `/api/cron/keepalive`
> (en `vercel.json`) lo evita cuando la app está desplegada en Vercel.

### 3. Bucket de videos: Cloudflare R2 (gratis hasta 10 GB y sin coste por salida de datos)

1. En Cloudflare → R2, crea el bucket `coyotes-videos`.
2. En R2 → Manage API tokens, crea un token con permiso **Object Read** sobre ese bucket
   (la app solo lista y lee). Copia el Access Key ID y el Secret en `S3_ACCESS_KEY_ID` y `S3_SECRET_ACCESS_KEY`.
3. Usa `S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com` y `S3_REGION=auto`.
4. Sube los videos dentro de `videos/` (desde la consola, rclone o Cyberduck). Conviene nombrarlos
   `YYYY-MM-DD descripcion.mp4`.
5. Para las URLs de reproducción hay dos opciones:
   - **Privado (recomendado):** deja `STORAGE_PUBLIC_BASE_URL` vacío y el backend genera URLs firmadas temporales.
   - **Público:** activa un dominio propio o `r2.dev` en el bucket y ponlo en `STORAGE_PUBLIC_BASE_URL`.

Para usar **AWS S3**, deja `S3_ENDPOINT` vacío y pon la región real, por ejemplo `us-east-1`.

### 4. Variables de entorno

```bash
cp .env.example .env.local   # y rellena los valores
```

Carga las mismas variables en Vercel → Settings → Environment Variables, incluidas `CRON_SECRET` y `SESSION_SECRET`.

### 5. Desarrollo

```bash
vercel link          # primera vez: vincula el proyecto
npm run dev:full     # Vite + /api con vercel dev
npm run dev          # solo frontend (las llamadas a /api fallarán)
```

- Web pública: <http://localhost:3000/>
- Panel interno: <http://localhost:3000/vestuario>

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev:full` | Frontend y funciones en local (`vercel dev`) |
| `npm run build` | Typecheck (app + api) y build de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run db:types` | Genera los tipos de Supabase |

## Ruta interna

`/vestuario` no aparece enlazada en ningún sitio y se marca como `noindex`. La seguridad real es el
**código de acceso** (`INTERNAL_ACCESS_CODE`): genera una cookie de sesión firmada de 30 días que
exige cada endpoint interno. Para cambiar la ruta, edita `src/config.ts` y el header correspondiente en `vercel.json`.
