import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";

export function WhatsAppFloatingButton({ phone }: { phone?: string }) {
  const href = phone
    ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}`
    : buildWhatsAppUrl();

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elevation-3 shadow-[#25D366]/20 transition-all duration-300 hover:scale-105 hover:shadow-glow-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] max-sm:bottom-4 max-sm:right-4 max-sm:h-12 max-sm:w-12"
      aria-label="Contacter sur WhatsApp"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-0 transition-opacity duration-500 hover:animate-glowing" />
      <MessageCircle className="relative h-7 w-7" />
    </Link>
  );
}
