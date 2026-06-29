# Yakout Digital Ecosystem V1

Application Next.js App Router pour Yakout Conciergerie et Services: site public premium, dashboard interne, CMS, CRM, modules business et socle Supabase.

## Stack

- Next.js, TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, RLS
- React Hook Form, Zod
- Lucide React, Recharts
- Deploiement Vercel

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Renseigner ensuite:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_COMPANY_NAME=Yakout Conciergerie et Services
```

Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` cote client. Elle n'est pas necessaire pour la V1 courante.

## Supabase

Executer les fichiers dans cet ordre depuis l'editeur SQL Supabase:

1. `database/schema.sql`
2. `database/policies.sql`
3. `database/storage.sql`
4. `database/seed.sql`

Creer Maria dans Supabase Auth, puis ajouter son profil dans `profiles` avec le role `admin` et le `company_id` Yakout.

Le vrai logo fourni doit etre place dans:

```text
public/logo/yakout-logo.png
```

## Routes principales

- Site public: `/`, `/about`, `/apartments`, `/chauffeur`, `/vehicles`, `/services`, `/blog`, `/contact`
- Login: `/login`
- Ecosystem apres connexion: `/dashboard/ecosystem`
- Dashboard KPI: `/dashboard`
- CMS: `/dashboard/site/pages`, `/dashboard/site/blog`, `/dashboard/site/media`, `/dashboard/site/services`, `/dashboard/site/seo`, `/dashboard/site/settings`
- Gestion: `/dashboard/leads`, `/dashboard/clients`, `/dashboard/apartments`, `/dashboard/reservations`, `/dashboard/vehicles`, `/dashboard/trips`, `/dashboard/partners`, `/dashboard/payments`, `/dashboard/expenses`, `/dashboard/documents`

## Deploiement Vercel

1. Importer le projet sur Vercel.
2. Ajouter les variables d'environnement.
3. Connecter Supabase.
4. Lancer le deploiement.

Les modules Portail Syndic et Evenementiel sont uniquement representes comme futurs modules non actives dans cette V1.
