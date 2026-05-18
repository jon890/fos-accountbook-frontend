# Phase 02 — BudgetCumulativeLine (일별 누적 지출 vs 예산 라인 차트)

**Model**: sonnet
**Status**: pending
**Goal**: 월 누적 지출 그래프 + 예산 수평선 + 초과 지점 시각 강조. recharts LineChart 사용 (Dashboard CategoryDistribution 과 일관).

## Context (자기완결)

- 데이터: `getMonthlyDailyStatsAction(year, month)` — analytics 페이지에서 이미 사용
  - 반환 형: `ActionResult<DailyTransactionSummary[]>` — 배열을 그대로 반환 (`items` 래퍼 없음)
  - `DailyTransactionSummary = { date: string; income: number; expense: number }` (`src/services/dashboard/dashboard-service.ts` 의 export type)
- recharts 이미 의존성 설치됨 (`src/components/dashboard/CategoryDistribution.tsx` 의 PieChart 참조)
- 라인 차트는 budget 페이지 단독 — 재사용 컴포넌트 위치 `src/app/(authenticated)/budget/_components/`

## 작업 항목

### 1. `BudgetCumulativeLine.tsx` 컴포넌트 (`"use client"`)

`src/app/(authenticated)/budget/_components/BudgetCumulativeLine.tsx`:

```ts
interface BudgetCumulativeLineProps {
  dailyExpenses: { date: string; income: number; expense: number }[];   // DailyTransactionSummary[] 형태 그대로
  budget: number;                                                       // 월 예산
  daysInMonth: number;
}
```

내부 로직:
- 일별 누적 시퀀스 계산: `acc[i] = acc[i-1] + expense[i]`
- 라인 데이터: `[ { day: 1, cumulative: 0 }, ..., { day: daysInMonth, cumulative: total } ]`
- 예산 수평선: `ReferenceLine y={budget} stroke="brand-700" strokeDasharray="4 4"`
- 라인: `stroke="var(--color-brand-500)"`, `strokeWidth={2.5}`, fill area gradient (옵션)
- 초과 지점: 누적 ≥ 예산 시 빨간 dot

차트 카드 wrapper:
- `bg-bg-elev border-border rounded-2xl p-5 md:p-6`
- 상단: 제목 "이번 달 누적 지출" (text-fg 14px font-semibold) + 우측 범례 (• 누적 · -- 예산)
- 본문: ResponsiveContainer 16:9 비율 (`h-48 md:h-64`)
- 하단: 현재 누적/예산 비율 텍스트 "오늘까지 ₩{cumulative} ({pct}%)"

### 2. recharts 토큰 매핑

CSS 변수를 차트 색에 직접 주입:
- 라인: `stroke="var(--color-brand-500)"`
- 예산선: `stroke="var(--color-brand-700)"`
- 초과 dot: `fill="var(--color-expense)"`
- grid: `stroke="var(--color-border)" strokeOpacity={0.5}`
- tick text: `tick={{ fill: "var(--color-fg-muted)", fontSize: 11 }}`

`tooltip` 커스텀:
- `bg-bg-elev border-border shadow-default rounded-md p-2.5 text-xs text-fg`
- 누적 (.num) + 일자 + 일 지출 (`expense[i]`)

### 3. 예산 미설정 시 처리

`budget === 0` 이면 차트 카드 자체 미렌더 (page.tsx 분기). 본 컴포넌트는 `budget > 0` 전제로 동작.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/013-budget-page-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/app/\(authenticated\)/budget/_components/BudgetCumulativeLine.tsx

# "use client" 첫 줄 (따옴표 포함)
head -1 src/app/\(authenticated\)/budget/_components/BudgetCumulativeLine.tsx | grep -q '"use client"'

# recharts import + ReferenceLine
grep -nE 'from "recharts"' src/app/\(authenticated\)/budget/_components/BudgetCumulativeLine.tsx | wc -l   # >= 1
grep -n 'ReferenceLine' src/app/\(authenticated\)/budget/_components/BudgetCumulativeLine.tsx | wc -l   # >= 1

# CSS 변수 색 매핑
grep -nE 'var\(--color-brand-500\)|var\(--color-expense\)' \
  src/app/\(authenticated\)/budget/_components/BudgetCumulativeLine.tsx | wc -l   # >= 2
```

수동 smoke: `/budget` → 라인 차트 표시. 예산 초과 직전 / 직후 데이터로 빨간 dot 확인. 마우스 hover → tooltip 표시.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/budget/_components/BudgetCumulativeLine.tsx` | 신규 (use client) |

## Out of Scope

- 월 비교 (이번 달 vs 직전 달 라인 2개) — 본 plan 은 이번 달 단독
- 일별 income (수입) 라인 추가 — budget 페이지 관심사 아님
- 차트 export / 캡처 기능

## Risks

| 리스크 | 완화 |
|---|---|
| recharts ResponsiveContainer + Tailwind h-* 충돌 | container 부모에 명시 height 지정. recharts 가 100% 채움 |
| dailyExpenses 데이터가 일자 missing (지출 0 인 날) | client 측에서 1~daysInMonth 채워 보간 (`expense: 0`) |
| dark mode 에서 grid 선 너무 진함 | `strokeOpacity={0.5}` + dark token 자동 적용. 수동 smoke 검증 |
| 모바일 320px 폭에서 라벨 겹침 | x축 `interval="preserveStartEnd"` + `tick` 5일 간격 |
