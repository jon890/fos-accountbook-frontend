# planning 오버레이 — fos-accountbook

공용 코어(`~/.claude/skills/planning`)에 fos-accountbook 특화를 주입한다.
코어의 8단계 skeleton 을 이 레포의 도메인(Next.js 프론트엔드)·docs 컨벤션·검증에 맞춰 채운다.

## 도메인: 프론트엔드 (Next.js App Router / React / TypeScript)

가계부 서비스의 프론트엔드. 백엔드(`fos-accountbook-backend`, Spring Boot)와는 별도 레포·별도 PR 로 분리되어 있다.

- **3단계 (호출/사용자 흐름)**: 시니어 UX 리서처 관점. 화면 전환·사용자 액션·시스템 반응을 구체화. 엣지 케이스(에러/빈 상태/권한 충돌)를 점검. 백엔드 API 가 아직 없으면 `docs/calendar-api.md` 처럼 요청 명세를 남기고 사용자와 일정을 논의한다.
- **4단계 (인터페이스)**: 각 화면의 정보·기능 체크리스트, 컴포넌트 구조 초안(Server/Client 경계), 상태 관리 방식.
- **5단계 (API/함수)**: Server Action 우선 (ADR-F04 — `actions/`와 `services/` 분리). 신규 백엔드 엔드포인트가 필요하면 5단계에서 계약(요청/응답 스키마)을 먼저 확정하고, 백엔드 팀 요청 문서(`docs/calendar-api.md` 패턴)로 남긴다.
- **6단계**: `src/actions → src/services → src/lib/server` 레이어 일관성 확인. 권한 검증은 ADR-F25 의 3 패턴(Single-family / Multi-family / Entity ownership) 중 하나로 명시.

### domain 태그 통제 어휘 (phase 작성 시 필수)

phase 프런트매터 `**Domain**:` 태그와 `common-pitfalls.md` 의 작업종류→함정 인덱스가 참조하는 어휘. 아래 중 하나를 선택한다 (PLAN-/TEAM- 은 executor 주입 대상 아님, planner/team-lead 상시 점검):

| domain 키 | 대상 작업 |
|---|---|
| `markdown-write` | markdown / task 문서 작성 |
| `color-token` | 색 토큰 / Tailwind 스타일 작성 |
| `app-router` | App Router 경계 / 컴포넌트 / revalidatePath |
| `server-action` | Server Action 작성 |

## docs 컨벤션

갱신 대상 문서:

| 내용 유형 | 단일 소스 | 다른 문서 |
|---|---|---|
| 제품 목적 / 기능 범위 | `docs/prd.md` | flow 는 흐름만 재언급 |
| 사용자 흐름 / 화면 전환 | `docs/flow.md` | prd 는 목표만, ADR 은 결정만 |
| DB 스키마 / TypeScript 타입 / API 구조 | `docs/data-schema.md` | ADR 은 결정 근거만 |
| 디렉터리 / 레이어 분리 / API 전략 | `docs/code-architecture.md` | ADR 은 결정 근거만 |
| 테스트 범위·전략·우선순위 | `docs/testing-strategy.md` | — |
| 기술 결정 근거 (왜) | `docs/adr.md` (단일 파일, append) | 다른 docs 는 `ADR-FNN` 번호 링크 |
| 백엔드에 신규 API 요청 | `docs/calendar-api.md` 같은 개별 요청 문서 | prd/flow 는 "백엔드 의존" 만 언급 |

`docs/adr.md` 상단에 "백엔드 결정은 `fos-accountbook-backend/docs/adr.md` 참고"가 명시되어 있다 — 프론트 ADR 만 `ADR-F` 번호를 쓴다.

### ADR 자명성 게이트 (작성 전 필수 자문)

아래 3개에 **모두 NO** 여야 ADR 로 기록. 하나라도 YES 면 대안 채널(CLAUDE.md 규칙/코드 주석/커밋 메시지/다른 docs)로 내려보낸다.

