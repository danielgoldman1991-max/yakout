"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ConvertLeadToOwnerButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Conversion en cours..." : "Convertir en proprietaire"}
    </Button>
  );
}
