# Phase 02 — CategoryGrid 신규 (5×2 mobile / 10×1 desktop + 톤 ring)

**Model**: sonnet
**Status**: pending
**Goal**: 카테고리 선택을 라벨/select 형에서 grid + 톤 ring 패턴으로 교체. plan002 의 `category-tone.ts` + `--color-cat-*` 토큰 재사용.

## Context (자기완결)

- handoff mockup:
  - mobile.jsx line 480~511 — `grid-cols-5` 2 row (5×2 = 10 카테고리)
  - desktop.jsx line 542~573 — `grid-cols-10` 1 row + 약간 더 큰 padding
- 선택 시각: 카테고리 톤 `bg` 가 cell 배경으로, `fg` 가 1.5px border (ring 효과). 비선택은 `bg-bg` + `border-border`.
- plan002 산출물:
  - `src/lib/utils/category-tone.ts` — 한국어 카테고리명 → 토큰 키 (`food`/`cafe`/...) 매핑 헬퍼
  - `src/app/globals.css` 의 `--color-cat-{food,cafe,transit,...}-bg` / `-fg` 토큰 22개
- 본 phase 는 plan002 헬퍼만 import 하고 토큰 추가 없음.

## 작업 항목

### 1. `CategoryGrid` 신규 컴포넌트

`src/components/expenses/forms/CategoryGrid.tsx`. Props:

```ts
interface CategoryGridProps {
  categories: CategoryResponse[];   // backend Category 응답
  selectedUuid: string | null;
  onSelect: (uuid: string) => void;
  disabled?: boolean;
}
```

Layout:
- container `grid gap-2 grid-cols-5 md:grid-cols-10`
- cell: 32px (mobile) / 28px (desktop) icon + 11px label
- 선택 시: `bg-[var(--color-cat-{key}-bg)]` + `border-[var(--color-cat-{key}-fg)]` (1.5px) + label `text-[var(--color-cat-{key}-fg)]` `font-bold`
- 비선택: `bg-bg` + `border-border` + label `text-fg-muted` `font-medium`

`category-tone.ts` 의 `getCategoryToneKey(category.name)` 으로 톤 키 추출. 매칭 실패 시 `etc` 톤 (plan002 기본 동작).

### 2. 아이콘 매핑

backend `Category.icon` 필드와 lucide-react 아이콘 이름이 다를 수 있음. plan002 의 매핑 테이블이 있으면 재사용, 없으면 본 phase 에서 신규 (간단한 record):

```ts
import { Utensils, Coffee, Bus, Smartphone, Home, ShoppingBag, ... } from "lucide-react";
const TONE_ICON: Record<string, LucideIcon> = {
  food: Utensils,
  cafe: Coffee,
  // ...
};
```

### 3. 단위 테스트

`src/__tests__/components/expenses/CategoryGrid.test.tsx`. 케이스:
- 카테고리 10개 렌더 (5×2 grid 확인 — `grid-cols-5` 클래스 검증)
- selectedUuid 일치 cell 만 톤 활성 (`bg-[var(--color-cat-` 클래스 매치)
- onSelect 호출 시 uuid 전달
- 매칭 실패 시 `etc` 톤 fallback
- ADR-F09 jest.mock 방식

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/005-add-expense-redesign

pnpm tsc --noEmit
pnpm lint
pnpm test src/__tests__/components/expenses/CategoryGrid.test.tsx --run

test -f src/components/expenses/forms/CategoryGrid.tsx

# plan002 헬퍼 재사용
grep -n 'category-tone\|getCategoryToneKey' src/components/expenses/forms/CategoryGrid.tsx | wc -l   # >= 1

# 톤 토큰 사용
grep -nE 'color-cat-' src/components/expenses/forms/CategoryGrid.tsx | wc -l   # >= 1

# responsive grid 클래스
grep -nE 'grid-cols-5.*md:grid-cols-10|grid-cols-10' src/components/expenses/forms/CategoryGrid.tsx | wc -l   # >= 1
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/expenses/forms/CategoryGrid.tsx` | 신규 |
| `src/__tests__/components/expenses/CategoryGrid.test.tsx` | 신규 |

## Out of Scope

- 톤 토큰 신규 추가 (plan002 의 22 토큰으로 충분)
- 카테고리 신규/수정 UI (기존 categories 페이지 그대로)
- backend `Category.icon` 필드 schema 변경 — 매핑은 클라 측 record

## Risks

| 리스크 | 완화 |
|---|---|
| backend `Category.name` 이 한국어 외 문자 (영어 코드 등) 가능성 | `category-tone.ts` 매핑이 한글 위주. 매칭 실패 시 `etc` 톤 graceful. backend 응답 형식 변경되면 plan002 헬퍼 직접 갱신 |
| `CategoryResponse` 가 10개 미만 (가족이 일부 카테고리 비활성화) | grid 가 자연스럽게 가용 cell 만 채움. 빈 cell 없음 |
| Tailwind v4 의 arbitrary class `bg-[var(--color-cat-food-bg)]` 가 dynamic key 일 때 빌드에서 누락 가능성 | `category-tone.ts` 의 모든 키를 globals.css `@source inline(...)` 또는 컴포넌트 안 정적 매핑 record 로 사용. dynamic class 회피 |
