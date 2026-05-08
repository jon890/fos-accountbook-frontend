# Phase 01 — globals.css 단일 소스 OKLCH 토큰 정의

**Model**: sonnet
**Status**: pending

---

## 목표

`src/app/globals.css` 를 한 번에 최종 형태로 재작성. handoff 디자인 토큰(brand=Teal h=188, OKLCH 평면)을 `@theme` 에 정의하고, shadcn 호환 변수(`--background` 등)는 brand/neutral 토큰을 참조하는 단일 소스 형태로 작성. dark mode 셀렉터를 `[data-theme="dark"]` 로 정의하고 Tailwind v4 의 `dark:` 변형을 `@custom-variant` 로 매핑. gradient 클래스 값 교체 + `.num` 유틸 추가.

phase 03/04 가 globals.css 를 다시 만지지 않도록 처음부터 단일 소스 형태로 작성하는 것이 본 phase 의 핵심. 폰트 family stack(`--font-sans`/`--font-num`) 정의는 phase 03 의 `next/font/local` 이 단일 소스이므로 globals.css 에 정의하지 않는다(`--font-mono` 만 정의).

**범위 외**: shadcn ui/ 컴포넌트 코드 변경 없음 — 실측상 `src/components/ui/` 의 `hsl(var(--))` 패턴 0건이므로 토큰 값만 OKLCH 로 바꾸면 자동 호환. layout.tsx 의 폰트/하드코딩 정리는 phase 02/03.

**참조 (read-only)**:
- `/tmp/handoff_fos/fos-accountbook/project/tokens.js` — 토큰 정의 원본
- `/tmp/handoff_fos/fos-accountbook/project/styleguide.css` — Tailwind v4 `@theme` 블록 예시
- `docs/adr.md` ADR-F13/F14/F15

---

## 작업 항목 (5)

### 1. `@theme` 블록 — OKLCH 토큰 등록 (단일 소스)

`src/app/globals.css` 의 기존 `@theme { ... }` 블록을 아래 토큰 셋으로 교체. 모든 색은 `oklch(L C H)` 평면 값.

| 카테고리 | 토큰 | 값 (light) |
|---|---|---|
| brand | `--color-brand-50..900` | h=188, L 0.975→0.300 (handoff `tokens.js` 표 그대로, 10 단계) |
| semantic | `--color-income` | `oklch(0.610 0.150 152)` |
| | `--color-expense` | `oklch(0.620 0.180 25)` |
| | `--color-warning` | `oklch(0.760 0.150 78)` |
| neutral | `--color-neutral-0..950` | h=230, L 1→0.135 (12 단계: 0/50/100/150/200/300/400/500/600/700/800/900/950 중 12개) |
| surface | `--color-bg` | `var(--color-neutral-50)` |
| | `--color-bg-elev` | `var(--color-neutral-0)` |
| | `--color-bg-muted` | `var(--color-neutral-100)` |
| | `--color-fg` | `var(--color-neutral-900)` |
| | `--color-fg-muted` | `var(--color-neutral-600)` |
| | `--color-fg-subtle` | `var(--color-neutral-500)` |
| | `--color-border` | `var(--color-neutral-200)` |
| | `--color-border-strong` | `var(--color-neutral-300)` |
| radius | `--radius-sm/md/lg/xl` | 8 / 12 / 16 / 20 px |
| shadow | `--shadow-subtle/default/popover/modal` | handoff styleguide.css 4종 |
| font (mono only) | `--font-mono` | `"JetBrains Mono", ui-monospace, "SF Mono", monospace` |

**`--font-sans` / `--font-num` 정의 금지** — phase 03 의 `next/font/local` 이 `variable: "--font-sans"` 로 단일 소스 제공. 두 곳 정의 시 우선순위 혼동.

shadcn 호환 매핑 (Tailwind 유틸리티 `bg-background` 등이 의존):
```css
@theme {
  /* OKLCH 토큰 등록 */
  --color-brand-500: oklch(0.640 0.140 188);
  /* ... */
  --color-bg: var(--color-neutral-50);
  /* ... */

  /* shadcn → 토큰 매핑 (Tailwind 유틸리티 호환) */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* card / popover / muted / accent / destructive / border / input / ring 동일 패턴 */
}
```

### 2. `:root` — shadcn 변수를 brand/neutral 토큰 참조로 단일 소스화

기존 `:root` 의 `--background: 0 0% 100%;` 같은 HSL 채널 표기를 폐기하고, 처음부터 brand/neutral 토큰 참조 형태로 작성:

