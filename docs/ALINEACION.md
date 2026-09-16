# Feature — Sección «Alineación» (plantel + cancha táctica)

> **Cómo usarlo:** en una sesión limpia de Claude Code, en la raíz del proyecto:
> `Lee docs/ALINEACION.md y constrúyelo completo siguiendo sus fases y criterios de aceptación.`

---

## 1. Objetivo

Nueva sección del dashboard, **Alineación** (`/lineup`), para que el cuerpo técnico:

1. **Cargue el plantel**: un CTA para crear jugadores y una lista con todos en pantalla.
2. **Asigne posiciones**: cada jugador tiene **1 posición obligatoria y 1 opcional** (máximo 2).
3. **Arme la formación** en un **modal a pantalla completa** con una cancha de vóley 2D, donde se
   arrastran jugadores para decidir titulares y su ubicación en cancha.
4. **Guarde formaciones con nombre** en la base de datos («Titular», «vs Onas», «Sin armador»…) y las
   **elija de una lista** en usos futuros, sin volver a armarlas a mano.
5. **Comparta la alineación como imagen** (PNG): hoja nativa de compartir en el móvil (WhatsApp,
   Instagram…) o descarga en escritorio.

Todo se guarda en Supabase: el equipo lo consulta desde varios móviles, así que nada vive solo en `localStorage`.

---

## 2. Reglas de trabajo (las mismas de `PROMPT.md`, resumidas)

- Lee antes de tocar nada: `PROMPT.md` (secciones 2 y 3), `README.md`, `src/dashboard/router.tsx`,
  `src/dashboard/DashboardLayout.tsx`, `src/dashboard/ui/*`, `src/dashboard/admin/*`,
  `src/dashboard/activities/**` (es el patrón a imitar: listado + alta con palabra clave),
  `api/admin/[action].ts`, `api/lookups/[resource].ts`, `api/_lib/{http,mappers,supabase,activities}.ts`,
  `shared/{domain,schemas}.ts` y la última migración de `supabase/migrations/`.
- **No sumes Vercel Functions.** Hoy hay 10/12 (`npm run check:functions`). Las lecturas van en
  `api/lookups/[resource].ts` y las escrituras en `api/admin/[action].ts`.
- **Sin dependencias nuevas.** El drag & drop se hace con Pointer Events y la cancha es un SVG inline.
- TypeScript estricto, sin `any`. Contratos en `shared/`. Imports relativos con `.js` en `api/` y `shared/`.
- Interfaz en español; identificadores en inglés. Mobile first. Accesible (teclado, foco, `aria-*`, AA).
- Las escrituras exigen `ADMIN_SAFEWORD` (cabecera `x-admin-safeword`) y reutilizan `SafewordStep`.
- Al terminar cada fase: `npm run build` sin errores y verificación real en el navegador
  (el puerto 5173 suele estar ocupado: usa `--port 5174`).

---

## 3. Vocabulario: posiciones y colores

Añadir a `shared/domain.ts` (y el mismo CHECK en SQL):

```ts
export const PLAYER_POSITIONS = ['armador', 'punta', 'central', 'opuesto', 'libero', 'comodin'] as const
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number]

export const PLAYER_POSITION_LABELS: Record<PlayerPosition, string> = {
  armador: 'Armador',
  punta: 'Punta',
  central: 'Central',
  opuesto: 'Opuesto',
  libero: 'Líbero',
  comodin: 'Comodín',
}

/** Abreviatura de 3 letras: el color nunca es la única pista. */
export const PLAYER_POSITION_SHORT: Record<PlayerPosition, string> = {
  armador: 'ARM', punta: 'PUN', central: 'CEN', opuesto: 'OPU', libero: 'LÍB', comodin: 'COM',
}
```

Colores (tokens nuevos en el `@theme` de `src/index.css`, p. ej. `--color-pos-armador`), elegidos para
distinguirse entre sí, de la paleta Coyotes y del fondo de la cancha:

