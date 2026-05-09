# Phase 05 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: phase 01~04 산출물 통합 검증, ky 1.x 잔재 0건 증명, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상: dep bump + hook (1) + prefix rename (2) + .json 가드/HTTPError.data (3) + mock 갱신 (4).
- legacy 잔재 후보: `prefixUrl`, `(_request, _options, response)` 위치 인자, `await error.response.json` 패턴.
- `_shared/common-pitfalls.md § 1-8` 패턴 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/004-ky-v2-migration

pnpm install
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` 출력 후 어느 phase 산출물이 회귀를 만들었는지 식별 + 보고.

### 2. ky 1.x 잔재 grep — 0건 증명

```bash
# cwd: /Users/nhn/personal/fos-accountbook

# package.json 에서 v2.x lock
grep '"ky"' package.json   # = "^2.0.2"

# prefixUrl 잔재 0건 (phase 02)
! grep -rnE 'prefixUrl' src/

# 위치 인자 hook 시그니처 잔재 0건 (phase 01)
! grep -nE 'beforeRequest:\s*\[\s*\(\s*request\s*\)' src/lib/server/api/client.ts
! grep -nE 'afterResponse:\s*\[\s*async\s*\(\s*_request,\s*_options' src/lib/server/api/client.ts

# .json().catch(() => null) 패턴 잔재 0건 (phase 03)
! grep -nE 'await error\.response\.json' src/lib/server/api/client.ts
! grep -nE 'await response\.json\(\)\.catch' src/lib/server/api/client.ts
```

### 3. ky 2.0 신규 패턴 등록 확인

```bash
# prefix 옵션 사용
grep -n 'prefix:\s*API_URL' src/lib/server/api/client.ts | wc -l   # = 1

# 단일 state object hook signature
grep -nE 'beforeRequest:\s*\[\s*\(\s*\{' src/lib/server/api/client.ts | wc -l   # >= 1
grep -nE 'afterResponse:\s*\[\s*async\s*\(\s*\{' src/lib/server/api/client.ts | wc -l   # >= 1

# HTTPError.data 활용
grep -nE 'error\.data' src/lib/server/api/client.ts | wc -l   # >= 2

# 빈 body 가드
grep -nE 'response\.status === 204|content-length' src/lib/server/api/client.ts | wc -l   # >= 1

# mock 갱신
grep -n 'data:\s*unknown\|this\.data' src/__mocks__/ky.ts | wc -l   # >= 1
```

### 4. `index.json` + 본 phase status → `completed`

```bash
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan004-ky-v2-migration/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan004-ky-v2-migration/index.json
grep -c '"status": "completed"' tasks/plan004-ky-v2-migration/index.json   # = 6 (top + 5 phases)

sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan004-ky-v2-migration/phase-05.md
grep '^\*\*Status\*\*:' tasks/plan004-ky-v2-migration/phase-05.md   # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan004-ky-v2-migration/index.json` | 모든 status `completed` |
| `tasks/plan004-ky-v2-migration/phase-05.md` | 본 파일 status `completed` |

## Out of Scope

- PR #193 close — 본 plan PR 머지 후 사용자가 GitHub UI 에서 직접 close (또는 plan PR description 에 "Closes #193" 마커로 자동 close 트리거)
- ky 2.0 신규 기능 (NetworkError, totalTimeout, baseUrl, Standard Schema) — 후속 plan 검토

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep false positive (주석 안 문자열) | 라인 시작 앵커 / 정확한 토큰 매치로 한정 |
| 통합 테스트 부족 (jest.mock 만으로는 실 ky 동작 미검증) | 수동 smoke 단계에서 dev backend 호출 — 정상/에러/204 케이스 점검 |
