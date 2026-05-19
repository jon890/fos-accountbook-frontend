# Phase 03 — 카드 정보 분리 + 통합 검증 + status="completed"

**Model**: haiku
**Status**: pending
**Goal**: "기본 가족 설정" 카드와 "내 가족 목록" 카드의 정보 중복 해소. 통합 검증 후 `index.json` 의 `status` 를 `"completed"` 로 마킹.

## Context (자기완결)

현재 양 카드 모두 "구성원 N명 · 지출 N건" 동일 정보를 표시 (L161-164, L286-289).

**역할 분리**:
- **기본 가족 설정 카드**: radio + 가족명 + "현재 기본" 배지만 (선택 UX 집중)
- **내 가족 목록 카드**: 멤버수 / 카테고리수 / 지출수 / "관리" 진입 (통계 + 관리 진입 집중)

## 작업 항목

### 1. 기본 가족 설정 카드 (L116-186) — 통계 정보 제거

```tsx
// 변경 전 L161-164
<span className="text-xs text-fg-muted mt-0.5">
  구성원 {family.members?.length || 0}명 · 지출{" "}
  {family.expenseCount || 0}건
</span>

// 변경 후 — 통계 제거, 월 예산만 보조 표시
<span className="text-xs text-fg-muted mt-0.5 font-num tabular-nums">
  {family.monthlyBudget > 0
    ? `월 예산 ₩${family.monthlyBudget.toLocaleString()}`
    : "월 예산 미설정"}
</span>
```

선택 시점에서 사용자가 알고 싶은 것은 "어느 가족이 기본인지" 와 "그 가족의 예산은 얼마인지". 멤버/지출 통계는 "내 가족 목록" 에서 표시.

### 2. 내 가족 목록 카드 (L269-301) — 변경 없음 (이미 통계 표시)

기존 표시 유지: `구성원 N명 · 카테고리 N개 · 지출 N건`.

### 3. 통합 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan021-settings-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test:ci

# legacy 토큰 0 (전체)
! grep -nE 'gradient-primary|DollarSign' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx \
  src/components/settings/

# 신규 컴포넌트 존재
test -f src/components/settings/SettingsHero.tsx
test -f src/components/settings/BudgetEditDialog.tsx

# inline edit 잔재 0
! grep -n 'editingBudget\|budgetValues' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx

# 정보 중복 해소: 기본 가족 카드의 "구성원 N명 · 지출 N건" 제거
! grep -n '구성원.*명 · 지출' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx | \
  head -1 || echo "OK: 중복 제거됨 또는 1곳만 (내 가족 목록 카드)"

# 내 가족 목록 카드는 카테고리 통계 유지
grep -n '카테고리.*개' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx | wc -l   # >= 1
```

### 4. 수동 smoke (구현자 책임)

- 기본 가족 설정 카드: 가족명 + 월 예산 (구성원/지출 통계 미표시)
- 내 가족 목록 카드: 구성원 / 카테고리 / 지출 통계 유지
- 정보 중복 해소 (한 화면 안에 "구성원 N명" 이 한 곳에만 표시)
- 모바일 / 데스크톱 모두 자연
- Dark mode 자연 전환

### 5. 8단계 체크리스트 자체 점검

| 단계 | 확인 |
|---|---|
| 1 구현가능성 | 기존 데이터 그대로 사용 ✅ |
| 2 기술스택 | 변경 없음 ✅ |
| 3 사용자흐름 | 예산 편집 inline → Dialog, 정보 중복 해소 ✅ |
| 4 UI | Hero + 토큰 정리 + Dialog UX + 카드 역할 분리 ✅ |
| 5 API | 변경 없음 ✅ |
| 6 아키텍처 | SettingsHero / BudgetEditDialog 신규 + Client 정리 ✅ |
| 7 ADR | skip (기존 패턴 재사용) ✅ |
| 8 docs | flow.md §15 신규 ✅ |

### 6. `index.json` status 마킹 + commit

```bash
# index.json 의 "status": "pending" → "completed" 변경 (Edit tool)

git add tasks/plan021-settings-redesign/index.json
git commit -m "chore(plan021): mark task completed"
git push
```

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 기본 가족 카드 정보 변경 |
| `tasks/plan021-settings-redesign/index.json` | status=completed |

## Out of Scope

- 다른 plan task 의 상태 변경
- 새 ADR 추가
