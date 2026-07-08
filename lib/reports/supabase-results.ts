type SupabaseLikeResult = {
  error?: { message?: string; code?: string; details?: string } | null;
};

export function assertSupabaseResults(reportTitle: string, results: SupabaseLikeResult[]): void {
  const errors = results
    .map((result) => result.error)
    .filter((error): error is NonNullable<SupabaseLikeResult["error"]> => Boolean(error));

  if (errors.length === 0) return;

  const details = errors
    .map((error) => [error.code, error.message, error.details].filter(Boolean).join(" - "))
    .join(" | ");

  throw new Error(`${reportTitle} : requête Supabase échouée. ${details}`);
}
