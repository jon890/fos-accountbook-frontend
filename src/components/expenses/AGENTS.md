<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# expenses

## Purpose
지출 관련 컴포넌트. forms(입력), list(목록), dialogs(추가/수정/삭제), summary(카테고리별 요약)로 구성된다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `forms/` | AddExpenseForm.tsx, ExpenseFilters.tsx |
| `list/` | ExpenseItem.tsx, ExpenseList.tsx, ExpenseListClient.tsx, ExpensePagination.tsx |
| `dialogs/` | AddExpenseDialog.tsx, EditExpenseDialog.tsx, DeleteExpenseDialog.tsx |
| `summary/` | CategoryExpenseSummary.tsx, ExpenseSummaryWrapper.tsx |

## For AI Agents

### Working In This Directory
- 지출 관련 색상: `gradient-expense` 사용
- 삭제 다이얼로그: `destructive` variant 버튼 사용
- 폼 유효성: Zod 스키마 + react-hook-form

<!-- MANUAL: -->
