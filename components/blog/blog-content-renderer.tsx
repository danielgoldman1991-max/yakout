import { sanitizeHtml } from "@/lib/utils/sanitize-html";

function isHtmlContent(text: string): boolean {
  return /<\s*\/(p|div|ul|ol|li|h[1-6]|blockquote|pre)\s*>/.test(text);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(text: string): string {
  const blocks = text.split(/\n{2,}/);
  const fragments: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");
    const nonEmpty = lines.filter((l) => l.trim().length > 0);
    if (nonEmpty.length === 0) continue;

    const numberedCount = nonEmpty.filter((l) => /^\d+\.\s/.test(l.trim())).length;
    const isOrdered = numberedCount === nonEmpty.length && nonEmpty.length > 0;

    const bulletCount = nonEmpty.filter((l) => /^[-•*]\s/.test(l.trim())).length;
    const isBullet = bulletCount === nonEmpty.length && nonEmpty.length > 0;

    if (isOrdered) {
      const items = nonEmpty
        .map((l) => `<li>${escapeHtml(l.replace(/^\d+\.\s*/, ""))}</li>`)
        .join("");
      fragments.push(`<ol>${items}</ol>`);
    } else if (isBullet) {
      const items = nonEmpty
        .map((l) => `<li>${escapeHtml(l.replace(/^[-•*]\s*/, ""))}</li>`)
        .join("");
      fragments.push(`<ul>${items}</ul>`);
    } else {
      const paragraphContent = lines
        .map((l) => escapeHtml(l))
        .join("<br />");
      fragments.push(`<p>${paragraphContent}</p>`);
    }
  }

  return fragments.join("\n");
}

interface BlogContentRendererProps {
  content: string;
}

export function BlogContentRenderer({ content }: BlogContentRendererProps) {
  if (!content) return null;

  const isHtml = isHtmlContent(content);
  const html = isHtml ? content : textToHtml(content);
  const sanitized = sanitizeHtml(html);

  return (
    <div
      className="space-y-5 text-[15px] leading-8 text-muted-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-lg [&_h3]:text-foreground [&_p]:leading-8 [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition [&_a:hover]:text-gold-light [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:my-8 [&_img]:rounded-sm [&_blockquote]:border-l-2 [&_blockquote]:border-gold/30 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground/80"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
