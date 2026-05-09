# Phase 06 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: phase 01~05 산출물 통합 검증, legacy 잔재 0건 증명, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상 phase 산출물: type/service/action (1) + DashboardHeader (2) + BudgetHero/IncomeExpense (3) + CategoryDistribution (4) + RecentActivity/page 정리 (5).
- legacy 잔재 후보: `WelcomeSection`, `StatsCards`, `RecurringExpenseCard` — 모두 삭제됐어야 함.
- `_shared/common-pitfalls.md § 1-8` 패턴 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` 출력 후 어느 phase 산출물이 회귀를 만들었는지 식별 + 보고.

### 2. Legacy 컴포넌트 삭제 검증

```bash
test ! -e src/components/dashboard/WelcomeSection.tsx
test ! -e src/components/dashboard/StatsCards.tsx
test ! -e src/components/dashboard/RecurringExpenseCard.tsx

grep -rn 'WelcomeSection\|StatsCards\|RecurringExpenseCard' src/ | wc -l   # = 0
```

### 3. 신규 컴포넌트 / action / type 등록 확인

```bash
test -f src/components/dashboard/DashboardHeader.tsx
test -f src/components/dashboard/BudgetHeroCard.tsx
test -f src/components/dashboard/IncomeExpenseStats.tsx
test -f src/components/dashboard/CategoryDistribution.tsx
test -f src/lib/utils/category-tone.ts
test -f src/actions/dashboard/get-monthly-category-breakdown-action.ts

grep -n 'CategoryBreakdownItem\|MonthlyCategoryBreakdown' src/types/dashboard.ts | wc -l   # >= 2
grep -n 'createdBy' src/types/dashboard.ts | wc -l                                          # >= 1
grep -cE '^\s*--color-cat-' src/app/globals.css                                             # >= 20
```

### 4. page.tsx 5섹션 순서

```bash
node -e "const s=require('fs').readFileSync('src/app/(authenticated)/dashboard/page.tsx','utf8'); const order=['<DashboardHeader','<BudgetHeroCard','<IncomeExpenseStats','<CategoryDistribution','<RecentActivity']; let last=-1; for (const c of order) { const i=s.indexOf(c); if (i<0||i<=last) { console.error('order broken at',c); process.exit(1) } last=i; } console.log('order ok'); process.exit(0)"
```

### 5. Hardcoded 색 잔재 0건 (plan001 효과 회귀 방지)

```bash
# 신규 컴포넌트가 hex/hsl/rgb 직접 색을 쓰지 않는지 — 모두 토큰 사용
grep -rnE '#[0-9a-fA-F]{6}\b|hsl\(|rgb\(' src/components/dashboard/ \
  | grep -vE 'rgba\(255,\s*255,\s*255'   # white film 의도 예외만 허용
# 결과 0줄
```

### 6. `index.json` + 본 phase status → `completed`

```bash
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan002-dashboard-redesign/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan002-dashboard-redesign/index.json
grep -c '"status": "completed"' tasks/plan002-dashboard-redesign/index.json   # = 7 (top + 6 phases)

sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan002-dashboard-redesign/phase-06.md
grep '^\*\*Status\*\*:' tasks/plan002-dashboard-redesign/phase-06.md   # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan002-dashboard-redesign/index.json` | 모든 status `completed` |
| `tasks/plan002-dashboard-redesign/phase-06.md` | 본 파일 status `completed` |

## Out of Scope

- 시각 회귀 비교 스크린샷 — 수동 smoke 항목으로만 (이전 phase 들에 분산)
- backend issue 등록 (createdBy 부재 케이스) — plan003+ 에서 사용자 결정

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep 의 false positive (예: 주석 안 문자열) | grep 패턴 구체화. JSX 태그 패턴 (`<X` 형태) 또는 라인 시작 (`^`) 앵커 사용 |
| macOS BSD `sed -i ''` vs Linux GNU `sed -i` | 본 plan 은 macOS 환경 가정 (fos-blog 와 동일). CI 검증 필요 시 perl 대체 검토 |
