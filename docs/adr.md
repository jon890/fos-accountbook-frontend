# ADR — fos-accountbook (프론트엔드)

> 프론트엔드(Next.js) 전용 기술 결정 기록.
> 백엔드 결정은 `fos-accountbook-backend/docs/adr.md` 참고.

---

## ADR-F01: Next.js App Router 선택

**결정**: Pages Router 대신 App Router 사용 (Next.js 16)

**이유**:

- Server Components 기본 지원 → 데이터 페칭 단순화, 번들 크기 감소
- Route Groups(`(authenticated)`)로 인증 레이아웃 분리 가능
- Server Actions로 API Route 없이 폼 처리 가능

**트레이드오프**: Next.js 16 일부 API가 beta 상태 → 문서 변경 빈도 높음

---

## ADR-F02: Server Components 우선 전략

**결정**: 클라이언트 상태가 필요한 경우에만 `"use client"` 추가

**이유**:

- 데이터 페칭을 서버에서 처리 → 백엔드 토큰을 클라이언트에 노출하지 않음
- 초기 HTML에 데이터 포함 → 로딩 플리커 없음
- `"use client"` 경계를 말단 컴포넌트로 밀어내 번들 최소화

**결과**: 모든 `page.tsx`는 Server Component. 인터랙션이 필요한 부분만 `*Client.tsx`로 분리

---

## ADR-F03: NextAuth v5 JWT 전략

**결정**: JWT 세션 방식, 프로필 정보를 JWT에 캐싱

**이유**:

- 서버 세션(DB) 없이 stateless 인증 가능
- `profile` 정보를 JWT에 캐싱 → 매 요청마다 `/users/me/profile` API 호출 불필요
- 만료 5분 전 자동 갱신으로 UX 중단 없음

**구현 세부사항**:

- JWT에 `backendAccessToken`, `backendRefreshToken`, `profile` 저장
- Access Token: 백엔드 기준 15분 만료
- 갱신 트리거: `token.backendTokenExpiredAt` 기준 5분 전
- Session TTL: 30일, updateAge: 1일

---

## ADR-F04: Actions/Services 계층 분리

**결정**: `actions/`(인증·검증)와 `services/`(API 호출·로직) 엄격 분리

**이유**:

- `"use server"` 코드와 비즈니스 로직이 섞이면 테스트가 어려움
- Services는 순수 함수에 가까워 단위 테스트 용이
- revalidatePath, requireAuth 같은 Next.js 전용 코드를 Actions에만 격리

**규칙**:

- `actions/`: `"use server"`, 인증, Zod 검증, revalidatePath만 담당
- `services/`: API 호출, 데이터 변환, 쿼리 빌딩만 담당. `"use server"` 사용 금지

---

## ADR-F05: ky HTTP 클라이언트

**결정**: axios 대신 ky 사용

**이유**:

- Node 18+ native fetch 기반 → 추가 polyfill 없음
- 번들 크기: ky ~4KB vs axios ~13KB
- TypeScript 타입 기본 제공
- 자동 재시도 설정이 간결 (`retry` 옵션)

**재시도 설정**: 408, 429, 5xx → 최대 2회 재시도

---

## ADR-F06: Zod 런타임 검증

**결정**: 모든 Server Action 입력값을 Zod로 검증

**이유**:

- TypeScript 타입은 컴파일 타임만 보장 → 런타임 서버 액션에서 악의적 입력 가능
- Zod 스키마에서 TypeScript 타입을 derive → 타입 정의 중복 없음
- 에러 메시지가 필드 단위로 구조화 → UI 폼 에러 표시 직결

---

## ADR-F07: Shadcn + Tailwind CSS v4

**결정**: UI 컴포넌트는 Shadcn 패턴, 스타일링은 Tailwind CSS v4

**이유**:

- Shadcn: 소유권이 있는 UI (복사 방식) → 커스터마이징 자유도 높음
- Tailwind v4: `tailwind.config.js` 불필요, `@theme` 블록으로 CSS 변수 관리
- Radix UI 기반 → 접근성(ARIA) 자동 처리

**색상 규칙**: 시맨틱 클래스(`gradient-expense`, `gradient-income` 등) 사용, 하드코딩 금지

---

## ADR-F08: alert() 대신 sonner 토스트

**결정**: `alert()`, `confirm()`, `prompt()` 전면 금지, sonner 사용

