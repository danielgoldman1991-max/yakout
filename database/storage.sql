insert into storage.buckets (id, name, public)
values
  ('yakout-media', 'yakout-media', true),
  ('site', 'site', true),
  ('apartments', 'apartments', true),
  ('vehicles', 'vehicles', true),
  ('blog', 'blog', true),
  ('services', 'services', true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "public read published buckets"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('site','apartments','vehicles','blog','services'));

create policy "public read yakout media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'yakout-media');

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

create policy "authenticated upload company files"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('site','apartments','vehicles','blog','services','documents')
  and (storage.foldername(name))[1] = public.current_company_id()::text
);

create policy "authenticated update company files"
on storage.objects for update
to authenticated
using ((storage.foldername(name))[1] = public.current_company_id()::text)
with check ((storage.foldername(name))[1] = public.current_company_id()::text);

create policy "authenticated delete company files"
on storage.objects for delete
to authenticated
using ((storage.foldername(name))[1] = public.current_company_id()::text);
