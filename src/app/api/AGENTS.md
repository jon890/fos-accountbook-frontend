<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# api

## Purpose
Next.js API Route Handlers. NextAuth OAuth 처리와 헬스체크 엔드포인트를 포함한다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/[...nextauth]/` | NextAuth catch-all 라우트 — OAuth 콜백 처리 |
| `health/` | `GET /api/health` — Docker HEALTHCHECK용 엔드포인트 |

## Key Files

| File | Description |
|------|-------------|
| `health/route.ts` | `{ status: "ok" }` 반환. Docker HEALTHCHECK가 이 URL 폴링 |

## For AI Agents

### Working In This Directory
- `auth/[...nextauth]/route.ts`는 NextAuth 핸들러만 export — 직접 수정 최소화
- 헬스체크 엔드포인트는 인증 미들웨어 우회 필요 — `middleware.ts`의 matcher에서 `/api/health` 제외 확인

<!-- MANUAL: -->
