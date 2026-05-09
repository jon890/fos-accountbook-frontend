# CLAUDE.md — fos-accountbook

Claude Code가 항상 따라야 할 규칙과 참조 문서 포인터.

## 핵심 워크플로우 스킬

| 시점 | 스킬 | 트리거 |
|---|---|---|
| 새 기능/변경 설계 | `/planning` | "/planning", "계획 세워보자", "설계해보자" |
| plan 실행 (자동 하네스) | `/plan-and-build` | "plan{N} 실행", "구현해줘" — 코드 구현은 항상 이 스킬 |
| plan 실행 (Agent Teams) | `/build-with-teams` | 가시적 협업, 4~5명 에이전트 파이프라인 |
| docs 정리 | `/docs-check` | docs/ 5축 검증, plan 완료 후 주기적 |
| UI 리뷰 | `/web-design-guidelines` | "review my UI", 접근성/UX 감사 |
| UX PR 통합 | `/integrate-ux` | 디자이너 PR 리뷰·머지 |
| PR 리뷰 반영 | `/review-fix` | "리뷰 댓글 반영" |
| 커밋 | `/commit-convention` | "커밋해줘" |

`/planning` → docs 갱신 → task 생성 → `/plan-and-build` 또는 `/build-with-teams` 실행 흐름이 표준.

---

## 컨텍스트 문서

| 문서                                         | 내용                                 | 언제 읽을까                    |
| -------------------------------------------- | ------------------------------------ | ------------------------------ |
| [`docs/prd.md`](docs/prd.md)                 | 제품 목적, 기능 범위, v2 계획        | 새 기능 추가 전                |
| [`docs/adr.md`](docs/adr.md)                 | 기술 결정 기록 (F=프론트, B=백엔드)  | 기술 결정 시, 아키텍처 질문 시 |
| [`docs/data-schema.md`](docs/data-schema.md) | DB 스키마, TypeScript 타입, API 구조 | API 연동, 타입 정의 시         |
| [`docs/flow.md`](docs/flow.md)               | 사용자 플로우, 데이터 흐름           | UI/UX 수정, 플로우 변경 시     |
| [`docs/code-architecture.md`](docs/code-architecture.md) | 디렉터리 구조, 레이어 분리, API 전략 | 디렉터리 구조 변경, 레이어 경계 검토 |
| [`docs/testing-strategy.md`](docs/testing-strategy.md) | 테스트 범위·전략·우선순위 | 테스트 추가/삭제 시 |

### 상황별 ADR 필수 참조

아래 작업을 할 때는 해당 ADR을 반드시 먼저 읽는다 — 라이브러리 고유 함정·실험 결과·정책 근거가 담겨 있어 모르고 진행하면 버그 재발 위험.

| 상황 | 필수 확인 ADR |
|---|---|
| Server Action 작성 / Actions-Services 경계 | ADR-F04 — `actions/`와 `services/` 엄격 분리 |
| Page에서 데이터 조회 | ADR-F12 — Page에서 `serverApiGet` 직접 호출 금지, Action 경유 |
| HTTP 클라이언트 / 재시도 설정 | ADR-F05 — ky 사용, 408/429/5xx 최대 2회 재시도 |
| NextAuth 세션/토큰 수정 | ADR-F03 — JWT 전략, profile 캐싱, 만료 5분 전 갱신 |
| Server Action 입력 검증 | ADR-F06 — Zod 런타임 검증 필수 |
| Shadcn / Tailwind v4 스타일 | ADR-F07 — 시맨틱 그라디언트 클래스, 하드코딩 금지 |
| 색 토큰 작성 (brand/semantic/surface) | ADR-F13 — OKLCH 평면 값. hex/rgb/hsl 금지 |
| 폰트 추가 / 수치 표기 | ADR-F14 — Pretendard Variable + Inter (`.num` / tabular-nums) |
| dark mode 셀렉터 | ADR-F15 — `[data-theme="dark"]` 만. `.dark` 신규 사용 금지 |
| `alert/confirm/prompt` 대체 | ADR-F08 — sonner 토스트 사용 |
| Jest 테스트 추가 | ADR-F09 — MSW 아닌 jest.mock 방식 |
| 실시간 업데이트 vs revalidate | ADR-F10 — Server Action + `revalidatePath` 유지 |
| CI 코드 리뷰 워크플로 수정 | ADR-F11 — 트리거/모델/봇 허용 정책 |

