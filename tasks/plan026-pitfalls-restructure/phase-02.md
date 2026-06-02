# Phase 02 — § 기호 제거 + 번호체계 통일 + 형식 정리

**Goal**: phase 01 에서 분리된 common-pitfalls 의 가독성을 정리한다. `§` 기호 제거, 혼재된 번호체계 통일, 한 줄 과압축 해소.

## 배경

현 파일은 가독성이 떨어진다 (2026-06-02 진단):

- **`§` 기호 남용** — `# § 1.`, `# § 2.` … 이 프로젝트 CLAUDE.md 와 korean-style.md 가 명시 금지한 기호.
- **번호체계 4종 혼재** — `P1~P9`, `BLG1~`, `1-1~1-9`, `2-1~2-10`, `3-1~3-17` 이 섞여 어느 항목이 어느 묶음인지 한눈에 안 들어온다.
- **헤딩 숫자 prefix** (`## 1-1.`) — CLAUDE.md docs 형식 7번(자동 번호 이중) 위반.
- **한 줄 과압축** — Bad·Good·Why·검출·주의를 한 문단에 욱여넣어 핵심이 안 보인다 (docs 형식 6번 위반).

## 작업

1. **`§` 제거** — `# § N. 제목` → `## 제목` 일반 헤더로. 본문의 `§ N` 참조도 "섹션" 또는 직접 이름으로.
2. **번호체계 통일** — 묶음별 prefix 로 단일화:
   - plan 작성 → `PLAN-1 ~ PLAN-9`
   - team 운영 → `TEAM-1 ~ TEAM-10`
   - 코드 패턴 (남은 것) → **단일 `CODE-1 ~`** (구 3-3, 3-4, BLG9, FE1~3 을 순차 재번호). BLG9·FE 도 별도 prefix 없이 모두 `CODE-N` 으로 — 도메인 구분은 phase 03 의 `trigger:` 태그가 담당하므로 prefix 는 단일.
   - 매핑 표(구번호 → 신번호)를 **`tasks/plan026-pitfalls-restructure/number-map.md` 파일로 산출** (커밋 메시지 의존 금지 — phase 04 executor 가 Read 로 신뢰성 있게 읽는다).
3. **헤딩 숫자 prefix 제거** — `## PLAN-1. 수치 추측` 형태로 식별자만 유지, markdown 자동번호와 이중 안 되게.
4. **한 줄 압축 해소** — 각 함정을 일관 형식으로:
   - **증상** (한 줄)
   - **Good** (권장 — 한 줄)
   - **검출** (가능하면 `grep` 명령)
   - **Why** (1줄 — 가드 의도)
   - 위 4개를 sub-bullet 으로 분리, 한 문단 압축 금지.
5. **korean-style 점검** — `§` 외 외래어·명사형 종결 등 CLAUDE.md / korean-style.md 규칙 적용.

## 주의

- **내용(함정 자체)은 바꾸지 않는다.** 이 phase 는 표기/형식만. 함정 추가·삭제 금지(분리는 phase 01 에서 끝).
- 번호 변경은 phase 04 의 스킬 참조 갱신과 짝이다 — 매핑을 `number-map.md` 파일로 반드시 남긴다 (phase 04 가 Read).
- 코드 패턴은 단일 `CODE-N` 으로 — phase 03 인덱스도 같은 단일 체계를 쓰므로 BLG9-/FE- 별도 prefix 신설 금지.

## 검증

```bash
F=.claude/skills/_shared/common-pitfalls.md
grep -c "§" "$F"                          # = 0 (기호 제거)
grep -cE "^#+ [0-9]+-[0-9]+" "$F"         # = 0 (헤딩 숫자 prefix 제거)
grep -cE "PLAN-|TEAM-|CODE-" "$F"         # > 0 (신 번호체계 적용)
test -f tasks/plan026-pitfalls-restructure/number-map.md && echo "number-map 산출됨"
```

성공 기준:

- `§` 0건, 헤딩 숫자 prefix 0건
- 모든 함정이 `PLAN-/TEAM-/CODE-` 단일 체계 (코드 패턴은 전부 CODE-N)
- 각 함정이 증상/Good/검출/Why sub-bullet 분리 형식
- `number-map.md` 파일 산출 (구→신 번호 매핑)
