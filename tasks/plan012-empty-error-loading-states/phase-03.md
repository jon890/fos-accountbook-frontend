# Phase 03 — Loading skeleton (loading.tsx)

**Model**: sonnet
**Status**: pending
**Goal**: handoff Screen 15 적용 — Next.js App Router 의 `loading.tsx` 에 shimmer skeleton 표시. 페이지 진입 시 빈 화면 / hydration 깜빡임 제거.

## Context (자기완결)

- handoff 참조: `mobile-landing-auth.jsx` line 671~797 (MobileLoading + SHIMMER_CSS + Skel)
- App Router `loading.tsx`: route segment 의 Suspense boundary. Server Component pending 동안 표시
- 실제 코드 상태: `(authenticated)/loading.tsx`, `dashboard/loading.tsx`, `transactions/loading.tsx`, `settings/loading.tsx`, `categories/loading.tsx` 모두 **이미 존재** (현재 단순 spinner / 텍스트). 본 phase 는 **3개 기존 파일 교체** + `analytics/loading.tsx` **1개 신규 생성** + globals.css 에 shimmer 추가.

## 작업 항목

### 1. `Skel` 컴포넌트 + shimmer 애니메이션 + 글로벌 `(authenticated)/loading.tsx` 교체

`src/components/loading/Skel.tsx` 신규:

```ts
interface SkelProps {
  w?: string | number;   // default "100%"
  h?: number;            // default 12
  r?: number;            // border-radius, default 8
  className?: string;
}
```

shimmer 애니메이션은 `src/app/globals.css` 의 `@layer utilities` 블록 내부 (기존 `@keyframes float` line 272 부근) 옆에 추가:

```css
@keyframes ab-shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.ab-skel {
  background-color: var(--color-bg-muted);
  background-image: linear-gradient(
    90deg,
    transparent 0,
    color-mix(in srgb, var(--color-bg-muted), white 35%) 50%,
    transparent 100%
  );
  background-size: 200px 100%;
  background-repeat: no-repeat;
  animation: ab-shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}
```

`Skel` 컴포넌트는 `<div className="ab-skel" style={{ width, height, borderRadius }} />` 단순 wrapper.

이어서 `src/app/(authenticated)/loading.tsx` (기존 파일 교체) 를 generic skeleton 으로: 헤더 영역 (1 row) + 컨텐츠 영역 (3 card). `dashboard/transactions/analytics` 라우트별 loading 이 있는 경우 그쪽이 우선 적용되므로 본 generic 은 `/settings`, `/family`, `/categories` 같은 라우트의 폴백 역할.

### 2. Dashboard `loading.tsx` (기존 파일 교체)

`src/app/(authenticated)/dashboard/loading.tsx` 교체:

handoff 의 MobileLoading 구조 그대로:
- Header skeleton: 50%/22 + 32%/13
- Hero card skeleton: 40%/11 + 65%/30 + 100%/6 progress + 2-col stat (60%/10 + 80%/16) × 2
- Donut card skeleton: 35%/14 + 120/120 round + 4 legend rows
- List skeleton: 30%/11 + 4 rows (36/36 round + 70%/12 + 40%/10 + 70/14)

Server Component 로 작성 가능 (Skel 자체가 client 일 필요 없음 — CSS animation 만).

### 3. Transactions `loading.tsx` (기존 파일 교체)

`src/app/(authenticated)/transactions/loading.tsx` 교체:
- 헤더 skeleton (검색바 + filter chip)
- Tab skeleton (3 segment)
- List skeleton (8 row)

### 4. Analytics `loading.tsx` (신규)

`src/app/(authenticated)/analytics/loading.tsx` 신규:
- Period toggle skeleton
- Donut card + 2 stat card
- MonthlyTrendBar skeleton (12 bar 가변 높이)
- CategoryDetailList skeleton (6 row)

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan012
# branch: feat/plan012-empty-error-loading-states

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/loading/Skel.tsx
test -f src/app/\(authenticated\)/loading.tsx
test -f src/app/\(authenticated\)/dashboard/loading.tsx
test -f src/app/\(authenticated\)/transactions/loading.tsx
test -f src/app/\(authenticated\)/analytics/loading.tsx

# globals.css 에 ab-shimmer keyframe + .ab-skel 클래스
grep -nE 'ab-shimmer|\.ab-skel' src/app/globals.css | wc -l   # >= 2

# 교체된 4 loading 파일 + 신규 analytics 모두 Skel 사용
grep -l 'Skel' src/app/\(authenticated\)/loading.tsx src/app/\(authenticated\)/dashboard/loading.tsx src/app/\(authenticated\)/transactions/loading.tsx src/app/\(authenticated\)/analytics/loading.tsx | wc -l   # == 4
```

수동 smoke:
- DevTools Network throttle Slow 3G → 페이지 진입 → shimmer skeleton 표시 → 데이터 로드 후 실제 컨텐츠 교체
- 다크 모드 토글 → skeleton 톤이 자연스럽게 어두워짐 (`var(--color-bg-muted)` 토큰)

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/loading/Skel.tsx` | 신규 |
| `src/app/globals.css` | shimmer keyframe + .ab-skel 추가 (@layer utilities 내, @keyframes float 옆) |
| `src/app/(authenticated)/loading.tsx` | 교체 (generic 폴백 skeleton) |
| `src/app/(authenticated)/dashboard/loading.tsx` | 교체 |
| `src/app/(authenticated)/transactions/loading.tsx` | 교체 |
| `src/app/(authenticated)/analytics/loading.tsx` | 신규 |

## Out of Scope

- Suspense boundary 를 페이지 안에 별도 wrapping (route-level loading.tsx 외) — 본 plan 은 route loading 만
- Streaming SSR + partial pre-render — 별도 plan
- 다국어 alt text (skeleton 자체는 텍스트 없음)

## Risks

| 리스크 | 완화 |
|---|---|
| shimmer 애니메이션이 dark mode 에서 너무 밝음 | `color-mix` 가 var 기반 — dark `--color-bg-muted` 가 어두우니 자연스럽게 어두운 shimmer 됨. 수동 smoke 에서 확인 |
| skeleton 구조가 실제 페이지와 어긋나면 layout shift | handoff 의 구조 비율 (헤더/카드/리스트) 을 최대한 매치. 100% 일치는 불필요 (대략 윤곽이면 충분) |
| App Router 의 loading.tsx 가 Server Component 인데 CSS animation 작동? | CSS animation 은 SSR 무관 — 클라 페인트 시 발동. 문제 없음 |
| `.ab-skel` class 가 Tailwind purge 대상 | globals.css 정의 → Tailwind 가 purge 안 함 (Tailwind 는 @layer 외 CSS 보존) |
