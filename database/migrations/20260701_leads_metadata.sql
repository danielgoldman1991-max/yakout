-- Ajout colonne metadata JSONB pour stocker les champs specifiques par type de demande
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Ajout colonne related_id pour stocker l'UUID Supabase de l'entite liee
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS related_id uuid;

-- Ajout index pour les performances
CREATE INDEX IF NOT EXISTS leads_request_type_idx ON leads(request_type);
CREATE INDEX IF NOT EXISTS leads_related_slug_idx ON leads(related_slug);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_metadata_gin_idx ON leads USING gin (metadata);
