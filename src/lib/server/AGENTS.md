<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# server

## Purpose
서버사이드 전용 유틸리티. 클라이언트 번들에 포함되면 안 되는 코드 — NextAuth 설정, 백엔드 API 클라이언트, 인증 헬퍼.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/` | NextAuth 설정(`auth.ts`), 세션 헬퍼, 백엔드 토큰 교환, 프로필 페처 |
| `api/` | 백엔드 API 클라이언트 (`serverApiGet`, `serverApiPost` 등) |

## Key Files

| File | Description |
|------|-------------|
| `action-result-handler.ts` | Server Action 결과 표준화 핸들러 |
| `index.ts` | 배럴 익스포트 |

## For AI Agents

### Working In This Directory
- 이 디렉토리의 모든 코드는 **서버에서만 실행** — Client Component에서 import 금지
- `auth/auth.ts` — NextAuth 설정 핵심 파일, 신중하게 수정
- 백엔드 API 호출은 `api/client.ts`의 래퍼 함수 사용

<!-- MANUAL: -->
