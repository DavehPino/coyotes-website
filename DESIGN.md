---
name: Coyotes Volley · Dashboard
description: El suelo del pabellón: el contenido vive entre líneas pintadas sobre parquet de arce, en vinilo negro, con la cinta y las letras del club como única capa de marca.
colors:
  floor: "#ecd5a5"
  floor-deep: "#dab97c"
  floor-seam: "#c9a562"
  line: "#f8f4ea"
  ink: "#161412"
  ink-soft: "#5b4a2f"
  club: "#f5b014"
  tape: "#f07c13"
  antenna: "#c8362b"
  antenna-deep: "#9c2419"
  line-green: "#2f7d4e"
  podio: "#1f6f96"
  podio-mist: "#d4eef9"
typography:
  display:
    fontFamily: "Big Shoulders Stencil, Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "5rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Big Shoulders, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "normal"
  title:
    fontFamily: "Big Shoulders, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  mark:
    fontFamily: "Big Shoulders Stencil, Big Shoulders, Arial Narrow, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Big Shoulders, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "tnum"
  action:
    fontFamily: "Big Shoulders, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.025em"
  label:
    fontFamily: "Big Shoulders, Arial Narrow, Roboto Condensed, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.333
    letterSpacing: "0.05em"
rounded:
  hairline: "2px"
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  rule: "2px"
  line: "6px"
  inline: "8px"
  stack: "12px"
  gutter: "16px"
  zone: "32px"
  gutter-md: "32px"
  zone-md: "40px"
  touch: "44px"
  row: "56px"
  row-lg: "64px"
  rail: "224px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.club}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "rgb(22 20 18 / 0.88)"
  button-secondary:
    backgroundColor: "rgb(248 244 234 / 0.4)"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "rgb(248 244 234 / 0.8)"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "rgb(22 20 18 / 0.08)"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.antenna}"
    textColor: "#ffffff"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "44px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "0"
    size: "44px"
  chip-club:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.club}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "2px 6px"
  chip-tape:
    backgroundColor: "{colors.tape}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "2px 6px"
  chip-line:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "2px 6px"
  chip-podio:
    backgroundColor: "{colors.podio}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "2px 6px"
  input:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "rgb(22 20 18 / 0.7)"
    typography: "{typography.label}"
    padding: "8px 4px"
    height: "56px"
  nav-link-active:
    textColor: "{colors.ink}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.club}"
  page-header:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    padding: "12px 16px 16px"
  outline-rect:
    backgroundColor: "rgb(248 244 234 / 0.25)"
    rounded: "{rounded.md}"
  modal:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0"
    width: "calc(100% - 2rem)"
  empty-state:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "48px 24px"
---

# Design System: Coyotes Volley · Dashboard

<!-- Ámbito: el dashboard interno (`html[data-app="dashboard"]`). La web pública (`src/public/*`) sigue con el mundo oscuro anterior y sus tokens `coyote-*`, Teko e Inter; no forma parte de este sistema. -->

## Overview

**Creative North Star: "El suelo del pabellón"**

El dashboard es el suelo de un polideportivo visto desde el banquillo: parquet de arce rubio con las juntas de los tablones apenas marcadas, líneas pintadas de 6 px que estructuran la página y reglas de cinta de 2 px que separan las filas. El contenido se apoya sobre el parquet, nunca dentro de una caja: cada bloque es una zona con su línea arriba y su rótulo pegado a ella, y lo que en otro sitio sería una tarjeta aquí es, como mucho, un rectángulo pintado. El texto es vinilo negro en una sola familia (Big Shoulders); los números de cancha (fechas, horas, marcadores, parciales) van en su variante Stencil, negros y monumentales, como los números pintados en el suelo. Las acciones son rótulos de vinilo: la principal, vinilo negro con las letras en el dorado del club; el resto, rectángulos pintados con el texto en negro.

Es una herramienta con piel de club. La estructura (suelo, líneas, vinilo, tipografía, composición) la heredaría cualquier club; lo que es de los Coyotes cabe en una capa finísima: el escudo, el nombre, las letras doradas sobre vinilo (`club`) y la cinta naranja (`tape`) que marca lo de hoy y lo nuestro. La Liga Podio tiene su cinta azul propia, y el peligro y el error se avisan con la antena a rayas rojas y blancas, no con un texto rojo que se pierde en el parquet. Cada sección tiene el color de su línea, como cada deporte en un suelo compartido, y ese color solo aparece en dos sitios: la marca de navegación y la línea bajo la banda de cabecera.

