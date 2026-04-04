# Phase 3: get/total Action 테스트

## 목적

조회 Action들도 인증, familyUuid 검증, 에러 처리가 올바른지 확인한다.
특히 `getRecurringExpensesTotalAction`은 대시보드 카드가 직접 의존하는 API이다.

## 작업

### 3.1 getRecurringExpensesAction 테스트

- 파일: `src/__tests__/actions/recurring-expense/getRecurringExpensesAction.test.ts`

#### 시나리오

| TC | 설명 | 검증 |
|----|------|------|
| 정상 조회 | → service 호출 + `{ success: true, data }` |
| month 파라미터 전달 | month="2026-04" → service에 그대로 전달 |
| month 미전달 | → service에 undefined 전달 |
| 미인증 | requireAuth 에러 → `{ success: false }` |
| familyUuid 미선택 | → familyNotSelected 에러 |

### 3.2 getRecurringExpensesTotalAction 테스트

- 파일: `src/__tests__/actions/recurring-expense/getRecurringExpensesTotalAction.test.ts`

#### 시나리오

| TC | 설명 | 검증 |
|----|------|------|
| 정상 합계 조회 | service가 72000 반환 → `{ success: true, data: 72000 }` |
| 미인증 | requireAuth 에러 → `{ success: false }` |
| familyUuid 미선택 | → familyNotSelected 에러 |
| Service 에러 | throw → handleActionError |

### 3.3 검증

```bash
pnpm test -- --testPathPattern="recurring-expense"
```

## 완료 조건

- [ ] getRecurringExpensesAction: 5개 시나리오 통과
- [ ] getRecurringExpensesTotalAction: 4개 시나리오 통과
- [ ] 기존 create/update/delete 테스트도 깨지지 않음
- [ ] `pnpm test` 전체 통과
