import { createPackageAction } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/dashboard/form-error-banner";
import { PackageForm } from "@/components/dashboard/package_form";

export default function NewPackagePage() {
  return (
    <div className="space-y-5">
      <div><p className="text-sm text-muted-foreground">Dashboard / Packs / Nouveau</p><h1 className="mt-2 text-3xl font-semibold">Nouveau pack sejour</h1></div>
      <FormErrorBanner />
      <form action={createPackageAction} className="space-y-5">
        <PackageForm />
        <Button type="submit">Creer le pack</Button>
      </form>
    </div>
  );
}
