<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# errors

## Purpose
커스텀 에러 클래스 및 에러 코드 정의. Server Actions와 API 클라이언트에서 일관된 에러 처리를 위해 사용한다.

## Key Files

| File | Description |
|------|-------------|
| `action-error.ts` | Server Action 전용 에러 클래스 |
| `error-code.ts` | 에러 코드 상수 정의 |
| `index.ts` | 배럴 익스포트 |

## For AI Agents

### Working In This Directory
- Server Action에서 에러 발생 시 이 모듈의 클래스 사용
- `action-result-handler.ts`와 함께 사용하여 일관된 응답 형식 유지

<!-- MANUAL: -->
