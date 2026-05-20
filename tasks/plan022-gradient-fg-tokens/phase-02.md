# Phase 02 — 51 호출처 text-white 일괄 마이그레이션

**Model**: sonnet
**Status**: pending
**Goal**: 51 개 `text-white` 호출처를 ADR-F23 매핑 룰에 따라 `text-{brand,expense,income,warning}-fg` 로 일괄 교체. surface 위 (bg-bg-elev 등) 의 text-white 는 본 ADR 비대상 — 회귀 방지를 위해 사용처별 컨텍스트 확인 후 교체.

## Context (자기완결)

### 매핑 룰 (ADR-F23)

| 배경 패턴 | fg 토큰 |
|---|---|
| `gradient-budget` / `gradient-family` / `gradient-primary` / `gradient-category` / `bg-brand-*` / Avatar fallback brand | `text-brand-fg` |
| `gradient-expense` / `bg-expense` / `bg-destructive` | `text-expense-fg` |
| `gradient-income` / `bg-income` | `text-income-fg` |
| `bg-warning` | `text-warning-fg` |
| surface (`bg-bg-elev` / `bg-popover` 등) — 본 ADR 비대상 | 유지 또는 `text-fg` |

### 51 호출처 분포 (sample)

```
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/landing/LandingPage.tsx
src/components/empty/EmptyState.tsx
src/components/auth/SignInForm.tsx
src/components/layout/BottomNavigation.tsx
src/components/layout/Header.tsx
src/components/expenses/forms/ExpenseFilters.tsx
src/components/auth/AuthCenterCard.tsx
src/components/dashboard/QuickActions.tsx
src/components/dashboard/BudgetHeroCard.tsx
src/components/transactions/dialogs/EditTransactionDialog.tsx
src/components/error/ErrorBoundaryCard.tsx
src/components/recurring-expense/RecurringExpenseList.tsx
src/components/families/FamilySelector.tsx
src/components/common/LoadingSpinner.tsx
src/app/auth/signout/page.tsx
src/app/(authenticated)/settings/_components/SettingsPageClient.tsx
src/app/auth/error/page.tsx
src/app/auth/signin/page.tsx
```

## 작업 항목

### 1. 각 파일별 컨텍스트 확인 + 교체

각 파일에서 `text-white` 가 어떤 배경 위에 있는지 ancestor className 확인 후 매핑 룰 적용. **일괄 sed 금지** — 컨텍스트 무관 교체 시 surface 위 text-white 도 변경되어 dark mode 회귀 위험.

권장 도구: `mcp__plugin_oh-my-claudecode_t__ast_grep_replace` 또는 `mcp__plugin_oh-my-claudecode_t__ast_grep_search` 로 className 컨텍스트 추출.

수동 grep 으로 빠른 확인:

```bash
# 각 파일별 text-white 와 인접 className 확인
for f in $(grep -rln 'text-white' src --include='*.tsx'); do
  echo "═══ $f ═══"
  grep -nE 'text-white' "$f"
done
```

### 2. 카테고리별 매핑 사례

**brand-fg 적용** (gradient-budget / family / primary 위):
- `BudgetHeroCard.tsx` L23: `gradient-primary ... text-white` → `text-brand-fg`
- `SettingsPageClient.tsx` (gradient-primary Button) → `text-brand-fg`
- `Header.tsx` 로고 아이콘 wrapper (이미 brand-fg 적용 — ADR-F23 적용 범위에 명시) → 회귀 점검만
- `landing/LandingPage.tsx` Hero CTA → 배경 따라 결정
- `auth/AuthCenterCard.tsx` aside → 배경 따라 결정

**expense-fg 적용** (gradient-expense / bg-expense / destructive):
- `ui/button.tsx` L13 `destructive: "bg-destructive text-white"` → `text-expense-fg`
- `QuickActions.tsx` 의 expense gradient 버튼 → `text-expense-fg`
- `ExpenseFilters.tsx` / `EditTransactionDialog.tsx` 의 expense 강조 → 케이스별

**income-fg 적용**:
- `QuickActions.tsx` 의 income gradient 버튼 → `text-income-fg`
- `RecurringExpenseList.tsx` income 강조 부분

**비대상 (text-white 유지 또는 text-fg)**:
- `ui/badge.tsx` 의 default variant — surface 컨텍스트라 비대상 (단 className 분석 후 결정)
- `LoadingSpinner.tsx` — bg 가 transparent / surface 면 비대상

### 3. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan022-gradient-fg-tokens

pnpm lint
pnpm tsc --noEmit
pnpm build

# text-white grep — ADR-F23 적용 범위 안 (gradient/bg-expense/bg-income/bg-warning 인접) 0
# 단 surface 위 (bg-bg-elev 등) text-white 는 유지 가능
grep -rn 'text-white' src/components src/app --include='*.tsx' | \
  grep -v 'bg-bg-\|bg-popover\|bg-card\|bg-transparent' | wc -l   # << 5 (남으면 추가 검토)

# fg 토큰 사용 횟수
grep -rn 'text-brand-fg\|text-expense-fg\|text-income-fg\|text-warning-fg' \
  src/components src/app --include='*.tsx' | wc -l   # >= 40
```

수동 smoke:
- BudgetHeroCard (Dashboard) — Teal gradient + 흰 텍스트 자연 (light/dark 동일)
- Auth signin/signout 페이지 — Hero 배경 위 텍스트 자연
- Sign-out destructive 버튼 — expense red 위 흰 텍스트
- Header 로고 + AvatarFallback — brand-500 위 흰 텍스트
- BottomNavigation FAB — gradient 위 흰 텍스트
- Dark mode 전환 — 모든 강조 텍스트 contrast 유지

## Critical Files

| 영역 | 파일 수 | 예상 매핑 |
|---|---|---|
| dashboard | 2 (BudgetHeroCard, QuickActions) | brand-fg + expense-fg + income-fg |
| layout | 2 (Header, BottomNavigation) | brand-fg |
| auth | 4 (SignInForm, AuthCenterCard, signin/signout/error pages) | brand-fg |
| ui primitives | 2 (button.tsx, badge.tsx) | expense-fg (destructive), 케이스별 |
| 기타 | 10+ | 케이스별 |

## Out of Scope

- 토큰 정의 (phase-01)
- surface 위 text-white (text-fg 대체는 별도 plan 검토)
- emoji / SVG 색상 변경

## Risks

| 리스크 | 완화 |
|---|---|
| 컨텍스트 미식별로 surface 위 text-white 잘못 교체 | 각 파일 ancestor className 검토 후 교체. sed 일괄 금지. 의심 시 사용자 확인 |
| Tailwind v4 가 새 token utility 미인식 | phase-01 build 검증 통과 시 안전. 미인식 시 `text-[var(--color-*-fg)]` 폴백 |
| 51 파일 = 5 작업 한도 초과 | 카테고리별 묶음 (dashboard / layout / auth / ui / 기타) 5 묶음으로 처리. 항목 단위가 아닌 카테고리 단위 카운트 |
| Button destructive variant 회귀 (AlertDialog) | 모든 AlertDialogAction 호출처 (plan020 의 4 곳) 가 destructive variant 사용 — 마이그레이션 후 회귀 smoke 필수 |
