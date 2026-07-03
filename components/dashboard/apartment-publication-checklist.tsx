import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { canPublishApartment } from "@/lib/data/apartments";
import type { Apartment, ApartmentImage } from "@/types/business";

export function ApartmentPublicationChecklist({
  apartment,
  images,
}: {
  apartment: Partial<Apartment>;
  images: ApartmentImage[];
}) {
  const result = canPublishApartment(apartment, images);
  return (
    <div className={`rounded-sm border p-4 ${result.ok ? "border-emerald-400/20 bg-emerald-400/5" : "border-amber-400/20 bg-amber-400/5"}`}>
      <div className="flex items-center gap-2">
        {result.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />}
        <p className="text-sm font-medium">{result.ok ? "Pret a publier" : "Publication incomplete"}</p>
      </div>
      {!result.ok && (
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {result.missing.map((item, index) => <li key={`publication-missing-${item}-${index}`}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}
