# Phase 01 — type/service/action (date 그룹 + 검색/금액 query)

**Model**: sonnet
**Status**: pending
**Goal**: /transactions 리디자인의 데이터 토대 — 일자별 그룹 helper, 검색/금액 필터 query param 확장.

## Context (자기완결)

- 현재 `src/app/(authenticated)/transactions/page.tsx` 는 `searchParams { tab, categoryId, startDate, endDate, page, limit }` 를 받아 service 호출.
- handoff filter chips: 카테고리 / 기간 / **금액** / **검색** — `amountMin/amountMax/q` query param 신규.
- ADR-F16 (server-side 집계) 동일 정신 — 일자 그룹/일일 합계도 service 측. backend endpoint 신설 회피.
- **기존 `src/lib/utils/group-by-date.ts` 의 `groupByDate<T extends { date: string }>` + `getDateLabel` 재사용** (신규 함수 생성 금지). plan003 은 이 위에 합계 필드만 추가하는 thin wrapper.
- backend 의 `q/amountMin/amountMax` 지원 여부 미지수 — 옵션 인자로 정의 후 service 가 backend 응답을 그대로 받아 클라 측에서도 동일 필터 재적용 (hybrid). 임계 (월 500건+) 이내라 클라 필터로 충분.

## 작업 항목 (5개)

### 1. type 추가

`src/types/transaction.ts` (또는 `expense.ts` 확장):

```ts
export interface DateGroupWithTotal<T> {
  dateKey: string;     // YYYY-MM-DD
  label: string;       // "오늘" / "어제" / "M월 d일"
  totalAmount: number; // 그룹 내 |amount| 합계
  items: T[];
}

export interface TransactionFilters {
  categoryUuid?: string;
  startDate?: string;
  endDate?: string;
  amountMin?: number;
  amountMax?: number;
  q?: string;          // memo 검색
}
```

### 2. service helper — 기존 `groupByDate` wrap + 합계 계산

`src/services/transaction/transaction-service.ts` 신규.

```ts
import { groupByDate } from "@/lib/utils/group-by-date";

export function groupTransactionsWithTotal<T extends { date: string; amount: number }>(
  items: T[]
): DateGroupWithTotal<T> {
  const groups = groupByDate(items);
  return groups.map((g) => ({
    ...g,
    totalAmount: g.items.reduce((s, x) => s + Math.abs(x.amount), 0),
  }));
}

export function applyClientFilters<T extends { amount: number; memo?: string | null }>(
  items: T[], filters: { amountMin?: number; amountMax?: number; q?: string }
): T[] { /* memo 검색 + amount 범위 */ }
```

신규 `groupByDate` 절대 작성 금지 — 기존 util 만 사용.

### 3. action 시그니처 확장

기존 `getExpensesAction` 에 `amountMin?, amountMax?, q?` 옵션 인자 추가. service 가 backend 결과를 받아 `applyClientFilters` 거친 뒤 `groupTransactionsWithTotal` 적용.

```ts
export async function getExpensesAction(
  filters: TransactionFilters & { tab: "expenses" | "incomes" | "recurring", page?: number },
): Promise<ActionResult<{ items: Expense[]; dateGroups: DateGroupWithTotal<Expense>[]; totalCount: number }>>
```

`totalCount` 책임: backend 가 query param 지원 시 backend `totalCount` 그대로, 미지원 시 클라 필터 적용 후 길이. service 가 두 케이스 모두 캡슐화. ADR-F04 — action 은 인증·검증·service 호출만, 그룹화/필터는 service.

Zod 검증 (ADR-F06): `amountMin/Max` 음수 금지, `q` 길이 ≤ 100자.

### 4. service 단위 테스트

`src/__tests__/services/transaction/transaction-service.test.ts`. 케이스:
- `groupTransactionsWithTotal` 5건 → 3 그룹 + 합계 정확
- 빈 배열 → `[]`
- `applyClientFilters` amountMin/Max 경계 / q 부분일치 (case-insensitive)
- ADR-F09 jest.mock 방식

### 5. 자동 verification

```bash
# cwd: <worktree root>
pnpm lint
pnpm tsc --noEmit
pnpm test src/__tests__/services/transaction/

grep -nE 'DateGroupWithTotal|TransactionFilters' src/types/ -r | wc -l   # >= 2
grep -n 'groupTransactionsWithTotal' src/services/transaction/transaction-service.ts | wc -l   # >= 1

# 기존 groupByDate 재사용 — 신규 정의 금지
grep -rn 'export function groupByDate\|function groupTransactionsByDate' src/services/ src/lib/ \
  | grep -v 'group-by-date.ts'   # = 0 (lib 의 원본 외 다른 정의 없음)

# ADR-F04 위반 없음
! grep -nE 'from ["\x27]@/actions' src/services/transaction/transaction-service.ts
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/types/transaction.ts` | 신규 또는 `expense.ts` 확장 — `DateGroupWithTotal`, `TransactionFilters` |
| `src/services/transaction/transaction-service.ts` | 신규 — `groupTransactionsWithTotal` + `applyClientFilters` |
| 기존 `getExpensesAction` (또는 동등) | 수정 — 시그니처 + 호출 |
| `src/__tests__/services/transaction/transaction-service.test.ts` | 신규 |
| `src/lib/utils/group-by-date.ts` | **변경 금지 (재사용)** |

## Out of Scope

- UI 컴포넌트 (phase 2~4)
- backend `q/amountMin/Max` 신설 요청 — 부재 시 클라 필터로 처리, 별도 plan/이슈 분리
- 페이지네이션 변경 (현 `page/limit` 유지)
- `RecurringExpenseList` 데이터 구조 (탭 셋 안에 유지, row 디자인은 phase 4)

## Risks

| 리스크 | 완화 |
|---|---|
| 월 거래수가 클라 필터 한계 (500+) 초과 | ADR-F16 임계 트리거 — backend query param 도입 별도 plan |
| backend 가 일부 query 만 지원 | service hybrid — backend 지원 query 는 server, 미지원은 client. 결과 shape 동일 |
| 그룹 key 가 timezone 영향 | 기존 `group-by-date.ts` 가 `format(parseISO(date), "yyyy-MM-dd")` 사용 — 로컬 일자 기준. 별도 처리 불필요 |
