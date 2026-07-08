"use client";

import { deleteReservationAction } from "@/lib/data/actions";
import { Button } from "@/components/ui/button";

export function DeleteReservationForm({ id }: { id: string }) {
  return (
    <form action={deleteReservationAction.bind(null, id)}
      onSubmit={(e) => { if (!confirm("Supprimer définitivement cette réservation ?")) e.preventDefault(); }}>
      <Button type="submit" variant="danger" className="text-sm">Supprimer définitivement</Button>
    </form>
  );
}
