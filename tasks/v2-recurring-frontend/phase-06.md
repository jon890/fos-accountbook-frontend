# Phase 6: 테스트 + 빌드 검증

## 컨텍스트

`fos-accountbook` Next.js 프론트엔드. 반복 지출 기능 구현 중.
Phase 1~5에서 전체 기능 구현이 완료된 상태다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 테스트 규칙 (jest.mock 방식, src/__tests__/ 위치)

기존 코드 참조:
- `src/__tests__/actions/expense/` — Action 테스트 패턴
- `jest.config.js`, `jest.setup.js` — 테스트 설정

## 목표

반복 지출 서비스 함수와 Action에 대한 단위 테스트를 추가하고, 전체 빌드를 검증한다.

## 작업 목록

- [ ] 기존 테스트 파일 하나 읽어 jest.mock 패턴 파악

- [ ] `src/__tests__/actions/recurring-expense/` 디렉터리 생성

- [ ] `createRecurringExpenseAction.test.ts` 작성
  - jest.mock으로 `@/services/recurring-expense` 모킹
  - jest.mock으로 `@/lib/server/auth` (requireAuthOrRedirect) 모킹
  - 테스트 케이스:
    1. `유효한_입력으로_등록_성공` — mock 서비스 호출 확인
    2. `dayOfMonth_29이상_실패` — Zod 검증 오류 반환 확인
    3. `금액_0이하_실패` — Zod 검증 오류 반환 확인
    4. `미인증_리다이렉트` — requireAuthOrRedirect 호출 확인

- [ ] 전체 테스트 실행:
  ```bash
  pnpm test
  ```

- [ ] 전체 빌드 실행:
  ```bash
  pnpm build
  ```

## 성공 기준

- `pnpm test` 새로 추가한 테스트 포함 전체 PASS
- `pnpm build` 성공 (타입 오류, lint 오류 없음)

## 주의사항

- MSW 사용 금지 — jest.mock 방식만 사용 (ADR-F09)
- 테스트 파일은 `src/__tests__/` 하위에 위치
- 기존 테스트가 깨지지 않도록 주의
- `pnpm build` 실패 시 TypeScript 오류 메시지 읽고 수정 — 임의로 `as any` 캐스팅 금지

## Blocked 조건

이해할 수 없는 타입 오류나 빌드 오류가 발생하면:
`PHASE_BLOCKED: 빌드 오류 해결 불가 — {오류 내용}`
