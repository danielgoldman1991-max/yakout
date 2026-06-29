alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.company_settings enable row level security;
alter table public.modules enable row level security;
alter table public.activity_logs enable row level security;
alter table public.clients enable row level security;
alter table public.leads enable row level security;
alter table public.partners enable row level security;
alter table public.apartments enable row level security;
alter table public.apartment_images enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_images enable row level security;
alter table public.reservations enable row level security;
alter table public.trips enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.documents enable row level security;
alter table public.site_pages enable row level security;
alter table public.site_sections enable row level security;
alter table public.site_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.services enable row level security;
alter table public.seo_metadata enable row level security;

create or replace function public.current_company_id()
returns uuid
language sql
stable
as $$
  select company_id from public.profiles where user_id = (select auth.uid()) limit 1
$$;

create policy "profiles own company read" on public.profiles for select to authenticated
using (company_id = public.current_company_id() or user_id = (select auth.uid()));

create policy "profiles own company update" on public.profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "companies same company read" on public.companies for select to authenticated
using (id = public.current_company_id());

create policy "public published apartments" on public.apartments for select to anon, authenticated
using (is_published = true);
create policy "public published vehicles" on public.vehicles for select to anon, authenticated
using (is_published = true);
create policy "public published services" on public.services for select to anon, authenticated
using (is_published = true);
create policy "public published blog" on public.blog_posts for select to anon, authenticated
using (status = 'published');
create policy "public published pages" on public.site_pages for select to anon, authenticated
using (status = 'published');
create policy "public site settings" on public.site_settings for select to anon, authenticated
using (is_public = true);

do $$
declare
  t text;
begin
  foreach t in array array[
    'company_settings','modules','activity_logs','clients','leads','partners','apartments','apartment_images',
    'vehicles','vehicle_images','reservations','trips','payments','expenses','documents','site_pages','site_sections',
    'site_settings','media_assets','blog_categories','blog_posts','services','seo_metadata'
  ]
  loop
    execute format('create policy "%s company select" on public.%I for select to authenticated using (company_id = public.current_company_id())', t, t);
    execute format('create policy "%s company insert" on public.%I for insert to authenticated with check (company_id = public.current_company_id())', t, t);
    execute format('create policy "%s company update" on public.%I for update to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id())', t, t);
    execute format('create policy "%s company delete" on public.%I for delete to authenticated using (company_id = public.current_company_id())', t, t);
  end loop;
end;
$$;
