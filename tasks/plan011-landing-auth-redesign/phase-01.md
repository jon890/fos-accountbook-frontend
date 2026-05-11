# Phase 01 — Landing 페이지 (/) 신규

**Model**: sonnet
**Status**: pending
**Goal**: handoff Screen 9 (Landing) 신규 구현 — Hero + Features 3 (가족/카테고리/분석) + CTA + footer. login 전 사용자가 처음 보는 첫 진입 화면.

## Context (자기완결)

- 현재 `/` 라우트: `src/app/(authenticated)/page.tsx` → 인증 후 dashboard redirect. 로그인 안 한 사용자가 `/` 접근 시 middleware 가 `/auth/signin` 으로 redirect.
- handoff 결정: 로그인 안 한 사용자에게 Landing 표시 → CTA "지금 시작하기" 클릭 시 `/auth/signin` 진입.
- handoff 참조: `/tmp/handoff_plan011/fos-accountbook/project/screens/mobile-landing-auth.jsx` line 73~254 + `desktop-landing-auth.jsx` line 6~283.

## 작업 항목

### 1. `src/app/page.tsx` 신규 (Landing — Server Component)

기존 `src/app/(authenticated)/page.tsx` 는 `defaultFamilyUuid` 분기 (없으면 `/families/create`, 있으면 `/dashboard`) — phase-04 에서 삭제 예정. 본 phase 의 새 `src/app/page.tsx` 가 `/` 의 실제 진입점이 되며, **인증 사용자 분기 로직을 그대로 포팅**:

```tsx
// src/app/page.tsx
import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    const defaultFamilyUuid = session.user.profile?.defaultFamilyUuid;
    if (!defaultFamilyUuid) {
      redirect("/families/create");
    }
    redirect("/dashboard");
  }
  return <LandingPage />;
}
```

이유: `(authenticated)/page.tsx` 의 분기는 **첫 가입 유저 온보딩의 유일한 게이트** — 가족 없는 상태에서 `/dashboard` 직행 시 빈 상태. 신 `page.tsx` 가 이 책임을 인계받지 않으면 온보딩 회귀.

**middleware 부재 확인**: 본 프로젝트에는 `src/middleware.ts` / `src/lib/server/middleware.ts` 둘 다 없음. auth 게이트는 `src/app/(authenticated)/layout.tsx` 단독 처리. 따라서 본 phase 에서 middleware public route 작업은 불필요 — 신 `src/app/page.tsx` 는 `(authenticated)` route group 밖이라 자동으로 인증 없이 진입 가능.

### 2. `LandingPage` 컴포넌트 (메인 client)

`src/components/landing/LandingPage.tsx` 신규. handoff 구조:

- **Top bar**: 좌측 로고 (28px brand-500 round + "f" + brand-700 텍스트) + 우측 "로그인" 텍스트 링크
- **Hero**:
  - Badge: "부부를 위한 가계부" (`bg-bg-elev border-border + brand-500 dot`)
  - H1: 36~56px font-extrabold tracking-tight `text-fg`
  - 부제: `text-fg-muted` 15px
  - 배경 그라디언트: `linear-gradient(180deg, oklch(0.975 0.025 188) 0%, var(--ab-bg) 320px)`
  - 큰 CTA: "지금 시작하기" → `/auth/signin` 으로 `<Link>` (button 스타일 `bg-brand-500 text-white rounded-md py-3 px-6 font-semibold`)
- **Features section** (모바일 stack / 데스크톱 3-col grid):
  - 각 카드는 `FeatureCard` (badge / title / sub) 구조
  - 1) 가족: `CoupleAvatars` 36px (plan002 재사용) + "부부가 같이 입력해요"
  - 2) 카테고리: `MiniDonut` 64px (handoff 신규 헬퍼) + "어디에 썼는지 한눈에"
  - 3) 분석: `MiniBars` 90×44 (handoff 신규) + "추세까지 한 화면에"
- **CTA section**: "지금 무료로 시작하기" 큰 버튼 + "Google · Naver 로 5초 만에 시작" 카피
- **Footer**: copyright + 이용약관 / 개인정보처리방침 (text-fg-subtle 11~12px)

### 3. mini 시각 컴포넌트 추출

handoff 의 `MiniDonut` / `MiniBars` 헬퍼는 plan002/006 의 작은 버전. `src/components/landing/MiniStats.tsx` 신규:

```ts
export function MiniDonut({ size = 64 }: { size?: number }) {
  // SVG donut — segments brand-500 + brand-300 + brand-100
}
export function MiniBars({ w = 90, h = 44 }: { w?: number; h?: number }) {
  // 7 bars, 마지막만 brand-500 강조
}
```

handoff 의 정확한 segment 비율 + bar height array 그대로 복제.

### 4. SEO + metadata

`src/app/page.tsx` 의 metadata export:

```ts
export const metadata: Metadata = {
  title: "fos-accountbook — 가족과 함께 쓰는 가계부",
  description: "부부가 같이 입력하고, 한눈에 보는 가족 가계부",
  openGraph: { ... },
};
```

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan011
# branch: feat/plan011-landing-auth-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/app/page.tsx
test -f src/components/landing/LandingPage.tsx
test -f src/components/landing/MiniStats.tsx

# defaultFamilyUuid 분기 포팅 확인
grep -n 'defaultFamilyUuid' src/app/page.tsx | wc -l   # >= 1

# Hero CTA → /auth/signin Link
grep -nE 'href=["\x27]/auth/signin' src/components/landing/LandingPage.tsx | wc -l   # >= 2 (top bar + Hero CTA)

# Features 3 카드
grep -n 'FeatureCard\|MiniDonut\|MiniBars\|CoupleAvatars' src/components/landing/LandingPage.tsx | wc -l   # >= 4

# 토큰만 사용 (하드코딩 색 0)
! grep -nE '#[0-9a-fA-F]{6}|text-gray-|bg-blue-' src/components/landing/LandingPage.tsx
```

수동 smoke: 시크릿 창 + `/` 진입 → Landing 표시. 로그인 시 `/dashboard` redirect. CTA 클릭 → `/auth/signin`.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/page.tsx` | 신규 (인증 안 한 사용자 — Landing 표시) |
| `src/components/landing/LandingPage.tsx` | 신규 |
| `src/components/landing/MiniStats.tsx` | 신규 (MiniDonut + MiniBars) |

## Out of Scope

- Auth signin/signout/error (phase 2~3)
- 인증 사용자가 `/` 접근 시 dashboard redirect — phase 4 의 라우팅 점검에서 처리
- Hero 배경 애니메이션 / Lottie — 정적 SVG 만
- 다국어 — 한국어만

## Risks

| 리스크 | 완화 |
|---|---|
| `defaultFamilyUuid` 분기 누락 시 첫 가입 유저 온보딩 회귀 | 신 `src/app/page.tsx` 가 기존 `(authenticated)/page.tsx` 의 분기를 그대로 포팅 (위 작업 1 코드 참조). phase-04 에서 (authenticated)/page.tsx 삭제 전까지 두 경로 모두 동일 동작 |
| LandingPage 가 client component 라 SEO 약화 | 메타데이터는 server `page.tsx` 가 export. LandingPage 자체는 인터랙션 (CTA Link) 만 → `"use client"` 없어도 무방. shadcn `<Button>` 도 server 동작 OK |
| MiniDonut SVG segment 비율이 handoff 와 불일치 | handoff 의 정확한 값 그대로 inline 복제. recharts 사용 안 함 (overkill) |
