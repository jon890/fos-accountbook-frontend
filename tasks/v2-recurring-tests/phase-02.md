# Phase 2: update/delete Action 테스트

## 목적

`updateRecurringExpenseAction`과 `deleteRecurringExpenseAction`에 대한 테스트가 전무하다.
CRUD 4개 중 2개가 무방비 상태이므로 반드시 추가한다.

## 작업

### 2.1 updateRecurringExpenseAction 테스트

- 파일: `src/__tests__/actions/recurring-expense/updateRecurringExpenseAction.test.ts`
- mock 패턴: createAction 테스트와 동일한 구조

#### 시나리오

| TC | 설명 | 검증 |
|----|------|------|
| 정상 수정 | 유효한 uuid + partial data → service 호출 + revalidatePath("/transactions") |
| uuid 빈 값 | uuid="" → `{ success: false }`, service 미호출 |
| Zod 부분 검증 | dayOfMonth만 전달 → partial schema 통과 |
| Zod 실패 | dayOfMonth=29 → `{ success: false }` |
| 미인증 | requireAuth 에러 → `{ success: false }` |
| familyUuid 미선택 | → familyNotSelected 에러 |

### 2.2 deleteRecurringExpenseAction 테스트

- 파일: `src/__tests__/actions/recurring-expense/deleteRecurringExpenseAction.test.ts`

#### 시나리오

| TC | 설명 | 검증 |
|----|------|------|
| 정상 삭제 | 유효한 uuid → service 호출 + revalidatePath("/transactions") |
| uuid 빈 값 | uuid="" → `{ success: false }`, service 미호출 |
| 미인증 | requireAuth 에러 → `{ success: false }` |
| familyUuid 미선택 | → familyNotSelected 에러 |
| Service 에러 | deleteRecurringExpense throw → handleActionError |

### 2.3 검증

```bash
pnpm test -- --testPathPattern="recurring-expense"
```

## 완료 조건

- [ ] updateRecurringExpenseAction: 6개 시나리오 통과
- [ ] deleteRecurringExpenseAction: 5개 시나리오 통과
- [ ] 기존 createAction 테스트도 깨지지 않음
- [ ] `pnpm test` 전체 통과
