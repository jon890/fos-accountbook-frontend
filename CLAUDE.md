# CLAUDE.md — fos-accountbook

Claude Code가 항상 따라야 할 규칙과 참조 문서 포인터.

## 컨텍스트 문서

| 문서                                         | 내용                                 | 언제 읽을까                    |
| -------------------------------------------- | ------------------------------------ | ------------------------------ |
| [`docs/prd.md`](docs/prd.md)                 | 제품 목적, 기능 범위, v2 계획        | 새 기능 추가 전                |
| [`docs/adr.md`](docs/adr.md)                 | 기술 결정 기록 (F=프론트, B=백엔드)  | 기술 결정 시, 아키텍처 질문 시 |
| [`docs/data-schema.md`](docs/data-schema.md) | DB 스키마, TypeScript 타입, API 구조 | API 연동, 타입 정의 시         |
| [`docs/flow.md`](docs/flow.md)               | 사용자 플로우, 데이터 흐름           | UI/UX 수정, 플로우 변경 시     |

---

## 기술 스택

Next.js 16 (App Router) · TypeScript 5 (strict) · Tailwind CSS v4 · Radix UI + Shadcn · NextAuth v5 · pnpm 10 · Jest + Testing Library

---

## 아키텍처 레이어 규칙

```
Page (app/) → Action (actions/) → Service (services/) → lib/server/api
```

| 레이어            | 담당                                           | 금지                                        |
| ----------------- | ---------------------------------------------- | ------------------------------------------- |
| `actions/`        | `"use server"`, 인증, Zod 검증, revalidatePath | API 직접 호출, 비즈니스 로직                |
| `services/`       | API 호출, 쿼리 빌딩, 데이터 변환               | `"use server"`, revalidatePath, requireAuth |
| `lib/server/api/` | HTTP 클라이언트                                | —                                           |

---

## 코딩 규칙

### TypeScript

- `strict: true` — `any` 타입 금지
- Server Actions에 명시적 반환 타입 권장
- 입력값은 Zod로 런타임 검증

### React / Next.js

- **Server Component가 기본** — 클라이언트 상태가 필요할 때만 `"use client"`
- `"use client"` 지시어는 파일 최상단 첫 줄
- `useRouter`, `useState`, `useEffect` 등 훅은 Client Component에서만

### 스타일링

- **시맨틱 클래스 필수** — 하드코딩 색상 금지
  - `gradient-expense` · `gradient-income` · `gradient-budget`
  - `gradient-family` · `gradient-category` · `gradient-primary`
- 인라인 `style={{ }}` 최소화
- `cn()` 유틸리티로 클래스 병합

### 컴포넌트

- `src/components/ui/` Shadcn 컴포넌트 우선 사용
- CVA(class-variance-authority)로 variant 관리

---

## 금지사항

- `alert()` · `confirm()` · `prompt()` → `toast` (sonner) 사용
- `console.log` 프로덕션 코드에 남기지 않기
- `any` 타입 사용 금지
- `NEXT_PUBLIC_` 없는 환경 변수를 클라이언트 번들에 노출 금지

---

## 테스트

- 위치: `src/__tests__/`
- 실행: `pnpm test` / `pnpm test:ci`
- Service 함수는 단위 테스트 권장
- Server Action 테스트: jest.mock 방식 (MSW 아님 — ADR-F09 참고)

---

## PR 체크리스트

1. Server/Client Component 경계가 올바른가?
2. 새 색상/스타일이 시맨틱 클래스를 사용하는가?
3. TypeScript 타입이 충분히 엄격한가?
4. Server Actions에서 인증/권한 확인이 누락되지 않았는가?
5. `alert()` 등 브라우저 기본 UI 사용 여부
6. 에러 처리가 적절한가?
