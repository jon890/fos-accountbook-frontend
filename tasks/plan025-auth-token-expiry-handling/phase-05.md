# Phase 05 — 통합 검증 + index.json completed 마킹

**Model**: haiku
**Status**: pending

---

## 목표

phase 1~4 의 변경을 통합 검증하고, 잔재를 grep 으로 확인한 뒤 task 를 완료 처리한다.

---

## 작업 항목 (3)

### 1. 통합 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
pnpm lint
pnpm test --silent 2>&1 | tail -25
pnpm build 2>&1 | tail -15
```

기대: lint exit 0, 전체 테스트 통과, build 성공.

### 2. 변경 잔재 / 회귀 grep

```bash
# cwd: /Users/nhn/personal/fos-accountbook

# phase 1 — 401 변환 + 인증 가드 적용됨
grep -n "static sessionExpired" src/lib/errors/action-error.ts
grep -nE "status === 401" src/lib/errors/action-error.ts
grep -nE 'code === "A002"' src/lib/server/action-result-handler.ts

# phase 2 — refresh 실패 가드 적용됨
grep -nE 'token.error === "RefreshAccessTokenError"' src/lib/server/auth/config.ts

# phase 3 — 로그아웃 form 제거됨
! grep -nE '<form action=\{signOutAction\}' src/components/layout/Header.tsx

# phase 4 — 토스트 컴포넌트 마운트됨
grep -n "SessionExpiredToast" src/app/auth/signin/page.tsx
```

기대: `!` 가 붙은 grep 은 exit 1(매치 없음), 나머지는 1건 이상 매치.

### 3. index.json + 모든 phase status 를 completed 로 마킹 (단일 commit 포함)

```bash
# cwd: /Users/nhn/personal/fos-accountbook
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan025-auth-token-expiry-handling/index.json

# 검증: index 1개 + phase 5개 = 6건
grep -c '"status": "completed"' tasks/plan025-auth-token-expiry-handling/index.json
```

기대: `grep -c` 결과 = 6 (top-level status 1 + phases 5).

각 phase-NN.md 본문 상단 `**Status**: pending` 도 `completed` 로 갱신 (선택 — index.json 이 단일 소스).

이 phase 의 변경(검증 + completed 마킹)을 마지막 commit 에 포함한다.

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `tasks/plan025-auth-token-expiry-handling/index.json` | 수정 — status completed |

## 의도 메모 (왜)

- 마지막 phase 가 completed 마킹을 자체 포함하는 이유: executor 가 scope 가드로 자체 추가하지 않으므로(올바른 행동), team-lead 의 PR 직전 main 직접 수정 유혹을 없앤다 (common-pitfalls § 1-8).
