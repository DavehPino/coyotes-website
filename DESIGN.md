---
name: Coyotes Volley · Dashboard
description: "La hoja de rotaciones del entrenador: papel cuadriculado, reglas de tinta y celdas rectas, con el club como una capa de tres variables."
colors:
  club-primary: "#161412"
  club-accent: "#f5b014"
  club-accent-2: "#f07c13"
  paper: "#eeece7"
  paper-deep: "#dfdcd4"
  paper-seam: "#b7b2a7"
  surface: "#ffffff"
  ink: "#161412"
  ink-soft: "#57524a"
  on-rail: "#f4f1ea"
  danger: "#c8362b"
  danger-deep: "#9c2419"
  section-green: "#2f7d4e"
  section-violet: "#5a46c8"
  rail-green: "#4fb87a"
  rail-violet: "#9a86ff"
  podio: "#1f6f96"
  podio-mist: "#d4eef9"
typography:
  figures-display:
    fontFamily: "Sofia Sans Extra Condensed, Sofia Sans, Arial Narrow, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.01em"
  figures-mark:
    fontFamily: "Sofia Sans Extra Condensed, Sofia Sans, Arial Narrow, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Sofia Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "normal"
  title:
    fontFamily: "Sofia Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Sofia Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontFeature: "tnum"
  action:
    fontFamily: "Sofia Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.03em"
  label:
    fontFamily: "Sofia Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.333
    letterSpacing: "0.05em"
rounded:
  sm: "0px"
  md: "2px"
  full: "9999px"
spacing:
  hairline: "2px"
  edge: "3px"
  line: "6px"
  inline: "8px"
  stack: "12px"
  gutter: "16px"
  grid: "24px"
  zone: "32px"
  gutter-md: "32px"
  zone-md: "40px"
  touch: "44px"
  row: "56px"
  row-lg: "64px"
  rail: "224px"
components:
  button-primary:
    backgroundColor: "{colors.club-primary}"
    textColor: "{colors.club-accent}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, var(--color-key) 84%, var(--color-on-key))"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "color-mix(in oklab, var(--color-surface) 90%, var(--color-ink))"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "color-mix(in oklab, var(--color-ink) 8%, transparent)"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "color-mix(in oklab, var(--color-danger) 88%, black)"
  button-disabled:
    backgroundColor: "color-mix(in oklab, var(--color-ink) 9%, transparent)"
    textColor: "color-mix(in oklab, var(--color-ink) 45%, transparent)"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0"
    size: "44px"
  cue:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "0 12px 0 14px"
    height: "40px"
  chip-key:
    backgroundColor: "{colors.club-primary}"
    textColor: "{colors.club-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  chip-accent:
    backgroundColor: "{colors.club-accent-2}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  chip-neutral:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  chip-neutral-soft:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  chip-podio:
    backgroundColor: "{colors.podio}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px 6px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  nav-rail:
    backgroundColor: "{colors.club-primary}"
    textColor: "{colors.on-rail}"
    width: "224px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "rgb(244 241 234 / 0.65)"
    typography: "{typography.label}"
    padding: "8px 4px"
    height: "56px"
  nav-link-active:
    textColor: "{colors.on-rail}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.action}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  tab-selected:
    backgroundColor: "{colors.club-primary}"
    textColor: "{colors.club-accent}"
  option-cell:
    backgroundColor: "rgb(255 255 255 / 0.4)"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "44px"
  option-cell-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  page-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    padding: "12px 16px 16px"
  panel:
    backgroundColor: "rgb(255 255 255 / 0.25)"
    rounded: "{rounded.md}"
  modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0"
    width: "calc(100% - 2rem)"
  action-menu:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px"
    width: "240px"
  empty-state:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "48px 24px"
---

# Design System: Coyotes Volley · Dashboard

<!-- Ámbito: el dashboard interno (`html[data-app="dashboard"]`). La web pública (`src/public/*`) sigue con los tokens oscuros `coyote-*`, Teko e Inter y no forma parte de este sistema. -->

## Overview

**Creative North Star: "La hoja de rotaciones"**

El dashboard es la hoja cuadriculada donde el entrenador dibuja las rotaciones: papel neutro cálido con una cuadrícula de 24 px apenas marcada, reglas de tinta gruesas que reparten la página en zonas, filetes finos entre filas y celdas de esquina recta. El contenido se apoya en la hoja, nunca dentro de una tarjeta: cada bloque se abre con su regla de 6 px y su rótulo pegado debajo. Hay una sola familia tipográfica (Sofia Sans) y su corte Extra Condensed se reserva para las cifras que se leen de lejos: fechas, horas, marcadores y parciales. Los botones son teclas con cuerpo (relleno sólido, contorno de tinta y un canto desplazado que desaparece al pulsar), porque el usuario pidió de forma explícita que los botones se sintieran botones.

