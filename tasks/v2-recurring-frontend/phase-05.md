# Phase 5: 대시보드 고정비 카드

## 컨텍스트

`fos-accountbook` Next.js 프론트엔드. 반복 지출 기능 구현 중.
Phase 4에서 거래내역 고정지출 탭이 완료된 상태다.

대시보드에 "이달 고정비 OOO원" 요약 카드를 추가한다.
카드 클릭 시 `/transactions?tab=recurring`으로 이동한다.

반드시 먼저 읽을 문서:
- `docs/flow.md` — Flow 14 (대시보드 고정비 카드)
- `docs/prd.md` — v2 대시보드 카드 명세

기존 코드 파악:
- `src/app/(authenticated)/dashboard/` — 대시보드 페이지 구조
- `src/components/dashboard/` — 기존 카드 컴포넌트 패턴
- 기존 StatsCards 컴포넌트 읽기 (4개 카드 구조 파악)

## 목표

대시보드에 반복 지출 월 합계 카드를 추가한다.

## 작업 목록

- [ ] 대시보드 페이지 + 카드 컴포넌트 구조 파악

- [ ] `getRecurringExpensesTotalAction()` 호출 추가
  - 대시보드 Server Component에서 병렬 fetch (`Promise.all` 또는 개별 await)
  - 기존 `getDashboardStatsAction()` 등과 함께 호출

- [ ] 고정비 카드 컴포넌트 추가 또는 기존 카드 영역에 통합
  - 표시: "이달 고정비" 레이블 + 금액 (원화 포맷)
  - 위치: 기존 4개 요약 카드 아래 새 행
  - 클릭: `href="/transactions?tab=recurring"` 링크

## 성공 기준

- `pnpm build` 성공
- 대시보드에 고정비 카드가 렌더링됨

## 주의사항

- 기존 4개 카드 레이아웃에 영향 없어야 함
- 카드 스타일: 기존 대시보드 카드 시맨틱 클래스 패턴 따름
- 금액 표시: 기존 통화 포맷터 함수 재사용
- `any` 타입 금지
- API 실패 시 카드 숨기거나 0원 표시 (대시보드가 깨지면 안 됨)