Densidad media, mobile first, luz de pabellón: fondo claro con `color-scheme: light`, contraste AA en todo texto y objetivos táctiles de 44 px. Se rechaza el andamio de la categoría (saludo, tiles de métricas, paneles iguales, accesos rápidos en tarjeta), la estética de videojuego y el modo oscuro, que no se construye en esta ronda. La única coreografía es la línea pintada de la sección activa deslizándose por la navegación; todo lo demás cambia de estado en 150 ms sin moverse.

**Key Characteristics:**

- Contenido entre líneas pintadas (6 px) y reglas de cinta (2 px), nunca dentro de tarjetas.
- Una sola familia tipográfica, Big Shoulders; Stencil reservada a los números de cancha.
- Vinilo negro con letras del club para la acción principal y el estado seleccionado; cinta naranja para lo de hoy y lo nuestro.
- Profundidad por contornos pintados con `--paint`, no por sombras; solo los diálogos flotan.
- Marca del club como capa de tokens (escudo, nombre, `club`, `tape`) sobre una estructura reutilizable.
- Un solo movimiento orquestado: la línea de la sección activa en la navegación (200 ms).
- Ningún estado depende solo del color: letra V/D, chip con texto, cinta más rótulo.

## Colors

Parquet cálido y pintura blanca como estructura, vinilo negro para leer, y el club como dos acentos contados: el dorado sobre negro y la cinta naranja.

### Primary
- **Vinilo negro** (`ink`): el color del texto principal, los rótulos, la acción primaria, el estado seleccionado (pestaña, filtro, video activo, victoria) y el escudo sin imagen. Es el negro cálido de un vinilo recortado, no un negro puro. También es el color del foco visible (contorno de 2 px, separado 2 px) y de la línea de sección de Flyers.
- **Letras del club** (`club`): solo existe sobre vinilo negro. Es el color de las letras del botón primario, de las pestañas y filtros seleccionados, de la letra V de una victoria y de las iniciales en el escudo de respaldo. Contraste 9,7:1 sobre `ink`. Nunca como fondo, nunca como texto sobre el parquet.
- **Cinta del club** (`tape`): la cinta naranja señala lo que hay que mirar: el chip «Hoy», la cinta sobre el set ganado en las marcas de parciales, la derrota en el último resultado, el contorno destacado de un rectángulo pintado (`shadow-tape-club`), la selección de texto y la línea de sección de Partidos. Texto `ink` encima (6,7:1).

### Secondary
- **Cinta Podio** (`podio`): la Liga Podio trae su propia cinta azul: chips «Liga Podio» y «CourtTrack» (texto blanco, 5:1), línea superior de la actividad Podio en el carrusel y línea opcional de una zona. Distingue lo que viene de la liga de lo que carga el equipo.
- **Bruma Podio** (`podio-mist`): el fondo circular tras el logo de Podio en el carrusel de actividades. Solo eso.

### Tertiary
- **Antena** (`antenna`): las rayas rojas y blancas de la antena de la red (`bg-antenna-stripes`, 135°, tramos de 10 px con `line`) coronan lo que avisa de un error: `ErrorState`, `FormError`, el borde de un campo inválido, el botón de borrar (`danger`, texto blanco 5,2:1) y la línea de sección de Alineación.
- **Antena profunda** (`antenna-deep`): el texto de error sobre el suelo y sobre superficies blancas (4,8:1 sobre `floor`); el icono de aviso. Se usa porque `antenna` no llega a AA como texto pequeño sobre el parquet.
- **Línea verde** (`line-green`): la línea de sección de Actividades, y solo eso. Texto blanco 5:1 si alguna vez se necesita.

### Neutral
- **Parquet** (`floor`): el suelo de toda la página, con la veta de `bg-planks` encima (juntas de tablón al 5 % de negro y bandas de luz al 4,5 % de blanco). Fondo del `html` y del `body`.
- **Zona libre** (`floor-deep`): el pasillo lateral de navegación en escritorio, la barra inferior en móvil, el fondo del hueco de escudos en las portadas (al 60 %) y el desplegable del punto a punto (al 40 %). Un tono más oscuro, como la zona libre alrededor de la cancha.
- **Junta** (`floor-seam`): la junta entre tablones y los estados pulsados; también la línea bajo la banda de cabecera de Inicio, donde una línea blanca sobre banda blanca no se vería.
- **Pintura de línea** (`line`): el blanco roto de las líneas pintadas (6 px), de la banda de la red (cabecera), de los diálogos, de los campos de formulario, de las cintas neutras y de los rellenos translúcidos (25 %–80 %) de rectángulos y filas en hover. Es el `--paint` por defecto de los contornos.
- **Vinilo suave** (`ink-soft`): el texto secundario (6:1 sobre `floor`, 7,8:1 sobre `line`): rótulos pequeños, metadatos, el guion del marcador, el set perdido, el botón fantasma en reposo, el color de la barra de desplazamiento.

