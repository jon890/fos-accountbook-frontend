# review-fix 오버레이 — fos-accountbook

## 학습 누적 위치

review-fix 9단계(학습 누적) 에서 **재현 가능한 코드 패턴**(같은 실수가 다른 코드에서도 날 수 있고 검출 가능)을 찾으면 아래 위치에 기록한다.

- 파일: `.claude/skills/_shared/common-pitfalls.md` → `## 코드 패턴 함정` 섹션
- 형식:

  ```
  ### CODE-N · trigger: <상황 키워드> · auto-gate: —

  <한 줄 요약> (PR #<번호>)

  - **증상**: ...
  - **Good**: ...
  - **검출**: <grep/lint 명령>
  - **Why**: ...
  ```

- 1회성 오타·특정 PR 한정·칭찬은 기록하지 않는다 (common-pitfalls.md 상단 "코드 패턴 누적 규칙" 참조).

ADR 급 결정(라이브러리/스택 의사결정)은 `docs/adr.md` 에 `## ADR-FXX` 형식으로 기록한다 — 형식은 CLAUDE.md 문서 표에 이미 안내되어 있으므로 여기서는 반복하지 않는다.
