# Phase 05 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: phase 01~04 산출물 통합 검증, legacy 잔재 0건 증명, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상: type/service/action + backend issue (1) + PeriodToggle URL (2) + CategoryDonut (3) + MonthlyTrendBar/CategoryDetailList (4).
- legacy 잔재 후보: `CategoryPieChart`, `DailyBarChart` 두 컴포넌트 — 모두 삭제 대상.
- `_shared/common-pitfalls.md § 1-8` 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/006-analytics-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` + 어느 phase 가 회귀를 만들었는지 식별.

### 2. Legacy 컴포넌트 삭제 검증

```bash
test ! -e src/app/\(authenticated\)/analytics/_components/CategoryPieChart.tsx
test ! -e src/app/\(authenticated\)/analytics/_components/DailyBarChart.tsx

grep -rn 'CategoryPieChart\|DailyBarChart' src/ | wc -l   # = 0
```

### 3. 신규 컴포넌트 / 헬퍼 / action 등록 확인

```bash
test -f src/app/\(authenticated\)/analytics/_components/AnalyticsPeriodToggle.tsx
test -f src/app/\(authenticated\)/analytics/_components/AnalyticsCategoryDonut.tsx
test -f src/app/\(authenticated\)/analytics/_components/MonthlyTrendBar.tsx
test -f src/app/\(authenticated\)/analytics/_components/CategoryDetailList.tsx
test -f src/components/ui/segmented-toggle.tsx
test -f src/types/analytics.ts
test -f src/services/analytics/analytics-service.ts
test -f src/actions/analytics/get-monthly-trend-action.ts
test -f src/actions/analytics/get-category-breakdown-with-delta-action.ts

grep -n 'AnalyticsPeriod\|MonthlyTrend\|CategoryWithDelta' src/types/analytics.ts | wc -l   # >= 3
```

### 4. page.tsx 4섹션 순서

```bash
node -e "const s=require('fs').readFileSync('src/app/(authenticated)/analytics/_components/AnalyticsClient.tsx','utf8'); const order=['<AnalyticsPeriodToggle','<AnalyticsCategoryDonut','<MonthlyTrendBar','<CategoryDetailList']; let last=-1; for (const c of order) { const i=s.indexOf(c); if (i<0||i<=last) { console.error('order broken:', c); process.exit(1) } last=i; } console.log('ok')"
```

### 5. Hardcoded 색 잔재 0건 (plan001/002 효과 회귀 방지)

```bash
grep -rnE '#[0-9a-fA-F]{6}\b|hsl\(|rgb\(' src/app/\(authenticated\)/analytics/ \
  | grep -vE 'rgba\(255,\s*255,\s*255' \
  | grep -vE '\.test\.tsx?:'
# 결과 0줄
```

### 6. URL searchParams 동기화 (ADR-F17 패턴)

```bash
grep -nE 'period\?: AnalyticsPeriod|searchParams.*period' src/app/\(authenticated\)/analytics/page.tsx | wc -l   # >= 1
grep -nE 'useRouter|useSearchParams' src/app/\(authenticated\)/analytics/_components/AnalyticsClient.tsx | wc -l   # >= 1
```

### 7. backend issue 등록 확인 (phase-01 산출물)

phase-01 commit message 또는 별도 본문에 backend issue URL 명시됨. plan006 PR description 에 issue 링크 포함.

### 8. `index.json` + 본 phase status → `completed`

```bash
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan006-analytics-redesign/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan006-analytics-redesign/index.json
grep -c '"status": "completed"' tasks/plan006-analytics-redesign/index.json   # = 6 (top + 5 phases)

sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan006-analytics-redesign/phase-05.md
grep '^\*\*Status\*\*:' tasks/plan006-analytics-redesign/phase-05.md   # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan006-analytics-redesign/index.json` | 모든 status `completed` |
| `tasks/plan006-analytics-redesign/phase-05.md` | 본 파일 status `completed` |

## Out of Scope

- 시각 회귀 비교 스크린샷 (수동 smoke 항목으로만)
- backend endpoint 도착 후 service 전환 — plan007 (또는 plan006-2)
- DateRangeChip 의 커스텀 범위 선택 (현재 읽기 전용)

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep false positive (주석 안 문자열) | 라인 시작 앵커 + 정확한 토큰 매치 |
| macOS BSD `sed -i ''` vs Linux GNU `sed -i` | 본 plan macOS 환경 가정 |
| `getMonthlyDailyStatsAction` 가 dashboard 에서 사용 중이면 analytics 외 영향 | phase 4 의 grep 결과로 식별 후 보존 또는 보고 |
