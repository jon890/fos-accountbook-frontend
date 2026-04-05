# Phase 2: Server Actions (Zod 검증)

## 컨텍스트

`fos-accountbook` Next.js 프론트엔드. 반복 지출 기능 구현 중.
Phase 1에서 TypeScript 타입과 API 서비스 함수가 완료된 상태다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — Actions 계층 규칙, Zod 검증, 금지사항
- `docs/code-architecture.md` — Server Action 표준 구조
- `docs/flow.md` — 반복 지출 플로우 (Flow 10, 12)

기존 코드 참조 (패턴 파악용):
- `src/actions/expense/` — Server Action 패턴 (requireAuthOrRedirect, getSelectedFamilyUuid, Zod 검증, revalidatePath)
- `src/lib/schemas/` 또는 `src/actions/` 내 Zod 스키마 패턴

## 목표

반복 지출 Server Actions를 추가한다.

## 작업 목록

- [ ] `src/actions/recurring-expense/index.ts` 생성
  - 파일 최상단 첫 줄: `"use server";`
  - 기존 expense action 파일의 구조를 그대로 따름

  **Zod 스키마**:
  ```typescript
  const createRecurringExpenseSchema = z.object({
    name: z.string().trim().min(1, "이름은 필수입니다"),
    categoryUuid: z.string().uuid("카테고리를 선택해주세요"),
    amount: z.number().positive("금액은 0보다 커야 합니다"),
    dayOfMonth: z.number().int().min(1).max(28, "1~28일만 선택 가능합니다"),
  });

  const updateRecurringExpenseSchema = createRecurringExpenseSchema.partial();
  ```

  **Action 함수**:
  - `createRecurringExpenseAction(data: unknown)` — 등록
    - `requireAuthOrRedirect()` → `getSelectedFamilyUuid()` → Zod 검증 → 서비스 호출
    - `revalidatePath("/transactions")`, `revalidatePath("/dashboard")`
  - `updateRecurringExpenseAction(uuid: string, data: unknown)` — 수정
    - revalidatePath: `/transactions`
    - 성공 toast 메시지: "다음 스케줄부터 반영됩니다"
  - `deleteRecurringExpenseAction(uuid: string)` — 삭제 (ENDED)
    - revalidatePath: `/transactions`
  - `getRecurringExpensesAction(month?: string)` — 목록 조회
  - `getRecurringExpensesTotalAction()` — 대시보드용 월 합계

## 성공 기준

- `pnpm build` 성공
- `src/actions/recurring-expense/index.ts` 존재

## 주의사항

- `"use server"` 는 파일 최상단 첫 줄에만 위치
- `revalidatePath`, `requireAuth`는 Actions에만, Services에 절대 넣지 않음
- `any` 타입 금지
- 에러 반환 형식은 기존 Action 패턴과 동일하게 (`{ success: false, error: ... }`)
- Zod `safeParse` 사용 — `parse`로 던지지 않음
