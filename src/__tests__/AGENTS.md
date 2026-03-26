<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# __tests__

## Purpose
Jest 단위/통합 테스트. `src/` 디렉토리 구조를 미러링하여 도메인별로 테스트를 구성한다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/` | NextAuth 설정, 에러, 보안 테스트 |
| `components/` | React 컴포넌트 테스트 (dashboard, expenses, incomes, categories, settings, layout, ui) |
| `actions/` | Server Actions 단위 테스트 |
| `lib/` | 유틸리티 함수 테스트 (format 등) |

## For AI Agents

### Working In This Directory
- 테스트 파일명: `*.test.ts` / `*.test.tsx`
- 컴포넌트 추가 시 `components/<domain>/` 하위에 테스트 파일 함께 생성
- Server Action 비즈니스 로직 변경 시 `actions/` 테스트 업데이트
- **실제 DB/API 모킹** — `src/__mocks__/ky.ts`로 HTTP 클라이언트 모킹

### Testing Requirements
```bash
pnpm test                         # 전체 실행
pnpm test -- --watch              # watch 모드
pnpm test -- --coverage           # 커버리지 리포트
pnpm test:ci                      # CI 환경
```

### Common Patterns
```tsx
// 컴포넌트 테스트
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Server Action 테스트 — 모킹 우선
jest.mock("@/lib/server/api");
```

## Dependencies

### External
- `jest`, `@testing-library/react`, `@testing-library/user-event`
- `msw` — API 모킹 (필요 시)

<!-- MANUAL: -->
