# Phase 04 — 참조 스킬 갱신: '모든 패턴' → phase domain 매칭 주입

**Goal**: common-pitfalls 를 참조하는 스킬(planning·build-with-teams·task-create)이 "모든 패턴 self-check" 대신, phase 의 작업 종류에 맞는 함정만 참조하도록 바꾼다.

## 배경

phase 03 에서 작업종류→함정 인덱스 + trigger 태그를 만들었다. 이제 스킬이 그걸 쓰게 한다.

현 참조 (모두 "전부"):

- `planning/SKILL.md:21` — "시드 7 패턴 + 레포별 +α 를 **모두** self-check"
- `planning/task-create.md:151` — "§ 1 패턴 **모두** 소진"
- `build-with-teams/SKILL.md:365` — critic 체크 7 "**모든** 패턴이 사전 해소되었는가?"

## 작업

1. **phase frontmatter 에 domain 태그 도입** — `planning/task-create.md` 의 phase 작성 규칙에 추가:
   - 각 phase 파일에 `domain:` 태그 (phase 03 의 통제 어휘에서 선택, 복수 가능)
   - 예: markdown 예시를 담는 phase → `domain: [markdown-write]`
   - task-create 체크리스트에 "모든 phase 에 domain 태그" 추가

2. **planning/SKILL.md 갱신** — "모든 패턴 self-check" →
   - "각 phase 의 `domain` 태그로 common-pitfalls 인덱스에서 해당 함정만 참조 + self-check"
   - 자동 검출형(auto-gate 있는 함정)은 게이트가 막으니 self-check 면제 명시

3. **build-with-teams/SKILL.md 갱신**:
   - executor 실행 직전, phase 의 domain 태그로 인덱스에서 매칭 함정만 뽑아 executor 프롬프트에 주입
   - critic 체크 7 "모든 패턴" → "이 phase 의 domain 에 해당하는 함정이 사전 해소됐는가?"

4. **구번호 → 신번호 참조 갱신** — phase 02 의 매핑 표로 스킬·docs 의 `§ 1` / `P1~P9` / `1-1` 참조를 신 번호체계(PLAN-/TEAM-/CODE-)로 교체.

5. **누락 안전장치 명시** — phase domain 태그를 빠뜨린 phase 는 critic 이 `domain 미지정` 으로 REVISE. (자동 검출형은 태그와 무관하게 phase 05 게이트가 항상 막으므로 빌드 깨짐은 안 샌다.)

## 주의

- 인덱스 작업종류 키 = 함정 trigger = phase domain 태그, 세 어휘 일치 필수 (phase 03 통제 어휘 그대로).
- 스킬 파일 안에서도 위험 arbitrary 패턴 리터럴 금지 (BLG9).

## 검증

```bash
# "모든 패턴" 류 표현이 domain 매칭으로 교체됐는지
grep -rn "모든 패턴" .claude/skills/planning .claude/skills/build-with-teams   # 잔존 시 점검
grep -rn "domain" .claude/skills/planning/task-create.md                       # domain 태그 규칙 존재
# 구번호 참조 잔존 점검 (신번호로 교체됐는지)
grep -rnE "§ [0-9]|P[0-9]\b|[0-9]-[0-9]" .claude/skills/planning .claude/skills/build-with-teams
```

성공 기준:

- task-create 에 phase domain 태그 규칙 + 체크리스트 항목 추가
- planning·build-with-teams 가 "모든 패턴" → "domain 매칭 함정" 으로 갱신
- 자동 검출형 self-check 면제 + domain 미지정 REVISE 안전장치 명시
- 구번호 참조 0건 (신번호로 교체)