**이유**:

- `alert()`은 모달 차단으로 UX 저하, 스타일 제어 불가
- sonner는 스택형 토스트, 자동 dismiss, 커스텀 스타일 지원

---

## ADR-F09: MSW vs jest.mock — 테스트 방식

**결정**: Server Action 테스트에서 MSW 대신 jest.mock 사용

**이유**:

- Server Actions는 HTTP 레이어 없이 직접 함수 호출
- MSW는 fetch interceptor 기반 → Server Component 환경에서 설정 복잡
- jest.mock으로 `api/client`, `auth-helpers` 모킹 → 단순하고 빠름

**트레이드오프**: 실제 HTTP 요청 경로는 검증 안 됨 → 통합 테스트는 별도 필요

---

## ADR-F10: 반복 지출 상태 관리 — Server Action 방식 유지

**결정**: 폴링·WebSocket 도입 없이 기존 Server Action + revalidatePath 방식 유지

**이유**:

- 스케줄러 실행이 새벽 1시 → 사용자가 앱 사용 중 실시간 업데이트 필요 없음
- 페이지 재방문 시 Server Component가 최신 데이터를 fetch → 충분한 일관성
- 폴링 추가 시 복잡도 증가 대비 사용자 경험 개선 미미

**결과**: 자동 생성된 지출은 다음 날 대시보드 방문 시 반영됨. 실시간 알림은 기존 NotificationBell로 대체

---

## ADR-F11: CI 코드 리뷰 워크플로 설계 (2026-04-04)

**결정**: Claude Code Action 기반 자동 코드 리뷰 워크플로를 아래 방침으로 운영

**핵심 결정 사항**:

| 항목 | 결정 | 이유 |
|------|------|------|
| 트리거 | `opened` + `/review` 수동 | `synchronize` 제거 — 매 push마다 토큰 소비 방지 |
| Review Event | 🔴 → `REQUEST_CHANGES`, 없으면 `APPROVE` | PR 머지 안전망 역할 |
| 일반 코멘트 | 제거 — Review body로 통합 | Review API의 body 필드가 요약 역할. 별도 코멘트는 중복 |
| 코멘트 정리 | minimize (OUTDATED) | delete보다 이력 보존에 유리. 인라인 리뷰 코멘트도 포함 |
| 모델 | orchestrator=sonnet, specialist=haiku | 토큰 비용 최적화. haiku로 충분한 단일 관점 분석 |
| allowed_bots | 필요한 봇만 명시 | `"*"` 와일드카드 보안 위험. 봇 추가 시 명시적 업데이트 |
| diff 필터 | `pnpm-lock.yaml`, `*.lock`, `*.snap` 제외 | 노이즈 감소 |
| Job timeout | 15분 | agent hang 시 불필요한 비용 방지 |
| 프롬프트 관리 | yml 인라인 유지 | 4개 agent 규모에서 파일 분리는 오버엔지니어링. 단일 파일에서 전체 흐름 파악 가능 |
| 소규모 PR 스킵 | 안 함 | 추후 재논의. 현재는 모든 PR 동일 리뷰 |

**트레이드오프**:
- `/review` 수동 트리거는 리뷰를 잊을 수 있음 → `opened` 시 자동 1회 실행으로 보완
- `REQUEST_CHANGES`는 머지를 차단할 수 있음 → 의도적 안전망으로 수용
- minimize된 코멘트가 쌓이면 PR 스레드가 길어질 수 있음 → OUTDATED 라벨로 접힌 상태이므로 가독성 영향 최소

---

## ADR-F12: Page에서 serverApiGet 직접 호출 금지 (2026-04-05)

**결정**: Page(Server Component)에서 `serverApiGet`을 직접 호출하지 않고, 반드시 Action을 통해 데이터를 조회한다.

**이유**:

- ADR-F04의 `Page → Action → Service → lib/server/api` 계층 원칙 위반
- Page가 API 엔드포인트 URL을 직접 알면 안 됨 — Service 계층의 추상화가 무의미해짐
- Action을 거치지 않으면 인증(`requireAuth`) 검증이 누락될 위험
- `serverApiGet` 직접 호출 시 에러 핸들링이 try/catch + console.error로 산발적 → Action의 `ActionResult` 패턴으로 통일

**적용 사례**:

