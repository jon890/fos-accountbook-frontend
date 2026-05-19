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

## ADR-F05: ky HTTP 클라이언트 (2026-05-09 v2 갱신)

**결정**: axios 대신 ky 사용. **2026-05-09**: ky 1.x → 2.x 업그레이드 (plan004).

**이유**:

- Node 22+ native fetch 기반 → 추가 polyfill 없음
- 번들 크기: ky ~4KB vs axios ~13KB
- TypeScript 타입 기본 제공
- 자동 재시도 설정이 간결 (`retry` 옵션)

**재시도 설정**: 408, 413, 429, 500, 502, 503, 504 → 최대 2회 재시도

**ky 2.x 마이그레이션 결정 (2026-05-09)**:

| 항목 | 결정 | 이유 |
|---|---|---|
| URL 베이스 옵션 | `prefixUrl` → `prefix` rename | 단순 string join 으로 현재 동작 유지. `baseUrl` 은 standard URL resolution 으로 leading slash 의미 달라져 회귀 위험 |
| Hook signature | 단일 state object (`{request, options, retryCount, ...}`) | ky 2.0 강제 변경. 기존 위치 인자 폐지 |
| `.json()` 빈 body 처리 | 204 / 빈 body 응답 분기에 명시 가드 | ky 2.0 이 빈 body / 204 에서 throw — 우리 응답 envelope (`ApiResponse<T>`) 가 모든 200 응답을 가정하므로 가드 필수 |
| `HTTPError.data` 활용 | `beforeError` / catch 의 `.json().catch(() => null)` 패턴 제거 | ky 2.0 이 자동 파싱 + resource leak 해결. 코드 단순화 |
| `beforeError` 시그니처 | 객체 인자 + 모든 에러 받음 (HTTPError 한정 아님) | ky 2.0 변경. `error.response` 가 undefined 가능 → 명시 가드 |

**적용 범위**: `src/lib/server/api/client.ts`, `src/__mocks__/ky.ts`.

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

## ADR-F11: CI 코드 리뷰 워크플로 설계 (2026-04-04, 2026-05-09 개정)

**결정**: Claude Code Action 기반 자동 코드 리뷰 워크플로를 아래 방침으로 운영. fos-blog 정착 패턴과 동일화 (2026-05-09 개정).

**핵심 결정 사항**:

