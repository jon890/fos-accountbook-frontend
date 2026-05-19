# Phase 01 — SettingsHero 신설 + legacy 토큰 제거

**Model**: sonnet
**Status**: pending
**Goal**: `SettingsHero` 컴포넌트를 신설해 `/settings` 상단에 Teal gradient hero 카드 (사용자 이름·email + 현재 기본 가족명 + 월 예산 요약) 표시. `SettingsPageClient.tsx` 의 `gradient-primary` (plan019 폐기) → `bg-brand-500` 단색 교체. DollarSign 아이콘 → Wallet 교체.

## Context (자기완결)

- 현재 `src/app/(authenticated)/settings/page.tsx` (28 줄): `getUserProfileAction` + `getFamiliesAction` 만 페치. SettingsPageClient 에 직접 전달.
- 현재 `src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` (305 줄):
  - L13 `DollarSign` import — 한국 원화 페이지에 부적합
  - L108-114: 단순 h1 + p 헤더 ("설정 / 가족 · 예산 · 알림 관리")
  - L180: `gradient-primary` — plan019 (Header) 에서 폐기. brand-500 단색으로 대체 결정
  - L189: `<SettingsCard icon={DollarSign} title="가족별 예산 설정" ...>` — Wallet 으로 변경
- 대시보드 hero 참고: `src/components/dashboard/BudgetHeroCard.tsx` 의 gradient + 흰 텍스트 패턴

## 작업 항목

### 1. `src/components/settings/SettingsHero.tsx` 신설

```tsx
import { Card } from "@/components/ui/card";
import type { Family } from "@/types/family";
import { Users, Wallet } from "lucide-react";

interface SettingsHeroProps {
  userName: string | null;
  userEmail: string | null;
  defaultFamily: Family | null;
}

export function SettingsHero({ userName, userEmail, defaultFamily }: SettingsHeroProps) {
  return (
    <Card className="overflow-hidden border-0 gradient-budget text-white">
      <div className="p-5 md:p-6">
        <p className="text-xs md:text-sm text-white/80 mb-1">설정</p>
        <h1 className="text-xl md:text-2xl font-bold mb-3">
          {userName ?? "사용자"}
          <span className="block text-sm md:text-base font-normal text-white/80 mt-0.5">
            {userEmail ?? ""}
          </span>
        </h1>

        {defaultFamily ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 md:gap-5 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/80" />
              <span className="font-medium">{defaultFamily.name}</span>
              <span className="text-xs text-white/70">기본 가족</span>
            </div>
            {defaultFamily.monthlyBudget > 0 ? (
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-white/80" />
                <span className="font-num font-medium tabular-nums">
                  ₩{defaultFamily.monthlyBudget.toLocaleString()}
                </span>
                <span className="text-xs text-white/70">월 예산</span>
              </div>
            ) : (
              <span className="text-xs text-white/70">월 예산 미설정</span>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/80 mt-3">기본 가족이 설정되지 않았습니다.</p>
        )}
      </div>
    </Card>
  );
}
```

`gradient-budget` 시맨틱 클래스 사용 (plan001). Dashboard `BudgetHeroCard` 와 톤 일관.

### 2. `SettingsPageClient.tsx` 갱신

변경 1 — import 정리:
```tsx
import { Check, Edit2, Save, Users, Wallet, X } from "lucide-react";
// DollarSign 제거, Wallet 추가
import { SettingsHero } from "@/components/settings/SettingsHero";
```

변경 2 — 컴포넌트 시그니처에 user/profile 추가:
```tsx
interface SettingsPageClientProps {
  families: Family[];
  defaultFamilyUuid: string | null;
  userName: string | null;
  userEmail: string | null;
}
```

변경 3 — 헤더 영역 (L108-114) 교체:
```tsx
// 변경 전
<div>
  <h1 className="text-2xl md:text-3xl font-bold text-fg mb-2">설정</h1>
  <p className="text-sm md:text-base text-fg-muted">
    가족 · 예산 · 알림 관리
  </p>
</div>

// 변경 후
<SettingsHero
  userName={userName}
  userEmail={userEmail}
  defaultFamily={
    families.find((f) => f.uuid === currentDefaultFamily) ?? null
  }
/>
```

