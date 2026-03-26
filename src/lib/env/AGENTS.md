<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# env

## Purpose
환경변수 스키마 정의 및 런타임 검증. Zod로 서버/클라이언트 환경변수를 분리 검증하며, 앱 시작 시 누락된 환경변수를 즉시 감지한다.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | 배럴 익스포트 |
| `server.env.ts` | 서버 환경변수 검증 및 export |
| `client.env.ts` | 클라이언트 환경변수 검증 및 export |
| `schemas/server.env.schema.ts` | 서버 환경변수 Zod 스키마 |
| `schemas/client.env.schema.ts` | 클라이언트 환경변수 Zod 스키마 |

## For AI Agents

### Working In This Directory
- 새 환경변수 추가 시: 스키마 파일 수정 → `.env.example` 업데이트
- `NEXT_PUBLIC_` 접두사 있는 변수만 `client.env.schema.ts`에 추가
- `process.env.X` 직접 접근 금지 — 이 모듈의 검증된 객체를 통해 접근

<!-- MANUAL: -->
