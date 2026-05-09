# Phase 01 — type/service/action (date 그룹 + 검색/금액 query)

**Model**: sonnet
**Status**: pending
**Goal**: /transactions 리디자인의 데이터 토대 — 일자별 그룹 helper, 검색/금액 필터 query param 확장, backend 응답 실측.

## Context (자기완결)

- 현재 `src/app/(authenticated)/transactions/page.tsx` 는 `searchParams { tab, categoryId, startDate, endDate, page, limit }` 를 받아 service 호출.
- handoff filter chips: 카테고리 / 기간 / **금액** / **검색** — `amountMin/amountMax/q` query param 신규.
- ADR-F16 (카테고리 집계는 Server Action 측) 정신 동일하게 — 일자 그룹/일일 합계도 service 측 집계. backend endpoint 신설 회피.
- 기존 `src/services/expense/` 에 list 서비스 있음 (실측 필요). plan002 의 `category-tone.ts` 헬퍼는 row 디자인에서 재사용.

## 작업 항목

### 1. backend 응답 실측 — 검색/금액 query param 지원 여부

dev/staging 환경에서 `GET /families/{u}/expenses?q=foo&amountMin=1000&amountMax=50000` 호출. 결과를 phase commit message 에 명시 (`backend q/amount: 지원/미지원`).

미지원 시 phase 3 의 검색/금액 필터는 클라 측 후처리 (받은 month 결과 안에서 필터). row 수가 임계 이내면 충분 (ADR-F16 임계 트리거 동일).

### 2. type 추가

`src/types/transaction.ts` (또는 expense.ts) 에:

```ts
export interface DateGroup<T> {
  date: string;       // YYYY-MM-DD
  totalAmount: number;
  items: T[];
}

export interface TransactionFilters {
  categoryUuid?: string;
  startDate?: string;
  endDate?: string;
  amountMin?: number;
  amountMax?: number;
  q?: string;         // memo 검색
}
```

### 3. service `groupTransactionsByDate(items)` 헬퍼

`src/services/expense/expense-service.ts` 또는 새 파일 `src/services/transaction/transaction-service.ts`. 입력 expenses/incomes 배열, 출력 `DateGroup<T>[]` (date desc 정렬, 같은 date 안에서는 시간 desc).

`expense.date` 가 ISO 문자열이면 `YYYY-MM-DD` 만 추출해 grouping key. 합계 = `Math.abs(item.amount)` 누적 (수입/지출 모두 양수).

### 4. action 시그니처 확장 — 검색/금액 query

기존 `getExpensesAction` (또는 동일 책임 action) 에 `amountMin?, amountMax?, q?` 옵션 인자 추가. backend 가 query param 지원 시 그대로 전달, 미지원 시 service 가 fetch 후 클라 필터.

```ts
export async function getExpensesAction(
  filters: TransactionFilters & { tab: "expenses" | "incomes" | "recurring", page?: number },
): Promise<ActionResult<{ items: Expense[]; dateGroups: DateGroup<Expense>[]; totalCount: number }>>
```

ADR-F04: action 은 인증·검증·service 호출만. 그룹화는 service 책임.

### 5. service 단위 테스트

`src/__tests__/services/transaction/groupTransactionsByDate.test.ts`. 케이스:
- 정상 5건 → 3 date 그룹, 각 합계 정확
- 빈 배열 → `[]`
- 같은 date 다른 시간 → 시간 desc 정렬
- amountMin/amountMax 클라 필터 (backend 미지원 시) 동작

ADR-F09 jest.mock 방식.

### 6. 자동 verification

```bash
pnpm lint
pnpm tsc --noEmit
pnpm test src/__tests__/services/transaction/ --run

grep -nE 'DateGroup|TransactionFilters' src/types/ | wc -l   # >= 2
grep -n 'groupTransactionsByDate' src/services/ -r | wc -l    # >= 1

# ADR-F04 위반 없음
! grep -nE 'from ["\x27]@/actions' src/services/transaction/ src/services/expense/expense-service.ts 2>/dev/null
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/types/transaction.ts` (또는 `expense.ts`) | 수정 — `DateGroup`, `TransactionFilters` 추가 |
| `src/services/transaction/transaction-service.ts` (또는 기존 service) | 수정 — `groupTransactionsByDate` + 클라 필터 helper |
| 기존 expenses/incomes action | 수정 — 시그니처에 `amountMin/amountMax/q` 추가 |
| `src/__tests__/services/transaction/groupTransactionsByDate.test.ts` | 신규 |

## Out of Scope

- UI 컴포넌트 (phase 2~4)
- backend `q/amountMin/amountMax` 신설 요청 — 부재 시 클라 필터로 우선 처리, plan004+ 에서 backend issue 분리
- 페이지네이션 변경 (현재 `page/limit` 그대로)
- `RecurringExpenseList` 의 데이터 구조 (탭 셋 안에 유지, row 디자인은 phase 4)

## Risks

| 리스크 | 완화 |
|---|---|
| 월 거래수가 클라 필터 한계 (500+) 초과 | ADR-F16 임계 트리거 — backend query param 도입 plan 분리 |
| backend 가 `q` 만 지원하고 `amount*` 미지원 (또는 반대) | service 측 hybrid — backend 지원 query 는 server, 미지원은 client. 결과는 동일 shape |
| 그룹 key 가 timezone 영향 받음 | `date-timezone.ts` (이미 utils 에 있음) 사용 — UTC 기반 통일 |
