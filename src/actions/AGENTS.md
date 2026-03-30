<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# actions

## Purpose
Next.js Server Actions. 백엔드 API 호출, 비즈니스 로직, 폼 처리를 담당. 도메인별 디렉토리로 분리되어 있으며 모든 파일 최상단에 `"use server"` 선언 필수.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `expense/` | 지출 CRUD (create, update, delete, get, list) |
| `income/` | 수입 CRUD (create, update, delete, get, list) |
| `category/` | 카테고리 CRUD |
| `family/` | 가족 생성, 조회, 업데이트, 멤버 관리 |
| `user/` | 유저 프로필 조회/수정, 설정 |
| `dashboard/` | 대시보드 통계, 최근 활동, 캘린더 데이터 |
| `invitation/` | 가족 초대 생성/수락/거절 |
| `notification/` | 알림 조회/읽음 처리 |
| `auth/` | 로그인/로그아웃 액션, 스키마 |

## For AI Agents

### Working In This Directory
- 모든 Server Action 파일 최상단: `"use server";`
- **인증 확인 필수** — 각 액션에서 `getServerSession()` 또는 `auth()` 호출 후 미인증 시 에러 반환
- 반환 타입은 명시적으로 선언 (예: `Promise<ActionResult<Expense>>`)
- 에러는 `src/lib/errors/` 의 커스텀 에러 클래스 사용

### Common Patterns
```ts
"use server";
import { auth } from "@/lib/server/auth";
import { serverApiPost } from "@/lib/server/api";

export async function createExpense(data: CreateExpenseInput) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  return serverApiPost("/expenses", data);
}
```

## Dependencies

### Internal
- `src/lib/server/auth/` — 세션 검증
- `src/lib/server/api/` — 백엔드 API 클라이언트
- `src/lib/errors/` — 에러 처리
- `src/types/` — 도메인 타입

<!-- MANUAL: -->
