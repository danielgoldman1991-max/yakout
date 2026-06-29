const DANGEROUS_TAGS = /<\s*(script|iframe|embed|object|style|form|input|textarea|select|button|meta|link|base)\b[^>]*>/gi;
const DANGEROUS_ATTRS = /(\s+(on\w+|formaction|data|href|src|xlink:href)\s*=\s*["']?\s*(?:javascript|data|vbscript)\s*:[^"'\s>]*)/gi;
const ON_EVENT_ATTRS = /(\s+on\w+\s*=\s*["'][^"']*["'])/gi;

export function sanitizeHtml(html: string): string {
  const clean = html
    .replace(DANGEROUS_TAGS, "")
    .replace(DANGEROUS_ATTRS, "")
    .replace(ON_EVENT_ATTRS, "");
  return clean;
}
