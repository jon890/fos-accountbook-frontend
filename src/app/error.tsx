"use client";

import { ErrorBoundaryCard } from "@/components/error/ErrorBoundaryCard";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundaryCard error={error} reset={reset} />;
}
