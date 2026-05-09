# Phase 04 — DateGroup + Row 디자인 (모바일 + 데스크톱 5-col grid)

**Model**: sonnet
**Status**: pending
**Goal**: 일자별 그룹 + 일일 합계 + Row 새 디자인 (모바일 카드형 / 데스크톱 5-col grid).

## Context (자기완결)

- phase 1 의 `groupTransactionsByDate` service + `DateGroup<T>` type 활용.
- handoff Mobile (mobile.jsx line 384~412):
  - 그룹 헤더: 날짜 (12.5px font-semibold text-fg-muted) + "합계 ₩X" (11.5px text-fg-subtle)
  - 카드: `bg-bg-elev rounded-md border-border` 안에 TxRow 여러 개, 행 간 divider
- handoff Desktop (desktop.jsx line 432~492):
  - 그룹 헤더: 날짜 (13px font-bold) + 합계 (12px font-semibold text-fg-muted)
  - DTTxRowFull: 5-col grid `44px 1fr 110px 28px 140px`
    - 컬럼 1: CatIcon 38px
    - 컬럼 2: memo + time
    - 컬럼 3: 카테고리 chip (tinted bg/fg)
    - 컬럼 4: 입력자 Avatar 22px
    - 컬럼 5: 금액 right-aligned, 15px font-bold
- plan002 의 `category-tone.ts` 헬퍼 + `--color-cat-*` 토큰 재사용.
- plan002 의 RecentActivity Row 패턴이 모바일 TxRow 와 동일 — 컴포넌트 추출 검토.

## 작업 항목

### 1. `TransactionRow` 추출 (재사용 컴포넌트)

`src/components/transactions/TransactionRow.tsx` 신규. plan002 의 RecentActivity 안 row 와 통합. Props: `tx: Expense | Income`, `variant: "compact" | "full"`.
- compact (모바일): 카테고리 아이콘 + 메모/카테고리·시간 + 금액/아바타 — plan002 행 패턴과 동일
- full (데스크톱): 5-col grid

plan002 의 RecentActivity 가 이 컴포넌트를 import 하도록 리팩토링 (한 곳에서 row 정의 단일 소스).

### 2. `DateGroupSection` 컴포넌트

`src/components/transactions/DateGroupSection.tsx`. Props: `group: DateGroup<Expense | Income>`. 헤더 (날짜 + 합계) + 카드 안에 `TransactionRow` 리스트.

날짜 포맷 헬퍼 (`formatDateHeader(date)` — "오늘 / 어제 / N월 N일 (요일)") `src/lib/utils/date-format.ts` 또는 기존 utils 재사용.

### 3. `ExpenseList` / `IncomeList` 통합

기존 `src/components/expenses/list/ExpenseList.tsx` 와 `src/components/incomes/list/IncomeList.tsx` 의 row 렌더 부분을 `DateGroupSection` 호출로 교체. 데이터를 `groupTransactionsByDate` (phase 1) 로 그룹화 후 전달.

`RecurringExpenseList` 는 데이터 모델이 다름 (반복 스케줄) → 본 phase 에서 행 디자인만 동일 토큰 (TransactionRow 안 쓰고 별도 row, 단 색/typography 토큰 통일). 일자 그룹 미적용.

### 4. 빈 상태 / 페이지네이션

빈 결과: phase 3 의 빈 상태 메시지 일관 적용. 페이지네이션은 기존 `page/limit` 그대로 — DateGroup 단위로 끊지 않고 expenses 단위로 끊은 후 클라에서 그룹화.

### 5. 자동 verification

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/transactions/TransactionRow.tsx
test -f src/components/transactions/DateGroupSection.tsx

# 5-col desktop grid
grep -nE 'grid-cols\[44px|md:grid-cols' src/components/transactions/TransactionRow.tsx | wc -l   # >= 1

# 카테고리 톤 토큰 사용 (plan002 helper)
grep -n 'category-tone\|--color-cat-' src/components/transactions/TransactionRow.tsx | wc -l   # >= 1

# plan002 RecentActivity 가 TransactionRow 사용
grep -n 'TransactionRow' src/components/dashboard/RecentActivity.tsx | wc -l   # >= 1
```

수동 smoke: `/transactions` 각 탭 → 일자별 그룹 + 합계 표시. 모바일/데스크톱 viewport 전환 시 row 디자인 변경. 카테고리 chip 색이 카테고리에 따라 달라짐.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/transactions/TransactionRow.tsx` | 신규 (compact/full variant) |
| `src/components/transactions/DateGroupSection.tsx` | 신규 |
| `src/components/expenses/list/ExpenseList.tsx` | 수정 — DateGroupSection 사용 |
| `src/components/incomes/list/IncomeList.tsx` | 수정 — DateGroupSection 사용 |
| `src/components/dashboard/RecentActivity.tsx` | 수정 — TransactionRow 재사용 |
| `src/lib/utils/date-format.ts` | 신규 또는 수정 (formatDateHeader) |

## Out of Scope

- `RecurringExpenseList` row 디자인 (토큰만 적용, 그룹화 없음)
- 거래 행 클릭 → 상세 sheet (기존 동작 유지)
- 무한 스크롤 (현재 페이지네이션 유지)
- 카테고리 chip 클릭 → 필터 적용 (drill-down) — plan004+

## Risks

| 리스크 | 완화 |
|---|---|
| plan002 RecentActivity 와 row 통합 시 prop shape 충돌 | `TransactionRow` 가 union prop 받고 내부 분기. plan002 머지 후 패턴 점검 |
| 페이지네이션 경계가 DateGroup 가운데 끊김 | UX 허용 — 다음 페이지 첫 그룹이 같은 날짜라도 별도 헤더 표시. 또는 클라 합치기 (오버엔지니어링 — 본 plan OOS) |
| `RecurringExpenseList` 의 데이터 형식이 expenses/incomes 와 다름 | 별도 row 컴포넌트 (`RecurringRow`) 유지. TransactionRow 는 그룹화 가능한 거래만 |
| 모바일/데스크톱 row 차이가 Tailwind responsive 만으로 어색할 수 있음 | variant prop 명시 (`compact`/`full`) — 단순 responsive 보다 명시적 분기. 5-col grid 는 `md:grid` 로 분기 |
