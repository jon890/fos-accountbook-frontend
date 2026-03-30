<!-- Parent: ../AGENTS.md -->
<!-- Created: 2026-03-30 -->

# services

## Purpose

비즈니스 로직 레이어. `src/actions/`(Controller)와 `src/lib/server/api/`(HTTP 클라이언트) 사이에 위치.

API 호출, 쿼리 빌딩, 데이터 변환, 액션 간 오케스트레이션을 담당.

## 레이어 역할

```
Action (src/actions/) — 인증, 검증, revalidatePath
  → Service (here) — 비즈니스 로직, API 호출
    → lib/server/api — HTTP 클라이언트
```

## Subdirectories

| Directory       | Purpose                                      |
| --------------- | -------------------------------------------- |
| `expense/`      | 지출 CRUD 로직 (쿼리 빌딩, 변환, API 호출)   |
| `income/`       | 수입 CRUD 로직                               |
| `category/`     | 카테고리 CRUD 로직                           |
| `family/`       | 가족 관리 로직 (생성 시 기본 가족 설정 포함) |
| `user/`         | 유저 프로필/설정 로직                        |
| `dashboard/`    | 대시보드 통계 집계 로직 (캐시 포함)          |
| `invitation/`   | 초대 링크 생성/상태 계산/URL 빌딩            |
| `notification/` | 알림 조회/처리 로직                          |

## For AI Agents

### Working In This Directory

- `"use server"` 지시어 **사용 금지** — 일반 async 함수
- `revalidatePath`, `cookies()`, `headers()` **사용 금지** — Action 레이어 전용
- `requireAuth()` **사용 금지** — 인증은 Action에서 완료 후 진입
- 함수 시그니처에 `familyId`를 명시적 인자로 받을 것 (Action에서 전달)
- 반환 타입 명시 필수
- 에러는 `ActionError` 사용 가능 (Action에서 캐치)

### Service 파일 기본 구조

```ts
// "use server" 없음
import { serverApiClient, serverApiGet } from "@/lib/server/api/client";
import { ActionError } from "@/lib/errors";
import type { SomeRequest, SomeResponse } from "@/types/domain";

export async function getSomething(familyId: string, params: Params): Promise<SomeResponse> {
  // 비즈니스 규칙 검증
  if (params.page < 1) throw ActionError.invalidInput("page", params.page, "1 이상이어야 합니다");

  // 쿼리/요청 데이터 빌딩
  const query = buildQuery(params);

  // API 호출
  return serverApiGet<SomeResponse>(`/families/${familyId}/something?${query}`);
}

export async function createSomething(familyId: string, data: CreateData): Promise<void> {
  const requestBody: SomeRequest = {
    // 데이터 변환
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    ...data,
  };
  await serverApiClient(`/families/${familyId}/something`, {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}
```

## Dependencies

### Internal

- `src/lib/server/api/` — HTTP 클라이언트 (`serverApiClient`, `serverApiGet`)
- `src/lib/errors/` — `ActionError`
- `src/lib/env/` — 환경 변수 (초대 URL 생성 등)
- `src/types/` — 도메인 타입
