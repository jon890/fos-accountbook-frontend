# Phase 03 — EditTransactionDialog 신규 + Edit 진입점 갱신

**Model**: sonnet
**Status**: pending
**Goal**: `EditTransactionDialog` 단일 컴포넌트 신규 (type 잠금) + Edit 진입점 갱신 + legacy `EditIncomeDialog` / `EditRecurringExpenseSheet` / `EditExpenseDialog` 제거.

## Context (자기완결)

- 기반: `src/components/expenses/dialogs/EditExpenseDialog.tsx` (149 줄)
- 흡수: `src/components/incomes/dialogs/EditIncomeDialog.tsx` (192) / `src/components/recurring-expense/EditRecurringExpenseSheet.tsx` (189)
- 신규 위치: `src/components/transactions/dialogs/EditTransactionDialog.tsx`
- 공용 폼: phase 01 의 `TransactionFormFields` 재사용
- Edit 는 Add 와 달리 **type 전환 불가** — 기존 거래의 type 이 고정. 토글은 표시만 (3 토글 중 현재 type 만 활성, 나머지 disabled — 시각 일관성)

## 작업 항목

### 1. `EditTransactionDialog.tsx` 신규

```ts
type TransactionType = "expense" | "income" | "recurring";

interface EditTransactionDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  transaction: T;   // ExpenseResponse | IncomeResponse | RecurringExpenseResponse
}
```

구조:
- Add 와 동일 wrapper (responsive Dialog/Sheet)
- inner body `{open ? <Body /> : null}` 패턴
- 헤더: type 별 라벨 ("지출 수정" / "수입 수정" / "고정지출 수정")
- 3 토글 표시 — 현재 type 만 활성, 나머지 `disabled className="opacity-40 cursor-not-allowed"` + aria-disabled
- TransactionFormFields 사용 — initial 값 prefill (transaction 의 amount/category/date/name/dayOfMonth/description)

### 2. 3 Update Action dispatch 분기

```ts
const [expenseState, expenseFormAction] = useActionState(updateExpenseAction, initialState);
const [incomeState,  incomeFormAction]  = useActionState(updateIncomeAction,  initialState);
const [recurringState, recurringFormAction] = useActionState(updateRecurringExpenseAction, initialState);

const formAction =
  type === "expense"   ? expenseFormAction :
  type === "income"    ? incomeFormAction  :
                          recurringFormAction;
```

`<input type="hidden" name="uuid" value={transaction.uuid} />` 로 식별자 전달.

### 3. Edit 진입점 갱신

```bash
grep -rln 'EditExpenseDialog\|EditIncomeDialog\|EditRecurringExpenseSheet' src/ \
  --include='*.tsx' \
  | grep -v __tests__
```

각 진입점 (예: ExpenseItem / IncomeItem / RecurringExpenseItem) 에서:

```tsx
// 변경 전
<EditExpenseDialog open={...} onOpenChange={...} expense={item} />

// 변경 후
<EditTransactionDialog open={...} onOpenChange={...} type="expense" transaction={item} />
```

각 type 의 prop 이름 (`expense` / `income` / `recurringExpense`) 이 모두 `transaction` 으로 통일.

### 4. legacy 파일 제거

```bash
rm src/components/expenses/dialogs/EditExpenseDialog.tsx
rm src/components/incomes/dialogs/EditIncomeDialog.tsx
rm src/components/recurring-expense/EditRecurringExpenseSheet.tsx

# 디렉터리 잔재 정리
[ -d src/components/expenses/dialogs ] && rmdir src/components/expenses/dialogs 2>/dev/null || true
[ -d src/components/incomes/dialogs ] && rmdir src/components/incomes/dialogs 2>/dev/null || true

# 빈 디렉터리 정리 (forms 등 다른 파일 있으면 유지)
find src/components/expenses src/components/incomes -type d -empty -delete 2>/dev/null || true
```

### 5. ExpenseFormFields 의 정리

`src/components/expenses/forms/ExpenseFormFields.tsx` — `TransactionFormFields` 가 흡수했으므로 제거 검토.

확인:
```bash
grep -rln 'ExpenseFormFields' src/ --include='*.tsx' --include='*.ts' | grep -v __tests__
```

다른 진입점 없으면 제거. 단 phase 01 의 `TransactionFormFields` 가 AmountInput/CategoryGrid 컴포넌트는 별도 재사용 — 그 컴포넌트들은 `src/components/expenses/forms/` 의 하위에 있으면 위치 이동 (`src/components/transactions/forms/`) 또는 그대로 유지 + 경로만 그대로.

본 phase 에선 위치 이동 안 함 (변경 폭 최소화) — 후속 cleanup plan.

### 6. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/014-transaction-dialog-unification

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/transactions/dialogs/EditTransactionDialog.tsx

# legacy Edit 파일 0
[ ! -f src/components/expenses/dialogs/EditExpenseDialog.tsx ]
[ ! -f src/components/incomes/dialogs/EditIncomeDialog.tsx ]
[ ! -f src/components/recurring-expense/EditRecurringExpenseSheet.tsx ]

# legacy import 0
! grep -rn 'EditExpenseDialog\|EditIncomeDialog\|EditRecurringExpenseSheet' src/ \
  --include='*.tsx' --include='*.ts' \
  | grep -v __tests__

# 3 update Action import
grep -nE 'updateExpenseAction|updateIncomeAction|updateRecurringExpenseAction' \
  src/components/transactions/dialogs/EditTransactionDialog.tsx | wc -l   # >= 3

# 비활성 토글 (disabled / aria-disabled)
grep -nE 'aria-disabled|disabled' src/components/transactions/dialogs/EditTransactionDialog.tsx | wc -l   # >= 2
```

수동 smoke:
1. 지출 list → 수정 아이콘 → "지출 수정" 헤더 + expense 토글 활성 + 나머지 비활성
2. 수입 list → 수정 → "수입 수정"
3. 고정지출 list → 수정 → "고정지출 수정" + name/dayOfMonth prefill
4. 저장 → list 갱신

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/transactions/dialogs/EditTransactionDialog.tsx` | 신규 |
| `src/components/expenses/dialogs/EditExpenseDialog.tsx` | 제거 |
| `src/components/incomes/dialogs/EditIncomeDialog.tsx` | 제거 |
| `src/components/recurring-expense/EditRecurringExpenseSheet.tsx` | 제거 |
| Edit 진입점 (ExpenseItem / IncomeItem / RecurringExpenseItem 등) | import + props 갱신 |

## Out of Scope

- 테스트 갱신 (phase 04)
- AmountInput / CategoryGrid 위치 이동 — 후속 cleanup
- 삭제 다이얼로그 (DeleteConfirm) — 본 plan 범위 외, 이미 AlertDialog 패턴 일관

## Risks

| 리스크 | 완화 |
|---|---|
| `updateRecurringExpenseAction` 가 useActionState 시그니처 비호환 | phase 01 의 wrapper 패턴 동일 적용 |
| Edit 시 type 잠금이 시각적으로 충분히 명확하지 않음 | disabled + opacity-40 + cursor-not-allowed + aria-disabled. 헤더 라벨도 type 명시 |
| transaction prop 타입 union | `T extends ExpenseResponse \| IncomeResponse \| RecurringExpenseResponse` 제네릭 또는 union — 본 plan 은 union 권장 (제네릭 복잡도 회피) |
| 빈 디렉터리 (`src/components/expenses/dialogs/`) 의 .gitkeep 등 잔재 | `find -empty -delete` 로 정리. 다른 파일 있으면 디렉터리 유지 |
