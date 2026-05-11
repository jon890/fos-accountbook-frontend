# Phase 04 — Mobile Sheet / Desktop Dialog responsive wrapper

**Model**: sonnet
**Status**: pending
**Goal**: Add 진입 패턴을 viewport 별로 분기 — 모바일은 `<Sheet side="bottom">` (풀화면), 데스크톱은 `<Dialog>` (중앙 720px). 기존 `AddExpenseDialog.tsx` 가 두 패턴 모두 처리.

## Context (자기완결)

- 현재: `src/components/expenses/dialogs/AddExpenseDialog.tsx` (257줄) 가 모든 viewport 에서 Dialog 사용.
- handoff:
  - mobile.jsx line 428 — `MobileShell ... hideTab` (BottomNav 가려진 풀화면 모드)
  - desktop.jsx line 504 — `DesktopShell title="지출 추가" subtitle="..."` 안에 720px centered card
- shadcn 컴포넌트:
  - `src/components/ui/sheet.tsx` (이미 사용 중)
  - `src/components/ui/dialog.tsx` (이미 사용 중)
- 진입점 (실측 — 2곳):
  - `src/components/layout/BottomNavigation.tsx:98` — FAB → AddExpenseDialog
  - `src/components/dashboard/QuickActions.tsx:122` — 버튼 → AddExpenseDialog
- 모든 진입점이 `AddExpenseDialog` 호출 → wrapper 한 곳만 고치면 전파.

## 작업 항목

### 1. `AddExpenseDialog` responsive 분기

`src/components/expenses/dialogs/AddExpenseDialog.tsx` 재작성:

```tsx
"use client";
// ... imports
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery"; // 신규 또는 기존 점검

export function AddExpenseDialog({ open, onOpenChange, ... }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[720px]">
          <DialogHeader><DialogTitle>지출 추가</DialogTitle></DialogHeader>
          <AddExpenseForm ... onSuccess={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[100dvh] p-0">
        <SheetHeader className="px-5 py-3 flex-row justify-between">
          <SheetTitle>지출 추가</SheetTitle>
        </SheetHeader>
        <div className="px-5 pb-5 overflow-y-auto">
          <AddExpenseForm ... onSuccess={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

`useMediaQuery` 훅이 codebase 에 이미 있는지 점검:
```bash
grep -rn "useMediaQuery\|useBreakpoint\|matchMedia" src/hooks src/lib 2>/dev/null
```
없으면 신규 (`src/hooks/useMediaQuery.ts` — `window.matchMedia` 기반, SSR safe — 초기값 false).

### 2. SSR 안전 점검

`AddExpenseDialog` 가 `"use client"`. `useMediaQuery` 의 초기 렌더는 SSR 에서 false (모바일 가정) → hydration mismatch 회피. 클라이언트 mount 후 첫 effect 에서 정확한 값으로 설정.

또는 CSS-only 분기 (`md:hidden` / `hidden md:block` 두 wrapper 모두 렌더) 가능하나 — 두 트리 모두 mount 되면 form state 가 둘로 나뉨. JS hook 분기가 단순.

### 3. 진입점 검증 (변경 0 — 2곳 실측)

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/005-add-expense-redesign

# 진입점 2곳에서 AddExpenseDialog 호출 그대로
grep -rn 'AddExpenseDialog' src/components/layout/BottomNavigation.tsx src/components/dashboard/QuickActions.tsx 2>/dev/null | wc -l   # >= 2 (각 파일 import + 사용)
```

각 호출 site 변경 0. props (open/onOpenChange/categories/familyUuid) 시그니처 동일.

### 4. EditExpenseDialog 도 동일 패턴

`src/components/expenses/dialogs/EditExpenseDialog.tsx` 도 같은 responsive 분기 적용 — 거래 row 수정 진입도 모바일에서 풀화면 sheet 가 일관.

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/005-add-expense-redesign

pnpm tsc --noEmit
pnpm lint
pnpm build
pnpm test --run

# Sheet + Dialog 둘 다 import
grep -nE 'from ["\x27]@/components/ui/sheet|from ["\x27]@/components/ui/dialog' src/components/expenses/dialogs/AddExpenseDialog.tsx | wc -l   # >= 2

# useMediaQuery 사용 (또는 동등 viewport hook)
grep -n 'useMediaQuery\|matchMedia' src/components/expenses/dialogs/AddExpenseDialog.tsx | wc -l   # >= 1

# Edit 도 동일 패턴
grep -nE 'from ["\x27]@/components/ui/sheet|from ["\x27]@/components/ui/dialog' src/components/expenses/dialogs/EditExpenseDialog.tsx | wc -l   # >= 2
```

수동 smoke:
- 모바일 viewport (375px) → FAB → bottom sheet 가 위로 슬라이드 + 풀화면. 닫기 (drag-down 또는 X 버튼) 정상
- 데스크톱 viewport (1280px) → FAB 위치 다르겠으나 진입점 클릭 → 중앙 720px Dialog
- viewport 회전 (mobile landscape ↔ portrait) 시 wrapper 재선택 — 폼 state 보존 필요 (open prop 유지)

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/expenses/dialogs/AddExpenseDialog.tsx` | 수정 — responsive 분기 |
| `src/components/expenses/dialogs/EditExpenseDialog.tsx` | 수정 — 동일 분기 |
| `src/hooks/useMediaQuery.ts` | 신규 (codebase 에 없을 시) |

## Out of Scope

- BottomNavigation FAB 디자인 변경 — 별도 plan
- /add 전용 라우트 신설 (사용자 결정으로 X)
- ExpenseFilters / Recurring sheet 의 responsive 패턴 — 별도 plan
- viewport 회전 중 form state 보존 — 빈도 낮음, lift state 비용 큰 변경. 사용자 보고 빈도 따라 차후 plan 분리

## Risks

| 리스크 | 완화 |
|---|---|
| viewport 전환 시 폼 state 손실 (Dialog → Sheet 또는 반대) | **Out of Scope 결정** — viewport 회전 중 폼 reset 은 허용 (실사용 빈도 낮음, lift state 시 prop drill 4개 + AddExpenseDialog API 복잡화). 모바일 회전 / 데스크톱 resize 가 768px breakpoint 를 넘는 경우만 발생. 차후 사용자 보고 빈도 보고 plan 분리 검토 |
| `useMediaQuery` SSR hydration mismatch | 초기값 false (모바일 가정) + `useEffect` 로 mount 후 갱신. 첫 렌더 mismatch 가능성 있으면 `suppressHydrationWarning` 명시 또는 `useSyncExternalStore` 패턴 |
| Sheet `h-[100dvh]` 가 iOS Safari 의 동적 viewport 와 충돌 | `100dvh` 가 표준. 폴백 `100vh` 하드코딩 회피 — 표준 단위 사용 |