Es una herramienta con piel de club, y esa costura está en el código: lo que es del club son tres variables (`--club-primary`, `--club-accent`, `--club-accent-2`) más el escudo y el nombre; el papel, la tinta, las reglas, la tipografía y los botones son de la herramienta y no cambian de un club a otro. Con Coyotes, el primario es el negro del escudo (pasillo de navegación y tecla de acción), el acento es el dorado (letras sobre la tecla) y el segundo acento es el naranja (lo de hoy y lo nuestro en el marcador). La Liga Podio conserva su azul propio y el rojo queda solo para borrar y avisar de errores.

Densidad media, mobile first, fondo claro (`color-scheme: light`; no hay modo oscuro construido), contraste AA en todo texto y objetivos táctiles de 44 px. Se rechaza el andamio de la categoría: saludo, tiles de métricas, paneles iguales, accesos rápidos en tarjeta. La única coreografía es la regla de la sección activa deslizándose por la navegación; todo lo demás cambia de estado en 120–150 ms.

**Key Characteristics:**

- Zonas abiertas por reglas de tinta de 6 px y filas separadas por filetes de 2 px, nunca tarjetas.
- El club es una capa de tres variables; papel, tinta, reglas, tipografía y botones son de la herramienta.
- Una sola familia (Sofia Sans); cifras condensadas solo para fechas, horas, marcadores y parciales.
- Botones en tres niveles: tecla del club, celda blanca con canto, fantasma con contorno; gris plano solo para lo desactivado.
- Todo bloque que es entero un enlace o un botón lleva su señal visible (`Cue`, chevrón, «Ver ›»); lo que no se pulsa no lo parece.
- Un solo movimiento orquestado: la regla de la sección activa (200 ms), con alternativa `motion-reduce`.
- Ningún estado depende solo del color: chip con palabra, letra V/D, `aria-pressed`, contorno más negrita.

## Colors

Papel neutro cálido y tinta casi negra como estructura de la herramienta; encima, tres colores del club contados y con un papel fijo cada uno.

### Primary
- **Primario del club** (`club-primary`, alias `key` y `rail`): con Coyotes, el negro del escudo. Es el pasillo de navegación (lateral en escritorio, barra inferior en móvil), la tecla de acción principal y lo marcado: pestaña seleccionada, filtro activo, conmutador encendido, chip de victoria, video que suena, escudo de respaldo con iniciales.
- **Acento del club** (`club-accent`, alias `on-key` y `club`): con Coyotes, el dorado del contorno del escudo. Vive solo como letras e iconos sobre la tecla del club (9,7:1) y como regla de sección de Flyers. No aparece como fondo ni como texto sobre el papel.
- **Segundo acento del club** (`club-accent-2`, alias `accent`, con `on-accent` en tinta, 6,7:1): con Coyotes, el naranja del pelaje. Marca lo de hoy (chip «Hoy») y lo nuestro en el marcador: la regla de 4 px sobre el set ganado y nuestra serie en la gráfica de progresión. Es también la regla de sección de Partidos y el color de la selección de texto.

### Secondary
- **Azul Podio** (`podio`): la Liga Podio trae su color: chips «Liga Podio» y «CourtTrack» (texto blanco), regla superior de una actividad Podio en el carrusel y regla opcional de una zona. Distingue lo que viene de la liga de lo que carga el equipo. Es un token `@theme static` anterior a este mundo y se conserva por contrato.
- **Bruma Podio** (`podio-mist`): el círculo tras el logo de Podio en el carrusel de actividades. Solo eso.

### Tertiary
- **Rojo de borrar** (`danger`): botón de eliminar (texto blanco, 5,2:1), regla roja de 4 px sobre `ErrorState` y `FormError`, borde de un campo inválido. Nunca es color de sección.
- **Rojo profundo** (`danger-deep`): texto de error e icono de aviso (6,3:1 sobre `paper`), y el texto de una opción destructiva en el menú de acciones.
- **Verde de sección** (`section-green`) y **violeta de sección** (`section-violet`): la regla bajo la banda de cabecera de Actividades y de Alineación. Sobre el pasillo negro usan su versión clara (`rail-green`, `rail-violet`) para que la marca se vea.

### Neutral
- **Papel** (`paper`): la hoja. Fondo del `html` y del `body` con la cuadrícula de 24 px encima (`bg-sheet`: líneas de 1 px de tinta al 5,5 %). Es un gris con un punto de calor para convivir con el negro y el dorado del club.
- **Papel hundido** (`paper-deep`): recuadros hundidos: video externo sin reproductor, celdas de liga, avisos.
- **Costura** (`paper-seam`): la regla discreta bajo la banda de cabecera de Inicio.
- **Superficie** (`surface`): blanco de la banda de cabecera, diálogos, menú de acciones, campos y teclas secundarias; al 25–50 % como relleno de recuadros y filas en hover.
- **Tinta** (`ink`, alias `line` y `scrim`): texto principal (15,6:1 sobre `paper`), reglas de 6 px, contornos plenos, foco visible y velo tras los diálogos (al 70 %). Es de la herramienta; con Coyotes coincide en valor con el primario del club, pero son tokens distintos y otro club los separará.
- **Tinta suave** (`ink-soft`): texto secundario (6,4:1 sobre `paper`, 7,6:1 sobre `surface`): metadatos, rótulos de dato, guion del marcador, set perdido, barra de desplazamiento.
- **Texto del pasillo** (`on-rail`): texto e iconos sobre el pasillo de navegación (16:1); al 65 % en reposo. También es la marca de navegación de Inicio.

