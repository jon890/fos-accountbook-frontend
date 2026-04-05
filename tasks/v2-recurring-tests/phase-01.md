# Phase 1: requireAuth 통일 + createAction 테스트 보강

## 목적

`createRecurringExpenseAction`만 `requireAuthOrRedirect()`를 사용하고 나머지 4개는 `requireAuth()`를 사용.
Sheet(모달) 안에서 호출되는 Action이므로 전부 `requireAuth()`로 통일한다.
기존 테스트에 누락된 시나리오도 추가한다.

## 작업

### 1.1 requireAuth 통일

- 파일: `src/actions/recurring-expense/index.ts`
- `createRecurringExpenseAction` 함수 내 `requireAuthOrRedirect()` → `requireAuth()`로 변경
- import에서 `requireAuthOrRedirect` 제거 (다른 곳에서 안 쓰면)

### 1.2 기존 테스트 수정

- 파일: `src/__tests__/actions/recurring-expense/createRecurringExpenseAction.test.ts`
- mock 대상: `requireAuthOrRedirect` → `requireAuth`로 변경
- 미인증 테스트 시나리오도 `requireAuth` 기반으로 수정

### 1.3 createAction 추가 시나리오

- **familyUuid 미선택**: `getSelectedFamilyUuid` → `null` 반환 시 `{ success: false }` 확인
- **Service 호출 실패**: `createRecurringExpense`가 Error throw → `handleActionError`로 안전 처리 확인

### 1.4 검증

```bash
pnpm test -- --testPathPattern="createRecurringExpenseAction"
```

## 완료 조건

- [ ] `createRecurringExpenseAction`이 `requireAuth()` 사용
- [ ] 기존 4개 테스트 통과
- [ ] familyUuid 미선택 테스트 추가
- [ ] Service 에러 처리 테스트 추가
- [ ] `pnpm test` 전체 통과
