# Phase 02 — /notifications 전용 페이지 + Popover 전체보기 링크 + Skel skeleton

**Model**: sonnet
**Status**: pending
**Goal**: `/notifications` 라우트 신규 (전체 알림 + segmented 필터 + pagination) + NotificationList Popover 에 "전체보기" 링크 + Skel skeleton loading.

## Context (자기완결)

- phase 01 의 NotificationBell/List/Item 토큰 일관화 완료 전제
- 데이터:
  - `getNotificationsAction(familyUuid)` — 전체 알림 반환 (현재 limit 없음 — service 측 default 100 추정)
  - `markAllNotificationsReadAction(familyUuid)` / `markNotificationReadAction(familyUuid, uuid)`
- 페이지 위치: `src/app/(authenticated)/notifications/page.tsx`
- 컴포넌트 위치: `src/app/(authenticated)/notifications/_components/NotificationsClient.tsx` + 페이지별 loading.tsx

## 작업 항목

### 1. Popover 의 "전체보기" 링크 + 최근 10개 제한

`NotificationList.tsx` 갱신:

```tsx
// 최근 10개만 표시
const recentNotifications = notifications.slice(0, 10);

// 본문 하단에 링크
<div className="border-t border-border px-4 py-2.5 bg-bg-muted">
  <Link
    href="/notifications"
    className="block text-center text-sm font-semibold text-brand-700 hover:text-brand-800"
  >
    전체 보기 →
  </Link>
</div>
```

전체보기 클릭 시 Popover 닫기 — `onLinkClick` prop 또는 useRouter 사용.

### 2. /notifications 페이지 — Server Component

`src/app/(authenticated)/notifications/page.tsx`:

```tsx
import { auth } from "@/lib/server/auth";
import { redirect } from "next/navigation";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { getNotificationsAction } from "@/actions/notification/get-notifications-action";
import { NotificationsClient } from "./_components/NotificationsClient";

interface NotificationsPageProps {
  searchParams: Promise<{ filter?: "all" | "unread" }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const familyUuid = await getSelectedFamilyUuid();
  if (!familyUuid) redirect("/");

  const { filter = "all" } = await searchParams;

  const result = await getNotificationsAction(familyUuid);
  const notifications = result.success ? result.data.notifications : [];

  return (
    <NotificationsClient
      familyUuid={familyUuid}
      notifications={notifications}
      filter={filter}
    />
  );
}
```

### 3. NotificationsClient — segmented + "모두 읽음" + list

```ts
interface NotificationsClientProps {
  familyUuid: string;
  notifications: Notification[];
  filter: "all" | "unread";
}
```

구조:
- 페이지 헤더: "알림" 22px font-bold + "모두 읽음" CTA (unreadCount > 0 시)
- Segmented tablist (전체 / 안 읽음 — `bg-bg-muted` + 활성 `bg-bg-elev shadow-sm`) — URL `?filter=` 단방향
- 본문: filter 적용된 list — phase 01 의 `NotificationItem` 재사용
- Empty: filter="unread" + 0건 → "안 읽은 알림이 없어요" / filter="all" + 0건 → "알림이 없어요" (phase 01 의 empty 카드 재사용 또는 plan012 의 EmptyState 사용)

pagination 은 본 plan 미포함 (현재 100건 default 로 충분) — 후속 plan 검토.

### 4. Skel skeleton — loading.tsx 신규

`src/app/(authenticated)/notifications/loading.tsx` (Server Component OK):

```tsx
import { Skel } from "@/components/loading/Skel";

export default function NotificationsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skel w="30%" h={24} />
        <Skel w={88} h={32} r={8} />
      </div>
      <Skel w="100%" h={40} r={10} />
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 p-4 rounded-xl border border-border">
            <Skel w={40} h={40} r={999} />
            <div className="flex-1 space-y-2">
              <Skel w="60%" h={14} />
              <Skel w="90%" h={12} />
              <Skel w="20%" h={10} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

`Skel` 컴포넌트는 plan012 머지 후 사용. plan012 미머지 시 inline 동일 패턴 (`ab-skel` class).

### 5. NavLink / Header — /notifications 접근 동선

Header 또는 BottomNav 에 /notifications 직접 접근 링크 추가 검토:
- Header: Bell 아이콘이 이미 Popover trigger — 별도 항목 불필요
- BottomNav: 5 grid 가 이미 채워져 있으므로 추가 안 함
- Popover 의 "전체보기" 만 진입점으로 충분

### 6. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/017-notifications-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/app/\(authenticated\)/notifications/page.tsx
test -f src/app/\(authenticated\)/notifications/_components/NotificationsClient.tsx
test -f src/app/\(authenticated\)/notifications/loading.tsx

# Popover 전체보기 링크
grep -n 'href=["\x27]/notifications' src/components/notifications/NotificationList.tsx | wc -l   # >= 1

# segmented + URL filter
grep -nE 'filter=|searchParams.*filter' src/app/\(authenticated\)/notifications/ -r | wc -l   # >= 2

# Skel 사용
grep -n 'Skel\|ab-skel' src/app/\(authenticated\)/notifications/loading.tsx | wc -l   # >= 1
```

수동 smoke:
- Bell → "전체보기" 클릭 → /notifications 이동 + Popover 닫힘
- /notifications → 전체 / 안 읽음 segmented 동작 + URL `?filter=unread` 갱신
- /notifications loading (Network Slow 3G) → Skel skeleton 표시
- /notifications + 0건 → empty 카드

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/notifications/NotificationList.tsx` | 최근 10개 제한 + "전체보기" 링크 |
| `src/app/(authenticated)/notifications/page.tsx` | 신규 (Server Component) |
| `src/app/(authenticated)/notifications/_components/NotificationsClient.tsx` | 신규 (use client) |
| `src/app/(authenticated)/notifications/loading.tsx` | 신규 (Skel skeleton) |

## Out of Scope

- pagination (현재 default 100 으로 충분)
- 알림 grouping (날짜별 / type별)
- 알림 삭제 기능
- 알림 push 통보 (브라우저 Notification API)

## Risks

| 리스크 | 완화 |
|---|---|
| Popover 안 Link 클릭이 Popover 닫지 못함 | `useRouter().push()` + `setIsOpen(false)` 동시 호출. 또는 Next.js Link 의 자연스러운 navigation 후 Popover 의 onClickOutside 자동 닫힘 |
| `?filter=unread` URL state 와 client filter 충돌 | URL = single source. client 가 URL 변경 시 router.push 만 호출, 표시는 server props 의 filter 기반 (server 갱신) |
| 100건 default 가 일부 가족에서 부족 | 본 plan 은 default 유지. 사용자 보고 시 pagination 후속 plan |
| Skel skeleton 이 NotificationItem 구조와 어긋남 | phase 01 의 Item 레이아웃 (40px round + 3 line) 매치. layout shift 최소 |
