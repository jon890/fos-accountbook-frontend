# Phase 01 — globals.css OKLCH 토큰 정의

**Model**: sonnet
**Status**: pending

---

## 목표

`src/app/globals.css` 의 `@theme` 블록 + `:root` 변수를 handoff 디자인 토큰 (brand=Teal h=188, OKLCH 평면) 으로 전면 교체. shadcn 컴포넌트 호환을 위한 의미 surface 토큰 (`--background`, `--foreground`, `--primary` 등) 도 OKLCH 값으로 제공. dark mode 셀렉터를 `[data-theme="dark"]` 로 정의하고 Tailwind v4 의 `dark:` 변형을 `data-theme` 기반으로 재정의.

**범위 외**: shadcn 컴포넌트 (`src/components/ui/*`) 의 `hsl(var(--x))` 패턴 교체는 phase 03. `next-themes` attribute 변경은 phase 02. 폰트 변수 (`--font-sans` 값) 는 phase 04 에서 Pretendard 로 교체 — phase 01 은 family stack 만 정의.

**참조 (read-only)**:
- `/tmp/handoff_fos/fos-accountbook/project/tokens.js` — 토큰 정의 원본
- `/tmp/handoff_fos/fos-accountbook/project/styleguide.css` — Tailwind v4 `@theme` 블록 예시
- `docs/adr.md` ADR-F13/F14/F15

**최근 main 커밋과의 관계**:

```bash
# cwd: /Users/nhn/personal/fos-accountbook
git log origin/main --oneline -10 -- src/app/globals.css src/components/ui/ src/app/layout.tsx
```

최근 10개 중 globals.css / ui / layout.tsx 를 건드린 커밋들 (`6f45150 fix(analytics): 하드코딩 fallback 색상을 CSS 변수로 교체`, `6e6963c fix(budget): replace hardcoded gradient card colors`, `590c80d style(incomes): 하드코딩 색상 제거`, `b847b11 design: apply unified color palette` 등) 은 **하드코딩 색을 시맨틱 클래스로 옮기는 같은 방향성**. plan001 은 그 시맨틱 클래스의 값을 Teal/coral OKLCH 로 한 단계 더 옮김. 따라서 base = `origin/main` 에 깔끔히 적용 가능, 충돌 가능성 0. 단 plan001 phase 1 의 globals.css 재작성은 위 PR 들이 정의해 둔 시맨틱 클래스명 (`gradient-expense` 등) 을 **그대로 보존**하는 것이 회귀 방지의 핵심.

---

## 작업 항목 (5)

### 1. `@theme` 블록 — OKLCH 토큰 등록

`src/app/globals.css` 의 기존 `@theme { ... }` 블록을 아래 토큰 셋으로 교체. 모든 색은 `oklch(L C H)` 평면 값.

| 카테고리 | 토큰 | 값 (light) |
|---|---|---|
| brand | `--color-brand-50..900` | h=188, L 0.975→0.300 (handoff `tokens.js` 표 그대로) |
| semantic | `--color-income` | `oklch(0.610 0.150 152)` |
| | `--color-expense` | `oklch(0.620 0.180 25)` |
| | `--color-warning` | `oklch(0.760 0.150 78)` |
| neutral | `--color-neutral-0..950` | h=230, L 1→0.135 (12 단계) |
| surface (light 기본) | `--color-bg` | `var(--color-neutral-50)` |
| | `--color-bg-elev` | `var(--color-neutral-0)` |
| | `--color-bg-muted` | `var(--color-neutral-100)` |
| | `--color-fg` | `var(--color-neutral-900)` |
| | `--color-fg-muted` | `var(--color-neutral-600)` |
| | `--color-fg-subtle` | `var(--color-neutral-500)` |
| | `--color-border` | `var(--color-neutral-200)` |
| | `--color-border-strong` | `var(--color-neutral-300)` |
| radius | `--radius-sm/md/lg/xl` | 8 / 12 / 16 / 20 px |
| shadow | `--shadow-subtle/default/popover/modal` | handoff styleguide.css 4종 |
| font (stack only) | `--font-sans` | `"Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif` (실제 로드는 phase 04) |
| | `--font-num` | `"Inter", "Pretendard Variable", system-ui, sans-serif` |
| | `--font-mono` | `"JetBrains Mono", ui-monospace, "SF Mono", monospace` |