---

## 기술 스택

Next.js 16 (App Router) · TypeScript 5 (strict) · Tailwind CSS v4 · Radix UI + Shadcn · NextAuth v5 · pnpm 10 · Jest + Testing Library

---

## 아키텍처 레이어 규칙

```
Page (app/) → Action (actions/) → Service (services/) → lib/server/api
```

| 레이어            | 담당                                           | 금지                                        |
| ----------------- | ---------------------------------------------- | ------------------------------------------- |
| `actions/`        | `"use server"`, 인증, Zod 검증, revalidatePath | API 직접 호출, 비즈니스 로직                |
| `services/`       | API 호출, 쿼리 빌딩, 데이터 변환               | `"use server"`, revalidatePath, requireAuth |
| `lib/server/api/` | HTTP 클라이언트                                | —                                           |

---

## 코딩 규칙

### TypeScript

- `strict: true` — `any` 타입 금지
- Server Actions에 명시적 반환 타입 권장
- 입력값은 Zod로 런타임 검증

### React / Next.js

- **Server Component가 기본** — 클라이언트 상태가 필요할 때만 `"use client"`
- `"use client"` 지시어는 파일 최상단 첫 줄
- `useRouter`, `useState`, `useEffect` 등 훅은 Client Component에서만

### 스타일링

- **OKLCH 토큰 강제** (ADR-F13) — `globals.css` 의 `@theme` 블록 외부에서 hex/rgb/hsl 직접 작성 금지
  - brand: `--color-brand-{50..900}` (Teal h=188)
  - semantic: `--color-{income|expense|warning}`
  - surface: `--color-{bg|bg-elev|bg-muted|fg|fg-muted|fg-subtle|border|border-strong}` (light/dark 분리)
- **시맨틱 그라디언트 클래스 필수** — 하드코딩 색상 금지
  - `gradient-expense` · `gradient-income` · `gradient-budget`
  - `gradient-family` · `gradient-category` · `gradient-primary`
- **Dark mode**: `[data-theme="dark"]` 셀렉터만 사용 (ADR-F15). `.dark` 클래스 신규 추가 금지
- **폰트**: `--font-sans` (Pretendard Variable, ADR-F14) + `--font-num` (Inter, 수치 전용 + tabular-nums)
- 인라인 `style={{ }}` 최소화 — 단일 토큰은 `text-[var(--token)]` arbitrary class
- `cn()` 유틸리티로 클래스 병합

### 컴포넌트

- `src/components/ui/` Shadcn 컴포넌트 우선 사용
- CVA(class-variance-authority)로 variant 관리

---

## 금지사항

- `alert()` · `confirm()` · `prompt()` → `toast` (sonner) 사용
- `console.log` 프로덕션 코드에 남기지 않기
- `any` 타입 사용 금지
- `NEXT_PUBLIC_` 없는 환경 변수를 클라이언트 번들에 노출 금지

---

## 토큰 효율 (Opus/Sonnet 라우팅)

- **논의·계획·docs 작성**: main 세션 (opus 허용)
- **task phase 실행**: sonnet 기본 — rename, 리팩토링, 다중 파일 수정도 sonnet
- **task phase에서 opus 사용 금지 예외**:
  - 새 아키텍처 설계가 phase 안에 있는 경우
  - 복잡 알고리즘 설계 (도메인 핵심 신규 설계)
- **기계적 작업은 opus 금지** — rename/이동/경로 수정 등은 파일 수가 많아도 sonnet으로 충분
- 빌드 검증·커밋 phase는 haiku

---

## 파일 읽기 효율

- **전체 파일 읽기 금지** (200줄 초과 시) — offset+limit로 필요한 섹션만
- **같은 파일 반복 읽기 금지** — 같은 세션 내에서는 기억해서 재사용
- **대형 docs 파일** (`docs/adr.md` 등)은 grep으로 필요 섹션만 찾아 offset 지정

---

## 조사/탐색 접근 방식

