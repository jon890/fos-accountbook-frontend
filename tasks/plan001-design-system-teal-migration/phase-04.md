# Phase 04 — Pretendard Variable + Inter 폰트 도입

**Model**: sonnet
**Status**: pending

---

## 목표

`src/app/layout.tsx` 의 Geist + Geist_Mono 폰트 로더를 `next/font/local` 의 Pretendard Variable + Inter 로 교체. `--font-sans` / `--font-num` CSS 변수가 실제 로드된 폰트를 가리키도록 연결. `body` 의 `className` 도 신규 폰트 변수 참조.

phase 01 에서 `@theme` 블록에 `--font-sans` / `--font-num` family stack 은 정의됨 — phase 04 는 실제 woff2 자산 로드 + variable 연결.

**범위 외**: 페이지별 폰트 크기/weight 시각 조정은 plan002~005. phase 04 는 폰트 family 교체만.

**선행 의존**: phase 01 (globals.css 의 `--font-sans` / `--font-num` family stack 정의)

---

## 작업 항목 (4)

### 1. Pretendard Variable + Inter Variable woff2 다운로드 → `public/fonts/`

```bash
# cwd: /Users/nhn/personal/fos-accountbook
mkdir -p public/fonts

# Pretendard Variable (orioncactus official)
curl -sL "https://github.com/orioncactus/pretendard/raw/main/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2" \
  -o public/fonts/PretendardVariable.woff2

# Inter Variable (rsms official)
curl -sL "https://github.com/rsms/inter/raw/master/docs/font-files/InterVariable.woff2" \
  -o public/fonts/InterVariable.woff2

ls -la public/fonts/
# PretendardVariable.woff2 (~2MB), InterVariable.woff2 (~340KB)
```

URL 응답 실패 시 phase 차단 (`PHASE_BLOCKED: font asset fetch failed`). 대안 검토 후 별도 plan.

### 2. `src/app/layout.tsx` — `next/font/local` 로 교체

기존:
```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

신규:
```tsx
import localFont from "next/font/local";

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
  display: "swap",
});

const inter = localFont({
  src: "../../public/fonts/InterVariable.woff2",
  variable: "--font-num",
  weight: "100 900",
  display: "swap",
});
```

`<html>` 또는 `<body>` 의 `className` 에 `${pretendard.variable} ${inter.variable}` 을 부여. 기존 `${geistSans.variable} ${geistMono.variable}` 자리 그대로 교체.

```bash
# 사용처 grep — geist 잔재 0건
grep -rn "geistSans\|geistMono\|--font-geist" src/   # exit 1 이어야 함
```

만약 다른 컴포넌트에서 `font-mono` 클래스를 통해 Geist Mono 를 의도하는 곳이 있으면, `font-mono` 가 Tailwind 의 기본 mono stack 으로 동작하므로 phase 04 에서는 추가 작업 없음 — `--font-mono` family stack (JetBrains Mono fallback) 이 phase 01 에서 정의됨.

### 3. `globals.css` 의 base 레이어 — 명시적 variable 연결 확인

phase 01 에서 정의된:
```css
@theme {
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, system-ui, sans-serif;
  --font-num: "Inter", "Pretendard Variable", system-ui, sans-serif;
}
```

이 stack 의 첫 family 명 (`Pretendard Variable`, `Inter`) 이 `next/font/local` 의 `variable: "--font-sans"` / `--font-num` 이 생성하는 CSS 변수와 매칭되는지 검증. `next/font/local` 은 `variable` 옵션 명으로 CSS 변수를 만들고 그 안에 자동 fallback stack 을 넣음 — 즉 `--font-sans` 가 두 곳에서 정의되면 next/font 의 정의가 후순위로 덮어씌움.

해결: phase 04 에서는 `next/font/local` 의 `variable` 을 다른 이름 (`--next-font-sans`, `--next-font-num`) 으로 바꾸고, globals.css 의 `--font-sans` stack 의 첫 family 자리에 `var(--next-font-sans)` 를 두는 패턴 — 또는 더 단순하게 `next/font/local` 의 variable 을 `--font-sans` 로 두고 globals.css `@theme` 의 `--font-sans` 정의를 제거 (next/font 가 단일 소스). **후자 채택**.

→ 작업: phase 01 에서 정의한 `@theme` 의 `--font-sans` / `--font-num` 정의를 삭제. `next/font/local` 의 variable 옵션이 단일 소스가 되도록.

`--font-mono` (JetBrains Mono 등) 는 next/font 로 로드하지 않으므로 globals.css 정의 유지.

### 4. body className + 폰트 적용 검증

`<body className={cn(pretendard.variable, inter.variable, "antialiased")}>` 형태. tailwind-merge 의 `cn` 또는 직접 template literal. 기존 layout.tsx 의 `${geistSans.variable} ${geistMono.variable}` 와 동일 구조 유지.

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/app/layout.tsx` | next/font/google → next/font/local. variable 명 교체 |
| `public/fonts/PretendardVariable.woff2` | 신규 (~2MB) |
| `public/fonts/InterVariable.woff2` | 신규 (~340KB) |
| `src/app/globals.css` | `@theme` 의 `--font-sans` / `--font-num` 정의 제거 (next/font 단일 소스화). `--font-mono` 만 유지 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/001-design-system-teal

