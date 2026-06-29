alter table public.apartments add column if not exists image_url text;
alter table public.apartments add column if not exists image_alt_text text;
alter table public.apartments add column if not exists bathrooms integer default 0;

alter table public.vehicles add column if not exists image_url text;
alter table public.vehicles add column if not exists image_alt_text text;

alter table public.blog_posts add column if not exists cover_image_alt text;
alter table public.services add column if not exists image_alt_text text;
alter table public.site_pages add column if not exists cover_image_alt text;

insert into storage.buckets (id, name, public)
values ('yakout-media', 'yakout-media', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'public read yakout media') then
    create policy "public read yakout media"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'yakout-media');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'authenticated upload yakout media') then
    create policy "authenticated upload yakout media"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'yakout-media'
      and (storage.foldername(name))[1] in ('apartments','vehicles','blog','services','pages','site')
      and exists (
        select 1 from public.profiles
        where user_id = (select auth.uid())
          and role in ('admin','manager','staff')
      )
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'authenticated update yakout media') then
    create policy "authenticated update yakout media"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'yakout-media'
      and exists (
        select 1 from public.profiles
        where user_id = (select auth.uid())
          and role in ('admin','manager','staff')
      )
    )
    with check (
      bucket_id = 'yakout-media'
      and (storage.foldername(name))[1] in ('apartments','vehicles','blog','services','pages','site')
    );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'authenticated delete yakout media') then
    create policy "authenticated delete yakout media"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'yakout-media'
      and exists (
        select 1 from public.profiles
        where user_id = (select auth.uid())
          and role in ('admin','manager','staff')
      )
    );
  end if;
end $$;
