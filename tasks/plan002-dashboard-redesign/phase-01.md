# Phase 01 — type/service/action (카테고리 집계 + 입력자 정보)

**Model**: sonnet
**Status**: pending
**Goal**: 대시보드 리디자인의 데이터 토대 — 카테고리 월 분포 service+action+type 추가 + `RecentExpense.createdBy?` 옵션 필드 도입.

## Context (자기완결)

- ADR-F16 결정: 카테고리 월 합계는 backend 신규 endpoint 없이 기존 `GET /expenses?month=YYYY-MM` 응답을 service 측에서 service-side 집계.
- 기존 dashboard service: `src/services/dashboard/dashboard-service.ts` — `getDashboardStats`, `getRecentExpenses`. 이 파일에 `getMonthlyCategoryBreakdown` 추가.
- 기존 type: `src/types/dashboard.ts` — `RecentExpense`, `DashboardStats`. 신규 type 동일 파일에 추가.
- backend 응답에 `createdBy*` 필드와 `families.members` 필드 존재 여부는 미지수 — 본 phase 의 type 은 둘 다 옵션 필드 (`createdBy?`, `members?`) 로 정의해 backend 응답 형태와 무관하게 컴파일/렌더 가능. 실제 데이터 매핑은 phase 5 에서 graceful 처리.

## 작업 항목 (5개)

### 1. type 추가

`src/types/dashboard.ts`:
- `CategoryBreakdownItem { categoryUuid, name, icon, color?, totalAmount, percentage }`
- `MonthlyCategoryBreakdown { year, month, totalExpense, items: CategoryBreakdownItem[] }`
- `RecentExpense.createdBy?: { uuid, name }` (옵션)

`Family` 또는 `selectedFamily` 타입의 `members?` 필드 (uuid, name, avatarUrl?) 가 부재하면 동일 PR 에서 옵션 필드로 추가. 이미 있으면 phase 2 에서 그대로 사용.

### 2. service `getMonthlyCategoryBreakdown(familyUuid, year, month)`

`src/services/dashboard/dashboard-service.ts`. 기존 expenses fetch helper 재사용. 카테고리 uuid 기준 Map 누적, `amt > 0 && Number.isFinite` 필터, totalAmount desc 정렬, percentage = `Math.round((amt/total)*100)`.

⚠️ ADR-F04: services 가 actions import 금지. 기존 service 의 expenses fetch 패턴 재사용.

### 3. action `getMonthlyCategoryBreakdownAction(year?, month?)`

`src/actions/dashboard/get-monthly-category-breakdown-action.ts` 신규. 패턴은 `get-dashboard-stats-action.ts` 동일 — `requireAuth` + `getSelectedFamilyUuid` + service 호출. year/month 미지정 시 현재 시각 기준. 1<=month<=12, 2000<=year<=2100 Zod 검증.

### 4. service 단위 테스트

`src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts`. 케이스:
- 정상 3 카테고리 × 4건 → 합계/percentage 정확
- 빈 배열 → `items: []`, `totalExpense: 0`
- 음수/0/NaN 무시
- ADR-F09 jest.mock 방식 (`jest.mock("@/lib/server/api", ...)`)

### 5. 자동 verification

```bash
# cwd: <worktree root>
pnpm lint
pnpm tsc --noEmit
pnpm test src/__tests__/services/dashboard/

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
| `src/types/dashboard.ts` | 수정 (type 3개 추가 + 옵션 필드) |
| `src/services/dashboard/dashboard-service.ts` | 수정 (`getMonthlyCategoryBreakdown` 추가) |
| `src/actions/dashboard/get-monthly-category-breakdown-action.ts` | 신규 |
| `src/__tests__/services/dashboard/getMonthlyCategoryBreakdown.test.ts` | 신규 |

## Out of Scope

- 컴포넌트 / UI 변경 (phase 2~5)
- page.tsx 레이아웃 (phase 5)
- backend `createdBy` / `members` 신설 요청 — 옵션 필드로 충분, plan003+ 에서 backend 점검 후 강제 필드화 결정
- Top N 슬라이싱 (UI 측 책임 — phase 4)

## Risks

| 리스크 | 완화 |
|---|---|
| 월 거래 수가 임계 (500건+) 초과해 응답 지연 | ADR-F16 임계 트리거에 명시. plan002 단계는 100~300건 가정 |
| backend 응답에 `createdBy*` / `members` 부재 | 옵션 필드 정의로 컴파일·렌더 무관. UI graceful 처리는 phase 2/5 책임 |
| expenses fetch helper 가 다른 month 형식 사용 | 호출 시 helper 시그니처에 맞춤. `YYYY-MM` 외 형식이면 helper 분기 추가 |
