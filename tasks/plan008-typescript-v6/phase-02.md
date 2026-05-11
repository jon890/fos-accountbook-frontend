# Phase 02 — lib.d.ts / inference 변경 일괄 수정

**Model**: sonnet
**Status**: pending
**Goal**: phase-01 에서 분류한 에러 카테고리 중 **우리 코드 측 fix 만으로 해결 가능한 항목** (lib.d.ts 변경 / inference 변경 / 신 strict 기본값) 일괄 수정.

## Context (자기완결)

- phase-01 commit message 의 카테고리 분류표 + `/tmp/tsc-errors.txt` (생존 시) 참조.
- 본 phase 대상: **우리 src/ 코드 수정으로 해결되는 에러**. peer dep 측 에러는 phase-03.
- 일반적 fix 패턴:
  - `Object is possibly 'null'` → optional chaining `?.` 또는 명시 가드
  - `Property 'X' does not exist` → 타입 좁히기 또는 type assertion (최소 사용)
  - `Type 'X' is not assignable to 'Y'` → 명시 타입 annotation 추가
  - 신 표준 메서드 (`Array.prototype.findLast` 등) 가 우리 코드 호출 시 — 신 lib 가 정상 제공

## 작업 항목

### 1. phase-01 카테고리표 + tsc 에러 재실행

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/008-typescript-v6

pnpm tsc --noEmit 2>&1 | tee /tmp/tsc-errors-v2.txt | tail -40
```

phase-01 의 카테고리 분류표를 본 phase 작업 분할 기준으로 사용.

### 2. lib.d.ts 변경 에러 fix

신 표준 메서드 호출 / 변경된 type 시그니처 (예: `Array.findLast` 반환 타입 narrowing) 영향을 받는 위치를 식별 + fix.

```bash
# 예시 — 우리 코드에서 사용 빈도 grep
grep -rnE 'findLast|toReversed|toSorted|toSpliced' src/ 2>/dev/null
```

발견 시 ts6 의 신 시그니처에 맞춰 호출자 type 조정.

### 3. inference 변경 에러 fix

가장 흔한 패턴 — 5.9 에서 통과하던 inference 가 6.0 에서 strict 해지는 경우. 명시 type annotation 추가:

```ts
// Before (5.9 통과):
const result = items.reduce((acc, x) => ({ ...acc, [x.key]: x.value }), {});
// After (6.0 stricter — 명시):
const result = items.reduce<Record<string, T>>((acc, x) => ({ ...acc, [x.key]: x.value }), {});
```

각 위치는 phase-01 의 카테고리표에서 식별. 위 패턴 외에 `any` 의존 / type assertion 회피 우선.

### 4. 신 strict 기본값 fix

ts6 의 신 strict 옵션 (있다면) 가 tsconfig 의 `strict: true` 로 자동 발동. 발생 에러를 일반 가드 패턴으로:

```ts
// Object is possibly 'null'
- session.user.name
+ session?.user?.name
```

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/008-typescript-v6

pnpm tsc --noEmit 2>&1 | tail -20
# 에러 수가 phase-01 시점 대비 감소 — 단 peer dep 측 에러 (phase-03) 는 남을 수 있음

# any 신규 도입 0건
! grep -rnE ': any\b|<any>|as any\b' src/ \
  | grep -v ".test.tsx?:" | grep -v "// eslint-disable"
```

수동 smoke: `pnpm build` → 컴파일 통과 (peer dep 측 잔여 에러 1~5 건 정도 허용). 잔여 에러는 phase-03 에서 해소.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/` 의 영향 받은 파일 다수 | type annotation 추가 / 가드 추가 |

## Out of Scope

- peer dep (msw / jest / next type plugin) 측 에러 (phase-03)
- tsconfig.json 옵션 변경 (phase-04)
- 신 ts6 기능 적극 도입 (예: 신 Standard Decorator) — 본 plan 은 호환만

## Risks

| 리스크 | 완화 |
|---|---|
| 에러 수가 100+ 면 phase 작업 양 초과 (CLAUDE.md "5개 이하" 위반) | phase-01 카테고리표를 5 카테고리 이하로 압축. 그래도 초과면 본 phase 를 phase-02a/02b 분할 + index.json 갱신 보고 |
| inference 변경 fix 시 `any` 도입 유혹 | grep 으로 검출 + lint 통과 강제. 정 안 되면 `// @ts-expect-error` 한 줄 + 이유 주석 (재발 추적용) |
| 우리 fix 가 의도치 않은 타입 강화로 호출자 깨짐 | tsc + jest --run 으로 회귀 1차 검출. PR 검증 단계에서 추가 점검 |