값은 `tokens.js` 의 `tokens.color.*` / `tokens.radius` / `tokens.shadow` 와 1:1 일치. Inline 으로 OKLCH 값을 적되, `var()` 참조는 surface 토큰에서만 사용.

### 2. shadcn 호환 surface 토큰 (HSL 채널 → OKLCH 직접 값)

shadcn 컴포넌트는 phase 03 까지 임시로 `hsl(var(--primary))` 패턴을 유지. phase 01 시점에는 기존 `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--income`, `--expense` 변수를 **OKLCH 평면 값** 으로 재작성 (HSL 채널 표기 폐기).

```css
:root {
  --background: oklch(0.985 0.003 230);   /* = neutral-50 */
  --foreground: oklch(0.190 0.010 230);   /* = neutral-900 */
  --primary: oklch(0.640 0.140 188);       /* = brand-500 */
  --primary-foreground: oklch(1 0 0);
  /* ... */
}
```

`@theme` 블록의 `--color-background: hsl(var(--background));` 형태 대신 `--color-background: var(--background);` 로 단순화 (HSL 채널 트릭 제거). shadcn 컴포넌트는 phase 03 에서 `bg-background` 같은 Tailwind 유틸리티 또는 직접 `var(--background)` 사용으로 옮길 예정. phase 01 은 값 재정의만.

### 3. Dark mode — `[data-theme="dark"]` 토큰 + `dark:` 변형 재정의

기존 `.dark { ... }` 블록을 삭제하고 아래 두 가지를 추가:

```css
[data-theme="dark"] {
  --color-bg: oklch(0.155 0.010 230);
  --color-bg-elev: oklch(0.205 0.012 230);
  --color-bg-muted: oklch(0.235 0.012 230);
  --color-fg: oklch(0.965 0.005 230);
  --color-fg-muted: oklch(0.760 0.015 230);
  --color-fg-subtle: oklch(0.625 0.018 230);
  --color-border: oklch(0.275 0.012 230);
  --color-border-strong: oklch(0.395 0.015 230);

  /* shadcn 호환 변수도 동일 셀렉터 안에서 재정의 */
  --background: oklch(0.155 0.010 230);
  --foreground: oklch(0.965 0.005 230);
  --primary: oklch(0.720 0.130 188);          /* dark 에서 brand-400 */
  --primary-foreground: oklch(0.190 0.010 230);
  --card: oklch(0.205 0.012 230);
  --card-foreground: oklch(0.965 0.005 230);
  --popover: oklch(0.205 0.012 230);
  --popover-foreground: oklch(0.965 0.005 230);
  --secondary: oklch(0.275 0.012 230);
  --secondary-foreground: oklch(0.965 0.005 230);
  --muted: oklch(0.275 0.012 230);
  --muted-foreground: oklch(0.760 0.015 230);
  --accent: oklch(0.275 0.012 230);
  --accent-foreground: oklch(0.965 0.005 230);
  --destructive: oklch(0.620 0.180 25);
  --destructive-foreground: oklch(0.965 0.005 230);
  --border: oklch(0.275 0.012 230);
  --input: oklch(0.275 0.012 230);
  --ring: oklch(0.720 0.130 188);
}
```

Tailwind v4 의 `dark:` 변형이 기본으로 `.dark` 클래스를 본다. `data-theme` 으로 전환하려면 globals.css 에 `@custom-variant` 를 추가:

