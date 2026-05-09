# Phase 05 — RecentActivity 입력자 아바타 + RecurringExpenseCard 제거 + page.tsx 새 레이아웃

**Model**: sonnet
**Status**: pending
**Goal**: 거래 행에 입력자 아바타(부부 차별점) 추가 + 더 이상 쓰지 않는 `RecurringExpenseCard` 제거 + page.tsx 를 핸드오프 5섹션 순서로 정리.

## Context (자기완결)

- 기존 `src/components/dashboard/RecentActivity.tsx` (89줄) — 거래 row 가 카테고리 아이콘 + 메모 + 금액. 입력자 정보 없음.
- 핸드오프 TxRow (`mobile.jsx` line 287~321): 좌 카테고리 아이콘 / 중 메모+카테고리·시간 / 우 금액(굵게) + **입력자 아바타 16px** 세로 정렬.
- phase 01 에서 `RecentExpense.createdBy?: { uuid, name }` 옵션 필드 추가됨. backend 응답에 실제 값이 있는지는 phase 01 commit message 에 기록.
- `RecurringExpenseCard` (43줄): 사용자 결정으로 dashboard 에서 제거 (반복 지출 정보는 잔여 예산에 이미 반영).
- 핸드오프 dashboard 4 섹션 + 우리는 `CalendarView` 유지 → 5 섹션 + 캘린더 = 페이지 순서: Header → Hero → IncomeExpense → Category → Recent → Calendar.

## 작업 항목

### 1. `RecentActivity` 행 디자인 갱신

`src/components/dashboard/RecentActivity.tsx`. 기존 row 를 핸드오프 TxRow 패턴으로 교체:
- 좌측: 카테고리 아이콘 (36px, `bg-[var(--color-cat-{X}-bg)] text-[var(--color-cat-{X}-fg)]` — phase 04 의 `category-tone.ts` 재사용).
- 중앙: 메모 (14px font-semibold, ellipsis) + 카테고리명 · 시간 (11.5px muted).
- 우측: 금액 (14px font-bold tabular-nums) + 입력자 아바타 16px 세로 정렬.

### 2. 입력자 아바타 표시

`expense.createdBy?.name` 존재 시 `<Avatar size={16}>` 렌더 (이름 첫 글자 또는 avatarUrl). 부재 시 자리 비움 — 우측 영역 align 흐트러지지 않게 빈 16px spacer 또는 conditional.

### 3. `RecurringExpenseCard` 삭제

```bash
grep -rn 'RecurringExpenseCard' src/   # 사용처 확인
git rm src/components/dashboard/RecurringExpenseCard.tsx
```

`page.tsx` 에서 `getRecurringExpensesTotalAction` import + 호출도 제거 (이번 plan 에서 다른 페이지에서 사용 여부 점검 필요. 사용처 0이면 action 도 제거 후보 — phase 6 grep 결과로 결정).

### 4. page.tsx 새 레이아웃

핸드오프 순서로 JSX 재배열:

```
DashboardHeader (phase 2)
BudgetHeroCard (phase 3)
IncomeExpenseStats (phase 3)
CategoryDistribution (phase 4)
RecentActivity (이 phase)
CalendarView (유지, 시각만 plan001 토큰 자동 적용)
```

`Promise.all` 의 4개 action → `recurringTotal` 제거하고 `getMonthlyCategoryBreakdownAction()` 추가 (phase 4 에서 일부 추가됐을 수 있음 — 중복 점검).

### 5. 자동 verification

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build

test ! -e src/components/dashboard/RecurringExpenseCard.tsx
grep -rn 'RecurringExpenseCard' src/ | wc -l   # = 0
grep -rn 'RecurringExpensesTotalAction' src/ | wc -l   # 0 또는 다른 페이지에서만

# 입력자 아바타 표시 로직
grep -nE 'createdBy' src/components/dashboard/RecentActivity.tsx | wc -l   # >= 1

# page.tsx 에서 5섹션 순서
node -e "const s=require('fs').readFileSync('src/app/(authenticated)/dashboard/page.tsx','utf8'); const order=['DashboardHeader','BudgetHeroCard','IncomeExpenseStats','CategoryDistribution','RecentActivity']; let last=-1; for (const c of order) { const i=s.indexOf('<'+c); if (i<=last) process.exit(1); last=i; } process.exit(0)"
```

수동 smoke: `/dashboard` → 5 섹션 + 캘린더 순서 정상. 거래 row 우측에 16px 아바타 (createdBy 있을 때).

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/dashboard/RecentActivity.tsx` | 수정 (행 디자인 + 입력자 아바타) |
| `src/components/dashboard/RecurringExpenseCard.tsx` | 삭제 |
| `src/app/(authenticated)/dashboard/page.tsx` | 수정 (action 정리 + JSX 순서) |

## Out of Scope

- `getRecurringExpensesTotalAction` 자체 삭제 — 다른 페이지(/expenses 등) 에서 사용 가능. phase 6 grep 결과에 따라 후속 plan 에서 결정
- 거래 행 클릭 → 상세 sheet (기존 동작 그대로 유지)
- "모두 보기" 링크 → /transactions (기존 그대로)
- CalendarView 내부 디자인 — plan001 토큰 자동 적용으로 충분, 추가 변경 없음

## Risks

| 리스크 | 완화 |
|---|---|
| `createdBy` 가 모든 거래에서 부재 (phase 1 결과) | 입력자 아바타 영역 conditional. 부재 시 "부부 차별점" 강조 약화 → plan003+ 에서 backend issue 등록 후 재방문 |
| RecurringExpenseCard 사용자가 의존하던 기능 상실 | 반복 지출 총액은 잔여 예산 계산에 이미 포함됨 — 사용자 메모리 결정 (이전 세션 합의) |
| page.tsx Promise.all 변경으로 다른 호출 영향 | `Promise.all` 배열 길이/순서 동시 갱신. tsc 타입 체크가 mismatch 잡음 |
