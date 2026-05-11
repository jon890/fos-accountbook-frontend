# Phase 01 — type/service/action + backend issue 등록

**Model**: sonnet
**Status**: pending
**Goal**: 월별 지출 추이 + 전월 대비 delta 데이터 layer 신규. 클라 집계 우선 구현 + backend `monthly-trend` endpoint issue 동시 등록 (후속 plan 에서 backend endpoint 전환).

## Context (자기완결)

- 현재 코드: `src/app/(authenticated)/analytics/_components/{AnalyticsClient,CategoryPieChart,DailyBarChart}.tsx`. service/action layer 미존재 (page.tsx 가 직접 처리하거나 dashboard action 재사용 추정 — 점검).
- plan002 의 service 함수 `getMonthlyCategoryBreakdown(familyUuid, year, month)` 가 `src/services/dashboard/dashboard-service.ts:85` 에 존재 (ADR-F16) — 본 plan 재사용 + 직전 달 호출로 delta 계산. Action 아니라 service 함수 직접 import (ADR-F04 위반 아님 — service → service).
- handoff 가 요구하는 데이터:
  - 월별 합계 추이 (6~12 month: 기간 토글 m3/m6/y1)
  - 카테고리별 전월 대비 delta % (이번 달 + 직전 달 비교)
- ADR-F16 임계 트리거 (월 500건 / TTI 700ms) 가 6개월/1년 fetch 시 도달 가능 → backend endpoint 필요. 본 plan 은 클라 집계 + backend issue 등록 두 트랙.

## 작업 항목

### 1. type 추가

`src/types/analytics.ts` 신규 (또는 `dashboard.ts` 확장):

```ts
export type AnalyticsPeriod = "m1" | "m3" | "m6" | "y1";

export interface MonthlyTrendPoint {
  year: number;
  month: number;          // 1~12
  totalExpense: number;
}

export interface MonthlyTrend {
  period: AnalyticsPeriod;
  points: MonthlyTrendPoint[];   // 시간 asc 정렬
  average: number;               // 기간 평균
}

export interface CategoryWithDelta {
  categoryUuid: string;
  name: string;
  icon: string;
  totalAmount: number;
  percentage: number;
  deltaPercent: number | null;   // 전월 대비 %, null = 직전 달 데이터 없음
}

// service `getCategoryBreakdownWithDelta` 의 반환 wrapper (phase 3 UI 가 직접 사용)
export interface CategoryBreakdownWithDelta {
  year: number;
  month: number;
  totalExpense: number;
  totalDelta: number | null;     // 전체 합계의 전월 대비 %, null = 직전 달 데이터 없음
  items: CategoryWithDelta[];
}
```

### 2. service `getMonthlyTrend` + `getCategoryBreakdownWithDelta`

`src/services/analytics/analytics-service.ts` 신규:

- `getMonthlyTrend(familyUuid, period)`: period 에 따라 시작 월 계산 (m1=1, m3=3, m6=6, y1=12). 각 월별 expenses fetch 후 합계 누적. 평균 계산.
- `getCategoryBreakdownWithDelta(familyUuid, year, month): Promise<CategoryBreakdownWithDelta>`: plan002 `getMonthlyCategoryBreakdown` 을 이번 달 + 직전 달 두 번 호출. 각 카테고리 uuid 매칭으로 delta % 계산 (`((cur - prev) / prev) * 100`). 직전 달 부재 시 `deltaPercent: null`. 전체 합계의 `totalDelta` 도 동일 계산 (직전 달 totalExpense=0 시 null).

ADR-F04: services 가 actions 호출 금지. 기존 expense service 재사용.

### 3. action 신규

- `src/actions/analytics/get-monthly-trend-action.ts`
- `src/actions/analytics/get-category-breakdown-with-delta-action.ts`

기존 `get-dashboard-stats-action.ts` 패턴 동일. `requireAuth` + `getSelectedFamilyUuid` + service 호출.

### 4. backend issue 등록 — `monthly-trend` endpoint 요청

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/006-analytics-redesign

gh issue create --repo jon890/fos-accountbook-backend \
  --title "feat(stats): GET /families/{uuid}/stats/monthly-trend endpoint" \
  --body "$(cat <<'EOF'
