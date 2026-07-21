import { saveSettingsAction } from "@/lib/data/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { site } from "@/lib/constants/site";
import { ImageUploadField } from "@/components/dashboard/image-upload-field";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";

const defaultSettings = {
  company_name: site.companyName,
  slogan: site.slogan,
  phone: site.phoneDisplay,
  whatsapp: site.whatsappNumber,
  email: site.email,
  address: site.address,
  instagram: "",
  facebook: "",
  tiktok: "",
  google_maps_url: "",
  logo_url: "/branding/yakout-logo-light.png",
  favicon_url: "",
  default_og_image_url: "",
  footer_text: "Excellence, discretion et devouement pour vos sejours a Marrakech.",
};

export default function SiteSettingsDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50">Dashboard / Paramètres du site</p>
        <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">Paramètres du site</h1>
        <p className="mt-1 text-sm text-muted-foreground/70">Nom société, slogan, téléphone, WhatsApp, email et adresse.</p>
      </div>

      <FormErrorBanner />
      <form action={saveSettingsAction}>
        <div className="rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <div className="border-b border-border/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Informations générales</p>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70">Nom de la société</label>
                <Input name="company_name" defaultValue={defaultSettings.company_name} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70">Slogan</label>
                <Input name="slogan" defaultValue={defaultSettings.slogan} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70">Téléphone</label>
                <Input name="phone" defaultValue={defaultSettings.phone} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70">WhatsApp</label>
                <Input name="whatsapp" defaultValue={defaultSettings.whatsapp} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground/70">Email</label>
              <Input name="email" type="email" defaultValue={defaultSettings.email} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground/70">Adresse</label>
              <Textarea name="address" defaultValue={defaultSettings.address} rows={2} />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <div className="border-b border-border/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Identite visuelle</p>
          </div>
          <div className="space-y-4 p-5">
            <ImageUploadField
              label="Logo"
              folder="site"
              name="logo_url"
              defaultUrl={defaultSettings.logo_url}
              helperText="Logo utilise dans les zones publiques ou futures integrations CMS."
            />
            <ImageUploadField
              label="Favicon"
              folder="site"
              name="favicon_url"
              defaultUrl={defaultSettings.favicon_url}
              helperText="Icone du navigateur, idealement carree."
            />
            <ImageUploadField
              label="Image OG par defaut"
              folder="site"
              name="default_og_image_url"
              defaultUrl={defaultSettings.default_og_image_url}
              helperText="Image partagee par defaut sur WhatsApp, Facebook et LinkedIn."
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground/70">Texte footer</label>
              <Textarea name="footer_text" defaultValue={defaultSettings.footer_text} rows={2} />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-sm border border-border/60 bg-card shadow-elevation-1 transition-all duration-300 hover:shadow-elevation-2">
          <div className="border-b border-border/50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">Réseaux sociaux</p>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70">Instagram (URL)</label>
                <Input name="instagram" defaultValue={defaultSettings.instagram} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70">Facebook (URL)</label>
                <Input name="facebook" defaultValue={defaultSettings.facebook} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70">TikTok (URL)</label>
                <Input name="tiktok" defaultValue={defaultSettings.tiktok} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground/70">Google Maps (URL)</label>
                <Input name="google_maps_url" defaultValue={defaultSettings.google_maps_url} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-sm bg-gold px-6 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-foreground shadow-elevation-1 shadow-gold/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-glow-gold w-full sm:w-auto"
          >
            Enregistrer les paramètres
          </button>
        </div>
      </form>
    </div>
  );
}