### Named Rules
**La regla de la capa del club.** Lo único del club es el escudo, el nombre y dos tokens: `club` y `tape`. Todo lo demás (`floor`, `line`, `ink`, tipografía, composición) es estructura que otro club heredaría cambiando esa capa. Un color nuevo que solo tenga sentido para los Coyotes no entra en el sistema.

**La regla del vinilo negro.** `ink` con letras `club` está reservado a la acción principal y al estado seleccionado: un botón primario por vista, la pestaña o el filtro marcados, el video que suena, la victoria. Si aparece dos veces sin motivo, uno de los dos deja de ser principal.

**La regla de la cinta.** La cinta naranja marca, no decora: hoy, el set ganado, la derrota que hay que revisar, el rectángulo destacado. Nunca como fondo de página, texto corriente ni relleno de botón.

**La regla del color de sección.** El color de cada sección (Inicio `line`, Actividades `line-green`, Partidos `tape`, Alineación `antenna`, Flyers `ink`) aparece exactamente en dos sitios: la marca de navegación y la línea bajo la banda de cabecera. En Inicio la línea bajo la banda es `floor-seam` porque `line` sobre la banda blanca es invisible; la marca del nav sigue siendo blanca.

## Typography

**Display Font:** Big Shoulders Stencil (con Big Shoulders y Arial Narrow de respaldo)
**Body Font:** Big Shoulders (con Arial Narrow y Roboto Condensed de respaldo)
**Label/Mono Font:** la misma Big Shoulders, en 700 mayúsculas con tracking; no hay monoespaciada, los números son tabulares (`font-variant-numeric: tabular-nums` en el `body`).

**Character:** Una sola familia condensada de vinilo, con eje óptico (opsz 10–72) y pesos 400–900, cargada de Google Fonts junto a Inter y Teko, que la web pública y los lienzos siguen usando. Big Shoulders lee como letras recortadas y pegadas al suelo; su Stencil son los números pintados con plantilla en la cancha. La jerarquía se hace por contraste de escala y peso sobre una línea base estricta (`leading-none` en todo lo grande), no por cambiar de familia. Todo lo que es rótulo va en mayúsculas.

### Hierarchy
- **Display** (900, 4.5rem–7.5rem, line-height 1, Stencil, mayúsculas): los números de cancha a escala monumental. La fecha del próximo partido (4.5rem en móvil, 5.5rem desde 640 px) con la hora al lado en 700 y `ink-soft` (2.75rem/3.25rem); el marcador de sets del último resultado (5rem/6rem); el marcador del detalle de partido (4.5rem, 6rem, 7.5rem desde 768 px). El guion entre cifras siempre en `ink-soft`.
- **Headline** (800, 2.75rem en móvil y 3.75rem desde 768 px, line-height 0.9, mayúsculas): el título de la banda de cabecera (`h1`). La fecha de hoy en Inicio se escribe aquí como número de cancha, pero en Big Shoulders normal.
- **Title** (800, 1.5rem en móvil y 1.75rem en escritorio, line-height 1, mayúsculas): el rótulo de zona (`h2`), pegado bajo su línea pintada. El título de un diálogo usa el mismo peso a 1.875rem; los títulos de artículo (actividad destacada, título de partido en fila) a 1.875rem–2.25rem; las secciones internas de un diálogo a 1.5rem; el mes de una lista a 1.25rem en `ink-soft`.
- **Mark** (900, 1.5rem–2.25rem, line-height 1, Stencil): los parciales como marcas sobre la línea lateral (1.5rem/1.875rem en Inicio, 1.875rem/2.25rem en el detalle), el marcador de las portadas (2.25rem/3rem) y el resultado en cada fila de la lista (1.875rem).
- **Body** (400, 1rem, line-height 1.5): descripciones, metadatos y campos de formulario (1rem en móvil para que iOS no amplíe; 0.9375rem en escritorio). Los nombres de fila van en 700 a 1.125rem; los metadatos de fila a 0.875rem en `ink-soft`.
- **Action** (700, 0.9375rem, tracking 0.025em, mayúsculas): botones, pestañas, filtros, enlaces «ver más» (0.875rem) y navegación en escritorio (1rem). Los rótulos secundarios de la cabecera y los enlaces de vuelta comparten este trato a 0.875rem.
- **Label** (700, 0.75rem, tracking 0.05em, mayúsculas): cintas (chips), rótulos de dato (`dt`), el día de la semana bajo la fecha de una fila, «Set n» bajo cada marca (0.625rem), la navegación en móvil, «Temporada» (tracking 0.12em).

