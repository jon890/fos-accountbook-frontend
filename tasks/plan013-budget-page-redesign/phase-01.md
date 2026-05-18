# Phase 01 — BudgetClient Hero 카드 토큰 교체 + 통계 단락

**Model**: sonnet
**Status**: pending
**Goal**: `BudgetClient.tsx` 의 shadcn legacy 토큰 제거 + Dashboard BudgetHeroCard 와 시각 일치 + 일 평균/남은 일수/권장 일 예산 통계 단락 추가.

## Context (자기완결)

- 현재: `src/app/(authenticated)/budget/_components/BudgetClient.tsx` (197 줄)
  - `text-muted-foreground` / `bg-card` / `bg-muted` / `text-destructive` / `text-foreground` 같은 shadcn legacy 토큰 잔재
  - Hero 카드는 `gradient-budget` / `gradient-expense` 사용 (시맨틱 클래스 적용됨 — 유지)
  - 2-col Card 통계 (이번 달 지출 / 남은 예산)
- 데이터 소스: `getDashboardStatsAction()` → `{ budget, monthlyExpense, remainingBudget, year, month }`
- 참조: `src/components/dashboard/BudgetHeroCard.tsx` (Dashboard 의 동일 영역)

## 작업 항목

### 1. legacy 토큰 일괄 교체

| 변경 전 | 변경 후 |
|---|---|
| `text-foreground` | `text-fg` |
| `text-muted-foreground` | `text-fg-muted` |
| `bg-card` | `bg-bg-elev` |
| `bg-muted` | `bg-bg-muted` |
| `text-destructive` | `text-expense` |

### 2. Hero 카드 — Dashboard BudgetHeroCard 와 시각 일치

`BudgetHeroCard.tsx` 의 구조 참조해서 동일 레이아웃:
- 상단 라벨: "예산 남은 금액" 또는 "예산 초과"
- 큰 숫자: `text-4xl md:text-5xl font-bold .num` (Pretendard 수치 폰트)
- 부제: "총 예산 ₩{budget}" + "/" + `daysRemaining` "일 남음"
- Progress bar (사용률) — `gradient-card-overlay` 톤
- 우상단 PiggyBank 아이콘은 유지 (월 라벨 옆 배치)

기존 Card / CardContent shadcn wrapper 는 유지 (Dashboard BudgetHeroCard 와 동일).

### 3. 통계 단락 신규 — 일 평균 / 남은 일수 / 권장 일 예산

기존 2-col Card (이번 달 지출 / 남은 예산) 를 3-col 통계로 확장 (또는 별도 row):

```ts
const today = new Date();
const daysInMonth = new Date(year, month, 0).getDate();
const dayOfMonth = today.getDate();
const daysRemaining = Math.max(daysInMonth - dayOfMonth, 0);

const dailyAverage = dayOfMonth > 0 ? Math.round(monthlyExpense / dayOfMonth) : 0;
const recommendedDailyBudget = daysRemaining > 0 ? Math.max(Math.round(remainingBudget / daysRemaining), 0) : 0;
```

3-col grid (md+) / mobile 1-col stack:
- 카드 1: "일 평균 지출" + `dailyAverage` (.num) + 부제 `${dayOfMonth}일 기준`
- 카드 2: "남은 일수" + `daysRemaining` (.num) + 부제 `${daysInMonth}일 중`
- 카드 3: "권장 일 예산" + `recommendedDailyBudget` (.num) + 부제 "남은 예산 ÷ 남은 일수"

카드 톤: `bg-bg-elev border-border rounded-xl p-4`. 숫자 폰트 `.num text-xl md:text-2xl font-bold text-fg`. 부제 `text-xs text-fg-muted`.

### 4. 예산 미설정 빈 상태 — EmptyState 패턴 (plan012 와 일관)

기존 빈 상태 카드는 plan012 의 `EmptyState` 와 톤 통일:
- `bg-bg-elev border-dashed border-border` 또는 plan012 의 `EmptyState` 컴포넌트 재사용 (plan012 머지 후)
- 본 phase 에선 plan012 미머지일 수 있으므로 inline 으로 작성하되 톤만 새 토큰으로:
  - 96px round `bg-brand-50` + PiggyBank `text-brand-500 opacity-85`
  - 제목 17px font-bold text-fg
  - 부제 13px text-fg-muted
  - CTA: "예산 설정하기" → `/settings` (`bg-brand-500 text-white`)

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/013-budget-page-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# legacy 토큰 0
! grep -nE 'text-muted-foreground|text-destructive|bg-card|bg-muted\b' \
  src/app/\(authenticated\)/budget/_components/BudgetClient.tsx

# 신 토큰 사용
grep -nE 'text-fg|bg-bg-elev|text-brand-500|gradient-budget' \
  src/app/\(authenticated\)/budget/_components/BudgetClient.tsx | wc -l   # >= 3

# 통계 단락 계산식
grep -nE 'dailyAverage|recommendedDailyBudget|daysRemaining' \
  src/app/\(authenticated\)/budget/_components/BudgetClient.tsx | wc -l   # >= 3

# .num 클래스 사용 (Pretendard 수치)
grep -n '.num' src/app/\(authenticated\)/budget/_components/BudgetClient.tsx | wc -l   # >= 1
```

수동 smoke: `/budget` → Hero + 3 통계 + (예산 미설정 시) 빈 카드 표시. 다크 모드 토글 → 자연스러운 톤 전환.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/budget/_components/BudgetClient.tsx` | 토큰 교체 + 통계 단락 추가 + 빈 상태 갱신 |

## Out of Scope

- 라인 차트 / 카테고리 bar (phase 02 / 03)
- 예산 설정 폼 자체 (settings 의 일부) — 본 phase 는 CTA 만
- 예산 알림 임계 (80%/100%) UI — 이미 NotificationBell 로 처리됨

## Risks

| 리스크 | 완화 |
|---|---|
| `daysRemaining = 0` (월 마지막 날) 시 권장 일 예산 NaN | 분모 0 분기 처리 — `daysRemaining > 0 ? ... : 0` |
| `dayOfMonth = 0` (월 첫 날 0시) 시 일 평균 NaN | 동일 분기 처리 |
| 시간대 차이로 month 경계에서 daysInMonth 오차 | `new Date(year, month, 0).getDate()` 는 month=1~12 기준이라 정확. 단 props 의 year/month 가 server time 인지 확인 필요 — 현재는 `stats.year/month` 그대로 사용 (server 기준이라 일관) |
