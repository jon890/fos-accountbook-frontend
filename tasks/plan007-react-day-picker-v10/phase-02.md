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

### 2. classNames 키 v10 ClassNames 타입과 1:1 매핑 검증 + 변경 키 교체 (CRITICAL)

현 calendar.tsx 가 사용하는 22개 키를 v10 `ClassNames` 타입과 대조. 단순 grep 으로는 silent regression 차단 불가 — **type-driven 검증** 사용.

```bash
# v10 ClassNames 타입의 키 목록 추출 (phase-01 의 dep 교체 후 node_modules 에 신 패키지 존재)
grep -rnE 'type ClassNames|interface ClassNames|ClassNames =' node_modules/@daypicker/react/dist/ 2>/dev/null | head
# d.ts 위치 확인 후 직접 열어서 ClassNames 의 모든 키 나열
```

현 calendar.tsx 키 (v9 후반 shadcn 표준 기준):
```
months, month, caption, caption_label, nav, nav_button,
nav_button_previous, nav_button_next, month_grid, weekdays,
weekday, week, day, day_button, range_end, selected, today,
outside, disabled, range_middle, hidden
```

v9 → v10 가능한 rename 후보 (release note + d.ts 참조 필수):
- `caption` / `caption_label` → `month_caption` / `caption_label` 가능성
- `nav_button` / `nav_button_previous` / `nav_button_next` → `button_previous` / `button_next` 가능성
- 기타 d.ts 가 권위

검증 방법 — 타입 강제:
```ts
import type { ClassNames } from "@daypicker/react";
const classNames: Partial<ClassNames> = { /* 현 키 22개 */ };
```

`pnpm tsc --noEmit` 가 잘못된 키 (v10 에서 제거/이름 변경된 키) 를 모두 잡음. 발견 시 d.ts 의 신 키로 교체.

### 3. Chevron component prop 시그니처 v10 호환 검증 (CRITICAL)

`calendar.tsx:56-61` 의 `components.Chevron` 시그니처 (`orientation, className, ...props`) 가 v10 d.ts 와 일치하는지 확인:

```bash
grep -rnE 'ChevronProps|Chevron:' node_modules/@daypicker/react/dist/ 2>/dev/null | head
```

`orientation` 값 enum / 추가 props (`disabled`, `size` 등) 가 v10 에서 추가됐는지 d.ts 확인. 시그니처 차이 발견 시 destructuring 갱신.

호출자 측 폐기 prop 점검 (phase-01 에서 0건 확인됨, 회귀 방지용 재확인):
```bash
grep -rnE 'fromMonth|toMonth|fromYear|toYear|fromDate|toDate|initialFocus' src/ \
  --include='*.tsx' --include='*.ts' | grep -v calendar.tsx
```

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

수동 smoke (선택, human review): dashboard `/dashboard` → CalendarView 표시 + 날짜 클릭 정상. headless executor 는 skip — `tsc --noEmit` + `pnpm build` + step 2 type-driven 검증 통과로 갈음.

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
