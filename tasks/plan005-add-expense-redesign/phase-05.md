# Phase 05 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: completed
**Goal**: phase 01~04 산출물 통합 검증, 신규 컴포넌트 등록 확인, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상: AmountInput (1) + CategoryGrid (2) + ExpenseFormFields 통합 (3) + responsive Sheet/Dialog (4).
- legacy 잔재 후보: AddExpenseForm 안의 기존 inline 금액 input / 카테고리 select 잔재.
- `_shared/common-pitfalls.md § 1-8` 패턴 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/005-add-expense-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` 출력 후 어느 phase 산출물이 회귀를 만들었는지 식별 + 보고.

### 2. 신규 컴포넌트 / 통합 등록 확인

```bash
test -f src/components/expenses/forms/AmountInput.tsx
test -f src/components/expenses/forms/CategoryGrid.tsx
test -f src/components/expenses/forms/ExpenseFormFields.tsx

# Add / Edit 둘 다 ExpenseFormFields 사용
grep -n 'ExpenseFormFields' src/components/expenses/forms/AddExpenseForm.tsx | wc -l   # >= 1
grep -n 'ExpenseFormFields' src/components/expenses/dialogs/EditExpenseDialog.tsx | wc -l   # >= 1

# Add/Edit 둘 다 Sheet+Dialog responsive
grep -nE 'from ["\x27]@/components/ui/sheet|from ["\x27]@/components/ui/dialog' src/components/expenses/dialogs/AddExpenseDialog.tsx | wc -l   # >= 2
grep -nE 'from ["\x27]@/components/ui/sheet|from ["\x27]@/components/ui/dialog' src/components/expenses/dialogs/EditExpenseDialog.tsx | wc -l   # >= 2
```

### 3. plan002 헬퍼 재사용 확인

```bash
# CategoryGrid 가 plan002 의 category-tone 헬퍼 사용
grep -n 'category-tone\|getCategoryToneKey' src/components/expenses/forms/CategoryGrid.tsx | wc -l   # >= 1

# --color-cat-* 토큰 활용
grep -nE 'color-cat-' src/components/expenses/forms/CategoryGrid.tsx | wc -l   # >= 1
```

### 4. Hardcoded 색 잔재 0건 (plan001/002 효과 회귀 방지)

```bash
grep -rnE '#[0-9a-fA-F]{6}\b|hsl\(|rgb\(' src/components/expenses/forms/ src/components/expenses/dialogs/ \
  | grep -vE 'rgba\(255,\s*255,\s*255' \
  | grep -vE '\.test\.tsx?:'
# 결과 0줄
```

### 5. `index.json` + 본 phase status → `completed`

```bash
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan005-add-expense-redesign/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan005-add-expense-redesign/index.json
grep -c '"status": "completed"' tasks/plan005-add-expense-redesign/index.json   # = 6 (top + 5 phases)

sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan005-add-expense-redesign/phase-05.md
grep '^\*\*Status\*\*:' tasks/plan005-add-expense-redesign/phase-05.md   # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan005-add-expense-redesign/index.json` | 모든 status `completed` |
| `tasks/plan005-add-expense-redesign/phase-05.md` | 본 파일 status `completed` |

## Out of Scope

- 시각 회귀 비교 스크린샷 (수동 smoke 항목으로만, 이전 phase 들에 분산)
- BottomNav FAB 디자인 (별도 plan)

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep false positive (주석 안 문자열) | grep 패턴 구체화. 라인 시작 앵커 (`^`) 사용 |
| macOS BSD `sed -i ''` vs Linux GNU `sed -i` | 본 plan macOS 환경 가정 (fos-blog 동일) |
