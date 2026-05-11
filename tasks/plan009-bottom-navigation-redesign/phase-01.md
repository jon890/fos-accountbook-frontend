# Phase 01 — TabBar 디자인 갱신 (brand 토큰 + 활성 sw 강화)

**Model**: sonnet
**Status**: pending
**Goal**: BottomNavigation 의 5 탭 (홈/내역/추가/분석/설정) 시각을 handoff MobileShell TabBar 패턴에 맞춰 갱신. blue-600 하드코딩 → brand-600 토큰, 활성 상태 typography 강화.

## Context (자기완결)

- 현재 파일: `src/components/layout/BottomNavigation.tsx` (104줄). `<NavButton>` 서브 컴포넌트 + `<BottomNavigation>` wrapper.
- 현재 활성 색: `text-blue-600` (line 25) — 하드코딩, plan001 토큰 미적용.
- 현재 비활성 색: `text-gray-500` — surface 토큰 미적용.
- handoff TabBar (mobile.jsx line 54~87):
  - container: 88px height + 8px paddingTop + 24px paddingBottom + `border-t border-border bg-bg-elev`
  - tab item: `flex-1 flex flex-col items-center gap-[3px]`
  - 활성: `text-brand-600` + `font-semibold` + icon stroke `sw=2` (Lucide `strokeWidth`)
  - 비활성: `text-fg-subtle` + `font-medium` + icon `sw=1.6`
  - center slot (add): 빈 `<div flex-1 />` (FAB 가 absolute 로 그 위 떠 있음 — phase 02 책임)

## 작업 항목

### 1. NavButton 스타일 토큰 교체

`src/components/layout/BottomNavigation.tsx:25~26`:

```tsx
// 변경 전
isActive ? "text-blue-600" : "text-gray-500"

// 변경 후
isActive ? "text-brand-600" : "text-fg-subtle"
```

활성 라벨도 `font-semibold` (현재 `font-medium`):

```tsx
<span className={cn("text-[10px] md:text-xs", isActive && "font-semibold")}>
```

### 2. icon strokeWidth 분기

Lucide icon 은 `strokeWidth` prop 으로 stroke 두께 조절. NavButton 시그니처에 `isActive` 기반 분기:

```tsx
<Icon className="w-4.5 h-4.5 md:w-5 md:h-5" strokeWidth={isActive ? 2 : 1.6} />
```

### 3. container 시각 토큰 정렬

`<div className="fixed bottom-0 ... bg-white/90 backdrop-blur-xl border-t border-gray-200/50 ...">` 의 하드코딩 색:

```tsx
// 변경 전
className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 safe-area-pb"

// 변경 후 (light/dark 자동 전환)
className="fixed bottom-0 left-0 right-0 z-50 bg-bg-elev/95 backdrop-blur-xl border-t border-border safe-area-pb"
```

`bg-white/90` → `bg-bg-elev/95` (handoff 의 `bg-bg-elev` 토큰 + 약간 transparency 유지로 glass 효과).

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/009-bottom-navigation-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run

# 하드코딩 색 잔재 0
! grep -nE 'text-blue-600|text-gray-500|bg-white/|border-gray-' src/components/layout/BottomNavigation.tsx

# brand 토큰 사용
grep -nE 'text-brand-600|text-fg-subtle|bg-bg-elev|border-border' src/components/layout/BottomNavigation.tsx | wc -l   # >= 4

# strokeWidth 분기 도입
grep -n 'strokeWidth=' src/components/layout/BottomNavigation.tsx | wc -l   # >= 1
```

수동 smoke: 모바일 viewport → 각 탭 클릭 시 활성 색 brand-600 표시 + icon 두꺼워짐. light/dark 토글 시 surface 토큰 자동 전환.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/layout/BottomNavigation.tsx` | NavButton + container 색/typography 토큰 교체 |

## Out of Scope

- FAB 디자인 (phase 02)
- 메뉴 구성 변경 — 5 메뉴 도메인 유지
- 탭 안 신 아이콘 추가 — Lucide 그대로 (Home/CreditCard/Plus/BarChart3/Settings)
- safe-area 처리 변경 — 기존 `safe-area-pb` 유틸 유지

## Risks

| 리스크 | 완화 |
|---|---|
| Tailwind v4 가 `text-brand-600` 클래스 미인식 (theme 정의 누락) | plan001 의 `@theme --color-brand-600` 등록됨. `pnpm build` 가 unused class warning 안 띄우는지 확인 |
| dark mode 에서 `bg-bg-elev/95` 가 충분히 대비 안 됨 | plan001 의 dark theme 토큰이 이미 정의 — light/dark 둘 다 테스트 |
| `safe-area-pb` 유틸이 globals.css 에 정의됐는지 | grep 으로 확인. 없으면 본 phase OOS — 별도 plan |
