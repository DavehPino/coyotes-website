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
- **Backend:** [teamhub-api](https://github.com/DavehPino/teamhub-api), proyecto aparte (Vercel Functions,
  Supabase y bucket R2). Este deploy reescribe `/api/*` a ese proyecto.

El plan de construcción completo está en [`PROMPT.md`](./PROMPT.md).

## Puesta en marcha

### 1. Dependencias

```bash
npm install
```

### 2. Backend

Levanta y despliega [teamhub-api](https://github.com/DavehPino/teamhub-api) siguiendo su README: ahí viven Supabase
(migraciones y seed), el bucket, las palabras clave, la IA y el cron. Este proyecto no tiene variables de servidor.

`vercel.json` reescribe `/api/:path*` al dominio de producción de teamhub-api. Si cambia ese dominio, actualiza el
`destination` del primer rewrite. Como el navegador sigue llamando a `/api` en el mismo origen, no hace falta CORS.

### 3. CORS del bucket

El navegador sube videos, imágenes y flyers directo al bucket (`PUT`, exponiendo `ETag`) y el generador de flyers
lee las imágenes para dibujarlas en el lienzo (`GET`; sin él los logos no aparecen y no se puede exportar el PNG).
En Cloudflare → R2 → Bucket → Settings → **CORS Policy**, añade los orígenes del dashboard:

```json
[
  {
    "AllowedOrigins": ["https://dashboard.tudominio.com", "http://dashboard.localhost:5173"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Las URLs de preview de Vercel cambian en cada deploy: si quieres subir desde una preview, añade su dominio.

### 4. Variables de entorno

```bash
cp .env.example .env.local   # y rellena los valores
```

Las variables `VITE_*` se cargan también en Vercel → Settings → Environment Variables.

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
npm run dev          # en ../teamhub-api (backend en http://localhost:3200)
npm run dev          # aquí: Vite reenvía /api a API_PROXY (http://localhost:3200 en .env.local)
```

| App | URL |
|---|---|
| Web pública | <http://localhost:5173> |
| Dashboard | <http://dashboard.localhost:5173> |

Sin `API_PROXY`, las llamadas a `/api` no tienen servidor.

### Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Desarrollo |
| `npm run build` | Typecheck y build de producción |
| `npm run typecheck` | Solo TypeScript |
| `npm run preview` | Sirve el build |

### Contratos compartidos

`shared/` es una copia de `teamhub-api/shared` (esquemas zod, tipos de la base de datos y constantes). Cuando cambie
un contrato o se regeneren los tipos en el backend, copia esos archivos aquí.

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
2. **Partido:** fecha, hora, competición (una de las de la organización: las ligas de CourtTrack configuradas en
   **Ligas** y `Amistoso`), fase, lugar y parciales. Los sets ganados y
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

### Competiciones, temporadas y filtro por liga

Cada partido pertenece a una **competición** de la organización (tabla `competitions`: ligas, amistosos, torneos) y,
si vino de CourtTrack, a una **temporada** (fila de `courtrack_leagues`). En Partidos, una fila de chips filtra el
carrusel y la lista por competición (se pueden marcar varias) y, cuando hay una sola marcada con varias temporadas
(o alguna finalizada), un selector filtra por temporada. El filtro va en la URL (`?liga=<id>,<id>&temporada=<id>`),
así que sobrevive a recargar y se puede compartir; la API acepta `competition_id=a,b`. Las competiciones se crean al configurar una liga de CourtTrack (abajo) o vienen de la migración
inicial (`Liga Podio`, `Amistoso`).

### Ligas de CourtTrack

El botón **Ligas** de Partidos (con la palabra clave) gestiona las ligas de la app CourtTrack que sigue el equipo
(tabla `courtrack_leagues`; el microservicio [`courtrack-service`](../courtrack-service), repo y deploy aparte con la
misma base de datos, las lee al sincronizar):

- **Lista:** cada temporada en curso con su competición, liga y asociación de CourtTrack, cómo aparece el equipo y
  último sync. **Sincronizar** abre el diálogo de sync con esa liga; **Clasificación** muestra la tabla de posiciones
  guardada en el último sync; **Quitar** elimina la configuración (y su clasificación guardada) pero conserva los
  partidos importados (con su `courtrack_id`, así que volver a añadirla los reconoce) y la competición. Las
  temporadas no se pausan ni se cierran a mano: las cierra el sync cuando CourtTrack reinicia la liga. El estado y la
  clasificación se cachean 25 s en el navegador.
- **Temporadas finalizadas:** sección plegada con las temporadas que el sync archivó, su motivo (CourtTrack reinició la
  liga o la liga ya no existe) y su clasificación final.
- **Agregar liga:** asistente con el catálogo de CourtTrack. Tras elegir la asociación (p.ej. PODIO), **busca al
  equipo propio en todas sus ligas** (recorre el fixture de cada una y compara el nombre sin mayúsculas ni acentos) y
  propone solo las ligas donde aparece, marcadas las que aún no sigues; cada una se guarda como una competición con
  su nombre. El nombre buscado es el del equipo propio de la base (`teams.is_own_team`): no se puede escribir otro,
  y el backend rechaza cualquier alta cuyo equipo no sea el propio o no juegue en la liga. Al guardar ofrece la vista
  previa.

### Temporadas e histórico

CourtTrack reinicia las ligas al terminar (PODIO siempre). Para no perder nada, cada sync guarda una **instantánea**
de la clasificación y del fixture de la liga, y cuando detecta el reseteo (ninguno de los partidos guardados sigue
publicado) **archiva la temporada** con esa instantánea congelada y **abre la siguiente** bajo la misma competición.
Los partidos siguen colgados de su temporada, así que el filtro por temporada y la clasificación final siguen
disponibles. Si la liga desaparece de CourtTrack, la temporada se archiva igual.

### Sincronizar con CourtTrack

El botón **Sincronizar** de Partidos importa los resultados de **todas las ligas activas con un solo cupo** (o de una
sola, elegida en el selector o desde Ligas). El diálogo muestra qué se va a sincronizar, el último sync y el cupo
restante (**`SYNC_DAILY_LIMIT` sincronizaciones por 24 h**), y ofrece:

- **Vista previa:** qué crearía, actualizaría u omitiría, qué rivales nuevos daría de alta y si alguna temporada se
  cerraría. No escribe ni gasta cupo. Si un rival "a crear" ya existe con otro nombre, la propia fila permite
  **vincularlo** a un rival cargado (`courtrack_team_links`) y la vista previa se repite.
- **Sincronizar:** crea los partidos jugados con parciales, rival, fase y cancha; actualiza los ya importados y
  **vincula** los cargados a mano el mismo día contra el mismo rival y de la misma competición en vez de duplicarlos
  (`matches.courtrack_id`). CourtTrack es la fuente de verdad: también pisa el nombre y el logo del rival (la
  abreviatura se conserva). El slug, el resumen, la portada y los videos no se tocan; si se editan datos de resultado a
  mano, la siguiente sincronización vuelve a poner los de CourtTrack. El resultado se muestra por liga, con los
  totales cuando son varias.

Requiere `COURTRACK_SYNC_URL`, `COURTRACK_SYNC_SECRET` (sin ellos Ligas y Sincronizar responden 503) y `ORG_ID`
en teamhub-api.

### Progresión y estadísticas de un set

En el detalle de un partido que vino de CourtTrack (tiene `courtrack_id`), cada parcial es un botón que abre un
diálogo con pestañas por set y una de totales del partido. Los datos salen de `getDetallePartido` de CourtTrack a
través del microservicio (`GET /api/courtrack/partido?id=`) y `GET /api/matches/:slug?view=stats`, que los orienta
al equipo propio según `is_home`. Un partido cargado a mano no tiene el botón.

- **Set:** marcador, duración, tiempos y cambios, mayor racha y máxima ventaja de cada equipo; el gráfico de
  **progresión** (diferencia de puntos a lo largo del set, con los tiempos técnicos marcados y el punto bajo el
  puntero) y la lista plegable punto a punto; **cómo se hicieron los puntos** (ataques, puntos de saque, bloqueos y
  errores de cada equipo, enfrentados, más puntos propios y regalados por el rival); las acciones de **cada
  jugador propio** en ese set (derivadas de la progresión, coinciden con los totales oficiales) y la **formación
  inicial** en las seis zonas con quién saca primero y los líberos.
- **Partido:** duración y horario real, MVP, el mismo enfrentamiento de acciones con los totales y la tabla de
  jugadores propios con puntos disputados en cancha y el puntaje que calcula CourtTrack.

Los componentes viven en `src/dashboard/matches/stats/` (`setStats.ts` tiene los cálculos: rachas, ventajas y
líneas por jugador). CourtTrack guarda los errores de un equipo como puntos recibidos por el rival; el microservicio
ya los devuelve como errores cometidos, así que `points = attacks + aces + blocks + errores del rival`.

## Alineación

La sección **Alineación** (`dashboard.<dominio>/lineup`) guarda el plantel y las formaciones en Supabase
(`players`, `lineups`, `lineup_players`), así que todo el equipo ve lo mismo desde cualquier móvil. Crear, editar o
borrar pide la palabra clave de carga (`ADMIN_SAFEWORD`); ver y compartir, no.

- **Plantel:** **Cargar jugador** pide nombre, número opcional (único entre activos), posición principal y una
  secundaria opcional distinta. Cada posición tiene su color y su abreviatura (Armador ARM, Punta PUN, Central CEN,
  Opuesto OPU, Líbero LÍB, Comodín COM; tokens `--color-pos-*` en `src/index.css`). Tocar un jugador lo edita, lo marca
  inactivo (sale del banco) o lo borra, lo que también lo quita de las formaciones.
- **Cancha:** **Armar en cancha** (o tocar una formación) abre la media cancha a pantalla completa. Los jugadores se
  arrastran del banco a la cancha, dentro de ella y de vuelta al banco, con el dedo o con el ratón. Sin arrastrar:
  tocar una ficha la selecciona y tocar la cancha la ubica. Con teclado: Enter selecciona, Enter otra vez la pone en
  la primera zona libre, las flechas la mueven (Mayús para pasos largos), Supr la devuelve al banco y Esc la
  deselecciona. Entran 6 titulares y 1 líbero (quien tiene líbero como posición principal). Las posiciones son
  libres; las zonas 1–6 son solo una guía.
- **Formaciones:** una nueva pide nombre (único) al guardar; una existente se guarda directo. El selector de la barra
  superior cambia de formación y el menú permite renombrar, **Guardar como nueva** (variantes sin tocar la original),
  vaciar la cancha y borrar. Si hay cambios sin guardar, se confirma antes de cerrar o cambiar.
- **Compartir:** genera un PNG de 1080×1350 con la cancha, los titulares, el líbero y una leyenda de colores
  (`src/dashboard/lineup/share/renderLineup.ts`). En móviles abre la hoja nativa de compartir; en escritorio lo
  descarga. Exporta lo que hay en cancha aunque no esté guardado, y también está en cada fila de la lista.

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

Configuración (en teamhub-api): crea una clave en OpenRouter → Keys y guárdala en `OPENROUTER_API_KEY`. El nombre
del equipo sale de la base de datos y `TEAM_PROFILE` describe su estilo (ciudad, colores, tono). Sin clave, el asistente
responde 503 y el resto de la sección funciona igual. `OPENROUTER_MODEL` es opcional: por defecto es
`openrouter/free`, que enruta a algún modelo gratuito disponible, así que no se rompe si retiran uno concreto. Los
modelos gratuitos tienen límite de peticiones por minuto y por día; al superarlo se muestra un aviso para reintentar.

## Datos y API

La edición de datos a mano (Supabase), la convención del bucket de videos, el cron de sincronización y la
referencia de endpoints están en el README de [teamhub-api](https://github.com/DavehPino/teamhub-api).
El cliente de la API es `src/lib/api.ts` (lecturas) y `src/dashboard/admin/adminApi.ts` (escrituras con palabra clave).
