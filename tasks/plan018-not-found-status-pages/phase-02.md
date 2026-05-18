# Phase 02 — 통합 검증 + 8단계 체크리스트 + completed

**Model**: haiku
**Status**: pending
**Goal**: plan018 phase 01 결과 통합 검증. 8단계 체크리스트 명시 검증. index.json completed 마킹.

## 작업 항목

### 1. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/018-not-found-status-pages

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

### 2. 8단계 체크리스트 명시 확인

`tasks/plan018-not-found-status-pages/index.json` 의 `planning_checklist` 8 항목이 모두 비어있지 않은지 확인:

```bash
jq -r '.planning_checklist | keys[]' tasks/plan018-not-found-status-pages/index.json | wc -l   # >= 8
jq '.planning_checklist | to_entries | map(select(.value == "" or .value == null)) | length' \
  tasks/plan018-not-found-status-pages/index.json   # == 0
```

### 3. 신규 파일 존재 확인

```bash
test -f src/components/error/StatusCard.tsx
test -f src/app/not-found.tsx
test -f src/app/\(authenticated\)/not-found.tsx
test -f src/app/\(authenticated\)/forbidden.tsx
```

### 4. 신 토큰 + 아이콘 매핑

```bash
# 3 톤 매핑
grep -nE 'bg-brand-50|bg-warning/|bg-expense/' src/components/error/StatusCard.tsx | wc -l   # >= 3

# 3 아이콘 import
grep -nE 'Compass|Lock|AlertCircle' src/components/error/StatusCard.tsx | wc -l   # >= 3

# ErrorBoundaryCard 잔재 0
! grep -rn 'ErrorBoundaryCard' src/ --include='*.tsx' --include='*.ts'
```

### 5. 수동 smoke (사용자)

| 시나리오 | 기대 결과 |
|---|---|
| 미로그인 + `/foo` (없는 경로) | not-found.tsx → brand Compass 카드 + "홈으로" → `/` |
| 로그인 + `/dashboard/foo` | (authenticated)/not-found.tsx → "대시보드로" |
| 임시 Action 에서 `forbidden()` 호출 | warning Lock 카드 + "홈으로" + "로그인 다시 시도" |
| 임시 `throw new Error("test")` (Dashboard) | expense AlertCircle 카드 + DEV 박스 |
| production build | DEV 박스 미표시 (자동 grep + 수동 확인) |
| Dark mode | 모든 톤 자연스러움 |

### 6. index.json completed 마킹

phase + 최상위 status → `"completed"` + `completed_at` 추가.

### 7. 최종 커밋

```bash
git add tasks/plan018-not-found-status-pages/index.json
git commit -m "chore(plan018): mark completed"
```

## Out of Scope

- `forbidden()` 호출을 Action 측에 일괄 도입
- `unauthorized.tsx` (401)
- 404 페이지의 검색 / 사이트맵
