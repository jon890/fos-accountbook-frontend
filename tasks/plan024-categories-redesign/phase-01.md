# Phase 01 — CategoriesHero 신설 + page.tsx 갱신

**Model**: sonnet
**Status**: pending
**Goal**: `CategoriesHero` 컴포넌트를 신설해 `/categories` 상단에 Teal gradient hero 카드 (가족명 + 총 카테고리 수) 표시. settings/budget Hero 패턴 일관.

## Context (자기완결)

- 현재 `src/app/(authenticated)/categories/page.tsx` (42 줄):
  - L27-33: 단순 `<div><h1>카테고리 관리</h1><p>...</p></div>` 헤더
  - L28: `container mx-auto py-6 px-4 max-w-4xl` wrapper
- 현재 `CategoryPageClient.tsx` (96 줄):
  - L59-71: "총 N개의 카테고리" 카운터 + 카테고리 추가 버튼 (CategoryPageClient 의 첫 row)
- 참고 컴포넌트: `src/components/settings/SettingsHero.tsx` (plan021) 또는 `src/components/dashboard/BudgetHeroCard.tsx`

## 작업 항목

### 1. `src/components/categories/CategoriesHero.tsx` 신설

```tsx
import { Card } from "@/components/ui/card";
import { FolderTree } from "lucide-react";

interface CategoriesHeroProps {
  familyName: string | null;
  categoryCount: number;
}

export function CategoriesHero({ familyName, categoryCount }: CategoriesHeroProps) {
  return (
    <Card className="overflow-hidden border-0 gradient-category text-brand-fg">
      <div className="p-5 md:p-6">
        <p className="text-xs md:text-sm text-brand-fg/80 mb-1">카테고리 관리</p>
        <h1 className="text-xl md:text-2xl font-bold mb-3">
          {familyName ?? "가족"}
          <span className="block text-sm md:text-base font-normal text-brand-fg/80 mt-0.5">
            지출 카테고리를 추가, 수정, 삭제할 수 있습니다
          </span>
        </h1>
        <div className="flex items-center gap-2 text-sm md:text-base">
          <FolderTree className="w-4 h-4 text-brand-fg/80" />
          <span className="font-num font-medium tabular-nums">{categoryCount}</span>
          <span className="text-xs text-brand-fg/70">개 등록됨</span>
        </div>
      </div>
    </Card>
  );
}
```

`gradient-category` 시맨틱 클래스 사용 (plan001). `text-brand-fg` (plan022) — Teal h=188 위 near-white.

### 2. `page.tsx` 갱신 — 가족 정보 페치 + Hero 렌더

```tsx
// 변경 전 (L13-17)
const familyResult = await getSelectedFamilyAction();
if (!familyResult.success || !familyResult.data) {
  redirect("/families/create");
}
const familyUuid = familyResult.data;

// 변경 후 — 가족 객체 페치 (이름 표시용)
const selectedFamily = await getSelectedFamilyAction();
if (!selectedFamily.success || !selectedFamily.data) {
  redirect("/families/create");
}
const familyUuid = selectedFamily.data;

// ADR-F25 권한 검증 — 본인 소속 가족 목록에서 find 로 제한
// getFamilyByIdAction(familyUuid) 직접 호출은 본 action 이 자체적으로
// 사용자 소속 여부를 검증하지 않으므로 다른 가족 UUID 주입 시 정보 노출 위험.
// getFamiliesAction() 결과는 본인 소속 가족만 반환하므로 find 로 안전하게 제한.
import { getFamiliesAction } from "@/actions/family/get-families-action";

const familiesResult = await getFamiliesAction();
const familyInfo = familiesResult.success
  ? familiesResult.data.find((f) => f.uuid === familyUuid)
  : null;
const familyName = familyInfo?.name ?? null;
```

대안: `getFamilyByIdAction` 에 ADR-F25 패턴 (A) 권한 검증 (`getSelectedFamilyUuid()` 비교) 을 추가하는 경로도 가능하나, action 의 책임이 커지므로 page 측에서 `getFamiliesAction().find()` 로 제한하는 쪽이 단순. SettingsHero 가 동일 패턴.

