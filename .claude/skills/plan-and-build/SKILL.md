---
name: plan-and-build
description: AI 에이전트 하네스를 사용한 대규모 구현 자동화. 논의 → 계획 → task 생성 → 순차 실행. 새 기능 추가, 리팩토링 등 multi-phase 작업에 사용.
---

# plan-and-build

새 기능이나 대규모 변경을 phase 단위로 분리하고, `run-phases.py` 하네스를 통해 Claude Code가 자동으로 순차 실행하는 시스템.

## 실행 절차

### 1. 문서 파악

`docs/` 하위 문서들을 읽어 프로젝트 기획·아키텍처·설계 의도를 파악한다.
필요 시 여러 Explore 에이전트를 병렬로 사용한다.

참조 문서:

- `docs/prd.md` — 제품 범위, 기능 명세
- `docs/data-schema.md` — TypeScript 타입, API 엔드포인트
- `docs/flow.md` — 사용자 플로우
- `docs/code-architecture.md` — 계층 구조, 핵심 패턴
- `docs/adr.md` — 기술 결정 기록
- `CLAUDE.md` — 코딩 규칙, 금지사항

### 2. 논의

구체화가 필요한 점, 기술적으로 논의할 점을 사용자에게 제시한다.
사용자가 충분히 논의됐다고 판단하면 3단계로 넘어간다.

### 3. 구현 계획 초안

`prompts/task-create.md`를 정확히 숙지한 후, 다음을 포함한 초안을 작성한다:

- phase별 분리 이유와 작업 목록
- 성공 기준 (실행 가능한 명령어)
- 논의 필요한 사항

사용자 피드백을 받아 계획을 확정한다.

### 4. Task 생성

`prompts/task-create.md` 형식에 따라 task와 phase 파일을 생성한다:

```
tasks/{task-name}/
  index.json
  phase-01.md
  phase-02.md
  ...
```

각 phase 프롬프트는 **자기완결적**이어야 한다 — 이전 대화 없이 독립 실행 가능.

### 5. 실행

```bash
python3 scripts/run-phases.py tasks/{task-name}
# 특정 phase부터 재개:
python3 scripts/run-phases.py tasks/{task-name} --from-phase 3
```

### 6. 알림 (DOORAY_WEBHOOK_URL 설정 시 자동)

run-phases.py 종료 코드에 따라 웹훅 알림 발송:

| exit code | 의미    | 메시지                                       |
| --------- | ------- | -------------------------------------------- |
| 0         | 성공    | `✅ Task {name} 완료 (N phases)`             |
| 1         | 오류    | `❌ Task {name} phase {n} 실패: {error}`     |
| 2         | blocked | `⚠️ Task {name} phase {n} blocked: {reason}` |

```bash
export DOORAY_WEBHOOK_URL="https://hook.dooray.com/services/..."
python3 scripts/run-phases.py tasks/{task-name}
```

---

## 구조

```
tasks/
  {task-name}/
    index.json        # task 메타데이터 + phase 목록
    phase-01.md       # 자기완결적 실행 프롬프트
    phase-02.md
    ...

scripts/
  run-phases.py       # phase 순차 실행기 (실시간 스트리밍, --from-phase 지원)

prompts/
  task-create.md      # task/phase 작성 가이드
```

## fos-accountbook 레이어별 phase 순서

새 도메인 추가 시 권장 phase 분리:

| Phase | 내용                              |
| ----- | --------------------------------- |
| 1     | TypeScript 타입 + API 서비스 함수 |
| 2     | Server Actions (Zod 검증 포함)    |
| 3     | UI 컴포넌트                       |
| 4     | 페이지 라우트 통합                |
| 5     | 대시보드·요약 통합 (있을 경우)    |
| 6     | 테스트 + 빌드 검증                |

## Exit Codes

| 코드 | 의미                                              |
| ---- | ------------------------------------------------- |
| 0    | 모든 phase 완료                                   |
| 1    | phase 실행 오류 (index.json error_message 참고)   |
| 2    | 사용자 개입 필요 (index.json blocked_reason 참고) |
