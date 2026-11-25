-- The Art Archive — Supabase Database & Storage Schema

create table if not exists public.artworks (
  id text primary key,
  title text not null,
  storage_path text not null,
  image_url text not null,
  original_file_name text not null,
  original_width integer not null,
  original_height integer not null,
  aspect_ratio double precision not null,
  page_number integer not null,
  created_at bigint not null,
  updated_at bigint not null
);

create table if not exists public.book_pages (
  id text primary key,
  page_number integer not null,
  page_type text not null check (page_type in ('toc', 'artwork', 'final')),
  artwork_id text references public.artworks(id) on delete set null
);

alter table public.artworks enable row level security;
alter table public.book_pages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'artworks' and policyname = 'Public access to artworks'
  ) then
    create policy "Public access to artworks" on public.artworks for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'book_pages' and policyname = 'Public access to book_pages'
  ) then
    create policy "Public access to book_pages" on public.book_pages for all using (true) with check (true);
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public access to artworks bucket'
  ) then
    create policy "Public access to artworks bucket" on storage.objects for all using (bucket_id = 'artworks') with check (bucket_id = 'artworks');
  end if;
end $$;

insert into public.book_pages (id, page_number, page_type, artwork_id)
values
  ('page_toc', 1, 'toc', null),
  ('page_art_2', 2, 'artwork', null),
  ('page_art_3', 3, 'artwork', null),
  ('page_art_4', 4, 'artwork', null),
  ('page_art_5', 5, 'artwork', null),
  ('page_final', 6, 'final', null)
on conflict (id) do nothing;
