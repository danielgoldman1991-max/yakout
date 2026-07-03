export type SitePage = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  cover_image_url?: string;
  cover_image_alt?: string;
  primary_button_text?: string;
  primary_button_url?: string;
  secondary_button_text?: string;
  secondary_button_url?: string;
  status: "draft" | "published";
  meta_title?: string;
  meta_description?: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  status: "draft" | "published" | "archived";
  published_at?: string;
  cover_image_url?: string;
  cover_image_alt?: string;
  meta_title?: string;
  meta_description?: string;
  author?: string;
  keywords?: string[];
  created_at: string;
  updated_at: string;
};

export type PublicService = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  image_url?: string;
  image_alt_text?: string;
  price_from?: number;
  icon?: string;
  is_published: boolean;
  display_order: number;
  meta_title?: string;
  meta_description?: string;
};

export type SiteSettings = {
  company_name: string;
  slogan: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  google_maps_url?: string;
  logo_url?: string;
  favicon_url?: string;
  default_og_image_url?: string;
  footer_text?: string;
};
