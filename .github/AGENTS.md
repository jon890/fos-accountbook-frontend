<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# .github

## Purpose
GitHub Actions CI/CD 워크플로우 및 Dependabot 설정.

## Key Files

| File | Description |
|------|-------------|
| `dependabot.yml` | 의존성 자동 업데이트 설정 |
| `workflows/frontend-ci.yml` | PR/push 시 타입체크, 린트, 테스트, Codecov |
| `workflows/docker-publish.yml` | main 브랜치 push 시 Docker 이미지 빌드 → GHCR 푸시 |
| `workflows/claude-code-review.yml` | PR open/sync 시 Claude Code 자동 코드 리뷰 |

## For AI Agents

### Working In This Directory
- `docker-publish.yml`: `NEXT_PUBLIC_API_BASE_URL`은 GitHub Repo Variable(`vars.*`)로 주입
- `claude-code-review.yml`: `CLAUDE_CODE_OAUTH_TOKEN` Secret 필요 (GitHub Settings > Secrets)
- 워크플로우 수정 시 YAML 유효성 확인 필수

### Testing Requirements
- 워크플로우 변경 후 GitHub Actions 탭에서 실행 결과 확인

<!-- MANUAL: -->
