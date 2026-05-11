# Phase 03 — SignOut + AuthError 페이지 리디자인

**Model**: sonnet
**Status**: pending
**Goal**: handoff Screens 11~12 적용 — SignOut + AuthError 페이지 시각 갱신. phase 02 의 SignIn 카드 패턴 일관.

## Context (자기완결)

- 현재:
  - `src/app/auth/signout/page.tsx` — Server Component, 단순 로그아웃 메시지
  - `src/app/auth/error/page.tsx` — Server Component, NextAuth 에러 메시지
- handoff 참조:
  - Screen 11 SignOut: `mobile-landing-auth.jsx` line 361~412 + `desktop-landing-auth.jsx` line 398~445
  - Screen 12 AuthError: `mobile-landing-auth.jsx` line 414~478 + `desktop-landing-auth.jsx` line 447~488
- phase 02 의 카드 패턴 (bg-bg-elev / gradient-family round 로고 / center 정렬) 동일 적용.

## 작업 항목

### 1. SignOut 페이지

handoff Screen 11 패턴:

- 배경: `bg-bg`, 중앙 max-w-md 카드
- 상단: 64px round + `bg-bg-muted` (회색 톤 — 작별 인사) + 손 흔드는 아이콘 또는 LogOut (text-fg-muted)
- 제목: "로그아웃됐어요" (24px font-bold)
- 부제: "다시 만날 날을 기다릴게요" (14px text-fg-muted)
- CTA: "다시 로그인" → `/auth/signin` (`bg-brand-500 text-white w-full`)
- 보조 링크 (선택): "홈으로" → `/` (text-fg-muted)

### 2. AuthError 페이지

handoff Screen 12 패턴:

- 배경 + 카드 동일
- 상단: 64px round + `bg-expense/10` (warm coral 톤) + AlertCircle 아이콘 (text-expense)
- 제목: "문제가 발생했어요" (24px font-bold)
- 부제: 에러 원인 (NextAuth 의 `error` query param 매핑)
  - `OAuthAccountNotLinked` → "이미 다른 방법으로 가입된 계정이에요"
  - `OAuthSignin` / `Callback` → "로그인 중 오류가 발생했어요"
  - 기타 → "잠시 후 다시 시도해주세요"
- 디버그 (개발 환경만): 원본 에러 메시지 `text-fg-subtle 11px font-mono`
- CTA: "다시 시도" → `/auth/signin` (`bg-brand-500`)
- 보조: "고객 지원" 또는 "홈으로" → `/` (text-fg-muted 링크)

### 3. 공용 helper — `AuthCenterCard`

SignIn / SignOut / AuthError 가 동일 카드 wrapper 패턴 사용 — 공통 helper 추출:

`src/components/auth/AuthCenterCard.tsx`:

```ts
interface AuthCenterCardProps {
  iconBg: string;             // "gradient-family" / "bg-bg-muted" / "bg-expense/10"
  iconColor?: string;         // "text-white" / "text-fg-muted" / "text-expense"
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;  // CTA / form / extras
}
```

phase 02 의 SignIn 도 이 helper 사용으로 리팩토링 (phase 02 의 작업항목 추가 — 본 phase 시작 시 점검).

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/011-landing-auth-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/auth/AuthCenterCard.tsx

# 3 페이지에서 helper 사용
grep -rln 'AuthCenterCard' src/app/auth/ | wc -l   # >= 3 (signin/signout/error)

# 하드코딩 잔재 0
! grep -rnE 'app-background|glass-card|bg-red-50|text-red-700|text-gray-' \
  src/app/auth/

# CTA → 적절한 destination
grep -n 'href=["\x27]/auth/signin' src/app/auth/signout/page.tsx | wc -l   # >= 1
grep -n 'href=["\x27]/auth/signin' src/app/auth/error/page.tsx | wc -l   # >= 1
```

수동 smoke:
- `/auth/signout` → "로그아웃됐어요" 카드 + 다시 로그인 CTA
- `/auth/error?error=OAuthAccountNotLinked` → "이미 다른 방법으로 가입됐어요" + 다시 시도 CTA
- 개발 환경 `?error=foo` → 부제 + 원본 에러 디버그 표시

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/auth/AuthCenterCard.tsx` | 신규 |
| `src/app/auth/signout/page.tsx` | 수정 — AuthCenterCard 사용 |
| `src/app/auth/error/page.tsx` | 수정 — 동일 + 에러 매핑 |
| `src/app/auth/signin/page.tsx` | 수정 — phase 02 의 카드를 helper 호출로 리팩토링 |

## Out of Scope

- 에러 매핑 본격화 (전체 NextAuth 에러 코드 목록 매칭) — 본 plan 은 위 명시한 3 케이스 + default 메시지 ("잠시 후 다시 시도해주세요") 만 처리
- 고객 지원 페이지 / 채널 — 외부 링크 placeholder
- 자동 redirect (signout 후 N초 후 / 진입) — 즉시 카드 표시 유지

## Risks

| 리스크 | 완화 |
|---|---|
| AuthCenterCard 가 SignIn 의 form prop 까지 받는 구조라 prop 수 폭증 | children 으로 form 본문 위임. helper 는 wrapper 만 책임 |
| `bg-expense/10` alpha 변형 — phase 02 와 동일 검증 | 동일 alpha 토큰 패턴. phase 02 검증으로 사전 확인 |
| signout 페이지가 단순해 helper 도입이 오버엔지니어링 | 3 페이지가 같은 패턴 → 도입 가치 있음. 단 helper 가 20줄 미만이면 inline 도 OK |
