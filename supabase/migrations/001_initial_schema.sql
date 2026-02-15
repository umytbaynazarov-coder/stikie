-- Notes table
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  color text not null default 'yellow'
    check (color in ('yellow', 'pink', 'blue', 'green', 'orange', 'purple')),
  x float not null default 0,
  y float not null default 0,
  width int not null default 220,
  height int not null default 180,
  pinned boolean not null default false,
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_user_archived on public.notes(user_id, archived);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_notes_updated
  before update on public.notes
  for each row execute function public.handle_updated_at();

-- Row Level Security
alter table public.notes enable row level security;

create policy "Users can read own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);
