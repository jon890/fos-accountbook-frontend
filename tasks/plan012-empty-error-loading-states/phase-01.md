# Phase 01 — Empty state (Transactions / Dashboard)

**Model**: sonnet
**Status**: pending
**Goal**: handoff Screen 13 적용 — 거래 0건 / 가족 미생성 같은 빈 상태에 일러스트 카드 + 팁 박스 표시. UX 가 비어있는 화면 = "에러" 로 오해되는 문제 해결.

## Context (자기완결)

- handoff 참조: `mobile-landing-auth.jsx` line 480~593 (MobileEmpty)
- 패턴: 96px brand-50 round 배경 + 48px inbox 아이콘 (brand-500 opacity 0.85) + 제목 17px + 부제 13px + CTA 버튼 + brand-50 톤 팁 박스
- 현재 거래 페이지 (`src/app/(authenticated)/transactions/page.tsx`) 가 빈 결과 시 표시하는 내용 점검 — 단순 텍스트만이면 본 phase 가 카드로 격상

## 작업 항목

### 1. `EmptyState` 공용 컴포넌트

`src/components/empty/EmptyState.tsx` 신규:

```ts
interface EmptyStateProps {
  icon: LucideIcon;       // inbox / coins / users
  title: string;
  description: string;    // <br/> 줄바꿈은 \n
  cta?: { label: string; href: string; icon?: LucideIcon };
  tip?: { title: string; body: string };
}
```

구성:
- 96px round + `bg-brand-50` + 48px 아이콘 (`text-brand-500 opacity-85`)
- 카드 wrapper: `bg-bg-elev border-border rounded-2xl px-6 pt-13 pb-10 text-center`
- 제목: `text-[17px] font-bold tracking-tight`
- 부제: `text-[13px] text-fg-muted leading-relaxed` (`whitespace-pre-line` 으로 \n 처리)
- CTA: `h-11 px-5 rounded-xl bg-brand-500 text-white shadow-[0_6px_16px_-6px_oklch(0.640_0.140_188/0.5)]`
- 팁 박스 (있을 때만): `bg-brand-50 rounded-xl p-4 text-brand-700` + sparkle 아이콘 + title + body

### 2. Transactions 빈 결과 EmptyState 적용

대상: `src/components/expenses/list/ExpenseList.tsx` (server component, fetch 결과 분기 위치) + `src/components/incomes/list/IncomeList.tsx` (server component, 동일 패턴).

`ExpenseList` 가 `getExpensesAction` 결과를 받아 `expenses.length === 0` 분기 처리. **검색/필터 적용 시에는 EmptyState 미표시** — searchParams 키 `categoryId`, `q`, `amountMin`, `amountMax` 중 **하나라도 truthy** 이면 0건이라도 기존 "검색 결과 없음" 메시지 유지 (별도 plan 처리).

```tsx
// ExpenseList.tsx 안에서
const hasFilter = Boolean(categoryId || q || amountMin || amountMax);
if (expenses.length === 0 && !hasFilter) {
  return (
    <EmptyState
      icon={Inbox}
      title="아직 거래가 없어요"
      description={"지출이나 수입을 추가하면\n여기에 표시돼요."}
      tip={{ title: "팁", body: "가족 누구나 입력할 수 있어요. 카드 청구서 도착 전에\n그때 그때 짧게 적어두면 편해요." }}
    />
  );
}
```

CTA 는 기존 FAB (BottomNav) 가 처리하므로 EmptyState 의 cta prop 생략. IncomeList 도 동일 패턴 (`incomes.length === 0 && !hasFilter`, title/description 만 "수입" 으로 교체).

### 3. Dashboard 빈 상태 (가족 미생성 외 케이스)

대시보드는 보통 `/families/create` redirect 라 빈 상태 자체 도달 어려움. 단 가족 있고 거래 0건일 때 RecentActivity / CategoryDistribution 섹션이 빈 상태:

- `RecentActivity` 0건: 인라인 단순 메시지 ("아직 거래가 없어요") + brand-50 round 32px inbox 아이콘
- `CategoryDistribution` 0건: 도넛 placeholder + "이번 달 지출이 아직 없어요"

EmptyState 컴포넌트의 mini 변형 또는 inline JSX. 본 phase 에선 inline JSX 유지 (mini 변형이 별도 prop 폭증 위험).

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan012
# branch: feat/plan012-empty-error-loading-states

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/empty/EmptyState.tsx

# Expense / Income List 에서 EmptyState 사용 + hasFilter 가드
grep -n 'EmptyState\|hasFilter' src/components/expenses/list/ExpenseList.tsx src/components/incomes/list/IncomeList.tsx | wc -l   # >= 4

# 하드코딩 색 0
! grep -rnE 'text-gray-|bg-gray-' src/components/empty/

# brand 토큰 사용
grep -nE 'bg-brand-50|text-brand-500|text-brand-700' src/components/empty/EmptyState.tsx | wc -l   # >= 3
```

수동 smoke: 거래 0건 가족 계정으로 `/transactions` → EmptyState 카드 + 팁 표시. CTA 클릭 → AddExpenseDialog 열림 (또는 FAB 안내).

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/empty/EmptyState.tsx` | 신규 |
| `src/components/expenses/list/ExpenseList.tsx` | 수정 — 0건 + !hasFilter 분기에 EmptyState |
| `src/components/incomes/list/IncomeList.tsx` | 수정 — 동일 패턴 |
| `src/components/dashboard/RecentActivity.tsx` | 수정 — 0건 inline 메시지 갱신 |
| `src/components/dashboard/CategoryDistribution.tsx` | 수정 — 0건 placeholder |

## Out of Scope

- 검색 결과 0건 (`?q=foo` 매칭 없음) 별도 UI — 본 plan 은 "원본 데이터 0건" 케이스만. 검색 0건은 후속 plan
- `/families/create` 자체의 빈 가족 onboarding — 이미 별도 페이지
- 카테고리 0개 / 멤버 0명 empty state — 본 plan 범위 외

## Risks

| 리스크 | 완화 |
|---|---|
| EmptyState 가 너무 일반화돼 페이지마다 prop 폭증 | tip 은 optional, CTA 도 optional. 페이지마다 다른 변형은 inline JSX 허용 (forced abstraction 회피) |
| 거래 0건 / 검색 0건 / 필터 0건 구분 모호 | 본 phase 는 originalCount === 0 만 처리. searchParams 가 있으면 EmptyState 미표시 (검색 결과 0건 UI 는 후속) |
| inbox 아이콘 lucide-react 버전 호환 | `Inbox` 컴포넌트 import 가능. 없으면 `Package` 대체 |
