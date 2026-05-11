# Phase 03 — peer dep 호환 정렬

**Model**: sonnet
**Status**: pending
**Goal**: typescript 6 가 요구하는 peer dep 업그레이드 — `@typescript-eslint/parser`, `eslint-config-next`, `msw`, `jest-environment-jsdom` 등.

## Context (자기완결)

- phase-01 의 `pnpm install` 경고 + tsc 에러 중 `node_modules/...` 경로의 type 에러를 본 phase 에서 처리.
- 주요 peer 후보 (현재 버전 → ts6 호환 목표):
  - `@typescript-eslint/parser` 8.48.1 → 9.x (ts6 지원 명시 시)
  - `eslint-config-next` 16.0.7 → next 측 type plugin 호환 점검
  - `msw` 2.14.5 → ts6 지원 버전
  - `jest` 30.3.0 + `jest-environment-jsdom` 30.3.0 → 30.x 가 ts6 지원
- 본 phase 가 dep 한 두 개 bump 면 PR 사이즈 증가. 단 typescript 메이저 의존성 안정화에 필수.

## 작업 항목

### 1. 각 peer 의 ts6 지원 매트릭스 확인

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/008-typescript-v6

# typescript-eslint v9 의 peer dep
pnpm view typescript-eslint@latest peerDependencies
pnpm view @typescript-eslint/parser@latest peerDependencies

# msw 신 버전 peer
pnpm view msw@latest peerDependencies

# jest peer
pnpm view jest@latest peerDependencies
```

각 결과를 표로 정리 (commit message 본문):

| Package | 현재 | ts6 호환 최소 | 업그레이드? |
|---|---|---|---|
| @typescript-eslint/parser | 8.48.1 | (확인 후 채움) | 필요 시 9.x |
| eslint-config-next | 16.0.7 | (next docs) | next 16 그대로 추정 |
| msw | 2.14.5 | (확인 후 채움) | 필요 시 patch+ |
| jest | 30.3.0 | (확인 후 채움) | 30.x 그대로 추정 |

### 2. 필요한 peer 업그레이드 일괄

```bash
# 예 — typescript-eslint v9 가 ts6 강제 요구 시
pnpm add -D @typescript-eslint/parser@^9 @typescript-eslint/eslint-plugin@^9
```

각 업그레이드 후 `pnpm install` 경고 0 + `pnpm tsc --noEmit` 의 peer 측 에러 0.

### 3. ESLint config 점검

`eslint.config.mjs` (또는 `.eslintrc.*`) 가 typescript-eslint plugin 의 신 API 사용 — 신 버전 import 경로 / rule 이름 변경 점검:

```bash
grep -rnE 'typescript-eslint|@typescript-eslint' eslint.config.mjs 2>/dev/null
```

신 v9 가 ESM-only 또는 새 preset 명 (`recommendedTypeChecked` 등) 요구 시 config 갱신.

### 4. 신 dep 충돌 cross-check

```bash
pnpm install
pnpm lint
pnpm tsc --noEmit
pnpm test --run
```

각 통과 확인. peer dep 측 에러 0 + 우리 코드 측 에러 0 = phase 4 진입 가능.

### 5. 자동 verification

```bash
# typescript-eslint 버전 (ts6 호환)
grep '"@typescript-eslint/parser"' package.json

# msw / jest 버전
grep -E '"msw"|"jest"' package.json

# pnpm install 경고 0 (peer 측)
pnpm install 2>&1 | grep -iE 'peer.*WARN' | wc -l   # = 0 (또는 최소)
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `package.json` / `pnpm-lock.yaml` | peer dep 업그레이드 |
| `eslint.config.mjs` (해당 시) | typescript-eslint v9 신 preset 적용 |

## Out of Scope

- msw / jest 의 신규 기능 도입 (mock signature 변경 등) — 호환만
- ESLint rule 정책 변경 — 본 plan 은 ts6 통과만
- next.js 자체 메이저 업그레이드 — 별도 plan

## Risks

| 리스크 | 완화 |
|---|---|
| typescript-eslint v9 가 ESM-only 라 우리 config 호환 안 됨 | eslint.config.mjs 가 이미 ESM. config 갱신만 필요. issue 발생 시 보고 |
| eslint-config-next 16 이 ts6 미지원 → next.js 측 업그레이드 의존 | next 측 release 점검 필요. 미지원 확정 시 plan008 일부 차단 + next 메이저 plan 분리 |
| msw 측 d.ts 가 ts6 inference 와 충돌 | 신 버전 bump 후에도 에러 잔재 시 임시 `skipLibCheck: true` (이미 설정됨) 가 한계 — 다른 옵션 검토 |