### Named Rules
**La regla de la capa del club.** Del club son solo tres variables (`--club-primary`, `--club-accent`, `--club-accent-2`), el escudo y el nombre; se redefinen en `html[data-app]` y todo lo demás las deriva (`key`, `on-key`, `club`, `accent`, `rail`). Papel, tinta, reglas, tipografía, radios y botones son de la herramienta. Un color nuevo que solo tenga sentido para un club no entra en el sistema, y ningún componente lee un hex del club directamente.

**La regla de la tecla.** La tecla del club (primario con letras del acento) está reservada a la acción principal de la vista y a lo marcado. Si aparece dos veces como acción en la misma vista, una de las dos deja de ser principal.

**La regla del segundo acento.** El segundo acento señala lo de hoy y lo nuestro en el marcador; no decora, no rellena botones y no es color de texto. El resultado de un partido nunca lo usa: la victoria es un chip de tecla del club y la derrota un chip neutro con contorno de tinta.

**La regla del rojo.** `danger` es solo para borrar y para errores. Por eso Alineación tiene regla violeta y no roja. Los colores por posición (`--color-pos-*`) son datos de la cancha, no del sistema, y siguen como están.

**La regla del color de sección.** Cada sección tiene un color de regla que aparece en dos sitios: la marca de navegación (`line`) y la regla bajo la banda de cabecera (`band`). Son dos valores cuando el contraste lo exige: Inicio marca en `on-rail` sobre el pasillo y usa `paper-seam` bajo la banda blanca; Actividades y Alineación usan `rail-green` y `rail-violet` sobre el pasillo negro y `section-green` y `section-violet` bajo la banda. Partidos (`accent`) y Flyers (`club`) usan el mismo valor en ambos.

## Typography

**Display Font:** Sofia Sans Extra Condensed (con Sofia Sans y Arial Narrow de respaldo), pesos 700–900
**Body Font:** Sofia Sans (con Segoe UI y system-ui de respaldo), pesos 400–900
**Label/Mono Font:** la misma Sofia Sans en 700 mayúsculas con tracking; no hay monoespaciada, los números son tabulares en todo el `body`.

**Character:** Una sola familia con dos anchos. Sofia Sans lleva títulos, rótulos, botones y lectura; su corte Extra Condensed hace de rotulador grueso para las cifras que se leen desde el banquillo. La jerarquía sale de la escala y el peso sobre interlineado 1, no de cambiar de familia. Se cargan desde Google Fonts junto a Inter y Teko, que siguen en uso en la web pública y en los lienzos de Alineación y Flyers.

### Hierarchy
- **Figures display** (900, 4.5rem–7.5rem, line-height 1, tracking -0.01em, mayúsculas): la fecha del próximo partido (4.5rem; 5.5rem desde 640 px) con la hora al lado en 700 y `ink-soft` (2.75rem / 3.25rem); el marcador del último resultado (5rem / 6rem); el marcador del detalle (4.5rem, 6rem, 7.5rem desde 768 px); el de las portadas (3.75rem / 4.5rem); la fecha de una actividad del carrusel (3.5rem / 4rem). El guion entre cifras va siempre en `ink-soft`.
- **Figures mark** (900, 1.5rem–2.25rem, line-height 1): parciales (1.5rem / 1.875rem en Inicio, 1.875rem / 2.25rem en el detalle), resultado de cada fila de la lista (1.875rem), parcial en las pestañas de set (1.5rem).
- **Headline** (800, 2.75rem en móvil y 3.75rem desde 768 px, line-height 0.9, mayúsculas): el título de la banda de cabecera (`h1`). En Inicio la banda es compacta (1.5rem / 1.875rem) porque la cifra grande es la del próximo partido.
- **Title** (800, 1.5rem en móvil y 1.75rem en escritorio, line-height 1, mayúsculas): el rótulo de zona (`h2`), bajo su regla. Con el mismo peso: título de diálogo (1.875rem), títulos de artículo (1.875rem–2.25rem), secciones internas de un diálogo (1.5rem), mes de una lista (1.25rem en `ink-soft`), título de portada (1.125rem / 1.25rem).
- **Body** (400, 1rem, line-height 1.5): descripciones, metadatos y campos (1rem en móvil para que iOS no amplíe; 0.9375rem en escritorio). Nombres de fila en 700 a 1.125rem; metadatos de fila a 0.875rem en `ink-soft`; etiquetas de campo a 0.875rem 500.
- **Action** (700, 0.9375rem, tracking 0.03em, mayúsculas): botones. El mismo trato a 0.875rem en `Cue`, enlaces de zona, pestañas, filtros y enlace de vuelta (tracking 0.025em), y a 1rem en la navegación de escritorio.
- **Label** (700, 0.75rem, tracking 0.05em, mayúsculas): chips, rótulos de dato (`dt`), día de la semana bajo la fecha de una fila, navegación en móvil (tracking 0.025em), «Set n» bajo cada parcial (0.6875rem), «Temporada» (tracking 0.12em).

