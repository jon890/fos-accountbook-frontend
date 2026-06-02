# Common Pitfalls — fos-accountbook

## 이 문서 쓰는 법

함정은 두 가지로 나뉜다.

- **자동 검출형** — `auto-gate:` 값이 있는 항목. 빌드·lint·타입 게이트가 자동으로 막는다. 별도 self-check 불필요.
- **판단형** — `auto-gate: —` 인 항목. 설계·UX·권한 판단이 필요하다. **아래 인덱스 표에서 작업 종류에 해당하는 항목만 골라 읽는다.**

전체를 매번 통독하지 않는다. 인덱스로 필요한 항목만 참조한다.

## 통제 어휘 (domain 키 목록)

phase-04 의 phase 프런트매터 domain 태그와 아래 인덱스 표의 작업종류 키, 각 함정의 `trigger:` 태그가 **같은 어휘를 써야** 매핑이 성립한다.

| domain 키 | 대상 작업 |
|---|---|
| `markdown-write` | markdown / task 문서 작성 |
| `color-token` | 색 토큰 / Tailwind 스타일 작성 |
| `app-router` | App Router 경계 / 컴포넌트 / revalidatePath |
| `server-action` | Server Action 작성 (현재 연결 함정: CLAUDE.md ADR 참조) |
| `plan-write` | plan 작성 — executor 주입 대상 아님, planner 상시 점검 |
| `team-ops` | team 운영 — executor 주입 대상 아님, team-lead 상시 점검 |

## 작업종류→함정 인덱스

| 작업 종류 | 봐야 할 함정 | 자동 점검 |
|---|---|---|
| markdown/task 문서 작성 | CODE-3 | md-lint (phase 05) |
| 색 토큰 / Tailwind 스타일 | CODE-1, CODE-2 | — |
| Server Action 작성 | CLAUDE.md ADR-F25, ADR-F06 참조 | — |
| App Router 경계 / 컴포넌트 | CODE-4, CODE-5, CODE-6 | — |
| plan 작성 | PLAN-1~9 | critic |
| team 운영 | TEAM-1~10 | — |

**PLAN-/TEAM- 은 executor 주입 대상이 아님** — planner(plan 작성)·team-lead(team 운영)의 상시 점검 항목. domain 태그로 executor 에 주입되는 건 CODE-N 만.

## 축적 규칙

