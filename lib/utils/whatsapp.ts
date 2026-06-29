import { site } from "@/lib/constants/site";

export function buildWhatsAppUrl(message?: string): string {
  const number = site.whatsappNumber.replace(/[^0-9]/g, "");
  const text = message
    ? `?text=${encodeURIComponent(message)}`
    : "";
  return `https://wa.me/${number}${text}`;
}
