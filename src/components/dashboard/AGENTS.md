<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# dashboard

## Purpose
대시보드 페이지 전용 컴포넌트. 통계 카드, 빠른 액션, 최근 활동, 캘린더 뷰, 웰컴 섹션으로 구성된다.

## Key Files

| File | Description |
|------|-------------|
| `DashboardClient.tsx` | 대시보드 Client Component 진입점 |
| `StatsCards.tsx` | 월별 지출/수입/예산/가족 통계 카드 4개 |
| `QuickActions.tsx` | 지출 추가, 수입 추가, 가족 초대, 카테고리 빠른 액션 버튼 |
| `RecentActivity.tsx` | 최근 거래 내역 목록 |
| `CalendarView.tsx` | 월별 캘린더 — 날짜별 수입/지출 표시 |
| `WelcomeSection.tsx` | 상단 환영 메시지 + 가족 이름 |
| `InviteFamilyDialog.tsx` | 가족 초대 다이얼로그 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `skeleton/` | 로딩 스켈레톤 컴포넌트 (DashboardContentSkeleton, StatsCardsSkeleton, WelcomeSectionSkeleton) |

## For AI Agents

### Working In This Directory
- **시맨틱 그라디언트 클래스 필수** — StatsCards의 각 카드:
  - 지출: `gradient-expense`
  - 수입: `gradient-income`
  - 예산: `gradient-budget` (초과 시 `gradient-expense`로 동적 전환)
  - 가족: `gradient-family`
- QuickActions 아이콘 색상:
  - 지출 추가: `gradient-expense`
  - 수입 추가: `gradient-income`
  - 가족 초대: `gradient-family`
  - 카테고리: `gradient-category`

### Common Patterns
```tsx
// StatsCards 예산 초과 동적 색상
const cardClass = isBudgetExceeded ? "gradient-expense" : "gradient-budget";
const textClass = isBudgetExceeded ? "text-rose-100" : "text-amber-100";
```

<!-- MANUAL: -->
