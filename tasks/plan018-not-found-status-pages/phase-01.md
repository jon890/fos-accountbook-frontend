# Phase 01 — StatusCard + not-found.tsx + forbidden.tsx + error.tsx 갱신

**Model**: sonnet
**Status**: pending
**Goal**: 404 / 403 / 500 세 상태에 톤 차별화된 카드 (brand / warning / expense) 표시. 공용 `StatusCard` helper 신규 + Next.js 16 표준 컨벤션 파일 (`not-found.tsx`, `forbidden.tsx`) 신규 + 기존 `error.tsx` (plan012) 가 StatusCard 사용하도록 갱신.

## Context (자기완결)

- 현재 상태:
  - `src/app/(authenticated)/error.tsx` 존재 (plan012 머지 — main 에 있음)
  - `src/app/error.tsx`, `src/app/global-error.tsx` (plan012) 존재
  - `src/components/error/ErrorBoundaryCard.tsx` (plan012) 존재
  - `not-found.tsx` / `forbidden.tsx` 미존재 (default Next.js 404 표시)
  - `notFound()` / `forbidden()` 호출 0건
- Next.js 16 컨벤션:
  - `not-found.tsx`: Server Component OK. 일치 라우트 없거나 `notFound()` 호출 시
  - `forbidden.tsx`: Next.js 16 신규. `forbidden()` 호출 시 (기본 `unauthorized.tsx` 대안). 본 plan 은 forbidden.tsx 채택 (권한 없음 의미 명확)
  - `error.tsx`: `"use client"` 필수. props `{ error, reset }`

## 작업 항목

### 1. `StatusCard` 공용 helper 신규

`src/components/error/StatusCard.tsx` (Server Component OK — interactive 없음):

**StatusCard 는 Server Component 로 고정** (no `"use client"`) — 이벤트 핸들러 prop 안 받음. 직렬화 사고 + devMessage 클라이언트 번들 노출 회피. ADR-F22 의 RSC server/client 경계 정책 적용.

```ts
import { Compass, Lock, AlertCircle } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type StatusKind = "not-found" | "forbidden" | "error";

interface StatusCardProps {
  kind: StatusKind;
  title?: string;          // override default
  description?: string;    // override default
  // CTA 는 항상 Link (Server 직렬화 안전). reset() 같은 핸들러는 children 으로 Client 래퍼 주입
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  devMessage?: string;     // production 자동 숨김 — 서버측 분기
  children?: ReactNode;    // Client 래퍼 (예: ErrorResetButton) 주입 슬롯
}

const STATUS_MAP: Record<StatusKind, {
  icon: ComponentType<{ className?: string; size?: number | string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}> = {
  "not-found": {
    icon: Compass,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    title: "찾을 수 없어요",
    description: "주소를 다시 확인해 주세요",
  },
  "forbidden": {
    icon: Lock,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    title: "권한이 없어요",
    description: "이 가족 데이터에 접근할 수 없어요",
  },
  "error": {
    icon: AlertCircle,
    iconBg: "bg-expense/10",
    iconColor: "text-expense",
    title: "문제가 발생했어요",
    description: "잠시 후 다시 시도해주세요",
  },
};
```