변경 4 — gradient-primary 제거 (L180):
```tsx
// 변경 전
<Button
  onClick={handleSaveDefaultFamily}
  disabled={...}
  className="gradient-primary hover:opacity-90 text-white"
>

// 변경 후
<Button
  onClick={handleSaveDefaultFamily}
  disabled={...}
  className="bg-brand-500 hover:bg-brand-600 text-white"
>
```

변경 5 — DollarSign → Wallet (L189):
```tsx
<SettingsCard
  icon={Wallet}   // DollarSign → Wallet
  title="가족별 예산 설정"
  ...
>
```

### 3. `page.tsx` 갱신 — userName / userEmail 전달

```tsx
import { getServerSession } from "@/lib/server/auth-helpers"; // 또는 기존 세션 helper

export default async function SettingsPage() {
  const profile = await requireActionSuccess(await getUserProfileAction(), {
    fallbackErrorType: "profile",
  });

  const families = await requireActionSuccess(await getFamiliesAction(), {
    fallbackRedirect: "/families/create",
  });

  // 세션에서 user.name / user.email 가져오기 — 기존 페이지 패턴 참고
  // (Header.tsx 의 session prop 패턴 또는 auth() 직접 호출)
  const session = await auth();

  return (
    <SettingsPageClient
      families={families}
      defaultFamilyUuid={profile.defaultFamilyUuid}
      userName={session?.user?.name ?? null}
      userEmail={session?.user?.email ?? null}
    />
  );
}
```

`auth()` 호출은 `@/lib/server/auth` 또는 NextAuth v5 표준 패턴 (`Header.tsx` 호출처 확인). 페이지 자체가 이미 `dynamic = "force-dynamic"` 이라 세션 페치 추가 비용 없음.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan021-settings-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# legacy 토큰 0
! grep -nE 'gradient-primary|DollarSign' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx

# SettingsHero 사용
grep -n 'SettingsHero' src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx | head -2

# SettingsHero 파일 존재
test -f src/components/settings/SettingsHero.tsx

# 신 토큰 사용 (SettingsHero)
grep -nE 'gradient-budget|text-white|font-num' src/components/settings/SettingsHero.tsx | wc -l   # >= 2
```

수동 smoke:
- /settings 접속 → 상단 Teal gradient hero 카드 (사용자명 + email + 기본 가족명 + 월 예산)
- 기본 가족 없는 사용자 → "기본 가족이 설정되지 않았습니다" 안내
- 월 예산 0 → "월 예산 미설정"
- 모바일 (< 768px) → 폰트/padding 줄어들지만 정보 유지
- Dark mode → gradient-budget 어두운 톤 자연

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/settings/SettingsHero.tsx` | 신규 |
| `src/app/(authenticated)/settings/page.tsx` | session 페치 + userName/userEmail prop |
| `src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | SettingsHero 렌더 + gradient-primary 제거 + DollarSign → Wallet |

## Out of Scope

- BudgetEditDialog 신설 — phase-02
- 카드 정보 분리 (기본 가족 ↔ 내 가족 목록) — phase-03
- 알림 설정 / 테마 토글 — 별도 plan
- SettingsHero 안에 이번 달 지출 / 진행률 표시 — 추가 데이터 페치 비용. 추후 검토

## Risks

| 리스크 | 완화 |
|---|---|
| `auth()` import 경로가 페이지마다 다름 | Header.tsx 또는 dashboard/page.tsx 의 import 패턴 따름. 발견 못 하면 기존 페치된 profile 에 name/email 추가 (UserProfile 타입에 포함되면 page.tsx 에서 profile.name / profile.email 사용) |
| `gradient-budget` 클래스가 globals.css 에 없음 | grep 으로 확인. 없으면 `gradient-primary` 대체 클래스 사용 (단 brand-500/700 단색 fallback) |
| Family 타입에 `monthlyBudget` 필드 없음 | `@/types/family` 확인. 기존 코드에서 `family.monthlyBudget > 0` 이미 사용 (L225) → 존재 보장 |
