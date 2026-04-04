# Phase 1: TypeScript 타입 + API 서비스

## 컨텍스트

`fos-accountbook`는 Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 기반 가족 가계부 프론트엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook`

반복 지출(recurring expense) 기능을 위한 타입 정의와 API 서비스 함수를 추가한다.
백엔드 API는 이미 구현되어 있다고 가정한다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — TypeScript 규칙, Services 계층 규칙
- `docs/code-architecture.md` — 계층 구조, services/ 역할
- `docs/data-schema.md` — RecurringExpense TypeScript 타입, API 엔드포인트

기존 코드 참조 (패턴 파악용):
- `src/types/` 디렉터리 구조
- `src/services/expense/` — API 서비스 함수 패턴
- `src/lib/server/api/` — HTTP 클라이언트 사용법

## 목표

TypeScript 타입과 API 서비스 함수를 추가한다.

## 작업 목록

### 타입 정의

- [ ] `src/types/recurring-expense.ts` 생성
  - 아래 인터페이스 정의:
  ```typescript
  import type { CategoryInfo } from "@/types/category"; // 또는 기존 CategoryInfo 경로 파악

  export interface RecurringExpense {
    uuid: string;
    familyUuid: string;
    categoryUuid: string;
    category: CategoryInfo;
    name: string;
    amount: number;
    dayOfMonth: number; // 1~28
    status: "ACTIVE" | "ENDED";
    generatedThisMonth: boolean;
    createdAt: string;
    updatedAt: string;
  }

  export interface GetRecurringExpensesResponse {
    totalMonthlyAmount: number;
    items: RecurringExpense[];
  }

  export interface CreateRecurringExpenseRequest {
    name: string;
    categoryUuid: string;
    amount: number;
    dayOfMonth: number;
  }

  export interface UpdateRecurringExpenseRequest {
    name?: string;
    categoryUuid?: string;
    amount?: number;
    dayOfMonth?: number;
  }
  ```

### API 서비스 함수

- [ ] `src/services/recurring-expense/index.ts` 생성
  - `"use server"` 사용 금지 (서비스 레이어는 순수 함수)
  - 기존 서비스 파일 패턴 그대로 따름 (ky HTTP 클라이언트 사용)
  - 함수 목록:
    - `getRecurringExpenses(familyUuid: string, month?: string): Promise<GetRecurringExpensesResponse>`
      → `GET /api/v1/families/{familyUuid}/recurring-expenses?month={month}`
    - `getRecurringExpensesMonthlyTotal(familyUuid: string): Promise<number>`
      → `GET /api/v1/families/{familyUuid}/recurring-expenses/monthly-total`
    - `createRecurringExpense(familyUuid: string, data: CreateRecurringExpenseRequest): Promise<RecurringExpense>`
      → `POST /api/v1/families/{familyUuid}/recurring-expenses`
    - `updateRecurringExpense(familyUuid: string, uuid: string, data: UpdateRecurringExpenseRequest): Promise<RecurringExpense>`
      → `PUT /api/v1/families/{familyUuid}/recurring-expenses/{uuid}`
    - `deleteRecurringExpense(familyUuid: string, uuid: string): Promise<void>`
      → `DELETE /api/v1/families/{familyUuid}/recurring-expenses/{uuid}`

## 성공 기준

- `pnpm build` 타입 오류 없이 성공
- `src/types/recurring-expense.ts` 존재
- `src/services/recurring-expense/index.ts` 존재

## 주의사항

- `any` 타입 절대 금지
- `"use server"` 서비스 레이어에 추가하지 않음
- `CategoryInfo` 타입 경로: 기존 코드에서 import 경로 확인 후 동일하게 사용
- API 응답 구조: `{ success: true, data: T }` 래퍼 → 기존 서비스에서 `.data` 추출하는 방식 따름
- 백엔드 BigDecimal → 문자열 → `Number()` 변환 패턴 참조
