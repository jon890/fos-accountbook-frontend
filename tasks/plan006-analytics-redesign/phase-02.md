# Phase 02 — PeriodToggle (m1/m3/m6/y1) + URL searchParams

**Model**: sonnet
**Status**: pending
**Goal**: 4종 기간 토글 (이번 달 / 3개월 / 6개월 / 1년) segmented control + URL searchParams 동기화 (ADR-F17 draft 패턴).

## Context (자기완결)

- handoff:
  - mobile.jsx line 628~645 — 4개 segmented pill (`bg-bg-muted` container + active `bg-bg-elev shadow-subtle`)
  - desktop.jsx line 672~696 — 동일 + 우측 날짜 범위 chip
- plan003 의 `TransactionsTabs.tsx` 가 동일 segmented 패턴 — 컴포넌트 일반화 가능.
- ADR-F17 (URL state draft 패턴) — plan003 에서 도출. URL searchParams 와 client state 동기화 시 commit 시점 명시.
- 기간 변경 시 page.tsx 가 새 데이터 fetch (Server Component re-render) → `useRouter().replace('?period=m3')` 패턴.

## 작업 항목

### 1. `SegmentedToggle` 일반화 (plan003 패턴 추출)

기존 `src/app/(authenticated)/transactions/_components/TransactionsTabs.tsx` 가 expenses 전용 — 본 phase 에서 generic `SegmentedToggle<TKey>` 신규 추출:

`src/components/ui/segmented-toggle.tsx` 신규. Props:

```ts
interface SegmentedToggleProps<T extends string> {
  options: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}
```

스타일 토큰 (`bg-bg-muted` / 활성 `bg-bg-elev shadow-subtle`) 은 그대로. plan003 TransactionsTabs 는 후속 plan 에서 이 generic 으로 마이그레이션 — 본 plan 범위 외 (Out of Scope).

**접근성 (WAI-ARIA)** — `role="tablist"` + 각 button `role="tab"` + `aria-selected={key === value}` + `aria-controls` (해당 패널 ID). 키보드 ←→ 으로 옵션 이동 (`onKeyDown` 으로 prev/next index 계산 후 `onChange(options[nextIdx].key)`).

### 2. `AnalyticsPeriodToggle` 신규

`src/app/(authenticated)/analytics/_components/AnalyticsPeriodToggle.tsx`. Props: `period: AnalyticsPeriod`, `onChange: (next: AnalyticsPeriod) => void`. 내부에서 `SegmentedToggle<AnalyticsPeriod>` 사용.

옵션 4종:
```ts
const PERIOD_OPTIONS = [
  { key: "m1", label: "이번 달" },
  { key: "m3", label: "3개월" },
  { key: "m6", label: "6개월" },
  { key: "y1", label: "1년" },
] as const;
```

### 3. URL searchParams 동기화

`analytics/page.tsx` 가 `searchParams.period` 파싱:

```ts
interface AnalyticsSearchParams {
  period?: AnalyticsPeriod;
}
const period: AnalyticsPeriod = ["m1","m3","m6","y1"].includes(rawPeriod) ? rawPeriod as AnalyticsPeriod : "m1";
```

`AnalyticsClient` 또는 신규 wrapper 가 `useRouter().replace('?period=...')` 로 URL 갱신.

**ADR-F17 (draft 패턴) 적용** — period 의 source of truth = URL. AnalyticsPeriodToggle 은 useState 사용하지 말 것. URL searchParams 에서 period 를 prop 으로 받아 표시 + onChange 시 `router.replace('?period=...')` 만 호출. **useEffect 안 setState 절대 금지**:

```tsx
// ✅ AnalyticsPeriodToggle (source of truth = URL)
export function AnalyticsPeriodToggle({ period }: { period: AnalyticsPeriod }) {
  const router = useRouter();
  const handleChange = (next: AnalyticsPeriod) => {
    const params = new URLSearchParams(window.location.search);
    params.set("period", next);
    router.replace(`?${params.toString()}`);
  };
  return <SegmentedToggle options={PERIOD_OPTIONS} value={period} onChange={handleChange} />;
}
```

`debounce` 불필요 — 4종 토글이라 빈번한 변경 X.

### 4. 데스크톱 날짜 범위 chip (선택 표시)

desktop.jsx line 688~696 의 우측 날짜 chip — 현재 period 의 from~to 표시:

```tsx
<DateRangeChip from={periodStartDate} to={today} />
```

읽기 전용 표시. 클릭 동작 (커스텀 범위) 는 plan007+ 로 보류.

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/006-analytics-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/ui/segmented-toggle.tsx
test -f src/app/\(authenticated\)/analytics/_components/AnalyticsPeriodToggle.tsx

# segmented 디자인 토큰 사용
grep -nE 'bg-bg-muted|bg-bg-elev|shadow-subtle' src/components/ui/segmented-toggle.tsx | wc -l   # >= 2

# URL searchParams 동기화
grep -nE 'period\?: AnalyticsPeriod|searchParams.*period' src/app/\(authenticated\)/analytics/page.tsx | wc -l   # >= 1

# 4 옵션 정의
grep -nE 'm1.*m3.*m6.*y1|key:\s*"m1"' src/app/\(authenticated\)/analytics/_components/AnalyticsPeriodToggle.tsx | wc -l   # >= 1
```

수동 smoke: `/analytics` → 4개 토글 표시. 클릭 시 URL `?period=m3` 변경 + 페이지 데이터 갱신.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/ui/segmented-toggle.tsx` | 신규 (generic) |
| `src/app/(authenticated)/analytics/_components/AnalyticsPeriodToggle.tsx` | 신규 |
| `src/app/(authenticated)/analytics/page.tsx` | 수정 (searchParams 파싱 + 액션 호출에 period 전달) |
| `src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx` | 수정 (period 상태 + URL 동기화) |

## Out of Scope

- TransactionsTabs (plan003) 의 SegmentedToggle 마이그레이션 — 후속 plan
- 데스크톱 날짜 범위 chip 의 커스텀 범위 선택 (지금은 읽기 전용)
- 모바일 sticky/scroll 동작 (스크롤 시 토글 고정)

## Risks

| 리스크 | 완화 |
|---|---|
| URL ?period 가 잘못된 값 (예: ?period=foo) | page.tsx 의 includes 가드. 기본값 m1 |
| `useRouter().replace` 가 Server Component re-render 트리거 | 정상 동작 — 새 searchParams 로 Server Component 가 새 데이터 fetch. ADR-F12 패턴 |
| 4개 토글이 모바일 너비에서 좁아 보임 | 12.5px font + `flex: 1` 등분. 4종이 한계 — 5개 이상이면 가로 스크롤 검토 (현재는 4개라 안전) |
