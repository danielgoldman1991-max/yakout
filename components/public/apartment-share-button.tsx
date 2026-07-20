"use client";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ApartmentShareButton({ title }: { title: string }) { return <button type="button" onClick={async () => { if (navigator.share) await navigator.share({ title, url: location.href }).catch(() => {}); else { await navigator.clipboard.writeText(location.href); toast.success("Le lien de l’appartement a été copié."); } }} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold underline-offset-4 hover:bg-accent/10 hover:underline"><Share2 className="h-4 w-4" />Partager</button>; }