```css
:root {
  --background: var(--color-neutral-50);
  --foreground: var(--color-neutral-900);
  --primary: var(--color-brand-500);
  --primary-foreground: oklch(1 0 0);
  --secondary: var(--color-neutral-100);
  --secondary-foreground: var(--color-neutral-900);
  --muted: var(--color-neutral-100);
  --muted-foreground: var(--color-neutral-600);
  --accent: var(--color-neutral-100);
  --accent-foreground: var(--color-neutral-900);
  --destructive: var(--color-expense);
  --destructive-foreground: oklch(1 0 0);
  --card: var(--color-neutral-0);
  --card-foreground: var(--color-neutral-900);
  --popover: var(--color-neutral-0);
  --popover-foreground: var(--color-neutral-900);
  --border: var(--color-neutral-200);
  --input: var(--color-neutral-200);
  --ring: var(--color-brand-500);
}
```

**기존 `--income` / `--expense` 변수 삭제** — Tailwind 유틸리티 (`text-income` / `bg-expense`) 가 `--color-income` / `--color-expense` 를 직접 보도록 (phase 01 task 1 의 `@theme` 등록).

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# 사용처 영향 확인 (사전)
grep -rn 'hsl(var(--income))\|hsl(var(--expense))' src/   # exit 1 (0건) 이어야 안전 삭제
```

### 3. `@custom-variant dark` + `[data-theme="dark"]` 토큰 정의

기존 `.dark { ... }` 블록 삭제 후 두 가지 추가:

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

/* @theme 블록 (위 task 1) */

[data-theme="dark"] {
  /* surface 토큰 다크 */
  --color-bg: oklch(0.155 0.010 230);
  --color-bg-elev: oklch(0.205 0.012 230);
  --color-bg-muted: oklch(0.235 0.012 230);
  --color-fg: oklch(0.965 0.005 230);
  --color-fg-muted: oklch(0.760 0.015 230);
  --color-fg-subtle: oklch(0.625 0.018 230);
  --color-border: oklch(0.275 0.012 230);
  --color-border-strong: oklch(0.395 0.015 230);

  /* shadcn 호환 변수도 같은 셀렉터에서 재정의 — brand/neutral 직접 OKLCH (dark 전용 톤) */
  --background: oklch(0.155 0.010 230);
  --foreground: oklch(0.965 0.005 230);
  --primary: oklch(0.720 0.130 188);          /* brand-400 */
  --primary-foreground: oklch(0.190 0.010 230);
  --secondary: oklch(0.275 0.012 230);
  --secondary-foreground: oklch(0.965 0.005 230);
  --muted: oklch(0.275 0.012 230);
  --muted-foreground: oklch(0.760 0.015 230);
  --accent: oklch(0.275 0.012 230);
  --accent-foreground: oklch(0.965 0.005 230);
  --destructive: oklch(0.620 0.180 25);
  --destructive-foreground: oklch(0.965 0.005 230);
  --card: oklch(0.205 0.012 230);
  --card-foreground: oklch(0.965 0.005 230);
  --popover: oklch(0.205 0.012 230);
  --popover-foreground: oklch(0.965 0.005 230);
  --border: oklch(0.275 0.012 230);
  --input: oklch(0.275 0.012 230);
  --ring: oklch(0.720 0.130 188);
}
```

`@custom-variant` 라인은 `@import "tailwindcss";` 직후, `@theme` 블록 앞에 위치. 이 후 `dark:bg-foo` 같은 Tailwind 유틸리티가 `[data-theme="dark"]` 하위에서 발동.

### 4. 시맨틱 그라디언트 클래스 — 값만 OKLCH/Teal 로 교체

`@layer components` 의 `gradient-{primary|expense|income|budget|family|category}` 6종 + 레거시 호환(`gradient-blue-purple`, `gradient-emerald-green`, `gradient-purple-indigo`)을 OKLCH 값으로 교체. **클래스명·시그니처(135deg) 유지** — 사용처 0건 변경.

| 클래스 | 새 값 (start → end, 모두 OKLCH) |
|---|---|
| `gradient-primary` | brand-400 → brand-600 |
| `gradient-expense` | `oklch(0.700 0.180 25)` → `oklch(0.580 0.180 25)` (coral) |
| `gradient-income` | `oklch(0.700 0.150 152)` → `oklch(0.560 0.150 152)` (jade) |
| `gradient-budget` | `oklch(0.820 0.150 78)` → `oklch(0.680 0.150 78)` (amber) |
| `gradient-family` | brand-300 → brand-500 (가족=핵심 brand 강조) |
| `gradient-category` | brand-200 → brand-400 |
| 레거시 3종 | 본문 그대로 유지 (호환). plan002~005 에서 사용처 점검 후 제거 결정. |