| Posición | Token | Color | Texto encima |
|---|---|---|---|
| Armador | `pos-armador` | `#3b82f6` azul | blanco |
| Punta | `pos-punta` | `#22c55e` verde | negro |
| Central | `pos-central` | `#ef4444` rojo | blanco |
| Opuesto | `pos-opuesto` | `#a855f7` violeta | blanco |
| Líbero | `pos-libero` | `#facc15` amarillo (como su camiseta distinta) | negro |
| Comodín | `pos-comodin` | `#2dd4bf` turquesa | negro |

- Verifica el contraste AA del texto sobre cada color y ajusta el tono si no llega.
- Un mapa `POSITION_STYLES` en el frontend (`src/dashboard/lineup/positions.ts`) traduce posición → clases
  de Tailwind (fondo, texto, borde), para no repetir el `switch` en cada componente.
- **Jugador con 2 posiciones:** la ficha muestra el color principal como relleno y el secundario como
  anillo exterior (o mitad y mitad con `conic-gradient`); en la lista, dos chips en orden (principal primero).

---

## 4. Modelo de datos

Migración nueva `supabase/migrations/20260919000000_players_lineups.sql` (RLS activado sin políticas,
como el resto; trigger `set_updated_at` en las tablas con `updated_at`):

```sql
create table public.players (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  jersey_number      smallint,
  primary_position   text not null,
  secondary_position text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint players_name_not_blank check (length(trim(name)) > 0),
  constraint players_jersey_range check (jersey_number is null or jersey_number between 0 and 99),
  constraint players_primary_position_check check (primary_position in (...)),
  constraint players_secondary_position_check check (secondary_position is null or secondary_position in (...)),
  constraint players_positions_distinct check (secondary_position is distinct from primary_position)
);
-- Número de camiseta único entre jugadores activos.
create unique index players_active_jersey_key on public.players (jersey_number)
  where is_active and jersey_number is not null;

create table public.lineups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,           -- p. ej. "Titular", "vs Onas"
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lineups_name_not_blank check (length(trim(name)) > 0)
);
-- El nombre identifica la formación en el selector: no se repite (sin distinguir mayúsculas).
create unique index lineups_name_key on public.lineups (lower(trim(name)));

create table public.lineup_players (
  lineup_id uuid not null references public.lineups (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  -- Coordenadas normalizadas (0..1) sobre la media cancha: independientes del tamaño de pantalla.
  x numeric(4,3) not null check (x between 0 and 1),
  y numeric(4,3) not null check (y between 0 and 1),
  primary key (lineup_id, player_id)
);
```

- Borrar un jugador lo quita de todas las formaciones (cascade). En la UI se avisa antes.
- Después de migrar: `npm run db:types` para regenerar `shared/database.types.ts`.
- Añadir 8–10 jugadores de ejemplo y una formación a `supabase/seed.sql`.

---

## 5. Contratos (`shared/schemas.ts`)

```ts
type Player = { id; name; jersey_number: number | null; primary_position; secondary_position: PlayerPosition | null; is_active }
type LineupSlot = { player_id: string; x: number; y: number }
type Lineup = { id; name; notes: string | null; slots: LineupSlot[]; updated_at }
```

Entradas Zod:

- `playerCreateInput`: `name` (trim, 1–60), `jersey_number` (entero 0–99, opcional), `primary_position`
  (enum, obligatoria), `secondary_position` (enum, opcional) + `refine` que rechace posiciones iguales.
- `playerUpdateInput` = create + `id`, `is_active`.
- `playerDeleteInput` = `{ id }`.
- `lineupSaveInput`: `id` opcional (sin id crea, con id reemplaza), `name`, `notes`, `slots` (máx. 7,
  `player_id` únicos, `x`/`y` entre 0 y 1).
- `lineupDeleteInput` = `{ id }`.

Reglas de la formación (validar en Zod **y** en el backend):

- Máximo **7 en cancha**: 6 titulares + 1 líbero. Como máximo 1 jugador cuya posición principal sea
  líbero cuenta como «líbero»; el resto ocupa las 6 plazas de titular.
- No se puede ubicar un jugador inactivo.

---

## 6. API

