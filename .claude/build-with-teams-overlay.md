# build-with-teams 오버레이 — fos-accountbook

공용 코어(`~/.claude/skills/build-with-teams`)에 fos-accountbook 특화를 주입한다.

## 통합 검증 명령

`CLAUDE.md` 는 `pnpm lint && pnpm test` 까지만 명시한다. 코어의 통합 검증 단계가 요구하는 **전체** 통합 검증은 다음을 실행한다.

```bash
# cwd: <worktree root>
pnpm lint && pnpm lint:md && pnpm test:ci && pnpm build
```

- `pnpm build`(`next build`)가 타입 검사를 겸한다 — 별도 `tsc --noEmit` 스크립트 없음.
- `lint:md`는 `scripts/check-tailwind-md.mjs` — Tailwind arbitrary class 위험 패턴을 markdown 안에서 검출.
- **worktree 직후 setup**: `pnpm install`.

## 에이전트 이름

전용 executor·docs-verifier 에이전트 없음 — 코어 기본값 그대로 `oh-my-claudecode:executor` / `oh-my-claudecode:architect`(docs-verifier 용도)를 스폰한다.

## index.json 스키마

기존 `tasks/plan{N}-*/index.json` 실측 기준 (코어 예시와 필드 이름이 다르다):

```jsonc
{
  "name": "plan{N}-{slug}",              // 디렉터리명과 일치
  "description": "무엇을 구현하는 plan인지 한 줄 + (있으면) v2 갱신 요약",
  "status": "pending",                   // pending | completed
  "created_at": "2026-07-16",            // YYYY-MM-DD
  "total_phases": 4,                     // phases 배열 길이와 일치
  "related_docs": ["docs/adr.md", "CLAUDE.md"],
  "phases": [
    {
      "number": 1,                       // 1부터 순차 증가
      "file": "phase-01.md",
      "title": "phase 제목",
      "model": "sonnet",                 // haiku | sonnet | opus
      "status": "pending"                // pending | completed
    }
  ]
}
```

검증 체크리스트:

- `total_phases` == `phases` 배열 길이
- 각 phase에 `number`/`file`/`title`/`model`/`status` 존재
- `number`가 1부터 순차 증가, 각 `file`이 실제 존재

## common-pitfalls 경로

`.claude/skills/_shared/common-pitfalls.md` — critic·code-reviewer는 phase의 `domain` 태그로 해당 `CODE-N` 함정만 골라 점검한다 (통제 어휘 표는 파일 상단 참조). 전체 통독 금지.

## 브랜치 / 커밋 컨벤션

`CLAUDE.md` "Git & PR Conventions"가 단일 소스 — 요약만 여기 남긴다.

- **branch**: `plan/{N}-{slug}` (코어 기본값과 동일). `/planning`이 이미 push했으면 **새 브랜치를 만들지 않고 이어 쓴다**.
- **단일 PR 원칙**: 계획+구현을 한 PR로 묶는다. `plan/{N}` → main PR은 `/build-with-teams`가 구현 완료 후 1개만 생성 (계획 단계 PR 별도 생성 금지 — plan026 계획 PR 선(先)머지가 구현 PR과 충돌한 사례).
- **main 직접 push 차단** — branch protection. 완료 마킹도 반드시 `plan/{N}` 브랜치 안에서.
- **PR 제목**: `type(scope): description` 형식 엄수.
- **중복 실행 방지**: `index.json.status == "completed"`면 재실행 금지 (코어 사전 검증의 완료 상태 점검과 동일 축).
