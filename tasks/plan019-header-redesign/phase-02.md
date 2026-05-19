# Phase 02 — 통합 검증 + 8단계 체크리스트 + completed

**Model**: haiku
**Status**: pending
**Goal**: plan019 phase 01 결과 통합 검증. legacy 잔재 0 확인. index.json completed 마킹.

## 작업 항목

### 1. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan019

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

테스트는 phase-01 에서 mock 갱신 완료된 상태. 본 phase 는 통과 확인만.

### 2. legacy 잔재 0 + ADR-F23 최종

```bash
# Header + FamilySelector 영역 legacy 토큰 0 (bg-gray-100 포함)
! grep -rnE 'bg-white/|border-gray-|from-gray-|to-gray-|gradient-primary|ring-blue-|text-muted-foreground|bg-gray-100' \
  src/components/layout/Header.tsx \
  src/components/families/FamilySelectorDropdown.tsx \
  src/components/families/FamilySelectorList.tsx 2>/dev/null

# variant="destructive" 0
! grep -rn 'variant="destructive"' src/components/layout/Header.tsx

# ADR-F23 — text-white/text-black 0
! grep -nE 'text-white|text-black' src/components/layout/Header.tsx src/components/families/FamilySelectorList.tsx

# globals.css 의 brand-fg 토큰 정의
grep -n 'color-brand-fg' src/app/globals.css
```

### 3. 8단계 체크리스트 명시 확인

```bash
jq -r '.planning_checklist | keys[]' tasks/plan019-header-redesign/index.json | wc -l   # >= 8
jq '.planning_checklist | to_entries | map(select(.value == "" or .value == null)) | length' \
  tasks/plan019-header-redesign/index.json   # == 0
```

### 4. 수동 smoke

| 시나리오 | 기대 |
|---|---|
| 데스크톱 + 모든 인증 페이지 | sticky Header bg-bg-elev/95 + 로고 단색 + FamilySelector 우상단 |
| 모바일 + Avatar 클릭 | dropdown → "가족 전환" 항목 표시 |
| 모바일 + "가족 전환" 클릭 | Sheet bottom + 가족 목록 |
| Sheet 에서 가족 선택 | Sheet 닫힘 + 페이지 데이터 갱신 |
| Dark mode | 모든 톤 자연스러움 |
| 가족 1개 사용자 | FamilySelector 표시 유지, 가족명 + 관리 진입점 |
| 로그아웃 클릭 | text-expense + 즉시 signOut |

### 5. index.json completed 마킹

phase + 최상위 status → `"completed"` + `completed_at`.

### 6. 최종 커밋 (team-lead 가 통합 검증 후 처리 — executor 는 commit 금지)

team-lead 가 phase-02 검증 결과 + index.json 갱신 + 통합 commit 1건으로 처리한다.

## Out of Scope

- 페이지별 헤더 보조 (월/년 라벨)
- 가족 관리 전용 페이지 신규
- 로그아웃 confirm dialog
