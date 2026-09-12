-- Datos mínimos para desarrollo local (`supabase db reset`)
insert into public.teams (name, short_name, is_own_team)
values ('Coyotes', 'COY', true)
on conflict do nothing;
