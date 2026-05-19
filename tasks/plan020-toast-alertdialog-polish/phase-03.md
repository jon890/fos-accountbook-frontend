# Phase 03 — 통합 검증 + 8단계 체크리스트 + status="completed" 마킹

**Model**: haiku
**Status**: pending
**Goal**: phase-01 + phase-02 통합 검증. 빌드/타입/lint 통과 + legacy 토큰 잔재 0 + Teal 시스템 일관. 마지막에 `index.json` 의 `status` 를 `"completed"` 로 변경하고 commit.

## 작업 항목

### 1. 통합 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan020-toast-alertdialog-polish

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test:ci

# legacy 토큰 0 (전체)
! grep -nE '--popover|popover-foreground|text-muted-foreground' \
  src/components/ui/sonner.tsx src/app/providers.tsx
! grep -nE 'bg-black/|bg-white|text-muted-foreground' \
  src/components/ui/alert-dialog.tsx

# richColors OFF
! grep -n 'richColors' src/app/providers.tsx

# 파괴적 호출처 4 곳 모두 destructive variant
grep -l 'variant: "destructive"' \
  src/components/expenses/dialogs/DeleteExpenseDialog.tsx \
  src/components/incomes/list/IncomeItem.tsx \
  src/components/recurring-expense/RecurringExpenseItem.tsx \
  'src/app/(authenticated)/categories/_components/DeleteCategoryDialog.tsx' \
  | wc -l   # == 4
```

### 2. 수동 smoke (구현자 책임)

- 카테고리 생성 → success toast 좌측 Teal border
- 카테고리 생성 중복 이름 → error toast 좌측 expense border
- 카테고리 삭제 → AlertDialog overlay 자연스러움 + "삭제" 버튼 expense red
- 지출 삭제 / 수입 삭제 / 반복지출 삭제 → 동일 패턴
- Dark mode 토글 → toast / dialog 모두 자연 전환

### 3. 8단계 체크리스트 자체 점검

| 단계 | 확인 |
|---|---|
| 1 구현가능성 | sonner CSS 변수 표준 + radix className override 모두 호환 |
| 2 기술스택 | 변경 없음 ✅ |
| 3 사용자흐름 | 동작 변경 없음, 시각만 통일 ✅ |
| 4 UI | 토큰 매핑 일관 + 파괴적 톤 명시 ✅ |
| 5 API | 변경 없음 ✅ |
| 6 아키텍처 | UI 컴포넌트만 수정 + 호출처 4 곳 override ✅ |
| 7 ADR | ADR-F24 신설 (richColors OFF 결정 근거) ✅ |
| 8 docs | flow.md §14-4 신규 + ADR-F24 ✅ |

### 4. `index.json` status 마킹 + commit

```bash
# index.json 의 "status": "pending" → "completed" 변경
# Edit tool 로 수정

git add tasks/plan020-toast-alertdialog-polish/index.json
git commit -m "chore(plan020): mark task completed"
git push
```

PR 본문 갱신 (구현 PR 의 description) — 이번 plan 의 변경 요약 + verification 결과 첨부.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan020-toast-alertdialog-polish/index.json` | status=completed |

## Out of Scope

- 다른 plan task 의 상태 변경
- 새 ADR 추가