### Named Rules
**La regla de la plantilla.** Stencil se usa solo para los números de cancha: fechas abreviadas, horas, marcadores y parciales. Ningún título, rótulo ni párrafo va en Stencil; ningún número de cancha va sin ella.

**La regla de la familia única.** Todo el dashboard es Big Shoulders. Inter y Teko están cargadas porque la web pública y los lienzos de Alineación y Flyers las siguen leyendo; en el marco del dashboard no aparecen.

**La regla del rótulo.** Lo que se toca o etiqueta va en mayúsculas 700 con tracking (0.025em en acciones, 0.05em en cintas y rótulos de dato). Lo que se lee (descripciones, metadatos) va en caja normal y peso 400.

## Layout

La pista se mira desde el banquillo. En móvil (< 768 px) la página es una columna con márgenes de 16 px y 112 px de aire abajo para la barra inferior fija (zona libre `floor-deep`, línea pintada de 6 px arriba, `env(safe-area-inset-bottom)`), con cinco enlaces de 56 px de alto repartidos a partes iguales, icono de 24 px sobre rótulo. Desde 768 px la pista se tumba: una retícula de dos columnas `14rem 1fr` en la que el pasillo lateral izquierdo (zona libre, `sticky`, 100 dvh, línea pintada de 6 px en su borde derecho) lleva el escudo de 44 px, el nombre del club a 1.75rem 800 con tracking 0.06em y la navegación en columna con enlaces de 44 px; el contenido pasa a márgenes de 32 px y 40 px de aire abajo.

La banda de la red es la cabecera de cada página: una franja `line` que sangra hasta los bordes (`-mx-4` / `-mx-8`), con el escudo pequeño y el nombre del club solo en móvil (donde no hay pasillo), el título a la izquierda y las acciones a la derecha (en móvil bajan debajo, a ancho completo). Debajo, la línea de 6 px del color de la sección y 24 px / 32 px de margen antes del contenido.

Las proporciones de la cancha gobiernan las columnas. Inicio en escritorio es `1fr 6px 1fr`: la línea central (blanca, 6 px, a toda altura) parte la página en agenda (zona de ataque: próximo partido) y resultados (último resultado), con 32 px entre columnas y 40 px entre filas; la tira de acciones y la línea de temporada cruzan las tres columnas. Los datos del detalle de partido van en 1, 2 y 4 columnas (640 px, 1024 px); los videos, en `1fr 20rem` desde 1024 px; los parciales, en 4–5 columnas iguales en móvil y en fila con 24 px entre marcas desde 640 px.

Los bloques de página son zonas: línea pintada de 6 px arriba, 8 px, fila de rótulo de 44 px de alto con el enlace «ver más» a la derecha, 12 px y el contenido. Entre zonas, 32 px en móvil y 40 px en escritorio. Dentro de una zona, las listas son filas de cinta: rejilla `3.5rem 1fr auto` (fecha, contenido, marca), 56 px o 64 px de alto mínimo, 12 px entre columnas, 4 px de sangría lateral, separadas por reglas de cinta de 2 px (`tape-rule` arriba de la lista, `divide-tape` entre filas). El ritmo interno es de 4 px: 8 px en línea entre chips e iconos, 12 px entre elementos apilados, 20 px entre bloques de una zona.

Puntos de ruptura: 640 px (`sm`, las cifras crecen y los parciales se ponen en fila), 768 px (`md`, aparece el pasillo y la retícula de la pista), 1024 px (`lg`, videos y datos a cuatro columnas). La variante `wide` (≥ 48rem o pantalla apaisada) es de la cancha de Alineación, que pone el banco al lado.

### Named Rules
**La regla de la línea.** Los bloques se separan con líneas pintadas de 6 px y las filas con reglas de cinta de 2 px; nunca con cajas, bordes cerrados ni cambios de fondo. Si hace falta agrupar, se pinta una línea arriba y se pone el rótulo debajo.

**La regla del pulgar.** Todo objetivo mide 44 px como mínimo (56–64 px en filas); la acción primaria de Inicio queda al alcance del pulgar sobre la barra inferior. Los tamaños `sm` e `icon` de los botones solo bajan a 40 px desde 768 px.

## Elevation & Depth

