# Phase 01 — @daypicker/react 패키지 이전 + 폐기 prop 사용처 grep

**Model**: sonnet
**Status**: pending
**Goal**: `react-day-picker` → `@daypicker/react` 패키지 이전 + v10 폐기 prop 사용처 식별 (사후 phase 2~3 에서 교체).

## Context (자기완결)

- 사용처 단일 grep 결과 (2 파일):
  - `src/components/ui/calendar.tsx` (68줄) — `import { DayPicker } from "react-day-picker"`
  - `src/components/dashboard/CalendarView.tsx` — `import { DayButtonProps } from "react-day-picker"`
- v10 공식 권장: 신 namespace `@daypicker/react`. 구 `react-day-picker` 패키지도 v10 호환 유지하지만 ADR-F18 결정으로 신 namespace 채택.
- 폐기 props (ADR-F18 매핑 표): `fromMonth/toMonth/fromYear/toYear/fromDate/toDate/initialFocus` + `onDayKey*/onDayPointer*/onDayTouch*`.

## 작업 항목

### 1. dep 교체

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/007-react-day-picker-v10
pnpm remove react-day-picker
pnpm add @daypicker/react@^10.0.0
```

`package.json` 의 `react-day-picker` 제거 + `@daypicker/react` 추가. `pnpm-lock.yaml` 자동 갱신.

### 2. 폐기 prop 사용처 grep

```bash
# 우리 코드에서 폐기 prop 사용 여부
grep -rnE 'fromMonth|toMonth|fromYear|toYear|fromDate|toDate|initialFocus|onWeekNumberClick|onDayKeyUp|onDayKeyPress|onDayPointerEnter|onDayPointerLeave|onDayTouchCancel|onDayTouchEnd|onDayTouchMove|onDayTouchStart' \
  src/components/ui/calendar.tsx src/components/dashboard/CalendarView.tsx 2>/dev/null

# 폐기 type alias 사용처
grep -rnE 'formatMonthCaption|formatYearCaption|labelDay|labelCaption|isMatch|isDateInRange|DateLib\.Date|FormatOptions|LabelOptions' \
  src/ 2>/dev/null
```

각 결과를 phase commit message 본문에 기록 — phase 2/3 에서 교체할 위치 명확화.

### 3. peer dep 점검

```bash
# react-day-picker 구 이름에 의존하는 다른 dep 가 있는지
grep -rnE '"react-day-picker"' node_modules/*/package.json 2>/dev/null | head
```

shadcn 의존성 외 (이미 우리가 ui/calendar.tsx 로 wrap) 충돌 없을 것으로 추정. 충돌 발견 시 phase 본문 commit 에 보고 + 대안 검토.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/007-react-day-picker-v10

pnpm install
pnpm tsc --noEmit
pnpm lint

# package.json 신 / 구
grep '"@daypicker/react"' package.json   # = "^10.0.0"
! grep '"react-day-picker"' package.json   # exit 1 — 구 패키지 제거

# 단 import 경로 갱신은 phase 2~3 에서. 지금은 type 에러 예상됨 — package 만 교체 후 phase 종료
```

phase 1 종료 시점에서는 `pnpm tsc --noEmit` 가 import 에러 (react-day-picker 미존재) 발생할 수 있음 — **정상**. phase 2/3 에서 해소.

## Critical Files

| 파일 | 상태 |
|---|---|
| `package.json` / `pnpm-lock.yaml` | dep 교체 |

## Out of Scope

- `import` 경로 갱신 (phase 2/3)
- 폐기 prop 실제 교체 (phase 2/3)
- 신 add-on 패키지 (`@daypicker/persian` 등) — 비 그레고리안 캘린더 미사용

## Risks

| 리스크 | 완화 |
|---|---|
| peer dep 충돌 (다른 라이브러리가 구 이름 의존) | 점검 grep 으로 사전 발견. 발견 시 v10 호환 `react-day-picker` 도 alias 로 추가 검토 (별도 plan) |
| pnpm install 시 lockfile 다른 dep peer 경고 | 경고만 있고 install 자체 성공이면 OK. error 면 보고 |
| 폐기 prop 사용 발견 0건이면 phase 2/3 일부 작업 불필요 | grep 결과에 따라 phase 2/3 범위 자동 축소 — phase 시작 시 점검 |
