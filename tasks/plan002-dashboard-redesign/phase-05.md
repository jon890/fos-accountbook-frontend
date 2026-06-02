# Phase 05 — DashboardClient 재구조화 + RecentActivity 입력자 아바타 + RecurringExpense 제거 + page.tsx 새 레이아웃

**Model**: sonnet
**Status**: pending
**Goal**: 거래 행에 입력자 아바타(부부 차별점) 추가 + DashboardClient wrapper 폐기 (page.tsx 가 모든 섹션을 직접 placement) + RecurringExpenseCard 제거 + QuickActions plan001 토큰 마이그레이션 + page.tsx 를 핸드오프 5섹션 + QuickActions + Calendar 순서로 정리.

## Context (자기완결)

- 현재 구조의 핵심 문제: `src/components/dashboard/DashboardClient.tsx` 가 `children + QuickActions + RecentActivity` 를 묶어서 RecentActivity 가 항상 children 뒤로 밀림. page.tsx 만 수정해서는 5섹션 순서 (Header→Hero→IncomeExpense→Category→Recent) 달성 불가. **DashboardClient 자체를 폐기하고 page.tsx 가 모든 섹션을 직접 배치**.
- `RecentActivity.tsx` (89줄): 거래 row 가 카테고리 아이콘 + 메모 + 금액. 입력자 정보 없음.
- 핸드오프 TxRow (`mobile.jsx` line 287~321): 좌 카테고리 아이콘 / 중 메모+카테고리·시간 / 우 금액(굵게) + **입력자 아바타 16px** 세로 정렬.
- phase 01 에서 `RecentExpense.createdBy?: { uuid, name }` 옵션 필드 추가됨. backend 응답 실제값 부재 시에도 옵션 필드 graceful (영역 conditional).
- `RecurringExpenseCard` (43줄): 사용자 결정으로 dashboard 에서 제거 (반복 지출 정보는 잔여 예산에 이미 반영).
- `QuickActions.tsx` (133줄): 사용자 결정으로 RecentActivity 다음 위치 유지. 단 plan001 토큰 마이그레이션 필요 (`text-gray-900` → `text-fg`, `text-gray-600` → `text-fg-muted`, `bg-white/80` → `bg-bg-elev/80`).
- 최종 dashboard 순서: `DashboardHeader → BudgetHeroCard → IncomeExpenseStats → CategoryDistribution → RecentActivity → QuickActions → CalendarView`.

## 작업 항목 (5개)

### 1. DashboardClient 폐기 + page.tsx 직접 배치

`src/components/dashboard/DashboardClient.tsx` 삭제. `page.tsx` 가 모든 섹션을 JSX 에 직접 배치:

```tsx
return (
  <>
    <DashboardHeader ... />
    <BudgetHeroCard ... />
    <IncomeExpenseStats ... />
    <CategoryDistribution breakdown={breakdownData} />
    <RecentActivity expenses={recentExpenses} />
    <QuickActions />
    <div className="my-6"><CalendarView /></div>
  </>
);
```

`RecentActivity` / `QuickActions` 가 client component 인 점은 그대로 (각자 `"use client"`). `Promise.all` 에서 `getRecurringExpensesTotalAction` 제거, `getMonthlyCategoryBreakdownAction` 추가.

### 2. RecentActivity 행 디자인 + 입력자 아바타

`src/components/dashboard/RecentActivity.tsx`. 핸드오프 TxRow 패턴으로 행 교체:
- 좌: 카테고리 아이콘 36px (`bg-[var(--color-cat-KEY-bg)] text-[var(--color-cat-KEY-fg)]` — KEY 는 canonical 키, phase 04 의 `category-tone.ts` 재사용).
- 중: 메모 (14px font-semibold, ellipsis) + 카테고리명 · 시간 (11.5px muted).
- 우: 금액 (14px font-bold, `.num` tabular-nums) + 입력자 아바타 16px (`expense.createdBy?.name` 존재 시 shadcn `<Avatar>` 첫 글자 fallback). createdBy 부재 시 16px 빈 spacer 로 우측 정렬 유지.

### 3. RecurringExpenseCard 삭제 + action 사용처 정리

```bash
# cwd: <worktree root>
grep -rn 'RecurringExpenseCard' src/   # 사용처 확인
git rm src/components/dashboard/RecurringExpenseCard.tsx

# action 사용처 점검 — dashboard 외 페이지에서도 사용 시 action 자체는 보존
grep -rn 'getRecurringExpensesTotalAction\|RecurringExpensesTotal' src/
```

