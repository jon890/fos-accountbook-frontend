# Phase 02 — Add 진입점 6 곳 갱신 + legacy Add 다이얼로그 제거

**Model**: sonnet
**Status**: pending
**Goal**: 6 진입점이 모두 `AddTransactionDialog` 호출하도록 import 경로 + props 갱신. `AddIncomeDialog` / `AddRecurringExpenseSheet` 파일 제거.

## Context (자기완결)

진입점 6 곳:

| # | 파일 | 현재 호출 | 갱신 후 |
|---|---|---|---|
| 1 | `src/components/dashboard/QuickActions.tsx` | AddExpenseDialog + AddIncomeDialog | AddTransactionDialog (defaultType=expense / income) |
| 2 | `src/components/layout/BottomNavigation.tsx` | AddExpenseDialog | AddTransactionDialog (defaultType=expense) |
| 3 | `src/app/(authenticated)/transactions/_components/IncomeTabContent.tsx` | AddIncomeDialog | AddTransactionDialog (defaultType=income) |
| 4 | `src/app/(authenticated)/transactions/_components/RecurringTabContent.tsx` | AddRecurringExpenseSheet | AddTransactionDialog (defaultType=recurring) |
| 5 | `src/components/recurring-expense/RecurringExpenseList.tsx` | AddRecurringExpenseSheet | AddTransactionDialog (defaultType=recurring) |
| 6 | `src/components/expenses/dialogs/AddExpenseDialog.tsx` 사용처 (지출 탭의 FAB 등) | AddExpenseDialog | AddTransactionDialog (defaultType=expense) |

## 작업 항목

### 1. 6 진입점 import 일괄 교체

```bash
# 패턴 점검
grep -rln 'AddExpenseDialog\|AddIncomeDialog\|AddRecurringExpenseSheet' src/ --include='*.tsx' \
  | grep -v __tests__ \
  | grep -v 'src/components/transactions/dialogs/'   # 신규 컴포넌트 자체 제외
```

각 파일에서:
- import 교체: `AddTransactionDialog` from `@/components/transactions/dialogs/AddTransactionDialog`
- 컴포넌트 호출: `<AddTransactionDialog open={...} onOpenChange={...} defaultType="expense|income|recurring" />`
- QuickActions 처럼 type 별 2개 dialog 가 있는 경우 → 단일 dialog + state 1개 + `currentType` 변수 도입

QuickActions 예시:
```tsx
// 변경 전
const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);
// ...
<AddExpenseDialog open={addExpenseDialogOpen} onOpenChange={setAddExpenseDialogOpen} />
<AddIncomeDialog open={addIncomeDialogOpen} onOpenChange={setAddIncomeDialogOpen} />

// 변경 후
const [dialogState, setDialogState] = useState<{ open: boolean; type: "expense" | "income" }>({ open: false, type: "expense" });
// ...
<AddTransactionDialog
  open={dialogState.open}
  onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
  defaultType={dialogState.type}
/>
```

### 2. AddRecurringExpenseSheet 의 `categories` prop 처리

기존 `AddRecurringExpenseSheet` 는 `categories` 외부 주입. `AddTransactionDialog` 는 내부 fetch — 진입점에서 `categories` prop 제거. (이미 fetch 가 dialog 내부니 외부 주입 불필요.)

진입점이 categories 를 fetch 해서 사용하던 다른 용도가 있는지 확인 → RecurringExpenseList 에서는 list 표시에도 categories 사용. 그 경우 list 용 fetch 는 유지하되 dialog 에는 전달 안 함.

### 3. legacy 파일 제거

```bash
rm src/components/incomes/dialogs/AddIncomeDialog.tsx
rm src/components/recurring-expense/AddRecurringExpenseSheet.tsx
```

`src/components/incomes/dialogs/` 디렉터리에 다른 파일 (EditIncomeDialog) 이 남아있으면 디렉터리 유지. 다음 phase 에서 EditIncomeDialog 도 제거되면 전체 디렉터리 정리.

`AddExpenseDialog.tsx` 도 사용처가 없어졌으므로 본 phase 에서 제거. 단 EditExpenseDialog 가 같은 디렉터리에 있어 디렉터리 즉시 삭제 안 함 — phase 03 에서 처리.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/014-transaction-dialog-unification

pnpm lint
pnpm tsc --noEmit
pnpm build

# legacy import 0 (테스트 제외)
! grep -rn 'AddIncomeDialog\|AddRecurringExpenseSheet\|AddExpenseDialog' src/ \
  --include='*.tsx' --include='*.ts' \
  | grep -v __tests__ \
  | grep -v 'src/components/transactions/dialogs/'

# legacy 파일 제거됨
[ ! -f src/components/incomes/dialogs/AddIncomeDialog.tsx ]
[ ! -f src/components/recurring-expense/AddRecurringExpenseSheet.tsx ]
[ ! -f src/components/expenses/dialogs/AddExpenseDialog.tsx ]

# AddTransactionDialog 사용처 6+ 곳
grep -rln 'AddTransactionDialog' src/ --include='*.tsx' | wc -l   # >= 6
```

수동 smoke:
1. Dashboard → "+ 지출" 클릭 → expense 토글 활성 다이얼로그
2. Dashboard → "+ 수입" 클릭 → income 토글 활성
3. BottomNav FAB → expense 토글 활성
4. Transactions 수입 탭 "+ 수입" → income 토글 활성
5. Transactions 고정지출 탭 "+ 고정지출" → recurring 토글 활성 + name/dayOfMonth 필드
6. 각 type 저장 → 해당 list 갱신 + toast

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/dashboard/QuickActions.tsx` | import + state 통합 |
| `src/components/layout/BottomNavigation.tsx` | import 교체 |
| `src/app/(authenticated)/transactions/_components/IncomeTabContent.tsx` | import 교체 |
| `src/app/(authenticated)/transactions/_components/RecurringTabContent.tsx` | import 교체 |
| `src/components/recurring-expense/RecurringExpenseList.tsx` | import 교체 + categories prop 제거 |
| `src/components/incomes/dialogs/AddIncomeDialog.tsx` | 제거 |
| `src/components/recurring-expense/AddRecurringExpenseSheet.tsx` | 제거 |
| `src/components/expenses/dialogs/AddExpenseDialog.tsx` | 제거 |

## Out of Scope

- Edit 다이얼로그 (phase 03)
- 테스트 파일 갱신 (phase 04)
- AddIncomeDialog.test.tsx — phase 04 에서 EditIncome 과 함께 정리

## Risks

| 리스크 | 완화 |
|---|---|
| AddExpenseDialog 가 다른 plan 의 미머지 PR 에서 import 되어 있을 가능성 | 본 PR 머지 시점에 plan011/012/013 PR 이 main 에 머지 안 됐어도 충돌 없음 — 그 PR 들은 별도 영역. plan005 의 잔재 plan 만 점검 |
| AddIncomeDialog.test.tsx 가 import 실패로 jest 깨짐 | phase 04 에서 동시 처리. 본 phase 의 verification 에서 `pnpm test` 는 미실행 |
| RecurringExpenseList 의 categories fetch 가 dialog 만을 위해 있던 경우 | 진입점에서 list 표시 외에 categories 사용 없으면 dialog 와 함께 fetch 제거. 사용처 grep 으로 확인 |
| `(open) => setDialogState(...)` 함수 inline 생성으로 자식 리렌더 | 미세 비용 — 본 plan 미해결. 필요 시 useCallback 후속 plan |