Lecturas en `api/lookups/[resource].ts` (sin caché, como las demás):

| Ruta | Respuesta |
|---|---|
| `GET /api/lookups/players` | `Player[]`, activos primero, luego por número y nombre |
| `GET /api/lookups/lineups` | `Lineup[]` con sus `slots`, la más reciente primero |

Escrituras en `api/admin/[action].ts` (todas con `requireAdmin`), lógica en `api/_lib/players.ts` y
`api/_lib/lineups.ts`, mappers en `api/_lib/mappers.ts`:

| Acción | Entrada | Respuesta |
|---|---|---|
| `player-create` | `playerCreateInput` | `201 Player` |
| `player-update` | `playerUpdateInput` | `Player` |
| `player-delete` | `playerDeleteInput` | `{ ok: true }` |
| `lineup-save` | `lineupSaveInput` | `Lineup` (reemplaza todas las filas de `lineup_players` de esa formación) |
| `lineup-delete` | `lineupDeleteInput` | `{ ok: true }` |

- Número de camiseta repetido → `409` con mensaje «Ya hay un jugador activo con el número N».
- Nombre de formación repetido → `409` con mensaje «Ya hay una formación llamada "X"».
- Documentar las rutas nuevas en `README.md` (sección API) igual que las existentes.

---

## 7. Interfaz

### 7.1 Navegación

- Ruta `lineup` en `src/dashboard/router.tsx` (lazy, como las demás) → `src/dashboard/lineup/LineupPage.tsx`.
- Entrada «Alineación» en `SECTIONS` de `DashboardLayout.tsx`, entre Partidos y Flyers, con un icono
  nuevo en `ui/icons.tsx` (p. ej. `UsersIcon` o una cancha simple) con el mismo estilo de trazo y la
  variante `filled`. Comprobar que la barra inferior móvil con 5 entradas sigue cómoda a 360 px.

### 7.2 Página «Alineación»

```
┌───────────────────────────────────────────────┐
│ Alineación                  [+ Cargar jugador] │
│ El plantel y las formaciones del equipo.       │
├───────────────────────────────────────────────┤
│ Formaciones                    [Armar en cancha]│
│  ▸ Titular        6 + L   · editada hace 2 d   │
│  ▸ vs Onas        6       · editada hace 5 d   │
├───────────────────────────────────────────────┤
│ Plantel (12)        [Todas ▾ filtro posición]  │
│  (7)  Juan Pérez     [ARM] [COM]      ✎        │
│  (10) Ana Gómez      [PUN]            ✎        │
│  ...                                           │
└───────────────────────────────────────────────┘
```

- `PageHeader` con el CTA **«Cargar jugador»** (`Button variant="primary"` + `PlusIcon`, igual que
  Actividades). Abre `NewPlayerDialog` (lazy, con `useDialogSession`).
- **Plantel:** lista (no carrusel) con número en círculo, nombre y chips de posición con su color y
  abreviatura. Filtro por posición (chips seleccionables, incluye «Todas»). Los inactivos, al final y
  atenuados. Tocar un jugador abre la edición (mismo formulario) con opción de borrar (confirmación).
- **Formaciones guardadas:** lista con nombre, resumen («6 + L») y fecha de última edición. Tocar una
  abre el modal de cancha con ella cargada, lista para usar, editar o compartir. El botón
  «Armar en cancha» abre el modal con una formación nueva vacía. Sin formaciones, un `EmptyState`
  invita a armar la primera.
- Estados: skeleton al cargar, `EmptyState` sin jugadores («Todavía no hay jugadores» + CTA),
  `ErrorState` con reintento. Hooks TanStack Query en `src/dashboard/lineup/api.ts`; tras cada escritura,
  invalidar/refrescar `players` y `lineups`.

### 7.3 Formulario de jugador (`Modal` normal)

1. `SafewordStep` si aún no se verificó en esta sesión del diálogo (mismo flujo que Actividades).
2. Campos: **Nombre** (obligatorio), **Número** (opcional), **Posición principal** (obligatoria),
   **Posición secundaria** (opcional, «Ninguna» por defecto).
