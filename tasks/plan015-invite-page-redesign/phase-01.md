# Phase 01 — InvitePageClient 시각 갱신

**Model**: sonnet
**Status**: pending
**Goal**: `/invite/[token]` 의 `InvitePageClient` 를 Auth 톤 centered card 패턴으로 재설계 + 만료 임박 (24h 이내) 경고 배지 + legacy 토큰 제거.

## Context (자기완결)

- 현재 파일: `src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` (143 줄)
- legacy 잔재:
  - `app-background` (plan010 폐기 결정)
  - `text-gray-900`, `text-gray-600`, `text-gray-700`
  - `text-blue-600`, `text-orange-600`
  - `bg-muted`, `bg-gray-50`
  - `shadow-2xl`, `shadow-lg`
  - `border-0 shadow-2xl rounded-2xl` 과한 그림자 + 너무 큰 radius
- 데이터: `getInvitationInfoAction` 응답 = `{ valid, familyName?, expiresAt?, message? }`. inviter/memberCount 는 backend #127 머지 + plan016 으로 분리 (본 phase 범위 외).

## 작업 항목

### 0. import 보강

`cn` 유틸이 기존 import 에 없음 — 작업 항목 3 의 className 분기에서 필요. 다음 import 추가:

```ts
import { cn } from "@/lib/utils";
```

### 1. 배경 + 카드 wrapper 교체

```tsx
// 변경 전
<div className="min-h-screen flex items-center justify-center p-4 app-background">
  <Card className="max-w-md w-full border-0 shadow-2xl">

// 변경 후 (Auth 톤 일치)
<div className="min-h-screen flex items-center justify-center p-5 bg-bg">
  <Card className="max-w-md w-full bg-bg-elev border-border shadow-default">
```

`shadow-default` 가 globals.css 에 정의되어 있는지 확인 — 없으면 `shadow-sm` 으로 대체.

### 2. 상단 헤더 — 96px gradient-family round (Auth 톤 통일)

기존 `w-20 h-20 gradient-family rounded-full + Users w-10 h-10` 을 plan011 Auth 카드 패턴과 동일하게 96px 로 통일:

```tsx
<CardHeader className="text-center pb-4 pt-8">
  <div className="w-24 h-24 gradient-family rounded-full flex items-center justify-center mx-auto mb-4">
    <Users className="w-12 h-12 text-white" />
  </div>
  <CardTitle className="text-2xl font-bold text-fg tracking-tight">
    가족 초대
  </CardTitle>
  <CardDescription className="text-base text-fg-muted">
    가계부를 함께 관리하도록 초대받았어요
  </CardDescription>
</CardHeader>
```

### 3. 가족 정보 카드 — bg-bg-muted + 토큰 일관

```tsx
<div className="bg-bg-muted rounded-2xl p-5 space-y-4">
  <div className="flex items-center gap-3">
    <Users className="w-5 h-5 text-brand-500" />
    <div className="flex-1">
      <p className="text-xs text-fg-muted">가족 이름</p>
      <p className="text-lg font-semibold text-fg">{familyName}</p>
    </div>
  </div>

  <div className="flex items-center gap-3">
    <Clock className={cn("w-5 h-5", isExpiringSoon ? "text-expense" : "text-fg-muted")} />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <p className="text-xs text-fg-muted">만료 일시</p>
        {isExpiringSoon && (
          <span className="px-1.5 py-0.5 rounded-md bg-expense/10 text-expense text-[10.5px] font-bold uppercase tracking-wide">
            곧 만료
          </span>
        )}
      </div>
      <p className={cn(
        "text-lg font-semibold",
        isExpiringSoon ? "text-expense" : "text-fg",
      )}>
        {format(expiresAt, "M월 d일 (E) HH:mm", { locale: ko })}
      </p>
    </div>
  </div>
</div>
```

`isExpiringSoon` 계산:

```ts
const hoursUntilExpire = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
const isExpiringSoon = hoursUntilExpire <= 24;
```

### 4. 설명 박스 — brand-50 톤

