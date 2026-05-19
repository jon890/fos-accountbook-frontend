# Phase 02 — AlertDialog 토큰 마이그레이션 + 파괴적 호출처 destructive variant 명시

**Model**: sonnet
**Status**: pending
**Goal**: `src/components/ui/alert-dialog.tsx` 의 legacy 토큰 (`bg-black/80`, `bg-white`, `text-muted-foreground`) 을 plan001 OKLCH 시스템으로 통일. overlay=`bg-fg/60`, content=`bg-bg-elev`, description=`text-fg-muted`. 파괴적 호출처 4 곳의 `AlertDialogAction` 에 `variant="destructive"` 명시.

## Context (자기완결)

- 현재 `src/components/ui/alert-dialog.tsx` (141 줄):
  - L21 overlay: `bg-black/80` 하드코딩 (light/dark 동일)
  - L39 content: `bg-white p-6` (dark mode 미지원)
  - L94 description: `text-muted-foreground` (legacy shadcn)
  - L107 `AlertDialogAction`: `buttonVariants()` 기본 = brand → 파괴적 호출처에서도 brand 톤
- `--destructive` 토큰: globals.css L127 에서 `var(--color-expense)` 로 매핑됨 → `variant="destructive"` 가 자동으로 expense 톤
- 파괴적 AlertDialog 호출처 (4):
  - `src/components/expenses/dialogs/DeleteExpenseDialog.tsx` L82-88
  - `src/components/incomes/list/IncomeItem.tsx` L203-213
  - `src/components/recurring-expense/RecurringExpenseItem.tsx` L183-189
  - `src/app/(authenticated)/categories/_components/DeleteCategoryDialog.tsx` L42-48

## 작업 항목

### 1. `src/components/ui/alert-dialog.tsx` 토큰 마이그레이션

```tsx
// L19-22 AlertDialogOverlay className
className={cn(
  "fixed inset-0 z-50 bg-fg/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  className
)}
```

```tsx
// L36-43 AlertDialogContent className — bg-white → bg-bg-elev
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-bg-elev p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
  className
)}
```

```tsx
// L94 AlertDialogDescription className
className={cn("text-sm text-fg-muted", className)}
```

`bg-fg/60` alpha 변형은 Tailwind v4 가 OKLCH 토큰 + alpha 자동 지원. light=어두운 fg 톤, dark=밝은 fg 톤 자동 전환. 미작동 시 `globals.css` 의 `@theme` 블록 외부에 `.bg-alert-overlay { background: color-mix(in srgb, var(--color-fg) 60%, transparent); }` 추가 (ADR-F13: inline style 금지).

### 2. 파괴적 호출처 4 곳에 `variant="destructive"` 명시

각 호출처의 `<AlertDialogAction ...>` 에 `className={cn(buttonVariants({ variant: "destructive" }))}` 추가 — `AlertDialogAction` 의 기본 `buttonVariants()` 를 override.

```tsx
// before
<AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>

// after
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/client/utils";

<AlertDialogAction
  onClick={handleDelete}
  className={cn(buttonVariants({ variant: "destructive" }))}
>
  삭제
</AlertDialogAction>
```

대상 4 파일:

| 파일 | 라인 | onClick 패턴 |
|---|---|---|
| `src/components/expenses/dialogs/DeleteExpenseDialog.tsx` | L82 | 기존 onClick 보존, className 만 추가 |
| `src/components/incomes/list/IncomeItem.tsx` | L203 | 동일 |
| `src/components/recurring-expense/RecurringExpenseItem.tsx` | L183 | 동일 |
| `src/app/(authenticated)/categories/_components/DeleteCategoryDialog.tsx` | L42 | 동일 |

기존 props (onClick, disabled, asChild 등) 는 보존. `className` 만 추가.

### 3. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan020-toast-alertdialog-polish

pnpm lint
pnpm tsc --noEmit
pnpm build

# legacy 토큰 0 (alert-dialog)
! grep -nE 'bg-black/|bg-white|text-muted-foreground' \
  src/components/ui/alert-dialog.tsx

# 신 토큰 사용
grep -nE 'bg-fg/60|bg-bg-elev|border-border|text-fg-muted' \
  src/components/ui/alert-dialog.tsx | wc -l   # >= 3

# 파괴적 호출처 4 곳 모두 destructive variant
grep -l 'variant: "destructive"' \
  src/components/expenses/dialogs/DeleteExpenseDialog.tsx \
  src/components/incomes/list/IncomeItem.tsx \
  src/components/recurring-expense/RecurringExpenseItem.tsx \
  'src/app/(authenticated)/categories/_components/DeleteCategoryDialog.tsx' \
  | wc -l   # == 4
```

수동 smoke:
- 카테고리 삭제 confirm → overlay 어두운 톤 + content 카드 자연스럽게 표시 + "삭제" 버튼 expense red
- 지출 삭제 confirm → 동일 패턴
- Dark mode → overlay 밝은 톤 (fg=흰색 계열 60%) + content bg-bg-elev 다크 톤
- 모바일 (< 768px) → SheetContent 가 아닌 AlertDialog 중앙 표시 유지 (반응형 무관)
- 비파괴적 confirm (현재 없으면 N/A) → variant 미지정 → brand 톤

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/ui/alert-dialog.tsx` | overlay + content + description 토큰 |
| `src/components/expenses/dialogs/DeleteExpenseDialog.tsx` | Action variant destructive |
| `src/components/incomes/list/IncomeItem.tsx` | Action variant destructive |
| `src/components/recurring-expense/RecurringExpenseItem.tsx` | Action variant destructive |
| `src/app/(authenticated)/categories/_components/DeleteCategoryDialog.tsx` | Action variant destructive |

## Out of Scope

- AlertDialog 의 애니메이션 / 슬라이드 방향 — 변경 없음
- AlertDialog → Sheet (모바일 bottom) 마이그레이션 — 별도 plan 후보
- 비파괴적 confirm 다이얼로그 추가 — 현재 사용처 모두 파괴적

## Risks

| 리스크 | 완화 |
|---|---|
| `bg-fg/60` alpha 변형이 Tailwind v4 자동 처리 안 됨 | smoke 확인. 실패 시 `.bg-alert-overlay` 커스텀 클래스 정의 |
| 4 호출처 중 일부에 import (`buttonVariants`, `cn`) 누락으로 빌드 실패 | tsc 검증 + 각 파일마다 import 확인 |
| `variant="destructive"` 의 `bg-destructive` 가 expense 토큰 미매핑 (회귀) | globals.css L127 `--destructive: var(--color-expense)` 확인됨 — 변경 금지 |
