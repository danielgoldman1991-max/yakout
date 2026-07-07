"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { convertLeadToOwnerAction } from "@/lib/data/owner-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Conversion en cours..." : "Convertir en proprietaire"}
    </Button>
  );
}

export function ConvertLeadToOwnerForm({ leadId }: { leadId: string }) {
  const [result, formAction] = useActionState(convertLeadToOwnerAction.bind(null, leadId), null);

  return (
    <form action={formAction}>
      {result && !result.success && (
        <div className="mb-3 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          <p>{result.error}</p>
          {result.debugCode && (
            <pre className="mt-2 whitespace-pre-wrap text-xs">
              Erreur technique [{result.debugCode}]
              {"\n"}
              {result.debugMessage}
              {"\n"}
              {result.debugDetails}
              {"\n"}
              {result.debugHint}
            </pre>
          )}
        </div>
      )}
      <SubmitButton />
    </form>
  );
}
