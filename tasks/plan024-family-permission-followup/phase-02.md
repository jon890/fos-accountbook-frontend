# Phase 02 — 통합 검증 + audit grep + status="completed"

**Model**: haiku
**Status**: pending
**Goal**: phase-01 통합 검증 + plan023+024 적용 후 가족 식별자 다루는 Action 의 ADR-F25 3 패턴 audit. `index.json` status 마킹 + commit.

## 작업 항목

### 1. 통합 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan024-family-permission-followup

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test:ci
```

### 2. 전체 Action audit grep (누락 후보 0 확인)

```bash
# Pattern A (Single-family)
echo "=== Pattern A ==="
grep -lE 'sessionFamilyUuid|getSelectedFamilyUuid' src/actions/{expense,income,category}/*.ts | sort

# Pattern B (Multi-family)
echo "=== Pattern B ==="
grep -lE 'assertFamilyAccess' src/actions/**/*.ts | sort

# Pattern C (Entity ownership)
echo "=== Pattern C ==="
grep -lE 'getActiveInvitations|\.some\(\(.+\) => .+\.uuid ===' src/actions/invitation/*.ts | sort

# 누락 후보: familyUuid 받는데 3 패턴 미사용
echo "=== 누락 후보 ==="
for f in src/actions/**/*.ts; do
  if grep -q 'familyUuid' "$f" && \
     ! grep -qE 'getSelectedFamilyUuid|assertFamilyAccess|\.some\(\(.+\) => .+\.uuid ===' "$f"; then
    echo "  - $f"
  fi
done
```

누락 후보 결과가 0 건이면 plan023+024 로 표준화 완료. 1 건 이상이면 사용자에게 보고.

### 3. 8단계 체크리스트 자체 점검

| 단계 | 확인 |
|---|---|
| 1 구현가능성 | ✅ helper 재사용, 신규 의존성 없음 |
| 2 기술스택 | ✅ 변경 없음 |
| 3 사용자흐름 | ✅ 동작 변경 없음 |
| 4 UI | ✅ 변경 없음 |
| 5 API | ✅ 2 Action 제거 (dead+wrapper) + 1 Action 표준화 |
| 6 아키텍처 | ✅ ADR-F25 패턴 B 적용 범위 확장. service 의 inline 권한 검증 제거 (action 단일 책임) |
| 7 ADR | ✅ 신규 ADR 없음 — ADR-F25 활용 |
| 8 docs | ✅ docs 변경 없음 |

### 4. `index.json` status 마킹

`tasks/plan024-family-permission-followup/index.json` 의 `status: "pending"` → `"completed"` (Edit tool). 각 phase 의 `status` 도 모두 `"completed"`. 별도 commit 없이 마지막 phase commit 에 포함.

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan024-family-permission-followup/index.json` | status=completed |

## Out of Scope

- backend 측 권한 검증
- 누락 후보 발견 시 본 plan 에서 처리 (별도 plan 분리)
