# Phase 01 — AddTransactionDialog + TransactionFormFields

**Model**: sonnet
**Status**: pending
**Goal**: `AddTransactionDialog` 단일 컴포넌트 신규 + 3 segmented 토글 + `TransactionFormFields` 공용 (type 분기 conditional 필드). 기존 `AddExpenseDialog` 의 구조 + Income/Recurring 도메인 흡수.

## Context (자기완결)

- 기반 컴포넌트: `src/components/expenses/dialogs/AddExpenseDialog.tsx` (205 줄, 지출+수입 토글 이미 지원)
- 흡수 대상:
  - `src/components/incomes/dialogs/AddIncomeDialog.tsx` (184 줄) — 단순 select + Input
  - `src/components/recurring-expense/AddRecurringExpenseSheet.tsx` (193 줄) — name + dayOfMonth 필드 추가 필요
- 신규 위치: `src/components/transactions/dialogs/AddTransactionDialog.tsx`
- 공용 form: `src/components/transactions/forms/TransactionFormFields.tsx` (ExpenseFormFields 확장)

## 작업 항목

### 1. `AddTransactionDialog.tsx` 신규

```ts
type TransactionType = "expense" | "income" | "recurring";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
}
```

구조:
- responsive: `isDesktop ? Dialog 720px : Sheet bottom 100dvh` (AddExpenseDialog 패턴 그대로)
- inner body `{open ? <Body /> : null}` 패턴 (stale state 방지 — PR #233 의 동일 패턴 유지)
- 헤더: "거래 추가" (sr-only on desktop, 보이는 헤더 on mobile)

### 2. 3 segmented 토글

```tsx
<div className="flex gap-1 bg-bg-muted p-1 rounded-xl">
  <ToggleButton type="expense" label="지출" icon={TrendingDown} gradient="gradient-expense" />
  <ToggleButton type="income"  label="수입" icon={TrendingUp}   gradient="gradient-income" />
  <ToggleButton type="recurring" label="고정지출" icon={Repeat} gradient="gradient-budget" />
</div>
```

토글 클릭 시 `setActiveTypeDraft(type)` — type-specific 필드만 초기화 (amount/category/description 유지).

### 3. `TransactionFormFields.tsx` 신규 (공용)

```ts
interface TransactionFormFieldsProps {
  type: TransactionType;
  categories: CategoryResponse[];
  // 공용
  amount: number;
  onAmountChange: (n: number) => void;
  categoryUuid: string | null;
  onCategoryChange: (uuid: string | null) => void;
  description: string;
  onDescriptionChange: (s: string) => void;
  // expense/income 만
  date?: string;
  onDateChange?: (s: string) => void;
  // recurring 만
  name?: string;
  onNameChange?: (s: string) => void;
  dayOfMonth?: number;
  onDayOfMonthChange?: (n: number) => void;
  // 공통
  isLoadingCategories: boolean;
  errors?: Record<string, string[] | undefined>;
}
```

본문 구조:
- AmountInput (공용, ExpenseFormFields 의 컴포넌트 재사용)
- CategoryGrid (공용, ExpenseFormFields 의 컴포넌트 재사용)
- Description input (공용, name="description")
- `{type === "recurring"}` → Name input + DayOfMonth (1~28) input
- `{type !== "recurring"}` → Date input (default: 오늘)

### 4. 3 Action dispatch 분기

```ts
const [expenseState, expenseFormAction] = useActionState(createExpenseAction, initialExpenseState);
const [incomeState,  incomeFormAction]  = useActionState(createIncomeAction,  initialIncomeState);
const [recurringState, recurringFormAction] = useActionState(createRecurringExpenseAction, initialRecurringState);

const formAction =
  type === "expense"   ? expenseFormAction :
  type === "income"    ? incomeFormAction  :
                          recurringFormAction;
```

각 state 의 success → toast + onOpenChange(false). errors 는 해당 type 의 errors 만 form fields 에 전달.

`createRecurringExpenseAction` 의 현재 시그니처가 plain object 인지 useActionState 호환 (state, formData) 인지 확인 — 호환 안 되면 wrapper 추가 (`async (_, fd) => createRecurringExpenseAction(parseFormData(fd))`).

### 5. CTA 버튼 톤

- expense → `gradient-expense text-white`
- income → `gradient-income text-white`
- recurring → `gradient-budget text-white`

### 6. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/014-transaction-dialog-unification

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/transactions/dialogs/AddTransactionDialog.tsx
test -f src/components/transactions/forms/TransactionFormFields.tsx

# 3 토글 (TrendingDown / TrendingUp / Repeat)
grep -nE 'TrendingDown|TrendingUp|Repeat' src/components/transactions/dialogs/AddTransactionDialog.tsx | wc -l   # >= 3

# 3 시맨틱 그라디언트
grep -nE 'gradient-expense|gradient-income|gradient-budget' src/components/transactions/dialogs/AddTransactionDialog.tsx | wc -l   # >= 3

# 3 Action import
grep -nE 'createExpenseAction|createIncomeAction|createRecurringExpenseAction' \
  src/components/transactions/dialogs/AddTransactionDialog.tsx | wc -l   # >= 3

# inner body conditional pattern
grep -nE 'open\s*\?\s*<' src/components/transactions/dialogs/AddTransactionDialog.tsx | wc -l   # >= 1
```

수동 smoke (실제 사용은 phase 02 에서 진입점 갱신 후): 임시 페이지에 `<AddTransactionDialog open onOpenChange={...} />` 마운트 → 3 토글 전환 + 각 type 별 form 필드 분기 확인.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/transactions/dialogs/AddTransactionDialog.tsx` | 신규 |
| `src/components/transactions/forms/TransactionFormFields.tsx` | 신규 |

## Out of Scope

- 진입점 갱신 (phase 02)
- EditTransactionDialog (phase 03)
- legacy 파일 제거 (phase 02 / 03)
- AmountInput / CategoryGrid 자체 변경 — ExpenseFormFields 내부 컴포넌트 그대로 재사용

## Risks

| 리스크 | 완화 |
|---|---|
| `createRecurringExpenseAction` 시그니처 비호환 (useActionState 와) | 시그니처 확인 후 wrapper 함수로 감싸기. parseFormData 로 dayOfMonth/name 추출 |
| type 전환 시 입력 잔존 정책 모호 (사용자 confused) | ADR-F21 명시: amount/category/description 유지, type-specific (date vs name+dayOfMonth) 초기화. 코드 주석 명시 |
| 3 type Action state hook 3개 — 모든 type 진입 시 3개 모두 mount | useActionState 는 type 무관 항상 mount. 부작용 없음 (form action 만 분기) |
| `gradient-budget` 토큰이 globals.css 에 정의 안 됨 | plan001 의 토큰 점검 — `gradient-budget` 존재 확인. 없으면 phase 시작 시 추가 작업 |