### Named Rules
**La regla de la familia única.** Todo el marco del dashboard es Sofia Sans. Inter y Teko están cargadas para la web pública y los lienzos; en el marco no aparecen.

**La regla de las cifras.** Extra Condensed solo para fechas abreviadas, horas, marcadores y parciales. Ningún título, rótulo ni párrafo va condensado. Los recuentos (números de temporada, número de video, dorsal) van en Sofia Sans 800–900.

**La regla del título sin antetítulo.** No hay kicker ni eyebrow encima de un título. La nota (paso del formulario, procedencia, descripción, tipo de actividad) va debajo: `meta` en `Modal`, `description` en `PageHeader`.

## Layout

En móvil (< 768 px) la página es una columna con márgenes de 16 px y 112 px de aire abajo para la barra inferior fija (pasillo del club, `env(safe-area-inset-bottom)`), con cinco enlaces de 56 px de alto a partes iguales, icono de 24 px sobre rótulo. Desde 768 px es una retícula `14rem 1fr`: el pasillo lateral (`sticky`, 100 dvh) lleva el escudo de 44 px, el nombre del club a 1.5rem 800 con tracking 0.06em y la navegación en columna con enlaces de 44 px; el contenido pasa a márgenes de 32 px y 40 px de aire abajo.

La banda de cabecera abre cada página: una franja blanca que sangra hasta los bordes (`-mx-4` / `-mx-8`), con el escudo de 28 px y el nombre del club solo en móvil (donde no hay pasillo lateral), enlace de vuelta si lo hay, título a la izquierda y acciones a la derecha. Debajo, la regla de 6 px del color de la sección y 24 px / 32 px antes del contenido.

Los bloques de página son zonas: regla de tinta de 6 px, 8 px, fila de rótulo de 44 px de alto con el enlace o los controles a la derecha, 12 px y el contenido sobre la hoja. Entre zonas, 32 px en móvil y 40 px en escritorio. Inicio en escritorio es `1fr 6px 1fr`: una regla vertical de tinta parte la página en agenda y resultados; la tira de teclas y la línea de temporada cruzan las tres columnas. Las listas son filas sobre filetes: rejilla `4.25rem 1fr auto auto` (fecha, contenido, marca, chevrón), 56–64 px de alto mínimo, 12 px entre columnas, 4 px de sangría lateral. Los datos del detalle van en 1, 2 y 4 columnas (640 px, 1024 px); los videos en `1fr 20rem` desde 1024 px; Flyers en `1fr minmax(22rem, 28rem)` desde 1024 px.

Comportamiento en móvil, que es donde se usa de pie y con una mano:
- Las acciones de cabecera se recogen en el menú «Acciones» (`ActionMenu`, Popover API) y en escritorio son botones en fila. En Flyers, «Deshacer» se queda siempre fuera del menú.
- El pie de un diálogo apila los botones a ancho completo con la acción principal arriba; la acción destructiva apartada (`mr-auto`) queda la última, compacta, alineada a la izquierda y separada 8 px, para que borrar no pese más que lo demás. Desde 640 px, en fila a la derecha.
- En Flyers, al editar o pedir a la IA, la vista previa queda fija arriba en pequeño (máx. 32 svh, a sangre, sobre `paper`) para ver el resultado mientras se escribe.
- La tira de teclas de Inicio pasa a columna a ancho completo (48 px de alto); la línea de temporada, a rejilla de cuatro columnas iguales.
- Los filtros se desplazan en horizontal a sangre en vez de partir en líneas.

Puntos de ruptura: 640 px (`sm`), 768 px (`md`, aparece el pasillo lateral), 1024 px (`lg`). La variante `wide` (≥ 48rem o pantalla apaisada) es de la cancha de Alineación.

La cuadrícula de 24 px es el lienzo propio de este mundo, no un adorno. Techo conocido: los componentes todavía no encajan en el módulo de 24 px (el ritmo real es de 4 px: 8, 12, 16, 20, 32, 40); alinear alturas y separaciones al módulo es trabajo pendiente, no una regla vigente.

