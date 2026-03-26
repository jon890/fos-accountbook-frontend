<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# fos-accountbook (우리집 가계부)

## Purpose
가족 단위 수입/지출 공동 관리 Next.js 16 웹 앱. 가족 구성원 초대, 카테고리별 지출 분류, 월별 예산 설정, 대시보드 통계를 제공한다. 백엔드 API와 분리된 프론트엔드 전용 레포지토리.

## Key Files

| File | Description |
|------|-------------|
| `next.config.ts` | Next.js 설정 (`output: "standalone"` for Docker) |
| `tsconfig.json` | TypeScript strict mode 설정 |
| `package.json` | pnpm 의존성 및 스크립트 |
| `Dockerfile` | Multi-stage Docker 빌드 (deps→builder→runner) |
| `.dockerignore` | Docker 빌드 제외 파일 목록 |
| `.env.example` | 환경 변수 템플릿 |
| `jest.config.js` | Jest 테스트 설정 |
| `components.json` | Shadcn UI CLI 설정 |
| `eslint.config.mjs` | ESLint flat config |
| `CLAUDE.md` | Claude Code PR 리뷰 가이드 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/` | 앱 소스코드 전체 (see `src/AGENTS.md`) |
| `.github/` | GitHub Actions CI/CD 워크플로우 |
| `docs/` | API 스펙 등 문서 |
| `public/` | 정적 에셋 (SVG 아이콘) |

## For AI Agents

### Working In This Directory
- **패키지 관리는 pnpm만 사용** — `npm install` / `yarn add` 금지
- 루트 설정 파일 변경 시 TypeScript 컴파일 오류 확인: `pnpm build`
- `next.config.ts`에 `output: "standalone"` 설정 유지 필수 (Docker 빌드용)
- `CLAUDE.md`에 코딩 컨벤션 정의됨 — PR 리뷰 시 해당 파일 우선 참조

### Testing Requirements
```bash
pnpm test          # 단위 테스트
pnpm test:ci       # CI 환경 (coverage 포함)
pnpm lint          # ESLint
pnpm build         # 프로덕션 빌드 검증
```

### Common Patterns
- **Server Component 기본** — 클라이언트 상태 필요 시에만 `"use client"`
- **시맨틱 그라디언트 클래스** — `gradient-expense`, `gradient-income`, `gradient-budget`, `gradient-family`, `gradient-category`, `gradient-primary` (globals.css 정의)
- **`alert()` 금지** — sonner `toast` 사용
- **`any` 타입 금지** — strict TypeScript

## Dependencies

### External
- `next@16` — App Router 프레임워크
- `react@19` — UI 라이브러리
- `next-auth@5` — OAuth 인증 (Google, Naver)
- `tailwindcss@4` — 유틸리티 CSS
- `@radix-ui/*` — Headless UI 기반 컴포넌트
- `ky` — HTTP 클라이언트 (fetch wrapper)
- `zod` — 런타임 스키마 검증
- `react-hook-form` — 폼 상태 관리
- `sonner` — Toast 알림
- `jest` + `@testing-library/react` — 테스트

<!-- MANUAL: -->
