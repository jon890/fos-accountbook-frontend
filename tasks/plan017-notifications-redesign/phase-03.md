# Phase 03 — 통합 검증 + completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: plan017 phase 01~02 결과 통합 검증. legacy 잔재 0 확인. index.json completed 마킹.

## 작업 항목

### 1. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/017-notifications-redesign

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

### 2. legacy 잔재 0 최종 확인

```bash
# Notification + /notifications 영역 legacy 토큰 0
! grep -rnE 'text-gray-|text-yellow-|text-orange-|text-red-|text-blue-|bg-yellow-|bg-orange-|bg-red-|bg-blue-' \
  src/components/notifications/ \
  src/app/\(authenticated\)/notifications/

# variant="destructive" 0
! grep -rn 'variant="destructive"' src/components/notifications/

# 신규 파일 존재
test -f src/app/\(authenticated\)/notifications/page.tsx
test -f src/app/\(authenticated\)/notifications/_components/NotificationsClient.tsx
test -f src/app/\(authenticated\)/notifications/loading.tsx
```

### 3. 수동 smoke (사용자)

| 시나리오 | 기대 결과 |
|---|---|
| Dashboard + 알림 N건 (unread) | Bell 옆 expense Badge "N" |
| Bell 클릭 → Popover | 최근 10개 + "전체보기" 링크 |
| 50% / 80% 알림 → 톤 | warning (주황 톤) |
| 100% 알림 → 톤 | expense (빨강 톤) |
| "전체보기" → /notifications | 페이지 이동 + Popover 닫힘 |
| /notifications "안 읽음" segmented | URL `?filter=unread` + 안 읽은 알림만 |
| /notifications + 0건 (안 읽음 탭) | "안 읽은 알림이 없어요" empty |
| Network Slow 3G + /notifications | Skel skeleton |
| "모두 읽음" 클릭 | unread Badge 0 → 다음 진입 시 모두 읽음 톤 |
| Dark mode | 모든 톤 자연스러움 |

### 4. index.json completed 마킹

`tasks/plan017-notifications-redesign/index.json` 의 모든 phase + 최상위 status → `"completed"`, `completed_at` 필드 추가.

### 5. 최종 커밋

```bash
git add tasks/plan017-notifications-redesign/index.json
git commit -m "chore(plan017): mark completed"
```

## Out of Scope

- pagination / 무한 스크롤
- 알림 grouping / 검색
- 브라우저 push 알림 API
- 알림 삭제
