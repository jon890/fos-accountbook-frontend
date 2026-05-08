# Phase 03 — shadcn ui/ 23개 OKLCH 토큰 직접 사용 재작성

**Model**: sonnet
**Status**: pending

---

## 목표

`src/components/ui/` 의 23개 컴포넌트가 `hsl(var(--primary))` 같은 HSL 채널 패턴을 통해 색을 참조하는 구조를 제거. Tailwind v4 클래스 (`bg-primary` / `text-foreground` / `border-input` 등) 직접 사용으로 일원화하고, 필요한 곳은 `var(--background)` / `var(--primary)` 같은 OKLCH 토큰 직접 참조로 교체.

phase 01 에서 `--background` / `--foreground` / `--primary` 등 shadcn 변수가 OKLCH 평면 값으로 재정의됐으므로 (HSL 채널 표기 폐기), 컴포넌트 안의 `hsl(var(--x))` 표기는 **잘못된 CSS** 가 됨 → grep 으로 0건 만드는 것이 본 phase 의 명확한 성공 기준.

**범위 외**: gradient 클래스 (`gradient-primary` 등) 사용처는 phase 03 에서 건드리지 않음 — phase 01 에서 값이 OKLCH 로 교체됐고 클래스명·시그니처 동일하므로 자동 호환. 폰트 적용은 phase 04.

**선행 의존**: phase 01 (globals.css 의 OKLCH 토큰 + shadcn 변수 OKLCH 재정의)

---

## 작업 항목 (5)

### 1. `src/components/ui/*.tsx` 23개 — `hsl(var(--x))` 문자열 제거

```bash
# cwd: /Users/nhn/personal/fos-accountbook
grep -rnE 'hsl\(var\(--' src/components/ui/ | wc -l   # 작업 시작 시 실측
```

23개 파일 전수 점검. 패턴별 교체:

| 기존 | 교체 |
|---|---|
| `style={{ background: "hsl(var(--primary))" }}` | className 으로 `bg-primary` 이동, 또는 `style={{ background: "var(--primary)" }}` |
| `bg-[hsl(var(--primary))]` arbitrary | `bg-primary` |
| `text-[hsl(var(--foreground))]` | `text-foreground` |
| `border-[hsl(var(--border))]` | `border-border` (Tailwind v4 의 `--color-border` 키) |

phase 01 의 `@theme` 블록에서 `--color-background: var(--background)` 같이 매핑됐으므로 `bg-background` / `text-foreground` 등 Tailwind 유틸리티는 그대로 동작. 즉 대부분은 arbitrary class 를 일반 class 로 단순화하는 작업.

### 2. `src/app/globals.css` 의 `@theme` 블록 단순화

phase 01 에서 호환을 위해 남겨둔 매핑:
```css
--color-background: var(--background);
--color-foreground: var(--foreground);
/* ... */
```

phase 03 에서는 이 매핑을 유지 (Tailwind v4 `bg-background` 유틸리티가 의존). 단 `@theme` 안의 다른 OKLCH 평면 값 (`--color-brand-500`, `--color-income`, `--color-bg-elev` 등) 은 그대로.

대신 `:root` 의 shadcn 변수를 OKLCH **brand 토큰 참조** 로 단순화:
```css
:root {
  --background: var(--color-neutral-50);
  --foreground: var(--color-neutral-900);
  --primary: var(--color-brand-500);
  --primary-foreground: oklch(1 0 0);
  --muted: var(--color-neutral-100);
  /* ... 모두 brand/neutral 토큰 참조로 */
}
```

phase 01 에서는 직접 `oklch(...)` 값을 적었지만, phase 03 에서 brand/neutral 단일 소스로 통일. `[data-theme="dark"]` 블록도 동일하게 토큰 참조로.

### 3. `--income` / `--expense` 변수 정리

`@theme` 의 `--color-income: hsl(var(--income))` 패턴 제거. 직접 `--color-income: oklch(0.610 0.150 152)` 정의 (phase 01 결과 그대로). `:root` 의 `--income` / `--expense` 변수는 삭제 — Tailwind 유틸리티 (`text-income` / `bg-expense`) 가 `--color-income` 을 직접 보도록.

```bash
# 사용처 영향 확인
grep -rn 'hsl(var(--income))\|hsl(var(--expense))' src/   # exit 1 (0건) 이어야 정리 안전
```

만약 사용처가 있으면 `text-income` / `bg-expense` Tailwind 유틸리티로 교체.

### 4. Calendar / Form 등 외부 라이브러리 wrapper 점검

`src/components/ui/calendar.tsx` 는 react-day-picker 의 className override 가 hsl(var()) 패턴 가능. `src/components/ui/sonner.tsx` 는 sonner 의 theme prop 만 사용 (CSS 변수 접근 없음). phase 03 grep 결과로 잡히는 곳만 교체.

### 5. 컴포넌트 재작성 후 검증

전 ui/ 파일에서 `hsl(var(...))` 문자열 0건. 각 컴포넌트의 시각 결과는 phase 01 과 동일 (값 동일, 표기만 변경).

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/components/ui/*.tsx` (23개) | `hsl(var(--x))` 패턴 제거. 대부분 className 단순화 |
| `src/app/globals.css` | `:root` / `[data-theme="dark"]` 의 shadcn 변수를 brand/neutral 토큰 참조로 단순화 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/001-design-system-teal

pnpm lint
pnpm type-check 2>/dev/null || pnpm tsc --noEmit
pnpm build
pnpm test --run

# 핵심 검증: hsl(var()) 패턴 전수 제거
! grep -rnE 'hsl\(var\(--' src/                       # exit 1 (0건)
! grep -rnE 'hsl\(var\(--' src/components/ui/         # exit 1 (0건)

# brand/neutral 토큰 단일 소스화
grep -nE '--primary:\s*var\(--color-brand-' src/app/globals.css | wc -l   # >= 1 (light + dark)
grep -nE '--background:\s*var\(--color-neutral-' src/app/globals.css | wc -l  # >= 1

# Tailwind 빌드 성공 (--color-income 등 OKLCH 직접 사용 시 v4 가 정상 처리)
pnpm build 2>&1 | grep -iE "error|fail"   # 빌드 에러 없음
```

수동 smoke (`pnpm dev`):
- `/expenses` 페이지 → 모든 form 입력, button, badge 가 Teal brand 색으로 정상 렌더
- light/dark 토글 → 모든 ui/ 컴포넌트가 셀렉터 따라 색 전환
- sonner toast → light/dark 양쪽에서 색 정상

## 의도 메모 (왜)

- HSL 채널 패턴은 shadcn 의 historic constraint (Tailwind v3 에서 alpha modifier 지원 위한 공간). Tailwind v4 + OKLCH 에서는 `oklch(L C H / alpha)` 가 alpha 를 직접 지원 → HSL 채널 트릭 무용.
- `--primary: var(--color-brand-500)` 처럼 단일 소스 (brand 스케일) 로 묶으면 추후 brand hue 변경 시 한 곳만 수정. plan002~005 에서 페이지별 미세 조정이 들어와도 토큰 일관성 유지.
- `_shared/common-pitfalls.md § 3-13` (npm dep 제거 전 globals.css 의 직접 참조 grep) 패턴 적용: 이 phase 에서는 dep 제거 없음, 단 globals.css 변수 정리 시 사용처 grep 선행.
