---
name: commit-convention
description: |
  이 프로젝트의 Git 커밋 컨벤션 가이드. 커밋을 만들거나 staged 변경사항을 커밋하거나,
  "커밋해줘", "commit", "변경사항 저장" 등의 요청이 있을 때 반드시 이 스킬을 따른다.
  커밋 메시지 작성, 의미 단위 분리, 린트 확인까지 전 과정에 적용한다.
---

# 커밋 컨벤션 — fos-accountbook

## 커밋 전 필수 확인

커밋 전에 항상 다음을 순서대로 실행한다:

```bash
# 1. 린트 + 타입 체크 (병렬 실행)
pnpm lint & pnpm tsc --noEmit & wait

# 2. 변경된 파일과 관련된 테스트만 실행 (빠름)
STAGED=$(git diff --staged --name-only)
[ -n "$STAGED" ] && pnpm jest --findRelatedTests $STAGED || pnpm jest
```

- **에러가 있으면 먼저 수정하고 커밋한다.**
- `--no-verify` 플래그는 절대 사용하지 않는다.
- staged 파일이 없으면 `pnpm jest`로 전체 테스트를 실행한다.

---

## 커밋 메시지 형식

```
type(scope): 한글로 작성한 설명

(필요 시 본문 — 무엇을, 왜 변경했는지)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### type 종류

| type | 사용 상황 |
|------|-----------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `style` | UI/CSS 변경, 스타일만 수정 (동작 변화 없음) |
| `refactor` | 기능 변화 없는 코드 구조 개선 |
| `chore` | 빌드 설정, 의존성, 툴링, 설정 파일 변경 |
| `docs` | 문서 추가/수정 (README, 주석 등) |
| `test` | 테스트 코드 추가/수정 |
| `perf` | 성능 개선 |
| `ci` | CI/CD 파이프라인 변경 |

### scope 예시

`transactions`, `dashboard`, `expenses`, `incomes`, `categories`, `layout`, `auth`, `api`, `claude` 등
변경된 기능/영역을 나타내는 소문자 단어.

### 메시지 작성 원칙

- **한글**로 작성한다.
- 제목은 명령형 동사로 시작한다: "추가", "수정", "제거", "개선", "변경"
- 제목은 50자 이내, 마침표 없이
- "무엇을 했다"가 아니라 "왜 했는지"를 담는다

**좋은 예:**
```
feat(transactions): 지출/수입 통합 다이얼로그로 전환 가능하도록 개선
fix(filters): 필터 칩 활성 상태 배경색이 표시되지 않는 버그 수정
style(layout): 바텀 내비게이션 버튼 색상을 지출 테마로 통일
chore(claude): 커밋 컨벤션 스킬 추가
```

**나쁜 예:**
```
update files          # 영어, 너무 모호
fix bug.              # 마침표, 무슨 버그인지 불명확
여러 파일 수정        # scope 없음, 무엇을 왜 했는지 불명확
```

---

## 의미 단위로 커밋 분리

하나의 커밋 = 하나의 논리적 변경. 여러 관심사가 섞인 경우 분리한다.

### 분리 기준 예시

| 함께 커밋해도 되는 것 | 분리해야 하는 것 |
|---|---|
| 같은 기능의 컴포넌트 + 스타일 | 기능 변경 + 툴링 설정 변경 |
| 버그 수정 + 관련 테스트 | UI 개선 + 린트 설정 수정 |
| 새 기능의 여러 파일들 | 앱 코드 + `.claude/` 스킬 파일 |

### 반드시 별도 커밋으로 분리할 파일들

- `.claude/` — Claude 스킬/설정
- `skills-lock.json` — OMC 스킬 락파일
- `CLAUDE.md`, `AGENTS.md` — 프로젝트 가이드 문서
- `.github/workflows/` — CI 변경 (기능 변경과 분리)

---

## 커밋 실행 방법

항상 HEREDOC으로 메시지를 전달한다 (따옴표 이스케이프 문제 방지):

```bash
git commit -m "$(cat <<'EOF'
feat(expenses): 지출 목록에 날짜별 그룹핑 및 일별 합계 표시 추가

날짜별로 지출을 묶어 스캔하기 쉽게 개선.
각 그룹 우측에 해당 날짜의 총 지출액 표시.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 요약 체크리스트

커밋 전 이 순서로 확인한다:

1. `pnpm lint` + `pnpm tsc --noEmit` — 에러 없음 (병렬 실행 권장)
2. `pnpm jest --findRelatedTests $(git diff --staged --name-only)` — 관련 테스트 통과
3. `git diff --staged` — 의미 단위인지 확인
4. 툴링 파일이 섞여 있으면 분리 스테이징
5. HEREDOC으로 한글 커밋 메시지 작성
6. Co-Authored-By 라인 포함
