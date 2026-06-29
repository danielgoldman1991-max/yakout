import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, MessageCircle } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { PremiumButton } from "@/components/ui/premium-button";
import { getBlogPostBySlug } from "@/lib/data";
import { fallbackImages } from "@/lib/images";
import { formatDate } from "@/lib/formatters";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Article introuvable" };
  return {
    title: post.meta_title || `${post.title} | Yakout Marrakech`,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const imageSrc = post.cover_image_url || fallbackImages.blog.url;
  const imageAlt = post.cover_image_url ? `Image de couverture de l'article : ${post.title}` : fallbackImages.blog.alt;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        {/* ─── Hero article éditorial ─── */}
        <section className="relative flex min-h-[360px] items-end overflow-hidden sm:min-h-[400px] md:min-h-[500px]">
          <div className="absolute inset-0">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          </div>
          <div className="relative z-10 w-full">
            <div className="container mx-auto px-6 pb-10 md:px-12 md:pb-14">
              <Link
                href="/blog"
                className="mb-5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:text-gold"
              >
                <ArrowRight className="h-3 w-3 rotate-180" />
                Retour au blog
              </Link>
              <div className="flex items-center gap-3 text-[10px] font-medium text-white/60">
                {post.category && (
                  <span className="rounded-full border border-gold/25 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold">
                    {post.category}
                  </span>
                )}
                {post.published_at && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(post.published_at)}
                  </span>
                )}
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-[clamp(1.6rem,4vw,3rem)] font-semibold leading-[1.06] tracking-tight text-white">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/70">
                  {post.excerpt}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ─── Contenu article ─── */}
        <article className="container mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-20">
          <div
            className="space-y-5 text-[15px] leading-8 text-muted-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-lg [&_h3]:text-foreground [&_p]:leading-8 [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition [&_a:hover]:text-gold-light [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:my-8 [&_img]:rounded-sm [&_blockquote]:border-l-2 [&_blockquote]:border-gold/30 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground/80"
            dangerouslySetInnerHTML={post.content ? { __html: sanitizeHtml(post.content) } : undefined}
          />
          {!post.content && (
            <div className="rounded-sm border border-border bg-card px-8 py-10 text-center">
              <p className="font-display text-lg text-muted-foreground">Contenu de l&apos;article à venir.</p>
              <p className="mt-2 text-sm text-muted-foreground/60">
                Cet article sera bientôt disponible. Revenez prochainement.
              </p>
            </div>
          )}

          {/* ─── Partage et navigation ─── */}
          <div className="mt-16 border-t border-border pt-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-gold"
              >
                <ArrowRight className="h-3 w-3 rotate-180" />
                Retour au blog
              </Link>
            </div>
          </div>
        </article>

        {/* ─── CTA discret ─── */}
        <section className="border-t border-border bg-surface">
          <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
            <h2 className="font-display text-2xl text-foreground md:text-3xl">
              Vous souhaitez organiser votre séjour à Marrakech&thinsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
              Appartements, chauffeur, excursions et conciergerie&thinsp;: Yakout vous accompagne
              avec une approche locale et premium.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PremiumButton href="/contact" variant="primary">
                Nous contacter <ArrowRight className="h-4 w-4" />
              </PremiumButton>
              <Link
                href={buildWhatsAppUrl("Bonjour Yakout, j'aimerais avoir des conseils pour mon séjour à Marrakech.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-border bg-card px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:bg-gold/5 hover:shadow-elevation-2"
              >
                <MessageCircle className="h-4 w-4" />
                Contacter sur WhatsApp
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
