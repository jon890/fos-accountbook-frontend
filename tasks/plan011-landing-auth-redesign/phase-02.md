# Phase 02 — SignIn 페이지 리디자인

**Model**: sonnet
**Status**: pending
**Goal**: handoff Screen 10 (SignIn) 적용 — `app-background + Card` 패턴 폐기, `bg-bg-elev` 중앙 카드 + 소셜 로그인 (Google/Naver) 시각 일관.

## Context (자기완결)

- 현재: `src/app/auth/signin/page.tsx` — Server Component, `min-h-screen flex items-center justify-center app-background` + Card. 에러 박스 `bg-red-50 border-red-200 text-red-700` 하드코딩.
- 관련: `src/components/auth/SignInForm.tsx` + `GoogleIcon.tsx` + `NaverIcon.tsx`
- handoff 참조: `mobile-landing-auth.jsx` line 273~358 + `desktop-landing-auth.jsx` line 304~394
- plan010 결정: `app-background` / `glass-card` 폐기 — 이 페이지에도 동일 적용

## 작업 항목

### 1. signin page.tsx 배경 + 카드 토큰 교체

```tsx
// 변경 전
<div className="min-h-screen flex items-center justify-center app-background p-4">
  <Card className="w-full max-w-md">

// 변경 후
<div className="min-h-screen flex items-center justify-center bg-bg p-4">
  <Card className="w-full max-w-md bg-bg-elev border-border shadow-default">
```

handoff 패턴: hero 상단 gradient 살짝 (배경 `linear-gradient(180deg, oklch(0.975 0.025 188) 0%, var(--ab-bg) 240px)`) — 사용자 결정 따라 simple `bg-bg` 또는 light gradient.

본 plan 은 simple `bg-bg` 선택 — Landing 이 gradient 강조니 SignIn 은 조용한 카드 진입감.

### 2. 카드 상단 로고 + 제목

기존 `<CardTitle>우리집 가계부</CardTitle>` → handoff 패턴:

- 상단 96px round + `gradient-family` 배경 + Users 아이콘 white (plan010 FamiliesCreate 패턴 재사용)
- 제목: "우리집 가계부" (24px font-bold tracking-tight text-fg)
- 부제: "가족과 함께 관리하는 스마트 가계부" (14px text-fg-muted)

### 3. 에러/메시지 박스 토큰 교체

```tsx
// 변경 전
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">

// 변경 후
<div className="bg-expense/10 border border-expense/20 text-expense px-4 py-3 rounded-md">
```

`bg-expense/10` 처럼 alpha 표기 — Tailwind v4 가 OKLCH 토큰 alpha 변형 지원 (`oklch(... / 0.1)`).

### 4. SignInForm 소셜 버튼 시각 갱신

`src/components/auth/SignInForm.tsx` 현재 구조 점검 후 토큰 교체:

- Google 버튼: `bg-bg border-border text-fg hover:bg-bg-muted` + `<GoogleIcon size={20} />` + "Google 로 시작하기"
- Naver 버튼: `bg-[#03C75A] text-white hover:opacity-90` + `<NaverIcon size={18} />` + "네이버로 시작하기"
  - Naver brand 색은 외부 브랜드 가이드라인이라 예외 (ADR-F13 OKLCH 강제의 예외) — 주석 명시
- 버튼 사이 gap-3, 풀 너비

### 5. 하단 안내 토큰

```tsx
// 변경 전
<div className="text-center text-sm text-gray-500">

// 변경 후
<div className="text-center text-sm text-fg-muted">
```

### 6. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/011-landing-auth-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# 하드코딩 잔재 0 (Naver brand 색 #03C75A 는 예외)
! grep -nE 'app-background|glass-card|bg-red-50|text-red-700|text-gray-' \
  src/app/auth/signin/page.tsx \
  src/components/auth/SignInForm.tsx

# 신 토큰 사용
grep -nE 'bg-bg-elev|border-border|text-fg-muted|bg-expense/|gradient-family' \
  src/app/auth/signin/page.tsx \
  src/components/auth/SignInForm.tsx | wc -l   # >= 3

# Naver 브랜드 색은 예외 명시 주석 있음
grep -B1 '#03C75A' src/components/auth/SignInForm.tsx | grep -i 'brand\|예외\|exception' | wc -l   # >= 1
```

수동 smoke: `/auth/signin` → 중앙 카드 + gradient-family 로고 원형 + Google/Naver 버튼. 에러 상태 (URL `?error=foo`) → expense 톤 박스.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/auth/signin/page.tsx` | 배경 + 카드 + 에러 박스 + 안내 토큰 |
| `src/components/auth/SignInForm.tsx` | 소셜 버튼 시각 갱신 |

## Out of Scope

- SignOut / AuthError 페이지 (phase 3)
- 소셜 로그인 동작 자체 (NextAuth 콜백 흐름) — UI 만
- 이메일 로그인 추가 — 현재 소셜만, plan012+ 검토

## Risks

| 리스크 | 완화 |
|---|---|
| `bg-expense/10` 의 alpha 변형이 Tailwind v4 OKLCH 토큰에서 미작동 | plan001 의 `--color-expense` 가 OKLCH 평면 값 — Tailwind v4 가 자동 alpha 변형 지원 확인. 안 되면 inline `style={{ background: "oklch(0.620 0.180 25 / 0.1)" }}` |
| Naver brand 색 외부 가이드라인 변경 | 주석에 외부 brand color 명시. `oklch` 표기로도 가능하지만 hex 유지 (가이드라인 hex 정확 매치 우선) |
| gradient-family round 가 plan010 FamiliesCreate 와 시각 중복 | 동일 디자인 의도 — Auth/Family 진입 두 곳 모두 가족 도메인 강조. 일관성 유지 |