- `transactions/page.tsx`: `serverApiGet("/families")` → `getSelectedFamilyAction()` + `getFamilyCategoriesAction()`
- `categories/page.tsx`: `serverApiGet("/families/.../categories")` → `getFamilyCategoriesAction()`

**redirect 책임**: Action이 아닌 Page에서 결과를 보고 판단한다. Action은 `ActionResult`를 반환하는 순수 controller 역할만 담당하고, 동일 Action을 사용하는 다른 호출처(Client Component 등)에 영향을 주지 않기 위함.

---

## ADR-F13: OKLCH 색 시스템 채택 (2026-05-08)

- **결정**: 모든 디자인 토큰을 OKLCH 색 공간으로 정의한다 (HSL 채널 패턴 폐기). brand 50~900, semantic(income/expense/warning), neutral 0~950, surface(bg/fg/border 등) 모두 `oklch(L C H)` 평면 값.
- **맥락**: Teal fintech 리디자인(`tokens.js` / `styleguide.css` handoff)에서 brand=Teal h=188 + semantic 분리 + dark mode 토큰을 한 번에 정의해야 함. HSL 은 어두운 색 명도가 hue 따라 다르게 인지됨 → 토큰 스케일이 시각적으로 균일하지 않음.
- **대안 기각**:
  - HSL 채널 + shadcn 패턴 유지: 어두운 색에서 명도 들쭉날쭉. brand 50~900 같은 단계 스케일에 부적합.
  - 하이브리드 (shadcn HSL + OKLCH 일부): 동일 토큰을 두 형식으로 관리 → 동기화 사고 위험.
- **트레이드오프**: 실측상 `src/components/ui/` 내 `hsl(var(--))` 패턴 0건 — `:root` 의 토큰 값 OKLCH 교체만으로 자동 호환. 별도 rewrite phase 불필요.
- **적용 범위**: `src/app/globals.css` + `src/components/ui/*`.

---

## ADR-F14: Pretendard Variable 폰트 도입 (2026-05-08)

- **결정**: 메인 sans 폰트를 Geist 에서 **Pretendard Variable** 로 교체. 수치 폰트는 **Inter** 도입 (tabular-nums + `.num` 유틸리티). next/font `localFont` 자체 호스팅 (woff2).
- **맥락**: 가족 단위 가계부 UI 는 한글 비중 100%. Geist 는 라틴 우선 — 한글은 system fallback 으로 떨어져 한 화면에 두 폰트가 섞임. Pretendard 는 한국 fintech 표준에 가까운 한글 가독성.
- **대안 기각**:
  - Geist 유지: 한글 fallback 으로 일관성 결여.
  - Apple SD Gothic Neo (system): 윈도우/안드로이드에서 다른 폰트로 렌더 → cross-platform 비일관.
  - CDN @import: 도메인 의존 + FOUT 위험. self-host woff2 + next/font 가 CLS 방지 + 결정적 빌드.
- **적용 범위**: `src/app/layout.tsx` + `src/app/globals.css` (`--font-sans`, `--font-num`).

---

## ADR-F15: next-themes attribute='data-theme' (2026-05-08)

- **결정**: `next-themes` 의 `attribute` 옵션을 기본 `class` 에서 `data-theme` 으로 전환. dark 토큰 적용 셀렉터는 `[data-theme="dark"]`.
- **맥락**: Handoff 토큰 컨벤션이 `[data-theme="dark"]` 로 정의됨. 또한 기존 `.dark` 셀렉터는 유틸리티 클래스 (`dark:bg-...`) 와 grep 시 동시에 잡혀 토큰-only 변경 추적이 어려움.
- **대안 기각**:
  - `attribute='class'` 유지: handoff 토큰을 그대로 import 하려면 셀렉터를 `.dark` 로 일괄 치환해야 하고, Tailwind v4 의 `dark:` 변형이 `.dark` 클래스 의존이라 둘 사이의 동작 차이를 매번 확인해야 함.
  - 두 셀렉터 병행 (`.dark, [data-theme="dark"]`): 토큰 정의 중복.
- **트레이드오프**: Tailwind v4 의 `dark:` 변형이 기본으로 `.dark` 클래스를 본다 — `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` 커스텀 정의 필요. plan001 phase 1 에서 globals.css 에 추가.
- **적용 범위**: `src/app/providers.tsx` (or wherever `ThemeProvider` is) + `src/app/globals.css`.
