# Phase 04 — 통합 검증 + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: plan012 전체 phase 통합 검증. legacy 잔재 0 확인. index.json completed 마킹.

## 작업 항목

### 1. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/012-empty-error-loading-states

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

### 2. 신규 파일 존재 확인

```bash
test -f src/components/empty/EmptyState.tsx
test -f src/components/error/ErrorBoundaryCard.tsx
test -f src/components/loading/Skel.tsx
test -f src/app/error.tsx
test -f src/app/global-error.tsx
test -f src/app/\(authenticated\)/error.tsx
test -f src/app/\(authenticated\)/loading.tsx
test -f src/app/\(authenticated\)/dashboard/loading.tsx
test -f src/app/\(authenticated\)/transactions/loading.tsx
test -f src/app/\(authenticated\)/analytics/loading.tsx
```

### 3. legacy / 하드코딩 잔재 0

```bash
# Empty/Error/Loading 디렉터리에서 회색·red 하드코딩 0
! grep -rnE 'text-gray-|bg-gray-|bg-red-|text-red-' \
  src/components/empty/ \
  src/components/error/ \
  src/components/loading/

# error.tsx 들 모두 "use client" 첫 줄
for f in src/app/error.tsx src/app/global-error.tsx src/app/\(authenticated\)/error.tsx; do
  head -1 "$f" | grep -q '"use client"' || { echo "❌ $f: use client missing"; exit 1; }
done
```

### 4. 수동 smoke (사용자)

| 시나리오 | 기대 |
|---|---|
| 거래 0건 가족 + `/transactions` | EmptyState 카드 + 팁 |
| 임시 `throw new Error("test")` + `/dashboard` | ErrorBoundaryCard + AlertCircle + DEV 디버그 박스 |
| Network Slow 3G + `/dashboard` 진입 | shimmer skeleton → 컨텐츠 |
| `/auth/signin` 진입 (loading.tsx 없음) | 즉시 표시 (이상 없음) |
| Dark mode + 위 시나리오 | 모두 자연스러운 톤 |

### 5. index.json completed 마킹

```bash
# 모든 phase status="completed" + 최상위 status="completed" + completed_at
```

### 6. 최종 커밋

```bash
git add tasks/plan012-empty-error-loading-states/index.json
git commit -m "chore(plan012): mark completed"
```

## Out of Scope

- 404 not-found.tsx
- Sentry / 에러 리포팅 wiring
- 검색 결과 0건 / 필터 결과 0건 별도 UI
