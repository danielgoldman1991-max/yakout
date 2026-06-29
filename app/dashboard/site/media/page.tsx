import { Card } from "@/components/ui/card";

export default function MediaDashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Medias</p>
        <h1 className="mt-2 text-3xl font-semibold">Medias</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Upload, gestion et reutilisation des images dans les pages, blog, appartements et vehicules.</p>
      </div>
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Gestion des medias disponible avec Supabase Storage.
      </Card>
    </div>
  );
}
