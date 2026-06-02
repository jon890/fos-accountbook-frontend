# Phase 03 — 작업종류→함정 인덱스 + trigger/auto-gate 태그

**Goal**: "전부 self-check" 를 "작업 종류에 맞는 함정만 참조" 로 바꾸는 핵심 phase. 상단에 작업종류→함정 인덱스 표를 신설하고, 각 함정에 trigger 와 auto-gate 태그를 단다.

## 배경

참조 구조가 작동하지 않는다 (2026-06-02 실증 — BLG9 가 파일에 있었는데도 재발).

- 현 참조는 전부 "task 제출 전 **모든** 패턴 self-check" (planning·build-with-teams·task-create).
- 452줄(분리 후에도 다수)을 매 작업마다 통독 대조하는 건 LLM 에이전트에게 비현실적 → 실제로 안 읽힌다.
- CLAUDE.md 의 "상황별 ADR 필수 참조" 표(작업→ADR 매핑)는 작동하는데, common-pitfalls 엔 그 매핑이 없다.

해결: 함정을 성격으로 나눠 다른 경로로 보장한다.

- **자동 검출형** (빌드 깨짐·타입·lint) → 게이트가 막는다 (phase 05). 사람 self-check 대상에서 제외.
- **판단형** (설계·권한·UX) → 작업종류 인덱스로 필요한 것만 참조.

## 작업

1. **작업종류→함정 인덱스 표 신설** (파일 상단, CLAUDE.md ADR 표 형식):

   | 작업 종류 | 봐야 할 함정 | 자동 게이트 |
   |---|---|---|
   | markdown/task 문서 작성 | BLG9(재번호) | task md lint (phase 05) |
   | 색 토큰 / 스타일 | CODE-(3-3,3-4 재번호) | — |
   | Server Action 작성 | CLAUDE.md ADR-F25/F06 참조 | — |
   | App Router 경계 | FE-(재번호) | — |
   | plan 작성 | PLAN-1~9 | critic |
   | team 운영 | TEAM-1~10 | — |

   (실제 작업종류 키는 남은 함정에 맞춰 확정.)

2. **각 함정에 머신 파싱 태그** — 헤더 줄에:
   - `trigger:` 어떤 작업에서 관련되는가 (인덱스의 작업종류 키와 동일 어휘 — 통제 어휘)
   - `auto-gate:` 자동 검출 가능 여부 (가능하면 게이트 이름, 아니면 `—`)
   - 예: `### BLG9-재번호 · trigger: markdown-write · auto-gate: md-lint`

3. **2분류 명시** — 파일 상단에 "이 문서 쓰는 법" 섹션:
   - 자동 검출형은 게이트가 막으니 통독 불필요
   - 판단형만 작업종류 인덱스로 골라 읽기

4. **단일 소스 규칙** — 각 함정의 `trigger:` 태그가 진실, 상단 인덱스 표는 그걸 모은 뷰. "축적 규칙" 에 "함정 추가 시 인덱스 행도 갱신" 명시.

5. **통제 어휘 정의** — domain 키 목록(markdown-write, color-token, server-action, app-router, plan-write, team-ops 등)을 파일에 정의. phase 04 의 phase frontmatter domain 태그가 이 목록에서만 고르게.

## 주의

- 인덱스의 작업종류 키 = 함정 `trigger` 태그 = phase 04 의 phase domain 태그. **세 곳의 어휘가 같아야** 매칭이 된다.
- 인덱스에 위험 패턴(arbitrary class 안 와일드카드/중괄호)을 예시로 적지 말 것 — BLG9 재발. placeholder(KEY) 또는 prose 로.

## 검증

```bash
F=.claude/skills/_shared/common-pitfalls.md
grep -cE "^\| 작업 종류" "$F"             # 인덱스 표 헤더 존재
grep -cE "trigger:" "$F"                  # 함정마다 trigger 태그
grep -cE "auto-gate:" "$F"                # 함정마다 auto-gate 태그
# 위험 패턴(arbitrary 안 와일드카드/중괄호) 재유입 점검은 phase 05 의 md lint 에 위임
# (여기서 위험 리터럴을 직접 쓰면 BLG9 자기재발)
```

성공 기준:

- 상단에 작업종류→함정 인덱스 표 존재
- 모든 함정에 trigger + auto-gate 태그
- 통제 어휘(domain 키 목록) 정의됨
- 위험 패턴 리터럴 0건
