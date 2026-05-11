# Phase 03 — CategoryDonut + 전월 delta 표기

**Model**: sonnet
**Status**: pending
**Goal**: 카테고리 분포 Donut + 중앙 합계 + 전월 대비 delta 표시. plan002 의 Donut 패턴 재사용.

## Context (자기완결)

- handoff:
  - mobile.jsx line 647~685 — Donut 172px + 중앙 "5월 지출" + 합계 + ↓13.8% 전월 delta + legend (6개 카테고리 dot+이름)
  - desktop.jsx line 700~741 — Donut 160px + 우측 legend (6개 카테고리 dot+이름+%)
- plan002 `src/components/dashboard/CategoryDistribution.tsx` 가 동일 Donut + 리스트 패턴. 컴포넌트 직접 재사용 또는 일반화.
- 현재 `_components/CategoryPieChart.tsx` (52줄) — recharts Pie 기본 사용. 디자인 교체.
- 데이터: phase 01 의 `getCategoryBreakdownWithDelta` (delta 포함).

## 작업 항목

### 1. `AnalyticsCategoryDonut` 신규

`src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut.tsx`. Props:

```ts
interface AnalyticsCategoryDonutProps {
  breakdown: {
    totalExpense: number;
    items: CategoryWithDelta[];
    year: number;
    month: number;
  };
  topN?: number;   // default 6
}
```

Layout:
- 모바일: Donut 172px 위에 + 중앙에 "5월 지출" 라벨 + 22px num 합계 + `text-expense` 11px delta (이전 달 합계 대비 — 전체 합계의 delta 계산)
- 데스크톱: Donut 160px 좌측 + 1fr legend 우측 (이름 + %)
- Donut 색: plan002 의 `getCategoryToneKey` + `--color-cat-{key}-fg` 토큰 (Pie cell fill)

### 2. 전체 합계 delta 사용

phase-01 의 `CategoryBreakdownWithDelta.totalDelta` 가 이미 service 측에서 계산됨 (`((curTotal - prevTotal) / prevTotal) * 100`, prev=0 시 null). UI 는 `breakdown.totalDelta` 를 그대로 표시.

### 3. `CategoryPieChart.tsx` 제거

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/006-analytics-redesign

grep -rn 'CategoryPieChart' src/   # 사용처 확인
git rm src/app/\(authenticated\)/analytics/_components/CategoryPieChart.tsx
```

`AnalyticsClient.tsx` 의 import + 사용처를 `AnalyticsCategoryDonut` 로 교체.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/006-analytics-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/app/\(authenticated\)/analytics/_components/AnalyticsCategoryDonut.tsx
test ! -e src/app/\(authenticated\)/analytics/_components/CategoryPieChart.tsx

grep -rn 'CategoryPieChart' src/ | wc -l   # = 0
grep -n 'AnalyticsCategoryDonut' src/app/\(authenticated\)/analytics/ -r | wc -l   # >= 2

# 카테고리 톤 토큰 사용 (plan002 헬퍼)
grep -nE 'getCategoryToneKey|color-cat-' src/app/\(authenticated\)/analytics/_components/AnalyticsCategoryDonut.tsx | wc -l   # >= 1

# .num 클래스 (합계 표기)
grep -nE 'className=["\x27].*num' src/app/\(authenticated\)/analytics/_components/AnalyticsCategoryDonut.tsx | wc -l   # >= 1
```

수동 smoke: `/analytics?period=m1` → Donut + 중앙 합계 + delta. delta=null (직전 달 없음) 케이스에서 "—" 또는 숨김 표시.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/analytics/_components/AnalyticsCategoryDonut.tsx` | 신규 |
| `src/app/(authenticated)/analytics/_components/CategoryPieChart.tsx` | 삭제 |
| `src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` | 수정 (import 교체) |

## Out of Scope

- 카테고리별 클릭 → drill-down (`/transactions?categoryId=...`) — plan007+
- 기간 m3/m6/y1 의 합계 표기 ("5월 지출" → "3개월 합계" 등 라벨 분기) — plan007+
- 다중 카테고리 grouping (예: "기타 N개")

## Risks

| 리스크 | 완화 |
|---|---|
| 카테고리 7개 이상 시 legend 줄바꿈 어색 | `flex-wrap` + `topN=6` slice. 7번째부터 "기타" 합산은 plan007+ |
| delta=null (직전 달 데이터 없음) UX | "—" 또는 영역 숨김. 첫 가입 가구 케이스 점검 |
| recharts Pie 의 `minAngle` (0~3% 카테고리 가시성) | 4도 이상 보장. legend 가 백업 정보 |
