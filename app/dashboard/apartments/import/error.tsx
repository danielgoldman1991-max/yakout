"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ImportError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[airbnb-import-ui] unexpected boundary error", { message: error.message, digest: error.digest });
  }, [error]);
  return <Card className="mx-auto max-w-2xl space-y-4 p-6"><h2 className="text-xl font-semibold">Le module d’import a rencontré une erreur inattendue.</h2><p className="text-sm text-muted-foreground">Vous pouvez réessayer sans perdre les informations déjà saisies.</p>{error.digest && <p className="font-mono text-xs text-muted-foreground">Référence : {error.digest}</p>}<div className="flex gap-3"><Button type="button" onClick={reset}>Réessayer</Button><Button asChild variant="secondary"><Link href="/dashboard/apartments/import">Revenir au formulaire</Link></Button></div></Card>;
}
