# Phase 02 — DashboardHeader 신규 + WelcomeSection 제거

**Model**: sonnet
**Status**: pending
**Goal**: Dashboard 상단을 사용자명 인사 → 가족명 + 월 + bell + couple avatars 핀테크 헤더로 교체.

## Context (자기완결)

- 현재 `src/app/(authenticated)/dashboard/page.tsx` 가 `WelcomeSection` (사용자명) 사용. handoff 는 가족 단위 + 월 표기.
- 참조 mockup: `/tmp/handoff_fos/fos-accountbook/project/screens/mobile.jsx` line 121~138 (Header), `desktop.jsx` line 168 (DesktopShell title/subtitle).
- shadcn Avatar (`src/components/ui/avatar.tsx`) 위에 wrapper. lucide-react `<Bell />` 이미 사용 중.
- 가족 + 멤버 정보는 기존 `getFamiliesAction()` 결과에서 추출 (page.tsx 에 이미 있음).

## 작업 항목

### 1. `DashboardHeader` 신규

`src/components/dashboard/DashboardHeader.tsx` (Server Component). Props: `familyName: string | null`, `members: { uuid, name, avatarUrl? }[]`, `year: number`, `month: number`.

Layout: 좌측 라벨(가족명) + 큰 제목(`{year}년 {month}월`). 우측 bell + couple avatars. mobile `text-xl` / desktop `md:text-2xl`. plan001 토큰 클래스 (`text-fg`, `text-fg-muted`, `bg-bg`) 사용.

bell 아이콘 클릭 핸들러는 placeholder (향후 plan 분리). disabled 또는 단순 라벨링.

### 2. `CoupleAvatars` 헬퍼

`src/components/dashboard/CoupleAvatars.tsx` 또는 DashboardHeader 안 헬퍼. `members.slice(0, 2)` (3명 이상 가족은 plan003+ 에서 "+N" indicator). overlap `-ml-2` (mockup 의 `marginLeft: -8px`). ring 효과 `ring-2 ring-bg-elev`. avatarUrl 부재 시 이름 첫 글자 fallback (shadcn Avatar 기본).

### 3. page.tsx 교체

`WelcomeSection` import + 사용 제거. `DashboardHeader` 자리에 `family.name + members + year/month` 전달. `members` 가 `selectedFamily.members` 에 없으면 phase 1 의 backend 점검 결과에 추가하고 빈 배열 graceful 처리.

### 4. `WelcomeSection.tsx` 삭제

```bash
git rm src/components/dashboard/WelcomeSection.tsx
grep -rn 'WelcomeSection' src/   # = 0
```

### 5. 자동 verification

```bash
pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/dashboard/DashboardHeader.tsx
test ! -e src/components/dashboard/WelcomeSection.tsx
grep -rn 'WelcomeSection' src/ | wc -l    # = 0
grep -rn 'DashboardHeader' src/ | wc -l   # >= 2 (정의 + 사용처)
```

수동 smoke: `/dashboard` → 가족명 + "2026년 5월" + couple avatars 표시. light/dark 토글.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/dashboard/DashboardHeader.tsx` | 신규 |
| `src/components/dashboard/CoupleAvatars.tsx` | 신규 (또는 DashboardHeader 내부) |
| `src/app/(authenticated)/dashboard/page.tsx` | 수정 |
| `src/components/dashboard/WelcomeSection.tsx` | 삭제 |

## Out of Scope

- bell 클릭 라우팅 / NotificationBell 통합 (plan003+)
- 3명 이상 가족 "+N" indicator
- BudgetHeroCard / StatsCards 분해 (phase 3)

## Risks

| 리스크 | 완화 |
|---|---|
| `selectedFamily.members` 가 응답에 없음 | phase 1 backend 점검에서 확인. 없으면 빈 배열 + ` placeholder 처리, 이슈 등록 |
| WelcomeSection 외부 사용처 (다른 페이지) | grep 0 검증. 0 아니면 import 만 제거 후 파일은 phase 5 까지 보류 |
