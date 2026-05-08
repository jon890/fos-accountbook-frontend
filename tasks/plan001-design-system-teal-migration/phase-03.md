# Phase 03 — Pretendard + Inter 폰트 도입 (npm 패키지 + next/font/local)

**Model**: sonnet
**Status**: pending

---

## 목표

`src/app/layout.tsx` 의 Geist + Geist_Mono 폰트 로더를 `next/font/local` 의 Pretendard Variable + Inter Variable 로 교체. woff2 자산은 `pretendard` / `inter-ui` npm 패키지에서 직접 참조 (브랜치 HEAD `curl` 사용 금지 — 빌드 결정성 확보). `--font-sans` / `--font-num` CSS 변수가 실제 로드된 폰트를 가리키도록 연결.

phase 01 에서 globals.css 의 `--font-sans` / `--font-num` 정의는 의도적으로 생략됨 — `next/font/local` 의 `variable` 옵션이 단일 소스 (자동 stack 생성 포함).

**선행 의존**: phase 01 (globals.css `@layer base` 의 `font-family: var(--font-sans)` + `.num` 유틸)

---

## 작업 항목 (4)

### 1. npm 패키지 추가

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001
pnpm add pretendard inter-ui
```

`pretendard@1.3.9` (Variable woff2 포함 — `node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2`).
`inter-ui@4.1.1` (`node_modules/inter-ui/variable/InterVariable.woff2`).

`pnpm-lock.yaml` 갱신 — 결정적 버전 lock 으로 빌드 재현성 확보. 브랜치 HEAD `curl` 다운로드는 사용하지 않음.

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
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "45 920",
  display: "swap",
});

const inter = localFont({
  src: "../../node_modules/inter-ui/variable/InterVariable.woff2",
  variable: "--font-num",
  weight: "100 900",
  display: "swap",
});
```

`<body>` 의 `className` 에서 `${geistSans.variable} ${geistMono.variable}` → `${pretendard.variable} ${inter.variable}` 교체. phase 02 에서 추가된 `bg-bg min-h-screen text-fg antialiased` 부분은 유지.

```bash
# Geist 잔재 0건
grep -rn "geistSans\|geistMono\|--font-geist\|next/font/google" src/   # exit 1
```

### 3. 빌드 — woff2 자산 번들 확인

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001
pnpm build
```

Next.js 빌드가 `node_modules` 안의 woff2 를 자동으로 `.next/static/media/` 에 복사하여 hash 처리. 빌드 산출물에서 woff2 가 검출되면 OK.

```bash
find .next/static/media -name '*.woff2' 2>/dev/null | wc -l   # >= 2 (Pretendard + Inter)
```

### 4. 시각 + 폰트 변수 검증

수동 smoke (`pnpm dev`):
- 메인 페이지 → 한글 본문이 Pretendard 로 렌더 (DevTools Network → Fonts 탭에서 `PretendardVariable...woff2` 로드 확인)
- 금액 (`<span className="num">` 또는 `data-num` 속성 요소) → Inter + tabular-nums (숫자 폭 동일)
- light/dark 모드 토글 → 폰트 변경 없음 (정상)
- DevTools Computed → `<body>` 의 `--font-sans` 가 Pretendard 자동 stack, `--font-num` 이 Inter 자동 stack

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/app/layout.tsx` | next/font/google → next/font/local. variable 명 교체 |
| `package.json` / `pnpm-lock.yaml` | `pretendard` + `inter-ui` 의존 추가 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001
pnpm lint
pnpm build
pnpm test --run

# Geist 잔재 0건
! grep -rnE 'geistSans|geistMono|--font-geist|next/font/google' src/   # exit 1

# Pretendard / Inter 로딩 확인
grep -n 'PretendardVariable.woff2' src/app/layout.tsx | wc -l   # = 1
grep -n 'InterVariable.woff2' src/app/layout.tsx | wc -l        # = 1
grep -n 'next/font/local' src/app/layout.tsx | wc -l            # = 1

# npm 패키지 lock
grep -E '"pretendard":|"inter-ui":' package.json | wc -l        # = 2
test -f node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2 && echo "Pretendard OK"
test -f node_modules/inter-ui/variable/InterVariable.woff2 && echo "Inter OK"

# 빌드 산출물에 woff2 번들
find .next/static/media -name '*.woff2' 2>/dev/null | wc -l    # >= 2
```

## 의도 메모 (왜)

- **npm 패키지 사용 (pretendard / inter-ui)** — `pnpm-lock.yaml` 의 integrity hash 가 woff2 hash 까지 lock 하므로 빌드 결정성 확보. `curl ...github.com/.../raw/main/...` 는 브랜치 HEAD 참조라 실행 시점에 따라 woff2 hash 가 달라짐 (재현성 깨짐).
- **public/fonts/ 복사 안 함** — `next/font/local` 의 `src` 가 `node_modules` 경로를 직접 받음. Next.js 가 빌드 시 hash 처리 + `.next/static/media/` 복사 자동 수행. public/ 복사는 추가 단계 + 동기화 부담.
- **`--font-sans` 단일 소스** — `next/font/local` 의 `variable: "--font-sans"` 가 폰트명 + 자동 stack 모두 생성. phase 01 에서 globals.css 의 `--font-sans` 정의를 생략했으므로 우선순위 혼동 없음.
- **`weight: "45 920"`** — Pretendard Variable 의 weight 범위. `100 900` (Inter) 와 마찬가지로 variable axis 전 구간 사용 가능. 페이지별 weight 사용은 plan002~005 에서 결정.
- **Inter 한글 글리프 부재** — 의도된 latin digit 전용. 한글은 Pretendard stack 으로 떨어지도록 `--font-num` 의 자동 stack 이 처리.
