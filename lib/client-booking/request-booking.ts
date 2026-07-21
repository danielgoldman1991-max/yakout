export type ClientRequestKind = "accommodation" | "package" | "transport" | "chauffeur" | "composite_stay";

export function classifyClientRequest(requestType: string): ClientRequestKind {
  if (requestType === "reservation") return "accommodation";
  if (requestType === "package") return "package";
  if (requestType === "transport") return "transport";
  if (requestType === "chauffeur") return "chauffeur";
  return "composite_stay";
}

export function clientRequestIdempotencyKey(leadId: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) throw new Error("INVALID_LEAD_ID");
  return `lead:${leadId}:primary`;
}

export function isClientRequestActionable(status?: string | null): boolean {
  return !["booked", "declined", "cancelled"].includes(status ?? "converted");
}
