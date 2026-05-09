# Phase 03 — SearchBar + 금액 범위 필터 신규

**Model**: sonnet
**Status**: pending
**Goal**: handoff 의 "검색" + "금액" filter chip + 본문(Sheet/Popover) 신규 도입.

## Context (자기완결)

- phase 1 결과로 `TransactionFilters.amountMin/amountMax/q` type + service 측 클라/서버 필터 로직 준비됨.
- handoff mockup:
  - 검색: 데스크톱 우측 240px input box (mobile.jsx 의 search 아이콘은 클릭 시 필드 노출 가정). desktop.jsx line 419~427.
  - 금액 chip: filter chips 의 한 항목. 클릭 시 sheet/popover 에 min/max input 2개.
- 모바일 검색은 expand-on-click 패턴 — 헤더의 search 아이콘 클릭 → 검색 input 노출. 데스크톱은 항상 노출.
- shadcn `Sheet` 또는 `Popover` 가 이미 사용 중. 금액 필터 본문에 적합.

## 작업 항목

### 1. `SearchBar` 컴포넌트

`src/app/(authenticated)/transactions/_components/SearchBar.tsx`.
- 데스크톱: 항상 노출, `Input` (shadcn) + Search 아이콘.
- 모바일: 트리거 아이콘 (헤더 우측) + 클릭 시 `Sheet` 또는 inline expand.
- `useSearchParams` 의 `q` 와 동기화. 디바운스 300ms (lodash.debounce 미의존 — `setTimeout` 직접).

URL 라우팅 — `?q=foo` 파라미터로 page.tsx 가 다시 fetch. 기존 페이지 패턴 (탭/카테고리) 동일.

### 2. `AmountRangeFilter` 컴포넌트

`src/app/(authenticated)/transactions/_components/AmountRangeFilter.tsx`.
- chip trigger (phase 2 의 FilterChips 안에 통합 또는 별도)
- popover/sheet 본문: `min` + `max` 두 input + "적용" / "초기화" 버튼
- `Input type="number" inputMode="numeric"` + 천 단위 콤마 표시 (display only — 값은 raw number)
- 활성 시 chip 라벨에 값 표시 (예: "1만~5만"). 미선택 시 "금액"

### 3. URL 동기화 + 기존 page.tsx 통합

기존 `searchParams` 인터페이스에 `q?, amountMin?, amountMax?` 추가. action 호출에 전달. 필터 변경 시 `router.replace('/transactions?' + new URLSearchParams(...))` 패턴.

### 4. 빈 결과 / 로딩 처리

검색/필터 결과 0건 시 "조건에 맞는 거래가 없어요" 안내 + 필터 초기화 링크. 로딩 중 (debounce 진행 중) skeleton 또는 기존 Suspense 활용.

### 5. 자동 verification

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/app/\(authenticated\)/transactions/_components/SearchBar.tsx
test -f src/app/\(authenticated\)/transactions/_components/AmountRangeFilter.tsx

# URL searchParams 동기화
grep -nE 'q\?:|amountMin\?:|amountMax\?:' src/app/\(authenticated\)/transactions/page.tsx | wc -l   # >= 3

# 디바운스 300ms
grep -n 'setTimeout.*300\|debounce.*300' src/app/\(authenticated\)/transactions/_components/SearchBar.tsx | wc -l   # >= 1
```

수동 smoke:
- `/transactions` → 검색 input (데스크톱) 또는 검색 아이콘 (모바일) 클릭 → 검색어 타이핑 → 300ms 후 결과 갱신
- 금액 chip 클릭 → popover/sheet → 1만~5만 입력 → "적용" → 결과 갱신, chip 라벨에 "1만~5만"
- "초기화" 클릭 → URL 에서 amount 파라미터 제거

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/transactions/_components/SearchBar.tsx` | 신규 |
| `src/app/(authenticated)/transactions/_components/AmountRangeFilter.tsx` | 신규 |
| `src/app/(authenticated)/transactions/page.tsx` | 수정 — searchParams 인터페이스 확장 |
| `src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` | 수정 — chips 영역에 통합 |

## Out of Scope

- 검색 자동완성 / 최근 검색어 기록 (plan004+)
- 금액 슬라이더 UI (현재 numeric input 으로 충분)
- 검색 결과 하이라이트 (메모 안 keyword 강조) — plan004+
- 다중 카테고리 선택 (현재 단일 categoryId 유지)

## Risks

| 리스크 | 완화 |
|---|---|
| backend `q` 또는 `amount*` 미지원 (phase 1 점검 결과) | service 측 클라 필터로 fallthrough — UI 동작은 동일, 단 페이지네이션 수치는 클라 필터 후 재계산 필요. phase 1 의 service 책임 |
| URL 길이 폭증 (모든 필터 조합) | 빈 값은 URL 에서 제거 (`URLSearchParams` 정제). 기본값 1KB 이내 |
| 디바운스 중 빠른 입력 시 race condition | latest-wins 패턴 — 가장 최근 입력만 적용. AbortController 또는 setState 콜백 |
| 모바일 Sheet/Popover 가 가상 키보드와 충돌 | shadcn Sheet 의 `side="bottom"` + 가상 키보드 푸시 동작 확인 |
