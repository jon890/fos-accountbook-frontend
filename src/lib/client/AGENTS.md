<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# client

## Purpose
클라이언트사이드 전용 유틸리티. React Query 훅, 타임존 컨텍스트, 클라이언트 API 래퍼.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `query/hooks/` | React Query 커스텀 훅 (도메인별 데이터 페칭) |

## Key Files

| File | Description |
|------|-------------|
| `utils.ts` | `cn()` 클래스 병합 유틸 (clsx + tailwind-merge) |
| `timezone-context.tsx` | 사용자 타임존 컨텍스트 프로바이더 |
| `use-session-refresh.ts` | 세션 만료 자동 갱신 훅 |

## For AI Agents

### Working In This Directory
- `"use client"` 컴포넌트에서만 import
- `cn()` 은 이 디렉토리에서 export — 클래스 병합 시 항상 사용

<!-- MANUAL: -->
