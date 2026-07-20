export type DataResult<T> =
  | { ok: true; data: T; source: "supabase" }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };

export function dataSuccess<T>(data: T): DataResult<T> {
  return { ok: true, data, source: "supabase" };
}

export function dataFailure(error: unknown, fallbackCode = "DATA_UNAVAILABLE"): DataResult<never> {
  const candidate = error as { code?: string; message?: string } | null;
  return {
    ok: false,
    error: {
      code: candidate?.code || fallbackCode,
      message: "Les données demandées sont indisponibles.",
      retryable: !candidate?.code || candidate.code.startsWith("5") || candidate.code === "PGRST000",
    },
  };
}
