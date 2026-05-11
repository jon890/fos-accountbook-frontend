# Phase 04 — ADR-F19 본문 갱신 + tsconfig.json 신 옵션 검토

**Model**: sonnet
**Status**: pending
**Goal**: phase 1~3 의 실측 결과를 docs/adr.md ADR-F19 본문에 카테고리별로 기록 + ts6 신 옵션이 우리 프로젝트에 가치 있는지 검토 (도입은 본 plan 범위 외, 검토 결과만 ADR 또는 후속 plan 으로).

## Context (자기완결)

- ADR-F19 는 본 plan 시작 시 작성됐으나 "breaking 대응 패턴" 본문이 placeholder — phase 1 의 카테고리 분류표 + phase 2~3 의 fix 적용 패턴을 1~2줄씩 기록.
- tsconfig 옵션 ts6 컨텍스트 재검토 (기존 5.x 부터 존재하는 옵션이지만 ts6 기본값/권장값이 바뀐 가능성 점검):
  - `verbatimModuleSyntax` (ts5 부터 존재 — ts6 권장값 재검토)
  - `noUncheckedIndexedAccess` (ts5 부터 존재 — ts6 기본값/적용 효과 재검토)
  - `exactOptionalPropertyTypes` (ts5 부터 존재 — ts6 기본값 재검토)
  - 신 module 옵션 (`module: "preserve"` 등, ts5.4 부터 존재)
- 본 phase 는 신 옵션 **도입 자체는 안 함** — 검토 결과만 ADR 또는 후속 plan 메모.

## 작업 항목

### 1. ADR-F19 본문 채우기

phase 1~3 의 실측 결과를 `docs/adr.md` 의 ADR-F19 안 "breaking 대응 패턴" 섹션에 추가. 카테고리별 1~2줄:

```markdown
- **breaking 대응 패턴**:
  - lib.d.ts 변경: {N}건 — 주로 {예시 카테고리}. {적용 패턴 1줄}.
  - inference 변경: {N}건 — 주로 {예시 카테고리}. 명시 type annotation 으로 fix.
  - 신 strict 기본값: {N}건 또는 0건.
  - peer dep 충돌: {N}건 — {업그레이드한 패키지명}.
  - tsconfig.json 변경: {있음/없음 + 사유}.
```

placeholder 항목 (현재 ADR-F19 의 "phase-01 의 tsc 실측 결과를 본 ADR 본문에 카테고리별 1~2줄로 기록") 을 실측 데이터로 교체.

### 2. tsconfig.json 신 옵션 검토

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/008-typescript-v6

# 현재 tsconfig.json
cat tsconfig.json
```

ts6 release note 의 신 옵션을 우리 프로젝트에 적용 가능성 평가:

- `verbatimModuleSyntax`: ESM 명확화. import/export type 명시 의무화 — 코드 변경 폭 큼 → **본 plan OOS, plan009 검토**
- `noUncheckedIndexedAccess`: 배열 indexing 후 undefined 반환 — `arr[0]?.x` 패턴 강제. 안전성↑ but 변경 폭 큼 → **OOS**
- `exactOptionalPropertyTypes`: 우리 코드의 optional prop 에 영향 → **OOS**

검토 결과를 ADR-F19 또는 별도 `plan008-followup.md` (commit 안 함, 인라인 메모) 에 1줄씩. 본 plan 은 tsconfig.json **변경 없음** 이 기본.

### 3. CLAUDE.md 의 typescript 메모 점검

`CLAUDE.md` 에 typescript 버전 관련 메모가 있으면 ts6 으로 갱신:

```bash
grep -nE 'TypeScript|typescript' CLAUDE.md | head
```

"TypeScript 5" 같은 stale 문자열이 있으면 갱신.

### 4. 자동 verification

```bash
# ADR-F19 본문에 카테고리 항목 채워짐
grep -E 'lib\.d\.ts 변경:|inference 변경:|peer dep 충돌:' docs/adr.md | wc -l   # >= 3

# tsconfig.json 변경 없음 확인 (본 plan OOS)
git diff origin/main -- tsconfig.json | wc -l   # = 0 (또는 최소)

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `docs/adr.md` | ADR-F19 본문 placeholder → 실측 데이터 |
| `CLAUDE.md` | ts 버전 stale 메모 갱신 (해당 시) |

## Out of Scope

- 신 tsconfig 옵션 도입 (`verbatimModuleSyntax` 등) — plan009 후속
- 신 ts6 기능 (Decorator 표준 등) 적극 채택
- next.js / msw / jest 자체 메이저 업그레이드

## Risks

| 리스크 | 완화 |
|---|---|
| ADR 본문이 단순 "0건" 만 가득 (breaking 영향 미미) | 본 ADR 자체 가치 약화 — 그러나 ts6 이전 사실 + 패턴 메모 자체로 미래 ts7 참조점. 본문 작아도 보존 |
| tsconfig 신 옵션이 단순 적용 가능 (변경 폭 작음) 하면 본 plan 안에서 처리 유혹 | scope 보호 — 작아도 별도 plan. PR 검토 단위 명확. 메모만 phase 본문에 |