```tsx
// 변경 전
<div className="bg-gray-50 rounded-2xl p-4">
  <p className="text-sm text-gray-700 leading-relaxed">
    초대를 수락하면{" "}
    <span className="font-semibold text-blue-600">{familyName}</span>
    의 구성원이 되어 함께 가계부를 작성하고 관리할 수 있습니다.
  </p>
</div>

// 변경 후
<div className="bg-brand-50 rounded-xl p-4">
  <p className="text-sm text-brand-700 leading-relaxed">
    초대를 수락하면{" "}
    <span className="font-semibold">{familyName}</span>
    {" "}의 구성원이 되어 함께 가계부를 작성하고 관리할 수 있어요.
  </p>
</div>
```

### 5. 액션 버튼 — gradient-family + 토큰 일관

```tsx
<div className="flex flex-col sm:flex-row gap-3 pt-2">
  <Button
    onClick={handleDecline}
    variant="outline"
    className="flex-1 rounded-xl"
    disabled={isAccepting}
  >
    거절하기
  </Button>
  <Button
    onClick={handleAccept}
    className="flex-1 gradient-family text-white rounded-xl shadow-default hover:opacity-90 transition-opacity"
    disabled={isAccepting}
  >
    {isAccepting ? (
      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />수락 중...</>
    ) : (
      <><UserPlus className="w-4 h-4 mr-2" />초대 수락하기</>
    )}
  </Button>
</div>
```

기존 `shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl border-2` 같은 과한 표현 제거.

### 6. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/015-invite-page-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# legacy 토큰 잔재 0
! grep -nE 'app-background|text-gray-|text-blue-600|text-orange-600|bg-gray-50|bg-muted\b|shadow-2xl|shadow-xl|shadow-lg\b' \
  src/app/\(authenticated\)/invite/\[token\]/_components/InvitePageClient.tsx

# 신 토큰 사용
grep -nE 'bg-bg-elev|bg-bg-muted|text-fg-muted|text-fg\b|gradient-family|bg-brand-50|text-brand-700|bg-expense/10|text-expense' \
  src/app/\(authenticated\)/invite/\[token\]/_components/InvitePageClient.tsx | wc -l   # >= 5

# 만료 임박 분기 로직
grep -nE 'isExpiringSoon|hoursUntilExpire' \
  src/app/\(authenticated\)/invite/\[token\]/_components/InvitePageClient.tsx | wc -l   # >= 2
```

수동 smoke:
- `/invite/{token}` → 새 카드 디자인. 만료 > 24h → fg-muted 톤 시계 + 일반 폰트
- 만료 < 24h (서버 응답 조작 또는 임시로 hoursUntilExpire = 12) → expense 톤 "곧 만료" 배지 + 빨간 시계
- Dark mode → 자연스러운 톤
- 모바일 (max-w-md 적용) + 데스크톱 동일 카드 너비

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/invite/[token]/_components/InvitePageClient.tsx` | 토큰 + 시각 전체 갱신 + isExpiringSoon 분기 추가 |

## Out of Scope

- 초대자 이름 / 아바타 표시 (backend #127 머지 + plan016)
- 가족 멤버 수 (동일 — plan016)
- 인증 안 한 사용자가 /invite 직접 접속 시 미리보기 (현재 callbackUrl 흐름 유지, 별도 plan 검토)
- 거절 시 토큰 무효화 API (현재 단순 `router.push("/")` 유지)

## Risks

| 리스크 | 완화 |
|---|---|
| `shadow-default` 토큰이 globals.css 미정의 | plan001 의 토큰 점검. 없으면 `shadow-sm` 으로 대체 (verification 에 grep 추가) |
| `bg-expense/10` alpha 변형이 Tailwind v4 OKLCH 토큰에서 미작동 | plan011 phase-02 의 동일 패턴과 일관. 작동 미확인 시 inline `style={{ background: "oklch(0.620 0.180 25 / 0.1)" }}` |
| Date.now() 가 client 시계 의존 — 사용자 시계 어긋나면 isExpiringSoon 오판 | server time 으로 계산해서 page 가 prop 으로 전달하는 방식이 더 정확하지만, 본 plan 은 단순 client 계산 유지. 24h 임계라 분 단위 오차 무관 |
| `isAccepting` 도중 다른 진입점에서 토큰 사용 시 race | 본 plan 미해결. Backend 의 token status 가 ACCEPTED 면 다음 진입 시 invalid 처리 — 이미 대응 |
