# Phase 03 — Empty state EmptyState 재사용 + Dialog 토큰 점검 + 검증 + completed

**Model**: sonnet
**Status**: pending
**Goal**: `CategoryList.tsx` 의 Empty state 를 `plan012` 의 공용 `EmptyState` 컴포넌트로 교체. `AddCategoryDialog.tsx` / `EditCategoryDialog.tsx` 의 토큰 점검 (legacy 잔재). 통합 검증 + completed.

## Context (자기완결)

### Empty state 현재

`src/app/(authenticated)/categories/_components/CategoryList.tsx` L55-66:
```tsx
if (categories.length === 0) {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center text-fg-muted">
          <p className="text-lg mb-2">등록된 카테고리가 없습니다</p>
          <p className="text-sm">카테고리를 추가해주세요</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

→ `src/components/empty/EmptyState.tsx` (plan012) 공용 컴포넌트로 교체.

### Dialog 토큰 점검 대상

`AddCategoryDialog.tsx` (192 줄) / `EditCategoryDialog.tsx` (195 줄):
- legacy 토큰 (`bg-white/border-gray-/text-muted-foreground/text-gray-`) 잔재 확인
- 색상 picker UX 변경 안 함 (기능 회귀 방지)

## 작업 항목

### 1. CategoryList Empty state 교체

```tsx
import { EmptyState } from "@/components/empty/EmptyState";
import { FolderPlus } from "lucide-react";

if (categories.length === 0) {
  return (
    <EmptyState
      icon={FolderPlus}
      title="등록된 카테고리가 없습니다"
      description="카테고리를 추가해 가족의 지출을 관리해보세요"
    />
  );
}
```

`EmptyState` 컴포넌트의 실제 prop 시그니처는 plan012 의 `src/components/empty/EmptyState.tsx` 확인 후 정확히 맞춘다. 예상 prop: `icon` (lucide), `title`, `description`, 선택적 `cta` (Button props).

선택 사항: `cta` prop 이 있으면 "카테고리 추가" CTA 를 Empty state 안에 inline 으로 두는 것이 UX 우수. 단 페이지 우상단 "카테고리 추가" 버튼이 이미 있으므로 중복 시 제거 결정.

### 2. AddCategoryDialog / EditCategoryDialog 토큰 점검

```bash
# legacy 토큰 잔재 확인
grep -nE 'bg-white|border-gray-|text-muted-foreground|text-gray-|gradient-primary' \
  src/app/\(authenticated\)/categories/_components/AddCategoryDialog.tsx \
  src/app/\(authenticated\)/categories/_components/EditCategoryDialog.tsx
```

발견된 legacy 토큰을 OKLCH 시맨틱으로 교체:
- `bg-white` → `bg-bg-elev`
- `border-gray-*` → `border-border`
- `text-muted-foreground` → `text-fg-muted`
- `text-gray-*` → `text-fg-muted` 또는 `text-fg-subtle`
- `gradient-primary` (plan019/plan021 폐기) → `bg-brand-500` (단색)

기능 변경 (색상 picker / Zod schema / form action) 없이 className 만 교체. 1:1 매핑.

### 3. 통합 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan024-categories-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test:ci

# EmptyState 사용
grep -n 'EmptyState' src/app/\(authenticated\)/categories/_components/CategoryList.tsx | wc -l   # >= 1

# Card empty wrapper 제거
! grep -nE '등록된 카테고리가 없습니다.*<Card' \
  src/app/\(authenticated\)/categories/_components/CategoryList.tsx

# Dialog legacy 토큰 0
! grep -nE 'bg-white|border-gray-|text-muted-foreground|text-gray-|gradient-primary' \
  src/app/\(authenticated\)/categories/_components/AddCategoryDialog.tsx \
  src/app/\(authenticated\)/categories/_components/EditCategoryDialog.tsx

# 신 토큰 사용
grep -cE 'bg-bg-elev|border-border|text-fg-muted|bg-brand-500' \
  src/app/\(authenticated\)/categories/_components/AddCategoryDialog.tsx \
  src/app/\(authenticated\)/categories/_components/EditCategoryDialog.tsx
```

### 4. 수동 smoke

- 카테고리 0개 사용자 → EmptyState 카드 (FolderPlus 아이콘 + 안내 문구) 표시
- 카테고리 추가 → Dialog 열림 + 색상 picker + 저장 → Hero 카운터 증가
- 카테고리 수정 → Dialog 열림 + 기존 값 pre-fill + 저장 → CategoryItem 즉시 갱신
- 카테고리 삭제 → AlertDialog confirm → "삭제" expense red 버튼 (plan020) → 삭제 + toast
- 다크 모드 → 모든 Dialog 자연

### 5. 8단계 체크리스트

| 단계 | 확인 |
|---|---|
| 1 구현가능성 | EmptyState 공용 + Tailwind v4 arbitrary class ✅ |
| 2 기술스택 | 변경 없음 ✅ |
| 3 사용자흐름 | CRUD 동작 보존 ✅ |
| 4 UI | Hero + CategoryItem 토큰 + EmptyState + Dialog 토큰 ✅ |
| 5 API | 변경 없음 ✅ |
| 6 아키텍처 | CategoriesHero 신설 + EmptyState 재사용 ✅ |
| 7 ADR | skip (기존 패턴 재사용) ✅ |
| 8 docs | flow.md §14-5 ✅ |

### 6. `index.json` status 마킹 + commit

```bash
git add tasks/plan024-categories-redesign/index.json
git commit -m "chore(plan024): mark task completed"
git push
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/categories/_components/CategoryList.tsx` | EmptyState 재사용 |
| `src/app/(authenticated)/categories/_components/AddCategoryDialog.tsx` | legacy 토큰 교체 |
| `src/app/(authenticated)/categories/_components/EditCategoryDialog.tsx` | legacy 토큰 교체 |
| `tasks/plan024-categories-redesign/index.json` | status=completed |

## Out of Scope

- 색상 picker 컴포넌트 신설 — 기존 유지
- 카테고리 정렬 / 검색 — 별도 plan
- 사용 통계 — 별도 plan

## Risks

| 리스크 | 완화 |
|---|---|
| `EmptyState` 컴포넌트 prop 시그니처가 예상과 다름 | 구현 시 실제 파일 확인 후 prop 정확히 맞춤 |
| Dialog 안에 legacy 토큰이 광범위 (192~195 줄 파일) → 5 작업 항목 한도 위험 | className 1:1 교체는 단일 책임 작업으로 분류. 5 항목 카운트 시 (a) EmptyState 교체 (b) AddDialog 토큰 (c) EditDialog 토큰 (d) verification (e) commit |
| `EmptyState` 안에 CTA prop 이 있으면 페이지 우상단 "카테고리 추가" 버튼과 중복 | Empty state 시점에는 페이지 우상단 버튼 1개로 충분. CTA inline 은 의도 — 둘 다 표시해도 정보 중복은 아님 (입구 2개) |
