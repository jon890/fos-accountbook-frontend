# Phase 03 — BudgetCategoryBars (카테고리 top 5 수평 bar)

**Model**: sonnet
**Status**: pending
**Goal**: 이번 달 카테고리별 지출 top 5 를 수평 bar 로 시각화. 예산 대비 % 동시 표기 — "잘라야 할 항목" 관점 강조 (Dashboard/Analytics 의 donut 과 차별화).

## Context (자기완결)

- 데이터: `getMonthlyCategoryBreakdownAction()` (ADR-F16, Dashboard 에서 이미 사용)
  - 응답: `{ items: { categoryUuid, categoryName, categoryColor?, totalAmount }[] }`
- 카테고리 색 토큰: `--color-cat-{tone}-bg` / `--color-cat-{tone}-fg` (plan002 의 8 팔레트)
- 수평 bar 는 순수 CSS (Tailwind w-* + bg) 또는 SVG — 본 phase 는 CSS 권장 (recharts 오버킬)

## 작업 항목

### 1. `BudgetCategoryBars.tsx` 컴포넌트 (Server 또는 Client — interactive 없음 → Server)

`src/app/(authenticated)/budget/_components/BudgetCategoryBars.tsx`:

```ts
interface BudgetCategoryBarsProps {
  items: { categoryUuid: string; categoryName: string; categoryColor?: string; totalAmount: number }[];
  budget: number;
  monthlyExpense: number;
}
```

내부 로직:
- top 5 만 추출: `items.sort((a,b) => b.totalAmount - a.totalAmount).slice(0, 5)`
- 각 카테고리의 예산 대비 비율: `(totalAmount / budget) * 100`
- bar 폭: `(totalAmount / max(items[0].totalAmount, budget * 0.5)) * 100%` — top 1 기준 100%
- category-tone 매핑: `src/lib/client/category-tone.ts` (plan002 의 helper 재사용)

카드 wrapper:
- `bg-bg-elev border-border rounded-2xl p-5 md:p-6`
- 제목: "카테고리 top 5" (text-fg 14px font-semibold)
- 부제: "이번 달 지출이 큰 순" (text-fg-muted 12px)

각 row 구조:
```tsx
<div className="flex items-center gap-3">
  {/* 36px 카테고리 round (tone bg + fg) */}
  <div className="h-9 w-9 rounded-xl bg-[var(--color-cat-{tone}-bg)] flex items-center justify-center">
    {/* 카테고리 첫 글자 또는 아이콘 */}
    <span className="text-[var(--color-cat-{tone}-fg)] text-sm font-bold">{name[0]}</span>
  </div>
  {/* 본문 */}
  <div className="flex-1 min-w-0">
    <div className="flex justify-between items-baseline">
      <span className="text-fg text-sm font-medium truncate">{categoryName}</span>
      <span className="num text-fg text-sm font-bold">₩{totalAmount.toLocaleString()}</span>
    </div>
    <div className="mt-1.5 h-1.5 rounded-full bg-bg-muted overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${barWidthPct}%`,
          background: `var(--color-cat-${tone}-fg)`,
        }}
      />
    </div>
    <div className="mt-1 flex justify-between text-xs text-fg-muted">
      <span>예산의 {budgetPct}%</span>
      {budgetPct >= 30 && <span className="text-expense font-semibold">↑ 많음</span>}
    </div>
  </div>
</div>
```

### 2. 빈 상태

`items.length === 0` → "이번 달 지출이 아직 없어요" 메시지 + 카드 톤만 (plan012 EmptyState 미니 변형 또는 inline).

### 3. 카테고리 톤 helper 사용

`getCategoryTone(categoryColor)` (plan002 helper) — 카테고리 색 토큰을 8 팔레트 중 하나에 매핑. category-tone helper 위치:
- `src/lib/client/category-tone.ts` 또는 plan002 의 실제 helper 경로 확인 후 import

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/013-budget-page-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/app/\(authenticated\)/budget/_components/BudgetCategoryBars.tsx

# top 5 slice 로직
grep -nE 'slice\(0,\s*5\)' src/app/\(authenticated\)/budget/_components/BudgetCategoryBars.tsx | wc -l   # >= 1

# 카테고리 톤 토큰
grep -nE 'var\(--color-cat-' src/app/\(authenticated\)/budget/_components/BudgetCategoryBars.tsx | wc -l   # >= 2

# 예산 % 계산
grep -nE 'budgetPct|budget.*100' src/app/\(authenticated\)/budget/_components/BudgetCategoryBars.tsx | wc -l   # >= 1
```

수동 smoke: `/budget` → top 5 카테고리 수평 bar + 예산 % + ↑많음 라벨 (30%+) 표시.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/budget/_components/BudgetCategoryBars.tsx` | 신규 (server component) |

## Out of Scope

- 카테고리별 예산 설정 (현재 backend 미지원 — 도메인 확장 필요)
- 카테고리 클릭 → 해당 카테고리만 필터된 transactions 페이지 이동 (선택 기능, 본 plan 미포함)
- 6개 이상 카테고리 "더보기" 토글

## Risks

| 리스크 | 완화 |
|---|---|
| `categoryColor` 가 OKLCH 평면 값이 아닌 hex (legacy) | category-tone helper 가 어떤 입력이든 8 톤 중 매핑하도록 설계됨. plan002 머지된 helper 사용 — 본 phase 가 helper 자체 변경 안 함 |
| budget=0 시 budgetPct 무한대 | budget > 0 분기로 컴포넌트 자체 미렌더 (page.tsx 측 처리) |
| 모바일 320px 폭에서 % 라벨 + 금액 줄바꿈 | `truncate` + `flex-shrink-0` 적절히. 수동 smoke 에서 확인 |
| top 5 너무 적음 (가족 카테고리 3개만) | items.length 만큼만 렌더 (slice 가 자동 처리). 빈 row 미생성 |
