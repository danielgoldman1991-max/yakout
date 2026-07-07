-- Fix: leads.owner_id FK pointe vers profiles(id) au lieu de owners(id).
--
-- La contrainte leads_owner_id_fkey doit être:
--   leads.owner_id → public.owners(id) ON DELETE SET NULL
--
-- Vérifier avec:
--   select tc.constraint_name, ccu.table_name as referenced_table
--   from information_schema.table_constraints tc
--   join information_schema.constraint_column_usage ccu
--     on ccu.constraint_name = tc.constraint_name
--   where tc.constraint_type = 'FOREIGN KEY'
--     and tc.table_name = 'leads'
--     and tc.constraint_name = 'leads_owner_id_fkey';

alter table public.leads
  drop constraint if exists leads_owner_id_fkey;

alter table public.leads
  add constraint leads_owner_id_fkey
  foreign key (owner_id)
  references public.owners(id)
  on delete set null;
