---
name: integrate-ux
description: UX 디자이너의 PR/브랜치를 기존 기능과 통합하는 표준 워크플로우. PR 분석 → 프론트엔드 리뷰 → rebase 머지 → 백엔드 연동 계획. PR URL이나 번호를 인자로 받는다.
---

# integrate-ux

UX 디자이너가 작업한 PR/브랜치를 기존 코드베이스의 기능과 통합하는 스킬. **프론트엔드 레포 전용**.

## 핵심 원칙

1. **UX 레이아웃 우선, 데이터 로직은 기존 코드**: UX 디자이너의 디자인/레이아웃을 따르되, 데이터 CRUD는 기존 서버 액션 사용
2. **로컬 state 목업 → 서버 액션 교체**: UX 코드는 로컬 state 기반 목업. `useState`로 관리하던 데이터를 서버 액션 + `router.refresh()` 패턴으로 교체
3. **공통 컴포넌트 적용**: 인라인 중복 구현을 공통 컴포넌트로 교체
4. **금지사항 제거**: `window.prompt()`, `window.confirm()`, `alert()` → Shadcn Dialog/AlertDialog로 교체
5. **샘플 데이터 유지**: 기능 연동 전이면 SAMPLE_DATA 하드코딩은 유지하되 타입을 명확히

## 실행 절차

### 1. PR 분석

```bash
# cwd: <repo root>
gh pr view {PR번호} --json title,body,additions,deletions,changedFiles
gh pr diff {PR번호} --name-only
gh pr diff {PR번호}
```

(GitHub Enterprise 사용 시 `GH_HOST=...` prefix)

확인할 것:
- 변경 파일 목록 + 신규 컴포넌트
- 메인 워크스페이스/레이아웃 컴포넌트 변경 범위
- 기존 컴포넌트와의 충돌 가능성
- 로컬 state 패턴 사용 여부

### 2. 기존 기능 파악

UX가 대체하려는 기능이 이미 구현되어 있는지 확인:
- 기존 컴포넌트 디렉토리 (예: `src/components/{feature}/`)
- 관련 서버 액션 (`src/actions/`)
- 관련 API 라우트 (`src/app/api/`)
- 관련 hooks (`src/lib/hooks/`)

### 3. 공통 컴포넌트 교체 대상 식별

UX 코드에서 인라인 패턴을 찾아 공통 컴포넌트로 교체:

**Shadcn 우선 규칙 (필수)**:
- UX가 native HTML(`<select>`, `<button>`, `<dialog>`, `<input>`)을 써도 코드에선 항상 Shadcn 컴포넌트로 통일
- `<select>` → `Select/SelectTrigger/SelectContent/SelectItem`
- 인라인 overlay 모달 → `Dialog` / `AlertDialog`
- 단순 텍스트 input → `Input`, 여러 줄 → `Textarea`
- UX 원본은 참고용, 코드는 프로젝트 일관성 우선

레포별 공통 컴포넌트 매핑은 `skills-variants/{repo}/integrate-ux-mapping.md` 참조.

### 4. 프론트엔드 엔지니어링 리뷰

**UX 디자이너는 프론트엔드 전문가가 아님** — 시니어 프론트엔드 엔지니어 관점에서 코드 품질을 검토하고 개선 계획을 세운다.

#### 4-1. God Component 분리 검토

UX 코드는 종종 하나의 거대 컴포넌트에 모든 로직을 담음. 분리 기준:

- **200줄 초과** 컴포넌트 → 분리 필요
- **관심사 혼합**: UI 렌더링 + 데이터 관리 + 이벤트 핸들링이 하나의 함수에 → hooks 추출 + 하위 컴포넌트 분리
- **반복 패턴**: 유사한 JSX 블록이 2회 이상 → 컴포넌트 추출
- **상태 독립성**: 서로 독립적인 state 그룹 → 별도 컴포넌트로 분리

