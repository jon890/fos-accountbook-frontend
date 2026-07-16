# docs-check 오버레이 — fos-accountbook

공용 코어(`~/.claude/skills/docs-check`)에 fos-accountbook 특화를 주입한다.

## docs 구조 · 문서 목록

`CLAUDE.md` "컨텍스트 문서" 표가 단일 소스. 대상 파일:

```bash
# cwd: <repo root>
ls docs/prd.md docs/adr.md docs/data-schema.md docs/flow.md \
   docs/code-architecture.md docs/testing-strategy.md docs/calendar-api.md \
   CLAUDE.md .claude/skills/*/SKILL.md .claude/skills/_shared/*.md
```

- **ADR**: 단일 파일 `docs/adr.md` (디렉터리 아님).
    - 구조: 상단 `## ADR Index` 섹션이 링크 목록, 본문은 `## ADR-FNN: ...` 헤딩.
    - 앵커: `<a id>` 별도 없이 헤딩 자체가 앵커(GitHub 자동 slug).
    - 코어 검증 범위: 별도 앵커 검증은 미적용, Index ↔ 본문 번호 일치만 확인.
- 백엔드 ADR은 별도 레포(`fos-accountbook-backend/docs/adr.md`) 소관 — 이 레포 docs-check 범위 아님.

## ADR Index 동기화 검증 (코어 명령 대입)

```bash
# cwd: <repo root>
BODY=$(grep -oE '^## ADR-F[0-9]+' docs/adr.md | grep -oE 'ADR-F[0-9]+' | sort -u)
INDEX=$(grep -oE '\[ADR-F[0-9]+\]' docs/adr.md | grep -oE 'ADR-F[0-9]+' | sort -u)
diff <(echo "$BODY") <(echo "$INDEX") && echo "OK: ADR Index synced"
```

## 부패(A) 검사용 grep — 레포 특화 대조 대상

```bash
# cwd: <repo root>
# data-schema.md 가 언급하는 타입/엔드포인트가 실제 코드에 존재하는지
grep -oE '`[a-zA-Z][a-zA-Z0-9]*Action`' docs/data-schema.md | sort -u | while read -r fn; do
  name=$(echo "$fn" | tr -d '`')
  grep -rq "export.*function $name\|export const $name" src/actions/ 2>/dev/null || echo "DECAY: $name — docs/data-schema.md 언급, src/actions/ 에 없음"
done

# ADR-F 결정 대상 컴포넌트/경로가 실제 존재하는지는 케이스별 grep (자동화 어려움 — 사람 판단)
```

## common-pitfalls · docs 컨벤션 경로

- `.claude/skills/_shared/common-pitfalls.md` — CODE-N(자동 검출형) 항목이 docs-check의 F(가독성) 축과 일부 겹친다. 중복 발견 시 pitfalls 쪽을 참조로 두고 이 오버레이에 재복제하지 않는다.
- 문서 간 책임 분리 표·ADR 자명성 점검 3문항은 `CLAUDE.md`가 단일 소스 (docs-check 코어의 동일 절차와 내용 일치 — 별도 표 신설 없음).

## docs-verifier 전용 에이전트

**없음** — `.claude/agents/`에 자체 docs-verifier가 없다.
코어의 "전용 에이전트가 없으면 범용 read-only 리뷰 에이전트(예: `verifier`)에 위임하거나, 위임 불가 환경이면 메인이 직접 6축을 점검한다"는 기본 동작을 그대로 따른다 — 이 오버레이에서 억지로 전용 에이전트를 만들지 않는다.

## 실행 주기

`build-with-teams` 대규모 plan(4+ phase) 완료 후 + 분기별 정기. `CLAUDE.md` "핵심 워크플로우 스킬" 표에도 동일 트리거가 명시되어 있다.