```tsx
// L27-33 헤더 영역 교체
<div className="container mx-auto py-6 px-4 max-w-4xl space-y-6">
  <CategoriesHero
    familyName={familyName}
    categoryCount={categories.length}
  />
  <CategoryPageClient
    initialCategories={categories}
    familyUuid={familyUuid}
    hasInitialError={hasError}
  />
</div>
```

이전 `mb-6` 헤더 div + CategoryPageClient 의 `mb-6` 카운터 row 통합 — Hero 가 카운터 역할 흡수.

### 3. `CategoryPageClient.tsx` 갱신 — 카운터 row 제거

L59-71 의 "총 N개의 카테고리" + "카테고리 추가" Button row 에서 카운터 텍스트 제거. 추가 버튼은 grid 위 우측 정렬로 유지:

```tsx
// 변경 전
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
  <p className="text-sm text-fg-muted">
    총 <span className="font-semibold text-fg">{categories.length}</span>개의 카테고리
  </p>
  <Button onClick={() => setAddDialogOpen(true)}>
    <Plus className="w-4 h-4 mr-2" />
    카테고리 추가
  </Button>
</div>

// 변경 후 — 카운터는 Hero 에 있으니 추가 버튼만
<div className="flex justify-end mb-4">
  <Button onClick={() => setAddDialogOpen(true)}>
    <Plus className="w-4 h-4 mr-2" />
    카테고리 추가
  </Button>
</div>
```

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan024-categories-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# CategoriesHero 파일 존재
test -f src/components/categories/CategoriesHero.tsx

# CategoriesHero 호출
grep -n 'CategoriesHero' src/app/\(authenticated\)/categories/page.tsx | wc -l   # >= 2

# 카운터 텍스트 제거 (CategoryPageClient 에 "총 ... 카테고리" 패턴 없음)
! grep -n '총.*개의 카테고리' src/app/\(authenticated\)/categories/_components/CategoryPageClient.tsx

# 신 토큰 사용 (Hero)
grep -nE 'gradient-category|text-brand-fg' src/components/categories/CategoriesHero.tsx | wc -l   # >= 2
```

수동 smoke:
- /categories 접속 → 상단 Teal gradient Hero (가족명 + 카테고리 수)
- 카테고리 0개 사용자 → "0개 등록됨" + Empty state (phase-03 에서 다룸)
- 다크 모드 → gradient-category 자연
- 모바일 (< 768px) → Hero padding 줄어들지만 정보 유지

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/categories/CategoriesHero.tsx` | 신규 |
| `src/app/(authenticated)/categories/page.tsx` | 가족 정보 페치 + Hero 렌더 |
| `src/app/(authenticated)/categories/_components/CategoryPageClient.tsx` | 카운터 텍스트 제거 |

## Out of Scope

- CategoryItem 인라인 style 정리 — phase-02
- Empty state EmptyState 재사용 — phase-03
- Dialog 토큰 점검 — phase-03
- 사용 통계 (이번 달 지출 금액 등) — 별도 plan

## Risks

| 리스크 | 완화 |
|---|---|
| `getFamilyByIdAction` 권한 검증 미명시 시 다른 가족 UUID 주입 가능 (ADR-F25 위반) — 인증된 사용자가 자신이 속하지 않은 가족 정보 열람 위험 | `getFamiliesAction()` (본인 소속만 반환) 결과에서 `find(f => f.uuid === familyUuid)` 로 제한. 본 phase 의 page 코드 스니펫이 이미 이 패턴 반영 |
| `getFamiliesAction` 결과 타입과 `Family` 타입 mismatch | 구현 시 `getFamiliesAction()` 반환 타입 확인 (`ActionResult<Family[]>`). SettingsHero 가 동일 패턴이므로 참조 가능 |
| `gradient-category` 클래스가 globals.css 에 없음 | L230 에 존재 확인 됨 (`.gradient-category {...}`) ✅ |
| `text-brand-fg` 토큰이 globals.css 에 없음 | plan022 phase-01 완료 후 정착. 본 plan 머지 시점에 plan022 가 미머지면 `text-white` fallback |
