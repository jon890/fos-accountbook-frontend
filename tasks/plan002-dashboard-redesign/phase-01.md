# Phase 01 — type/service/action (카테고리 집계 + 입력자 정보)

**Model**: sonnet
**Status**: pending
**Goal**: 대시보드 리디자인의 데이터 토대 — 카테고리 월 분포 service+action+type 추가 + `RecentExpense.createdBy?` 옵션 필드 도입.

## Context (자기완결)

- ADR-F16 결정: 카테고리 월 합계는 backend 신규 endpoint 없이 기존 `GET /expenses?month=YYYY-MM` 응답을 service 측에서 집계.
- 기존 dashboard service: `src/services/dashboard/dashboard-service.ts` — `getDashboardStats`, `getRecentExpenses`. 이 파일에 `getMonthlyCategoryBreakdown` 추가.
- 기존 type: `src/types/dashboard.ts` — `RecentExpense`, `DashboardStats`. 신규 type 동일 파일에 추가.
- backend 응답에 `createdByUuid`/`createdByName` 존재 여부는 미지수 — phase 시작 시 1건 실측. 없으면 옵션 필드만 추가하고 실제 매핑은 plan003+ 으로.

## 작업 항목

### 1. backend 응답 실측 (createdBy* 존재 여부)

dev/staging 환경에서 expenses 응답 1건 fetch. 결과를 phase commit message 에 1줄 명시 (`backend createdBy 응답: 있음/없음`).

### 2. type 추가

`src/types/dashboard.ts`:
- `CategoryBreakdownItem { categoryUuid, name, icon, color?, totalAmount, percentage }`
- `MonthlyCategoryBreakdown { year, month, totalExpense, items: CategoryBreakdownItem[] }`
- `RecentExpense.createdBy?: { uuid, name }` (옵션 필드 추가)

### 3. service `getMonthlyCategoryBreakdown(familyUuid, year, month)`

기존 expenses fetch helper 재사용. 카테고리 uuid 기준 Map 누적, `amt > 0 && Number.isFinite` 필터 (음수/NaN 제외), totalAmount desc 정렬, percentage = `Math.round((amt/total)*100)`.

⚠️ ADR-F04: services 가 actions import 금지. 기존 service 의 expenses fetch 패턴 재사용.

### 4. action `getMonthlyCategoryBreakdownAction(year?, month?)`

`src/actions/dashboard/get-monthly-category-breakdown-action.ts` 신규. 패턴은 `get-dashboard-stats-action.ts` 동일 — `requireAuth` + `getSelectedFamilyUuid` + service 호출. year/month 미지정 시 현재 시각 기준. 1<=month<=12, 2000<=year<=2100 검증.

### 5. service 단위 테스트

`src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts`. 케이스:
- 정상 3 카테고리 × 4건 → 합계/percentage 정확
- 빈 배열 → `items: []`, `totalExpense: 0`
- 음수/0/NaN 무시
- ADR-F09 jest.mock 방식 (`jest.mock("@/lib/server/api", ...)`)

### 6. 자동 verification

```bash
pnpm lint
pnpm tsc --noEmit
pnpm test src/__tests__/services/dashboard/ --run

test -f src/actions/dashboard/get-monthly-category-breakdown-action.ts
grep -n 'CategoryBreakdownItem\|MonthlyCategoryBreakdown' src/types/dashboard.ts | wc -l   # >= 2
grep -n 'createdBy' src/types/dashboard.ts | wc -l                                          # >= 1
grep -n 'getMonthlyCategoryBreakdown' src/services/dashboard/dashboard-service.ts | wc -l   # >= 1

# ADR-F04 위반 없음
! grep -nE 'from ["\x27]@/actions' src/services/dashboard/dashboard-service.ts
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/types/dashboard.ts` | 수정 (type 3개 추가) |
| `src/services/dashboard/dashboard-service.ts` | 수정 (`getMonthlyCategoryBreakdown` 추가) |
| `src/actions/dashboard/get-monthly-category-breakdown-action.ts` | 신규 |
| `src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts` | 신규 |

## Out of Scope

- 컴포넌트 / UI 변경 (phase 2~5)
- page.tsx 레이아웃 (phase 5)
- backend `createdBy` 신설 요청 — 부재 시 plan003+ 으로 분리
- Top N 슬라이싱 (UI 측 책임 — phase 4)

## Risks

| 리스크 | 완화 |
|---|---|
| 월 거래 수가 임계 (500건+) 초과해 응답 지연 | ADR-F16 임계 트리거에 명시. plan002 단계는 100~300건 가정 |
| backend 응답에 `createdBy*` 부재 | 옵션 필드로 정의 — UI 가 graceful (phase 5). 부재 사실은 commit message + plan003 후속 |
| expenses fetch helper 가 다른 month 형식 사용 | 실측 후 형식 맞춰 호출. `YYYY-MM` 외 형식이면 helper 분기 추가 |