| 항목 | 결정 | 이유 |
|------|------|------|
| 트리거 | `opened` + `/review` 수동 | `synchronize` 제거 — 매 push마다 토큰 소비 방지 |
| Review Event | 항상 `COMMENT` (🔴 있어도 차단 안 함) | 리뷰는 권고. 머지 차단은 인간 reviewer 책임. `REQUEST_CHANGES` 사고 회피 |
| 일반 요약 댓글 | 인라인 리뷰와 분리해 1회 추가 게시 | Conversation 탭 가시성 확보. inline 만 두면 Files changed 탭에 묻힘 |
| 댓글 정리 | DELETE (REST) | minimize 누적 시 PR 스레드 시각 답답. 이력은 GitHub event log 로 충분 |
| Dummy 댓글 자동 정리 | post-step bash 로 길이/regex/severity 마커 검사 후 삭제 | Claude action 이 자연어 sanity check 무시하고 placeholder 게시하는 사고 (fos-blog PR #114) 강제 차단 |
| literal `\n` 자동 보정 | post-step bash 로 검출 후 perl 교체 + PATCH API | Claude action 이 HEREDOC 무시하고 `--body "...\n..."` 호출 시 literal 두 글자 박힘 (PR #208 사고). 보정 후 정상 줄바꿈 |
| 모델 | orchestrator=sonnet, specialist=haiku | 토큰 비용 최적화. haiku로 충분한 단일 관점 분석 |
| allowed_bots | `"*"` | 광범위 허용 — Dependabot/Claude 모두 차단되지 않음. 보안 검증은 specialist agent 가 담당 |
| diff 필터 | `pnpm-lock.yaml`, `*.lock`, `*.snap` 제외 | 노이즈 감소 |
| Job timeout | 15분 | agent hang 시 불필요한 비용 방지 |
| Check Run 수동 등록 | `issue_comment` 트리거 시 수동 생성 | issue_comment workflow run 이 PR Checks 탭에 자동 노출 안 됨 — 수동 Check Run 으로 진행 상태 가시화 |
| 프롬프트 관리 | yml 인라인 유지 | 4개 agent 규모에서 파일 분리는 오버엔지니어링 |
| 소규모 PR 스킵 | 안 함 | 모든 PR 동일 리뷰 |

**대안 기각**:
- `REQUEST_CHANGES` event 유지: PR 머지 버튼 비활성으로 사용자가 매번 dismiss 해야 함 + Reviews 탭 빨간 X 가 시각적으로 부정적. 안전망 가치보다 마찰 비용 큼.
- minimize 유지: PR 스레드에 minimized 블록 누적 → "Show outdated" 토글이 보이고 답답. 이력은 GitHub Activity 탭에서 보존.
- 단일 review API 호출 (요약을 review body 안에): Files changed 탭에만 보이고 Conversation 탭에서 요약 가시성 떨어짐.

**HEREDOC 패턴 강제 (실측 사고)**:
- 일반 요약 댓글은 반드시 `gh pr comment --body-file - <<'COMMENT_EOF' ... COMMENT_EOF` HEREDOC 으로 stdin 전달.
- `gh pr comment --body "...\n..."` 패턴은 shell 이 `\n` 을 literal 두 글자로 전달해 댓글 줄바꿈 깨짐.
- review JSON body 안의 `\n` 은 JSON parser 가 해석하므로 정상.

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
- **예외**: white/black alpha overlay (`rgba(255,255,255,α)`, `rgba(0,0,0,α)`) 는 functional alpha 표현이라 OKLCH 의무화 대상 외. `.glass`, `.gradient-card-overlay`, `.hover-lift` 등 글래스/딤 효과에 한정. brand/semantic 색은 OKLCH 강제.
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

---

## ADR-F16: 카테고리 월 분포는 Server Action 측 집계 (2026-05-08)

- **결정**: 대시보드의 카테고리별 월 합계는 backend 신규 endpoint 없이 기존 `GET /expenses?month=YYYY-MM` 응답을 `services/dashboard/dashboard-service.ts` 의 `getMonthlyCategoryBreakdown(familyUuid, year, month)` 에서 집계한다.
- **맥락**: handoff dashboard 의 "카테고리 분포" 가 핵심 강조 요소. backend 에 신규 endpoint 신설 시 frontend plan002 이 backend 일정에 묶임. 1가구 월 거래 100~300건 추정 → 응답 사이즈 50~150KB 수준, Server Action 집계로 충분.
- **대안 기각**:
  - backend 신규 endpoint (`GET /families/{u}/stats/category-breakdown`): 가장 깔끔하나 frontend 가 backend 일정 의존. 추후 row 수 임계 초과 시 plan 분리해 재검토.
  - 기존 `getDashboardStats` 응답에 카테고리 합계 끼워넣기: stats DTO 비대해지고 다른 호출처가 불필요 데이터 수신.
- **임계 트리거** (재논의 조건): 가구당 월 평균 거래수 500건 초과 또는 dashboard 진입 TTI 700ms 초과 측정 시 backend endpoint 분리 검토.
- **적용 범위**: `services/dashboard/dashboard-service.ts`, `actions/dashboard/get-monthly-category-breakdown-action.ts`, `services/analytics/analytics-service.ts` (plan006 — `getMonthlyCategoryBreakdown` 을 service→service 재사용해 월별 추이/전월 delta 클라 집계. backend issue [#126](https://github.com/jon890/fos-accountbook-backend/issues/126) 로 endpoint 분리 트랙 병행).

## ADR-F17: URL searchParams ↔ Client state 동기화는 draft 패턴 (2026-05-11)

- **결정**: URL searchParams 를 입력 폼 (input/select) 의 초기값으로 쓰면서 외부 URL 변경 (브라우저 뒤로/앞으로, 다른 컴포넌트의 router.replace) 에도 추종해야 할 때, **useEffect 안 setState 가 아닌 derived value 패턴** 을 사용한다.

  ```tsx
  // ✅ draft 패턴
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? searchParams.get("q") ?? "";
  // 사용자 입력: setDraft(newValue)
  // URL apply 후: setDraft(null) — URL 단일 소스 복귀
  ```

- **맥락**: React 19 의 `react-hooks/cascading-render` 규칙이 `useEffect` 안 `setState` 직접 호출을 차단. URL 변경을 감지해서 input state 를 다시 set 하는 직관적 코드가 lint 오류 + 잠재적 cascading render 위험. 사용자 입력 (draft) 과 URL (current) 의 두 진실원을 단일 derived value 로 합쳐 effect 제거.

- **대안 기각**:
  - `useEffect(() => setState(currentValue), [currentValue])`: eslint rule 위반 + cascading render 위험.
  - URL 만 진실원 + 모든 입력 즉시 router.replace: 사용자 타이핑마다 navigation 발생 → 성능/UX 저하.
  - `key={searchParams}` 로 force-remount: 컴포넌트 내부 다른 state (Popover open 등) 도 reset 되는 부수효과.

- **적용 범위**: URL searchParams 기반 client 필터 컴포넌트 전반. 첫 적용 사례 — `AmountRangeFilter.tsx` (plan003). props 기반 추종에도 변형 적용 가능 (`AddExpenseDialog.tsx` 의 `activeTypeDraft ?? defaultType`, plan005).

- **예외 — 외부 부수효과 진입 신호 (fetch trigger, subscription 등)**: `useEffect` 안 `setState(true)` 가 명백히 필요한 경우 (예: dialog open 시 fetch 시작 → `setIsLoadingCategories(true)` → fetch 결과로 `false`. derived value 로 대체 불가 — fetch 실패 시 영원히 loading) 는 해당 라인에 `// eslint-disable-next-line react-hooks/set-state-in-effect` + 1줄 사유 주석으로 허용. 신규 코드 작성 시 우선 derived 시도 → 막힐 경우만 적용. 첫 적용 사례 — `AddExpenseDialog.tsx:67` (plan005).

---

## ADR-F18: react-day-picker → @daypicker/react 패키지 이전 (2026-05-11)

- **결정**: `react-day-picker` v9 → v10 메이저 업그레이드 + 패키지명을 공식 권장 신 namespace 인 `@daypicker/react` 로 이전. v10 의 폐기 props/event handler 일괄 교체.
- **맥락**: PR #222 (Dependabot) 가 단순 dep bump 만 제안 — 폐기 API 제거된 v10 에서 코드 마이그레이션 누락 시 빌드/런타임 회귀. 또 v10 공식 권장이 신 namespace `@daypicker/react` 로 이동 (장기 수명 + non-Gregorian calendar 들도 `@daypicker/*` 스코프). frontend 사용처는 단 2 파일 (`src/components/ui/calendar.tsx` shadcn wrapper + `src/components/dashboard/CalendarView.tsx`) 로 작아 한 PR 에 dep+코드 통합 적합.
- **대안 기각**:
  - `react-day-picker` 패키지명 유지: v10 호환 OK 이지만 신 namespace 가 공식 표준. 후속 add-on 패키지 (`@daypicker/persian` 등) 와 일관성.
  - v9 stick: 보안/유지보수 리스크 누적. 메이저 upgrade 가 작아 미루지 않는 게 합리적.
- **트레이드오프**: import 경로 + `style.css` 경로 갱신 필요. `DayPicker` API 자체는 동일 export. peer dep 충돌 점검 필요 (구 이름 의존 다른 dep 가 있으면).
- **폐기 prop 교체 매핑**:
  - `fromMonth/toMonth` → `startMonth/endMonth`
  - `fromDate/toDate` → `hidden={{ before/after }}`
  - `initialFocus` → `autoFocus`
  - `onWeekNumberClick/onDayKey*/onDayPointer*/onDayTouch*` → 커스텀 `WeekNumber`/`DayButton` 컴포넌트
- **적용 범위**: `package.json`, `src/components/ui/calendar.tsx`, `src/components/dashboard/CalendarView.tsx`.

---

## ADR-F19: TypeScript 5.9 → 6.0 메이저 이전 + breaking 대응 패턴 (2026-05-11)

- **결정**: TypeScript 컴파일러를 `^5` 에서 `^6` 메이저로 이전. release note 의 stricter inference / lib.d.ts 변경 / decorator 표준 채택 등으로 발생하는 type 에러를 plan008 의 각 phase 에서 카테고리별 패턴 적용으로 일괄 수정.
- **맥락**: PR #179 (Dependabot) 가 단순 dep bump 만 제안 — typescript 메이저는 전체 `.ts/.tsx` 컴파일에 영향이라 tsc 실측 후 에러 카테고리 식별 필수. ky/react-day-picker (단일 파일) 대비 영향 면적 큼. 미루면 보안/성능 개선 누적 손실 + msw·jest·eslint-config-next 등 peer dep 가 ts6 로 먼저 옮겨가면 빌드 분리 위험.
- **대안 기각**:
  - ts5 stick: 보안/유지보수 + 신 inference 혜택 미수용. peer dep 호환 점진 분리 위험.
  - Dependabot PR #179 그대로 머지: tsc 에러 무대응으로 빌드 회귀.
- **트레이드오프**: 메이저 dep bump 의 첫 번째 적용. 발견 에러를 단순 fix 로 처리 못 하는 케이스 (예: inference 변경으로 라이브러리 측 타입 깨짐) 는 별도 plan 으로 분리.
- **breaking 대응 패턴 (plan008 실측)**:
  - lib.d.ts 변경: 0건 — `target: ES2017` + `skipLibCheck: true` 조합으로 신규 Temporal/ES2025 type 노출 없음.
  - inference 변경: 0건 — contextual typing 변화로 인한 에러 미발생.
  - 신 기본값 (`noUncheckedSideEffectImports: true`): 1건 — `src/app/layout.tsx` 의 `import './globals.css'` TS2882. `src/types/css.d.ts` 에 `declare module '*.css'` 선언으로 fix.
  - peer dep 충돌: `@typescript-eslint/*` 8.48.1 (`typescript <6.0.0` 제약) → 8.59.2 (`<6.1.0`) 직접 devDep 추가로 fix.
  - tsconfig.json 변경: 없음 — 기존 `strict: true` / `moduleResolution: bundler` / `module: esnext` 가 ts6 기본값과 일치.
  - 신 옵션 (`verbatimModuleSyntax` / `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes`): 변경 폭 큼 → plan009 후속 검토로 분리.
  - 향후 ts7+ 이전 시 본 ADR 참조점.
- **적용 범위**: `package.json`, `tsconfig.json`, src/ 전체 (해당 파일만 fix).

## ADR-F20: 인증 안 한 사용자의 `/` 진입은 Landing 표시 (2026-05-11)

- **결정**: `/` 라우트를 public 으로 변경. 인증 안 한 사용자는 Landing (Hero + Features 3 + CTA), 인증 사용자는 `/dashboard` 자동 redirect. `src/app/page.tsx` 가 page-level `auth()` 호출 후 세션 분기 처리. proxy.ts (ADR-F19) 는 전역 auth proxy 라 별도 matcher 수정 불필요.
- **맥락**: 기존 동작은 인증 안 한 모든 진입 = `/auth/signin` 강제 redirect. login 페이지가 사실상 첫 화면이라 "어떤 서비스인지" 가 부재 — 신규 사용자가 가입 가치를 판단할 정보 없음. 부부 가계부 라는 도메인 특성상 가치 제안 (가족·카테고리·분석) 을 먼저 보여줄 entry 가 필요.
- **대안 기각**:
  - `/auth/signin` 만 운영하고 그 안에 가치 제안 카피 추가: signin 페이지가 비대해지고 (form + marketing 혼재) 분석/추적 단위가 모호.
  - 별도 `/landing` 라우트 + `/` 는 그대로 redirect: URL 두 개로 분기되어 marketing 전환 추적 + SEO root domain 가치 분산.
- **트레이드오프**: protected route 직접 URL 진입 (예: `/dashboard` 의 deep link 공유) 시 Landing 으로 한 단계 더 거쳐야 함. `(authenticated)/layout.tsx` 의 unauth redirect 대상도 Landing 으로 통일.
- **적용 범위**: `src/app/page.tsx`, `src/app/(authenticated)/layout.tsx`.

## ADR-F21: Add/Edit Transaction 다이얼로그 단일화 (2026-05-11)

- **결정**: 지출/수입/고정지출 3 도메인의 Add 다이얼로그를 단일 `AddTransactionDialog` + 3 segmented 토글 (gradient-expense / gradient-income / gradient-budget) 로 통합. Edit 도 동일 패턴 (`EditTransactionDialog`, type 잠금). 위치: `src/components/transactions/dialogs/`.
- **맥락**: 같은 "추가" 진입점이 6 곳 (Dashboard QuickActions / BottomNav FAB / Transactions 의 지출·수입·고정지출 탭 / Settings 고정지출) 인데 호출하는 다이얼로그가 셋 (AddExpenseDialog / AddIncomeDialog / AddRecurringExpenseSheet) 으로 분기. 시각·반응형 (Sheet 방향 right vs bottom)·field 구성·legacy 토큰 (`text-destructive`, `text-gray-500`, `text-muted-foreground`) 모두 불일치 → 사용자 인지 부담 + 유지보수 비용.
- **대안 기각**:
  - 도메인별 분리 유지 + 시각·토큰만 통일: 진입점마다 다른 UI 가 그대로 노출. type 전환 (지출→수입) 시 다이얼로그 닫고 다른 진입점 찾아야 함 — 같은 의도 ("거래 추가") 가 분기됨.
  - "Add+ 페이지" 신설 (전용 라우트): 모달 흐름이 자연스러운 작업을 페이지로 격상 → 단순 추가가 무거워짐. recurring 처럼 가끔 쓰는 영역에서 매번 라우팅 비용.
- **트레이드오프**: 단일 컴포넌트가 3 type conditional 필드 분기 — form complexity ↑ but UX 일관성 ↑. type 전환 시 type-specific 필드 (date vs dayOfMonth+name) 가 mount/unmount 되며 입력 잔존 정책은 "이전 type 의 amount/category/description 은 유지, type-specific 필드만 초기화" 로 명시.
- **적용 범위**: `src/components/transactions/dialogs/{Add,Edit}TransactionDialog.tsx`, `src/components/transactions/forms/TransactionFormFields.tsx`, 진입점 갱신, legacy 다이얼로그 6 파일 제거 (Add/EditExpenseDialog, Add/EditIncomeDialog, Add/EditRecurringExpenseSheet).

## ADR-F22: 민감 정보를 다루는 컴포넌트는 Server Component 로 유지 + Client 핸들러는 children 슬롯 (2026-05-18)

- **결정**: `error.tsx` / `not-found.tsx` 같은 에러 경계 카드 (`StatusCard`) 는 **Server Component 로 고정**. 클라이언트 핸들러 (`reset()` 등) 가 필요한 영역은 별도 `"use client"` 래퍼 (`ErrorResetButton`) 를 만들어 Server Component 의 `children` 슬롯에 주입. `process.env.NODE_ENV` 분기를 포함한 dev-only 메시지 (`error.message`, stack trace, digest 등) 도 Server Component 본문에서 평가하여 production 트리에서 dev JSX 자체가 제외되도록 한다.
- **맥락**: Next.js App Router 에서 `error.tsx` 는 `"use client"` 필수 (Error boundary 규약). 직관적으로는 `error.tsx` 안의 모든 컴포넌트가 Client 가 되지만, Server Component 를 `children` 으로 받으면 그 본체는 서버에서 렌더된다. 이를 활용하면 (a) `error.message` 같은 민감 정보의 `process.env.NODE_ENV` 분기를 서버측에서 평가해 production 클라이언트 번들에 dev 텍스트 누출 차단, (b) `onClick` 같은 직렬화 불가 prop 을 Server Component 인터페이스에서 제거. PR #248 코드 리뷰에서 두 사고 가능성이 동시 지적됨.
- **대안 기각**:
  - 전체 `"use client"` (StatusCard 도 Client): `process.env.NODE_ENV` 가 클라이언트에서 평가되어도 Next.js 번들러가 dead code elimination 으로 dev 분기를 제거하지만, `error.message` 문자열 자체가 클로저에 캡처되어 production 번들에 포함될 위험 잔존. devtools 에서 함수 본문 확인 가능. 또한 Server Component 의 정적 렌더 + 데이터 페칭 이점도 포기.
  - `process.env.NODE_ENV` 분기를 `error.tsx` 측에서 수행 + StatusCard 는 단순 receiver: `devMessage` prop 자체를 `undefined` 로 전달해도 dev JSX 가 `error.tsx` 의 client 번들에 남음. 책임 분산이 안 됨.
- **트레이드오프**: Server Component + Client 래퍼 분리는 파일 수 증가 (`ErrorResetButton.tsx` 같은 1-호출 래퍼). 단 보안 + 직렬화 안전성 이득이 크고, 패턴이 일관되면 후속 영역 (예: Sentry wiring) 에서 동일 구조 재사용 가능.
- **적용 범위**: `src/components/error/StatusCard.tsx` (Server) + `src/components/error/ErrorResetButton.tsx` (Client) + `src/app/{,(authenticated)/}error.tsx` + `src/app/global-error.tsx`. 향후 server-side dev 분기를 포함하는 모든 컴포넌트에 동일 원칙 적용 (예: Sentry digest 카드, debug overlay).

---

## ADR-F23: semantic foreground 토큰 (`--color-{semantic}-fg`) 으로 강조 배경 위 텍스트 색 명시 (2026-05-19)

- **결정**: `bg-expense` / `bg-income` / `bg-warning` 같은 채도 높은 시맨틱 배경 위에 텍스트를 얹을 때는 `text-white` / `text-black` 하드코딩 대신 **시맨틱 foreground 토큰** (`--color-expense-fg` 등) 을 사용한다. light/dark 양쪽에서 동일하게 강조 배경과 대비되는 near-white 값 (`oklch(0.985 0.003 230)`) 으로 정의 — surface `--color-fg` (light=어두움, dark=밝음) 와 분리.
- **맥락**: plan017 NotificationBell 의 `bg-expense text-white` Badge 가 ADR-F13 (OKLCH 토큰 강제, hex/rgb/hsl/named color 금지) 의 정신과 충돌. 단순 교체로 `text-bg` 같은 surface foreground 를 쓰면 dark mode 에서 `--color-bg` 가 어두운 색이 되어 빨간 expense 배경 위에서 가독성이 더 나빠짐. 강조 배경은 light/dark 무관하게 채도 유지가 의도이므로 foreground 도 모드 독립적 near-white 가 자연스럽다.
- **대안 기각**:
  - `text-white` 유지: ADR-F13 의 "globals.css `@theme` 외부에서 hex/rgb/hsl/named 색 금지" 원칙 위반. 디자인 토큰 단일 소스 깨짐.
  - `text-bg` (surface foreground): light/dark 가 반전되는 토큰이라 강조 배경 위 가독성 일관성 깨짐 (dark mode 에서 어두운 색 → expense 빨강 위 contrast 약화).
  - 인라인 `style={{ color: "white" }}`: ADR-F13 위반 + CLAUDE.md "인라인 style 최소화" 위반.
- **트레이드오프**: 토큰 수 증가 (현재 expense-fg 만 신설, income-fg / warning-fg 는 필요 시 후속 추가). 단 ADR-F13 의 정합성 + dark mode 가독성 일관성 이득이 큼.
- **적용 범위**: `src/app/globals.css` (`--color-expense-fg` 정의) + `src/components/notifications/NotificationBell.tsx` (`text-expense-fg`). 향후 강조 배경 위 텍스트가 필요한 모든 위치 (Badge / Toast destructive variant / 그래프 강조 라벨 등) 에 동일 원칙 적용.

---

## ADR-F24: sonner richColors OFF + Teal 토큰 직접 매핑 (2026-05-19)

- **결정**: `Toaster` 의 `richColors` 옵션을 끄고, toast 타입별 색을 OKLCH 토큰으로 직접 매핑한다. success=`--color-brand-500` (Teal h=188), error=`--color-expense`, warning=`--color-warning`, info=`--color-brand-400`. 컨테이너 톤은 `bg-bg-elev` / `border-border` / `text-fg`. `AlertDialog` 도 동일 원칙으로 overlay=`bg-fg/60`, content=`bg-bg-elev`, description=`text-fg-muted` 로 통일.
- **맥락**: sonner `richColors=true` 의 자동 success(green h≈140)/error(red)/warning(amber)/info(blue) 가 plan001 Teal 시스템 (brand h=188) 과 충돌. 특히 success green 이 income (h=152) 과도 가까워 시맨틱 혼동 가능. AlertDialog 의 `bg-white` / `bg-black/80` / `text-muted-foreground` 잔재는 shadcn v3 legacy 로 dark mode 미지원.
- **대안 기각**:
  - `richColors` 유지 + 컨테이너만 토큰화: success green 이 brand Teal 과 충돌 + income 시맨틱 혼동 잔존. 가장 적은 변경이지만 핵심 문제 미해결.
  - richColors OFF + 단색 (popover-only): success/error 시각 강도 차이 사라져 critical 액션 ↔ confirmation 구분 약화. 토스트 본연의 즉시 인지 가치 손실.
- **트레이드오프**: 토큰 직접 매핑은 sonner 업데이트 시 className target (`[data-sonner-toast][data-type=...]`) 시그니처 변경 영향 받음 — 단 sonner 가 안정적 API 이고 toast 사용처가 20+ 곳이라 일관성 이득이 큼.
- **적용 범위**: `src/components/ui/sonner.tsx` + `src/app/providers.tsx` + `src/components/ui/alert-dialog.tsx`. AlertDialog 파괴적 Action (Delete*Dialog 4 호출처) 은 호출처에서 `variant="destructive"` 명시 (`buttonVariants({ variant: "destructive" })` 가 이미 expense 토큰으로 매핑됨).

