# Phase 05 — 통합 검증 + legacy 잔재 grep + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: phase 01~04 산출물 통합 검증, 4 페이지 + 카테고리 다이얼로그 의 하드코딩 색 잔재 0건 증명, `index.json` status `completed` 마킹.

## Context (자기완결)

- 검증 대상: Settings (1) + Categories list/dialog stale fix (2) + FamiliesSelect (3) + FamiliesCreate (4).
- legacy 잔재 후보: `text-gray-*`, `hover:bg-gray-*`, `bg-blue-*`, `text-blue-*`, `border-blue-*`, `glass-card`, `app-background` (본 페이지 외 사용처 0 시 globals.css 정리).
- `_shared/common-pitfalls.md § 1-8` 준수 — 마지막 phase 본인 status 도 직접 갱신.

## 작업 항목

### 1. 빌드 / lint / type / test 통과

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/010-domain-pages-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run
```

각 exit 0. 실패 시 `PHASE_BLOCKED: build failed` + 어느 phase 가 회귀를 만들었는지 식별.

### 2. 4 페이지 하드코딩 색 잔재 0건

```bash
# Settings / Categories / Families 의 하드코딩 잔재
! grep -rnE 'text-gray-[3-9]|hover:bg-gray-[5-9]|bg-gray-[3-9]|text-blue-[3-9]|bg-blue-[3-9]|border-blue-' \
  src/app/\(authenticated\)/settings/ \
  src/app/\(authenticated\)/categories/ \
  src/app/\(authenticated\)/families/ \
  src/components/families/
```

`!` 가 exit 1 — 잔재 0 확인.

### 3. 핵심 신 토큰 등록 확인

```bash
# SettingsCard helper
test -f src/components/layout/SettingsCard.tsx

# Settings 페이지의 신 토큰
grep -nE 'text-fg|text-fg-muted|bg-brand-50|md:grid-cols-2' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx | wc -l   # >= 4

# Category dialog stale fix 패턴 (open ? <Body /> 분리)
grep -n 'CategoryDialogBody' src/app/\(authenticated\)/categories/_components/AddCategoryDialog.tsx | wc -l   # >= 1
grep -n 'CategoryDialogBody' src/app/\(authenticated\)/categories/_components/EditCategoryDialog.tsx | wc -l   # >= 1

# 색 팔레트 OKLCH 8개
grep -cE 'oklch\([0-9.]+ [0-9.]+ [0-9]+\)' \
  src/app/\(authenticated\)/categories/_components/AddCategoryDialog.tsx   # >= 8

# FamilySelector 멤버 avatar 겹침
grep -n '\-ml-2.*ring-' src/components/families/FamilySelector.tsx | wc -l   # >= 1

# FamiliesCreate gradient-family + brand 토큰
grep -nE 'gradient-family|bg-brand-500|bg-brand-50' \
  src/app/\(authenticated\)/families/create/page.tsx | wc -l   # >= 3
```

### 4. glass-card / app-background 사용처 점검

phase-04 에서 결정한 `app-background` / `glass-card` 클래스의 다른 페이지 사용 여부:

```bash
grep -rn 'app-background\|glass-card' src/ 2>/dev/null
```

- 본 plan 의 `families/create/page.tsx` 외 사용처 0 → globals.css 에서 두 클래스 정의 제거 (phase-04 작업항목 1 의 후속)
- 사용처 있으면 본 plan 안에서 정의 유지, 별도 plan 으로 처리

### 5. `index.json` + 본 phase status → `completed`

```bash
sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/plan010-domain-pages-redesign/index.json
sed -i '' 's/"status": "in_progress"/"status": "completed"/g' tasks/plan010-domain-pages-redesign/index.json
grep -c '"status": "completed"' tasks/plan010-domain-pages-redesign/index.json   # = 6 (top + 5 phases)

sed -i '' 's/^\*\*Status\*\*: pending$/**Status**: completed/' tasks/plan010-domain-pages-redesign/phase-05.md
grep '^\*\*Status\*\*:' tasks/plan010-domain-pages-redesign/phase-05.md   # = "**Status**: completed"
```

이 phase 의 모든 산출물 (status 변경 + 검증 grep 출력 + globals.css 정리 결정) 은 단일 commit 으로 묶음.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan010-domain-pages-redesign/index.json` | 모든 status `completed` |
| `tasks/plan010-domain-pages-redesign/phase-05.md` | 본 파일 status `completed` |
| `src/app/globals.css` | `app-background` / `glass-card` 정의 정리 (사용처 0 일 때) |

## Out of Scope

- /invite 페이지 디자인 — 별도 plan
- Settings 의 신규 섹션 (프로필 / 로그아웃) — handoff 외
- backend `category.color` schema 점검 결과에 따른 마이그레이션 — plan011+

## Risks

| 리스크 | 완화 |
|---|---|
| 검증 grep false positive (주석 내 문자열) | 라인 시작 앵커 + 정확한 토큰 |
| macOS BSD `sed -i ''` vs Linux | macOS 환경 가정 |
| globals.css 정리 시 다른 페이지 시각 회귀 | 작업항목 4 의 grep 결과 0 확인 후에만 제거. 의심 시 정의 유지 |
