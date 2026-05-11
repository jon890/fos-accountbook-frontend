# Phase 02 — 통합 검증 + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: plan015 phase 01 결과 통합 검증. legacy 잔재 0 최종 확인. index.json completed 마킹.

## 작업 항목

### 1. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/015-invite-page-redesign

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

### 2. legacy 잔재 0 최종 확인

```bash
# Invite 영역 전체에서 legacy 토큰 0
! grep -rnE 'app-background|text-gray-|text-blue-600|text-orange-600|bg-gray-50|bg-muted\b|shadow-2xl|shadow-xl' \
  src/app/\(authenticated\)/invite/

# 하드코딩 hex 0
! grep -rnE '#[0-9a-fA-F]{6}' src/app/\(authenticated\)/invite/
```

### 3. 수동 smoke (사용자)

| 시나리오 | 기대 결과 |
|---|---|
| 만료 > 24h + `/invite/{token}` | 새 카드 디자인 (gradient-family round + fg-muted 시계) |
| 만료 ≤ 24h | "곧 만료" expense 배지 + 빨간 시계 |
| 만료된 토큰 | `/?error=invalid_invitation` redirect (page.tsx 측 처리 — 변경 없음) |
| "초대 수락하기" 클릭 → 성공 | toast + `/` redirect |
| Dark mode | 모든 시각 요소 자연스러운 톤 |
| 모바일 (320px) + 데스크톱 (1280px) | max-w-md 카드 가운데 정렬 일관 |

### 4. index.json completed 마킹

`tasks/plan015-invite-page-redesign/index.json` 의 모든 phase + 최상위 status → `"completed"`, `completed_at` 필드 추가.

### 5. 최종 커밋

```bash
git add tasks/plan015-invite-page-redesign/index.json
git commit -m "chore(plan015): mark completed"
```

## Out of Scope

- inviter / memberCount 표시 (plan016 + backend #127)
- 인증 안 한 사용자 미리보기 (별도 plan)
- 거절 시 token 무효화 API
