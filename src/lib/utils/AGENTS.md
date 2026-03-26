<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# utils

## Purpose
일반 유틸리티 함수. 날짜/타임존 처리와 숫자/통화 포맷팅 제공.

## Key Files

| File | Description |
|------|-------------|
| `date-timezone.ts` | 날짜 타임존 변환 유틸 |
| `format.ts` | 통화, 날짜 포맷팅 함수 (테스트 커버리지 있음) |

## For AI Agents

### Working In This Directory
- 포맷팅 함수 변경 시 `src/__tests__/lib/utils/format.test.ts` 업데이트 필수
- 타임존은 `src/lib/client/timezone-context.tsx`와 연동

<!-- MANUAL: -->
