# Phase 04 — page.tsx 데이터 페칭 통합 + 검증 + completed

**Model**: haiku
**Status**: pending
**Goal**: `/budget` 페이지가 3 Action 을 병렬 fetch 하도록 갱신. phase 01~03 결과 통합 + 검증 + index.json completed 마킹.

## 작업 항목

### 1. `budget/page.tsx` 갱신 — 3 Action 병렬

```tsx
import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyDailyStatsAction } from "@/actions/dashboard/get-monthly-daily-stats-action";
import { getMonthlyCategoryBreakdownAction } from "@/actions/dashboard/get-monthly-category-breakdown-action";

// year/month 는 stats 결과 의존 없이 server 시점 기준으로 미리 계산 (Promise.all 동시 호출 위해)
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;

const [stats, daily, breakdown] = await Promise.all([
  getDashboardStatsAction(),
  getMonthlyDailyStatsAction(year, month),
  getMonthlyCategoryBreakdownAction(),
]);
```

각 Action 결과를 `getActionDataOrDefault` 로 unwrap 후 `BudgetClient` 에 props 전달.
**중요 — 반환 형 차이**:
- `getMonthlyDailyStatsAction` → `ActionResult<DailyTransactionSummary[]>` (배열 그대로, `items` 래퍼 없음)
- `getMonthlyCategoryBreakdownAction` → `ActionResult<MonthlyCategoryBreakdown>` (`items` 필드 있음)

```tsx
<BudgetClient
  budget={...}
  monthlyExpense={...}
  remainingBudget={...}
  year={...}
  month={...}
  dailyExpenses={daily}              // DailyTransactionSummary[] 그대로
  categoryItems={breakdown.items}    // CategoryBreakdownItem[]
/>
```

`BudgetClient.tsx` 의 props 타입 확장 + 내부에서 `BudgetCumulativeLine` / `BudgetCategoryBars` 컴포넌트 배치. 통계 단락 (일 평균 / 남은 일수 / 권장 일 예산) 은 phase-01 결정대로 `BudgetClient` 내부 inline 으로 유지 (별도 `BudgetDailyStats` 컴포넌트 분리 금지 — phase-01 본문과 일관).

### 2. 레이아웃 구조

```
<div className="p-4 md:p-6 space-y-4 md:space-y-6">
  {/* 헤더 */}
  <BudgetHeader year={year} month={month} />

  {/* Hero + 3-col 통계 단락 — phase 01 결과 (BudgetClient 내부 inline) */}

  {/* 라인 차트 — phase 02 (budget > 0 시만) */}
  {hasBudget && <BudgetCumulativeLine dailyExpenses={daily} budget={budget} daysInMonth={daysInMonth} />}

  {/* 카테고리 top 5 — phase 03 */}
  <BudgetCategoryBars items={breakdown.items} budget={budget} monthlyExpense={monthlyExpense} />

  {/* 설정 링크 */}
  <Link href="/settings" />
</div>
```

데스크톱에서 라인 차트 + 카테고리 bar 를 2-col grid 로 배치하는 옵션 검토 (md+ `grid-cols-2` — 카테고리 bar 가 짧으면 라인 옆에 자연스럽게 들어감). 본 phase 에선 stack 유지 (mobile-first, desktop 도 stack 으로 충분).

### 3. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/013-budget-page-redesign

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

### 4. legacy 잔재 0

```bash
! grep -rnE 'text-muted-foreground|text-destructive|bg-card\b' \
  src/app/\(authenticated\)/budget/

# 신 컴포넌트 존재
test -f src/app/\(authenticated\)/budget/_components/BudgetCumulativeLine.tsx
test -f src/app/\(authenticated\)/budget/_components/BudgetCategoryBars.tsx
```

### 5. 수동 smoke

| 시나리오 | 기대 |
|---|---|
| 예산 0 + `/budget` | Hero 카드 자리에 EmptyState (예산 미설정) 카드 + CTA 만 표시. 라인 차트 / 카테고리 bar 미표시 |
| 예산 100만 + 월 지출 80만 | Hero 80% 사용률 + 라인 80만 도달 + 카테고리 top 5 정상 |
| 예산 100만 + 월 지출 110만 | Hero 초과 톤 + 라인 예산선 위 빨간 dot + ↑많음 라벨 |
| Dark mode | 모든 시각 요소 자연스러운 톤 |

### 6. index.json completed 마킹

`tasks/plan013-budget-page-redesign/index.json` 의 모든 `status` → `"completed"`, `completed_at` 필드 추가.

### 7. 최종 커밋

```bash
git add tasks/plan013-budget-page-redesign/index.json
git commit -m "chore(plan013): mark completed"
```

## Out of Scope

- 카테고리별 예산 설정 / 추적
- 월 비교 (전월 대비 추세)
- 예산 알림 임계 (80%/100%) UI 변경 — 이미 NotificationBell 처리
