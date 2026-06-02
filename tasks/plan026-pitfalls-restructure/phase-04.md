# Phase 04 — 참조 스킬 갱신: '모든 패턴' → phase domain 매칭 주입

**Goal**: common-pitfalls 를 참조하는 스킬(planning·build-with-teams·task-create)이 "모든 패턴 self-check" 대신, phase 의 작업 종류에 맞는 함정만 참조하도록 바꾼다.

## 배경

phase 03 에서 작업종류→함정 인덱스 + trigger 태그를 만들었다. 이제 스킬이 그걸 쓰게 한다.

common-pitfalls 를 참조하는 스킬은 **5개** (`grep -rln common-pitfalls .claude/skills/` 로 확인):

- `planning/SKILL.md:21` — "시드 7 패턴 + 레포별 +α 를 **모두** self-check" (※ "7 패턴" 은 stale — § 1 은 실제 9개. rewrite 시 함께 정정)
- `planning/task-create.md:151` — "§ 1 패턴 **모두** 소진"
- `build-with-teams/SKILL.md:365` — critic 체크 7 "**모든** 패턴이 사전 해소되었는가?"
- `review-fix/SKILL.md` — common-pitfalls 누적/참조 (구 § 3 PR review 자리)
- `self-healing-teams/SKILL.md` — common-pitfalls 참조

phase 01 이 구 § 3 을 들어내고 phase 02 가 재번호하므로, 뒤 2개 스킬의 구번호 참조가 dangling 된다 → 5개 모두 갱신 대상.

## 작업

1. **phase frontmatter 에 domain 태그 도입** — `planning/task-create.md` 의 phase 작성 규칙에 추가:
   - 각 phase 파일에 `domain:` 태그 (phase 03 의 통제 어휘에서 선택, 복수 가능)
   - 예: markdown 예시를 담는 phase → `domain: [markdown-write]`
   - **domain 으로 주입되는 건 CODE-N 함정만** — PLAN-/TEAM- 은 planner·team-lead 상시 점검이라 domain 태그 어휘에서 제외.
   - task-create 체크리스트에 "모든 phase 에 domain 태그" 추가

2. **planning/SKILL.md 갱신** — "모든 패턴 self-check" →
   - "각 phase 의 `domain` 태그로 common-pitfalls 인덱스에서 해당 CODE-N 함정만 참조 + self-check"
   - 자동 검출형(auto-gate 있는 함정)은 게이트가 막으니 self-check 면제 명시
   - "시드 7 패턴" stale 표현 정정 (§ 1 은 9개 → 신 PLAN-1~9)

3. **build-with-teams/SKILL.md 갱신**:
   - executor 실행 직전, phase 의 domain 태그로 인덱스에서 매칭 CODE-N 함정만 뽑아 executor 프롬프트에 주입
   - critic 체크 7 "모든 패턴" → "이 phase 의 domain 에 해당하는 함정이 사전 해소됐는가?"

4. **구번호 → 신번호 참조 갱신 (5개 스킬 전체)** — `number-map.md`(phase 02 산출)를 Read 해 매핑 적용:
   - `planning/SKILL.md`, `planning/task-create.md`, `build-with-teams/SKILL.md`, `review-fix/SKILL.md`, `self-healing-teams/SKILL.md` 의 `§ N` / `P1~P9` / `1-1` 등 구 참조를 신 체계(PLAN-/TEAM-/CODE-)로 교체.
   - **학습 라우팅 포맷 템플릿 (decay 방지 — 단순 치환 아님)**:
     - `build-with-teams/SKILL.md:602`, `review-fix/SKILL.md:411` 의 `` `### P{N}.` `` 누적 포맷
     - `self-healing-teams/SKILL.md:77` 의 `BLG#` 누적 위치
     - 이 셋은 미래 함정을 어떤 번호로 적을지 지시하는 템플릿이라, 구 스킴(`P{N}`·`BLG#`)으로 두면 다음 학습 사이클마다 함정이 구번호로 추가돼 통일 체계가 자기복원(decay)된다.
     - **카테고리-aware 로 재서술**: 새 함정의 성격(plan/team/code)에 맞춰 `PLAN-N` / `TEAM-N` / `CODE-N` prefix 로 적도록 포맷을 고친다.

5. **누락 안전장치 명시** — phase domain 태그를 빠뜨린 phase 는 critic 이 `domain 미지정` 으로 REVISE. (자동 검출형은 태그와 무관하게 phase 05 게이트가 항상 막으므로 빌드 깨짐은 안 샌다.)

## 주의

- 인덱스 작업종류 키 = 함정 trigger = phase domain 태그, 세 어휘 일치 필수 (phase 03 통제 어휘 그대로).
- 스킬 파일 안에서도 위험 arbitrary 패턴 리터럴 금지 (BLG9).

## 검증

```bash
SK=".claude/skills/planning .claude/skills/build-with-teams .claude/skills/review-fix .claude/skills/self-healing-teams"
# "모든 패턴" 류 표현이 domain 매칭으로 교체됐는지
grep -rn "모든 패턴" $SK   # 잔존 시 점검
grep -rn "domain" .claude/skills/planning/task-create.md   # domain 태그 규칙 존재
# 구번호 식별자 + 학습 라우팅 포맷 템플릿 앵커링
# (함정 번호 1-1~3-17 은 스킬 본문에 § 참조로만 등장 → § 0건으로 커버.
#  `\b[1-4]-[0-9]+\b` 류는 섹션헤딩 2-1·자연어 "4-5명" 오탐이라 쓰지 않는다.
#  P{N}·BLG# 는 미래 함정 번호 포맷 템플릿 — 잔존 시 decay 하므로 반드시 검출.)
grep -rnE "§ [1-4]\b|\bP[1-9]\b|P\{N\}|BLG#|BLG[0-9]|### P[0-9]" $SK   # = 0 (신번호·신포맷으로 교체됨)
```

성공 기준:

- task-create 에 phase domain 태그 규칙 + 체크리스트 항목 추가 (CODE-N 한정)
- planning·build-with-teams 가 "모든 패턴" → "domain 매칭 CODE-N 함정" 으로 갱신
- review-fix·self-healing-teams 구번호 참조 갱신 (또는 의도적 out-of-scope 명시)
- 학습 라우팅 포맷 템플릿(`### P{N}.`·`BLG#`) 카테고리-aware 재서술 (decay 방지)
- 자동 검출형 self-check 면제 + domain 미지정 REVISE 안전장치 명시
- 구번호·구포맷 참조 0건 (위 broaden 된 grep 기준)
