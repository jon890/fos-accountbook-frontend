# Phase 05 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: completed
**Goal**: phase 01~04 산출물 통합 검증, legacy 잔재 0건 증명, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상: type/service (1) + Tabs/FilterChips (2) + Search/AmountFilter (3) + DateGroup/Row (4).
- legacy 잔재 후보: 기존 탭 UI 파편 (shadcn `<Tabs>` 의존 코드), 기존 row 디자인 (ExpenseList 의 inline JSX).
- `_shared/common-pitfalls.md § 1-8` 패턴 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: <worktree root>
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` 출력 후 어느 phase 산출물이 회귀를 만들었는지 식별 + 보고.

### 2. 신규 컴포넌트 / 헬퍼 등록 확인

```bash
test -f src/app/\(authenticated\)/transactions/_components/TransactionsTabs.tsx
test -f src/app/\(authenticated\)/transactions/_components/SearchBar.tsx
test -f src/app/\(authenticated\)/transactions/_components/AmountRangeFilter.tsx
test -f src/components/transactions/TransactionRow.tsx
test -f src/components/transactions/DateGroupSection.tsx

grep -n 'DateGroupWithTotal\|TransactionFilters' src/types/ -r | wc -l   # >= 2
grep -n 'groupTransactionsWithTotal' src/services/transaction/ | wc -l    # >= 1
```

### 3. 탭/필터 동작 검증 (URL searchParams)

```bash
# searchParams 인터페이스에 q/amountMin/amountMax 추가됨
grep -nE 'q\?:|amountMin\?:|amountMax\?:' src/app/\(authenticated\)/transactions/page.tsx | wc -l   # >= 3

# segmented 디자인 토큰 사용
grep -nE 'bg-bg-muted|bg-bg-elev|shadow-subtle' src/app/\(authenticated\)/transactions/_components/TransactionsTabs.tsx | wc -l   # >= 2

# plan002 RecentActivity 가 TransactionRow 재사용
grep -n 'TransactionRow' src/components/dashboard/RecentActivity.tsx | wc -l   # >= 1
```

### 4. Hardcoded 색 잔재 0건 (plan001/002 효과 회귀 방지)

```bash
grep -rnE '#[0-9a-fA-F]{6}\b|hsl\(|rgb\(' src/components/transactions/ src/app/\(authenticated\)/transactions/ \
  | grep -vE 'rgba\(255,\s*255,\s*255'
# 결과 0줄
```

### 5. `index.json` + 본 phase status → `completed`

cross-platform 호환을 위해 node 스크립트로 갱신:

```bash
# cwd: <worktree root>
node -e "
const fs=require('fs');
const p='tasks/plan003-expenses-redesign/index.json';
const j=JSON.parse(fs.readFileSync(p,'utf8'));
j.status='completed';
j.phases.forEach(ph=>ph.status='completed');
fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
"
node -e "
const fs=require('fs');
const p='tasks/plan003-expenses-redesign/phase-05.md';
fs.writeFileSync(p, fs.readFileSync(p,'utf8').replace(/^\*\*Status\*\*: pending$/m,'**Status**: completed'));
"

# 검증
grep -c '"status": "completed"' tasks/plan003-expenses-redesign/index.json   # = 6 (top + 5 phases)
grep '^\*\*Status\*\*:' tasks/plan003-expenses-redesign/phase-05.md           # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan003-expenses-redesign/index.json` | 모든 status `completed` |
| `tasks/plan003-expenses-redesign/phase-05.md` | 본 파일 status `completed` |

## Out of Scope

- 시각 회귀 비교 스크린샷 (수동 smoke 항목으로만)
- backend issue 등록 (q/amount 미지원 케이스) — plan004+ 사용자 결정

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep false positive (주석 안 문자열) | JSX 태그 패턴 / 라인 시작 앵커 사용 |
| BSD vs GNU sed 환경 차이 | node 기반 스크립트로 통일 (cross-platform) |
