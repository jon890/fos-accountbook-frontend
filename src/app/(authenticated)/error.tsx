"use client";

import { PageError } from "@/components/common/PageError";

/**
 * 인증 라우트 전역 에러 바운더리
 * 하위 라우트에서 error.tsx가 없으면 이 파일이 대신 처리
 */
export default function AuthenticatedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <PageError reset={reset} />;
}
