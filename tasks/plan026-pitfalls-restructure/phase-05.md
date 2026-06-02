# Phase 05 — 자동 게이트(task md lint) 신설 + CI 연결 + 통합 검증

**Goal**: 자동 검출형 함정(특히 BLG9 빌드 깨짐)을 사람 self-check 가 아니라 기계가 막게 한다. 두 겹 방어 — (1) globals.css `@source not` 로 Tailwind 스캔 자체를 차단(원천 차단), (2) 위험 패턴 검출 lint 를 CI 보조 위생으로 추가.

## 배경

핵심 발견 (2026-06-02 실측):

- **BLG9 의 진짜 원인** — `src/app/globals.css` 는 `@import "tailwindcss"` 만 있고 `tailwind.config` 가 없다. Tailwind v4 자동 content 탐지가 `tasks/`·`docs/`·`.claude/skills/` 의 `.md` 까지 스캔(모두 gitignore 아님) → md 안 위험 표기를 CSS 로 해석해 dev 500.
- **`next build` 는 BLG9 를 못 잡는다** — production build 는 invalid CSS 를 경고로 넘기고 통과(`Compiled successfully`), dev 만 500. CI 에 `next build` 를 넣어도 안 걸린다.
- 따라서 1차 방어는 **스캔 범위 자체를 줄이는 `@source not`**(Tailwind 네이티브). lint 는 보조 — 커스텀 정규식은 Tailwind 실제 파서와 달라 false negative 시 그대로 샌다. 두 겹이 필요하다.

## 작업

1. **globals.css `@source not` 1차 방어** (원천 차단):
   - `src/app/globals.css` 에 `@source not` 디렉티브로 `tasks/`·`docs/`·`.claude/` 하위 스캔 제외 (globals.css 기준 상대경로 — Tailwind v4 문서 확인 후 정확 경로 작성).
   - 디렉티브 자신이 위험 리터럴을 담지 않게 경로 glob 만 사용.
   - 적용 후 dev 에서 해당 디렉터리 md 변경이 더 이상 CSS 로 해석 안 됨을 확인.

2. **lint 스크립트 작성** (`scripts/check-tailwind-md.mjs`, 보조 위생):
   - 대상: `tasks/**/*.md`, `docs/**/*.md`, `.claude/skills/**/*.md`
   - 검출: utility prefix(`text-[` / `bg-[` / `border-[` 등) 로 시작하는 닫힌 arbitrary 값 안에 와일드카드(별표)나 중괄호가 든 표기
   - 발견 시 파일·줄 출력 + exit 1
   - 스크립트 자신은 검출 정규식을 문자 클래스로 조립해 자기 자신이 안 걸리게 (BLG9 자기재발 방지)

3. **CI + package.json 연결** — husky 부재 확인됨 → CI 게이트만:
   - `package.json` scripts 에 `lint:md` 추가
   - `.github/workflows/frontend-ci.yml` 에 `pnpm lint:md` step 추가 (ADR-F11 리뷰 워크플로와 별개)

4. **auto-gate 태그 정합 + ADR 기록**:
   - phase 03 에서 `auto-gate: md-lint` 로 표시한 함정이 이 스크립트로 실제 검출되는지 확인
   - 게이트 결정(`@source not` 1차 + md lint 보조, `next build` 부적합)을 ADR 1건 기록 (ADR-F11 인접)

5. **통합 검증 + completed 마킹**:
   - phase 01~05 산출물 일괄 점검
   - `index.json` 의 status + 모든 phase status 를 `completed` 로, 단일 commit 포함

## 주의

- 이 phase 의 lint 스크립트·CI yml·globals.css 에 위험 패턴 리터럴을 직접 쓰지 말 것. 정규식은 문자 클래스 조립으로, `@source not` 은 경로 glob 만.
- `@source not` 이 1차 방어, lint 는 보조. lint 만 만들고 `@source not` 을 빠뜨리면 핵심 목표(500 원천 차단) 미달.

## 검증

```bash
# 1차 방어: globals.css 에 @source not 적용됨
grep -c "@source not" src/app/globals.css   # >= 1
# 보조 lint 가 위험 패턴을 실제로 잡는지 — 의도적 위반 샘플로 테스트
node scripts/check-tailwind-md.mjs   # 정상 시 exit 0
# CI + package.json 에 step 추가됐는지
grep -c "lint:md" .github/workflows/frontend-ci.yml package.json
# index.json completed 마킹
grep -c '"status": "completed"' tasks/plan026-pitfalls-restructure/index.json   # = (1 + 5)
```

성공 기준:

- `globals.css` 에 `@source not` 으로 tasks/·docs/·.claude/ 스캔 제외 (1차 방어)
- task md lint 스크립트가 위험 패턴 검출 + 정상 파일 통과 (보조)
- `frontend-ci.yml` + `package.json` 에 lint:md step 추가
- 게이트 결정 ADR 1건 기록
- auto-gate 태그 함정이 스크립트로 검출됨
- index.json + 모든 phase `completed`