### Named Rules
**La regla de la regla.** Los bloques se separan con reglas de tinta de 6 px (`line-top`, `Zone`) y las filas con filetes de 2 px de tinta al 18 % (`hairline`, `divide-hairline`); nunca con cajas ni cambios de fondo. Si hace falta agrupar, se traza una regla arriba y se pone el rótulo debajo.

**La regla de la señal.** Todo bloque que es entero un enlace o un botón lleva una señal visible de que se pulsa: `Cue` («Ver partido», «Ver detalle») en portadas y bloques destacados, chevrón a la derecha en las filas, «Ver ›» en las celdas de set, lápiz en celda en las filas del plantel. A la inversa, lo que no se pulsa no lleva ni señal ni hover: la línea de temporada es solo lectura.

**La regla del pulgar.** Todo objetivo mide 44 px como mínimo (56–64 px en filas, 48 px en el menú de acciones). Los tamaños `sm` e `icon` solo bajan a 40 px desde 768 px.

**La regla del separador.** En una línea de datos (`MetaLine`) el «·» va pegado al inicio del segmento siguiente con un espacio irrompible: si la línea salta, el punto cae al principio de la nueva y ninguna línea termina en un separador huérfano.

## Elevation & Depth

La hoja es plana. La profundidad no se expresa con sombras difusas sino con trazo: un contorno de 2 px que lee la variable `--paint` (tinta al 30 % sobre el papel; al 38 % dentro de las superficies blancas marcadas con `on-surface`, que son la banda de cabecera y los diálogos) y pasa a `--paint-hover` (tinta plena) bajo el cursor. Las filas responden con relleno (`surface` al 50 %), no con elevación.

Hay dos excepciones, y son deliberadas. Las teclas tienen cuerpo: un canto duro desplazado 3 px abajo a la derecha (tinta al 24 %) que al pulsar desaparece mientras la tecla se traslada esos mismos 3 px, de modo que baja hasta la hoja. Y lo único que flota de verdad, con sombra difusa, son los diálogos y el menú de acciones.

### Shadow Vocabulary
- **Contorno de celda** (`box-shadow: 0 0 0 2px var(--paint)`): recuadros (`Card`), tira de pestañas, reproductor, vista previa del flyer, estado de error, celdas de opción en reposo.
- **Contorno al pasar** (`box-shadow: 0 0 0 2px var(--paint-hover)`): el mismo trazo en tinta plena bajo el cursor.
- **Contorno de selección** (`box-shadow: inset 0 0 0 3px var(--color-ink)`): la celda de opción elegida, junto con fondo `surface` y negrita.
- **Canto de tecla** (`box-shadow: 3px 3px 0 color-mix(in oklab, var(--color-ink) 24%, transparent)`): botones primario, secundario y de borrar y lo que se construye con ellos (`Cue`, marcas V/D, celdas de set, teclas de filtro). Al pulsar: `translate: 3px 3px` y canto a cero, en 120 ms.
- **Flotante** (`box-shadow: 0 14px 32px rgb(22 20 18 / 0.28), 0 2px 6px rgb(22 20 18 / 0.16)`): solo `Modal` y `ActionMenu`.

### Named Rules
**La regla del trazo.** Un borde es tinta: 2 px de `--paint` por `box-shadow`, sin `border`, salvo en los campos de formulario (2 px de tinta al 60 %) y en el recuadro discontinuo del estado vacío. Toda superficie blanca que contenga celdas lleva `on-surface` para que el trazo suba al 38 %.

**La regla del canto.** El canto desplazado es el cuerpo de una tecla y solo de una tecla. Recuadros, chips, campos, pestañas, diálogos y el botón fantasma no lo llevan.

## Shapes

Todo es celda recta sobre una regla recta. Las esquinas son vivas (0 px) en lo que se toca y en las celdas: botones, campos, pestañas, celdas de opción, menú de acciones, reproductor. Van apenas matadas (2 px) en paneles y etiquetas: recuadros, diálogos, tira de pestañas, estado vacío, estado de error, chips, cuadro de número de video. El círculo se reserva para lo que es redondo de verdad: escudos (24–112 px), dorsal del jugador, el punto de color de cada posición (10 px) y el punto del anotador en el punto a punto (8 px).

Las líneas son las formas estructurales: 6 px de tinta arriba de cada zona (o `podio`, o el color de sección bajo la banda); 2 px de tinta al 18 % como filete; 4 px del segundo acento sobre el set ganado, pegada al filete; 4 px de `danger` coronando un aviso de error; 6 px del color de sección como marca de navegación (horizontal sobre el enlace en móvil, con las esquinas inferiores a 2 px; vertical en el borde izquierdo del pasillo en escritorio). El estado vacío es un recuadro de trazo discontinuo (2 px, tinta al 30 %).

## Components

Celdas de una hoja impresa: rectas, planas, en mayúsculas cuando se tocan, y con cuerpo solo cuando son teclas.

