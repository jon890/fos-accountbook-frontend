# Phase 06 — 통합 검증 + legacy/신규/하드코딩 grep + completed 마킹

**Model**: haiku
**Status**: completed
**Goal**: phase 01~05 산출물 통합 검증, legacy/신규/하드코딩 잔재를 단일 grep step 으로 일괄 점검, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상 phase 산출물: type/service/action (1) + DashboardHeader (2) + BudgetHero/IncomeExpense (3) + CategoryDistribution (4) + RecentActivity/DashboardClient 폐기/QuickActions 토큰/page (5).
- 삭제 대상 legacy: `WelcomeSection`, `StatsCards`, `RecurringExpenseCard`, `DashboardClient` 4개.
- 신규 컴포넌트: `DashboardHeader`, `BudgetHeroCard`, `IncomeExpenseStats`, `CategoryDistribution`, `category-tone.ts`, `get-monthly-category-breakdown-action.ts`.
- `_shared/common-pitfalls.md § 1-8` 패턴 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목 (5개)

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: <worktree root>
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` 출력 후 어느 phase 산출물이 회귀를 만들었는지 식별 + 보고.

### 2. 통합 grep — legacy 삭제 + 신규 등록 + 하드코딩 잔재 일괄 점검

```bash
# cwd: <worktree root>
# 2-a. legacy 4개 파일 부재 + 참조 0
test ! -e src/components/dashboard/WelcomeSection.tsx
test ! -e src/components/dashboard/StatsCards.tsx
test ! -e src/components/dashboard/RecurringExpenseCard.tsx
test ! -e src/components/dashboard/DashboardClient.tsx
grep -rn 'WelcomeSection\|StatsCards\|RecurringExpenseCard\|DashboardClient' src/ | wc -l   # = 0

# 2-b. 신규 산출물 6개 실재
test -f src/components/dashboard/DashboardHeader.tsx
test -f src/components/dashboard/BudgetHeroCard.tsx
test -f src/components/dashboard/IncomeExpenseStats.tsx
test -f src/components/dashboard/CategoryDistribution.tsx
test -f src/lib/utils/category-tone.ts
test -f src/actions/dashboard/get-monthly-category-breakdown-action.ts

# 2-c. type / 토큰 등록
grep -n 'CategoryBreakdownItem\|MonthlyCategoryBreakdown' src/types/dashboard.ts | wc -l   # >= 2
grep -n 'createdBy' src/types/dashboard.ts | wc -l                                          # >= 1
grep -cE '^\s*--color-cat-' src/app/globals.css                                             # >= 20

# 2-d. plan001 토큰 회귀 — dashboard 컴포넌트가 hex/hsl/rgb 직접 색을 쓰지 않음 (rgba white film 의도 예외)
grep -rnE '#[0-9a-fA-F]{6}\b|hsl\(|\brgb\(' src/components/dashboard/ | wc -l   # = 0

# 2-e. plan001 클래스 실재 (gradient-primary)
grep -nE '^\s*\.gradient-primary\b' src/app/globals.css | wc -l   # >= 1

# 2-f. RecurringExpensesTotalAction 사용 잔재 (dashboard 외에서 사용 중인지 informational)
grep -rn 'getRecurringExpensesTotalAction' src/ || echo "RecurringExpensesTotalAction 사용처 0 — action 자체 삭제 후보 (plan003+)"
```

### 3. page.tsx 7요소 순서 (5섹션 + QuickActions + Calendar)

```bash
# cwd: <worktree root>
node -e "const s=require('fs').readFileSync('src/app/(authenticated)/dashboard/page.tsx','utf8'); const order=['<DashboardHeader','<BudgetHeroCard','<IncomeExpenseStats','<CategoryDistribution','<RecentActivity','<QuickActions','<CalendarView']; let last=-1; for (const c of order) { const i=s.indexOf(c); if (i<0||i<=last) { console.error('order broken at',c); process.exit(1) } last=i; } console.log('order ok'); process.exit(0)"
```

### 4. `index.json` + 본 phase status → `completed`

cross-platform 호환을 위해 `node` 기반 스크립트로 갱신 (BSD/GNU sed 차이 회피):

```bash
# cwd: <worktree root>
node -e "
const fs=require('fs');
const p='tasks/plan002-dashboard-redesign/index.json';
const j=JSON.parse(fs.readFileSync(p,'utf8'));
j.status='completed';
j.phases.forEach(ph=>ph.status='completed');
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
console.log('index.json updated');
"
node -e "
const fs=require('fs');
const p='tasks/plan002-dashboard-redesign/phase-06.md';
const c=fs.readFileSync(p,'utf8').replace(/^\*\*Status\*\*: pending$/m,'**Status**: completed');
fs.writeFileSync(p,c);
console.log('phase-06.md updated');
"

# 검증
grep -c '"status": "completed"' tasks/plan002-dashboard-redesign/index.json   # = 7 (top + 6 phases)
grep '^\*\*Status\*\*:' tasks/plan002-dashboard-redesign/phase-06.md           # = "**Status**: completed"
```

### 5. 단일 commit

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력 보고) 은 단일 commit 으로 묶음. commit message 에 phase 6 의 verification 결과 (모든 grep 통과 여부) 명시.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan002-dashboard-redesign/index.json` | 모든 status `completed` |
| `tasks/plan002-dashboard-redesign/phase-06.md` | 본 파일 status `completed` |

## Out of Scope

- 시각 회귀 비교 스크린샷 — 수동 smoke 항목으로만 (이전 phase 들에 분산)
- backend issue 등록 (createdBy / members 부재 케이스) — plan003+ 에서 사용자 결정
- `getRecurringExpensesTotalAction` 자체 삭제 — informational 보고만

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep 의 false positive (예: 주석 안 문자열) | grep 패턴 구체화. JSX 태그 패턴 (`<X` 형태) 또는 라인 시작 (`^`) 앵커 사용 |
| BSD vs GNU sed 환경 차이 | `node` 기반 스크립트로 통일 (cross-platform) |
