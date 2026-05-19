# Phase 02 — BudgetEditDialog 신설 + inline edit → Dialog 트리거 마이그레이션

**Model**: sonnet
**Status**: pending
**Goal**: `BudgetEditDialog.tsx` 신설 (responsive Sheet bottom on mobile / Dialog center on md+, plan014 패턴 재사용). `SettingsPageClient.tsx` 의 가족별 예산 inline edit (Edit2/Save/X 3 버튼 토글) 을 Dialog 트리거로 마이그레이션. 빠른 입력 칩 (+10만 / +50만 / +100만) 포함.

## Context (자기완결)

- 현재 inline edit (L188-266): `editingBudget` state + `budgetValues` Record + Input + Save/X 버튼 3 토글. 모바일 좁음
- plan014 `AddTransactionDialog` 패턴: `useMediaQuery("(min-width: 768px)")` → Dialog vs Sheet 선택. `src/components/transactions/dialogs/AddTransactionDialog.tsx` 참고
- 빠른 입력 칩 패턴: plan014 `AmountInput` 의 +1k/+5k/+10k 패턴 — 본 plan 은 +10만/+50만/+100만 (예산 규모)
- 기존 Server Action: `updateFamilyAction(familyUuid, { name, monthlyBudget })` — 권한 검증 강화 필요 (아래 0번)

## 작업 항목

### 0. `updateFamilyAction` 권한 검증 강화 (사전 보강)

**배경**: 현재 `updateFamilyAction(familyUuid, data)` 은 `requireAuth()` 만 수행 → 클라이언트가 본인이 속하지 않은 다른 가족의 UUID 를 주입하면 그 가족 정보 수정 가능 (권한 상승). CLAUDE.md "금지사항" 의 권한 식별자 정책 위반. BudgetEditDialog 가 familyUuid 를 prop 으로 받아 호출하는 구조라 backend-trust 강화가 선행되어야 안전.

`src/services/family/family-service.ts` 의 `selectFamily` 패턴 (`getFamilies() + includes`) 을 재사용:

```ts
// src/actions/family/update-family-action.ts
import { getFamilies } from "@/services/family/family-service";

export async function updateFamilyAction(
  familyUuid: string,
  data: UpdateFamilyRequest
): Promise<ActionResult<Family>> {
  try {
    await requireAuth();

    if (!familyUuid) {
      throw ActionError.invalidInput("가족 UUID", familyUuid, "UUID는 필수입니다");
    }

    // 권한 검증: 사용자가 해당 family 멤버인지 확인 (백엔드가 세션 token 기준으로 본인 가족만 반환)
    const families = await getFamilies();
    if (!families.some((f) => f.uuid === familyUuid)) {
      throw ActionError.entityNotFound("가족", familyUuid);
    }

    const family = await updateFamily(familyUuid, data);
    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath(`/families/${familyUuid}`);
    return successResult(family);
  } catch (error) {
    return handleActionError(error, "가족 정보 수정에 실패했습니다");
  }
}
```

자동 verification (`src/actions/family/update-family-action.ts`):
```bash
grep -n 'getFamilies\|entityNotFound' src/actions/family/update-family-action.ts | wc -l   # >= 2
```

### 1. `src/components/settings/BudgetEditDialog.tsx` 신설

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { updateFamilyAction } from "@/actions/family/update-family-action";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BudgetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUuid: string;
  familyName: string;
  currentBudget: number;
}

const QUICK_AMOUNTS = [
  { label: "+10만", value: 100_000 },
  { label: "+50만", value: 500_000 },
  { label: "+100만", value: 1_000_000 },
];

