# Phase 03 — BudgetHeroCard + IncomeExpenseStats (StatsCards 분해)

**Model**: sonnet
**Status**: pending
**Goal**: 기존 `StatsCards` 를 두 개의 의미 단위 컴포넌트로 분해 — Teal gradient hero (잔여 예산) + Income/Expense pair.

## Context (자기완결)

- 기존 `src/components/dashboard/StatsCards.tsx` 가 4개 metric (expense/income/remainingBudget/familyMembers) 를 한 카드 안에 묶고 있음. 핸드오프는 1+2 (Hero 큰 카드 + Income/Expense pair) 로 시각 분리.
- 참조 mockup:
  - mobile: `mobile.jsx` line 140~182 (BudgetHero + MiniStat 2-grid)
  - desktop: `desktop.jsx` line 169~213 (Hero 1.4fr + DTStatCard 2개)
- plan001 의 `gradient-primary` 클래스 (Teal 50→500 OKLCH) 가 Hero 배경에 활용 가능. 핸드오프는 `linear-gradient(135deg, brand-500 → brand-600)` 패턴.
- 토큰 (`bg-bg-elev`, `border-border`, `text-fg`, `--shadow-default`) 모두 plan001 에서 등록 완료.

## 작업 항목

### 1. `BudgetHeroCard` 신규

`src/components/dashboard/BudgetHeroCard.tsx`. Props: `remainingBudget: number`, `monthlyExpense: number`, `budget: number`, `daysRemaining: number`.

내부 계산: `pct = Math.min(100, round(monthlyExpense / budget * 100))`. budget=0 케이스는 "예산 미설정" 안내 + progress bar 숨김.

Layout: Teal gradient (`gradient-primary` 또는 inline `linear-gradient`) 카드. 라벨 → 큰 num (mobile 38px / desktop 44px) → progress bar → 사용량/총예산 + "X일 남음" pill. `.num` 클래스로 Inter tabular-nums 적용.

### 2. `IncomeExpenseStats` 신규

`src/components/dashboard/IncomeExpenseStats.tsx`. Props: `monthlyIncome: number`, `monthlyExpense: number`. (delta vs 전월 은 plan002 범위 외 — 우선 수치만)

Layout 모바일: 2-grid `MiniStat`. 데스크톱: 동일 props 로 `DTStatCard` 변형 (label 좀 더 큼, icon tinted bg). 같은 컴포넌트 안에서 Tailwind responsive (`md:px-6` 등) 로 처리. 색은 `text-income` / `text-expense` 토큰.

### 3. page.tsx 통합

`StatsCards` import 제거 + `BudgetHeroCard` + `IncomeExpenseStats` 호출. props 는 기존 `statsData` 에서 직접 분리 매핑. `daysRemaining` 은 클라 계산 (`new Date()` 기반 — Server Component 안에서 OK).

### 4. `StatsCards.tsx` 삭제

```bash
grep -rn 'StatsCards' src/   # 사용처 0 확인 후
git rm src/components/dashboard/StatsCards.tsx
```

### 5. 자동 verification

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/dashboard/BudgetHeroCard.tsx
test -f src/components/dashboard/IncomeExpenseStats.tsx
test ! -e src/components/dashboard/StatsCards.tsx
grep -rn 'StatsCards' src/ | wc -l   # = 0

# Teal gradient 사용
grep -nE 'gradient-primary|brand-500.*brand-600' src/components/dashboard/BudgetHeroCard.tsx | wc -l   # >= 1

# .num 클래스 사용 (수치 tabular-nums)
grep -n 'className="num\|className={[^}]*num' src/components/dashboard/BudgetHeroCard.tsx src/components/dashboard/IncomeExpenseStats.tsx | wc -l   # >= 2
```

수동 smoke: `/dashboard` → Hero gradient + 잔여 예산 + progress + Income/Expense 2-card. budget=0 시 "예산 미설정" 표시.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/dashboard/BudgetHeroCard.tsx` | 신규 |
| `src/components/dashboard/IncomeExpenseStats.tsx` | 신규 |
| `src/app/(authenticated)/dashboard/page.tsx` | 수정 (import 교체) |
| `src/components/dashboard/StatsCards.tsx` | 삭제 |

## Out of Scope

- 전월 대비 delta % (handoff DTStatCard.delta) — plan002 범위 외, plan003+ 에서 backend month param 도입 시
- "X일 남음" pill 위치 미세 조정 (mockup 데스크톱은 우상단, 모바일은 progress 아래)
- DashboardHeader / CategoryDistribution / RecentActivity (다른 phase)

## Risks

| 리스크 | 완화 |
|---|---|
| budget=0 시 ZeroDivisionError 또는 100% 표시 | 명시 분기 — pct 계산 전 가드, 안내 문구 표시 |
| `gradient-primary` 클래스가 Teal 색 정확히 매핑 안 될 가능성 | plan001 phase 01 검증으로 OKLCH 값 일치 확인됨. 시각 차이 시 inline `linear-gradient(135deg, var(--color-brand-500), var(--color-brand-600))` 명시 |
| Hero 카드 dark mode 가독성 | gradient 가 Teal 단색 조합이라 light/dark 동일. `text-white` 강제 (gradient 위 텍스트는 light/dark 무관) |
