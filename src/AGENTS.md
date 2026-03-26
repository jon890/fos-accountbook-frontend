<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# src

## Purpose
앱 전체 소스코드 루트. Next.js App Router 구조를 따르며 `app/`, `components/`, `lib/`, `types/`, `__tests__/` 로 기능별 분리된다.

## Key Files

| File | Description |
|------|-------------|
| `instrumentation.ts` | Next.js 서버 계측 훅 (Sentry 등 초기화 시 사용) |
| `proxy.ts` | 서버사이드 API 프록시 유틸리티 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router — 페이지, 레이아웃, Server Actions, API Routes (see `app/AGENTS.md`) |
| `components/` | 재사용 React 컴포넌트 (see `components/AGENTS.md`) |
| `lib/` | 공통 유틸리티, 서버/클라이언트 API 클라이언트, 환경변수 검증 (see `lib/AGENTS.md`) |
| `types/` | TypeScript 타입 정의 (see `types/AGENTS.md`) |
| `__tests__/` | Jest 단위/통합 테스트 (see `__tests__/AGENTS.md`) |
| `__mocks__/` | Jest 모킹 — `ky.ts` HTTP 클라이언트 모킹 |

## For AI Agents

### Working In This Directory
- **import 경로**: `@/` alias가 `src/`를 가리킴 (`tsconfig.json` paths 설정)
- Server-only 코드는 `lib/server/` 또는 Server Actions에만 배치
- Client-only 코드(`useState`, `useEffect` 등)는 `"use client"` 선언 필수

### Testing Requirements
```bash
pnpm test                    # 전체 테스트
pnpm test -- --testPathPattern="src/__tests__/components"  # 특정 경로만
```

### Common Patterns
- 도메인별 feature 폴더 구조 (`expenses/`, `incomes/`, `categories/` 등)
- Server Component를 기본으로, 클라이언트 상태 필요 시만 `"use client"`
- Zod 스키마로 런타임 검증 + TypeScript 타입 추론 동시 처리

## Dependencies

### Internal
- 루트 `tsconfig.json`의 path alias (`@/` → `src/`)

### External
- `next`, `react`, `react-dom`, `next-auth`

<!-- MANUAL: -->
