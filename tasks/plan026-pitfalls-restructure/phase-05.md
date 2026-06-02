# Phase 05 — 자동 게이트(task md lint) 신설 + CI 연결 + 통합 검증

**Goal**: 자동 검출형 함정(특히 BLG9 빌드 깨짐)을 사람 self-check 가 아니라 기계가 막게 한다. task/docs markdown 의 위험 Tailwind 패턴을 검출하는 lint 스크립트를 만들고 CI 에 연결한다.

## 배경

핵심 발견 (2026-06-02 실측):

- **`next build` 는 BLG9 를 못 잡는다** — production build 는 invalid CSS 를 경고로 넘기고 통과(`Compiled successfully`), dev 만 500. 즉 CI 에 `next build` 를 넣어도 이 깨짐은 안 걸린다.
- 현 `frontend-ci.yml` 은 `tsc + lint + test` 만 — 그래서 BLG9 가 머지까지 통과해 main dev 가 깨졌다.
- 따라서 자동 게이트는 build 가 아니라 **전용 task md lint** 여야 한다.

## 작업

1. **lint 스크립트 작성** (`scripts/check-tailwind-md.mjs` 또는 유사):
   - 대상: `tasks/**/*.md`, `docs/**/*.md`, `.claude/skills/**/*.md`
   - 검출: utility prefix(`text-[` / `bg-[` / `border-[` 등) 로 시작하는 닫힌 arbitrary 값 안에 와일드카드(별표)나 중괄호(`{` `}`)가 든 표기
   - 발견 시 파일·줄 출력 + exit 1
   - 스크립트 자신은 검출 정규식을 문자열 변수로 조립해 자기 자신이 걸리지 않게 (BLG9 자기재발 방지)

2. **로컬 훅 연결** (택1, 프로젝트 관례 확인 후):
   - `package.json` scripts 에 `lint:md` 추가
   - 가능하면 pre-commit (husky 등 기존 설정 확인 — 없으면 CI 만)

3. **CI 연결** — `.github/workflows/frontend-ci.yml` 에 step 추가:
   - `pnpm lint:md` (task md lint). ADR-F11 의 리뷰 워크플로와 별개.
   - `next build` 는 BLG9 를 못 잡으므로 이 lint 가 1차 방어. (build 추가 여부는 별도 판단 — 다른 빌드 깨짐은 잡지만 비용 큼.)

4. **common-pitfalls 의 auto-gate 태그 정합** — phase 03 에서 `auto-gate: md-lint` 로 표시한 함정이 이 스크립트로 실제 검출되는지 확인.

5. **통합 검증 + completed 마킹**:
   - phase 01~05 산출물 일괄 점검
   - `index.json` 의 status + 모든 phase status 를 `completed` 로, 단일 commit 포함

## 주의

- 이 phase 의 lint 스크립트·CI yml 에 위험 패턴 리터럴을 직접 쓰지 말 것. 정규식은 문자 클래스 조립으로 (예: 별표·중괄호를 변수로).
- ADR 기록 — 이 게이트 결정("build 가 아니라 md lint")은 새 ADR 또는 ADR-F11 인접에 1건 기록 권장.

## 검증

```bash
# lint 스크립트가 위험 패턴을 실제로 잡는지 — 의도적 위반 샘플로 테스트
node scripts/check-tailwind-md.mjs   # 정상 시 exit 0
# CI 에 step 추가됐는지
grep -c "lint:md" .github/workflows/frontend-ci.yml package.json
# index.json completed 마킹
grep -c '"status": "completed"' tasks/plan026-pitfalls-restructure/index.json   # = (1 + 5)
```

성공 기준:

- task md lint 스크립트가 위험 패턴(arbitrary 안 와일드카드/중괄호) 검출 + 정상 파일 통과
- `frontend-ci.yml` 에 lint:md step 추가
- auto-gate 태그 함정이 스크립트로 검출됨
- index.json + 모든 phase `completed`
