"use client";

import { deleteReservationAction } from "@/lib/data/actions";

export function DeleteReservationForm({ id }: { id: string }) {
  return (
    <form action={deleteReservationAction.bind(null, id)}
      onSubmit={(e) => { if (!confirm("Supprimer cette reservation ?")) e.preventDefault(); }}>
      <button type="submit" className="text-xs text-red-400 hover:text-red-300 underline">Supprimer</button>
    </form>
  );
}