1. `package.json` · lockfile · Tailwind `@theme` 토큰 정의 · 디렉터리 트리 · ESLint 설정 중 어느 하나를 보면 같은 정보를 얻는가?
2. "왜 X 를 선택했다" 를 1~2 문장 이상으로 설명하기 어려운가?
3. 다른 프로젝트에서도 일반적으로 하는 선택인가?

**유지 적격**(3개 모두 NO): 라이브러리 고유 함정 / 실험 결과(수치) / 대안 기각 근거 / 정책·규칙 / 비용·성능 트레이드오프.

### ADR 구조 템플릿 (실제 `docs/adr.md` 표기와 일치)

```markdown
## ADR-FNN: {제목 — 결정의 한 줄 요약} ({날짜})

- **결정**: {무엇을 — 1~3 문장, 세부 규칙은 sub-bullet}
- **맥락**: {왜 필요했는가 — 제약 / 관찰 / 버그 재현}
- **대안 기각**: {다른 옵션 각각 1~2 줄, 왜 아닌가}
- (선택) **트레이드오프**
- **적용 범위**: {파일 경로 — 코드 블록 나열 아닌 경로만}
```

**금지**: 코드 블록 10줄 이상(1~3줄 식별자 예시만 허용) · 파일 경로 3개 이상 표 형태 나열 · "변경 항목 1/2/3/4" 작업 내역 · CLAUDE.md 스택 규칙 반복.

## 검증

- **common-pitfalls 경로**: `.claude/skills/_shared/common-pitfalls.md` (fos-accountbook 전용으로 이미 분리됨 — plan026). 코어 `verify-task.sh` 5 패턴은 이 파일의 자동 검출형과 겹친다.
- **작업종류→함정 인덱스**를 이 파일에서 먼저 확인 — 전체 통독 대신 해당 작업 종류 행만 참조.
- `Server Action 작성` 행은 그레인이 CLAUDE.md ADR 참조로 위임되어 있다 — ADR-F25(권한 3-패턴)·ADR-F06(Zod 검증) 를 phase 작성 시 직접 확인.
- `markdown/task 문서 작성` 은 `scripts/check-tailwind-md.mjs` (CI `pnpm lint:md`) 로 자동 게이트 — Tailwind arbitrary class 위험 패턴(대괄호 안 와일드카드·중괄호) 검출.

## plan / ADR 네이밍

```bash
# cwd: <repo root>
ls tasks/ | grep "plan{후보번호}"
grep "^## ADR-F{후보번호}" docs/adr.md
gh pr list --state open --json number,headRefName,title --jq '.[] | "\(.headRefName) \(.title)"'
```

서브넘버 규칙(동일 도메인 후속 작업)은 코어 기본값 그대로 (`plan{N}` → `plan{N}-2`).

## branch / 커밋 / 핸드오프

- **branch**: `plan/{N}-{slug}` (origin/main 기준 신규 브랜치, 이전 plan 브랜치 위에 쌓지 않는다).
- **main 직접 push 차단** — branch protection. `/planning` 은 `plan/{N}` 브랜치에 push 만 하고 **PR 은 생성하지 않는다**.
- **커밋**: docs 변경 + task 파일을 **한 커밋**으로 묶는다. 메시지: `docs(plan{N}): {plan 한 줄 요약}`.
- **push**: `git push -u origin plan/{N}-{slug}`. 이후 `git switch main` 으로 복귀.
- **단일 PR 원칙**: 계획 PR 을 따로 만들면 이후 main 변경과 구현 브랜치가 충돌한다(실사례: plan026 이전 #308 계획 PR 선(先)머지 → #311 구현 PR conflict). PR 은 구현 완료 후 `plan/{N}`→main **1개만** 생성.
- **핸드오프**: `/plan-and-build plan{N}` (기본, 자동 하네스) 또는 `/build-with-teams plan{N}` (가시적 Agent Teams 협업) 로 구현 시작 안내 — 둘 다 같은 `plan/{N}` 브랜치에서 이어 붙는다.
- **중복 실행 방지**: `plan/{N}` 브랜치의 `index.json.status` 가 `"completed"` 면 재실행 금지.