### Buttons
- **Shape:** celda de esquina viva (0 px), 44 px de alto mínimo en todos los tamaños (`sm` e `icon` bajan a 40 px desde 768 px), texto 700 mayúsculas 0.9375rem con tracking 0.03em, icono de 16–20 px a 8 px del texto; con icono a la izquierda la sangría izquierda baja a 14 px. Las clases viven en `index.css` (`.btn` más variante) y `buttonClasses()` las da también a enlaces.
- **Primary:** tecla del club: relleno `key`, letras `on-key`, canto de 3 px. Una por vista: «Cargar partido», «Siguiente», «Descargar», «Partidos» en Inicio (que solo navega).
- **Secondary (por defecto):** celda blanca: relleno `surface`, texto tinta, contorno interior de 2 px de tinta plena y canto de 3 px.
- **Ghost:** celda sin cuerpo: transparente, texto tinta, contorno interior de 2 px `--paint`, sin canto. Para lo terciario: «Agenda ›» en el rótulo de zona, «Gestionar», «Atrás», «Deshacer», cerrar diálogo.
- **Danger:** relleno `danger`, texto blanco, canto. Solo para lo que borra datos.
- **Disabled:** gris plano (tinta al 9 %, texto al 45 %), sin contorno ni canto. El relleno gris plano no significa otra cosa en el sistema.
- **Hover / Focus / Active:** al pasar, el relleno se mezcla (tecla 84 % con el acento; blanco 90 % con tinta; fantasma tinta al 8 % y contorno pleno; rojo 88 % con negro). Al pulsar, la tecla se traslada 3 px y pierde el canto (120 ms `ease-out`); `static` lo anula en controles que se pulsan seguido. Foco: contorno de 2 px de tinta separado 2 px.

### Señal de pulsación (Cue)
Tecla solo visual (`aria-hidden`, 40 px, 0.875rem, flecha que avanza 2 px cuando el cursor entra en el bloque) dentro de un bloque que es entero un enlace o un botón; el nombre accesible lo da el bloque. Tono `cell` (celda blanca) por defecto y `key` para la acción de la zona.

### Chips
- **Style:** etiquetas de 2 px de radio, 700 mayúsculas con tracking 0.05em; `sm` 0.75rem con relleno 2 px 6 px, `md` 0.875rem con 4 px 10 px; icono de 12–14 px dentro. No se pulsan: los filtros son botones.
- **State:** tecla del club (`gold`: victoria, set del video activo, paso del formulario); segundo acento con texto tinta (`orange`: «Hoy»); Podio con texto blanco (`podio`: «Liga Podio», «CourtTrack»); neutro blanco con contorno interior de 1,5 px en tinta (`silver` / `steel`: derrota, número de videos) o en tinta suave (`ash` / `rust`: sin resultado, secundarios). Los nombres de tono vienen de la paleta anterior y se conservan para no tocar cada uso.

### Cards / Containers
- **Corner Style:** no hay tarjetas. El bloque de página es la **Zona** (`Zone`): regla de 6 px (`line`, o `accent` / `podio` / `ink`), rótulo `h2` en fila de 44 px con enlace fantasma o controles a la derecha, y el contenido sobre la hoja. Las portadas del carrusel de partidos y las diapositivas de actividades son zonas pequeñas con su propia regla, sin marco: hover `surface` al 40 %, pulsadas escala 0.98, y su `Cue` abajo.
- **Background:** el **recuadro** (`Card`) es `surface` al 25 % con contorno de celda y 2 px de radio, para agrupaciones pequeñas (vista previa del flyer, tira de pestañas al 40 %).
- **Shadow Strategy:** ninguna en reposo (ver Elevation & Depth).
- **Border:** solo trazo de 2 px; el estado vacío, 2 px discontinuos.
- **Internal Padding:** 12–20 px en recuadros; las zonas no tienen relleno lateral.

### Inputs / Fields
- **Style:** celdas blancas: fondo `surface`, borde de 2 px de tinta al 60 %, esquina viva, 44 px de alto (40 px desde 768 px), 12 px de sangría, texto 1rem (0.9375rem en escritorio), marcador de posición `ink-soft` al 80 %. Etiqueta encima a 0.875rem 500 con «Opcional» en 0.75rem `ink-soft`; ayuda debajo a 0.75rem.
- **Focus:** el borde pasa a tinta plena (también al pasar), sin anillo extra; 150 ms.
- **Error / Disabled:** `aria-invalid` pinta el borde de `danger` y el mensaje en 0.75rem 700 `danger-deep`; el error general de un paso (`FormError`) es una celda blanca coronada por 4 px de `danger`. Desactivado, 50 % de opacidad.

### Selección
- **Conmutadores, pestañas y filtros:** lo marcado toma la tecla del club (`bg-key text-on-key`), con `aria-pressed` o `aria-selected`; el filtro de competición añade una marca de verificación y el recuento al 70 %. En reposo, las pestañas son texto `ink-soft` dentro de una tira con contorno de celda; los filtros, celdas blancas con canto.
- **Celdas de opción** (posición del jugador, formato y colores del flyer): en reposo `surface` al 40 % con contorno de celda; elegida, `surface` pleno, negrita y contorno interior de 3 px de tinta plena.

