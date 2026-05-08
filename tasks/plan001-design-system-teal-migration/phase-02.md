# Phase 02 — next-themes data-theme 전환 + layout body 하드코딩 정리

**Model**: sonnet
**Status**: pending

---

## 목표

`next-themes` 의 `attribute` 를 `class`(기본) 에서 `data-theme` 으로 전환. `<html>` 에 `suppressHydrationWarning` 를 보장. `src/app/layout.tsx` 의 `<body>` 가 가진 `bg-gray-50 min-h-screen` 하드코딩 클래스를 surface 토큰 (`bg-bg`) 으로 교체하여 dark mode 시각 회귀 방지.

**선행 의존**: phase 01 (globals.css 의 `@custom-variant dark` + `[data-theme="dark"]` 토큰 정의 + `--color-bg` 토큰 정의 완료)

---

## 작업 항목 (4)

### 1. ThemeProvider 호출부 — `attribute="data-theme"` 추가

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001
grep -rn "ThemeProvider\|next-themes" src/app src/components 2>/dev/null
```

ThemeProvider 호출 위치 (`src/app/providers.tsx` 또는 `src/components/providers/theme-provider.tsx` 등 실측으로 확인) 에 `attribute="data-theme"` 추가.

```tsx
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

`enableSystem` / `defaultTheme` / `disableTransitionOnChange` 등 기존 props 보존.

### 2. `<html>` `suppressHydrationWarning` 보장

실측: `src/app/layout.tsx` 의 `<html lang="ko">` 에 `suppressHydrationWarning` **없음**. attribute 변경은 client-side 에서만 발동하므로 SSR/CSR 불일치 가능 → React 19 hydration warning 발생.

```tsx
<html lang="ko" suppressHydrationWarning>
```

### 3. `<body>` 하드코딩 클래스 정리

실측: `src/app/layout.tsx:35` `<body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>`.

`bg-gray-50` → `bg-bg` (light: `--color-neutral-50`, dark: `oklch(0.155 0.010 230)` — surface 토큰이라 dark mode 자동 전환). `min-h-screen` 은 layout 의도라 유지. `antialiased` 는 phase 01 에서 globals.css `@layer base` 에 들어갔으므로 className 에서 제거 가능 (중복 무해이므로 유지해도 됨 — 본 phase 는 제거하지 않고 유지).

폰트 변수 자리는 phase 03 에서 `pretendard.variable` / `inter.variable` 로 교체 — phase 02 는 색 토큰만 손댐.

```tsx
<body
  className={`${geistSans.variable} ${geistMono.variable} antialiased bg-bg min-h-screen text-fg`}
>
```

`text-fg` 추가 — dark mode 에서 본문 텍스트 색이 surface 토큰 따라 전환되도록 명시.

### 4. `.dark` 직접 의존 코드 점검

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001
grep -rln '\.dark\b' src/components src/app 2>/dev/null | grep -v ".test.tsx"
grep -rnE 'className="[^"]*\bdark\b' src/components src/app 2>/dev/null | grep -v "dark:" | head -20
```

`dark:` Tailwind 변형은 phase 01 의 `@custom-variant` 가 자동 매핑하므로 변경 불필요. `.dark` 클래스를 직접 다는 코드가 잡히면 `data-theme="dark"` 속성 토글로 교체 (실측상 거의 없을 가능성 — sonner.tsx 정도).

---

## Critical Files

| 파일 | 변경 |
|---|---|
| ThemeProvider 호출 파일 (실측 확인) | `attribute="data-theme"` props 추가 |
| `src/app/layout.tsx` | `suppressHydrationWarning` 추가 + `<body>` `bg-gray-50` → `bg-bg` + `text-fg` 추가 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001
pnpm lint
pnpm build
pnpm test --run

# ThemeProvider attribute 전환 확인
grep -rn 'attribute="data-theme"' src/ | wc -l    # >= 1
! grep -rnE 'attribute="class"' src/              # exit 1

# suppressHydrationWarning
grep -n 'suppressHydrationWarning' src/app/layout.tsx | wc -l   # >= 1

# layout body 하드코딩 정리
! grep -n 'bg-gray-50' src/app/layout.tsx         # exit 1
grep -n 'bg-bg' src/app/layout.tsx | wc -l        # >= 1
```

수동 smoke (`pnpm dev`):
- DevTools `<html>` 에 `data-theme="light"` / `"dark"` / `"system"` 속성 표시
- 테마 토글 → `data-theme` 즉시 변경 + 본문 배경/텍스트가 surface 토큰 따라 전환
- shadcn 컴포넌트 (button, input, card 등) light/dark 양쪽 정상 색
- sonner toast dark 에서 어두운 배경

## 의도 메모 (왜)

- `attribute='class'` 유지 시 handoff 토큰의 `[data-theme="dark"]` 셀렉터를 일괄 `.dark` 로 치환 필요 — handoff 와 매번 비교 부담. attribute 한 줄 변경 비용이 훨씬 작음.
- `bg-gray-50` 하드코딩이 body 단에서 dark mode 토큰을 가림 → plan001 의 dark mode 도입과 직접 충돌. plan001 책임 범위.
- `text-fg` 명시 추가는 dark mode 에서 텍스트 색 자동 전환 보장. 기존 `text-foreground` 도 유효하지만 surface 토큰 (`--color-fg`) 사용으로 phase 01 의 토큰 체계와 일관.
- `suppressHydrationWarning` 누락 시 `next-themes` 가 client 에서 attribute 주입할 때 React 19 hydration mismatch 경고. 실측상 없으므로 명시 추가 필수.
