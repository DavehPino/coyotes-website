# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Cuerpo técnico y miembros del equipo Coyotes Volley** (confirmado 17 sep 2026). Usan el dashboard interno en
  `dashboard.<dominio>` sin login: consultan actividades, partidos y videos, y con la palabra clave cargan datos.
- Escena: móvil en el gimnasio o el banquillo (consulta rápida, una mano) y escritorio en casa (cargar partidos,
  subir videos, generar flyers). Mobile first.
- La web pública (`<dominio>`) está hoy vacía: solo una landing mínima (escudo, nombre y eslogan). **No hay trabajo
  de diseño previsto en ella**; quien la visite no es un usuario del producto por ahora.

## Product Purpose

Un dashboard de club de vóley amateur federado para que el equipo tenga en un solo sitio lo que viene (actividades y
partidos de Liga Podio), lo que pasó (partidos con parciales, videos, progresión punto a punto y estadísticas de
CourtTrack), la plantilla y sus formaciones (Alineación) y la comunicación en redes (flyers para Instagram).
Éxito: que el cuerpo técnico abra el dashboard antes y después de cada partido y encuentre lo suyo sin buscar.

## Positioning

- El dashboard se alimenta de datos reales de la liga (CourtTrack, Fundación PODIO): resultados, parciales y
  progresión punto a punto sincronizados, no cargados a mano.
- Es una herramienta de equipo, no de un solo administrador: se consulta desde varios móviles y todo vive en Supabase.
- **Decisión de producto (confirmada 17 sep 2026): la aplicación tendrá look & feel configurable por club.** La
  identidad Coyotes es la primera piel, no el producto. El diseño debe separar lo que es del club (escudo, colores de
  marca, nombre) de lo que es de la herramienta (composición, tipografía de sistema, jerarquía, componentes).

## Operating Context

- Vóley federado, categoría mayores, Liga Regional / Liga Podio (Fundación PODIO). Terminología: actividad, partido,
  rival, competición, fase, parciales, sets, formación, posiciones (armador, punta, central, opuesto, líbero,
  comodín), zonas 1–6, líbero con camiseta distinta.
- Secciones del dashboard: Inicio (resumen), Actividades (carrusel de próximas), Partidos (lista con portadas,
  detalle con videos, progresión y estadísticas por set), Alineación (plantel, cancha táctica arrastrable,
  formaciones guardadas, compartir PNG), Flyers (editor sobre lienzo con IA, exporta PNG para Instagram).
- Escrituras protegidas por palabra clave (`ADMIN_SAFEWORD`, recordada en el navegador); Flyers tiene otra propia.
- Backend aparte: teamhub-api (Vercel Functions, Supabase, bucket R2). Los videos se suben del navegador al bucket.

## Capabilities and Constraints

- React 19 + Vite + TypeScript estricto + Tailwind 4 + React Router 7 + TanStack Query. Sin dependencias nuevas
  salvo acuerdo. Interfaz en español, identificadores en inglés.
- Intocables técnicos: los tokens `@theme static` de `src/index.css` que leen en tiempo de ejecución la imagen de
  la formación y la cancha (`--color-pos-*`, `--color-court*`); la paleta Podio para distinguir sus actividades;
  el LineupBoard y su arrastre con Pointer Events; los diálogos nativos (`<dialog>`); objetivos táctiles de 44 px;
  todo lo ganado en accesibilidad en el commit bfadd66 (foco visible, AA, teclado, `motion-reduce`).
- El lienzo de los flyers y la cancha de Alineación no se rediseñan; solo el marco que los rodea.
- Sin login ni roles todavía (previstos). El dashboard va con `noindex`.
- Palabras clave y subdominio se mantienen.

## Brand Commitments

- Nombre: Coyotes Volley. Escudo: `assets/coyotes-logo.webp` (único asset visual real).
- Colores del escudo (negro, dorado, naranja, óxido) se conservan como identidad del club; **la paleta puede
  ampliarse** con materiales y neutros nuevos (confirmado).
- **Teko + Inter no son binding**: la tipografía puede cambiar (confirmado).
- **Los textos pueden cambiar** sin inventar hechos (confirmado). Los textos de la web pública están en
  `src/content/public.ts`, fuera del alcance actual.
- Identidad cultural del club: el usuario pidió no construir el mundo visual sobre ella, porque el look & feel será
  configurable por club. Lo que dé carácter al producto debe venir de la cultura del vóley y de la herramienta, no
  de una historia particular de los Coyotes.

## Evidence on Hand

- Datos reales: partidos de Coyotes sincronizados de CourtTrack (parciales, progresión, estadísticas), 3 videos
  reales en el bucket, plantilla y formaciones sembradas, logo de Podio (`assets/podio-logo.png`).
- No existen: fotos de jugadores, patrocinadores, testimonios, cifras de audiencia. No se fabrican.

## Product Principles

1. **Primero el partido de este fin de semana.** Lo que viene y lo último jugado tienen prioridad sobre todo lo demás.
2. **Datos de liga, no de relleno.** Cada número mostrado sale de CourtTrack o de lo que el equipo cargó.
3. **Herramienta con piel de club.** La estructura es reutilizable por cualquier club; la marca es una capa de tokens.
4. **Una mano en el gimnasio.** Cada tarea principal se completa en móvil, de pie, con prisa.
5. **Nada que ya funcione se rompe.** Cancha, lienzo, diálogos y accesibilidad son suelo, no material de rediseño.

## Accessibility & Inclusion

- Contraste AA como mínimo en todo texto, foco visible, navegación por teclado completa, objetivos táctiles de 44 px,
  alternativas para `prefers-reduced-motion`. Estado alcanzado en bfadd66 y exigido en adelante.