#### 4-2. 공통 컴포넌트 재사용

3단계에서 식별한 인라인 패턴을 공통 컴포넌트로 교체. 추가로:

- 재사용 가능한 UI는 `components/common/`으로 추출 검토
- 테이블/리스트 패턴은 기존 패턴 참조하여 일관성 적용
- 삭제 확인 다이얼로그는 Shadcn AlertDialog 표준 패턴 사용

#### 4-3. 서버 액션 연동

UX 코드의 로컬 state 변경을 서버 액션으로 교체:

- **CRUD 작업**: `useState`로 관리하던 추가/수정/삭제를 서버 액션 + `router.refresh()`로 교체
- **낙관적 업데이트**: 로컬 state 즉시 변경 + 서버 액션 비동기 호출 패턴

```typescript
// 패턴: 낙관적 업데이트 + 서버 액션
onSelectHistory={async (id, imagePath) => {
  setItems(prev => /* 로컬 즉시 반영 */);
  await selectItem(id);  // 서버 동기화
}}
```

#### 4-4. 타입 안전성

- `as any` 사용 금지
- SAMPLE_DATA의 타입을 실제 DB 스키마와 일치시키거나 명확한 타입 정의
- Props drilling이 3레벨 이상이면 Context 또는 구조 리팩토링 검토

#### 4-5. Magic Value 제거 + 명시적 인터페이스

UX 디자이너는 빠른 목업을 위해 매직 값과 암묵적 관례를 많이 사용. 통합 시 반드시 명시적 인터페이스로 개선.

**Magic String / Magic Number 스캔**:
- 하드코딩 문자열·숫자가 2곳 이상에서 의미 가지면 → 상수(`constants/`)로 추출
- CSS 매직 계산식이 2곳 이상 중복이면 → CSS 변수 또는 상수로 추출

**내부 계산 대신 Props 전달**:
- 암묵적 sentinel value (`-1` = 전체) → discriminated union 또는 명시적 prop
- 매직 문자열 프로토콜 (`"__all__"`) → 타입 시스템으로 보호되는 union type
- 컴포넌트 내부에서 props의 특수 값 비교 → 호출부에서 의미를 풀어서 boolean/enum prop 전달

**원칙**: 매직 값 없이 타입만 보고 의도를 파악할 수 있는 인터페이스가 양쪽 모두에게 유지보수 비용을 낮춘다.

#### 4-6. UX 수정 권한 경계

- **UX 디자인 자체는 수정하지 않음** — 레이아웃, 색상, 텍스트 문구, 컴포넌트 배치 등은 UX 원안 유지
- 개선 아이디어는 **PR 댓글의 "UX 디자이너께 제안" 섹션**에 정리하여 전달
- 코드 품질 관련 개선(God Component 분리, Shadcn 통일, DB 연동)은 integrate 과정에서 직접 처리

### 5. 사용자와 논의

아래 항목에 대해 반드시 사용자와 논의:
- UX와 기존 기능이 충돌하는 부분
- 기능 연동이 필요한 범위 (목업 유지 vs DB 연동)
- 기존 컴포넌트 제거 여부
- God Component 분리 범위
- 백엔드 연동 계획 (이번 PR vs 별도 plan)

### 6. docs 반영 (task 생성 전 필수)

- `docs/code-architecture.md` — 새 디렉터리/컴포넌트 반영
- `docs/adr.md` — 필요 시 ADR 추가
- `docs/flow.md` — 플로우 변경 반영

### 7. task 생성 (rebase + 머지)

**PR 반영 방식 — rebase 후 머지 (main에 바로 머지 금지)**:

main에 바로 `gh pr merge`하지 않는다. PR 브랜치에서 main을 rebase하고, conflict를 해결한 뒤, 사용자가 PR diff를 확인한 후 머지한다.

