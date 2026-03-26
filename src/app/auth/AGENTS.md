<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# auth

## Purpose
공개(비인증) 인증 페이지. 로그인, 로그아웃, OAuth 오류 페이지를 포함한다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `signin/` | 로그인 페이지 — Google/Naver OAuth 버튼 |
| `signout/` | 로그아웃 처리 페이지 |
| `error/` | OAuth 에러 페이지 |

## For AI Agents

### Working In This Directory
- 이 디렉토리 페이지는 `(authenticated)` 그룹 밖에 위치 → 인증 미들웨어 미적용
- OAuth 콜백 URL: `NEXTAUTH_URL/api/auth/callback/{provider}`
- 로그인 UI 컴포넌트는 `src/components/auth/SignInForm.tsx` 에 위치

<!-- MANUAL: -->
