# Phase 01 — globals.css 에 income-fg / warning-fg 토큰 추가

**Model**: sonnet
**Status**: pending
**Goal**: `--color-income-fg` 와 `--color-warning-fg` 토큰을 `src/app/globals.css` 에 추가. ADR-F23 4 토큰 (brand/expense/income/warning) 완전 정착의 기반.

## Context (자기완결)

- 현재 `src/app/globals.css` L19-24 의 semantic 토큰 영역:
  ```css
  --color-income:  oklch(0.610 0.150 152);
  --color-expense: oklch(0.620 0.180 25);
  --color-warning: oklch(0.760 0.150 78);
  --color-expense-fg: oklch(0.985 0.003 230);
  --color-brand-fg: oklch(0.985 0.003 188);
  ```
- 누락: `--color-income-fg` / `--color-warning-fg`
- ADR-F23 원칙: near-white (`oklch(0.985 ...)`) 값 + hue 는 배경 색과 일치 (시맨틱 일관)

## 작업 항목

### 1. globals.css 토큰 2 종 추가

L23-24 (expense-fg / brand-fg) 옆에 income-fg / warning-fg 추가:

```css
/* ── semantic ───────────────────────────────── */
--color-income:  oklch(0.610 0.150 152);
--color-expense: oklch(0.620 0.180 25);
--color-warning: oklch(0.760 0.150 78);
--color-expense-fg: oklch(0.985 0.003 25);   /* expense 위 near-white. hue=25 */
--color-income-fg:  oklch(0.985 0.003 152);  /* income 위 near-white. hue=152 (income) */
--color-warning-fg: oklch(0.985 0.003 78);   /* warning 위 near-white. hue=78 (warning) */
--color-brand-fg:   oklch(0.985 0.003 188);  /* brand-500 위 near-white. hue=188 (brand) */
```

기존 `--color-expense-fg: oklch(0.985 0.003 230)` 의 hue=230 (cool gray) 도 hue=25 (expense) 로 통일 — 시맨틱 일관성. 단 값 차이가 미세 (chroma 0.003) 이므로 시각 영향 거의 없음 + ADR-F23 의 "hue 는 배경 색과 일치" 원칙 명시화.

### 2. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan022-gradient-fg-tokens

pnpm lint
pnpm tsc --noEmit
pnpm build

# 4 토큰 정의 확인
grep -nE '--color-(brand|expense|income|warning)-fg:' src/app/globals.css | wc -l   # == 4
```

수동 smoke:
- 빌드 후 색 토큰 누락 에러 없음
- 기존 `text-expense-fg` (NotificationBell Badge) 회귀 없음 — chroma 0.003 차이는 시각 무영향

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/globals.css` | 2 토큰 추가 + expense-fg hue 조정 (230 → 25) |

## Out of Scope

- 51 호출처 마이그레이션 — phase-02
- 다른 토큰 (cat-*-fg, surface) — 본 plan 범위 아님

## Risks

| 리스크 | 완화 |
|---|---|
| `oklch(0.985 0.003 25)` 의 hue=25 가 기존 `oklch(0.985 0.003 230)` 와 미세한 시각 차이 | chroma=0.003 매우 낮음 → 인지 불가. 빌드 후 NotificationBell smoke 로 확인 |
| Tailwind v4 가 `text-income-fg` / `text-warning-fg` arbitrary class 인식 못 함 | `@theme` 블록 안 `--color-*` 정의는 Tailwind v4 가 자동 utility 생성. 미작동 시 `text-[var(--color-income-fg)]` 폴백 |
