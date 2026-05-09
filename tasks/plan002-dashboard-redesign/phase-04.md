# Phase 04 — CategoryDistribution 신규 (Donut + top N 리스트)

**Model**: sonnet
**Status**: pending
**Goal**: 핸드오프의 "카테고리 분포" 섹션 — 도넛 차트 + 카테고리별 amount/percentage 리스트. 핵심 강조 영역.

## Context (자기완결)

- 데이터: phase 01 의 `getMonthlyCategoryBreakdownAction()` → `MonthlyCategoryBreakdown { totalExpense, items: CategoryBreakdownItem[] }`.
- 차트 라이브러리: `recharts ^3.8.1` 이미 의존. `src/app/(authenticated)/analytics/_components/CategoryPieChart.tsx` 가 동일 라이브러리 사용 사례 — 패턴 참조.
- 카테고리 톤: handoff `tokens.js` 의 `category` 페어 (10 hue: food coral, cafe bronze, transit blue, telecom violet, home teal, shopping pink, health green, leisure olive, education indigo, etc gray). `bg: oklch(0.945 0.045 H)` + `fg: oklch(0.5x 0.1x H)`.
- 참조 mockup:
  - mobile: `mobile.jsx` line 184~222 (Donut 120px + top 5 list)
  - desktop: `desktop.jsx` line 217~287 (Donut 180px + top 6 list + 기간 segmented control)

## 작업 항목

### 1. 카테고리 톤 토큰화 — globals.css 또는 별도 파일

10개 카테고리 hue + `etc` = 11쌍(bg+fg) = 22개 변수를 토큰화. plan001 의 `@theme` 블록 또는 별도 `--color-cat-{food,cafe,...,etc}` 변수로 globals.css 추가.

```css
--color-cat-food-bg: oklch(0.945 0.045 35);
--color-cat-food-fg: oklch(0.560 0.140 35);
/* 10개 더 (cafe, transit, telecom, home, shopping, health, leisure, education, etc) */
```

키 셋 cross-check: handoff `tokens.js` 의 `category` 키 셋 = (food, cafe, transit, telecom, home, shopping, health, leisure, education, etc). 시작 시 1회 grep 으로 확인.

카테고리 식별자는 backend `Category.name` 한국어 → 토큰 키 매핑 helper 함수 (`src/lib/utils/category-tone.ts`) 신규. 매칭 실패 시 `etc` 톤.

### 2. `CategoryDistribution` 신규

`src/components/dashboard/CategoryDistribution.tsx`. Props: `breakdown: MonthlyCategoryBreakdown`, `topN?: number` (default 모바일 5 / 데스크톱 6 — responsive 처리는 `topN` 두 번 호출보다 한 컴포넌트가 ` items.slice(0, 6)` 후 `md:` 로 6번째 row 표시 제어).

Layout: Donut 좌측 (mobile 120px / desktop 180px) + top N 리스트 우측. Donut 중앙에 "총 지출" + 합계. 리스트 row = 카테고리 아이콘(28px tinted) + 이름 + amount + %.

### 3. Donut 구현 (recharts)

`<PieChart>` + `<Pie data={items} dataKey="totalAmount" innerRadius={...} outerRadius={...} stroke="none" />`. 각 셀의 `fill` 은 카테고리 톤 fg. `<Tooltip />` (recharts 기본) 활성화로 hover 시 amount + %.

**SSR 처리**: 파일 최상단에 `"use client"` 지시자만 사용. `dynamic(... { ssr: false })` 도입 금지 — 기존 `src/app/(authenticated)/analytics/_components/CategoryPieChart.tsx` 가 `"use client"` + `ResponsiveContainer` 조합으로 정상 동작 중인 동일 패턴이라 검증된 경로.

### 4. 빈 상태 / 단일 카테고리 처리

- `breakdown.items.length === 0`: "이번 달 지출 없음" 안내 + Donut 자리에 회색 outline circle.
- `items.length === 1`: 100% Donut 정상 렌더 (recharts 기본 동작).

### 5. page.tsx 통합 + 자동 verification

page.tsx 에서 `getMonthlyCategoryBreakdownAction()` 호출 추가 (`Promise.all` 에 합류). 결과를 `<CategoryDistribution breakdown={...} />` 로 전달. 위치는 `IncomeExpenseStats` 다음 (mockup 순서).

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/dashboard/CategoryDistribution.tsx
test -f src/lib/utils/category-tone.ts
grep -n 'getMonthlyCategoryBreakdownAction' src/app/\(authenticated\)/dashboard/page.tsx | wc -l   # >= 1

# 카테고리 톤 토큰 등록 (10 + etc = 22 변수: bg+fg 페어)
grep -cE '^\s*--color-cat-' src/app/globals.css   # >= 20

# recharts Pie 사용
grep -nE 'from ["\x27]recharts["\x27]' src/components/dashboard/CategoryDistribution.tsx | wc -l   # = 1
grep -n 'innerRadius' src/components/dashboard/CategoryDistribution.tsx | wc -l                    # >= 1
```

수동 smoke: `/dashboard` → 카테고리 분포 도넛 + top 6 리스트. 빈 가구 / 단일 카테고리 케이스 확인.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/dashboard/CategoryDistribution.tsx` | 신규 (`"use client"`) |
| `src/lib/utils/category-tone.ts` | 신규 — 한국어 카테고리명 → 톤 키 매핑 |
| `src/app/globals.css` | 수정 — `--color-cat-*` 22개 토큰 추가 |
| `src/app/(authenticated)/dashboard/page.tsx` | 수정 — action 호출 + 컴포넌트 사용 |

## Out of Scope

- 기간 segmented control (이번달/3개월/6개월) — plan002 는 "이번 달" 만. 3/6개월은 plan003+
- 카테고리 클릭 → analytics drill-down — plan004 (analytics) 책임
- DB 의 `category.color` 와 우리 톤 토큰 충돌 시 어느 쪽 우선 — UI 측 토큰 우선 (handoff 디자인 일관성). DB color 는 무시
- 전월 대비 카테고리 변화 (시각화)

## Risks

| 리스크 | 완화 |
|---|---|
| 한국어 카테고리명이 매핑 helper 의 키 집합과 다름 (예: "음식" vs "식비") | matching 실패 시 `etc` 톤. helper 의 키 셋은 backend Category 시드 데이터와 phase 시작 시 cross-check |
| recharts SSR 경고 (window 미정의) | `"use client"` 지시자만으로 충분 (기존 analytics CategoryPieChart 검증된 패턴) |
| Donut 작은 사이즈에서 0~3% 슬라이스 가시성 | recharts 의 `minAngle` prop (예: 4도) 로 시각 가독 보장 |
| 카테고리가 11개 이상이면 "etc" 단일 합산이 거대해짐 | 본 plan 은 "이번 달" 단위. 가구당 월 활성 카테고리 8~10 추정. 11+ 케이스는 `items.slice(0, 5)` + "기타 N건 N원" 행 추가 검토 — phase 본문 자체에는 미반영, plan003+ |
