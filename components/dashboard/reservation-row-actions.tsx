"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Pencil, Trash2, Ban, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteReservationAction } from "@/lib/data/actions";

export function ReservationRowActions({ id, label, status }: { id: string; label: string; status: string }) {
  const router = useRouter();
  const canDelete = ["draft", "option", "expired", "cancelled"].includes(status);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions pour ${label}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/reservations/${id}`} className="cursor-pointer">
            <Eye className="mr-2 size-4" />
            Voir la réservation
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/reservations/${id}/edit`} className="cursor-pointer">
            <Pencil className="mr-2 size-4" />
            Modifier
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/payments/new?type=accommodation&reservationId=${id}`} className="cursor-pointer">
            <Banknote className="mr-2 size-4" />
            Ajouter un paiement
          </Link>
        </DropdownMenuItem>
        {["confirmed", "option", "draft"].includes(status) && (
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/reservations/${id}?action=cancel`} className="cursor-pointer">
              <Ban className="mr-2 size-4" />
              Annuler la réservation
            </Link>
          </DropdownMenuItem>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <Dialog>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-ruby cursor-pointer">
                  <Trash2 className="mr-2 size-4" />
                  Supprimer définitivement
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Supprimer définitivement cette réservation ?</DialogTitle>
                  <DialogDescription>
                    Cette action est irréversible. Préférez l&apos;annulation si la réservation a déjà été communiquée au client ou liée à un paiement.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => router.refresh()}>Conserver</Button>
                  <form action={deleteReservationAction.bind(null, id)}>
                    <Button type="submit" variant="danger">Supprimer définitivement</Button>
                  </form>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
