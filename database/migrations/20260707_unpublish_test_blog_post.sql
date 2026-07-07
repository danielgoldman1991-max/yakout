-- Depublish the accidental public test article without deleting production data.
-- Safe to run multiple times: if the slug does not exist, no row is changed.

update public.blog_posts
set
  status = 'draft',
  published_at = null,
  updated_at = now()
where slug = 'tttt'
  and status = 'published';
