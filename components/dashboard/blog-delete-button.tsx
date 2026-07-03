"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type BlogDeleteButtonProps = {
  action: () => void;
  variant?: "icon" | "full";
};

export function BlogDeleteButton({ action, variant = "icon" }: BlogDeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Supprimer definitivement cet article ? Cette action est irreversible.")) {
          e.preventDefault();
        }
      }}
    >
      {variant === "icon" ? (
        <button
          type="submit"
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground/60 transition hover:text-destructive"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <Button type="submit" variant="danger" className="w-full">
          Supprimer definitivement
        </Button>
      )}
    </form>
  );
}
