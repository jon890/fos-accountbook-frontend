# Phase 03 — text-white grep 0 검증 + status="completed"

**Model**: haiku
**Status**: pending
**Goal**: phase-01 + phase-02 통합 검증. 강조 배경 위 text-white 잔재 0 확인. `index.json` status 마킹.

## 작업 항목

### 1. 통합 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan022-gradient-fg-tokens

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test:ci

# 4 fg 토큰 정의 확인
grep -nE '--color-(brand|expense|income|warning)-fg:' src/app/globals.css | wc -l   # == 4

# ADR-F23 적용 범위 안 text-white 0
# (gradient / bg-expense / bg-income / bg-warning / bg-destructive 인접 text-white)
echo "=== ADR-F23 위반 잔재 (수동 검토) ==="
for f in $(grep -rln 'text-white' src --include='*.tsx'); do
  if grep -E 'gradient-(budget|family|primary|category|expense|income)|bg-expense|bg-income|bg-warning|bg-destructive|bg-brand-' "$f" > /dev/null; then
    echo "  검토: $f"
    grep -nE 'text-white' "$f" | head -3
  fi
done
```

남은 잔재가 있으면 사용자에게 보고. surface 위 text-white (bg-bg-elev 등) 는 비대상으로 유지 가능.

### 2. 수동 smoke (구현자 책임)

- Dashboard: BudgetHeroCard / QuickActions 모든 카드
- Auth: signin / signout / error 페이지 + AuthCenterCard
- Header: 로고 + Avatar + dropdown
- BottomNavigation: FAB + 활성 탭
- 삭제 confirm: AlertDialog destructive variant 4 곳
- 모든 화면 dark mode 전환 → contrast 일관

### 3. 8단계 체크리스트

| 단계 | 확인 |
|---|---|
| 1 구현가능성 | 토큰 2 종 추가 + className 일괄 교체 ✅ |
| 2 기술스택 | 변경 없음 ✅ |
| 3 사용자흐름 | 동작 변경 없음 ✅ |
| 4 UI | gradient 위 텍스트 light/dark 일관 ✅ |
| 5 API | 변경 없음 ✅ |
| 6 아키텍처 | globals.css + 20+ tsx 파일 ✅ |
| 7 ADR | ADR-F23 적용 범위 갱신 (4 토큰 + 매핑 룰) ✅ |
| 8 docs | ADR-F23 ✅ |

### 4. `index.json` status 마킹 + commit

```bash
git add tasks/plan022-gradient-fg-tokens/index.json
git commit -m "chore(plan022): mark task completed"
git push
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan022-gradient-fg-tokens/index.json` | status=completed |

## Out of Scope

- surface 위 text-white 대응 (별도 검토)
- lint rule 도입 (text-white 차단)
