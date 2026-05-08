# Phase 02 — next-themes attribute=data-theme 전환

**Model**: sonnet
**Status**: pending

---

## 목표

`next-themes` 의 `attribute` 옵션을 `class` (기본) 에서 `data-theme` 으로 전환. 코드베이스 전반의 `.dark` 의존 코드를 `[data-theme="dark"]` 또는 Tailwind `dark:` 변형 (phase 01 에서 `@custom-variant` 로 재정의됨) 으로 교체.

**범위 외**: shadcn ui 컴포넌트의 `hsl(var(--x))` → OKLCH 토큰 직접 사용 교체는 phase 03. globals.css 의 `[data-theme="dark"]` 토큰 정의는 phase 01 에서 완료.

**선행 의존**: phase 01 (globals.css 의 `@custom-variant dark` 등록 + `[data-theme="dark"]` 토큰 정의 완료)

---

## 작업 항목 (4)

### 1. `ThemeProvider` 호출부 — `attribute='data-theme'` 추가

```bash
# cwd: /Users/nhn/personal/fos-accountbook
grep -rn "ThemeProvider\|next-themes" src/app src/components 2>/dev/null
```

ThemeProvider 호출 위치를 찾아 `attribute="data-theme"` props 추가. 일반적으로 `src/app/providers.tsx` 또는 `src/app/(authenticated)/providers.tsx`.

```tsx
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

`enableSystem` / `defaultTheme` / `disableTransitionOnChange` 등 기존 props 는 보존. 추가만.

### 2. `.dark` 클래스 의존 코드 — `dark:` Tailwind 유틸 또는 `[data-theme="dark"]` 셀렉터로 교체

```bash
# cwd: /Users/nhn/personal/fos-accountbook
grep -rln '\.dark\b\|className=".*\bdark\b' src/components src/app | grep -v ".test.tsx"
```

확인된 파일 (phase 작성 시 실측):
- `src/components/ui/tabs.tsx`, `badge.tsx`, `button.tsx`, `select.tsx`, `input.tsx` — 이들은 `dark:` Tailwind 변형 사용 (`dark:bg-...`). phase 01 에서 `@custom-variant dark` 가 등록되었으므로 **추가 변경 불필요**. 동작 자동 전환.
- 그 외 직접 `.dark` 클래스를 다는 코드가 있으면 (drag → drop 토글 등) `data-theme` 으로 교체.

기존 grep 결과 ui/ 5개 파일은 `dark:` 변형 사용. phase 02 에서는 이들 동작이 그대로 유지되는지 검증만 필요. 실제 코드 변경은 ThemeProvider props 한 줄.

### 3. Sonner toast — `next-themes` API 호환 점검

`src/components/ui/sonner.tsx` 가 `useTheme()` 의 `theme` 값을 sonner 의 `theme` prop 으로 전달. `attribute` 변경은 `theme` 반환값 (`"light" | "dark" | "system"`) 에 영향 없음 — 동작 그대로. 변경 없음, 검증만.

### 4. `data-theme` 속성 첫 페인트 노출 — `suppressHydrationWarning`

`<html>` 에 `suppressHydrationWarning` 이 이미 있으면 변경 없음. `next-themes` 는 attribute 변경 시 client-side 에서만 적용 → SSR 결과와 다름 → hydration warning 가능. `src/app/layout.tsx` 의 `<html>` 에 `suppressHydrationWarning` 보장.

```bash
grep -n "suppressHydrationWarning" src/app/layout.tsx   # >= 1 — 이미 있으면 작업 없음
```

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/app/providers.tsx` (또는 ThemeProvider 호출부) | `attribute="data-theme"` props 추가 |
| `src/app/layout.tsx` | `suppressHydrationWarning` 보장 (이미 있을 수 있음) |

`src/components/ui/*` 는 phase 02 에서 변경 없음 (`dark:` 변형이 phase 01 의 `@custom-variant` 로 자동 동작).

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/001-design-system-teal

pnpm lint
pnpm build
pnpm test --run

# ThemeProvider attribute 전환 확인
grep -rn 'attribute="data-theme"' src/app | wc -l   # >= 1
! grep -rnE 'attribute="class"' src/app             # exit 1 — class attribute 사용 0건

# suppressHydrationWarning 확인
grep -n 'suppressHydrationWarning' src/app/layout.tsx | wc -l   # >= 1
```

수동 smoke (`pnpm dev`):
- 메인 페이지 → DevTools 의 `<html>` 에 `data-theme="light"` 또는 `"dark"` 또는 `"system"` 속성 확인
- 테마 토글 (Header 의 토글 또는 OS 모드 변경) → `data-theme` 속성이 즉시 변경되고 색이 전환됨
- shadcn 컴포넌트 (button, input, card 등) 가 light/dark 양쪽에서 정상 색 표시
- sonner toast (`/expenses` 에서 등록 시도 → 에러/성공 toast) 가 dark 모드에서 어두운 배경으로 렌더

## 의도 메모 (왜)

- `attribute='class'` 유지하면 handoff 토큰의 `[data-theme="dark"]` 셀렉터를 일괄 `.dark` 로 치환해야 함 — handoff 와 매번 vs 비교가 필요해짐. attribute 한 줄 바꾸는 비용이 훨씬 작다.
- `dark:` Tailwind 변형이 동작하는 이유: phase 01 의 `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` 정의 때문. phase 02 가 phase 01 에 의존하는 핵심 포인트.
- `suppressHydrationWarning` 누락 시 next-themes 가 client 에서 attribute 를 주입할 때 React 19 의 hydration mismatch 경고 발생. 기존 layout 에 이미 있을 가능성이 높지만 명시 검증.
