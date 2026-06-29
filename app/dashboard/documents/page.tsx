import { Card } from "@/components/ui/card";

export default function DocumentsPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Documents</p>
        <h1 className="mt-2 text-3xl font-semibold">Documents</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Contrats, factures, recus et justificatifs stockes dans Supabase Storage.</p>
      </div>
      <Card className="p-8 text-center text-sm text-muted-foreground">Module documents disponible en lecture depuis Supabase Storage.</Card>
    </div>
  );
}
