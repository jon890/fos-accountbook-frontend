# Phase 4: 거래내역 — 고정지출 탭 통합

## 컨텍스트

`fos-accountbook` Next.js 프론트엔드. 반복 지출 기능 구현 중.
Phase 3에서 UI 컴포넌트가 완료된 상태다.

현재 거래내역 페이지(`src/app/(authenticated)/transactions/`)에는 지출/수입 탭이 있다.
여기에 "고정지출" 탭을 3번째 탭으로 추가한다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 아키텍처 규칙
- `docs/flow.md` — Flow 10(등록), 11(조회), 12(수정/삭제)

기존 코드 파악:
- `src/app/(authenticated)/transactions/` 디렉터리 전체 구조와 파일 읽기
- 현재 탭 구조 파악 (Tabs 컴포넌트, 탭 항목들)

## 목표

거래내역 페이지에 "고정지출" 탭을 추가하고, 해당 탭에서 반복 지출 목록을 표시한다.

## 작업 목록

- [ ] `src/app/(authenticated)/transactions/` 구조 파악 (Read로 파일들 확인)

- [ ] 거래내역 페이지 탭에 "고정지출" 탭 추가
  - 기존 탭 컴포넌트에 `value="recurring"` 탭 추가
  - URL 기반 탭 선택이 있다면 `?tab=recurring` 쿼리 파라미터 지원

- [ ] 고정지출 탭 콘텐츠 구현 (Server Component 우선)
  - `getRecurringExpensesAction()` 호출 → `RecurringExpenseList` 렌더링
  - 카테고리 목록도 함께 fetch (기존 카테고리 조회 Action 사용)
  - 현재 월 기준 데이터 표시

- [ ] 필요 시 Client Component 분리
  - 탭 전환 상태가 Client 상태면 `TransactionsClient.tsx` 또는 유사 파일에 통합

## 성공 기준

- `pnpm build` 성공
- 거래내역 페이지에 고정지출 탭이 존재

## 주의사항

- 기존 탭 구조를 최대한 보존 — 기존 지출/수입 탭 기능에 영향 없어야 함
- Server Component를 유지할 수 있으면 `"use client"` 추가하지 않음
- 기존 코드의 탭 구현 방식을 그대로 따름 — 독자적 방식 도입 금지
- `any` 타입 금지

## Blocked 조건

기존 거래내역 페이지 구조가 예상과 너무 달라 탭 추가 방법을 결정할 수 없으면:
`PHASE_BLOCKED: 거래내역 페이지 구조 파악 필요 — {발견된 구조 설명}`