절차:
1. PR 브랜치를 로컬에 checkout
2. `git rebase origin/main`으로 최신 main 반영
3. conflict 해결 — 우리 기능이 빠지지 않도록 확인
4. 통합 검증 명령 통과 확인
5. `git push --force-with-lease`로 PR 업데이트 (force는 사용자 승인 필요)
6. PR에 댓글 추가 (변경사항 요약)
7. **사용자가 PR diff를 리뷰한 후** 머지 결정

표준 phase 구조:

| Phase | 내용 |
|---|---|
| 1 | PR 브랜치 checkout + main rebase + conflict 해결 |
| 2 | 기존 기능 유지 검증 + 빌드 + force-with-lease push (사용자 승인 후) |
| 3 | PR 댓글 + 사용자 리뷰 대기 |

### 8. task 실행

```bash
# cwd: <repo root>
python3 .claude/skills/plan-and-build/run-phases.py tasks/{task-name}
```

### 9. PR 처리 (task 완료 후 필수)

task 완료 후 원본 UX PR에 댓글을 달고 close.

댓글 내용 템플릿:
```markdown
## 반영 완료 — 코드 직접 구현 방식

PR의 UX 디자인을 분석하여 기존 코드베이스에 직접 구현했습니다 (커밋 `{hash}`).

### 반영된 항목
- ✅ 항목 1
- ✅ 항목 2

### 반영하지 않은 항목
- ❌ 항목 (사유)

### UX 디자이너께 제안 (참고용)
디자인 관점에서 개선하면 좋을 포인트 (코드는 원안 유지, 의사결정은 디자이너 몫):
1. {제안 내용 1}
2. {제안 내용 2}

### 후속 plan 예정
- {다음에 이어질 작업}

### 직접 머지하지 않은 이유
- 스키마 변경/리팩토링으로 인한 대규모 충돌
```

## 자주 발생하는 충돌 패턴

### 메인 워크스페이스 컴포넌트 충돌

UX PR이 대부분 이 파일을 수정함 (탭 연결, 서브스텝 추가). 여러 PR을 순차 merge하면 충돌 빈발.

**해결**: 우리 버전을 base로, UX의 추가 코드(import, 정의, 렌더링)를 수동 반영.

### 로컬 state 패턴

UX 코드에서 흔한 패턴:
```typescript
// UX 목업 (교체 대상)
const [data, setData] = useState(SAMPLE_DATA);
function updateItem(idx, field, value) {
  setData(p => p.map((d, i) => i === idx ? { ...d, [field]: value } : d));
}

// 교체 후 (DB 연동)
// props로 서버 데이터 받기 → onBlur 시 서버 액션 → router.refresh()
```

## 다음 스킬 연결 흐름

`/integrate-ux`는 UX 코드를 분석하고 머지하는 단계. 머지 후 백엔드 연동이 필요하면:

```
/integrate-ux (PR 분석 → 머지 → 프론트엔드 리뷰)
    ↓ 분석 결과 + 개선 항목 목록 도출
/planning (DB 설계 → API 설계 → 아키텍처 결정 → docs 반영)
    ↓ 구현 계획 확정
/plan-and-build 또는 /build-with-teams (task 생성 → 자동 실행)
```

**`/integrate-ux` 완료 시 출력**:
1. 머지 완료 상태
2. 프론트엔드 리뷰 결과
3. 백엔드 연동이 필요한 항목 목록
4. → 사용자에게 "이 항목들을 `/planning`으로 설계할까요?" 제안

## 금지사항 체크리스트 (Phase 3에서 실행)

Phase 3의 push 직전에 아래를 확인 — 모두 0건이어야 force-with-lease push 진행:

```bash
# cwd: <repo root>
grep -rn "window\.\(prompt\|confirm\|alert\)" src/components/{영향 디렉토리}/
grep -rn "as any" src/components/{영향 디렉토리}/
grep -rn "console\.log" src/components/{영향 디렉토리}/
```
