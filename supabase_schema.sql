-- Tabela de perfis públicos (vinculada aos usuários do Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  username text unique,
  full_name text,
  birth_date date,
  avatar_url text
);

-- Habilitar RLS (Segurança a nível de linha)
alter table public.profiles enable row level security;

-- Políticas de acesso
create policy "Perfis são visíveis por todos" on public.profiles
  for select using (true);

create policy "Usuários podem inserir seu próprio perfil" on public.profiles
  for insert with check ((select auth.uid()) = id);

create policy "Usuários podem atualizar seu próprio perfil" on public.profiles
  for update using ((select auth.uid()) = id);

-- Função para criar perfil automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, username, birth_date)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'birth_date')::date
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que dispara após cadastro no Auth
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
