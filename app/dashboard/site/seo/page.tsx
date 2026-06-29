import { getSitePages, getBlogPosts, getPublishedServices } from "@/lib/data";
import { saveSeoSettingsAction } from "@/lib/data/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

export default async function SeoDashboardPage() {
  const [pages, blogPosts, services] = await Promise.all([
    getSitePages(), getBlogPosts(), getPublishedServices(),
  ]);

  const hasContent = pages.length > 0 || blogPosts.length > 0 || services.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Dashboard / SEO</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">SEO</h1>
        <p className="mt-1 text-sm text-muted-foreground/70">Meta titles, descriptions et slugs par page.</p>
      </div>

      {!hasContent && (
        <p className="text-sm text-muted-foreground/60">Aucune page disponible pour le SEO.</p>
      )}

      <FormErrorBanner />
      <form action={saveSeoSettingsAction} className="rounded-sm border border-border/60 bg-card p-5 shadow-elevation-1">
        <input type="hidden" name="page_type" value="global" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">SEO global</p>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70">Title par defaut</label>
              <Input name="meta_title" defaultValue="Yakout Conciergerie et Services Marrakech" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70">Description par defaut</label>
              <Textarea name="meta_description" defaultValue="Conciergerie premium, appartements et chauffeur prive a Marrakech." rows={2} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground/70">Canonical base URL</label>
              <Input name="canonical_url" placeholder="https://yakout.ma" />
            </div>
          </div>
          <ImageUploadField
            label="Image OG globale"
            folder="site"
            name="og_image_url"
            helperText="Image de partage utilisee quand une page n'a pas d'image dediee."
          />
        </div>
        <button
          type="submit"
          className="mt-4 inline-flex h-9 items-center rounded-sm bg-gold px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
        >
          Enregistrer le SEO global
        </button>
      </form>

      <div className="grid gap-6 xl:grid-cols-2">
        {pages.length > 0 && (
          <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
            <div className="border-b border-border/50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Pages du site</p>
            </div>
            <div className="space-y-4 p-5">
              {pages.map((page) => (
                <form key={page.id} action={saveSeoSettingsAction} className="rounded-sm border border-border/50 bg-accent/5 p-4 space-y-3">
                  <input type="hidden" name="page_type" value="site_page" />
                  <input type="hidden" name="page_id" value={page.id} />
                  <p className="text-sm font-medium text-foreground">{page.title}</p>
                  <p className="text-xs text-muted-foreground/50">/{page.slug}</p>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground/70">Meta title</label>
                    <Input name="meta_title" defaultValue={page.meta_title ?? page.title} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground/70">Meta description</label>
                    <Textarea name="meta_description" defaultValue={page.meta_description ?? ""} rows={2} />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-sm bg-gold px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
                  >
                    Enregistrer
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        {blogPosts.length > 0 && (
          <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
            <div className="border-b border-border/50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Articles de blog</p>
            </div>
            <div className="space-y-4 p-5">
              {blogPosts.map((post) => (
                <form key={post.id} action={saveSeoSettingsAction} className="rounded-sm border border-border/50 bg-accent/5 p-4 space-y-3">
                  <input type="hidden" name="page_type" value="blog_post" />
                  <input type="hidden" name="page_id" value={post.id} />
                  <p className="text-sm font-medium text-foreground">{post.title}</p>
                  <p className="text-xs text-muted-foreground/50">/blog/{post.slug}</p>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground/70">Meta title</label>
                    <Input name="meta_title" defaultValue={post.meta_title ?? post.title} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground/70">Meta description</label>
                    <Textarea name="meta_description" defaultValue={post.meta_description ?? post.excerpt} rows={2} />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-sm bg-gold px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
                  >
                    Enregistrer
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
            <div className="border-b border-border/50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Services</p>
            </div>
            <div className="space-y-4 p-5">
              {services.map((service) => (
                <form key={service.id} action={saveSeoSettingsAction} className="rounded-sm border border-border/50 bg-accent/5 p-4 space-y-3">
                  <input type="hidden" name="page_type" value="service" />
                  <input type="hidden" name="page_id" value={service.id} />
                  <p className="text-sm font-medium text-foreground">{service.title}</p>
                  <p className="text-xs text-muted-foreground/50">/services/{service.slug}</p>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground/70">Meta title</label>
                    <Input name="meta_title" defaultValue={service.meta_title ?? service.title} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground/70">Meta description</label>
                    <Textarea name="meta_description" defaultValue={service.meta_description ?? service.short_description} rows={2} />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-sm bg-gold px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-elevation-1 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold"
                  >
                    Enregistrer
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