3. Las posiciones se eligen con un grupo de 6 botones de color (`role="radiogroup"`), no con un
   `<select>`: se ve el color que tendrá la ficha. En la secundaria, la posición principal elegida aparece
   deshabilitada. Cambiar la principal a la que era secundaria limpia la secundaria.
4. En edición: interruptor «Activo» y botón «Borrar jugador».

### 7.4 Modal de cancha (pantalla completa)

Componente `LineupBoard` sobre `<dialog>` nativo. Reutiliza `Modal` si se le puede añadir una variante
`size="full"` sin romper los usos actuales; si no, un componente propio con el mismo comportamiento
(Esc, foco atrapado, devolver el foco al cerrar). Ocupa `100dvw × 100dvh` y respeta `safe-area-inset`.

```
Móvil (vertical)                      Escritorio / horizontal
┌──────────────────────────┐          ┌──────────────────────────┬──────────┐
│ ✕  [Titular        ] 💾  │          │ ✕  [Titular      ]    💾 │          │
│ Titulares 5/6 · Líbero ✓ │          │                          │ Banco    │
│ ════════ RED ═══════════ │          │   ════════ RED ════════  │ ( 7) ARM │
│ │  4   │   3   │   2   │ │          │   │ 4  │  3  │  2  │     │ ( 9) PUN │
│ │ (10) │  (4)  │  (7)  │ │          │   ├────┼─────┼─────┤     │ (12) CEN │
│ ├──── línea de 3 m ────┤ │          │   │ 5  │  6  │  1  │     │ ...      │
│ │  5   │   6   │   1   │ │          │   └────┴─────┴─────┘     │          │
│ │ (12) │       │ (9)   │ │          │                          │          │
│ └──────────────────────┘ │          └──────────────────────────┴──────────┘
│ Banco ◂ (3) (5) (8) … ▸  │
└──────────────────────────┘
```

**Cancha**
- **Media cancha propia** (9 × 9 m) en SVG con `viewBox` proporcional: red arriba, línea de ataque a 3 m,
  líneas blancas sobre fondo de cancha (tono cálido oscuro acorde a la marca, que no choque con ninguno
  de los 6 colores). Números de zona 1–6 tenues como guía.
- Se escala para caber entera en el espacio disponible, sin scroll de página.

**Fichas**
- Círculo de ≥ 44 px con el número (o iniciales si no tiene), color según §3, nombre corto debajo y
  abreviatura de la posición. Doble posición según §3.

**Interacción**
- **Arrastrar** (Pointer Events, `setPointerCapture`, `touch-action: none` en la cancha y el banco):
  del banco a la cancha, dentro de la cancha, y de la cancha al banco para quitar un titular.
  La posición se guarda normalizada (0..1) y se limita a los bordes de la cancha.
- **Tocar para ubicar** (alternativa sin arrastre y para teclado): tocar/`Enter` sobre una ficha la
  selecciona (anillo dorado); tocar un punto de la cancha la coloca ahí; tocar el banco la devuelve.
  Con una ficha seleccionada en cancha, las flechas la mueven un paso y `Supr` la manda al banco.
- Límites: al intentar poner un 7.º titular (o un 2.º líbero) la ficha vuelve al banco y aparece un
  aviso breve («Ya hay 6 titulares»). El contador superior muestra «Titulares n/6 · Líbero ✓/—».
- Un jugador con posición principal líbero ocupa la plaza de líbero; si ya está ocupada, no entra.
- Un `aria-live` anuncia cada movimiento («Juan Pérez, zona 4»; la zona se calcula por tercios).
- Animación corta al soltar (`transform`, ≤ 150 ms, ease-out). Sin animación con
  `prefers-reduced-motion`.

**Banco**
- Todos los jugadores activos que no están en cancha, ordenados por posición principal y número.
- Móvil: tira horizontal desplazable bajo la cancha. Escritorio/horizontal: columna lateral.
- Filtro rápido por posición (mismos chips que la página).

