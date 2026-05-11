# Phase 05 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: completed
**Goal**: phase 01~04 산출물 통합 검증, typescript 5.x 잔재 0건 증명, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상: dep 교체 (1) + lib.d.ts/inference fix (2) + peer dep 정렬 (3) + ADR/tsconfig 검토 (4).
- legacy 잔재 후보: package.json 의 `^5` 잔재, 우리 코드의 ts5 회피 패턴 (`as any`, `// @ts-ignore`).
- `_shared/common-pitfalls.md § 1-8` 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/008-typescript-v6

pnpm install
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` + 어느 phase 가 회귀를 만들었는지 식별.

### 2. ts 버전 lock 확인

```bash
grep '"typescript"' package.json   # = "^6"
grep -E 'typescript@6\.' pnpm-lock.yaml | head -3   # 6.x 버전 lock 됨
```

### 3. ts5 잔재 grep — 0건

```bash
# package.json 의 ^5 잔재
! grep -E '"typescript":\s*"\^5' package.json

# 우리 코드의 ts5 회피 패턴 — 본 plan 신규 도입 0건
NEW_ANY=$(git diff origin/main -- 'src/**/*.ts' 'src/**/*.tsx' | grep -E '^\+.*\bas any\b|^\+.*: any\b' | grep -vE '\.test\.(ts|tsx):')
if [ -n "$NEW_ANY" ]; then
  echo "⚠️ 본 plan 에서 신규 도입된 any 사용:"
  echo "$NEW_ANY"
  exit 1
fi

# @ts-ignore / @ts-expect-error 신규 도입 — 정당 사유 없으면 0
git diff origin/main | grep -E '^\+.*@ts-ignore|^\+.*@ts-expect-error' | head
```

### 4. ADR-F19 본문 갱신 확인 (phase 04 산출물)

```bash
# placeholder 항목 사라짐 (-E ERE 모드: alternation 은 `|` 그대로, `\|` 는 리터럴이라 매치 안 됨)
! grep -nE 'phase-01.*실측 결과를.*카테고리별 1~2줄로 기록|breaking 대응 패턴.*실측 후 채움' docs/adr.md

# 실측 카테고리 항목 채워짐
grep -E 'lib\.d\.ts 변경:|inference 변경:|peer dep 충돌:' docs/adr.md | wc -l   # >= 3
```

### 5. tsconfig.json 미변경 (본 plan OOS)

```bash
git diff origin/main -- tsconfig.json | wc -l   # = 0
```

### 6. `index.json` + 본 phase status → `completed`

```bash
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan008-typescript-v6/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan008-typescript-v6/index.json
grep -c '"status": "completed"' tasks/plan008-typescript-v6/index.json   # = 6 (top + 5 phases)

sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan008-typescript-v6/phase-05.md
grep '^\*\*Status\*\*:' tasks/plan008-typescript-v6/phase-05.md   # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan008-typescript-v6/index.json` | 모든 status `completed` |
| `tasks/plan008-typescript-v6/phase-05.md` | 본 파일 status `completed` |

## Out of Scope

- PR #179 close — 본 plan PR 머지 후 사용자가 직접 close (또는 PR 의 `Closes #179` 마커)
- tsconfig.json 신 옵션 도입 — plan009 후속

## Risks

| 리스크 | 완화 |
|---|---|
| `as any` / `@ts-ignore` 가 phase 2 에서 정당 사유로 신규 도입됐다면 검증 step 3 가 false positive | 정당 사유 grep 시 주석에 "// ts6 호환 — 이유" 명시 + 본 step 3 의 grep 패턴 정교화 |
| 검증 step 3 의 `git diff origin/main` 가 plan branch base 변경으로 출력 폭증 | grep 결과를 카테고리별로 분류 + 사용자 확인 후 진행. 폭증 시 phase BLOCK |
| macOS BSD `sed -i ''` vs Linux GNU `sed -i` | 본 plan macOS 환경 가정 |