### Navigation
- **Style, typography, default/hover/active states, mobile treatment.** Pasillo en el primario del club con texto `on-rail`. Cinco enlaces con icono de trazo (24 px en móvil, 20 px en escritorio; relleno cuando está activo) y rótulo 700 mayúsculas con tracking 0.025em: 0.75rem en móvil, 1rem en escritorio. En reposo `on-rail` al 65 %; al pasar, pleno (y `on-rail` al 8 % de fondo en escritorio); activo, pleno. La **regla de la sección activa** es el único movimiento orquestado: una barra de 6 px del color de la sección (`--nav-line`) que se desliza hasta el enlace activo en 200 ms con `cubic-bezier(0.2, 0, 0, 1)`; con `prefers-reduced-motion` salta sin transición.
- **Menú de acciones (`ActionMenu`):** tecla secundaria «Acciones» con icono de tres puntos que abre un panel `popover`: `surface`, contorno de 2 px de tinta plena, sombra flotante, mínimo 240 px, opciones de 48 px en 700 mayúsculas con icono de 20 px; hover tinta al 8 %, destructivas en `danger-deep`. Flechas, Inicio y Fin recorren las opciones; Esc o tocar fuera cierra y devuelve el foco. Entra con fundido y 4 px en 150 ms.

### Banda de cabecera (PageHeader)
Franja `surface` de lado a lado con el título en tinta, descripción en `ink-soft` debajo, enlace de vuelta con chevrón (0.875rem 700 `ink-soft`) y acciones a la derecha. Debajo, 6 px de `--section-line`. Relleno 12 px 16 px 16 px en móvil, 24 px 32 px 20 px en escritorio. Es `on-surface`.

### Diálogo (Modal)
`<dialog>` nativo: panel `surface` de 2 px de radio, `calc(100% - 2rem)` de ancho hasta 32rem (48rem en `lg`), sombra flotante, velo `scrim` al 70 %, máximo 85 dvh en columna: cabecera con título a 1.875rem 800 y, debajo, la nota `meta`; botón de cerrar fantasma; contenido desplazable con 20 px de relleno; pie con borde superior de 1 px de tinta al 15 %. Entra y sale con fundido y 8 px de desplazamiento en 200 ms `ease-out`; con movimiento reducido, solo el fundido. Es `on-surface`.

### Estados
- **Vacío:** recuadro de trazo discontinuo (2 px, tinta al 30 %, 2 px de radio), 48 px 24 px de relleno, icono de 32 px en `ink-soft`, título 1.125rem 700 mayúsculas, descripción `ink-soft` de hasta 24rem, acción opcional.
- **Error:** celda `surface` con contorno de celda, regla de 4 px de `danger` arriba, icono de aviso en `danger-deep`, título 1.125rem 700 mayúsculas, mensaje y botón «Reintentar» cuyo icono gira mientras reintenta (quieto con movimiento reducido). `role="alert"`.
- **Carga:** bloques de tinta al 10 % con pulso que reproducen la geometría de lo que llega (fila, cifra, escudo).

### Escudo (TeamLogo)
Círculo de 24, 36, 56, 64–112 (`xl`) o 48–64 px (`cover`); sin logo o si falla, las iniciales (hasta 3) en 800 sobre la tecla del club. Las imágenes llevan un contorno interior de 1 px negro al 12 %.

### Marcador, parciales y forma reciente
Firma del sistema. El **marcador** son cifras condensadas 900 entre los dos escudos, con el guion en `ink-soft`. Cada **parcial** es una marca apoyada sobre un filete: cifra condensada, «Set n» debajo en 0.6875rem 700 mayúsculas y, encima, una regla de 4 px del segundo acento en el set ganado (transparente y texto `ink-soft` en el perdido); el lector de pantalla oye quién ganó. Cuando el partido viene de CourtTrack, cada parcial pasa a ser una celda-tecla secundaria con la misma regla de 4 px y «Ver ›», que abre la progresión y las estadísticas del set. La **forma reciente** son teclas de 36 px dentro de un objetivo de 44 px: V en tecla del club, D en celda blanca; la racha va escrita al lado.

### Filas y datos
Las listas (actividades siguientes, partidos por mes, videos, formaciones, plantel) son filas de 56–64 px sobre filetes: fecha en dos líneas (1.125rem 800 y día en 0.75rem 700 `ink-soft`), contenido con nombre 1.125rem 700 y metadatos 0.875rem `ink-soft`, marca a la derecha (chip, resultado condensado, cuadro de número de video que pasa a tecla del club con icono de reproducción cuando suena) y chevrón. Hover `surface` al 50 %; los inactivos, al 60 % y en gris. Un **dato** no es un tile: es una fila `dl` sobre filete con el rótulo a la izquierda (0.6875rem–0.75rem 700 mayúsculas `ink-soft`) y el valor a la derecha (0.875rem–1rem 700), como en las estadísticas de set y el detalle de partido. La **línea de temporada** de Inicio es la misma idea en una línea (cifra 900 más rótulo 0.75rem) y es solo lectura.

