<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# lib

## Purpose
공통 유틸리티, API 클라이언트, 환경변수 검증, 에러 처리 등 횡단 관심사 모음. `server/`와 `client/`를 명시적으로 분리하여 번들 오염을 방지한다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `server/` | 서버사이드 전용 — auth 설정, 백엔드 API 클라이언트, 헬퍼 (see `server/AGENTS.md`) |
| `client/` | 클라이언트사이드 전용 — React Query 훅, 타임존 컨텍스트, utils |
| `env/` | Zod 기반 환경변수 스키마 검증 (서버/클라이언트 분리) |
| `schemas/` | Zod 스키마 (category 등 도메인 스키마) |
| `errors/` | 커스텀 에러 클래스, 에러 코드 정의 |
| `utils/` | 날짜/타임존 처리, 숫자 포맷팅 유틸 |

## For AI Agents

### Working In This Directory
- **`server/` 코드를 클라이언트 번들에 포함시키지 말 것** — `"use server"` 또는 Server Component에서만 import
- 환경변수는 `env/` 모듈을 통해서만 접근 (`process.env.X` 직접 사용 금지)
- `NEXT_PUBLIC_` 접두사 없는 변수는 서버 전용

### Common Patterns
```ts
// 서버사이드 환경변수
import { serverEnv } from "@/lib/env";

// 클라이언트 유틸
import { cn } from "@/lib/client/utils";
import { formatCurrency } from "@/lib/utils/format";
```

## Dependencies

### External
- `ky` — HTTP 클라이언트
- `zod` — 스키마 검증
- `next-auth` — 세션 관리

<!-- MANUAL: -->
