# Phase 03 — ExpenseFormFields 통합 + AddExpenseForm/EditExpenseDialog 마이그레이션

**Model**: sonnet
**Status**: pending
**Goal**: phase 1~2 의 신규 컴포넌트 (`AmountInput`, `CategoryGrid`) 와 기존 Date/Memo 필드를 묶은 공용 `ExpenseFormFields` 신규. Add 와 Edit 폼 둘 다 이 묶음을 사용하도록 마이그레이션.

## Context (자기완결)

- 현재 코드:
  - `src/components/expenses/forms/AddExpenseForm.tsx` (153줄) — `useActionState` + `createExpenseAction`
  - `src/components/expenses/dialogs/EditExpenseDialog.tsx` (184줄) — Edit 폼 본문
  - `src/components/expenses/dialogs/AddExpenseDialog.tsx` (257줄) — Dialog wrapper (phase 4 에서 다룸)
- 두 폼이 동일 필드 (금액/카테고리/날짜/메모) 사용 — DRY 위해 공용 fields 컴포넌트 추출.
- handoff 의 Date 필드는 calendar 아이콘 + "2026년 5월 8일 (목)" 텍스트 + 우측 chevron — shadcn Popover + react-day-picker 패턴 (기존 코드 점검 후 재사용).
- handoff 의 Memo 필드는 단일 line input — shadcn Input 그대로.

## 작업 항목

### 1. `ExpenseFormFields` 신규

`src/components/expenses/forms/ExpenseFormFields.tsx`. Props:

```ts
interface ExpenseFormFieldsProps {
  categories: CategoryResponse[];
  amount: number;
  onAmountChange: (next: number) => void;
  categoryUuid: string | null;
  onCategoryChange: (uuid: string) => void;
  date: string;             // ISO YYYY-MM-DD
  onDateChange: (next: string) => void;
  description: string;             // FormData key 보존 — 기존 AddExpenseForm/EditExpenseDialog 가 name="description" 사용
  onDescriptionChange: (next: string) => void;
  disabled?: boolean;
}
```

**FormData key 보존 — 결정**: handoff UI 라벨이 "메모" 로 표시되더라도 **prop 이름과 hidden input `name=` 은 `description` 으로 통일**. 이유:
- 기존 `createExpenseAction` / `updateExpenseAction` 의 FormData key 가 `description`
- `CreateExpenseFormState.errors.description` 도 동일 key 사용
- action 시그니처 변경 시 backend dto / Zod schema 동시 변경 발생 → plan005 scope 외
- UI 라벨은 `FieldLabel` 텍스트로 "메모" 표시, prop 만 description

Layout (top → bottom):
1. AmountInput (phase 1)
2. divider (border-bottom)
3. FieldLabel "카테고리" + CategoryGrid (phase 2)
4. FieldLabel "날짜" + DateField (calendar Popover trigger)
5. FieldLabel "메모" + Input (name="description", value=description prop)

`FieldLabel` / `FieldRow` 헬퍼는 컴포넌트 안 사적 정의 (handoff mockup line 277~285 참조).

### 2. `AddExpenseForm` 마이그레이션

`src/components/expenses/forms/AddExpenseForm.tsx` 재작성:
- `useActionState` + `createExpenseAction` 흐름 그대로
- form 본문을 `<ExpenseFormFields />` 로 교체
- 4개 필드 state (amount/categoryUuid/date/description) 는 `useState` 로 유지
- form submit 시 hidden input 또는 FormData 로 action 에 전달 (기존 패턴 그대로 — `name="description"` 등)

**Props 시그니처 변동**: 기존 `AddExpenseFormProps` 는 `categories`/`familyUuid`/`onSuccess?`/`onCancel?` 로 변경 없음 (호출자 `AddExpenseDialog` 무영향). form 내부 구조만 변경.

### 3. `EditExpenseDialog` 마이그레이션

`src/components/expenses/dialogs/EditExpenseDialog.tsx` 의 폼 본문을 `<ExpenseFormFields />` 로 교체. initial value 는 expense props 에서 추출:

```ts
<ExpenseFormFields
  categories={categories}
  amount={Number(expense.amount)}
  onAmountChange={setAmount}
  categoryUuid={expense.categoryUuid}
  // ...
/>
```

`updateExpenseAction` 호출 흐름은 그대로.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/005-add-expense-redesign

pnpm tsc --noEmit
pnpm lint
pnpm build
pnpm test --run

test -f src/components/expenses/forms/ExpenseFormFields.tsx

# Add / Edit 둘 다 ExpenseFormFields 사용
grep -n 'ExpenseFormFields' src/components/expenses/forms/AddExpenseForm.tsx | wc -l   # >= 1
grep -n 'ExpenseFormFields' src/components/expenses/dialogs/EditExpenseDialog.tsx | wc -l   # >= 1

# AmountInput / CategoryGrid 가 ExpenseFormFields 안에서 사용
grep -nE 'AmountInput|CategoryGrid' src/components/expenses/forms/ExpenseFormFields.tsx | wc -l   # >= 2
```

수동 smoke (`pnpm dev`):
- BottomNav FAB → 다이얼로그 → 새 디자인 fields 표시 (큰 num + 카테고리 grid + 날짜 + 메모)
- 거래 row 우측 메뉴 → "수정" → Edit 다이얼로그 → 동일 디자인 + initial values 채워짐
- 폼 제출 후 toast / revalidate 정상

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/expenses/forms/ExpenseFormFields.tsx` | 신규 |
| `src/components/expenses/forms/AddExpenseForm.tsx` | 수정 (fields 묶음 import 로 단순화) |
| `src/components/expenses/dialogs/EditExpenseDialog.tsx` | 수정 (동일 묶음) |

## Out of Scope

- Sheet/Dialog wrapper 변경 (phase 4)
- 새 action 추가 — 기존 `createExpenseAction` / `updateExpenseAction` 시그니처 그대로
- `revalidatePath` 정책 변경
- DateField 의 react-day-picker 자체 디자인 — Popover 안 calendar 는 plan001 토큰 자동 적용

## Risks

| 리스크 | 완화 |
|---|---|
| `useActionState` 와 controlled fields state 충돌 (action submit 시 state reset) | submit 후 state 명시 reset (`onSuccess` 콜백에서 `setAmount(0)` 등). 기존 AddExpenseForm 패턴 점검 후 동일 처리 |
| EditExpenseDialog 의 expense.amount 타입 (string vs number) | type 점검 후 `Number()` 변환 명시. `RecentExpense.amount` 가 string 이라 변환 필요 |
| Date 형식 (ISO vs YYYY-MM-DD) 불일치 | 기존 `date-timezone.ts` / `format.ts` 헬퍼 사용. `toLocalDateInput` 이미 import 되어있음 |
