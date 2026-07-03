import { OwnerForm } from "@/components/dashboard/owner-form";

export default function NewOwnerPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted-foreground">Dashboard / Propriétaires / Nouveau</p>
        <h1 className="mt-2 text-3xl font-semibold">Nouveau propriétaire</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajoutez un propriétaire qui souhaite confier un bien à Yakout.
        </p>
      </div>
      <OwnerForm />
    </div>
  );
}