No hay sombras de profundidad. El suelo es plano y todo se apoya en él; lo que necesita borde lo tiene pintado: un contorno de 2 px (`shadow-tape`) que lee la variable de pintura `--paint`, blanca (`line`) sobre el parquet y vinilo al 35 % (`color-mix(in oklab, ink 35%, transparent)`) dentro de las superficies blancas marcadas con `on-line` (la banda de cabecera y los diálogos), donde una línea blanca no se vería. Al pasar el ratón el contorno pasa a `--paint-hover` (vinilo negro pleno) y las filas se rellenan de `line` al 50 %. El cambio de estado se expresa con relleno y contorno, no con elevación: pulsado, escala 0.96; seleccionado, vinilo negro.

Lo único que flota sobre el suelo es lo que se levanta de él: los diálogos (`shadow-lift-floor`, sombra cálida de la propia madera, con fondo `ink` al 70 %) y, en la cancha oscura de Alineación, las fichas levantadas.

### Shadow Vocabulary
- **Contorno pintado** (`box-shadow: 0 0 0 2px var(--paint)`): rectángulos pintados, botón secundario, filtros en reposo, portadas, reproductor, estado de error, tira de pestañas. Blanco sobre el suelo, vinilo al 35 % en superficies `on-line`.
- **Contorno al pasar** (`box-shadow: 0 0 0 2px var(--paint-hover)`): la misma línea en vinilo negro cuando el puntero está encima de una portada.
- **Contorno de cinta** (`box-shadow: 0 0 0 2px var(--color-tape)`): el rectángulo destacado (columna de hoy, elemento activo). Su versión fuerte es de 3 px.
- **Levantado del suelo** (`box-shadow: 0 14px 32px rgb(58 34 6 / 0.35), 0 2px 6px rgb(58 34 6 / 0.2)`): solo diálogos y fichas levantadas. Nunca en reposo sobre la página.

### Named Rules
**La regla del contorno pintado.** Un borde es pintura: 2 px de `--paint` por `box-shadow`, sin `border` salvo en los campos de formulario (2 px de `ink` al 60 %) y en el rectángulo discontinuo del estado vacío. Nada proyecta sombra en reposo; solo lo que se levanta del suelo (diálogos) lleva `shadow-lift-floor`.

## Shapes

Todo es rectángulo apoyado sobre una línea recta. Las esquinas son casi vivas: 2 px en cintas, marcas de resultado, el cuadro de número de video y las imágenes de portada; 4 px en botones, campos, pestañas, filtros, portadas, reproductor y la marca del nav en móvil (solo redondeada por abajo); 6 px en rectángulos pintados, diálogos, estado vacío y estado de error. Los círculos se reservan para lo que es redondo de verdad: escudos (24–112 px), el punto de color de cada posición (10 px) y el punto del anotador en el punto a punto (8 px). Las líneas son las formas estructurales: 6 px sólidas en `line` (o el color de sección o Podio) arriba de cada zona; 2 px de `ink` al 18 % como regla de cinta; 4 px de `tape` sobre la marca del set ganado, pegada a la regla (`-mt-0.5`). El estado vacío es un rectángulo de cinta discontinua (2 px `dashed`, `ink` al 30 %); el error lleva la antena: una franja de rayas a 135° (10 px rojo, 10 px blanco) de 10 px de alto en el borde superior (6 px en errores de formulario). Las rayas solo existen como juntas del parquet (`bg-planks`) y como antena; no hay degradados en el dashboard.

## Components

Rótulos de vinilo pegados al suelo: nítidos, planos, en mayúsculas, que responden al toque con relleno y una escala mínima, nunca con sombra.

### Buttons
- **Shape:** rectángulo de esquina casi viva (4 px), 44 px de alto mínimo en todos los tamaños (`sm` e `icon` bajan a 40 px desde 768 px), texto 700 mayúsculas 0.9375rem con tracking 0.025em, icono de 16–20 px a 8 px del texto; los que llevan icono a la izquierda recortan la sangría izquierda a 14 px.
- **Primary:** vinilo negro con las letras del club (`ink` / `club`), relleno 8 px 16 px. Uno por vista: «Cargar partido» en Inicio, «Continuar» en un diálogo.
- **Hover / Focus:** el vinilo baja al 88 %; pulsado, escala 0.96 (salvo `static`, para controles que se pulsan seguido); foco, contorno `ink` de 2 px separado 2 px; desactivado, 50 % de opacidad. Transición de 150 ms `ease-out` en color, fondo, contorno y escala.
- **Secondary (por defecto):** rectángulo pintado: `line` al 40 % de relleno, texto `ink`, contorno de 2 px `--paint`; al pasar, `line` al 80 %. **Ghost:** sin fondo, texto `ink-soft`; al pasar, `ink` al 8 % y texto `ink`. **Danger:** antena (`antenna`, texto blanco) para lo que borra datos; al pasar, 88 %. **Icon:** cuadrado de 44 px sin relleno (cerrar diálogo).

