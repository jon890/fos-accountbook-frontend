# Phase 01 — NotificationBell + List + Item 토큰 일관화

**Model**: sonnet
**Status**: pending
**Goal**: 3 컴포넌트 (Bell / List / Item) 의 legacy 하드 색 (`text-yellow-500`, `text-orange-500`, `text-red-500`, `text-blue-500`, `bg-yellow-50`, `bg-orange-50`, `bg-red-50`, `bg-blue-50`, `text-gray-*`) 제거 + warning + expense + brand 2단계 톤 매핑.

## Context (자기완결)

- 현재 파일:
  - `src/components/notifications/NotificationBell.tsx` (84 줄) — Popover trigger + Badge
  - `src/components/notifications/NotificationList.tsx` (113 줄) — 헤더 + ScrollArea + 모두읽음
  - `src/components/notifications/NotificationItem.tsx` (139 줄) — 4 타입별 아이콘/배경
- 알림 타입: `BUDGET_50_EXCEEDED` / `BUDGET_80_EXCEEDED` / `BUDGET_100_EXCEEDED` + default
- 톤 매핑 (사용자 결정):
  - 50/80% → **warning** (bg-warning/10 + text-warning + AlertTriangle/AlertCircle)
  - 100% → **expense** (bg-expense/10 + text-expense + XCircle)
  - default → **brand** (bg-brand-50 + text-brand-700 + AlertCircle)

## 작업 항목

### 1. NotificationBell — 토큰 + Badge

```tsx
// 변경 전
<Button variant="ghost" size="sm"
  className="relative text-gray-600 hover:text-gray-900 h-8 w-8 md:h-9 md:w-9 p-0">
  <Bell ... />
  {unreadCount > 0 && (
    <Badge variant="destructive" ...>
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  )}
</Button>

// 변경 후
<Button variant="ghost" size="sm"
  className="relative text-fg-muted hover:text-fg h-8 w-8 md:h-9 md:w-9 p-0">
  <Bell ... />
  {unreadCount > 0 && (
    <Badge
      className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 p-0 flex items-center justify-center text-[10px] md:text-xs bg-expense text-white border-0">
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  )}
</Button>
```

`variant="destructive"` 제거 — shadcn destructive 가 OKLCH 토큰 미적용일 수 있으므로 `bg-expense text-white` 명시.

### 2. NotificationList — 토큰 + 헤더 + empty/loading

```tsx
// 변경 전 loading
<div className="p-4 text-center text-gray-500">
  <p>알림을 불러오는 중...</p>
</div>

// 변경 후 loading — phase 02 의 Skel skeleton 사용 (본 phase 는 임시 텍스트만 유지)
<div className="p-4 text-center text-fg-muted">
  <p>알림을 불러오는 중...</p>
</div>

// 변경 전 empty
<div className="p-8 text-center text-gray-500">
  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
  <p>알림이 없습니다</p>
</div>

// 변경 후 empty — plan012 EmptyState 패턴 (inline)
<div className="p-8 text-center">
  <div className="w-16 h-16 rounded-full bg-brand-50 mx-auto mb-3 flex items-center justify-center">
    <Bell className="w-8 h-8 text-brand-500 opacity-85" />
  </div>
  <p className="text-sm font-semibold text-fg">알림이 없어요</p>
  <p className="text-xs text-fg-muted mt-1">예산 80% / 100% 초과 시 알려드릴게요</p>
</div>

// 헤더 border-b → border-border 명시
<div className="flex items-center justify-between px-4 py-3 border-b border-border">
```

### 3. NotificationItem — 톤 매핑 helper 재작성

```ts
// 변경 전
const getNotificationBgColor = (type: NotificationType) => {
  switch (type) {
    case "BUDGET_50_EXCEEDED": return "bg-yellow-50 border-yellow-200";
    case "BUDGET_80_EXCEEDED": return "bg-orange-50 border-orange-200";
    case "BUDGET_100_EXCEEDED": return "bg-red-50 border-red-200";
    default:                   return "bg-blue-50 border-blue-200";
  }
};

// 변경 후 — 2단계 매핑
type NotificationTone = "warning" | "expense" | "brand";

const getNotificationTone = (type: NotificationType): NotificationTone => {
  if (type === "BUDGET_100_EXCEEDED") return "expense";
  if (type === "BUDGET_50_EXCEEDED" || type === "BUDGET_80_EXCEEDED") return "warning";
  return "brand";
};

const TONE_BG: Record<NotificationTone, string> = {
  warning: "bg-warning/10",
  expense: "bg-expense/10",
  brand:   "bg-brand-50",
};

const TONE_FG: Record<NotificationTone, string> = {
  warning: "text-warning",
  expense: "text-expense",
  brand:   "text-brand-700",
};
```

