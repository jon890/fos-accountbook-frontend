# Phase 02 — 통합 검증 + 8단계 체크리스트 + completed

**Model**: haiku
**Status**: pending
**Goal**: plan019 phase 01 결과 통합 검증. legacy 잔재 0 확인. index.json completed 마킹.

## 작업 항목

### 1. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/019-header-redesign

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

기존 `src/__tests__/components/layout/Header.test.tsx` 가 새 구조에서 통과하는지 확인. 깨지면 본 phase 내에서 갱신 (또는 phase 01 에 포함). 깨진 expectation:
- text 그라디언트 → 단색 text 변경
- variant=destructive 클래스 → text-expense
- 모바일 가족 전환 항목 신규 — 모바일 viewport 시뮬레이션 필요

### 2. legacy 잔재 0 최종

```bash
# Header 영역 + FamilySelector 영역 legacy 토큰 0
! grep -rnE 'bg-white/|border-gray-|from-gray-|to-gray-|gradient-primary|ring-blue-|text-muted-foreground' \
  src/components/layout/Header.tsx \
  src/components/families/FamilySelectorDropdown.tsx \
  src/components/families/FamilySelectorList.tsx 2>/dev/null

# variant="destructive" 0
! grep -rn 'variant="destructive"' src/components/layout/Header.tsx
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

### 6. 최종 커밋

```bash
git add tasks/plan019-header-redesign/index.json
git commit -m "chore(plan019): mark completed"
```

## Out of Scope

- 페이지별 헤더 보조 (월/년 라벨)
- 가족 관리 전용 페이지 신규
- 로그아웃 confirm dialog