`.app-background` (160deg gradient) 는 `oklch(0.985 0.003 230) → oklch(0.945 0.040 188 / 0.4) → oklch(0.945 0.040 188 / 0.2)` (푸른빛 → Teal 100 옅은 톤).

`.glass` 의 `rgba(255, 255, 255, 0.75)` 는 그대로 유지 (의도된 white film).

### 5. `@layer base` 정리 + `.num` 유틸 추가

```css
@layer base {
  html, body {
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  .num,
  [data-num] {
    font-family: var(--font-num);
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1;
    letter-spacing: -0.01em;
  }
}
```

`--font-sans` / `--font-num` 의 실제 값은 phase 03 의 `next/font/local` 이 `<body className>` 으로 주입. globals.css 시점에는 변수 참조만.

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/app/globals.css` | 전면 재작성 (수정) — 단일 소스 형태 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001
pnpm lint
pnpm build

# OKLCH 토큰 등록 확인
grep -c '^\s*--color-brand-' src/app/globals.css   # = 10
grep -c '^\s*--color-neutral-' src/app/globals.css # = 12
grep -E '^\s*--color-(income|expense|warning):' src/app/globals.css | wc -l  # = 3

# data-theme 셀렉터 + custom-variant 등록
grep -n '@custom-variant dark' src/app/globals.css | wc -l    # = 1
grep -n '\[data-theme="dark"\]' src/app/globals.css | wc -l   # >= 1
! grep -nE '^\s*\.dark\s*\{' src/app/globals.css              # exit 1 — .dark 블록 0건

# 단일 소스 — :root 가 brand/neutral 토큰 참조
grep -nE '--primary:\s*var\(--color-brand-' src/app/globals.css | wc -l   # >= 1
grep -nE '--background:\s*var\(--color-neutral-' src/app/globals.css | wc -l  # >= 1

# HSL 채널 트릭 제거
! grep -nE 'hsl\(var\(--' src/app/globals.css                 # exit 1
! grep -nE '^\s*--background:\s*[0-9]+ ' src/app/globals.css  # exit 1

# globals.css 가 --font-sans/--font-num 정의 안 함 (next/font 단일 소스)
! grep -nE '@theme[\s\S]*--font-sans:' src/app/globals.css 2>/dev/null || \
  awk '/@theme[[:space:]]*\{/,/^\}/' src/app/globals.css | grep -E '^\s*--font-(sans|num):' && exit 1 || true
grep -E '^\s*--font-mono:' src/app/globals.css | wc -l       # >= 1 (mono 만)

# .num 유틸
grep -n 'tabular-nums' src/app/globals.css | wc -l           # >= 1

# gradient 클래스명 유지 (사용처 호환)
grep -c '^\s*\.gradient-' src/app/globals.css                # = 9
```

수동 smoke (`pnpm dev`):
- 메인 페이지 → 색이 깨지지 않고 로드 (shadcn 컴포넌트 자동 호환)
- light/dark 모드 토글 시 surface 토큰 전환 확인 (next-themes attribute 는 phase 02 에서 변경 — phase 01 시점에는 `.dark` 클래스 의존이 끊겨 토글 시 시각 변화 없음 정상)

## 의도 메모 (왜)

- **단일 소스화** — phase 01 에서 `:root` 를 brand/neutral 토큰 참조 형태로 처음부터 작성하면 phase 03/04 가 globals.css 를 재수정하지 않아도 됨. 같은 파일 3번 만지는 원자성 위반 회피.
- **`--font-sans` 정의 금지** — `next/font/local` 의 `variable` 옵션이 자동 fallback stack 까지 생성. 두 곳 정의 시 우선순위 혼동 + phase 03 에서 globals.css 재수정 필요. 처음부터 `--font-mono` 만 globals 에 정의.
- **gradient 클래스명 유지** — handoff 가 flat color 권장이지만 현재 codebase 카드/버튼이 그라디언트 의존도 높음. 클래스 유지 + 값 교체로 plan002~005 회귀 위험 0.
- **`@custom-variant dark`** — Tailwind v4 권장 패턴. `attribute='data-theme'` 채택 시(phase 02) 이 변형이 있어야 `dark:bg-foo` 정상 발동.
- **사실 정합** — 실측상 `src/components/ui/` 에 `hsl(var(--))` 0건. phase 01 의 토큰 값 교체만으로 ui/ 컴포넌트 자동 호환되므로 별도 phase 불필요.