아이콘 매핑:
- expense → `XCircle`
- warning → `AlertCircle` (80%) / `AlertTriangle` (50%) — 또는 둘 다 AlertTriangle 로 통합 (warning 톤 동일)
- brand → `AlertCircle`

### 4. NotificationItem — 본문 토큰 일괄 교체

```tsx
// 변경 전
className={cn(
  "w-full p-4 text-left transition-colors hover:bg-gray-50",
  !notification.isRead && "bg-blue-50/50"
)}
// 변경 후
className={cn(
  "w-full p-4 text-left transition-colors hover:bg-bg-muted",
  !notification.isRead && "bg-brand-50/50"
)}

// title
!notification.isRead ? "text-fg" : "text-fg-muted"
// message
!notification.isRead ? "text-fg-muted" : "text-fg-subtle"
// time
text-fg-subtle
// 읽지 않음 dot
bg-brand-500 → 그대로
```

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/017-notifications-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# legacy 하드 색 0
! grep -rnE 'text-gray-|text-yellow-|text-orange-|text-red-|text-blue-|bg-yellow-|bg-orange-|bg-red-|bg-blue-' \
  src/components/notifications/

# variant="destructive" 제거됨
! grep -rn 'variant="destructive"' src/components/notifications/

# 신 토큰 사용
grep -rnE 'text-fg|bg-bg-muted|bg-warning/|bg-expense/|bg-brand-50|text-warning|text-expense|text-brand-700' \
  src/components/notifications/ | wc -l   # >= 5

# 톤 helper 존재
grep -nE 'getNotificationTone|TONE_BG|TONE_FG' \
  src/components/notifications/NotificationItem.tsx | wc -l   # >= 2
```

수동 smoke:
- 알림이 있는 가족 계정 + Dashboard → Bell 클릭 → Popover 열림
- 50% / 80% 초과 알림 → warning 톤 (주황)
- 100% 초과 → expense 톤 (빨강)
- Dark mode → 모든 톤 자연스러움

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/notifications/NotificationBell.tsx` | Badge 토큰 + 색 |
| `src/components/notifications/NotificationList.tsx` | 헤더 + empty 카드 + loading 토큰 |
| `src/components/notifications/NotificationItem.tsx` | 톤 helper + 본문 토큰 |

## Out of Scope

- /notifications 전용 페이지 (phase 02)
- Skel skeleton (phase 02)
- Popover 전체보기 링크 (phase 02)
- 알림 type 추가 / backend schema 변경
- 알림 grouping (날짜별 / type별)

## Risks

| 리스크 | 완화 |
|---|---|
| `bg-warning/10` / `bg-expense/10` alpha 변형 미작동 (Tailwind v4 + OKLCH) | plan011/013 의 동일 패턴 일관 — 작동 확인됨. 미작동 시 inline `style={{ background: "oklch(...)" }}` |
| `--color-warning` 토큰 미정의 | plan001 점검 — warning 토큰 존재 확인 (Tailwind v4 `--color-warning` 매핑). 없으면 phase 시작 시 globals.css 추가 |
| AlertTriangle vs AlertCircle 50/80% 구분 모호 | 50% = AlertTriangle, 80% = AlertCircle 로 일관 유지 (현재 패턴 보존). 톤만 warning 으로 통일 |
| Badge `bg-expense text-white` 의 dark mode 대비 약화 | `--color-expense` OKLCH 값이 dark 에서 밝아질 경우 white 텍스트 contrast 부족 가능. **구현 후 dark mode 수동 smoke test 필수** — pnpm build 외에 시각 검증 추가. 부족 시 `text-expense-fg` 같은 의미론적 foreground 토큰 도입 (별도 plan) |
