-- Tabela de Configuração de Medicamentos
create table public.medicines (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null,
  
  -- Informações Básicas
  name text not null,
  icon_type text default 'pill', -- Para identificar qual imagem mostrar (vermelho, azul, etc)
  
  -- Configuração de Posologia
  start_date date not null,
  start_time time not null,      -- Horário da primeira dose
  dose text,                     -- Ex: "1 comprimido", "500mg"
  interval_hours integer,        -- Ex: 8 (a cada 8 horas)
  duration_days integer,         -- Ex: 7 (dias de tratamento)
  
  -- Controle/Status
  period text check (period in ('morning', 'night', 'both')), -- Opcional: para categorizar onde aparece visualmente
  active boolean default true    -- Se o tratamento ainda está valendo
);

-- Políticas de Segurança (RLS)
alter table public.medicines enable row level security;

create policy "Usuários podem ver seus próprios medicamentos" on public.medicines
  for select using ((select auth.uid()) = user_id);

create policy "Usuários podem criar seus medicamentos" on public.medicines
  for insert with check ((select auth.uid()) = user_id);

create policy "Usuários podem atualizar seus medicamentos" on public.medicines
  for update using ((select auth.uid()) = user_id);

create policy "Usuários podem deletar seus medicamentos" on public.medicines
  for delete using ((select auth.uid()) = user_id);
