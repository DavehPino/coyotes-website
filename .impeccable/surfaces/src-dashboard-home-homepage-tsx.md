---
version: 1
slug: "src-dashboard-home-homepage-tsx"
primary_target: "src/dashboard/home/HomePage.tsx"
related_targets: ["src/dashboard/DashboardLayout.tsx","src/dashboard/activities/ActivitiesPage.tsx","src/dashboard/matches/MatchesPage.tsx","src/dashboard/matches/MatchDetailPage.tsx","src/dashboard/lineup/LineupPage.tsx","src/dashboard/flyers/FlyersPage.tsx"]
---

# Dashboard · Inicio (y el mundo que heredan las demás secciones)

## Scope and mode

Operate. Ruta `/` del dashboard (`src/dashboard/home/HomePage.tsx`), primera superficie del mundo visual que heredan DashboardLayout, Actividades, Partidos, Detalle de partido, Alineación (página) y Flyers (marco).

## Audience, task, content, constraints

- Cuerpo técnico y miembros del equipo; móvil de pie en el pabellón, escritorio en casa para cargar.
- Tarea de Inicio en 3 s: cuándo y contra quién es lo siguiente, y cómo quedó lo último. Los números de temporada van en una línea al pie.
- Acciones a un toque desde Inicio: ir a Partidos (solo navega; los partidos se cargan en su sección), cargar actividad, diseñar flyer.
- No debe parecer app corporativa (tiles + tarjetas iguales), ni videojuego/hype, ni un escritorio apretado en móvil. Los botones tienen que sentirse botones (pedido explícito del usuario).
- Los colores del club son una capa: el producto será multi-tenant y cada club traerá los suyos.
- Intocables: tokens `@theme static` de posiciones y cancha, paleta Podio, LineupBoard, diálogos nativos, 44 px, accesibilidad AA.

## Direction contract

THESIS: El dashboard es la hoja de rotaciones del entrenador: el contenido vive en zonas abiertas por reglas de tinta sobre papel cuadriculado, nunca dentro de tarjetas. Rechaza el andamio de la categoría (saludo, tiles de métrica, paneles iguales).

OWN-WORLD: Papel neutro cálido (gris con un punto de calor, para convivir con el negro y el dorado del club) cuadriculado a 24 px; reglas de tinta de 6 px que abren cada zona y filetes de 2 px entre filas; esquinas rectas en controles y celdas (0 px) y apenas matadas en paneles y etiquetas (2 px); una sola familia, Sofia Sans, con Sofia Sans Extra Condensed para fechas, marcadores y parciales. El club entra por tres variables (`--club-primary`, `--club-accent`, `--club-accent-2`): menú de navegación en el color primario del club, tecla de acción en primario con letras del acento, y el segundo acento solo para lo de hoy y el set ganado. Lo seleccionado nunca usa el acento: conmutadores y pestañas toman la tecla del club, y las celdas de opción un contorno de tinta plena de 3 px. Botones como celdas con cuerpo: relleno sólido, contorno de tinta y canto desplazado que desaparece al pulsar. Azul Podio para su liga; rojo para borrar y errores. Cada sección tiene un color de regla bajo su banda de cabecera y en su marca de navegación.

STORY: El entrenador abre el móvil entre set y set, lee de un vistazo el próximo partido y el último resultado, y si hace falta carga un partido o una actividad sin buscar el botón.

FIRST VIEWPORT (móvil 390 px): banda blanca de cabecera (escudo pequeño, club, día y semana). Primera zona: rótulo «Próximo partido» bajo su regla, fecha y hora en cifras condensadas grandes, rival y lugar, etiqueta «Hoy» cuando toca. Segunda zona: «Último resultado» con el marcador grande, los parciales como marcas sobre un filete (acento sobre el set ganado) y la racha V/D. Tira de teclas (Partidos es la primaria y solo navega, alcanzable con el pulgar sobre la barra inferior). Pie: los números de temporada, solo lectura. En escritorio una regla vertical parte la página en agenda y resultados; el menú lateral va en el color del club.

FORM: La hoja de rotaciones, candidato 5 de 7 de la lista fundamentada en la ronda de re-tirada 2; seed 2d170403. Elegida por el usuario tras comparar cuatro mundos construidos y alternables en vivo (Pabellón, Marcador, Camiseta, Rotaciones); después pidió pasarla a los colores de Coyotes con el club como capa de tokens. Interacción firma: la regla de la sección activa se desliza entre secciones al navegar (200 ms); ninguna otra coreografía de carga.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved

- Modo oscuro: no construido.
- DESIGN.md y `.impeccable/design.json` todavía describen el mundo anterior (Pabellón); se regeneran cuando el usuario confirme la paleta en pantalla.