### Lienzos con paleta propia
La cancha de Alineación a pantalla completa (`src/dashboard/lineup/board/*`, `ui/FullscreenDialog.tsx`, `PositionFilter` con `onBoard`) y el lienzo de Flyers conservan la paleta oscura anterior (`coyote-*`, `pos-*`, `court*`, Teko e Inter) por contrato: los lienzos leen los tokens `@theme static` en tiempo de ejecución para dibujar el PNG. Este sistema rige el marco que los rodea, no su interior.

## Do's and Don'ts

Guardarraíles de la hoja de rotaciones, sacados de lo construido en el dashboard.

### Do:
- **Do** abrir cada bloque de página con una regla de tinta de 6 px y su rótulo `h2` debajo (`Zone`, `line-top`), y separar las filas con filetes de 2 px (`hairline`, `divide-hairline`).
- **Do** leer los colores del club solo a través de los tokens derivados (`key`, `on-key`, `club`, `accent`, `rail`); vestir otro club es redefinir `--club-primary`, `--club-accent` y `--club-accent-2`, el escudo y el nombre, y nada más.
- **Do** escribir fechas abreviadas, horas, marcadores y parciales en Sofia Sans Extra Condensed 900 (`font-figures`) con el guion en `ink-soft`, y todo lo demás en Sofia Sans.
- **Do** respetar los tres niveles de botón: una tecla del club por vista, celdas blancas con canto para lo secundario, fantasma con contorno y sin canto para lo terciario; `danger` solo para borrar.
- **Do** marcar lo seleccionado con la tecla del club en conmutadores, pestañas y filtros, y con contorno interior de 3 px de tinta más negrita en las celdas de opción.
- **Do** dar a cada bloque enteramente pulsable su señal visible (`Cue`, chevrón, «Ver ›») y su nombre accesible completo.
- **Do** recoger las acciones de cabecera en `ActionMenu` en móvil, apilar el pie del diálogo con la principal arriba y dejar la destructiva apartada (`mr-auto`) la última, compacta y separada.
- **Do** componer las líneas de datos con `MetaLine` para que el «·» viaje pegado al inicio del segmento siguiente.
- **Do** marcar con `on-surface` toda superficie blanca que contenga celdas, y trazar los contornos con `shadow-outline` (2 px de `--paint`).
- **Do** acompañar cada estado con texto o forma además del color: chip con palabra, letra V/D, «Set n» con regla, `aria-pressed`, `aria-current`.
- **Do** mantener 44 px de objetivo, foco visible de 2 px separado 2 px y una alternativa `motion-reduce` en cada transición que desplace algo.

### Don't:
- **Don't** meter contenido en tarjetas: ni rellenos opacos con sombra, ni paneles iguales en rejilla. `Card` es un recuadro de trazo para agrupaciones pequeñas; los bloques de página son zonas.
- **Don't** construir tiles de métricas: un dato es una fila `dl` sobre filete, un parcial es una marca sobre filete (o una celda-tecla cuando abre estadísticas) y los números de temporada caben en una línea de solo lectura.
- **Don't** usar el relleno gris plano para nada que no esté desactivado, ni quitarle el contorno a un botón fantasma: tiene que leerse como botón.
- **Don't** usar el segundo acento para el resultado de un partido (la derrota es un chip neutro con contorno de tinta), para marcar una selección, como relleno de botón ni como color de texto.
- **Don't** usar `danger` como color de sección ni como énfasis; es solo borrar y errores.
- **Don't** poner el acento del club (dorado) como fondo ni como texto sobre el papel: existe solo sobre la tecla del club y como regla de Flyers.
- **Don't** poner kickers ni eyebrows encima de un título; la nota va debajo (`meta`, `description`).
- **Don't** añadir un segundo movimiento orquestado ni entradas escalonadas: solo se desliza la regla de la sección activa (200 ms). `animate-rise` es de la cancha oscura.
- **Don't** dar aspecto de pulsable (hover, chevrón, canto) a lo que es solo lectura.
- **Don't** llevar el canto desplazado a recuadros, chips, campos o diálogos, ni la sombra flotante a nada que no sea `Modal` o `ActionMenu`.
- **Don't** usar los tokens `coyote-*`, `bg-podio-fade`, `bg-ember-fade`, Teko o Inter en el marco del dashboard; son de la web pública y de los lienzos.
- **Don't** escribir un hex del club en un componente ni añadir un token que solo tenga sentido para un club.
- **Don't** construir modo oscuro dentro de este sistema: el dashboard es `color-scheme: light` y el tema de noche está sin resolver.
