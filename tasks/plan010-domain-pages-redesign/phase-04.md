# Phase 04 — FamiliesCreate glass 제거 + gradient-family 채널

**Model**: sonnet
**Status**: pending
**Goal**: handoff FamiliesCreate (Screen 8) 디자인 적용 — `app-background + glass-card` 폐기 + `bg-bg-elev` 카드 + gradient-family 채널 (상단 아이콘 원형) + 가계부 타입 segmented 토글.

## Context (자기완결)

- 영향 파일: `src/app/(authenticated)/families/create/page.tsx` (164줄). 신규 사용자 첫 진입점.
- 현재 (line 66~67):
  - 배경: `min-h-screen app-background p-4`
  - Card: `<Card className="glass-card">`
  - 안내 박스 (line 147~): `bg-blue-50` + `text-blue-900/700` 하드코딩
- handoff 참조: `mobile-extra.jsx` line 579~720 + `desktop-extra.jsx` line 491~628
- 사용자 결정: glass 제거 + bg-bg-elev card + gradient-family 채널만 상단.

## 작업 항목

### 1. 배경 / 카드 / 저장 버튼 토큰 교체

```tsx
// 변경 전
<div className="min-h-screen app-background p-4">
  <div className="max-w-md mx-auto pt-20">
    <Card className="glass-card">

// 변경 후
<div className="min-h-screen bg-bg p-4">
  <div className="max-w-md mx-auto pt-20">
    <Card className="bg-bg-elev border-border shadow-default">
```

`app-background` 클래스는 다른 페이지에서 쓰이는지 grep 확인:

```bash
grep -rn 'app-background\|glass-card' src/ 2>/dev/null
```

`app-background` 가 본 페이지 외 사용처 0 이면 globals.css 에서도 제거 (본 항목 안에서 함께). 0 아니면 본 페이지 className 만 교체.

저장 버튼 토큰도 동일 작업으로 통합:

```bash
grep -n 'gradient-primary\|bg-primary\|bg-blue-' src/app/\(authenticated\)/families/create/page.tsx
```

저장 버튼: `bg-brand-500 hover:bg-brand-600 text-white w-full` 토큰으로 교체.

### 2. 상단 gradient-family 채널 (아이콘 원형)

handoff 패턴: 카드 상단에 96px round + `gradient-family` 배경 + `<Users />` 아이콘 white inside. 시각 강조 + 도메인 정체성.

```tsx
<CardHeader className="text-center pt-8 pb-4">
  <div className="mx-auto mb-3 w-24 h-24 rounded-full gradient-family flex items-center justify-center">
    <Users className="w-10 h-10 text-white" strokeWidth={2.2} />
  </div>
  <CardTitle className="text-2xl font-bold tracking-tight text-fg">
    우리집 가계부 시작하기
  </CardTitle>
  <CardDescription className="text-fg-muted">
    가족 가계부를 만들어 보세요
  </CardDescription>
</CardHeader>
```

기존 `text-primary` (line 70 `<CardTitle className="text-2xl font-bold text-primary">`) → `text-fg`. brand 강조는 상단 아이콘 채널이 담당.

### 3. 가계부 타입 segmented 토글 (plan003 패턴 재사용)

현재 `personal` vs `family` 선택 UI 점검 후 plan003 의 `SegmentedToggle` 또는 동일 패턴 적용 (plan006 가 SegmentedToggle generic 추출 가능성 — 점검).

```bash
# SegmentedToggle generic helper 위치
grep -rn 'SegmentedToggle\|segmented-toggle' src/components/ui/ src/components/ 2>/dev/null
```

없으면 inline 구현 (handoff 패턴 그대로):
```tsx
<div className="flex gap-1 bg-bg-muted p-1 rounded-md">
  <button
    type="button"
    onClick={() => setFamilyType("family")}
    className={cn(
      "flex-1 py-2 px-3 rounded text-sm font-semibold transition",
      familyType === "family" ? "bg-bg-elev text-fg shadow-subtle" : "text-fg-muted"
    )}
  >
    가족
  </button>
  <button ... >개인</button>
</div>
```

### 4. 안내 박스 토큰 교체

기존 (line 147~153):
```tsx
<div className="mt-6 p-4 bg-blue-50 rounded-lg">
  <h4 className="font-medium text-sm text-blue-900 mb-2">...</h4>
  <p className="text-xs text-blue-700">...</p>
</div>
```

신규 — brand-50/700 톤으로 안내:
```tsx
<div className="mt-6 p-4 bg-brand-50 rounded-md border border-brand-100">
  <h4 className="font-semibold text-sm text-brand-700 mb-1">...</h4>
  <p className="text-xs text-brand-700/80">...</p>
</div>
```

`brand-100` 등록 — plan001 `@theme` 에 이미 있음 (brand 50~900 전 스케일).

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/010-domain-pages-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# glass-card / app-background 잔재 0 (본 페이지 한정)
! grep -nE 'glass-card|app-background' src/app/\(authenticated\)/families/create/page.tsx

# 하드코딩 색 잔재 0
! grep -nE 'bg-blue-|text-blue-|text-primary' src/app/\(authenticated\)/families/create/page.tsx

# gradient-family + brand 토큰
grep -nE 'gradient-family|bg-brand-500|bg-brand-50|text-brand-' src/app/\(authenticated\)/families/create/page.tsx | wc -l   # >= 3
```

수동 smoke: 새 가입 사용자 시뮬레이션 → `/families/create` → 상단 gradient-family 원형 + brand 톤 카드 + 가족/개인 segmented + 안내 박스 brand-50 톤. 저장 → /dashboard 진입.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/families/create/page.tsx` | 배경 + 카드 + 아이콘 + 안내 + 저장 버튼 토큰 |
| `src/app/globals.css` | `app-background` / `glass-card` 클래스 — 다른 페이지에서 사용처 0 이면 제거 (작업항목 1 점검) |

## Out of Scope

- 가족 초대 (invite) 페이지 디자인 — handoff Screen 외, 별도 plan
- 가입 흐름 신규 ("가족 코드 입력" 등) — 도메인 변경 필요
- 다국어 — 본 plan 한국어만

## Risks

| 리스크 | 완화 |
|---|---|
| `app-background` 가 다른 페이지에서 사용 중 | grep 결과로 식별. 사용처 있으면 본 페이지 className 만 교체 — globals.css 정의는 유지 |
| `gradient-family` 그라디언트 색이 dark mode 에서 대비 약함 | plan001 의 gradient-family 정의 (brand 300→500) 가 dark/light 동일 hue — 명도 자동. 시각 점검 |
| segmented toggle helper 가 plan006 에서 추출 안 됐을 경우 inline | 인라인으로 단순. helper 재사용은 후속 plan |
