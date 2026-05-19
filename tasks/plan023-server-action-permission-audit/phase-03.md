# Phase 03 — 통합 검증 + 전체 audit grep + status="completed"

**Model**: haiku
**Status**: pending
**Goal**: phase-01 + phase-02 통합 검증. 모든 가족 식별자 다루는 Action 이 ADR-F25 3 패턴 중 하나를 명시하는지 일괄 grep 으로 확인. `index.json` status 마킹 + commit.

## 작업 항목

### 1. 통합 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan023-server-action-permission-audit

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test:ci
```

### 2. 전체 Action audit grep

각 가족 식별자 다루는 Action 이 3 패턴 중 하나를 사용하는지 확인:

```bash
# Single-family 패턴 (A): session 비교 또는 getSelectedFamilyUuid 단독
echo "=== Pattern A (Single-family) ==="
grep -lE 'sessionFamilyUuid|getSelectedFamilyUuid' src/actions/{expense,income,category}/*.ts | sort

# Multi-family 패턴 (B): assertFamilyAccess
echo "=== Pattern B (Multi-family) ==="
grep -lE 'assertFamilyAccess' src/actions/**/*.ts | sort

# Entity ownership 패턴 (C): entity 조회 후 some 검증
echo "=== Pattern C (Entity ownership) ==="
grep -lE 'getActiveInvitations|some\(.*\)' src/actions/invitation/*.ts | sort

# 누락 후보: requireAuth 만 있고 familyUuid 도 받는 Action
echo "=== 누락 후보 (수동 점검 필요) ==="
for f in src/actions/**/*.ts; do
  if grep -q 'familyUuid' "$f" && \
     ! grep -qE 'getSelectedFamilyUuid|assertFamilyAccess|some\(' "$f"; then
    echo "  - $f"
  fi
done
```

누락 후보 결과가 있으면 사용자에게 보고 (이번 plan 범위 밖이면 후속 plan 후보로 기록).

### 3. 수동 smoke (구현자 책임)

- `/settings` 가족 예산 수정 → 정상
- 카테고리 생성 → 정상
- 초대 링크 생성 → 삭제 → 정상
- 기존 expense/income create/update/delete 회귀 없음

### 4. 8단계 체크리스트 자체 점검

| 단계 | 확인 |
|---|---|
| 1 구현가능성 | 기존 helper + service 재사용 ✅ |
| 2 기술스택 | 변경 없음 ✅ |
| 3 사용자흐름 | 동작 변경 없음, 보안만 강화 ✅ |
| 4 UI | 변경 없음 ✅ |
| 5 API | Action 시그니처 유지, category/create 의 prop fallback 만 제거 ✅ |
| 6 아키텍처 | assertFamilyAccess helper 신설 + 3 Action 갱신 ✅ |
| 7 ADR | ADR-F25 신설 (docs commit 포함) + CLAUDE.md 강화 ✅ |
| 8 docs | adr.md + CLAUDE.md ✅ (flow.md 무변경) |

### 5. `index.json` status 마킹 + commit

```bash
# index.json 의 "status": "pending" → "completed" (Edit tool)

git add tasks/plan023-server-action-permission-audit/index.json
git commit -m "chore(plan023): mark task completed"
git push
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `tasks/plan023-server-action-permission-audit/index.json` | status=completed |

## Out of Scope

- backend 측 권한 검증 (별도 backend issue 후보)
- 다른 plan task 의 상태 변경
- 새 ADR 추가
