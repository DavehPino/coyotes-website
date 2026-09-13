-- ════════════════════════════════════════════════════════════════════════════
-- Datos de ejemplo para desarrollo: equipo propio, 3 rivales, dos semanas de
-- actividades (la actual y la siguiente) y 4 partidos pasados con parciales.
--
-- Se puede ejecutar varias veces sin duplicar filas:
--   · local:  supabase db reset   (aplica migraciones + este seed)
--   · remoto: pegar en el SQL Editor de Supabase
-- Las actividades se generan relativas a la semana en curso (lunes ISO).
-- ════════════════════════════════════════════════════════════════════════════

do $$
declare
  v_monday    date := date_trunc('week', current_date)::date; -- lunes de esta semana
  v_next      date := v_monday + 7;
  v_onas      uuid;
  v_pumas     uuid;
  v_halcones  uuid;
  v_match     uuid;
begin
  -- ─── Equipos ──────────────────────────────────────────────────────────────
  insert into public.teams (name, short_name, is_own_team, category, city)
  select 'Coyotes', 'COY', true, 'Mayores', 'Ciudad'
  where not exists (select 1 from public.teams where is_own_team);

  insert into public.teams (name, short_name, category, city)
  select 'Onas Vóley', 'ONA', 'Mayores', 'Ciudad'
  where not exists (select 1 from public.teams where lower(name) = 'onas vóley');

  insert into public.teams (name, short_name, category, city)
  select 'Pumas', 'PUM', 'Mayores', 'Villa Norte'
  where not exists (select 1 from public.teams where lower(name) = 'pumas');

  insert into public.teams (name, short_name, category, city)
  select 'Halcones', 'HAL', 'Mayores', 'San Martín'
  where not exists (select 1 from public.teams where lower(name) = 'halcones');

  select id into v_onas     from public.teams where lower(name) = 'onas vóley' limit 1;
  select id into v_pumas    from public.teams where lower(name) = 'pumas' limit 1;
  select id into v_halcones from public.teams where lower(name) = 'halcones' limit 1;

  -- ─── Actividades: semana actual ───────────────────────────────────────────
  if not exists (select 1 from public.weekly_activities where activity_date between v_monday and v_monday + 6) then
    insert into public.weekly_activities
      (title, activity_type, activity_date, start_time, end_time, location, description, opponent_team_id, is_cancelled)
    values
      ('Entrenamiento técnico', 'entrenamiento', v_monday, '19:30', '21:00', 'Polideportivo Municipal',
       E'Recepción y defensa en W.\nTraer rodilleras.', null, false),
      ('Preparación física', 'fisico', v_monday + 1, '20:00', '21:00', 'Gimnasio Norte',
       'Circuito de fuerza y pliometría. Ropa cómoda y botella de agua.', null, false),
      ('Entrenamiento', 'entrenamiento', v_monday + 2, '19:30', '21:00', 'Polideportivo Municipal',
       'Sistemas de ataque y bloqueo. Seis contra seis al final.', null, false),
      ('Análisis de video: Pumas', 'video_analisis', v_monday + 3, '20:00', '21:00', 'Sala de reuniones del club',
       'Repasamos el último partido contra Pumas: rotaciones y saque.', v_pumas, false),
      ('Entrenamiento', 'entrenamiento', v_monday + 4, '19:30', '21:00', 'Polideportivo Municipal',
       'Cancelado por mantenimiento de la cancha.', null, true),
      ('Partido vs Pumas', 'partido', v_monday + 5, '18:00', '20:00', 'Polideportivo Municipal',
       E'Jornada 5 de la Liga Regional.\nConcentración a las 17:00. Camiseta negra.', v_pumas, false),
      ('Reunión de equipo', 'reunion', v_monday + 6, null, null, null,
       'Balance de la primera vuelta y calendario de la segunda. Hora por confirmar.', null, false);
  end if;

  -- ─── Actividades: semana siguiente ────────────────────────────────────────
  if not exists (select 1 from public.weekly_activities where activity_date between v_next and v_next + 6) then
    insert into public.weekly_activities
      (title, activity_type, activity_date, start_time, end_time, location, description, opponent_team_id, is_cancelled)
    values
      ('Entrenamiento', 'entrenamiento', v_next, '19:30', '21:00', 'Polideportivo Municipal',
       'Saque y recepción.', null, false),
      ('Preparación física', 'fisico', v_next + 1, '20:00', '21:00', 'Gimnasio Norte',
       'Trabajo de core y movilidad.', null, false),
      ('Entrenamiento', 'entrenamiento', v_next + 2, '19:30', '21:00', 'Polideportivo Municipal',
       'Defensa y contraataque.', null, false),
      ('Amistoso vs Halcones', 'amistoso', v_next + 4, '20:00', '22:00', 'Pabellón San Martín',
       'Amistoso de preparación. Salida en coche a las 19:00 desde el club.', v_halcones, false),
      ('Torneo de fin de semana', 'torneo', v_next + 5, '09:00', '18:00', 'Ciudad Deportiva',
       E'Torneo cuadrangular.\nPrimer partido a las 10:00. Llevar comida.', null, false);
  end if;

  -- ─── Partidos pasados ─────────────────────────────────────────────────────
  insert into public.matches
    (slug, played_on, start_time, opponent_team_id, is_home, location, competition, phase, sets_won, sets_lost, set_scores, summary)
  select '2026-09-06-vs-onas', '2026-09-06', '18:00', v_onas, true, 'Polideportivo Municipal',
         'Liga Regional', 'Jornada 4', 3, 1,
         '[{"us":25,"them":20},{"us":22,"them":25},{"us":25,"them":18},{"us":25,"them":19}]'::jsonb,
         E'Gran partido en casa. Tras perder el segundo set, el equipo ajustó el bloqueo y dominó los dos siguientes.\nDestacó el saque en el cuarto set.'
  where not exists (select 1 from public.matches where slug = '2026-09-06-vs-onas');

  insert into public.matches
    (slug, played_on, start_time, opponent_team_id, is_home, location, competition, phase, sets_won, sets_lost, set_scores, summary)
  select '2026-08-30-vs-pumas', '2026-08-30', '20:00', v_pumas, false, 'Pabellón Villa Norte',
         'Liga Regional', 'Jornada 3', 1, 3,
         '[{"us":21,"them":25},{"us":25,"them":23},{"us":19,"them":25},{"us":22,"them":25}]'::jsonb,
         'Derrota fuera de casa. Muchos errores de recepción en los sets 3 y 4; lo trabajamos esta semana.'
  where not exists (select 1 from public.matches where slug = '2026-08-30-vs-pumas');

  insert into public.matches
    (slug, played_on, start_time, opponent_team_id, is_home, location, competition, phase, sets_won, sets_lost, set_scores, summary)
  select '2026-08-23-vs-halcones', '2026-08-23', '18:00', v_halcones, true, 'Polideportivo Municipal',
         'Liga Regional', 'Jornada 2', 3, 2,
         '[{"us":25,"them":22},{"us":23,"them":25},{"us":25,"them":27},{"us":25,"them":17},{"us":15,"them":12}]'::jsonb,
         'Partido a cinco sets resuelto en el tie-break. Gran reacción tras ir 1-2.'
  where not exists (select 1 from public.matches where slug = '2026-08-23-vs-halcones');

  insert into public.matches
    (slug, played_on, start_time, opponent_team_id, is_home, location, competition, phase, sets_won, sets_lost, set_scores, summary)
  select '2026-08-15-vs-onas-amistoso', '2026-08-15', '11:00', v_onas, false, 'Pabellón Onas',
         'Amistoso', 'Pretemporada', 3, 0,
         '[{"us":25,"them":15},{"us":25,"them":21},{"us":25,"them":19}]'::jsonb,
         null
  where not exists (select 1 from public.matches where slug = '2026-08-15-vs-onas-amistoso');

  -- ─── Videos externos de ejemplo (los del bucket los crea el cron sync-videos) ──
  select id into v_match from public.matches where slug = '2026-09-06-vs-onas';

  if v_match is not null and not exists (select 1 from public.videos where match_id = v_match and source = 'external') then
    insert into public.videos
      (title, description, source, url, category, recorded_on, status, match_id, set_number, sort_order)
    values
      -- Sustituye la URL por el enlace real de YouTube del partido
      ('Resumen del partido', 'Highlights subidos a YouTube.', 'external',
       'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'highlights', '2026-09-06', 'ready', v_match, null, 0),
      -- Enlace que no es de YouTube: el dashboard muestra el botón "Abrir video"
      ('Set 1 (Drive)', 'Grabación desde la grada.', 'external',
       'https://drive.google.com/file/d/EJEMPLO/view', 'partido', '2026-09-06', 'ready', v_match, 1, 0);
  end if;
end $$;
