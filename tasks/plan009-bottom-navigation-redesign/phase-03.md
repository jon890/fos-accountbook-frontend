# Phase 03 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: phase 01~02 산출물 통합 검증, hardcoded 색 잔재 0건 증명, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상: TabBar 토큰 (1) + FAB 신 디자인 + shadow 토큰 (2).
- legacy 잔재 후보: `text-blue-600`, `text-gray-500`, `gradient-primary` (BottomNav 한정), `bg-white/`, `border-gray-`.
- `_shared/common-pitfalls.md § 1-8` 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/009-bottom-navigation-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` + 회귀 phase 식별.

### 2. legacy 잔재 grep — 0건 증명

```bash
# BottomNavigation 의 하드코딩 색 + 구 gradient 잔재
! grep -nE 'text-blue-600|text-gray-500|gradient-primary|bg-white/[0-9]|border-gray-' src/components/layout/BottomNavigation.tsx

# hex/rgb 직접 (FAB shadow 토큰의 oklch alpha 는 globals.css 한정 — 컴포넌트 측 0건)
! grep -nE '#[0-9a-fA-F]{6}\b|hsl\(' src/components/layout/BottomNavigation.tsx
```

### 3. 신 디자인 등록 확인

```bash
# brand 토큰 사용
grep -nE 'text-brand-600|text-fg-subtle|bg-bg-elev|border-border|bg-brand-500|border-bg-elev' src/components/layout/BottomNavigation.tsx | wc -l   # >= 5

# FAB shadow 토큰
grep -n '\-\-shadow-fab' src/app/globals.css | wc -l   # >= 1
grep -n 'shadow-fab' src/components/layout/BottomNavigation.tsx | wc -l   # >= 1

# icon strokeWidth 분기 (활성/비활성)
grep -n 'strokeWidth' src/components/layout/BottomNavigation.tsx | wc -l   # >= 2 (NavButton + FAB)
```

### 4. AddExpenseDialog 진입점 보존

```bash
# FAB 클릭 → setIsExpenseDialogOpen(true) 흐름 유지
grep -n 'setIsExpenseDialogOpen' src/components/layout/BottomNavigation.tsx | wc -l   # >= 1
grep -n 'AddExpenseDialog' src/components/layout/BottomNavigation.tsx | wc -l   # >= 2 (import + 사용)
```

### 5. `index.json` + 본 phase status → `completed`

```bash
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan009-bottom-navigation-redesign/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan009-bottom-navigation-redesign/index.json
grep -c '"status": "completed"' tasks/plan009-bottom-navigation-redesign/index.json   # = 4 (top + 3 phases)

sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan009-bottom-navigation-redesign/phase-03.md
grep '^\*\*Status\*\*:' tasks/plan009-bottom-navigation-redesign/phase-03.md   # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan009-bottom-navigation-redesign/index.json` | 모든 status `completed` |
| `tasks/plan009-bottom-navigation-redesign/phase-03.md` | 본 파일 status `completed` |

## Out of Scope

- FAB tap animation / haptic feedback — 후속 plan
- 데스크톱 네비게이션 (현재 BottomNav 는 모든 viewport 공통 — handoff 데스크톱은 별도 `DesktopShell` 사이드바. plan010+ 검토)
- 신 메뉴 추가 (가족 초대 등) — 별도 plan

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep false positive (주석 내 문자열) | 라인 시작 앵커 + 정확한 토큰 |
| macOS BSD `sed -i ''` vs Linux | macOS 환경 가정 |
| 데스크톱 viewport 에서 BottomNav 가 어색 (handoff 는 sidebar 권장) | plan009 범위 외 — 데스크톱 sidebar 도입은 plan010+ 별도 검토 |