**Barra superior**
- Cerrar y **selector de formación**: un desplegable con las formaciones guardadas (y «Nueva formación»)
  para cambiar de una a otra sin salir del modal. Si hay cambios sin guardar, se confirma antes de cambiar.
- Botón **Guardar**: en una formación nueva pide el **nombre** (obligatorio, único) antes de guardar;
  en una existente guarda directo. Pide la palabra clave con `SafewordStep` si hace falta, en un paso
  dentro del mismo modal.
- Botón **Compartir** (ver §7.5).
- Menú con «Renombrar», «Guardar como nueva» (copia con otro nombre, para variantes), «Vaciar cancha» y
  «Borrar formación» (con confirmación).
- Al cerrar con cambios sin guardar: confirmación («¿Descartar los cambios?»).

### 7.5 Compartir la alineación como imagen

- **Dibujo en `<canvas>`, no captura del DOM** (sin `html2canvas` ni dependencias nuevas), con el mismo
  enfoque que `src/dashboard/flyers/render.ts`: `src/dashboard/lineup/share/renderLineup.ts` recibe la
  formación y los jugadores y dibuja un PNG de **1080 × 1350** (vertical, bueno para WhatsApp e Instagram).
- Contenido de la imagen: fondo con la paleta Coyotes, escudo y nombre del equipo, nombre de la
  formación, la media cancha con las fichas en su lugar (color de posición, número y nombre), la lista
  de titulares y líbero con sus posiciones en texto, y una leyenda de colores con solo las posiciones que
  aparecen. Las fuentes se cargan antes de dibujar (reutilizar `loadFlyerFonts` y `loadImage`).
- La cancha y las fichas se dibujan con las mismas funciones de geometría (`board/rules.ts`) que usa la
  vista, para que la imagen coincida con lo que se ve.
- **Acciones:** sacar la lógica de descarga y `navigator.share` de `flyers/ExportActions.tsx` a un helper
  común (`src/lib/shareImage.ts`: `canShareFiles()`, `shareFile()`, `downloadFile()`) y usarlo en Flyers y
  en Alineación, sin cambiar el comportamiento de Flyers.
  - Móvil con `navigator.canShare({ files })`: **Compartir** abre la hoja nativa. Cerrarla no es error.
  - Si no se puede compartir archivos: el botón pasa a **Descargar** (`coyotes-alineacion-<slug>.png`).
- Compartir **no pide palabra clave** (no escribe nada) y funciona también con cambios sin guardar:
  exporta lo que hay en cancha. Con la cancha vacía, el botón está deshabilitado.
- También se puede compartir desde la lista de formaciones de la página (acción en cada fila), sin abrir
  el modal.

---

## 8. Estructura de archivos esperada

```
shared/domain.ts                       + posiciones, etiquetas, abreviaturas, límites
shared/schemas.ts                      + Player, Lineup, entradas Zod
supabase/migrations/20260919000000_players_lineups.sql
supabase/seed.sql                      + jugadores y una formación de ejemplo
api/_lib/players.ts  api/_lib/lineups.ts  api/_lib/mappers.ts
api/lookups/[resource].ts              + players, lineups
api/admin/[action].ts                  + player-*, lineup-*
src/index.css                          + tokens --color-pos-*
src/dashboard/router.tsx  src/dashboard/DashboardLayout.tsx  src/dashboard/ui/icons.tsx
src/dashboard/lineup/
  LineupPage.tsx        api.ts            positions.ts
  PlayerList.tsx        PlayerChip.tsx    PositionPicker.tsx
  player/PlayerDialog.tsx (alta y edición)   player/draft.ts
  board/LineupBoard.tsx  board/Court.tsx  board/PlayerToken.tsx
  board/Bench.tsx        board/useBoardDrag.ts  board/rules.ts (límites y zonas, funciones puras)
  board/LineupPicker.tsx (selector de formaciones guardadas)
  share/renderLineup.ts  share/ShareLineupButton.tsx
src/lib/shareImage.ts                  helper común de compartir/descargar (lo usan Flyers y Alineación)
src/dashboard/flyers/ExportActions.tsx pasa a usar src/lib/shareImage.ts
README.md                              + rutas nuevas
```

