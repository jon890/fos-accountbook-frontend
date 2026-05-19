# Phase 01 — sonner Toaster 토큰 마이그레이션 + richColors OFF + 타입별 매핑

**Model**: sonnet
**Status**: pending
**Goal**: `src/components/ui/sonner.tsx` 의 legacy popover 토큰 제거 + `src/app/providers.tsx` 의 richColors OFF + toastOptions classNames 를 brand/expense/warning 직접 매핑. plan001 Teal 시스템 (ADR-F24) 과 일관.

## Context (자기완결)

- 현재 `src/components/ui/sonner.tsx` (25 줄):
  - `--normal-bg: var(--popover)` / `--normal-text: var(--popover-foreground)` / `--normal-border: var(--border)` — shadcn v3 legacy 토큰
- 현재 `src/app/providers.tsx`:
  - L13: `richColors` ON → sonner 자동 success(green h≈140) / error(red) / warning(amber) / info(blue) → Teal 시스템 + income (h=152) 와 충돌
  - L18-20: `bg-popover` / `text-popover-foreground` / `text-muted-foreground` — legacy
- OKLCH 토큰 (globals.css):
  - `--color-brand-{50..900}` (Teal h=188), `--color-expense`, `--color-warning`, `--color-income`
  - `--color-bg-elev`, `--color-border`, `--color-fg`, `--color-fg-muted`
- toast 사용처 ≥ 20곳 — **호출 코드 변경 없음** (컴포넌트만 수정)

## 작업 항목

### 1. `src/components/ui/sonner.tsx` 토큰 마이그레이션

```tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--color-bg-elev)",
          "--normal-text": "var(--color-fg)",
          "--normal-border": "var(--color-border)",
          "--success-bg": "var(--color-bg-elev)",
          "--success-text": "var(--color-fg)",
          "--success-border": "var(--color-brand-500)",
          "--error-bg": "var(--color-bg-elev)",
          "--error-text": "var(--color-fg)",
          "--error-border": "var(--color-expense)",
          "--warning-bg": "var(--color-bg-elev)",
          "--warning-text": "var(--color-fg)",
          "--warning-border": "var(--color-warning)",
          "--info-bg": "var(--color-bg-elev)",
          "--info-text": "var(--color-fg)",
          "--info-border": "var(--color-brand-400)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
```

토큰만 교체. 구조 유지. CSS variable 명명은 sonner 가 인식하는 표준 (`--{type}-bg/text/border`) — `richColors` 없이도 sonner 가 toast type 별 본 변수 사용.

### 2. `src/app/providers.tsx` richColors OFF + classNames 갱신

```tsx
"use client";

import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
      <SessionProvider>
        {children}
        <Toaster
          position="top-center"
          expand={true}
          closeButton
          toastOptions={{
            classNames: {
              toast: "bg-bg-elev border border-border shadow-lg text-fg",
              title: "text-fg font-medium",
              description: "text-fg-muted",
              actionButton: "bg-brand-500 text-white",
              cancelButton: "bg-bg-muted text-fg-muted",
            },
            style: {
              zIndex: 100,
            },
          }}
          style={{
            zIndex: 100,
          }}
        />
      </SessionProvider>
    </ThemeProvider>
  );
}
```

변경:
- L16 `richColors` 제거
- L19-21 `bg-popover` → `bg-bg-elev`, `text-popover-foreground` → `text-fg`, `text-muted-foreground` → `text-fg-muted`
- `actionButton` / `cancelButton` classNames 추가 (Teal brand 액션 / 중립 cancel)
- 타입별 border 색은 sonner 가 sonner.tsx 의 `--{type}-border` CSS 변수에서 자동 적용 → richColors 없이도 success/error/warning/info 좌측 border tint 유지

### 3. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan020-toast-alertdialog-polish

pnpm lint
pnpm tsc --noEmit
pnpm build

# legacy 토큰 0 (sonner)
! grep -nE '--popover|popover-foreground|text-muted-foreground' \
  src/components/ui/sonner.tsx src/app/providers.tsx

# richColors OFF
! grep -n 'richColors' src/app/providers.tsx

# 신 토큰 사용
grep -nE 'color-bg-elev|color-fg|color-border|color-brand-500|color-expense|color-warning' \
  src/components/ui/sonner.tsx | wc -l   # >= 6

grep -nE 'bg-bg-elev|text-fg|text-fg-muted|border-border' \
  src/app/providers.tsx | wc -l   # >= 4
```

수동 smoke:
- 카테고리 생성 → success toast → 좌측 Teal border + 본문 텍스트 가독성
- 카테고리 생성 실패 (중복 이름) → error toast → 좌측 expense red border
- Dark mode 토글 → toast 본문 bg/text 자연 전환
- toast.warning / toast.info 가 사용처에 있으면 호출 시 톤 확인

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/ui/sonner.tsx` | legacy 토큰 → OKLCH, 타입별 border 변수 추가 |
| `src/app/providers.tsx` | richColors OFF + classNames OKLCH 토큰 |

## Out of Scope

- toast 호출처 (`toast.success(...)`) 의 메시지/문구 — 변경 없음
- sonner 패키지 업그레이드 — 현재 버전 유지
- toast 위치 (top-center) — 변경 없음

## Risks

| 리스크 | 완화 |
|---|---|
| `--{type}-border` CSS 변수가 sonner 가 미인식 → 타입별 색 안 보임 | sonner v1.x 표준 변수 — 실패 시 `data-[type=success]:border-brand-500` 형태로 Tailwind arbitrary selector 폴백 |
| `actionButton` classNames 가 sonner 내부 div 시그니처와 불일치 | toastOptions.classNames API 표준 — 미작동 시 phase-03 검증에서 발견되면 제거 가능 (action 버튼 사용 toast 없음) |
| Dark mode 에서 bg-bg-elev 가 너무 어두워 toast 시인성 ↓ | smoke 수동 확인. 필요 시 `bg-bg-elev` → `bg-neutral-900/95` 등 미세 조정 |
