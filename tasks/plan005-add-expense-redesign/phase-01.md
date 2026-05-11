# Phase 01 — AmountInput 신규 (56px num + 빠른 추가 칩)

**Model**: sonnet
**Status**: pending
**Goal**: 지출 금액 입력을 큰 num display (56px mobile / 64px desktop) + 빠른 추가 칩(+1,000 / +5,000 / +10,000) 패턴으로 신규.

## Context (자기완결)

- handoff mockup:
  - mobile.jsx line 449~477 — 56px num + 3 chip (+1k/+5k/+10k)
  - desktop.jsx line 510~537 — 64px num + 4 chip (+1k/+5k/+10k/+50k)
- 현재 코드 `src/components/expenses/forms/AddExpenseForm.tsx` (153줄) — shadcn `<Input>` 기본 폼 사용. 빠른 추가 칩 없음.
- plan001 의 `.num` 클래스 (Inter + tabular-nums) + `--font-num` 토큰 사용. ADR-F14.
- 입력자 (`createdBy`) 토글은 본 plan 미도입 — auth user 자동 (사용자 결정).

## 작업 항목

### 1. `AmountInput` 신규 컴포넌트

`src/components/expenses/forms/AmountInput.tsx`. Props: `value: number`, `onChange: (next: number) => void`, `disabled?: boolean`.

Layout:
- "얼마를 썼나요?" 라벨 (12px, `text-fg-muted`)
- ₩ prefix (28px mobile / 32px desktop, `text-fg-muted`) + amount span (56px mobile / 64px desktop, `font-bold`, `.num` 클래스, `letter-spacing: -0.035em`)
- amount 는 `value.toLocaleString('ko-KR')` 표기. 0 일 때 `"0"` 표시.
- 빠른 추가 칩 row: 모바일 `[1000, 5000, 10000]` / 데스크톱 `[1000, 5000, 10000, 50000]`. 모바일은 `md:hidden`, 데스크톱 추가 칩은 `hidden md:inline-flex`.
- 칩 클릭 시 `onChange(value + delta)` 호출. tap feedback (active scale).
- 음수 / 비정상 값 가드: `Math.max(0, ...)`.

큰 num display 영역 자체는 read-only display + 빠른 추가 칩 + (수동 입력은 별도 numeric input). 키보드 직접 입력 패턴:
- 큰 display 옆 또는 아래에 hidden `<input type="number" inputMode="numeric">` 두고 click 시 focus.
- 또는 큰 display 자체가 button 처럼 클릭 가능 → 모달 keypad (별도 plan, OOS).
- 본 phase 는 hidden numeric input 패턴 — 큰 display tap 시 input focus, 키보드 입력 시 display 동기화.

### 2. 단위 테스트

`src/__tests__/components/expenses/AmountInput.test.tsx`. 케이스:
- 칩 클릭 시 `onChange(value + delta)` 호출 (1k/5k/10k 각각)
- value=0 → "0" 표시 + ₩ prefix
- value=38400 → "38,400" 표시 (콤마)
- 음수 입력 가드 (`onChange` 호출값 0 이상)
- ADR-F09 jest.mock 방식. shadcn 의존 없음 — 단순 컴포넌트라 RTL 만.

### 3. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/005-add-expense-redesign

pnpm tsc --noEmit
pnpm lint
pnpm test src/__tests__/components/expenses/AmountInput.test.tsx --run

test -f src/components/expenses/forms/AmountInput.tsx
test -f src/__tests__/components/expenses/AmountInput.test.tsx

# .num 클래스 사용 (Inter tabular-nums)
grep -nE 'className=["\x27].*\bnum\b' src/components/expenses/forms/AmountInput.tsx | wc -l   # >= 1

# 빠른 추가 칩 delta 배열
grep -nE '1000.*5000.*10000' src/components/expenses/forms/AmountInput.tsx | wc -l   # >= 1
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/expenses/forms/AmountInput.tsx` | 신규 |
| `src/__tests__/components/expenses/AmountInput.test.tsx` | 신규 |

## Out of Scope

- 모달 keypad UI (큰 display 클릭 → 별도 keypad) — 후속 plan
- 통화 다중화 (KRW 외 USD/EUR 등) — 본 plan 범위 외
- AddExpenseForm 통합 (phase 03)
- Edit 폼 적용 (phase 03)

## Risks

| 리스크 | 완화 |
|---|---|
| iOS Safari 의 `inputMode="numeric"` 가 일부 버전에서 키패드 미표시 | 모바일 smoke 테스트로 점검. 미표시 시 `type="tel"` 대체 패턴 검토 (별도 plan) |
| 큰 num display 가 매우 긴 자릿수 시 viewport 밖 넘침 | `text-overflow: ellipsis` 또는 `font-size: clamp(...)` 적용. 1억 이상 입력 케이스는 도메인상 드물어 우선 ellipsis |
| value prop 외부 동기화 깨짐 (controlled 패턴 위반) | `onChange` 만 호출 + 내부 state 0건. 부모가 단일 source of truth |
