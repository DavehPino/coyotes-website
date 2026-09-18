---
version: 1
slug: "src-dashboard-home-homepage-tsx"
primary_target: "src/dashboard/home/HomePage.tsx"
related_targets: ["src/dashboard/DashboardLayout.tsx","src/dashboard/activities/ActivitiesPage.tsx","src/dashboard/matches/MatchesPage.tsx","src/dashboard/matches/MatchDetailPage.tsx","src/dashboard/lineup/LineupPage.tsx","src/dashboard/flyers/FlyersPage.tsx"]
---

# Dashboard · Inicio (y el mundo que heredan las demás secciones)

## Scope and mode

Operate. Ruta `/` del dashboard (`src/dashboard/home/HomePage.tsx`), primera superficie del mundo visual nuevo que después heredan DashboardLayout, Actividades, Partidos, Detalle de partido, Alineación (página) y Flyers (marco).

## Audience, task, content, constraints

- Cuerpo técnico y miembros del equipo; móvil de pie en el pabellón bajo fluorescentes, escritorio en casa para cargar.
- Tarea de Inicio en 3 s: cuándo y contra quién es lo siguiente, y cómo quedó lo último. Los números de temporada pasan a un pie de página.
- Acciones a un toque: cargar actividad, cargar partido, sincronizar.
- No debe parecer app corporativa (tiles + tarjetas iguales), ni videojuego/hype, ni un escritorio apretado en móvil.
- Intocables: tokens `@theme static` de posiciones y cancha, paleta Podio, LineupBoard, diálogos nativos, 44 px, accesibilidad AA.

## Direction contract

THESIS: El dashboard es el suelo del pabellón: el contenido vive entre líneas pintadas, nunca dentro de tarjetas. Rechaza el andamio de la categoría (saludo, tres tiles de métrica, paneles iguales, accesos rápidos en tarjeta).

OWN-WORLD: Suelo de parquet de arce con vetas de tablón apenas visibles; líneas pintadas blancas de 6 px para la estructura y reglas de cinta de 2 px para las filas; tipografía de vinilo negro en una sola familia (Big Shoulders; su variante Stencil solo en cifras monumentales); acciones como rótulos de vinilo negro con letras en el dorado del club; cinta naranja del club para lo de hoy, cinta azul Podio, rayas rojas de antena para peligro y error; cada sección tiene un color de línea (Inicio blanco, Actividades verde, Partidos naranja, Alineación rojo, Flyers negro) que solo aparece en su marca de navegación y bajo su banda de cabecera. La cabecera de cada página es la banda blanca de la red con el título en vinilo negro.

STORY: El entrenador abre el móvil entre set y set, lee de un vistazo el próximo partido y el último resultado, y si hace falta carga un partido o una actividad sin buscar el botón.

FIRST VIEWPORT (móvil 390 px): banda de la red arriba (escudo pequeño, club, semana). Zona de ataque: rótulo «PRÓXIMO PARTIDO» apoyado sobre la línea, fecha y hora a escala de número de cancha (stencil), rival y lugar en vinilo, cinta naranja «HOY» cuando toca. Línea de ataque gruesa. «ÚLTIMO RESULTADO»: 1 – 3 monumental y los parciales como marcas sobre la línea lateral, la racha como cintas V/D. Tira de acciones en vinilo negro (Cargar partido es la primaria, alcanzable con el pulgar sobre la barra inferior). Pie: la línea de temporada (partidos, balance, videos). En escritorio la pista se tumba: la línea central parte la página en agenda y resultados; el pasillo lateral izquierdo (zona libre, tono más oscuro) es la navegación con su línea de color por sección.

FORM: Las líneas del pabellón, candidato 5 de 7 de la lista fundamentada en la ronda de re-tirada 1; seed 2d170403. Interacción firma: la línea pintada de la sección activa se desliza entre secciones al navegar (150–200 ms); ninguna otra coreografía de carga. Raises: sin tarjetas y una sola retícula (panel de nave); jerarquía por contraste de escala sobre línea base estricta (espécimen); ningún estado depende solo del color (ciclorama); las proporciones de la cancha (ataque a 1/3, mitades) gobiernan columnas (capa con cordón).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved

- Tema de noche: el suelo claro es más luminoso que la app oscura actual; no se construye modo oscuro en esta ronda.
