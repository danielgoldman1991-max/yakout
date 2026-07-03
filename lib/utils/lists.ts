export function normalizeStringArray(input?: string[] | string | null): string[] {
  const rawItems = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(/\n|,/)
      : [];

  const seen = new Set<string>();
  const items: string[] = [];

  for (const rawItem of rawItems) {
    const item = rawItem?.trim().replace(/^[-*]\s*/, "");
    if (!item) continue;
    const key = item.toLocaleLowerCase("fr");
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }

  return items;
}

export function normalizeListItems(items?: string[] | null): string[] {
  return normalizeStringArray(items);
}
