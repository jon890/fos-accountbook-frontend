# Phase 3: UI 컴포넌트

## 컨텍스트

`fos-accountbook` Next.js 프론트엔드. 반복 지출 기능 구현 중.
Phase 2에서 Server Actions가 완료된 상태다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 컴포넌트 규칙, 시맨틱 클래스, 금지사항
- `docs/code-architecture.md` — Server/Client 컴포넌트 분리 패턴
- `docs/flow.md` — Flow 10(등록), 11(조회), 12(수정/삭제)

기존 코드 참조 (패턴 파악용):
- `src/components/expenses/dialogs/` — Sheet/Dialog 컴포넌트 패턴
- `src/components/expenses/list/` — 목록 + 아코디언 패턴
- `src/components/ui/` — Shadcn 기본 컴포넌트 (Sheet, Button, Input 등)

## 목표

반복 지출 관련 UI 컴포넌트 4개를 추가한다.

## 작업 목록

- [ ] 기존 expense 컴포넌트를 읽어 Sheet, 아코디언, 폼 패턴 파악

- [ ] `src/components/recurring-expense/AddRecurringExpenseSheet.tsx`
  - `"use client"` (폼 상태 관리 필요)
  - Shadcn `Sheet` 컴포넌트 사용
  - 폼 필드: 이름(Input), 카테고리(Select), 금액(Input type=number), 매월 N일(Input type=number, 1~28)
  - 저장 시: `createRecurringExpenseAction()` 호출 → toast 성공("내일부터 매월 N일에 자동 등록됩니다") / 실패
  - Props: `open: boolean`, `onOpenChange: (open: boolean) => void`, `categories: Category[]`

- [ ] `src/components/recurring-expense/EditRecurringExpenseSheet.tsx`
  - `"use client"`
  - 기존 값 pre-fill
  - 저장 시: `updateRecurringExpenseAction()` → toast("다음 스케줄부터 반영됩니다")
  - Props: `open: boolean`, `onOpenChange`, `recurringExpense: RecurringExpense`, `categories: Category[]`

- [ ] `src/components/recurring-expense/RecurringExpenseItem.tsx`
  - `"use client"` (아코디언 상태 관리)
  - 아코디언 패턴 (기존 ExpenseItem 참조)
  - 표시 정보: 이름, 금액, 매월 N일, 상태 아이콘(✓ generatedThisMonth=true / ○ false)
  - ✓ 표시: `CheckCircle` 아이콘 (green)
  - ○ 표시: `Circle` 아이콘 (gray)
  - 아코디언 펼침: 수정 버튼, 삭제 버튼
  - 삭제: `AlertDialog` 확인 → `deleteRecurringExpenseAction()`
  - Props: `recurringExpense: RecurringExpense`, `categories: Category[]`

- [ ] `src/components/recurring-expense/RecurringExpenseList.tsx`
  - Server Component (데이터 없으면 Client도 가능)
  - 이달 합계 카드: "이번달 고정비 {totalMonthlyAmount}원"
  - 목록: `RecurringExpenseItem` 목록 렌더링
  - "+ 고정지출 추가" 버튼 → `AddRecurringExpenseSheet` 열기
  - 빈 상태: "등록된 고정지출이 없습니다" 메시지
  - Props: `data: GetRecurringExpensesResponse`, `categories: Category[]`

## 성공 기준

- `pnpm build` 성공 (타입 오류, lint 오류 없음)
- 4개 컴포넌트 파일 존재

## 주의사항

- `alert()`, `confirm()` 절대 금지 → `toast` (sonner), `AlertDialog` 사용
- 하드코딩 색상 금지 → 시맨틱 클래스 사용
- `any` 타입 금지
- `"use client"` 지시어는 파일 최상단 첫 줄
- `console.log` 남기지 않음
- 인라인 `style={{ }}` 최소화