`page.tsx` 에서 `getRecurringExpensesTotalAction` import + 호출 + `recurringTotal` 변수 + 조건부 렌더 모두 제거. action 파일 자체는 dashboard 외 사용처가 있으면 보존, 없으면 phase 06 grep 결과로 삭제 후보 보고.

### 4. QuickActions plan001 토큰 마이그레이션

`src/components/dashboard/QuickActions.tsx`. 하드코딩 색상 → plan001 토큰:
- `text-gray-900` → `text-fg`
- `text-gray-600` → `text-fg-muted`
- `bg-white/80` → `bg-bg-elev/80`
- `border-0` 유지 (Card 자체 border 정책 plan001 따름)

`gradient-expense` / `gradient-income` / `gradient-family` / `gradient-category` 클래스는 plan001 에 이미 등록되어 있어 그대로 유지.

### 5. 자동 verification

```bash
# cwd: <worktree root>
pnpm lint
pnpm tsc --noEmit
pnpm build

test ! -e src/components/dashboard/DashboardClient.tsx
test ! -e src/components/dashboard/RecurringExpenseCard.tsx
grep -rn 'DashboardClient\|RecurringExpenseCard' src/ | wc -l    # = 0

# 입력자 아바타 표시 로직
grep -nE 'createdBy' src/components/dashboard/RecentActivity.tsx | wc -l   # >= 1

# QuickActions 토큰 마이그레이션 — 하드코딩 색상 잔재 0
grep -nE 'text-gray-|bg-white/' src/components/dashboard/QuickActions.tsx | wc -l   # = 0

# page.tsx 7요소 순서 (5섹션 + QuickActions + Calendar)
node -e "const s=require('fs').readFileSync('src/app/(authenticated)/dashboard/page.tsx','utf8'); const order=['<DashboardHeader','<BudgetHeroCard','<IncomeExpenseStats','<CategoryDistribution','<RecentActivity','<QuickActions','<CalendarView']; let last=-1; for (const c of order) { const i=s.indexOf(c); if (i<0||i<=last) { console.error('order broken at',c); process.exit(1) } last=i; } console.log('order ok'); process.exit(0)"
```

수동 smoke: `/dashboard` → 7 요소 순서 정상. 거래 row 우측에 16px 아바타 (createdBy 있을 때).

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/dashboard/DashboardClient.tsx` | 삭제 |
| `src/components/dashboard/RecentActivity.tsx` | 수정 (행 디자인 + 입력자 아바타) |
| `src/components/dashboard/RecurringExpenseCard.tsx` | 삭제 |
| `src/components/dashboard/QuickActions.tsx` | 수정 (토큰 마이그레이션) |
| `src/app/(authenticated)/dashboard/page.tsx` | 수정 (DashboardClient wrapper 제거 + JSX 7요소 순서) |

## Out of Scope

- `getRecurringExpensesTotalAction` 자체 삭제 — dashboard 외 페이지 사용 여부에 따라 phase 06 또는 후속 plan 에서 결정
- 거래 행 클릭 → 상세 sheet (기존 동작 그대로 유지)
- "모두 보기" 링크 → /transactions (기존 그대로)
- CalendarView 내부 디자인 — plan001 토큰 자동 적용으로 충분
- QuickActions 메뉴 항목 자체 변경 (4개 그대로 유지)

## Risks

| 리스크 | 완화 |
|---|---|
| `createdBy` 가 모든 거래에서 부재 (phase 1 결과) | 입력자 아바타 영역 conditional. 부재 시 16px spacer 로 정렬 유지. plan003+ 에서 backend 점검 |
| DashboardClient 폐기로 RecentActivity / QuickActions 의 `"use client"` 경계 변경 | 두 컴포넌트 각자 이미 `"use client"`. wrapper 제거가 client 경계에 영향 없음 (`page.tsx` 는 server, 자식 client 컴포넌트 직접 import 가능) |
| QuickActions 토큰 마이그레이션이 시각 회귀 | 동일 hue 의 `text-fg` (OKLCH `0.x 0 0`) 와 기존 `text-gray-900` 의 미세 차이 — plan001 디자인 시스템 의도된 통일이라 회귀 아님 |
| page.tsx Promise.all 변경으로 다른 호출 영향 | `Promise.all` 배열 길이/순서 동시 갱신. tsc 타입 체크가 mismatch 잡음 |
