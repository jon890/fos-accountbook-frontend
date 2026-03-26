<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# app

## Purpose
Next.js App Router의 핵심 디렉토리. 페이지 라우팅, 레이아웃, Server Actions, API Routes를 포함한다. `(authenticated)` 라우트 그룹으로 인증 필요 페이지를 분리한다.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | Root 레이아웃 — HTML, SessionProvider, Toaster 설정 |
| `globals.css` | 전역 스타일 + CSS 변수 테마 + 시맨틱 그라디언트 클래스 정의 |
| `providers.tsx` | 클라이언트 컨텍스트 프로바이더 묶음 |
| `favicon.ico` | 파비콘 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `(authenticated)/` | 인증 필요 라우트 그룹 — layout에서 세션 검증 (see `(authenticated)/AGENTS.md`) |
| `actions/` | Next.js Server Actions — 도메인별 분리 (see `actions/AGENTS.md`) |
| `api/` | Next.js API Routes (NextAuth, 헬스체크) (see `api/AGENTS.md`) |
| `auth/` | 공개 인증 페이지 (signin, signout, error) |

## For AI Agents

### Working In This Directory
- `globals.css`의 시맨틱 클래스를 반드시 사용할 것:
  - `gradient-expense` (지출: 로즈-레드)
  - `gradient-income` (수입: 에메랄드)
  - `gradient-budget` (예산: 앰버)
  - `gradient-family` (가족: 바이올렛)
  - `gradient-category` (카테고리: 인디고)
  - `gradient-primary` (기본: 블루)
  - `app-background` (앱 배경 그라디언트)
- 새 페이지 추가 시 `(authenticated)/` 하위에 배치 (인증 필요) 또는 루트에 배치 (공개)

### Common Patterns
- Server Component가 기본 — 페이지 컴포넌트는 `async function` 권장
- 로딩 상태는 `loading.tsx` 파일로 처리 (Suspense 자동 적용)
- 클라이언트 인터랙션이 필요한 부분은 `_components/` 폴더에 Client Component로 분리

## Dependencies

### Internal
- `src/lib/server/auth/` — 서버사이드 세션 처리
- `src/components/` — 재사용 컴포넌트

### External
- `next-auth` — OAuth 인증
- `sonner` — Toast 알림 (Toaster는 root layout에 등록)

<!-- MANUAL: -->