```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

이 라인은 `@import "tailwindcss";` 직후, `@theme` 블록 앞에 위치. 이 후 `dark:bg-foo` 같은 Tailwind 유틸리티가 `[data-theme="dark"]` 하위에서 발동.

### 4. 시맨틱 그라디언트 클래스 — 값만 OKLCH/Teal 로 교체

`@layer components` 의 `gradient-{primary|expense|income|budget|family|category}` 6종 + 레거시 호환 (`gradient-blue-purple`, `gradient-emerald-green`, `gradient-purple-indigo`) 을 OKLCH 값으로 교체. **클래스명·시그니처(135deg)는 유지** — 사용처 0건 변경.

| 클래스 | 새 값 (start → end, 모두 OKLCH) |
|---|---|
| `gradient-primary` | brand-400 → brand-600 |
| `gradient-expense` | `oklch(0.700 0.180 25)` → `oklch(0.580 0.180 25)` (coral) |
| `gradient-income` | `oklch(0.700 0.150 152)` → `oklch(0.560 0.150 152)` (jade) |
| `gradient-budget` | `oklch(0.820 0.150 78)` → `oklch(0.680 0.150 78)` (amber) |
| `gradient-family` | brand-300 → brand-500 (가족=핵심 brand 강조) |
| `gradient-category` | brand-200 → brand-400 |
| 레거시 3종 | 본문 그대로 유지 (호환). plan002~005 에서 사용처 점검 후 제거 결정. |

`.app-background` (160deg gradient) 는 `oklch(0.985 0.003 230) → oklch(0.945 0.040 188 / 0.4) → oklch(0.945 0.040 188 / 0.2)` 로 — 푸른빛(원본 #eff6ff) → Teal 100 의 옅은 톤으로 교체.

`.glass` 의 hardcoded `rgba(255, 255, 255, 0.75)` 는 그대로 유지 (의도된 white film). dark mode 대응은 plan002 이후 검토.

### 5. `@layer base` 정리 + `.num` 유틸 추가

`@layer base { html, body { ... } }` 의 `font-family: var(--font-sans)` 추가 (현재 layout.tsx 의 `${geistSans.variable}` 클래스에 의존하는 형태를 변수 직접 참조로). `-webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;` 도 함께 명시.

`@layer base` 마지막에 `.num` / `[data-num]` 셀렉터 추가:

```css
.num,
[data-num] {
  font-family: var(--font-num);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  letter-spacing: -0.01em;
}
```

handoff `styleguide.css` 와 동일.

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/app/globals.css` | 전면 재작성 (수정) |

다른 파일 수정 없음. shadcn 변수 이름은 그대로 유지하므로 컴포넌트 영향 0. layout.tsx 의 폰트 변수는 phase 04 에서 교체.

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/001-design-system-teal

pnpm lint
pnpm build

# OKLCH 토큰 등록 확인
grep -c "^\s*--color-brand-" src/app/globals.css   # = 10 (50, 100, 200, ..., 900)
grep -c "^\s*--color-neutral-" src/app/globals.css # = 12 (0, 50, 100, ..., 950)
grep -E "^\s*--color-(income|expense|warning):" src/app/globals.css | wc -l  # = 3

# data-theme 셀렉터 + custom-variant 등록 확인
grep -n '@custom-variant dark' src/app/globals.css   # 1 line
grep -n '\[data-theme="dark"\]' src/app/globals.css  # >= 1 line
! grep -nE '^\s*\.dark\s*\{' src/app/globals.css     # exit 1 — .dark 블록 제거됨

# OKLCH 값만 사용 (HSL 채널 패턴 제거)
! grep -nE 'hsl\(var\(--' src/app/globals.css        # exit 1 — globals.css 에서 hsl(var()) 0건
! grep -nE '^\s*--background:\s*[0-9]+ ' src/app/globals.css  # exit 1 — HSL 채널 표기 제거

# .num 유틸 추가 확인
grep -n 'tabular-nums' src/app/globals.css | wc -l   # >= 1

# gradient 클래스명 유지 (사용처 호환)
grep -c '^\s*\.gradient-' src/app/globals.css        # = 9 (primary/expense/income/budget/family/category + legacy 3)
```

수동 smoke (`pnpm dev`):
- 메인 페이지 → 색이 깨지지 않고 로드됨 (shadcn 컴포넌트는 임시로 OKLCH 값 그대로 사용)
- light/dark 모드 토글 시 surface 토큰 전환 확인 (next-themes 는 phase 02 에서 attribute 전환 — phase 01 시점에는 아직 `.dark` 클래스 의존 → 토큰만 전환되고 셀렉터 미발동, 시각 변화 없음 정상)

## 의도 메모 (왜)

- handoff `tokens.js` 와 `styleguide.css` 가 단일 소스. 값 베끼기 외에 새로 정의하지 않는다.
- 같은 파일 안에 `@theme` (Tailwind v4 토큰) + `:root` (shadcn HSL 호환) 가 공존. phase 03 에서 후자 의존 제거 후 phase 05 에 단순화 가능 — phase 01 은 호환성 우선.
- `gradient-*` 클래스명을 유지하는 이유: handoff 가 flat color 권장이지만 현재 codebase 의 카드/버튼이 그라디언트 의존도가 높음. 클래스 유지 + 값 교체로 phase 02~05 의 회귀 위험 0.
- `@custom-variant dark` 는 Tailwind v4 권장 패턴. `attribute='data-theme'` 채택 시 (phase 02) 이 변형이 있어야 `dark:bg-foo` 가 정상 발동.
