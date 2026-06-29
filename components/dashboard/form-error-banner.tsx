"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function FormErrorBannerInner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <div
      className="mb-4 rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      {error}
    </div>
  );
}

export function FormErrorBanner() {
  return (
    <Suspense fallback={null}>
      <FormErrorBannerInner />
    </Suspense>
  );
}
