# Phase 04 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: phase 01~03 산출물 통합 검증, react-day-picker v9 잔재 0건 증명, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상: dep 교체 (1) + ui/calendar.tsx (2) + CalendarView.tsx (3).
- legacy 잔재 후보: `from "react-day-picker"` import 경로, 폐기 prop, 폐기 type alias.
- `_shared/common-pitfalls.md § 1-8` 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/007-react-day-picker-v10

pnpm install
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` + 어느 phase 가 회귀를 만들었는지 식별.

### 2. v9 잔재 grep — 0건 증명

```bash
# cwd: /Users/nhn/personal/fos-accountbook

# package.json v10 lock
grep '"@daypicker/react"' package.json   # = "^10.0.0"
! grep '"react-day-picker"' package.json   # exit 1

# import 경로 잔재
! grep -rnE 'from ["\x27]react-day-picker' src/

# 폐기 prop 잔재
! grep -rnE 'fromMonth=|toMonth=|fromYear=|toYear=|fromDate=|toDate=|initialFocus=' src/

# 폐기 event prop 잔재
! grep -rnE 'onDayKey|onDayPointer|onDayTouch|onWeekNumberClick' src/

# 폐기 type alias / format helper
! grep -rnE 'formatMonthCaption|formatYearCaption|labelDay|labelCaption' src/
! grep -rnE 'DateLib\.Date|FormatOptions[^a-zA-Z]|LabelOptions' src/
```

### 3. 신 패키지 사용 등록 확인

```bash
grep -rn 'from "@daypicker/react"' src/ | wc -l   # >= 2 (ui/calendar.tsx + CalendarView.tsx)

# v10 신 prop 사용 (해당 시)
# - startMonth/endMonth, hidden, autoFocus 등은 우리 코드가 옵션 명시 안 하면 0 건 — 검증 불필요
```

### 4. `index.json` + 본 phase status → `completed`

```bash
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan007-react-day-picker-v10/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan007-react-day-picker-v10/index.json
grep -c '"status": "completed"' tasks/plan007-react-day-picker-v10/index.json   # = 5 (top + 4 phases)

sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan007-react-day-picker-v10/phase-04.md
grep '^\*\*Status\*\*:' tasks/plan007-react-day-picker-v10/phase-04.md   # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan007-react-day-picker-v10/index.json` | 모든 status `completed` |
| `tasks/plan007-react-day-picker-v10/phase-04.md` | 본 파일 status `completed` |

## Out of Scope

- PR #222 close — 본 plan PR 머지 후 사용자가 GitHub UI 에서 직접 close (또는 plan PR 의 `Closes #222` 마커로 자동)
- v10 신규 기능 도입 (hidden, autoFocus 등) — 본 plan 은 호환만

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep false positive (주석 안 문자열) | 라인 시작 앵커 + 정확한 토큰 매치 |
| macOS BSD `sed -i ''` vs Linux GNU `sed -i` | 본 plan macOS 환경 가정 |
| 수동 smoke 누락 시 시각 회귀 미발견 | dashboard `/dashboard` 의 CalendarView 화면 검증 항목 phase 2/3 본문에 명시 |