---

## 9. Fases

1. **Datos y contratos:** migración, tipos regenerados, dominio, schemas, seed. Aplicar la migración al
   proyecto enlazado (`npx supabase db push`) **solo tras confirmarlo con el usuario**.
2. **API:** lecturas y escrituras con sus validaciones y errores. Probar con `curl` contra el servidor local.
3. **Plantel:** ruta, navegación, página, lista, filtro y formulario de alta/edición/borrado.
4. **Cancha:** modal fullscreen, SVG, fichas, banco, arrastre, tocar-para-ubicar, teclado y límites.
5. **Formaciones:** guardar con nombre, selector para cargarlas, renombrar, guardar como nueva, borrar y
   aviso de cambios sin guardar.
6. **Compartir:** helper común, render en canvas, botón en el modal y en la lista. Comprobar que Flyers
   sigue exportando igual.
7. **Pulido:** accesibilidad, `prefers-reduced-motion`, revisión a 360 px y en escritorio, README.

---

## 10. Criterios de aceptación

- [ ] «Alineación» aparece en la navegación (móvil y escritorio) y carga en `/lineup`.
- [ ] «Cargar jugador» pide la palabra clave, crea el jugador y aparece en la lista sin recargar.
- [ ] No se puede guardar un jugador sin posición principal ni con dos posiciones iguales (frontend y API).
- [ ] Cada posición tiene su color y su abreviatura en la lista, el formulario, el banco y la cancha.
- [ ] Un jugador con dos posiciones muestra ambos colores, con la principal destacada.
- [ ] El modal de cancha ocupa toda la pantalla, se cierra con Esc y devuelve el foco.
- [ ] Se puede arrastrar con dedo y con ratón: banco → cancha, dentro de la cancha y cancha → banco.
- [ ] Se puede armar una formación completa solo con teclado.
- [ ] No entran más de 6 titulares ni más de 1 líbero; el contador lo refleja.
- [ ] Una formación nueva no se guarda sin nombre; un nombre repetido muestra el error de la API.
- [ ] Las formaciones guardadas aparecen en la página y en el selector del modal; elegir una la carga.
- [ ] Una formación guardada se reabre con cada jugador en el mismo lugar, en móvil y en escritorio,
      también tras recargar la página o desde otro dispositivo.
- [ ] «Guardar como nueva» crea una copia con otro nombre sin tocar la original.
- [ ] «Compartir» genera un PNG 1080 × 1350 que coincide con la cancha (posiciones, colores, nombres) y
      abre la hoja nativa en móvil; en escritorio descarga el archivo.
- [ ] Flyers sigue compartiendo y descargando igual tras extraer el helper.
- [ ] Borrar un jugador lo quita de las formaciones, tras confirmación.
- [ ] `npm run build` pasa y `npm run check:functions` sigue en 10/12.

---

## 11. Fuera de alcance (posibles siguientes pasos)

- Rotaciones automáticas (girar las 6 posiciones) y validación de solapamientos reglamentarios.
- Vincular una formación a un partido o actividad concreta.
- Estadísticas por jugador y fotos de jugador.
- Enlace público para ver una formación sin la imagen (hoy se comparte solo como PNG).
- Mostrar el plantel en la web pública.

## 12. Decisiones tomadas por defecto (cambiarlas aquí antes de construir si no convencen)

- **Varias formaciones con nombre único**, no una única «formación actual».
- **Imagen vertical 1080 × 1350** para compartir, dibujada en canvas.
- **Media cancha** en lugar de cancha completa: el rival no se posiciona y así las fichas se ven más grandes en el móvil.
- **Líbero aparte:** 6 titulares + 1 líbero en cancha.
- **Número de camiseta opcional** y único entre activos.
- **Posiciones libres** en la cancha (no se ajustan a las 6 zonas); las zonas son solo guía.
- **Edición y borrado de jugadores** incluidos (no se pidieron explícitamente, pero una lista sin ellos queda coja).
