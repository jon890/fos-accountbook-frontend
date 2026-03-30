<!-- Parent: ../AGENTS.md -->
<!-- Updated: 2026-03-30 -->

# actions

## Purpose

Next.js Server Actions. **Controller 역할만 담당** — 인증 확인, 입력 파싱/검증, 서비스 위임, 캐시 무효화.

비즈니스 로직(API 호출, 쿼리 빌딩, 데이터 변환, 오케스트레이션)은 `src/services/`에 위치.

## 레이어 역할 분리

```
Page (app/)
  → Action (here) — 인증, Zod 검증, revalidatePath
    → Service (src/services/) — API 호출, 쿼리 빌딩, 변환
      → lib/server/api — HTTP 클라이언트
```

## 각 액션 파일의 책임

| 책임 | 위치 |
|------|------|
| `"use server"` 지시어 | ✅ Action |
| 인증 확인 (`requireAuth`, `requireAuthOrRedirect`) | ✅ Action |
| FormData 파싱 | ✅ Action |
| Zod 입력 검증 | ✅ Action |
| 가족 UUID 소유권 검증 | ✅ Action |
| `revalidatePath` | ✅ Action |
| 에러 핸들링 / 응답 포맷 | ✅ Action |
| API 호출 (`serverApiClient`) | ❌ Service로 위임 |
| 쿼리 파라미터 빌딩 | ❌ Service로 위임 |
| 날짜 변환 / 데이터 변환 | ❌ Service로 위임 |
| 액션 간 오케스트레이션 | ❌ Service로 위임 |

## Subdirectories

| Directory       | Purpose                                         |
| --------------- | ----------------------------------------------- |
| `expense/`      | 지출 CRUD Controller                            |
| `income/`       | 수입 CRUD Controller                            |
| `category/`     | 카테고리 CRUD Controller                        |
| `family/`       | 가족 생성/조회/업데이트 Controller              |
| `user/`         | 유저 프로필/설정 Controller                     |
| `dashboard/`    | 대시보드 통계 Controller                        |
| `invitation/`   | 가족 초대 Controller                            |
| `notification/` | 알림 Controller                                 |
| `auth/`         | 로그인/로그아웃 (NextAuth 직접 호출, 서비스 없음) |

## For AI Agents

### Working In This Directory

- 모든 파일 최상단: `"use server";`
- **비즈니스 로직을 여기에 추가하지 말 것** — `src/services/`에 추가
- 인증은 `requireAuth()` 또는 `requireAuthOrRedirect()` 사용
- 반환 타입 명시 필수 (예: `Promise<ActionResult<T>>` 또는 `Promise<FormState>`)
- 에러는 `src/lib/errors/`의 `handleActionError`, `ActionError` 사용
- 뮤테이션 후 `revalidatePath` 호출

### Action 파일 기본 구조

```ts
"use server";

import { requireAuth, getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { handleActionError, successResult, ActionError } from "@/lib/errors";
import { someService } from "@/services/domain/some-service";
import { revalidatePath } from "next/cache";

export async function someAction(params: Params): Promise<ActionResult<Result>> {
  try {
    await requireAuth();
    const familyId = await getSelectedFamilyUuid();
    if (!familyId) throw ActionError.familyNotSelected();

    const result = await someService.doSomething(familyId, params); // 서비스에 위임

    revalidatePath("/relevant-path"); // 뮤테이션인 경우에만
    return successResult(result);
  } catch (error) {
    return handleActionError(error, "작업에 실패했습니다");
  }
}
```

## Dependencies

### Internal

- `src/services/` — 비즈니스 로직 (핵심 의존성)
- `src/lib/server/auth/` — 세션 검증
- `src/lib/errors/` — 에러 처리
- `src/types/` — 도메인 타입
