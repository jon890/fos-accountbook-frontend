# Phase 01 — dep 교체 + release note 수집 + tsc 실측 + 에러 카테고리 분류

**Model**: sonnet
**Status**: pending
**Goal**: TypeScript 6.0 release note 의 정확한 breaking 매핑 수집 + 우리 코드 영향 tsc 실측 + 발견 에러를 카테고리별로 분류 (phase 2~3 에서 카테고리별 fix).

## Context (자기완결)

- 현재: typescript `^5` (5.9.3), @types/node `^22` (22.19.7)
- 목표: typescript `^6` (6.0.3), @types/node `^22` (22.19.18)
- tsconfig.json: `target: ES2017`, `strict: true`, `moduleResolution: bundler`, `noEmit: true`
- PR #179 의 lock diff 참조: `@typescript-eslint/parser` 8.48.1 + `eslint-config-next` 16.0.7 + `msw` 2.14.5 + `jest` 30.3.0 모두 ts6 호환 점검 필요.

## 작업 항목

### 1. release note WebFetch (정확한 breaking 매핑 수집)

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/008-typescript-v6
```

WebFetch 로 TypeScript 6.0 release blog post 수집:

- 1차: `https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/`
- 2차 (실패 시): GitHub release `https://github.com/microsoft/TypeScript/releases/tag/v6.0.0` 의 fixed issues query

수집 후 breaking changes 를 **카테고리별** 로 정리한 본문을 phase commit message 또는 PR description 에 1단락으로 기록:

- lib.d.ts 추가/변경 (예: 신 표준 메서드)
- inference 변경 (예: contextual typing)
- 폐기 compiler 옵션 / 신 기본값
- decorator / class field 처리
- 기타

### 2. dep 교체

```bash
pnpm add -D typescript@^6 @types/node@^22
```

`package.json` 의 `"typescript": "^5"` → `"^6"`. @types/node 는 minor 패치만 (^22 그대로).

### 3. 1차 tsc 실측

```bash
pnpm tsc --noEmit 2>&1 | tee /tmp/tsc-errors.txt | tail -40
```

에러 line 수 / 파일 수 / 카테고리 식별. `/tmp/tsc-errors.txt` 는 후속 phase 참조용 (PR commit 에는 포함 X).

### 4. 에러 카테고리 분류 (phase 2~3 입력)

`/tmp/tsc-errors.txt` 의 에러 메시지를 다음 카테고리로 분류:

- **lib.d.ts 변경**: `Property 'X' does not exist on type 'Array<...>'` 등 표준 라이브러리 type 변화
- **inference 변경**: `Type 'X' is not assignable to type 'Y'` — 5.9 에서 통과하던 코드가 fail
- **strict 옵션 신 기본**: `Object is possibly 'null'` 같은 새 strict 발동
- **peer dep 타입 충돌**: `node_modules/...` 안의 라이브러리 type — msw/jest/next 등
- **deprecated API**: 우리 코드가 ts compiler API 직접 사용 (보통 0)

카테고리별 에러 수 + 대표 파일 1~2개를 phase 본문 commit message 에 기록.

### 5. peer dep 호환 점검

```bash
pnpm install 2>&1 | grep -iE 'peer|warning' | head -20
```

- `@typescript-eslint/parser` 8.48.1 가 ts6 지원? (보통 8.x 는 ts5 가정, 9.x 가 ts6)
- `eslint-config-next` 16.0.7 의 type plugin 이 ts6 호환?
- `msw` 2.14.5 의 d.ts 가 ts6 inference 와 충돌?
- `jest-environment-jsdom` 30.x 가 ts6 호환?

peer 경고 발견 시 phase-03 (peer 정렬) 의 입력. install 자체 실패면 `PHASE_BLOCKED: peer resolution failed` 출력 후 보고.

### 6. 자동 verification

```bash
# package.json 신 / 구
grep '"typescript"' package.json   # = "^6"

# tsc 실측 결과 존재
test -f /tmp/tsc-errors.txt && wc -l /tmp/tsc-errors.txt

# phase 1 시점에는 tsc 통과 안 함 — 정상. phase 2~3 에서 해소
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `package.json` / `pnpm-lock.yaml` | dep 교체 |
| (`/tmp/tsc-errors.txt`) | phase 산출물 — repo 에 commit X |

## Out of Scope

- 에러 fix 자체 (phase 2)
- peer dep 실제 교체 (phase 3)
- tsconfig.json 옵션 변경 (phase 4)

## Risks

| 리스크 | 완화 |
|---|---|
| WebFetch 가 release blog 차단/형식 변화 | 2차 fallback (GitHub release tag). 모두 실패 시 phase commit message 에 "release note 미수집, ts6 release blog 부재" 명시 + tsc 에러만으로 분류 |
| tsc 에러 200+ — 단일 phase 처리 부담 | 카테고리별 분할이 phase 2 의 분기 기반. 1000+ 면 plan008 자체 분할 검토 + 보고 |
| peer dep 가 ts6 거부 → install 실패 | install 실패 = PHASE_BLOCKED. msw/jest 업그레이드 의존성 plan 분리 가능성 |
| @types/node 22.19.18 가 신 type 추가로 별도 에러 | minor patch — 영향 작을 것. tsc 결과에 포함되면 함께 fix |
