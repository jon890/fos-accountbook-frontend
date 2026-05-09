# Phase 02 — TransactionsTabs (segmented) + FilterChips 디자인 교체

**Model**: sonnet
**Status**: pending
**Goal**: 탭 UI 를 일반 탭에서 segmented control (rounded pill) 로 교체 + 기존 카테고리/기간 필터 chip 디자인을 handoff chip 패턴으로.

## Context (자기완결)

- 현재 `src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` 가 탭 분기. 탭 UI 가 어떤 컴포넌트 (shadcn `Tabs` 등) 인지 실측 필요.
- handoff segmented (mobile.jsx line 348~366):
  - container: `bg-bg-muted rounded-md p-1`
  - tab item: `flex-1 text-center py-2 text-sm font-semibold`
  - active: `bg-bg-elev shadow-subtle text-fg`
  - inactive: `text-fg-muted`
- handoff filter chip (mobile.jsx line 369~382):
  - `border border-border bg-bg-elev rounded-full px-3 py-1.5 text-xs text-fg-muted` + chevDown 아이콘
- 데스크톱 mockup 의 chip 은 사각형 (`rounded-md`) — 모바일은 pill (`rounded-full`). 동일 컴포넌트, responsive 처리.

## 작업 항목

### 1. `TransactionsTabs` 신규 (segmented)

`src/app/(authenticated)/transactions/_components/TransactionsTabs.tsx`. Props: `activeTab: "expenses"|"incomes"|"recurring"`, `onChange?: (tab) => void`. URL searchParams 기반 (next/navigation `useRouter`/`useSearchParams`) — 기존 페이지 패턴 유지.

shadcn `Tabs` 가 내부 라디오 그룹 — wrap 또는 자체 구현. 자체 구현 권장 (handoff 디자인 정확 반영). 3 탭 (지출/수입/반복지출) 고정.

### 2. `FilterChips` 디자인 교체

기존 카테고리/기간 필터 트리거 컴포넌트 위치 파악 → 디자인 교체. handoff chip 패턴:
- pill / rounded-md (mobile / desktop responsive)
- chevDown lucide 아이콘 (`size={13}`)
- 활성 상태 (값 선택됨): `border-brand-300 bg-brand-50 text-brand-700`
- 기본: `border-border bg-bg-elev text-fg-muted`

### 3. 기존 필터 트리거 호환

기존 카테고리/기간 필터의 모달/sheet/popover 동작은 유지 — 트리거(chip) 디자인만 교체. Sheet/Dialog 본문은 plan003 범위 외.

검색/금액 chip 자리는 phase 3 에서 신규 도입 — phase 2 에서는 placeholder chip (disabled, "준비 중") 표시 또는 자리만 잡고 비표시.

### 4. `TransactionsPageClient.tsx` 통합

기존 탭/필터 영역을 `<TransactionsTabs />` + `<FilterChips />` 로 교체. URL searchParams 동작 보존 — page.tsx 의 `searchParams` 파싱 로직은 변경 없음.

### 5. 자동 verification

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/app/\(authenticated\)/transactions/_components/TransactionsTabs.tsx
grep -n 'TransactionsTabs' src/app/\(authenticated\)/transactions/ -r | wc -l   # >= 2

# segmented 디자인 토큰 사용
grep -nE 'bg-bg-muted|bg-bg-elev|shadow-subtle' src/app/\(authenticated\)/transactions/_components/TransactionsTabs.tsx | wc -l   # >= 2

# URL searchParams 보존
grep -nE 'useSearchParams|useRouter' src/app/\(authenticated\)/transactions/_components/TransactionsTabs.tsx | wc -l   # >= 1
```

수동 smoke: `/transactions` → segmented tab 3개 표시. 탭 클릭 시 URL `?tab=...` 변화 + 페이지 데이터 갱신. 필터 chip 디자인 새 토큰.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/transactions/_components/TransactionsTabs.tsx` | 신규 |
| `src/app/(authenticated)/transactions/_components/FilterChips.tsx` | 신규 또는 기존 트리거 수정 |
| `src/app/(authenticated)/transactions/_components/TransactionsPageClient.tsx` | 수정 (tab/filter 통합) |

## Out of Scope

- 검색 / 금액 필터 도입 (phase 3)
- 카테고리/기간 모달 본문 디자인 (기존 동작 유지, plan004+ 에서 검토)
- Row 디자인 (phase 4)

## Risks

| 리스크 | 완화 |
|---|---|
| shadcn `Tabs` API 와 handoff segmented 시각이 안 맞을 수 있음 | 자체 구현 (rounded-md container + 활성 토큰) — shadcn 의존 X |
| URL searchParams 동기화 깨짐 | 기존 useRouter/useSearchParams 로직을 그대로 wrap, 변경 최소화 |
| 키보드 접근성 (탭 키 이동) | 자체 구현 시 `role="tablist"` / `role="tab"` + arrow key 처리. WAI-ARIA 패턴 준수 |
