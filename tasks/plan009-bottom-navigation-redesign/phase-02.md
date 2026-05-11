# Phase 02 — FAB 신 디자인 (brand 단색 + white ring + custom shadow)

**Model**: sonnet
**Status**: pending
**Goal**: 현 BottomNavigation 의 FAB 를 handoff `<FAB />` 디자인으로 교체 — `gradient-primary` 단색 → `bg-brand-500` + 4px white ring + Teal-toned soft shadow.

## Context (자기완결)

- 현재 FAB (`BottomNavigation.tsx:62~70`):
  - 위치: TabBar 안 인라인 (`-mt-4 md:-mt-6` 으로 위로 빠짐)
  - 색: `gradient-primary` (gradient — 단색 X)
  - 크기: 48~56px
  - shape: `rounded-xl md:rounded-2xl` (정사각형 모서리 둥근)
  - shadow: `shadow-lg hover:shadow-xl`
  - icon: `<Plus />` white
- handoff FAB (mobile.jsx line 89~103):
  - 위치: `position: absolute, bottom: 32px, left: 50%, translateX(-50%)` — TabBar 위에 떠 있음
  - 색: `bg-brand-500` 단색 (Teal `oklch(0.640 0.140 188)`)
  - 크기: 56px
  - shape: `rounded-full` (완전 원형)
  - border: `border-4 border-bg-elev` (4px white ring — light mode 기준. dark 도 `bg-bg-elev` 토큰 자동)
  - shadow: `0 6px 20px -4px oklch(0.640 0.140 188 / 0.45), 0 2px 6px -2px rgb(0 0 0 / 0.12)` — Teal-toned soft shadow
  - icon: `<Plus />` size=24 strokeWidth=2.4 white

## 작업 항목

### 1. FAB 컴포넌트 분리

`src/components/layout/BottomNavigation.tsx` 안에 inline 으로 있던 FAB 를 별도 `<FAB />` 컴포넌트로 추출 (코드 가독성 + 향후 다른 위치 재사용 가능):

```tsx
function FAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="지출 추가"
      className="absolute bottom-[28px] left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-brand-500 text-white border-4 border-bg-elev shadow-[var(--shadow-fab)] flex items-center justify-center transition-all hover:bg-brand-600"
    >
      <Plus className="w-6 h-6" strokeWidth={2.4} />
    </button>
  );
}
```

### 2. globals.css 에 FAB shadow 토큰 추가

`src/app/globals.css` 의 `@theme` 블록 또는 `:root` 에 Teal-toned soft shadow:

```css
--shadow-fab: 0 6px 20px -4px oklch(0.640 0.140 188 / 0.45),
              0 2px 6px -2px rgb(0 0 0 / 0.12);
```

이 토큰은 FAB 전용. 다른 컴포넌트가 같은 brand-tone shadow 필요시 재사용 (예: dashboard hero card).

### 3. BottomNavigation 본문에서 FAB 위치 조정

기존:
```tsx
{/* 지출 추가 */}
<div className="relative -mt-4 md:-mt-6">
  <Button ... className="gradient-primary ...">
    <Plus ... />
  </Button>
</div>
```

신규: TabBar 안의 5개 NavButton 중 가운데 (index=2) 는 빈 공간으로 두고, 별도 `<FAB />` 를 wrapper 의 `relative` 컨테이너에 absolute 로 배치:

```tsx
<div className="fixed bottom-0 left-0 right-0 z-50 ...">
  <div className="relative max-w-7xl mx-auto px-2 md:px-4">
    <div className="flex justify-around items-center h-14 md:h-16">
      <NavButton /* 홈 */ />
      <NavButton /* 내역 */ />
      <div className="flex-1" />  {/* center slot — FAB 위치 */}
      <NavButton /* 분석 */ />
      <NavButton /* 설정 */ />
    </div>
    <FAB onClick={() => setIsExpenseDialogOpen(true)} />
  </div>
</div>
```

`<FAB />` 의 `absolute bottom-[28px] left-1/2` 가 wrapper 의 relative 컨테이너 기준으로 배치 — TabBar 위로 떠오름.

### 4. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/009-bottom-navigation-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# gradient-primary 잔재 0 (BottomNav 한정)
! grep -nE 'gradient-primary' src/components/layout/BottomNavigation.tsx

# FAB shadow 토큰 등록
grep -n '\-\-shadow-fab' src/app/globals.css | wc -l   # >= 1

# brand-500 + border-bg-elev 사용
grep -nE 'bg-brand-500|border-bg-elev|shadow-fab' src/components/layout/BottomNavigation.tsx | wc -l   # >= 2
```

수동 smoke: 모바일 → FAB 가 TabBar 위에 떠 있음 + Teal 원형 + 4px white ring + soft shadow. 클릭 시 AddExpenseDialog Sheet 진입 (plan005 효과).

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/layout/BottomNavigation.tsx` | FAB 별도 컴포넌트 추출 + 신 디자인 |
| `src/app/globals.css` | `--shadow-fab` 토큰 추가 |

## Out of Scope

- FAB tap animation (scale 등) — 추후 plan 검토
- 다른 페이지의 floating button (없음 — FAB 는 BottomNav 전용)
- AddExpenseDialog 호출 시그니처 — 그대로 (plan005 가 이미 처리)

## Risks

| 리스크 | 완화 |
|---|---|
| `--shadow-fab` 토큰을 arbitrary class `shadow-[var(--shadow-fab)]` 로 적용 시 Tailwind v4 가 못 잡음 | plan001 패턴 확인 (`shadow-[var(--shadow-default)]` 사용 사례) — 작동함 확인 |
| FAB absolute 위치가 safe-area 와 겹침 (iOS notch) | `bottom-[calc(28px+env(safe-area-inset-bottom))]` 패턴 필요 시 적용. 본 phase 1차는 단순 28px |
| 4px white ring (border-bg-elev) 이 dark mode 에서 어색 (검정 ring) | `border-bg-elev` 가 light=#FFF, dark=elevated bg — 자연스러운 ring. plan001 토큰 효과 |