### Chips
- **Style:** cintas de suelo: rectángulo de 2 px de radio, texto 700 mayúsculas con tracking 0.05em, `sm` 0.75rem con relleno 2 px 6 px y `md` 0.875rem con 4 px 10 px; icono de 12–14 px dentro.
- **State:** `gold` vinilo negro con letras del club (victoria, video activo, lo principal); `orange` cinta del club, texto `ink` (Hoy, derrota); `podio` cinta azul, texto blanco (Liga Podio, CourtTrack); `silver` / `steel` cinta blanca con texto `ink` y `ash` / `rust` con texto `ink-soft` (neutros: número de videos, pendiente). Los nombres de tono se conservan de la paleta anterior; el material es el mismo. Los chips no se pulsan: los filtros son botones (ver Navigation).

### Cards / Containers
- **Corner Style:** no hay tarjetas. El bloque de página es la **Zona**: línea pintada de 6 px arriba (`line`, o `tape` / `podio` / `ink`), 8 px, rótulo `h2` de 44 px de alto con enlace «ver más» (0.875rem 700 mayúsculas, flecha que avanza 2 px al pasar) o controles a la derecha, 12 px y el contenido sobre el parquet.
- **Background:** el **rectángulo pintado** (`Card`, para listas y agrupaciones pequeñas, portadas de partido, tira de pestañas) es `line` al 25 %–40 % con contorno de 2 px `--paint` y 6 px de radio (4 px en portadas); destacado, contorno de cinta. La portada de partido lleva 12 px de relleno, chips arriba, la franja de escudos (16:7, `floor-deep` al 60 %) o la foto, el título a 1.125rem y el marcador en Stencil; al pasar el contorno pasa a vinilo y pulsada baja a 0.97.
- **Shadow Strategy:** ninguna en reposo (ver Elevation & Depth).
- **Border:** solo contornos pintados de 2 px; el estado vacío, 2 px discontinuos de `ink` al 30 %.
- **Internal Padding:** 12 px en portadas; las zonas no tienen relleno lateral, el contenido va al ras de la línea.

### Inputs / Fields
- **Style:** rectángulos pintados de blanco: fondo `line`, borde de 2 px `ink` al 60 %, 4 px de radio, 44 px de alto (40 px desde 768 px), 12 px de sangría, texto 1rem (0.9375rem en escritorio), marcador de posición `ink-soft` al 80 %; el cursor es `ink`. Etiqueta encima a 0.875rem 500 con «Opcional» en 0.75rem `ink-soft`; ayuda debajo a 0.75rem `ink-soft`.
- **Focus:** el borde pasa a `ink` pleno (también al pasar), sin anillo extra; transición de 150 ms.
- **Error / Disabled:** `aria-invalid` pinta el borde de `antenna` y el mensaje en 0.75rem 700 `antenna-deep`; el error general de un paso lleva la antena a rayas de 6 px sobre fondo `line`. Desactivado, 50 % de opacidad.

### Navigation
- **Style, typography, default/hover/active states, mobile treatment.** Zona libre `floor-deep` con línea pintada de 6 px hacia la pista. Cinco enlaces con icono de trazo (24 px en móvil, 20 px en escritorio; relleno cuando está activo) y rótulo en mayúsculas 700: 0.75rem en móvil, 1rem en escritorio. En reposo `ink` al 70 %; al pasar `ink` (y `ink` al 6 % de fondo en escritorio); activo `ink`. La **línea de sección activa** es el único movimiento orquestado: una barra de 6 px del color de la sección (`--nav-line`) que se desliza hasta el enlace activo en 200 ms con `cubic-bezier(0.2, 0, 0, 1)`, horizontal sobre el enlace en móvil (esquinas inferiores de 2 px) y vertical pegada al borde izquierdo del pasillo en escritorio; con `prefers-reduced-motion` salta sin transición.
- **Filtros:** los filtros (competición, posición) son rótulos pintados: botones de 44 px (40 px en escritorio) con `aria-pressed`, `line` al 40 % con contorno `--paint` en reposo y vinilo negro con letras del club marcados; el de competición añade una marca de verificación y el recuento en 0.75rem al 70 %. El de posición lleva el punto de 10 px del color de la posición y, dentro de la cancha oscura (`onBoard`), conserva la paleta del tablero. **Pestañas:** patrón ARIA completo; 44 px, 4 px de radio, `ink-soft` en reposo, vinilo negro con letras del club seleccionada, dentro de una tira pintada (`line` al 40 %, contorno, 6 px de radio, 4 px de relleno).

