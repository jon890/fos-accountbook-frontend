# Phase 02 — shadcn calendar.tsx 마이그레이션

**Model**: sonnet
**Status**: pending
**Goal**: `src/components/ui/calendar.tsx` 의 import 경로를 `@daypicker/react` 로 교체 + style.css 경로 갱신 + 폐기 prop 사용 시 v10 동등 prop 으로 교체.

## Context (자기완결)

- 파일: `src/components/ui/calendar.tsx` (68줄). shadcn 표준 wrapper:
  ```ts
  import { DayPicker } from "react-day-picker";
  export type CalendarProps = React.ComponentProps<typeof DayPicker>;
  function Calendar({ className, classNames, showOutsideDays, ...props }) {
    return <DayPicker .../>;
  }
  ```
- phase-01 의 grep 결과에 따라 폐기 prop 사용 위치 식별됨. 본 phase 에서 교체.
- ADR-F18 매핑 표:
  - `fromMonth/toMonth` → `startMonth/endMonth`
  - `fromDate/toDate` → `hidden={{ before/after }}`
  - `initialFocus` → `autoFocus`

## 작업 항목

### 1. import 경로 갱신

```ts
// 변경 전
import { DayPicker } from "react-day-picker";
// 변경 후
import { DayPicker } from "@daypicker/react";
```

style.css import 가 있으면 함께 교체 (`react-day-picker/dist/style.css` → `@daypicker/react/style.css`).

### 2. 폐기 prop 직접 사용 점검 + 교체

shadcn calendar.tsx 가 props 를 `...props` 로 forward 만 하므로 직접 폐기 prop 사용은 보통 없음. 단 `classNames` override 안에 폐기 키 (`day_outside` → `day` variant 등) 가 있는지 확인:

```bash
# 폐기 classNames key (release note 의 classNames diff 확인)
grep -nE 'day_outside|day_selected|day_disabled|day_today|day_hidden|day_range_start|day_range_middle|day_range_end' src/components/ui/calendar.tsx
```

v10 의 classNames 구조 변경 시 동등 키로 교체. release note 또는 d.ts 참조.

### 3. type re-export 점검

```ts
export type CalendarProps = React.ComponentProps<typeof DayPicker>;
```

이건 그대로 — DayPicker 의 v10 시그니처가 자동 추론. 호출자 (Calendar 사용처) 의 폐기 prop 사용은 phase 시작 시 grep:

```bash
grep -rnE 'fromMonth|toMonth|fromYear|toYear|fromDate|toDate|initialFocus' src/ \
  --include='*.tsx' --include='*.ts' | grep -v calendar.tsx
```

발견 시 호출자 측에서 동등 prop 으로 교체.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/007-react-day-picker-v10

pnpm tsc --noEmit
pnpm lint
pnpm build

# import 경로
grep -n 'from "@daypicker/react"' src/components/ui/calendar.tsx | wc -l   # = 1
! grep -n 'from "react-day-picker"' src/components/ui/calendar.tsx

# 폐기 prop 0건 (전 코드베이스)
! grep -rnE 'fromMonth|toMonth|fromYear|toYear|fromDate=|toDate=|initialFocus=' src/
```

수동 smoke: dashboard `/dashboard` → CalendarView 표시 + 날짜 클릭 정상.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/ui/calendar.tsx` | import 경로 + 폐기 키 교체 (있을 시) |

## Out of Scope

- CalendarView.tsx 의 DayButton 마이그레이션 (phase 3)
- 신 styling (v10 의 default 스타일 변경 가능성) — 시각 회귀 시 별도 plan
- 다른 add-on 패키지 도입

## Risks

| 리스크 | 완화 |
|---|---|
| v10 의 classNames 키 이름 변경으로 우리 override 가 무시됨 | phase 시작 grep 으로 사전 식별 + d.ts 참조 |
| `@daypicker/react/style.css` 가 dist 경로 다름 | release note + node_modules/@daypicker/react/package.json `exports` 필드 확인 |
| Calendar wrapper 의 ariaLabel 등 폐기 i18n props | release note 의 label 변경 점검 — `labelDay/labelCaption` → 동등 키 |
