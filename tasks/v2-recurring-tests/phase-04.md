# Phase 4: 전체 빌드 검증

## 목적

모든 변경 사항이 기존 테스트와 호환되는지 최종 확인한다.

## 작업

### 4.1 전체 테스트 실행

```bash
pnpm test:ci
```

### 4.2 타입 검사

```bash
pnpm exec tsc --noEmit
```

### 4.3 검증 체크리스트

- [ ] `pnpm test:ci` 전체 통과
- [ ] `tsc --noEmit` 에러 없음
- [ ] createRecurringExpenseAction: 6개 시나리오
- [ ] updateRecurringExpenseAction: 6개 시나리오
- [ ] deleteRecurringExpenseAction: 5개 시나리오
- [ ] getRecurringExpensesAction: 5개 시나리오
- [ ] getRecurringExpensesTotalAction: 4개 시나리오
- [ ] 총 26개 이상 recurring-expense 관련 테스트

### 4.4 코드 변경 요약 리뷰

- `src/actions/recurring-expense/index.ts`: `requireAuthOrRedirect` → `requireAuth` (1줄 변경)
- `src/__tests__/actions/recurring-expense/`: 테스트 파일 4개 추가/수정
- `docs/testing-strategy.md`: 신규

### 4.5 실패 시

- 특정 테스트만 실패: mock 구조 확인 (import 순서, jest.mock 위치)
- tsc 에러: 타입 불일치 확인 (ActionResult 제네릭 등)
- 전체 실패: jest 설정 또는 모듈 해석 문제 확인

## 완료 조건

- [ ] `pnpm test:ci` 전체 통과
- [ ] `tsc --noEmit` 에러 없음
