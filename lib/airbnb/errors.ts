export type AirbnbImportErrorCode =
  | "INVALID_AIRBNB_URL"
  | "AIRBNB_LOCAL_BROWSER_MISSING"
  | "AIRBNB_BROWSER_BINARY_MISSING"
  | "AIRBNB_BROWSER_LAUNCH_FAILED"
  | "AIRBNB_NAVIGATION_TIMEOUT"
  | "AIRBNB_NAVIGATION_FAILED"
  | "AIRBNB_BLOCKED"
  | "AIRBNB_LISTING_NOT_FOUND"
  | "AIRBNB_EXTRACTION_EMPTY"
  | "AIRBNB_EXTRACTION_FAILED"
  | "AIRBNB_INTERNAL_ERROR";

export type AirbnbImportStage = "validation" | "browser-resolution" | "browser-launch" | "navigation" | "extraction" | "cleanup" | "internal";

const messages: Record<AirbnbImportErrorCode, string> = {
  INVALID_AIRBNB_URL: "L’URL Airbnb n’est pas valide.",
  AIRBNB_LOCAL_BROWSER_MISSING: "Le navigateur nécessaire à l’analyse n’est pas installé sur cet ordinateur.",
  AIRBNB_BROWSER_BINARY_MISSING: "Le navigateur nécessaire à l’analyse est temporairement indisponible.",
  AIRBNB_BROWSER_LAUNCH_FAILED: "Le navigateur nécessaire à l’analyse n’a pas pu démarrer.",
  AIRBNB_NAVIGATION_TIMEOUT: "Airbnb met trop de temps à répondre. Réessayez dans quelques instants.",
  AIRBNB_NAVIGATION_FAILED: "Impossible d’ouvrir cette annonce. Vérifiez qu’elle est publique.",
  AIRBNB_BLOCKED: "Airbnb a refusé l’analyse automatique de cette annonce. Vous pouvez compléter la fiche manuellement.",
  AIRBNB_LISTING_NOT_FOUND: "Cette annonce Airbnb est introuvable ou n’est plus publique.",
  AIRBNB_EXTRACTION_EMPTY: "L’annonce a été ouverte, mais aucune information exploitable n’a été trouvée.",
  AIRBNB_EXTRACTION_FAILED: "L’analyse des informations de l’annonce a échoué.",
  AIRBNB_INTERNAL_ERROR: "Une erreur interne empêche temporairement l’analyse.",
};

export class AirbnbImportError extends Error {
  constructor(
    public readonly code: AirbnbImportErrorCode,
    public readonly internalMessage: string,
    public readonly stage: AirbnbImportStage,
    public readonly status: number,
    public readonly retryable: boolean,
    options?: { cause?: unknown },
  ) {
    super(internalMessage, options);
    this.name = "AirbnbImportError";
  }

  get publicMessage() { return messages[this.code]; }
}

export function normalizeAirbnbError(error: unknown, stage: AirbnbImportStage = "internal") {
  if (error instanceof AirbnbImportError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/Timeout|timed out/i.test(message)) return new AirbnbImportError("AIRBNB_NAVIGATION_TIMEOUT", message, "navigation", 504, true, { cause: error });
  return new AirbnbImportError("AIRBNB_INTERNAL_ERROR", message, stage, 500, true, { cause: error });
}

export const MANUAL_FALLBACK_CODES = new Set<AirbnbImportErrorCode>([
  "AIRBNB_BLOCKED", "AIRBNB_EXTRACTION_EMPTY", "AIRBNB_NAVIGATION_TIMEOUT", "AIRBNB_LISTING_NOT_FOUND",
]);
