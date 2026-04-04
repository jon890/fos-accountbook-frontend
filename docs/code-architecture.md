# Code Architecture — fos-accountbook

> 상세 코딩 컨벤션·금지사항은 `CLAUDE.md` 참고. 이 문서는 계층 구조와 패턴만 다룬다.

---

## 계층 구조

```
app/ (Page, Layout)
  └─ actions/          "use server" — 인증, Zod 검증, revalidatePath
       └─ services/    API 호출, 쿼리 빌딩, 데이터 변환
            └─ lib/server/api/   HTTP 클라이언트 (ky)
```

## 계층 계약

| 계층          | 책임                                              | 금지                                        |
| ------------- | ------------------------------------------------- | ------------------------------------------- |
| `app/`        | 라우팅, 레이아웃, 데이터 fetch (Server Component) | API 직접 호출                               |
| `actions/`    | `"use server"`, 인증, Zod 검증, revalidatePath    | API 호출, 비즈니스 로직                     |
| `services/`   | API 호출, 쿼리 빌딩, 변환, 오케스트레이션         | `"use server"`, revalidatePath, requireAuth |
| `components/` | 렌더링, 사용자 인터랙션                           | 직접 fetch, 비즈니스 로직                   |

---

## 핵심 패턴

### Server Action 표준 구조

```typescript
"use server";

export async function createExpenseAction(
  data: unknown,
): Promise<ActionResult> {
  const session = await requireAuthOrRedirect();
  const familyUuid = await getSelectedFamilyUuid(session);

  const parsed = createExpenseSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  const result = await expenseService.create(
    familyUuid,
    session.userUuid,
    parsed.data,
  );

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true, data: result };
}
```

### Server / Client 컴포넌트 분리

```
page.tsx          (Server) — 데이터 fetch, SEO
  └─ *Client.tsx  (Client) — useState, 이벤트 핸들러, 폼
       └─ components/ui/   — Shadcn 기반 (Server or Client)
```

규칙: `"use client"` 경계를 말단 컴포넌트로 밀어내 번들 최소화.
모든 `page.tsx`는 Server Component. 인터랙션이 필요한 부분만 `*Client.tsx`로 분리.

### 에러 처리

- **Server Action**: `{ success: false, error }` 반환 → 클라이언트에서 `toast.error`
- **HTTP 오류**: ky가 `HTTPError` 발생 → 서비스 레이어에서 catch 후 재throw 또는 null 반환
- **인증 오류**: `requireAuthOrRedirect()` → `/auth/signin` 리다이렉트

### 인증 흐름

```
모든 Server Action
  └─ requireAuthOrRedirect()          세션 없으면 /auth/signin 리다이렉트
       └─ getSelectedFamilyUuid()     JWT에 캐싱된 defaultFamilyUuid 반환
```

---

## 디렉터리 구조 요약

```
src/
├── actions/{domain}/       Server Action — 인증·검증·revalidatePath
├── services/{domain}/      API 호출·변환 함수
├── components/
│   ├── ui/                 Shadcn 기반 기본 컴포넌트
│   ├── layout/             Header, BottomNavigation
│   └── {domain}/           도메인별 UI 컴포넌트
├── app/(authenticated)/    인증 필요 라우트 (Server Component 기본)
├── app/api/auth/           NextAuth API Route
└── __tests__/              서비스 단위 테스트
```

---

## 새 도메인 추가 체크리스트

1. `src/actions/{domain}/` — Server Action (`"use server"` + Zod 스키마 + revalidatePath)
2. `src/services/{domain}/` — API 호출 함수 (순수 함수, 테스트 가능)
3. `src/components/{domain}/` — UI 컴포넌트 (Server/Client 구분)
4. `src/__tests__/` — 서비스 단위 테스트
5. `src/app/(authenticated)/` — 페이지 라우트 (Server Component)
6. `docs/data-schema.md` — TypeScript 타입 + API 엔드포인트 업데이트
