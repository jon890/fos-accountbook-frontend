# Phase 04 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: completed

---

## 목표

phase 01~03 의 산출물을 통합 검증하고, legacy 잔재 (HSL 채널, Geist, .dark 클래스, hex/rgb 직접 색) 가 0건임을 명령으로 증명. `tasks/plan001-design-system-teal-migration/index.json` 의 `status` 를 `completed` 로 마킹.

**범위 외**: 페이지 시각 리디자인 (plan002~005). phase 04 는 빌드/lint/test + grep 검증 + 마킹만.

---

## 작업 항목 (4)

### 1. 빌드 / lint / test 통과 확인

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001
pnpm lint        # 0 errors
pnpm build       # exit 0
pnpm test --run  # 0 fail
```

각 결과 exit 0 여야 함. 에러 시 phase 차단 (`PHASE_BLOCKED: build failed`) — 어느 phase 산출물이 회귀를 만든지 식별 후 보고.

### 2. Legacy 잔재 grep — 4종 패턴 0건

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001

# (a) hsl(var(--)) 패턴 0건 — phase 01 단일 소스화로 globals.css 외부 잔재 없음
! grep -rnE 'hsl\(var\(--' src/

# (b) Geist 폰트 잔재 0건 — phase 03 에서 제거
! grep -rnE 'geistSans|geistMono|--font-geist|next/font/google' src/

# (c) .dark { ... } 셀렉터 정의 0건 (Tailwind dark: 변형은 허용 — @custom-variant 가 data-theme 매핑)
! grep -nE '^\s*\.dark\s*\{' src/app/globals.css

# (d) layout body 하드코딩 0건 — phase 02 에서 제거
! grep -n 'bg-gray-50' src/app/layout.tsx

# (e) hex/rgb 직접 색 — globals.css 외부에서 0건 (cn / inline style 모두 토큰 사용)
# 의도된 예외: rgba(255,255,255,...) (white film), .test.tsx
grep -rnE '#[0-9a-fA-F]{6}\b|rgb\(|hsl\(' src/components/ src/app/ \
  | grep -v 'globals.css' \
  | grep -vE 'rgba\(255,\s*255,\s*255' \
  | grep -vE '\.test\.tsx?:'
# 결과 라인 수가 phase 시작 시 수치 대비 감소했는지 확인 (목표: 0 또는 의도된 예외만)
```

(e) 의 출력 라인이 0이 아니면 각 위치 확인 후 토큰 교체 가능성 판단. 의도된 예외 (`gradient-card-overlay` 등 white film) 는 commit message 에 명시.

### 3. OKLCH 토큰 / data-theme / 폰트 — 등록 확인

```bash
# brand 스케일 10단계 + neutral 12단계 + semantic 3개 등록
grep -c '^\s*--color-brand-' src/app/globals.css      # = 10
grep -c '^\s*--color-neutral-' src/app/globals.css    # = 12
grep -E '^\s*--color-(income|expense|warning):' src/app/globals.css | wc -l  # = 3

# data-theme 셀렉터 + custom-variant
grep -n '@custom-variant dark' src/app/globals.css | wc -l   # = 1
grep -nE '\[data-theme="dark"\]' src/app/globals.css | wc -l # >= 1

# next-themes attribute + suppressHydrationWarning
grep -rn 'attribute="data-theme"' src/ | wc -l                # >= 1
grep -n 'suppressHydrationWarning' src/app/layout.tsx | wc -l # >= 1

# 폰트 npm 패키지 + 로더
grep -E '"pretendard":|"inter-ui":' package.json | wc -l      # = 2
test -f node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2 && echo "Pretendard OK"
test -f node_modules/inter-ui/variable/InterVariable.woff2 && echo "Inter OK"
grep -n 'next/font/local' src/app/layout.tsx | wc -l          # = 1

# 단일 소스 — :root brand/neutral 토큰 참조
grep -nE '--primary:\s*var\(--color-brand-' src/app/globals.css | wc -l   # >= 1
```

모든 결과가 기대값과 일치해야 함.

### 4. `index.json` + 모든 phase status → `completed` 마킹

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan001

# index.json 의 모든 status 를 completed 로
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan001-design-system-teal-migration/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan001-design-system-teal-migration/index.json

# 검증: 1 (top-level) + 4 (phases) = 5 개
grep -c '"status": "completed"' tasks/plan001-design-system-teal-migration/index.json
# = 5
```

phase-04.md (본 파일) 의 `**Status**: pending` 도 `completed` 로 갱신:
```bash
sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan001-design-system-teal-migration/phase-04.md
grep -n '^\*\*Status\*\*:' tasks/plan001-design-system-teal-migration/phase-04.md
# = `**Status**: completed`
```

phase-01~03.md 의 Status 는 build-with-teams 가 phase 실행 시 자동 갱신 — phase-04 에서는 마지막 phase 본인만 갱신.

이 phase 의 모든 산출물 (index.json status 변경 + phase-04.md status 변경 + 검증 grep 출력) 은 **단일 commit** 으로 묶음. commit 후 phase 종료.

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `tasks/plan001-design-system-teal-migration/index.json` | 모든 status 를 `completed` 로 |
| `tasks/plan001-design-system-teal-migration/phase-04.md` | 본 파일 status 를 `completed` 로 |

## 검증

위 작업 항목 1~3 의 각 grep / 빌드 명령이 모두 통과.

```bash
# 최종 확인
grep -c '"status": "completed"' tasks/plan001-design-system-teal-migration/index.json   # = 5
grep '^\*\*Status\*\*:' tasks/plan001-design-system-teal-migration/phase-04.md          # = "**Status**: completed"
```

## 의도 메모 (왜)

- 검증 phase 분리: 통합 grep 이 phase 01~03 모든 산출물에 의존. 동일 phase 자기 검증은 회귀 차단력 약함. team-lead 입장에서 별도 phase 가 보고 단위로 명확.
- `_shared/common-pitfalls.md § 1-8` (마지막 phase 에 index.json `completed` 마킹 명시) 패턴 준수. 누락 시 main 직접 수정 유혹 발생.
- haiku 라우팅: 본 phase 는 grep + sed + status 변경. 기계적 작업이라 sonnet 불필요.
