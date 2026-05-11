"use client";

import { ErrorBoundaryCard } from "@/components/error/ErrorBoundaryCard";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundaryCard error={error} reset={reset} />
      </body>
    </html>
  );
}
