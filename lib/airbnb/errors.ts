export type AirbnbImportErrorCode =
  | "INVALID_AIRBNB_URL"
  | "AIRBNB_AUTH_REQUIRED"
  | "AIRBNB_AUTHORIZATION_FAILED"
  | "AIRBNB_PROFILE_UNAVAILABLE"
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

export type AirbnbImportStage = "validation" | "authentication" | "authorization" | "browser-resolution" | "browser-launch" | "context-creation" | "page-creation" | "navigation" | "extraction" | "cleanup" | "internal";

export type NormalizedAirbnbError = {
  code: AirbnbImportErrorCode;
  publicMessage: string;
  internalMessage: string;
  stage: AirbnbImportStage;
  retryable: boolean;
  status: number;
};

export type AirbnbConfirmationStage =
  | "validation"
  | "owner-verification"
  | "duplicate-check"
  | "apartment-write"
  | "photo-import"
  | "import-audit";

export type NormalizedAirbnbConfirmationError = {
  code: string;
  publicMessage: string;
  internalMessage: string;
  stage: AirbnbConfirmationStage;
};

const definitions: Record<AirbnbImportErrorCode, Omit<NormalizedAirbnbError, "code" | "internalMessage" | "stage">> = {
  INVALID_AIRBNB_URL: { publicMessage: "L’URL Airbnb n’est pas valide.", retryable: false, status: 400 },
  AIRBNB_AUTH_REQUIRED: { publicMessage: "Votre session a expiré. Reconnectez-vous, puis relancez l’analyse.", retryable: false, status: 401 },
  AIRBNB_AUTHORIZATION_FAILED: { publicMessage: "Votre compte n’a pas la permission d’importer un appartement.", retryable: false, status: 403 },
  AIRBNB_PROFILE_UNAVAILABLE: { publicMessage: "Votre profil professionnel n’a pas pu être vérifié. Rechargez la page puis réessayez.", retryable: true, status: 503 },
  AIRBNB_LOCAL_BROWSER_MISSING: { publicMessage: "Le navigateur nécessaire à l’analyse n’est pas installé sur cet ordinateur.", retryable: false, status: 503 },
  AIRBNB_BROWSER_BINARY_MISSING: { publicMessage: "Le navigateur nécessaire à l’analyse est temporairement indisponible.", retryable: true, status: 503 },
  AIRBNB_BROWSER_LAUNCH_FAILED: { publicMessage: "Le navigateur nécessaire à l’analyse n’a pas pu démarrer.", retryable: true, status: 503 },
  AIRBNB_NAVIGATION_TIMEOUT: { publicMessage: "Airbnb met trop de temps à répondre. Réessayez dans quelques instants.", retryable: true, status: 504 },
  AIRBNB_NAVIGATION_FAILED: { publicMessage: "Impossible d’ouvrir cette annonce. Vérifiez qu’elle est publique.", retryable: true, status: 502 },
  AIRBNB_BLOCKED: { publicMessage: "Airbnb a refusé l’analyse automatique de cette annonce. Vous pouvez compléter la fiche manuellement.", retryable: true, status: 503 },
  AIRBNB_LISTING_NOT_FOUND: { publicMessage: "Cette annonce Airbnb est introuvable ou n’est plus publique.", retryable: false, status: 404 },
  AIRBNB_EXTRACTION_EMPTY: { publicMessage: "L’annonce a été ouverte, mais aucune information exploitable n’a été trouvée.", retryable: true, status: 422 },
  AIRBNB_EXTRACTION_FAILED: { publicMessage: "L’analyse des informations de l’annonce a échoué.", retryable: true, status: 500 },
  AIRBNB_INTERNAL_ERROR: { publicMessage: "Une erreur interne empêche temporairement l’analyse.", retryable: true, status: 500 },
};

export class AirbnbImportError extends Error {
  constructor(public readonly code: AirbnbImportErrorCode, public readonly internalMessage: string, public readonly stage: AirbnbImportStage, public readonly status: number, public readonly retryable: boolean, options?: { cause?: unknown }) {
    super(internalMessage, options);
    this.name = "AirbnbImportError";
  }
  get publicMessage() { return definitions[this.code].publicMessage; }
}