### Banda de la red (PageHeader)
Franja `line` de lado a lado con el título en vinilo negro (2.75rem / 3.75rem, 800, `leading 0.9`), descripción en `ink-soft` debajo (nunca encima), enlace de vuelta con chevrón en 0.875rem 700 `ink-soft`, y las acciones a la derecha (en móvil, debajo a ancho completo). Debajo, 6 px del color de la sección. Relleno 12 px 16 px 16 px en móvil, 24 px 32 px 20 px en escritorio. En móvil abre con el escudo de 28 px y el nombre del club a 0.875rem 800 con tracking 0.08em. Es `on-line`: los contornos que contiene se pintan en vinilo al 35 %.

### Diálogo (Modal)
`<dialog>` nativo: panel `line` de 6 px de radio, `calc(100% - 2rem)` de ancho hasta 32rem (48rem en `lg`), `shadow-lift-floor`, fondo `ink` al 70 %, máximo 85 dvh en columna: cabecera con título a 1.875rem 800 y, **debajo** del título, la nota `meta` (chip y texto 0.875rem `ink-soft`), botón de cerrar icónico; contenido desplazable con 20 px de relleno; pie con borde superior de 1 px `ink` al 15 % y acciones alineadas a la derecha. Entra y sale con fundido y 8 px de desplazamiento en 200 ms `ease-out`; con movimiento reducido, solo el fundido. Es `on-line`.

### Estados
- **Vacío:** rectángulo de cinta discontinua (2 px, `ink` al 30 %, 6 px de radio), 48 px 24 px de relleno, icono de 32 px en `ink-soft`, título 1.125rem 700 mayúsculas, descripción `ink-soft` de hasta 24rem, acción opcional.
- **Error:** fondo `line` con contorno pintado, antena a rayas de 10 px en el borde superior, icono de aviso en `antenna-deep`, título 1.125rem 700 mayúsculas, mensaje y botón «Reintentar» (secundario) cuyo icono gira mientras reintenta (quieto con movimiento reducido). `role="alert"`.
- **Carga:** manchas de cinta sin pintar (`ink` al 10 %, 4 px de radio) con pulso, reproduciendo la geometría de lo que llega (fila, cifra, escudo).

### Escudo (TeamLogo)
Círculo de 24, 36, 56, 64–112 (`xl`) o 48–64 px (`cover`), fondo `ink`, imagen recortada; sin logo o si falla, las iniciales (hasta 3) en 800 `club` sobre vinilo negro: el escudo es también un rótulo. Todas las imágenes del dashboard llevan un contorno interior de 1 px negro al 12 %.

### Marcas sobre la línea lateral (parciales)
Firma del sistema. Cada parcial es una marca apoyada sobre una regla de cinta: cifra en Stencil 900 (1.5rem–2.25rem), «Set n» debajo en 0.625rem 700 mayúsculas al 80 %, y encima, pegada a la regla, una cinta de 4 px: `tape` con texto `ink` en el set ganado, transparente con texto `ink-soft` en el perdido; el lector de pantalla oye quién ganó. Si el partido viene de CourtTrack, cada marca es un botón (44 px, `line` al 50 % al pasar, escala 0.96 pulsado) que abre la progresión y las estadísticas del set. Del mismo material son los **marcadores**: cifras en Stencil con el guion en `ink-soft`, y las **marcas de forma reciente**: cuadrados de 32 px con la letra V (vinilo negro y letras del club) o D (cinta blanca, texto `ink`) dentro de un objetivo de 44 px; la racha va escrita al lado.

### Filas de cinta y filas de dato
Las listas (actividades siguientes, partidos por mes, videos, plantel) son filas de 56–64 px sobre reglas de cinta: fecha en dos líneas (1.125rem 800 y día en 0.75rem 700 `ink-soft`), contenido con nombre 1.125rem 700 y metadatos 0.875rem `ink-soft`, y a la derecha la marca (chip, resultado en Stencil, cuadro de número de video de 36 px que pasa a vinilo negro con icono de reproducción cuando suena). Al pasar, `line` al 50 %; los inactivos, al 60 % y en gris. Un **dato** (`Fact`, y el `dl` del detalle de partido) es una fila sobre regla de cinta con el rótulo a la izquierda (0.6875rem–0.75rem 700 mayúsculas `ink-soft`) y el valor a la derecha (0.875rem–1rem 700 `ink`); la línea de temporada de Inicio es la misma idea en una sola línea: cifra 1.5rem 900 `ink` seguida de su rótulo 0.75rem 700 `ink-soft`, todo enlazado a Partidos.

