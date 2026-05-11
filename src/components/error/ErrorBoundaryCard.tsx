"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface ErrorBoundaryCardProps {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
}

export function ErrorBoundaryCard({
  error,
  reset,
  homeHref = "/",
}: ErrorBoundaryCardProps) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5">
      <div className="max-w-[360px] w-full flex flex-col items-center text-center gap-5">
        <div className="size-[88px] rounded-full bg-expense/10 flex items-center justify-center">
          <AlertCircle className="size-11 text-expense" />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[22px] font-bold text-fg">문제가 발생했어요</p>
          <p className="text-[13.5px] text-fg-muted">잠시 후 다시 시도해주세요</p>
        </div>

        {isDev && (
          <div className="w-full bg-bg-elev border border-border rounded-xl p-3.5 text-left">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-fg-subtle mb-1.5">
              DEV ONLY
            </p>
            <p className="font-mono text-[12px] text-expense break-all">
              {error.message}
              {error.digest ? `\ndigest=${error.digest}` : ""}
            </p>
          </div>
        )}

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={reset}
            className="h-12 w-full rounded-xl bg-brand-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            다시 시도
          </button>
          <Link
            href={homeHref}
            className="text-[13px] font-semibold text-fg-muted hover:text-fg transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