- **직접 질문에는 직접 답변부터** — 사용자가 특정 파일/영역/패턴을 명시했다면 해당 위치부터 확인. 광범위한 codebase 탐색 금지
- **사용자가 조사 경로를 제시했으면 그 경로부터** — 지시받은 영역에서 codebase 전체를 먼저 뒤지지 않는다
- **Explore agent는 최후 수단** — Grep/Glob/Read로 3번 이상 시도한 후에도 못 찾을 때만 사용
- **가정 없이 주장하지 않기** — "dead code", "미사용" 같은 판단은 실제로 참조를 grep한 후에만 제기

---

## Task 작업 규칙

- 각 phase는 **원자적 단일 책임** — 다른 관심사면 별도 phase로 분리. **작업 항목 5개 이하** 엄수
- **task 파일 생성 즉시 git commit** — index.json + phase 파일을 실행 전에 커밋
- task 완료 즉시 git commit (index.json 상태 갱신 포함)
- 각 phase 프롬프트는 **자기완결적** (이전 대화 없이 독립 실행 가능)
- **docs 최신화는 task 생성 전 필수** — task phase 내에서 docs 변경 금지

"5개 이하" 근거: 작업 항목이 많으면 AI 에이전트가 뒤쪽을 누락하는 경향 (11개 중 뒤 3개 누락 실증 사례).

---

## 문서 작성 원칙

- **AI 에이전트 컨텍스트 효율** — docs는 AI 에이전트를 위한 것. 컨텍스트를 낭비하지 않도록 간결하게
- **반복·중복 제거** — 같은 내용을 두 문서에 쓰지 않는다
- **의사결정 의도 보존** — "왜 이렇게 했는가" 반드시 기록
- **구현 세부사항은 코드에, docs에는 "무엇을·왜"만** — ADR에 코드 스니펫/파일 경로 나열 금지

---

## 테스트

- 위치: `src/__tests__/`
- 실행: `pnpm test` / `pnpm test:ci`
- Service 함수는 단위 테스트 권장
- Server Action 테스트: jest.mock 방식 (MSW 아님 — ADR-F09 참고)

---

## Git & PR Conventions

**main 직접 push 차단됨** — branch protection 으로 `git push origin main` 이 항상 거부된다 (`Changes must be made through a pull request`). 모든 변경은 작업 브랜치(`plan/NNN-...`, `chore/...`, `feat/...` 등) 에 commit + push 후 `gh pr create` 로 PR 생성. task 파일 + docs 변경도 동일 — 직접 push 시도하지 말고 처음부터 브랜치 + PR 패턴.

PR 제목은 반드시 아래 형식을 따른다:

```
type(scope): description
```

예시:
- `feat(backend): add Prometheus config`
- `fix(database): resolve Redis connection timeout`
- `docs(task): add NSC slot engine abstraction`

이 형식에서 절대 벗어나지 않는다.

### Plan 브랜치 분리 규칙

plan task 와 실제 구현은 **분리된 브랜치 + 분리된 PR** 로 관리한다.

| 단계 | 브랜치 | 내용 | 머지 후 |
|---|---|---|---|
| 계획 | `plan/{N}-{slug}` | `tasks/plan{N}-{slug}/` task 파일 + docs 갱신 | task 가 main 에 반영 |
| 구현 | `feat/plan{N}-{slug}` | phase 별 코드 commit | 실제 기능이 main 에 반영 |

**왜?** 머지 이력에서 "무엇이 계획이고 무엇이 구현인가" 즉시 식별. 검토 부담도 분산.

**적용**:
- `/planning N` → `plan/{N}-{slug}` 에 task + docs commit + PR
- `/build-with-teams N` → main 의 task 를 base 로 **`feat/plan{N}-{slug}` 신규 브랜치** 생성 후 phase 실행
- build-with-teams 사전 검증 4번이 plan task PR 머지를 잡아도 정상 — task-only 머지이므로 무시하고 신 브랜치로 진행

---

## PR 체크리스트

1. Server/Client Component 경계가 올바른가?
2. 새 색상/스타일이 시맨틱 클래스를 사용하는가?
3. TypeScript 타입이 충분히 엄격한가?
4. Server Actions에서 인증/권한 확인이 누락되지 않았는가?
5. `alert()` 등 브라우저 기본 UI 사용 여부
6. 에러 처리가 적절한가?
7. PR 제목이 `type(scope): description` 형식을 따르는가?