export function BudgetEditDialog({
  open,
  onOpenChange,
  familyUuid,
  familyName,
  currentBudget,
}: BudgetEditDialogProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [value, setValue] = useState(currentBudget.toString());
  const [isSaving, setIsSaving] = useState(false);

  // open 될 때마다 currentBudget 으로 리셋
  useEffect(() => {
    if (open) {
      setValue(currentBudget.toString());
    }
  }, [open, currentBudget]);

  const handleQuickAdd = (delta: number) => {
    const cur = parseFloat(value) || 0;
    setValue(String(cur + delta));
  };

  const handleSave = async () => {
    const budget = parseFloat(value);
    if (isNaN(budget) || budget < 0) {
      toast.error("올바른 예산 금액을 입력해주세요");
      return;
    }
    try {
      setIsSaving(true);
      const result = await updateFamilyAction(familyUuid, {
        name: familyName,
        monthlyBudget: budget,
      });
      if (result.success) {
        toast.success("월 예산이 설정되었습니다");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("예산 설정에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const body = (
    <div className="space-y-4 pt-2">
      <div>
        <p className="text-sm text-fg-muted">가족</p>
        <p className="text-base font-semibold text-fg">{familyName}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-fg mb-2">월 예산 (원)</label>
        <Input
          type="number"
          min="0"
          step="10000"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-num tabular-nums text-lg"
          autoFocus
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q.value}
              type="button"
              onClick={() => handleQuickAdd(q.value)}
              className="px-3 py-1.5 rounded-full bg-bg-muted text-fg text-xs font-medium hover:bg-brand-50 hover:text-brand-700 transition-colors"
            >
              {q.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setValue("0")}
            className="px-3 py-1.5 rounded-full bg-bg-muted text-fg-muted text-xs font-medium hover:bg-bg-muted transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
          취소
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>월 예산 수정</DialogTitle>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>월 예산 수정</SheetTitle>
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>
  );
}
```

`useMediaQuery` 훅은 `@/hooks/useMediaQuery` (camelCase, `src/hooks/useMediaQuery.ts`). plan014 `AddTransactionDialog.tsx` L23 동일 경로 사용.

### 2. `SettingsPageClient.tsx` — inline edit 제거 + Dialog 트리거

변경 1 — state 정리 (L34-35):
```tsx
// 변경 전
const [editingBudget, setEditingBudget] = useState<string | null>(null);
const [budgetValues, setBudgetValues] = useState<Record<string, string>>({});

// 변경 후
const [budgetDialogFamily, setBudgetDialogFamily] = useState<Family | null>(null);
```

변경 2 — handleEditBudget / handleCancelBudget / handleSaveBudget 함수 제거 (L63-104) — Dialog 내부로 이전

변경 3 — 가족별 예산 카드 본문 (L188-266) 단순화:
```tsx
<SettingsCard
  icon={Wallet}
  title="가족별 예산 설정"
  subtitle="이번 달 목표 예산을 입력하세요"
>
  <div className="flex flex-col">
    {families.map((family, i) => (
      <div
        key={family.uuid}
        className={cn(
          "flex items-center justify-between px-5 py-3",
          i > 0 && "border-t border-border"
        )}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-fg text-sm truncate">{family.name}</h3>
          <p className="text-xs text-fg-muted mt-0.5 font-num tabular-nums">
            {family.monthlyBudget > 0
              ? `월 예산: ₩${family.monthlyBudget.toLocaleString()}`
              : "예산 미설정"}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setBudgetDialogFamily(family)}
        >
          <Edit2 className="w-4 h-4 mr-1" />
          수정
        </Button>
      </div>
    ))}
  </div>
</SettingsCard>
```

변경 4 — Dialog 마운트 (컴포넌트 본문 끝):
```tsx
{budgetDialogFamily && (
  <BudgetEditDialog
    open={!!budgetDialogFamily}
    onOpenChange={(open) => !open && setBudgetDialogFamily(null)}
    familyUuid={budgetDialogFamily.uuid}
    familyName={budgetDialogFamily.name}
    currentBudget={budgetDialogFamily.monthlyBudget}
  />
)}
```

변경 5 — import 정리:
- `Input` / `Save` / `X` 제거 (가족별 예산 카드에서만 사용했으면)
- `BudgetEditDialog` 추가
- `Family` 타입 import 유지

### 3. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan021-settings-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# BudgetEditDialog 파일 존재
test -f src/components/settings/BudgetEditDialog.tsx

# inline edit state 제거
! grep -n 'editingBudget\|budgetValues' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx

# Dialog 트리거
grep -n 'setBudgetDialogFamily\|BudgetEditDialog' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx | wc -l   # >= 2

# 빠른 입력 칩
grep -nE '\+10만|\+50만|\+100만' src/components/settings/BudgetEditDialog.tsx | wc -l   # >= 3
```

수동 smoke:
- 모바일 (< 768px) → "수정" 탭 → Sheet bottom 슬라이드 업 → 입력 + 빠른 입력 칩 → 저장 → toast + Sheet 닫힘
- 데스크톱 (>= 768px) → Dialog center → 동일 동작
- 빠른 입력 칩 (+10만) → 입력값 100,000 추가
- 초기화 칩 → 0 으로
- 빈 값 / 음수 / NaN → "올바른 예산 금액" toast
- 저장 실패 (네트워크 차단) → error toast + Dialog 유지
- 다음 가족 row 수정 클릭 → 직전 Dialog 닫힘 + 새 Dialog 열림 (currentBudget 새 값으로 reset)

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/actions/family/update-family-action.ts` | 권한 검증 강화 (getFamilies + includes) |
| `src/components/settings/BudgetEditDialog.tsx` | 신규 (responsive Sheet/Dialog) |
| `src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | inline edit 제거 + Dialog 트리거 |

## Out of Scope

- 다른 inline edit UI (가족 이름 등) — 본 plan 범위 아님
- 예산 히스토리 / 변경 로그 — 별도 plan
- 다중 화폐 지원 — 한국 원화만

## Risks

| 리스크 | 완화 |
|---|---|
| `useMediaQuery` 훅 경로 (`@/hooks/useMediaQuery` camelCase) 오타 가능 | plan014 `AddTransactionDialog.tsx` L23 과 동일 — 위 본문 코드 정정됨. ts 빌드로 검증 |
| Dialog `open` 토글 시 동일 컴포넌트 mount → currentBudget reset 안 됨 | useEffect 로 open 변화 시 setValue(currentBudget) 명시 (위 코드 반영됨) |
| Sheet bottom 가 모바일 키보드와 겹침 | iOS Safari 키보드 위로 Sheet 본문 자동 push — shadcn Sheet 기본 동작. 미작동 시 `h-auto` → `max-h-[80vh] overflow-y-auto` 폴백 |
| 빠른 입력 칩 누적 시 매우 큰 수 발생 | input type=number max 옵션 없이 자유 입력. updateFamilyAction 의 backend 검증에 위임 (현재 검증 범위는 Family 도메인 결정) |