## 배경

frontend plan006 (analytics 리디자인) 에서 월별 지출 추이 + 카테고리 전월 대비 delta 가 핵심 시각화 요소. 현재 ADR-F16 정신으로 클라 집계 우선 구현 중이지만, 기간 토글 6개월/1년 옵션에서 클라가 6~12개월 expenses 를 한 번에 fetch → ADR-F16 임계 트리거 (월 500건 / TTI 700ms) 도달 위험.

## 요청 endpoint

- `GET /families/{uuid}/stats/monthly-trend?from=YYYY-MM&to=YYYY-MM` — 월별 합계 + 평균
- `GET /families/{uuid}/stats/category-breakdown?year=Y&month=M&compareWithPrev=true` — 카테고리 분포 + 전월 delta 통합

## 응답 스키마 초안

\`\`\`json
// monthly-trend
{
  \"points\": [{ \"year\": 2026, \"month\": 5, \"totalExpense\": 2170000 }],
  \"average\": 1985000
}

// category-breakdown with delta
{
  \"year\": 2026, \"month\": 5, \"totalExpense\": 2170000,
  \"items\": [
    { \"categoryUuid\": \"...\", \"name\": \"식비\", \"totalAmount\": 480000,
      \"percentage\": 22, \"deltaPercent\": 12 }
  ]
}
\`\`\`

## frontend 측 동작

- backend endpoint 도착 전: 클라 집계 (plan006 phase-01 구현)
- backend endpoint 도착 후: plan007 또는 plan006-2 에서 service 측 호출 전환. type 시그니처 동일하게 설계 (DTO 호환)

## 관련

- frontend plan006: tasks/plan006-analytics-redesign/
- ADR-F16 (frontend): 임계 트리거 도달 시 backend 분리 결정
EOF
)"
```

issue URL 을 commit message 본문에 명시.

### 5. service 단위 테스트 + verification

`src/__tests__/services/analytics/`:
- `getMonthlyTrend.test.ts` — m1/m3/m6/y1 각 기간별 점 개수 + 평균 검증, 빈 월 (expenses 0건) 처리
- `getCategoryBreakdownWithDelta.test.ts` — 이번 달 only / 직전 달 only / 양쪽 있음 케이스, delta % 정확성, deltaPercent=null 케이스
- ADR-F09 jest.mock 방식

자동 verification:

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/006-analytics-redesign

pnpm lint
pnpm tsc --noEmit
pnpm test src/__tests__/services/analytics/ --run

test -f src/types/analytics.ts
test -f src/services/analytics/analytics-service.ts
test -f src/actions/analytics/get-monthly-trend-action.ts
test -f src/actions/analytics/get-category-breakdown-with-delta-action.ts

# ADR-F04 위반 없음
! grep -nE 'from ["\x27]@/actions' src/services/analytics/
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/types/analytics.ts` | 신규 |
| `src/services/analytics/analytics-service.ts` | 신규 |
| `src/actions/analytics/get-monthly-trend-action.ts` | 신규 |
| `src/actions/analytics/get-category-breakdown-with-delta-action.ts` | 신규 |
| `src/__tests__/services/analytics/*.test.ts` | 신규 2건 |

## Out of Scope

- UI 컴포넌트 (phase 2~4)
- backend endpoint 구현 자체 — issue 등록만, 실제 구현은 backend 팀
- backend endpoint 도착 후 service 전환 — plan007 (또는 plan006-2)

## Risks

| 리스크 | 완화 |
|---|---|
| 1년 (y1) 기간 토글 시 12개월 × 평균 200건 = 2400건 fetch — 클라 처리 한계 | backend issue 등록으로 후속 전환 경로 확보. 사용자 측에서 y1 사용 빈도 낮으면 클라 집계로도 감당 가능 |
| 직전 달 expenses 가 0건이라 delta 분모 0 | `deltaPercent: null` 반환. UI 측에서 "신규" 또는 "—" 표시 (phase 4) |
| service 가 dashboard service 와 중복 fetch 로직 | `getMonthlyCategoryBreakdown` (plan002) 직접 import 재사용. fetch helper 도 공통 추출 검토 |