- 새로운 사고 타입 발견 시 해당 섹션에 **패턴 한 줄 + 실측 명령 + self-check** 추가
- 함정 추가 시 인덱스 표에도 해당 행을 갱신한다 (단일 소스: trigger 태그가 진실, 인덱스는 그 뷰)
- 같은 사고 재발 시 패턴 강화 (예시 / 체크 엄격화)
- "왜 이 가드가 필요한지" 1줄 단서는 반드시 — 미래 AI 가 의도 모르고 우회하지 않도록
- 사고 사례 (plan###) 는 1개로 충분, 복수 나열 금지

---

## plan 작성 (critic 회피)

`/planning` 또는 `build-with-teams` 가 task 파일 작성 시 self-check.
이 섹션의 모든 항목을 plan 생성 **전에 소진** 하면 critic 이 1-shot APPROVE 할 확률이 높다.

### PLAN-1 · trigger: plan-write · auto-gate: critic

수치 추측 (파일 수 / 줄 수)

- **증상**: "약 30개 파일", "100줄 줄어듦" 같은 수치를 실측 없이 적음.
- **Why**: critic 이 가장 먼저 검증하는 것은 phase 약속 수치 ↔ 실제 코드 일치 여부. 추측은 즉시 REVISE 사유.
- **검출**:
  ```bash
  git diff <base>..<target> --stat | tail -5
  git diff <base>..<target> --name-only | wc -l
  ```
- **Self-check**: 모든 수치가 실측 명령 결과? 명령 자체가 plan 에 인용되어 있는가?

### PLAN-2 · trigger: plan-write · auto-gate: critic

파일 범위 부정확

- **증상**: "step2 컴포넌트 전체 수정" — "전체" 표현은 critic 이 추적 불가.
- **Why**: 누락된 파일이 conflict 진앙이 되면 executor 가 헤맨다.
- **검출**:
  ```bash
  git diff <base>..<target> --name-only -- <scope-dir>/
  ```
- **Self-check**: 파일 목록을 plan 에 전부 나열했고, 각 파일 처리 원칙이 서술됐는가?

### PLAN-3 · trigger: plan-write · auto-gate: critic

이전 plan / main 커밋과의 상호작용 누락

- **증상**: 이번 plan 이 다른 최근 plan 산출물과 충돌하는데 본문에 그 관계 미서술.
- **Why**: executor 가 rebase 중 "어느 쪽이 final state 인가" 모르고 잘못된 방향으로 병합.
- **검출**:
  ```bash
  git log origin/main --oneline -20 -- <scope-dir>/
  ls -dt tasks/plan*/ | head -5
  ```
- **Self-check**: 최근 10개 커밋 중 plan 범위 파일을 건드린 게 있는가? 있으면 "어느 쪽이 final" 명시?

### PLAN-4 · trigger: plan-write · auto-gate: critic

실행 컨텍스트 모호 (cwd / branch)

- **증상**: Bash 블록에 `cd` 없거나 "메인 디렉터리에서" 같은 애매한 서술.
- **Why**: worktree 에서 main repo 로 잘못 커밋이 박히면 force-push 로 PR 에 섞임.
- **Good**: 모든 Bash 블록 위에 `# cwd: {절대경로}` 주석 + 브랜치 의존 시 `# branch: {expected}`.
- **Self-check**: 모든 Bash 블록이 실행 위치 명시? worktree 사용 plan 이면 main vs worktree 구분 명확?

### PLAN-5 · trigger: plan-write · auto-gate: critic

"눈으로 확인" 검증

- **증상**: 성공 기준에 "수동 검토", "눈으로 확인" 같은 인간 의존 문구.
- **Why**: executor (LLM) 가 "확인했다" 단정 가능 → 사실상 검증 없음.
- **Good**: 성공 기준의 각 항목은 grep / test / diff + 기대값 (건수 / exit / 문자열 포함) 명시.
- **Self-check**: "확인" / "검토" 문구 0건? 각 명령에 기대값 명시?

### PLAN-6 · trigger: plan-write · auto-gate: critic

외부 상태 점검 부재

- **증상**: 외부 시스템 변경 (push, merge, PR comment, 배포) 단계 앞에 상태 확인 명령 없음.
- **Why**: PR 이 close / merge 됐는데 force-push 하거나 CI 실패 모르고 "검증 완료" 댓글.
- **검출**:
  ```bash
  STATE=$(gh pr view {N} --json state -q .state)
  [ "$STATE" = "OPEN" ] || { echo "PR is $STATE"; exit 1; }
  ```
- **Self-check**: 외부 가시 동작 앞에 점검, 뒤에 rollback 절차?

### PLAN-7 · trigger: plan-write · auto-gate: critic

새 불변식 도입 시 4면 가드 누락

- **증상**: 스키마에 `isDefault: Boolean` 추가 + 일부 경로에만 가드 + UI 가드 누락.
- **Why**: 같은 불변식이 다른 표면에서 깨짐 (mapper 드랍 / UI 삭제 / 트랜잭션 분리 등).
- **Good**: load-bearing 불변식 도입 시 4면 가드 필수:
  1. **Migration**: SQL 백필 + 인덱스 + 제약
  2. **Repository**: 모든 write 메서드 (`create` / `update` / `delete` / `findOrCreate`) 가드
  3. **Mapper / DTO**: 입력 매퍼가 새 필드를 드랍하지 않는지 (`grep` 확인)
  4. **UI**: 사용자가 불변식을 깨뜨릴 수 있는 액션 (삭제 / 수정 폼) 에 disable / throw
- **Self-check**: load-bearing 불변식 도입 시 4면 가드 모두 phase 작업 목록에 명시?

### PLAN-8 · trigger: plan-write · auto-gate: critic

마지막 phase 에 index.json completed 마킹 지시 누락

- **증상**: 마지막 phase 본문에 "index.json status + 모든 phase status 를 `completed` 로 + 단일 commit 포함" 지시 없음.
- **Why**: executor 는 scope 가드로 자체 추가 안 함 (올바른 행동) → team-lead 가 PR 직전 amend / 별도 commit. main 직접 수정 유혹 발생.
- **검출**:
  ```bash
  sed -i '' 's/"status": "pending"/"status": "completed"/g' tasks/{plan}/index.json
  grep -c '"status": "completed"' tasks/{plan}/index.json   # = (1 + total_phases)
  grep -lE "index\.json.*completed" tasks/{plan}/phase-*.md   # 마지막 phase 파일 매칭
  ```
- **Self-check**: 마지막 phase 에 마킹 지시 + 단일 commit 포함 명시?

### PLAN-9 · trigger: plan-write · auto-gate: critic

macOS BSD sed \b 미지원

- **증상**: rename plan 에 `sed -i '' 's|foo\b|bar|g'`. macOS BSD `sed` 는 `\b` 미지원 → 0 매치. 검증: `echo "x.contentReview.y" | sed 's|contentReview\b|X|g'` → 변경 없음.
- **Why**: 핵심 치환 누락, 빌드 / 타입 검증 실패하지만 phase 본문은 통과로 보일 수 있음.
- **Good**: `perl -i -pe 's/\bfoo\b/bar/g'`. 검증식도 `rg '\bfoo\b'`. `rg` 는 `-g '*.ts' -g '*.tsx'` 사용 (`--include` 미지원).
- **Self-check**: rename plan 에서 sed `\b` → perl 교체? 검증식 일관성?

## plan 작성 소진 체크리스트

plan 제출 전 9개 패턴 모두 self-check:

- [ ] **PLAN-1**: 모든 수치가 실측 명령 결과
- [ ] **PLAN-2**: 파일 목록이 `--name-only` 결과와 일치
- [ ] **PLAN-3**: 최근 10개 커밋과 이 plan 의 관계 서술
- [ ] **PLAN-4**: 모든 Bash 블록에 `# cwd:` 주석
- [ ] **PLAN-5**: 성공 기준에 인간 의존 문구 없음
- [ ] **PLAN-6**: 외부 상태 변경 단계에 점검 + rollback
- [ ] **PLAN-7**: load-bearing 불변식 도입 시 4면 가드
- [ ] **PLAN-8**: 마지막 phase 에 index.json `completed` 마킹 지시
- [ ] **PLAN-9**: rename 시 `sed \b` 대신 `perl`

---

## team 운영

`build-with-teams` 가 팀원 스폰 / 메시지 / 브랜치 작업 시 self-check.
사고가 자주 발생하는 영역.

### TEAM-1 · trigger: team-ops · auto-gate: —

팀원 SendMessage 회신 누락

- **증상**: sub-agent 가 평가 결론을 자기 화면에만 출력하고 종료. team-lead inbox 미도달.
- **Why**: idle 알림만 도착 → team-lead 평가 미수신 상태로 다음 단계 진행 불가.
- **Good**: 스폰 프롬프트 + 작업 지시 메시지 양쪽에 명시:
  ```
  회신은 반드시 SendMessage 로 team-lead 에 송신.
  화면 텍스트만 출력하고 종료 시 라우팅 안 됨.
  ```
- **검출**: team-lead 가 idle 알림 2회 연속 + 평가 메시지 0 → 즉시 강제 재요청.

### TEAM-2 · trigger: team-ops · auto-gate: —

팀원 자발적 실행

- **증상**: idle 대기 지시 무시하고 team-lead 의 SendMessage 전에 자발 실행 / 검증 시작.
- **Why**: critic 점검 시점 정합성이 무너진다.
- **Good**: 스폰 프롬프트에 명시:
  ```
  team-lead 의 명시적 "시작" 지시 전 절대 자발 실행 금지. idle 유지.
  ```
- **검출**: team-lead 는 critic 평가 중 worktree git status 점검으로 자발 실행 조기 감지.

### TEAM-3 · trigger: team-ops · auto-gate: —

self-shutdown 패턴 (fos-blog 관측)

- **증상**: `oh-my-claudecode:code-reviewer` / `architect` (docs-verifier) 가 `run_in_background: true` 로 스폰해도 idle 직후 자체 shutdown.
- **Why**: critic 만 idle 유지 성공. reviewer / verifier 는 shutdown.
- **Good**: 검사 결과 준비 시점에 즉시 새로 spawn (idle 대기 의존 금지). 죽었다는 시스템 알림 받으면 침묵 말고 새로 스폰 + 즉시 검사 지시 묶음.

### TEAM-4 · trigger: team-ops · auto-gate: —

executor cwd 격리 (main repo 오염 방지)

- **증상**: worktree 절대경로 명시했는데 executor 가 main repo 에서 `cd /main-repo` 로 작업.
- **Why**: main 오염 → origin 다이버전스 / 다른 plan 미푸시 작업과 충돌.
- **Good**: executor 프롬프트에 명시:
  ```
  모든 cd / git / 파일 편집은 worktree 절대경로 기준만. main repo 직접 cd 금지.
  의심 시 `pwd` 확인.
  ```
- **검출**: team-lead 는 executor 작업 중 `git -C {main-repo} status` 주기 점검. dirty 시 즉시 중단.

### TEAM-5 · trigger: team-ops · auto-gate: —

executor scope 확장 자체 판단

- **증상**: phase 도중 task 범위 외 (pre-existing 에러 / 발견한 bug / ADR 위반 자체 변경) 를 자체 추가. 또는 `eslint-disable` / `@ts-ignore` 자체 추가.
- **Why**: critic 점검 우회 → 사후 평가 사이클 추가 + task 본문 / 성공 기준 어긋남.
- **Good**: executor 프롬프트에 명시:
  ```
  task 범위 외 수정은 자체 판단 금지.
  eslint-disable / @ts-ignore / @ts-nocheck / @ts-expect-error 자체 추가 = 정책 변경 → 보고 필수.
  SendMessage 로 team-lead 에 보고: "X 발견, Y 수정 필요. 본 phase 포함 / 별도 plan 결정 부탁".
  ```
- **검출**: team-lead 흐름 — 보고 → critic 사후 평가 → ACCEPT (scope 확장 commit 명시) 또는 REJECT (별도 plan).

### TEAM-6 · trigger: team-ops · auto-gate: —

critic v2 재평가 시 신 파일 미재읽기

- **증상**: REVISE 후 v2 commit hash 받고도 v1 평가 그대로 반복 송신.
- **Why**: critic 이 이전 평가 컨텍스트만 가지고 회신 → 신 파일 Read 누락.
- **Good**: team-lead 재평가 메시지에 3가지 필수 포함:
  1. `Read tool 로 다음 파일을 다시 읽고 재평가해 줘` 명시 + 변경 파일 절대경로
  2. 4-5개 확인 포인트 체크리스트
  3. "직전 메시지가 첫 평가 사본일 수 있음 — 실제 파일 상태 기준으로 판정"
- **검출**: 회신이 v1 동일하면 즉시 강제 재읽기.

### TEAM-7 · trigger: team-ops · auto-gate: —

code-reviewer 에 plan 비자명 설계 결정 미전달

- **증상**: code-reviewer 가 plan 컨텍스트 모르면 정상 helper 사용을 권장하다 설계 의도와 충돌 (false positive LOW 양산).
- **Why**: team-lead 가 일일이 판정해야 하는 상황이 발생한다.
- **Good**: team-lead 의 검사 시작 메시지에 plan 의 비자명 결정 (helper 우회 사유 / 의도된 raw pattern / 의도된 placeholder 등) 1-2 줄 첨부.

### TEAM-8 · trigger: team-ops · auto-gate: —

task 재분할 시 index.json 갱신 누락

- **증상**: critic REVISE 후 phase 파일 재작성 / 추가 / 제거 시 `index.json.total_phases` + `phases` 배열 미갱신.
- **Why**: 파이프라인이 신 phase 인식 못 해 executor 가 구 phase 만 실행 → plan 핵심 누락.
- **검출**:
  ```bash
  jq -r '.total_phases as $t | .phases | length as $p | "total=\($t), len=\($p)"' tasks/{plan}/index.json
  ls tasks/{plan}/phase-*.md | wc -l   # 위 두 값과 일치
  ```
- **Good**: phase 파일과 index.json 은 같은 commit 으로 갱신.

### TEAM-9 · trigger: team-ops · auto-gate: —

cwd 추적 + 양쪽 git status 검증

- **증상**: team-lead 가 task 재작성 / commit 시 cwd 가 main repo 인지 worktree 인지 헷갈림. 동일 상대경로가 다른 파일 가리킴.
- **Why**: main repo 의 task 파일 의도치 않게 수정 / 삭제. system-reminder 알림이 어느 working tree 인지 명확히 표기 안 됨.
- **Good**: commit 전 `pwd` + 양쪽 동시 점검:
  ```bash
  git -C /Users/nhn/personal/fos-accountbook status --short
  git -C /Users/nhn/personal/fos-accountbook/.claude/worktrees/{plan} status --short
  ```

### TEAM-10 · trigger: team-ops · auto-gate: —

브랜치 확인 누락 commit 사고

- **증상**: skill / docs 변경 commit 직전 `git branch --show-current` 안 함 → PR 작업 브랜치에 무관 commit 박힘.
- **Why**: skill 외부 작업이라도 자동 mode 가 자동 switch 하는 듯. 같은 세션 두 번 발생.
- **Good**: 모든 commit 직전 `git branch --show-current` 강제 확인. main 작업이면 main, PR 브랜치 작업이면 PR 브랜치 확인 후 commit.

## team 운영 소진 체크리스트

스폰 / 메시지 / 검증 / commit 단계마다 해당 패턴 self-check.

---

## 코드 패턴 함정

`review-fix` 가 PR 리뷰 댓글 처리 후 재발 가능 패턴을 누적하는 자리.
같은 지적이 다음 PR 에서 반복되지 않도록 도메인 코드 작성 시에도 참조한다.

### CODE-1 · trigger: color-token · auto-gate: —

CSS custom property 키는 as CSSProperties 단언 필요 (PR #81)

- **증상**: `style={{ "--my-var": value }}` 가 `Properties<>` 인덱스에 없는 키라 type-check 실패 (TS2353).
- **Good**: `as CSSProperties` 단언은 그대로 유지. 단 값 부분에 number 직접 넣지 말고 `String(num)` 명시 변환으로 의도 명확화.
- **Why**: claude bot 이 "단언 제거" 권장하기 쉽지만 custom property 키 자체가 단언 원인이라 제거 불가. 값 변환만이 의미 있다.

### CODE-2 · trigger: color-token · auto-gate: —

inline style vs Tailwind arbitrary class (PR #81)

- **증상**: 토큰 var() 적용에 `style={{ color: "var(--token)" }}` 사용.
- **Good**: 단일 색상 / 크기 / 길이 토큰은 `className="text-[var(--token)]"` arbitrary class (프로젝트 관례). 다중 CSS property 또는 동적 계산 필요할 때만 inline style.
- **예외**: SVG presentation attribute var() 미해결 우회 같은 경우 inline style 정당.

### CODE-3 · trigger: markdown-write · auto-gate: md-lint

JSDoc/TSDoc 코멘트에 Tailwind 클래스 패턴 금지 (PR #94 관측)

- **증상**: Tailwind v4 의 content scanner 가 `.ts`/`.tsx` 코멘트뿐 아니라 `tasks/`·`docs/`·`.claude/skills/` 의 `.md` 파일까지 클래스 후보로 추출. arbitrary value 안에 와일드카드나 중괄호가 포함된 패턴이 layer utilities 에 invalid CSS 를 생성 → `Unexpected token` parse error → 모든 페이지 500.
- **Good**: 클래스 패턴을 prose 로 표현 (예: "color-cat 토큰 (canonical key 별)"). 코드 예시가 필요하면 `text-[var(--color-cat-KEY)] 형태` 처럼 placeholder(KEY) 로 쓴다.
- **검출**: 닫힌 `[...]` arbitrary 값 안에 와일드카드나 중괄호가 든 경우 위험 — `pnpm lint:md`(`scripts/check-tailwind-md.mjs`)가 CI 에서 자동 차단 (ADR-F29).
- **Why**: 한 번 발생하면 dev 서버가 통째로 다운된다. `@source not` 안전망은 Turbopack(Next 16 dev)에서 미작동이라(2026-06 실측) 쓰지 않고, 패턴을 안전 표기로 바꾸는 lint 게이트가 유일한 확실한 차단이다.

### CODE-4 · trigger: app-router · auto-gate: —

App Router 경계 위반

- **증상**: `actions/` 가 `lib/server/api` 거치지 않고 `fetch` 직접 호출. `services/` 가 `revalidatePath` / `requireAuth` 호출.
- **Good**: 레이어 규칙 준수 — `actions/` → `services/` → `lib/server/api`.
- **검출**: `grep -nE 'fetch\(' src/actions/` — lib/server/api 경유 없이 직접 fetch 있으면 의심.
- **Why**: 레이어 경계 위반이 누적되면 인증 / 검증 우회 가능성이 생긴다.

### CODE-5 · trigger: app-router · auto-gate: —

Shadcn 우회

- **증상**: native `<button>` / `<select>` / `<dialog>` 직접 사용. 인라인 overlay 모달이 `Dialog` / `AlertDialog` 대신 `<div>`.
- **Good**: `src/components/ui/` 의 Shadcn 컴포넌트 우선 사용.
- **검출**: `grep -nE '<button|<select|<dialog' src/components/` — Shadcn 대체 없이 native 태그 직접 쓰면 의심.
- **Why**: Shadcn 접근성 / 키보드 내비게이션 / 테마 통합이 native 직접 사용 시 무력화된다.

### CODE-6 · trigger: app-router · auto-gate: —

revalidatePath 누락

- **증상**: write Server Action 데이터 변경 후 `revalidatePath` 누락 → stale UI.
- **Good**: 데이터를 변경하는 모든 Server Action 끝에 `revalidatePath` 호출.
- **검출**: `grep -rn 'revalidatePath' src/actions/` — write action 수 대비 revalidatePath 호출 수 점검.
- **Why**: Next.js App Router 캐시가 갱신되지 않아 사용자에게 이전 데이터가 노출된다.

## 코드 패턴 누적 규칙

- `review-fix` 6.5단계에서 추출. 같은 PR 에서 ✅ 누적 / ❌ 누락 금지 분류 후 코드 패턴 섹션에 추가
- ✅ 재현 가능 패턴 — 같은 실수가 다른 코드에서도 발생 가능. 명령으로 검출 가능
- ❌ 1회성 / 특정 plan 컨텍스트에서만 의미 / 칭찬 / 단순 확인 요청

---

fos-accountbook 전용. 다른 레포는 각자 common-pitfalls 유지.
