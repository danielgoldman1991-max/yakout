import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LeadForm } from "@/components/public/lead-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSitePages } from "@/lib/data";

export async function PublicPage({ slug, requestType }: { slug: string; requestType: string }) {
  const pages = await getSitePages();
  const page = pages.find((item) => item.slug === slug) ?? {
    id: "default",
    slug,
    title: "Yakout Conciergerie et Services",
    subtitle: "Un service premium a Marrakech.",
    content: "Cette page est administrable depuis le CMS Yakout.",
    status: "published" as const,
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px]">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Yakout</p>
          <h1 className="mt-4 text-5xl font-light leading-tight">{page.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{page.subtitle}</p>
          <div className="mt-8 max-w-3xl border-y border-border bg-card p-8 leading-8 text-muted-foreground">
            {page.content}
          </div>
        </section>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-light">Faire une demande</CardTitle>
            <CardDescription>Yakout vous recontacte avec une proposition adaptee.</CardDescription>
          </CardHeader>
          <CardContent>
            <LeadForm requestType={requestType} source={`${slug}_page`} />
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
