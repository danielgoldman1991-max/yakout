"use client";

import { changeReservationStatusAction } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";

export function CancelReservationForm({ id }: { id: string }) {
  return (
    <form action={changeReservationStatusAction.bind(null, id)}
      onSubmit={(e) => { if (!prompt("Motif d'annulation ?")) e.preventDefault(); }}>
      <input type="hidden" name="status" value="cancelled" />
      <Button type="submit" variant="danger" className="text-sm">Annuler la réservation</Button>
    </form>
  );
}
