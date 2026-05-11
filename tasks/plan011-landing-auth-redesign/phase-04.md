# Phase 04 — auth layout + 라우팅 점검

**Model**: sonnet
**Status**: pending
**Goal**: 인증 안 한 사용자 = `/` Landing 표시 / 인증 사용자 = `/` 진입 시 `defaultFamilyUuid` 분기로 `/dashboard` 또는 `/families/create` redirect. page-level `auth()` 만으로 일관 동작.

## Context (자기완결)

- phase 01 에서 `src/app/page.tsx` 신규 (Landing) — 내부 `auth()` 으로 인증 사용자 분기 (defaultFamilyUuid 체크 포함)
- **middleware 부재**: 본 프로젝트에는 `src/middleware.ts` 도 `src/lib/server/middleware.ts` 도 없음. auth 게이트는 `src/app/(authenticated)/layout.tsx` 단독 처리. 따라서 본 phase 의 작업은 (authenticated) layout + 충돌하는 (authenticated)/page.tsx 처리에 집중.
- `src/app/(authenticated)/` route group 의 layout 이 인증 강제. 그 외 라우트는 자동 public.

## 작업 항목

### 1. middleware 부재 확인 (작업 skip)

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan011
find src -maxdepth 3 -name 'middleware.ts' 2>/dev/null
# 출력 0 줄이면 정상 — middleware 없음, 본 작업 skip
```

본 프로젝트는 middleware 가 없고 auth 게이트는 `(authenticated)/layout.tsx` 단독. 따라서 public matcher 추가 같은 작업은 불필요. 신 `src/app/page.tsx` 는 `(authenticated)` route group 밖에 있어 자동으로 인증 없이 진입 가능. handoff 라우팅 정책은 page-level + layout 으로만 구현.

### 2. `src/app/page.tsx` 인증 분기 (phase 01 에서 이미 구현 — 점검)

```tsx
const session = await auth();
if (session?.user) {
  const defaultFamilyUuid = session.user.profile?.defaultFamilyUuid;
  if (!defaultFamilyUuid) redirect("/families/create");
  redirect("/dashboard");
}
return <LandingPage />;
```

이 분기는 page 자체에서 처리. 인증 사용자는 `defaultFamilyUuid` 유무에 따라 `/families/create` 또는 `/dashboard` 로 보낸다. 기존 `(authenticated)/page.tsx` 의 분기 로직을 그대로 인계.

### 3. `(authenticated)` route group layout 점검

`src/app/(authenticated)/layout.tsx` 의 인증 강제 로직 점검. session 없으면 `/auth/signin` 이 아닌 `/` (Landing) 으로 redirect 변경:

```tsx
// 변경 전
if (!session?.user) redirect("/auth/signin");

// 변경 후
if (!session?.user) redirect("/");
```

이유: 인증 안 한 사용자가 protected page 직접 URL 입력 시 Landing 으로 안내 (CTA 클릭으로 자연스러운 signin 진입). 단 middleware 가 이미 처리하면 layout 분기는 방어 코드 (도달 안 함) — 그래도 변경 일관성 유지.

### 4. `src/app/(authenticated)/page.tsx` 정리

기존 `(authenticated)/page.tsx` 가 dashboard redirect 했다면, route group 의 `/` 인덱스 — 본 plan 에서 `src/app/page.tsx` 가 우선이라 충돌. 둘 중 하나 삭제:

- `src/app/(authenticated)/page.tsx` 삭제 (route group 의 / 인덱스는 더 이상 의미 없음)
- 또는 `src/app/page.tsx` 단독으로 / 처리

App Router 의 route group 은 URL 에 영향 없음 — `(authenticated)/page.tsx` 와 `page.tsx` 가 모두 `/` 라우트를 노리면 Next.js build error. 본 phase 시작 시 현재 상태 grep 으로 확인 후 삭제 대상 결정.

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan011
# branch: feat/plan011-landing-auth-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build   # build 가 / 라우트 충돌 시 즉시 실패

# middleware 부재 재확인 (없으면 정상)
find src -maxdepth 3 -name 'middleware.ts' | wc -l   # 0

# (authenticated)/layout redirect 변경 — /auth/signin → /
grep -nE 'redirect\(["\x27]/["\x27]\)' src/app/\(authenticated\)/layout.tsx

# / 라우트 단일 — src/app/page.tsx 만 존재, (authenticated)/page.tsx 삭제됨
test -f src/app/page.tsx
! test -f src/app/\(authenticated\)/page.tsx
```

수동 smoke:
1. 시크릿 창 → `/` 진입 → Landing 표시
2. 시크릿 창 → `/dashboard` 진입 → middleware 가 `/` 로 redirect (또는 `/auth/signin` — 정책 결정)
3. 로그인 후 → `/` 진입 → `/dashboard` 자동 redirect
4. 로그인 후 → `/auth/signin` 진입 → (선택) Landing 또는 dashboard 로 redirect — 본 phase 에선 페이지 노출 유지 (혼동 방지 목적 redirect 는 별도 plan)

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/layout.tsx` | unauth redirect 대상을 `/` 로 변경 |
| `src/app/(authenticated)/page.tsx` | 삭제 — 분기 로직은 phase-01 의 `src/app/page.tsx` 로 인계됨 (defaultFamilyUuid 포함) |

## Out of Scope

- `/auth/signin` 진입한 인증 사용자 자동 redirect — 본 phase 에선 페이지 그대로 노출. 별도 plan
- 로그인 후 returnTo URL 보존 — 본 plan 은 항상 `/dashboard` 직행
- Middleware matcher 패턴 전면 재설계 — 최소 변경만

## Risks

| 리스크 | 완화 |
|---|---|
| `/` 라우트 충돌 (App Router build error) | `find src/app -name 'page.tsx'` 로 사전 확인 후 (authenticated)/page.tsx 삭제 |
| `defaultFamilyUuid` 분기 누락 — 첫 가입 유저 dashboard 직행 후 빈 상태 | phase-01 의 신 `src/app/page.tsx` 가 분기 로직 인계 (`!defaultFamilyUuid → /families/create`). phase-01 verification 으로 사전 확인 |
| `(authenticated)/layout` redirect 변경이 deep link 경험 악화 | Landing CTA → `/auth/signin` 한 번 더 클릭. 트레이드오프 수용 (Landing 이 첫 진입의 일관 entry) |