pnpm lint
pnpm build
pnpm test --run

# Geist 잔재 0건
! grep -rnE 'geistSans|geistMono|--font-geist|next/font/google' src/   # exit 1

# Pretendard / Inter 로딩 확인
grep -n 'PretendardVariable.woff2' src/app/layout.tsx | wc -l   # = 1
grep -n 'InterVariable.woff2' src/app/layout.tsx | wc -l        # = 1
grep -n 'next/font/local' src/app/layout.tsx | wc -l            # = 1

# 폰트 자산 존재
test -f public/fonts/PretendardVariable.woff2 && echo OK
test -f public/fonts/InterVariable.woff2 && echo OK

# globals.css 의 @theme 가 --font-sans 정의 안 함 (next/font 단일 소스)
! grep -nE '@theme[^}]*--font-sans:' src/app/globals.css
# (multiline grep 어려우면 awk 또는 sed 로 @theme 블록만 추출)
```

수동 smoke (`pnpm dev`):
- 메인 페이지 → 한글 본문이 Pretendard 로 렌더 (DevTools Network → Fonts 탭에서 PretendardVariable.woff2 로드 확인)
- 금액 (`<span className="num">`) 또는 `data-num` 요소 → Inter + tabular-nums (숫자 폭 동일)
- light/dark 모드 토글 → 폰트 변경 없음 (정상)
- Lighthouse 또는 Network 탭 → CLS 0 또는 매우 낮음 (`display: swap` + woff2)

## 의도 메모 (왜)

- `next/font/google` (Geist) 는 빌드 시 Google CDN 에서 다운 → 빌드 결정성 / 도메인 의존. self-host woff2 로 변경하면 도메인 의존 0 + repo lock-in.
- `--font-sans` 정의를 `@theme` 와 `next/font` 둘 다에 두면 우선순위 혼동 위험. next/font 의 자동 stack 생성 기능이 fallback 까지 책임 → 단일 소스화가 단순.
- `_shared/common-pitfalls.md § 3-13` (npm dep 제거 전 css/config grep) 의 역방향 — 신규 woff2 자산 추가는 globals.css 의 family stack 정의와 호환되어야 함. phase 04 작업 후 시각 검증 필수.
- 폰트 자산 ~2.3MB 추가는 부담스럽지만 (a) Variable 폰트 1개로 weight 100~900 모두 커버, (b) `display: swap` 으로 FOUT 짧음, (c) 한 번 캐싱 후 재방문 시 0KB. 한국 사용자 가독성 trade-off 가치.