**핵심 설계 결정 (PR #248 코드 리뷰 반영)**:
- **Server Component 고정** — 이벤트 핸들러 prop 미수용. `error.tsx` (`"use client"`) 가 CTA 핸들러 필요 시 `children` 슬롯에 Client 래퍼 주입
- **devMessage 서버측 분기** — `{process.env.NODE_ENV !== "production" && devMessage && (...)}` 가 빌드 시 production 트리에서 제외 → `error.message` 문자열이 클라이언트 번들에 미포함
- **primaryCta 단순 `{ label, href }`** — discriminated union 불필요 (link 전용). href/onClick 둘 다 undefined 인 컴파일 타임 허용 케이스 제거
- **icon 타입 `ComponentType<{ className?, size? }>`** — `LucideIcon` 의 lucide-react 버전별 export 차이 회피

구조:
- 외부 wrapper: `min-h-screen bg-bg flex items-center justify-center p-5`
- 카드: `max-w-[360px] w-full flex flex-col items-center text-center`
- 88px round + iconBg + iconColor + icon 44px
- title 22px font-bold tracking-tight text-fg
- description 13.5px text-fg-muted
- DEV ONLY 박스 — 서버측 분기 (위 결정 참조)
- primaryCta — 항상 `<Link href={...}>`
- secondaryCta `text-fg-muted text-sm font-semibold` (Link)
- children slot — CTA 영역 아래에 렌더 (Client 래퍼용)

### 1-2. `ErrorResetButton` Client 래퍼 신규

`src/components/error/ErrorResetButton.tsx` — `error.tsx` 의 `reset()` 호출만 담당. `devMessage` 노출 책임 없음:

```tsx
"use client";

interface ErrorResetButtonProps {
  reset: () => void;
  label?: string;
}

export function ErrorResetButton({ reset, label = "다시 시도" }: ErrorResetButtonProps) {
  return (
    <button
      type="button"
      onClick={reset}
      className="h-12 px-6 rounded-xl bg-brand-500 text-white font-semibold hover:opacity-90 transition-opacity"
    >
      {label}
    </button>
  );
}
```

이 래퍼만 `"use client"` — `error.tsx` 가 StatusCard (server) 의 `children` 으로 주입.

### 2. `src/app/not-found.tsx` 신규 (전역, public)

```tsx
import { StatusCard } from "@/components/error/StatusCard";

export default function NotFound() {
  return (
    <StatusCard
      kind="not-found"
      primaryCta={{ label: "홈으로", href: "/" }}
    />
  );
}
```

### 3. `src/app/(authenticated)/not-found.tsx` 신규

인증 사용자의 404 — `/dashboard` 로 보내기 + 보조로 "이전 페이지":

```tsx
export default function AuthenticatedNotFound() {
  return (
    <StatusCard
      kind="not-found"
      primaryCta={{ label: "대시보드로", href: "/dashboard" }}
    />
  );
}
```

### 4. `src/app/(authenticated)/forbidden.tsx` 신규

```tsx
export default function AuthenticatedForbidden() {
  return (
    <StatusCard
      kind="forbidden"
      primaryCta={{ label: "홈으로", href: "/dashboard" }}
      secondaryCta={{ label: "로그인 다시 시도", href: "/auth/signin" }}
    />
  );
}
```

### 5. 기존 `error.tsx` (plan012) 갱신 — StatusCard + ErrorResetButton

`src/app/error.tsx` / `src/app/global-error.tsx` / `src/app/(authenticated)/error.tsx` 의 기존 ErrorBoundaryCard 호출을 StatusCard + ErrorResetButton 로 교체:

```tsx
"use client";
import { StatusCard } from "@/components/error/StatusCard";
import { ErrorResetButton } from "@/components/error/ErrorResetButton";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusCard
      kind="error"
      secondaryCta={{ label: "홈으로", href: "/" }}
      devMessage={`${error.message}\ndigest=${error.digest ?? "-"}`}
    >
      <ErrorResetButton reset={reset} label="다시 시도" />
    </StatusCard>
  );
}
```

`error.tsx` 는 `"use client"` 필수 (Next.js 규약). 하지만 StatusCard 본체는 Server Component 로 렌더되어 `devMessage` 의 `process.env.NODE_ENV` 분기가 서버에서 평가됨 → production 빌드에서 dev JSX 자체가 트리에서 제외 → `error.message` 문자열 클라이언트 번들 미노출.

`ErrorBoundaryCard.tsx` 는 본 phase 에서 삭제 (StatusCard + ErrorResetButton 이 완전 대체). 본 phase 는 **삭제** 권장 (중복 회피).

### 6. 자동 verification (8단계 체크리스트 포함)

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/018-not-found-status-pages

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/error/StatusCard.tsx
test -f src/components/error/ErrorResetButton.tsx
test -f src/app/not-found.tsx
test -f src/app/\(authenticated\)/not-found.tsx
test -f src/app/\(authenticated\)/forbidden.tsx

# StatusCard 가 Server Component (no use client 첫 줄)
! head -1 src/components/error/StatusCard.tsx | grep -q 'use client'

# ErrorResetButton 만 use client
head -1 src/components/error/ErrorResetButton.tsx | grep -q 'use client'

# StatusCard 가 onClick prop 안 받음 (직렬화 안전)
! grep -nE 'onClick.*StatusCardProps|primaryCta.*onClick' src/components/error/StatusCard.tsx

# devMessage 서버측 분기 (process.env.NODE_ENV 가 컴포넌트 본문에 있음)
grep -n 'process.env.NODE_ENV' src/components/error/StatusCard.tsx | wc -l   # >= 1

# ErrorBoundaryCard 가 StatusCard 로 대체됨
[ ! -f src/components/error/ErrorBoundaryCard.tsx ] || \
  ! grep -rn 'ErrorBoundaryCard' src/ --include='*.tsx' --include='*.ts' | grep -v ErrorBoundaryCard.tsx

# error.tsx 들 모두 StatusCard 사용
grep -rn 'StatusCard' src/app/error.tsx src/app/global-error.tsx src/app/\(authenticated\)/error.tsx | wc -l   # >= 3

# 3 톤 매핑 존재
grep -nE 'bg-brand-50|bg-warning/|bg-expense/' src/components/error/StatusCard.tsx | wc -l   # >= 3

# 3 아이콘 import
grep -nE 'Compass|Lock|AlertCircle' src/components/error/StatusCard.tsx | wc -l   # >= 3
```

수동 smoke:
- 존재 안 하는 URL `/foo` (public) → not-found.tsx → brand Compass 카드
- 존재 안 하는 protected URL `/dashboard/foo` → (authenticated)/not-found.tsx → "대시보드로" CTA
- Action 에서 `forbidden()` 호출 (임시 테스트) → forbidden.tsx → warning Lock 카드
- `throw new Error("test")` (Dashboard 임시) → error.tsx → expense AlertCircle 카드 + DEV 박스
- production build → DEV 박스 미표시

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/error/StatusCard.tsx` | 신규 (Server Component — 이벤트 핸들러 prop 미수용) |
| `src/components/error/ErrorResetButton.tsx` | 신규 (Client 래퍼 — reset() 호출만) |
| `src/app/not-found.tsx` | 신규 |
| `src/app/(authenticated)/not-found.tsx` | 신규 |
| `src/app/(authenticated)/forbidden.tsx` | 신규 |
| `src/app/error.tsx` | StatusCard 호출로 갱신 |
| `src/app/global-error.tsx` | StatusCard 호출로 갱신 |
| `src/app/(authenticated)/error.tsx` | StatusCard 호출로 갱신 |
| `src/components/error/ErrorBoundaryCard.tsx` | 제거 (StatusCard 가 흡수) |

## Out of Scope

- `forbidden()` 호출 위치를 코드 전반에 추가 (예: 다른 가족 expense 접근 차단) — 본 plan 은 페이지 + 카드만, 호출은 후속 plan
- `unauthorized.tsx` (Next.js 16 401 컨벤션) — 인증 미통과는 redirect 유지
- 404 페이지 안에 검색 / 사이트맵 링크 — 단순 카드 유지

## Risks

| 리스크 | 완화 |
|---|---|
| `forbidden.tsx` 가 Next.js 16 stable 인지 확인 필요 | next 16 release note 점검. unstable 이면 본 plan 에서 forbidden.tsx 제외 + 권한 거부 케이스는 `(authenticated)/error.tsx` 가 status 분기로 처리하는 별도 plan 으로 분리 |
| ErrorBoundaryCard 제거 시 다른 PR 의 미머지 사용처 충돌 | grep 으로 사용처 확인 (현재 0). 미머지 PR 의 사용은 본 plan 머지 후 충돌 fix |
| StatusCard 의 children slot 이 server side 렌더링 시 Client 래퍼 hydration 미스매치 | React Server Components 표준 패턴 — Server 가 Client 컴포넌트를 children 으로 받는 것은 공식 권장. 미스매치 없음 |
| `error.message` 가 Sentry / 외부 로거에는 보내야 하는데 server side 분기로 막힘 | 본 plan 은 DEV UI 표시만 — 외부 로거 wiring 은 별도 plan. server side 분기는 UI 노출만 차단 |
| `bg-warning/10` 작동 안 함 | plan011/013/017 의 동일 패턴 — 작동 확인됨. 미작동 시 inline oklch |
