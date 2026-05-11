# Phase 03 — CalendarView.tsx DayButton 마이그레이션

**Model**: sonnet
**Status**: pending
**Goal**: `src/components/dashboard/CalendarView.tsx` 의 `DayButtonProps` import + 사용 시그니처를 v10 기준으로 갱신.

## Context (자기완결)

- 파일: `src/components/dashboard/CalendarView.tsx`. line 15 `import { DayButtonProps } from "react-day-picker"`. line 101 `<Calendar ... />`.
- v10 release note: `DayButton` 커스텀 컴포넌트 등록 방식 변경 가능 (`onDayKey*` 등 폐기 event 가 DayButton 으로 이동).
- phase-01 grep 결과로 CalendarView 의 폐기 prop / 시그니처 변경 점 식별됨.

## 작업 항목

### 1. import 경로 갱신

```ts
import { DayButtonProps } from "@daypicker/react";
```

### 2. DayButton 컴포넌트 시그니처 점검

v10 의 `DayButtonProps` 가 v9 와 다른 필드 있는지 d.ts 또는 release note 확인:

```bash
# node_modules 의 v10 d.ts 직접 확인
grep -rn 'DayButtonProps' node_modules/@daypicker/react/dist/ 2>/dev/null | head -5
```

기존 CalendarView 의 custom DayButton 구현 (있다면) 의 props 사용처를 v10 시그니처에 맞춰 조정.

### 3. 폐기 event prop 교체

`onDayKey*` / `onDayPointer*` / `onDayTouch*` 등을 Calendar 호출처에서 사용 중이면, 커스텀 `DayButton` 컴포넌트로 이동:

```tsx
<Calendar
  components={{
    DayButton: (props: DayButtonProps) => {
      // 기존 onDayPointerEnter 등 핸들러를 여기서 직접 처리
      return <button {...props} onPointerEnter={...} />;
    },
  }}
/>
```

phase-01 grep 결과에 따라 실제 변경 범위 결정.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/007-react-day-picker-v10

pnpm tsc --noEmit
pnpm lint
pnpm build
pnpm test --run

# import 경로
grep -n 'from "@daypicker/react"' src/components/dashboard/CalendarView.tsx | wc -l   # >= 1
! grep -n 'from "react-day-picker"' src/components/dashboard/CalendarView.tsx

# 폐기 event prop 0건
! grep -nE 'onDayKey|onDayPointer|onDayTouch|onWeekNumberClick' src/components/dashboard/CalendarView.tsx
```

수동 smoke (선택, human review): `/dashboard` → CalendarView 의 날짜 hover / 클릭 / 키보드 탐색. headless executor 는 `pnpm test --run` + tsc + build 로 갈음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/dashboard/CalendarView.tsx` | import 경로 + DayButton 시그니처 갱신 |

## Out of Scope

- 신 calendar 디자인 (v10 기본 스타일이 다르면) — 시각 회귀 시 plan008+
- v10 의 신규 기능 (`hidden`, `before`, `after` 등) 활용 — 본 plan 은 호환만

## Risks

| 리스크 | 완화 |
|---|---|
| DayButtonProps 가 v10 에서 `day: Date` 등 새 필드 추가 | d.ts 참조 + tsc 가 에러 잡음. 명시 destructuring 사용처면 보고 |
| 키보드 접근성 (Tab/Enter) 회귀 | v10 의 autoFocus 등 신 옵션 활용. 수동 smoke 로 점검 |
| 커스텀 DayButton 구현이 v10 의 내부 hook 의존성 (예: `useDay`) 변경에 영향 | release note 의 internal API breakage 확인. 우리 CalendarView 가 직접 DayButton 커스터마이즈 안 하면 영향 0 |
