import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yakout-three.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: BASE, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE}/services`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE}/apartments`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${BASE}/transport`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${BASE}/vehicles`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE}/proprietaires`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${BASE}/concierge`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
  ];

  let apartmentSlugs: { slug: string }[] = [];
  let vehicleSlugs: { slug: string }[] = [];
  let blogSlugs: { slug: string }[] = [];

  try {
    const [{ getPublishedApartments, getPublishedBlogPosts }, { getPublicVehicles }] = await Promise.all([
      import("@/lib/data"), import("@/lib/data/public-vehicles"),
    ]);
    [apartmentSlugs, vehicleSlugs, blogSlugs] = await Promise.all([
      getPublishedApartments(), getPublicVehicles(), getPublishedBlogPosts(),
    ]);
  } catch {}

  const apartmentPages = apartmentSlugs.map((a) => ({
    url: `${BASE}/apartments/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const vehiclePages = vehicleSlugs.map((v) => ({
    url: `${BASE}/vehicles/${v.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const blogPages = blogSlugs.map((b) => ({
    url: `${BASE}/blog/${b.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...apartmentPages, ...vehiclePages, ...blogPages];
}
