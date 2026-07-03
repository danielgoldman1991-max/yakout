-- Backfill public_status for vehicles that have is_published = true but no public_status set
-- This ensures vehicles seeded with is_published = true appear on public pages

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS public_status text DEFAULT 'draft';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS availability_status text DEFAULT 'Disponible';

CREATE INDEX IF NOT EXISTS vehicles_public_status_idx ON vehicles(public_status);
CREATE INDEX IF NOT EXISTS vehicles_availability_status_idx ON vehicles(availability_status);

UPDATE vehicles
SET public_status = 'published'
WHERE is_published = true AND (public_status IS NULL OR public_status = 'draft');

UPDATE vehicles
SET availability_status = 'Disponible'
WHERE availability_status IS NULL;
