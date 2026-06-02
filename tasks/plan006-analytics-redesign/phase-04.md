# Phase 04 — MonthlyTrendBar + CategoryDetailList

**Model**: sonnet
**Status**: pending
**Goal**: 월별 지출 추이 bar chart 신규 (Daily 제거) + 카테고리 상세 리스트 (progress + 전월 delta).

## Context (자기완결)

- handoff:
  - mobile.jsx line 687~720 — bar chart 140px height, 마지막 막대 `--ab-brand-500` 강조 + 라벨 굵게
  - desktop.jsx line 743~786 — 180px height + 평균 표기 + 막대 위 수치 라벨
  - mobile.jsx line 722~770 / desktop.jsx line 789~838 — 카테고리 리스트 progress bar + 전월 delta % (양수=expense 색, 음수=income 색)
- 데이터: phase-01 의 `MonthlyTrend` (월별 추이) + `CategoryWithDelta[]`
- 현재 `_components/DailyBarChart.tsx` (74줄) — recharts Bar 일별. **제거 + Monthly 신규**.

## 작업 항목

### 1. `MonthlyTrendBar` 신규

`src/app/(authenticated)/analytics/_components/MonthlyTrendBar.tsx`. Props:

```ts
interface MonthlyTrendBarProps {
  trend: MonthlyTrend;       // phase-01
}
```

Layout:
- 헤더: "월별 지출 추이" 제목 + 우측 "평균 ₩X" (데스크톱만)
- bars: `flex items-end` + 각 막대 height = `(point.totalExpense / max) * 100%`
- 마지막 막대 (현재 월): `bg-brand-500` + 라벨 `font-bold`
- 그 외: `bg-brand-100` + 라벨 `font-medium text-fg-muted`
- 모바일 140px / 데스크톱 180px (`h-[140px] md:h-[180px]`)
- 데스크톱은 막대 위에 `text-brand-700` 으로 `₩X만` 표기

recharts 가 아닌 순수 CSS bar (단순 div 비율). handoff 가 recharts 의존 안 함. recharts 도입 시 ResponsiveContainer 등 오버헤드 — 단순 막대라 div 가 자연스러움.

### 2. `CategoryDetailList` 신규

`src/app/(authenticated)/analytics/_components/CategoryDetailList.tsx`. Props:

```ts
interface CategoryDetailListProps {
  items: CategoryWithDelta[];      // phase-01
  totalExpense: number;
  topN?: number;                   // default 6
}
```

Layout:
- 헤더: "카테고리별" / 데스크톱은 "카테고리별 상세" + 우측 "전월 대비 증감 포함" 라벨
- 모바일: vertical list — row 마다 icon(36px) + 이름 / 금액 / progress bar + delta %
- 데스크톱: 2-col grid (`grid-cols-2 gap-x-6`) — row 5-col grid (icon 34 / 이름+progress 1fr / 금액 90 / delta 56)
- progress bar: `bg-bg-muted` track + `bg-[var(--color-cat-KEY-fg)]` fill (plan002 톤)
- delta: 양수 → `text-expense` + `+N%` / 음수 → `text-income` + `−N%` / null → "—" 또는 숨김

### 3. `DailyBarChart.tsx` 제거

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/006-analytics-redesign

grep -rn 'DailyBarChart' src/   # 사용처 확인
git rm src/app/\(authenticated\)/analytics/_components/DailyBarChart.tsx
```

`AnalyticsClient.tsx` 의 import + 사용처 제거. backend 의 daily endpoint (`getMonthlyDailyStatsAction`) 호출도 plan006 분석에서 제거되면 정리.

### 4. `AnalyticsClient.tsx` 레이아웃 재구성

handoff 순서로 JSX 재배열:

**모바일** (single column):
```
AnalyticsPeriodToggle (phase 2)
AnalyticsCategoryDonut (phase 3)
MonthlyTrendBar
CategoryDetailList
```

**데스크톱** (responsive grid):
```
AnalyticsPeriodToggle (+ DateRangeChip 우측)
[Donut 1fr | MonthlyTrendBar 1.2fr] 2-col grid
CategoryDetailList (full width, 2-col grid 내부)
```

`md:grid-cols-[1fr_1.2fr]` 패턴.

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/006-analytics-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/app/\(authenticated\)/analytics/_components/MonthlyTrendBar.tsx
test -f src/app/\(authenticated\)/analytics/_components/CategoryDetailList.tsx
test ! -e src/app/\(authenticated\)/analytics/_components/DailyBarChart.tsx

grep -rn 'DailyBarChart' src/ | wc -l   # = 0

# brand-500/100 토큰 (마지막 막대 vs 나머지)
grep -nE 'bg-brand-500|bg-brand-100' src/app/\(authenticated\)/analytics/_components/MonthlyTrendBar.tsx | wc -l   # >= 2

# delta 색 분기 (expense/income 토큰)
grep -nE 'text-expense|text-income' src/app/\(authenticated\)/analytics/_components/CategoryDetailList.tsx | wc -l   # >= 2

# 4 컴포넌트 page.tsx 순서
node -e "const s=require('fs').readFileSync('src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx','utf8'); const order=['<AnalyticsPeriodToggle','<AnalyticsCategoryDonut','<MonthlyTrendBar','<CategoryDetailList']; let last=-1; for (const c of order) { const i=s.indexOf(c); if (i<0||i<=last) { console.error('order broken:', c); process.exit(1) } last=i; } console.log('ok')"
```

수동 smoke: `/analytics?period=m6` → Donut + 6개 월 trend bar + 카테고리 리스트. 마지막 bar (현재 월) brand-500 강조. delta % 색 정상 (expense 빨강 / income 초록).

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/analytics/_components/MonthlyTrendBar.tsx` | 신규 |
| `src/app/(authenticated)/analytics/_components/CategoryDetailList.tsx` | 신규 |
| `src/app/(authenticated)/analytics/_components/DailyBarChart.tsx` | 삭제 |
| `src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` | 수정 (레이아웃 재구성 + import 교체) |

## Out of Scope

- 막대 hover tooltip (recharts 없이 직접 구현은 plan007+ 검토)
- delta=null 케이스의 시각 처리 정밀화 ("—" 또는 영역 숨김 — phase 본문 결정 따라 단순 구현)
- 카테고리 클릭 → /transactions filter — plan007+

## Risks

| 리스크 | 완화 |
|---|---|
| `getMonthlyDailyStatsAction` 가 dashboard CalendarView 에서도 사용 중일 가능성 | grep 으로 사용처 확인 — analytics 외 사용처 있으면 action 자체는 보존, AnalyticsClient 의 호출만 제거 |
| 막대 라벨 (y1 12개월) 이 좁아서 어색함 | `text-xs` + 모바일은 짝수 월만 표기 같은 분기 가능 — 본 plan 은 매월 표기, 가독성 부족 시 plan007+ 조정 |
| delta 색이 카테고리 톤과 충돌 (식비 cell 안의 + delta 가 같은 톤?) | delta 는 별도 영역 (progress 우측) 에 표기 — cell 톤과 분리. 시각 충돌 0 |
