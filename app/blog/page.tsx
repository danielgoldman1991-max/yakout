import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, MessageCircle } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFloatingButton } from "@/components/ui/whatsapp-floating-button";
import { PremiumButton } from "@/components/ui/premium-button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublishedBlogPosts } from "@/lib/data";
import { fallbackImages } from "@/lib/images";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export const metadata: Metadata = {
  title: "Conseils pour séjourner, se déplacer et investir à Marrakech",
  description: "Blog Yakout : conseils et actualités pour organiser votre séjour à Marrakech, découvrir la conciergerie immobilière et optimiser vos déplacements avec chauffeur privé.",
};

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <WhatsAppFloatingButton />
      <main className="pt-[80px]">
        {/* ─── Hero blog éditorial ─── */}
        <section className="relative flex items-center overflow-hidden border-b border-border bg-surface">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">Blog</p>
              <h1 className="mt-5 font-display text-[clamp(1.8rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
                Conseils pour séjourner, se déplacer et investir <span className="text-gold">à Marrakech</span>
              </h1>
              <p className="mt-6 max-w-xl text-[15px] leading-8 text-muted-foreground">
                Inspirez-vous de nos articles pour organiser votre séjour, découvrir Marrakech autrement
                et mieux comprendre la conciergerie immobilière.
              </p>
            </div>
          </div>
        </section>

        {/* ─── Grille articles ─── */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto px-6 py-20 md:px-12 md:py-24">
            {posts.length === 0 ? (
              <EmptyState
                title="Aucun article publié pour le moment"
                description="Nos articles arrivent bientôt. En attendant, contactez-nous directement pour toute question sur Marrakech."
                icon={CalendarDays}
                action={
                  <Link
                    href={buildWhatsAppUrl("Bonjour Yakout, j'aimerais avoir des conseils pour mon séjour à Marrakech.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2.5 rounded-sm bg-gold px-7 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-2 shadow-gold/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-gold hover:bg-gold-light"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Conseils par WhatsApp
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-sm border border-border bg-surface transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.cover_image_url || fallbackImages.blog.url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        {post.category && (
                          <span className="rounded-full border border-border px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-gold">
                            {post.category}
                          </span>
                        )}
                        {post.published_at && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {post.published_at}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 font-display text-base text-foreground transition-colors duration-300 group-hover:text-gold">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold transition group-hover:text-gold-light">
                          Lire l&apos;article <ArrowRight className="ml-1 inline h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── CTA ─── */}
        {posts.length > 0 && (
          <section className="bg-surface">
            <div className="container mx-auto px-6 py-20 text-center md:px-12 md:py-24">
              <h2 className="font-display text-2xl text-foreground md:text-3xl">
                Vous avez une question&thinsp;?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
                Notre équipe est à votre écoute pour vous conseiller sur votre séjour ou votre projet à Marrakech.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <PremiumButton href="/contact" variant="primary">
                  Nous contacter <ArrowRight className="h-4 w-4" />
                </PremiumButton>
                <Link
                  href={buildWhatsAppUrl()}
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
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