export function normalizeAirbnbError(error: unknown, fallbackStage: AirbnbImportStage = "internal"): NormalizedAirbnbError {
  const internalMessage = error instanceof Error ? error.message : String(error);
  let code: AirbnbImportErrorCode = "AIRBNB_INTERNAL_ERROR";
  let stage = fallbackStage;
  if (error instanceof AirbnbImportError) { code = error.code; stage = error.stage; }
  else if (/Timeout|timed out/i.test(internalMessage)) { code = "AIRBNB_NAVIGATION_TIMEOUT"; stage = "navigation"; }
  else if (/page\.(?:goto|content|title)|ERR_[A-Z_]+|navigat|execution context was destroyed/i.test(internalMessage)) { code = "AIRBNB_NAVIGATION_FAILED"; stage = "navigation"; }
  else if (fallbackStage === "browser-resolution") code = "AIRBNB_BROWSER_BINARY_MISSING";
  else if (["browser-launch", "context-creation", "page-creation"].includes(fallbackStage)) code = "AIRBNB_BROWSER_LAUNCH_FAILED";
  else if (fallbackStage === "navigation") code = "AIRBNB_NAVIGATION_FAILED";
  else if (fallbackStage === "extraction") code = "AIRBNB_EXTRACTION_FAILED";
  const definition = definitions[code];
  return { code, publicMessage: definition.publicMessage, internalMessage, stage, retryable: definition.retryable, status: definition.status };
}

export function createAirbnbImportError(error: unknown, stage: AirbnbImportStage) {
  if (error instanceof AirbnbImportError) return error;
  const normalized = normalizeAirbnbError(error, stage);
  return new AirbnbImportError(normalized.code, normalized.internalMessage, normalized.stage, normalized.status, normalized.retryable, { cause: error });
}

function errorRecord(error: unknown): Record<string, unknown> {
  return error && typeof error === "object" ? error as Record<string, unknown> : {};
}

export function normalizeAirbnbConfirmationError(
  error: unknown,
  stage: AirbnbConfirmationStage,
): NormalizedAirbnbConfirmationError {
  const record = errorRecord(error);
  const code = typeof record.code === "string" ? record.code : "AIRBNB_CONFIRMATION_FAILED";
  const internalMessage = [
    error instanceof Error ? error.message : typeof record.message === "string" ? record.message : String(error),
    typeof record.details === "string" ? record.details : "",
    typeof record.hint === "string" ? record.hint : "",
  ].filter(Boolean).join(" | ");

  let publicMessage = "L’enregistrement de l’appartement a échoué. Réessayez dans quelques instants.";
  if (code === "23505") {
    publicMessage = "Cette annonce est déjà liée à une fiche Yakout. Utilisez le mode de mise à jour.";
  } else if (code === "23503" || stage === "owner-verification") {
    publicMessage = "Le propriétaire sélectionné n’est plus disponible. Rechargez la page et choisissez-le à nouveau.";
  } else if (["PGRST204", "42703", "42P01"].includes(code)) {
    publicMessage = "La base Yakout n’est pas à jour pour cet import. La fiche n’a pas été créée.";
  } else if (["22P02", "42804"].includes(code)) {
    publicMessage = "Une valeur numérique de l’annonce est incompatible avec la fiche Yakout. Rechargez l’analyse puis réessayez.";
  } else if (code === "42501") {
    publicMessage = "La base Yakout a refusé l’enregistrement pour ce compte.";
  } else if (stage === "photo-import") {
    publicMessage = "La fiche n’a pas pu finaliser l’import de ses photos.";
  } else if (stage === "import-audit") {
    publicMessage = "La fiche a été préparée, mais son historique d’import n’a pas pu être enregistré.";
  }

  return { code, publicMessage, internalMessage, stage };
}

export const MANUAL_FALLBACK_CODES = new Set<AirbnbImportErrorCode>(["AIRBNB_BLOCKED", "AIRBNB_EXTRACTION_EMPTY", "AIRBNB_NAVIGATION_TIMEOUT", "AIRBNB_LISTING_NOT_FOUND"]);