## Do's and Don'ts

Guardarraíles del suelo del pabellón, sacados de lo construido en el dashboard.

### Do:
- **Do** apoyar cada bloque de página sobre una línea pintada de 6 px con su rótulo `h2` debajo (`Zone`, `line-top`), y separar las filas con reglas de cinta de 2 px (`tape-rule`, `divide-tape`).
- **Do** escribir los números de cancha (fechas abreviadas, horas, marcadores, parciales) en Big Shoulders Stencil 900 y todo lo demás en Big Shoulders; el guion de un marcador va en `ink-soft`.
- **Do** poner rótulos, botones, cintas, pestañas y navegación en mayúsculas 700 con tracking (0.025em en acciones, 0.05em en cintas y rótulos de dato).
- **Do** reservar el vinilo negro con letras del club (`ink` / `club`) a la acción principal y al estado seleccionado, y la cinta naranja (`tape`) a hoy, el set ganado, la derrota y el rectángulo destacado.
- **Do** pintar los contornos con `shadow-tape` (2 px de `--paint`) y marcar con `on-line` toda superficie blanca (banda de cabecera, diálogos) para que el contorno pase a vinilo al 35 %.
- **Do** acompañar cada estado con texto o forma además del color: letra V/D, chip con palabra, cinta más rótulo «Set n», `aria-pressed` en filtros, `aria-current` en el video activo.
- **Do** mantener 44 px de objetivo (56–64 px en filas), foco visible de 2 px `ink` separado 2 px, y una alternativa `motion-reduce` en cada transición (la línea del nav salta, el diálogo solo funde, los iconos de carga no giran).
- **Do** tratar el escudo, el nombre del club, `club` y `tape` como la capa del club; todo lo nuevo que no sea de esa capa debe funcionar con otro escudo y otros dos colores.
- **Do** avisar de un error con la antena a rayas (`bg-antenna-stripes`) en el borde superior y el texto en `antenna-deep`; usar `danger` (antena) solo en acciones que borran.

### Don't:
- **Don't** usar tarjetas: ni rellenos opacos, ni sombras en reposo, ni cajas con borde cerrado. `Card` es un rectángulo pintado (2 px de contorno, `line` al 25 %) para listas pequeñas y portadas; los bloques de página son zonas sobre línea.
- **Don't** poner kickers ni eyebrows encima de un título: la nota (`meta`, descripción, procedencia) va siempre debajo, como en `Modal` y `PageHeader`.
- **Don't** construir tiles de métricas ni paneles iguales: un dato es una fila sobre regla de cinta (`Fact`), un parcial es una marca sobre la línea lateral y los números de temporada caben en una sola línea de fondo.
- **Don't** añadir un segundo movimiento orquestado: solo la línea de la sección activa se desliza (200 ms). Nada de entradas escalonadas ni apariciones en cascada (`animate-rise` pertenece a la cancha oscura, no al dashboard); las transiciones de estado son de 150 ms y no desplazan nada.
- **Don't** hacer que un estado dependa solo del color: sin V/D no hay victoria ni derrota, sin cinta más rótulo no hay set ganado, sin texto no hay chip.
- **Don't** usar rayas ni degradados como decoración: las rayas son solo las juntas del parquet (`bg-planks`) y la antena de error; `bg-podio-fade` y `bg-ember-fade` son de la web pública.
- **Don't** usar los tokens `coyote-*`, `podio-mist` fuera del logo de Podio, ni Teko o Inter dentro del marco del dashboard; solo la cancha de Alineación (`PositionFilter` con `onBoard`, `LineupBoard`, `FullscreenDialog`) y el lienzo de Flyers conservan la paleta oscura, porque los lienzos leen los tokens `@theme static` en tiempo de ejecución.
- **Don't** pintar `club` como fondo ni como texto sobre el parquet: solo existe como letras sobre `ink`. `tape` no es color de texto.
- **Don't** construir modo oscuro ni bajar el contraste del suelo: el dashboard es `color-scheme: light`, y el tema de noche queda sin resolver en esta ronda.
- **Don't** proyectar sombra sobre la página: `shadow-lift-floor` es solo para diálogos y fichas levantadas.
