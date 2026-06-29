import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const settings = [
  { label: "Administrateur", value: "Maria" },
  { label: "Societe", value: "Yakout Conciergerie et Services" },
  { label: "Fuseau horaire", value: "Africa/Casablanca" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Parametres</p>
        <h1 className="mt-2 text-3xl font-semibold">Parametres</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Profils, roles et preferences generales.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {settings.map((s) => (
              <div key={s.label} className="grid grid-cols-[160px_1fr] items-center gap-4 text-sm">
                <span className="font-medium text-muted-foreground">{s.label}</span>
                <span>{s.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
