# Phase 04 — 통합 검증 + jest 테스트 갱신 + completed

**Model**: haiku
**Status**: pending
**Goal**: 전체 lint/tsc/build/test 통과 + jest 테스트 파일을 신 구조로 갱신 + index.json completed 마킹.

## 작업 항목

### 1. jest 테스트 갱신

기존 테스트:
- `src/__tests__/components/incomes/AddIncomeDialog.test.tsx`
- `src/__tests__/actions/recurring-expense/createRecurringExpenseAction.test.ts` (Action 자체 테스트 — 변경 없음, 본 plan 의 변경 영향 없음)
- 그 외 EditExpenseDialog / EditIncomeDialog / EditRecurringExpenseSheet 테스트가 있다면 모두

처리:
```bash
# legacy 테스트 파일 식별
find src/__tests__ -name '*AddIncomeDialog*' -o -name '*AddRecurringExpenseSheet*' \
  -o -name '*EditIncomeDialog*' -o -name '*EditRecurringExpenseSheet*' \
  -o -name '*AddExpenseDialog*' -o -name '*EditExpenseDialog*' 2>/dev/null
```

각 파일을 `AddTransactionDialog.test.tsx` / `EditTransactionDialog.test.tsx` 로 재작성 또는 삭제:
- 신규 단일 테스트 파일 (위치: `src/__tests__/components/transactions/dialogs/`):
  - 3 type 토글 클릭 → 활성 type 변경
  - expense 저장 → createExpenseAction mock 호출
  - income 저장 → createIncomeAction mock 호출
  - recurring 저장 → createRecurringExpenseAction mock 호출
  - type 전환 시 amount/category 유지 + date↔dayOfMonth 초기화

jest.mock 패턴은 ADR-F09 그대로 유지.

### 2. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/014-transaction-dialog-unification

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

### 3. legacy 잔재 0 최종 확인

```bash
# 4 legacy 컴포넌트 import / 정의 모두 0
! grep -rnE 'AddExpenseDialog|AddIncomeDialog|AddRecurringExpenseSheet|EditExpenseDialog|EditIncomeDialog|EditRecurringExpenseSheet' \
  src/ --include='*.tsx' --include='*.ts'

# 신 컴포넌트만 존재
test -f src/components/transactions/dialogs/AddTransactionDialog.tsx
test -f src/components/transactions/dialogs/EditTransactionDialog.tsx
test -f src/components/transactions/forms/TransactionFormFields.tsx
```

### 4. 6 진입점 수동 smoke (사용자)

| 진입점 | 기대 |
|---|---|
| Dashboard "+ 지출" | AddTransactionDialog (expense 토글 활성) |
| Dashboard "+ 수입" | AddTransactionDialog (income 토글) |
| BottomNav FAB | AddTransactionDialog (expense) |
| Transactions 수입 탭 "+ 수입" | AddTransactionDialog (income) |
| Transactions 고정지출 탭 "+ 고정지출" | AddTransactionDialog (recurring) + name/dayOfMonth 필드 |
| Settings 고정지출 "+" (해당 시) | 동일 |
| 각 list 의 수정 아이콘 | EditTransactionDialog + 해당 type 잠금 |
| Dark mode + 위 시나리오 | 자연스러운 톤 |

### 5. index.json completed 마킹

`tasks/plan014-transaction-dialog-unification/index.json` 의 모든 phase + 최상위 status → `"completed"`, `completed_at` 추가.

### 6. 최종 커밋

```bash
git add tasks/plan014-transaction-dialog-unification/index.json
git commit -m "chore(plan014): mark completed"
```

## Out of Scope

- AmountInput / CategoryGrid 위치 이동 (후속 cleanup)
- 삭제 다이얼로그 통합
- categories fetch 의 SWR / cache 도입
