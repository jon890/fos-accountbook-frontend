# Task 생성 가이드

이 문서는 AI 에이전트가 구현 task를 생성할 때 따르는 규칙이다.

## 디렉터리 구조

```
tasks/
  {task-name}/
    index.json        # task 메타데이터 및 phase 목록
    phase-01.md       # phase 1 프롬프트 (Claude에게 전달되는 실행 지시)
    phase-02.md
    ...
```

## index.json 스키마

**모든 필드가 필수**. 생략하면 `run-phases.py`가 오류를 발생시키거나 기존 task와 구조가 불일치한다.

```jsonc
{
  // ── Task 메타데이터 (필수) ──
  "name": "task-name", // kebab-case, 디렉터리명과 일치
  "description": "무엇을 구현하는 task인지 한 줄 설명",
  "created_at": "2026-04-04T00:00:00Z", // ISO 8601, 최초 생성 시각
  "updated_at": "2026-04-04T00:00:00Z", // run-phases.py가 자동 갱신
  "status": "pending", // pending | running | completed | failed | blocked
  "current_phase": 0, // 현재 실행 중인 phase 번호 (0 = 미시작)
  "total_phases": 3, // phases 배열 길이와 일치해야 함
  "error_message": null, // failed 시 오류 메시지
  "blocked_reason": null, // blocked 시 사유

  // ── Phase 목록 (필수, 1개 이상) ──
  "phases": [
    {
      "number": 1, // 1부터 순차 증가
      "title": "phase 제목", // 간결하게 (한글 OK)
      "file": "phase-01.md", // 동일 디렉터리 내 파일명
      "status": "pending", // pending | running | completed | failed | blocked
      "allowedTools": [
        // Claude CLI에 전달할 도구 목록
        "Read",
        "Write",
        "Edit",
        "Bash",
        "Glob",
        "Grep",
      ],
    },
  ],
}
```

### status 값

- `pending` — 아직 실행 전
- `running` — 현재 실행 중
- `completed` — 성공 완료
- `failed` — 오류 발생 (error_message 참고)
- `blocked` — 사용자 개입 필요 (blocked_reason 참고)

### 검증 체크리스트

index.json 작성 후 아래를 확인:

- [ ] `total_phases` == `phases` 배열 길이
- [ ] 모든 phase에 `number`, `title`, `file`, `status`, `allowedTools` 존재
- [ ] `number`가 1부터 순차 증가
- [ ] 각 `file`에 해당하는 `.md` 파일이 실제로 존재
- [ ] `created_at`이 ISO 8601 형식

---

## phase 파일 작성 규칙

### 핵심 원칙

1. **자기완결적** — 각 phase 프롬프트는 이전 대화 컨텍스트 없이 독립 실행된다. 필요한 모든 맥락을 프롬프트 안에 포함해야 한다.
2. **단일 책임** — 한 phase는 명확히 하나의 작업 단위를 담당한다.
3. **검증 가능** — phase 마지막에 실행 가능한 성공 기준을 명시한다.

### phase 파일 구조

```markdown
# Phase N: {제목}

## 컨텍스트

이 프로젝트가 무엇인지, 현재 상태, 이 phase가 해야 하는 일.
관련 문서 경로 명시 (읽어서 구조 파악).

## 목표

이 phase에서 구현해야 할 것.

## 작업 목록

- [ ] 구체적인 작업 (파일 경로 포함)

## 성공 기준

- `pnpm build` 성공
- `pnpm test` 성공
- 특정 파일이 존재해야 함

## 주의사항

- CLAUDE.md 규칙 준수 (any 금지, alert() 금지 등)
- 하지 말아야 할 것

## Blocked 조건

다음 상황이면: `PHASE_BLOCKED: {이유}`
```

### 특수 마커

```
PHASE_BLOCKED: {이유}    # 사용자 개입 필요 → exit 2
PHASE_FAILED: {오류}     # 복구 불가능 → exit 1
```

---

## Phase 분리 기준

| 기준           | 설명                                        |
| -------------- | ------------------------------------------- |
| 의존성 경계    | 이전 phase 결과물이 있어야 시작 가능        |
| 검증 가능 단위 | `pnpm build`, `pnpm test` 등 독립 검증 가능 |
| 실패 격리      | 실패 시 롤백 범위를 최소화할 수 있는 단위   |

**권장 크기**: 30분 ~ 2시간 작업량.

---

## fos-accountbook 레이어별 phase 가이드

| 추가 순서 | 내용                                               |
| --------- | -------------------------------------------------- |
| 1         | `src/types/` — TypeScript 타입 정의                |
| 2         | `src/services/{domain}/` — API 호출 함수           |
| 3         | `src/actions/{domain}/` — Server Action + Zod 검증 |
| 4         | `src/components/{domain}/` — UI 컴포넌트           |
| 5         | `src/app/(authenticated)/` — 페이지 라우트 통합    |
| 6         | `src/__tests__/` + `pnpm build` — 검증             |

각 phase는 반드시 `CLAUDE.md`와 `docs/code-architecture.md` 를 참조하도록 명시할 것.
