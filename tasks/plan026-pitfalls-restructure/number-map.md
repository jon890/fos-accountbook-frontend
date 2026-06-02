# number-map.md — 구번호 → 신번호 전체 매핑

phase-02 에서 common-pitfalls.md 번호체계를 통일할 때 생성한 매핑표.
phase-04 executor 가 이 파일을 Read 해 스킬 내 구번호 참조를 신번호로 갱신한다.

## plan 작성 (PLAN-N)

| 구번호 | 신번호 | 함정 제목 |
|---|---|---|
| § 1.1 / 1-1 | PLAN-1 | 수치 추측 (파일 수 / 줄 수) |
| § 1.2 / 1-2 | PLAN-2 | 파일 범위 부정확 |
| § 1.3 / 1-3 | PLAN-3 | 이전 plan / main 커밋과의 상호작용 누락 |
| § 1.4 / 1-4 | PLAN-4 | 실행 컨텍스트 모호 (cwd / branch) |
| § 1.5 / 1-5 | PLAN-5 | "눈으로 확인" 검증 |
| § 1.6 / 1-6 | PLAN-6 | 외부 상태 점검 부재 |
| § 1.7 / 1-7 | PLAN-7 | 새 불변식 도입 시 4면 가드 누락 |
| § 1.8 / 1-8 | PLAN-8 | 마지막 phase 에 index.json completed 마킹 지시 누락 |
| § 1.9 / 1-9 | PLAN-9 | macOS BSD sed \b 미지원 |

## team 운영 (TEAM-N)

| 구번호 | 신번호 | 함정 제목 |
|---|---|---|
| § 2.1 / 2-1 | TEAM-1 | 팀원 SendMessage 회신 누락 |
| § 2.2 / 2-2 | TEAM-2 | 팀원 자발적 실행 |
| § 2.3 / 2-3 | TEAM-3 | self-shutdown 패턴 |
| § 2.4 / 2-4 | TEAM-4 | executor cwd 격리 (main repo 오염 방지) |
| § 2.5 / 2-5 | TEAM-5 | executor scope 확장 자체 판단 |
| § 2.6 / 2-6 | TEAM-6 | critic v2 재평가 시 신 파일 미재읽기 |
| § 2.7 / 2-7 | TEAM-7 | code-reviewer 에 plan 비자명 설계 결정 미전달 |
| § 2.8 / 2-8 | TEAM-8 | task 재분할 시 index.json 갱신 누락 |
| § 2.9 / 2-9 | TEAM-9 | cwd 추적 + 양쪽 git status 검증 |
| § 2.10 / 2-10 | TEAM-10 | 브랜치 확인 누락 commit 사고 |

## 코드 패턴 (CODE-N)

순서: 3-3 → 3-4 → BLG9 → FE1 → FE2 → FE3

| 구번호 | 신번호 | 함정 제목 |
|---|---|---|
| 3-3 / CODE-3 (phase-01 임시) | CODE-1 | CSS custom property 키는 as CSSProperties 단언 필요 |
| 3-4 / CODE-4 (phase-01 임시) | CODE-2 | inline style vs Tailwind arbitrary class |
| BLG9 | CODE-3 | JSDoc/TSDoc 코멘트에 Tailwind 클래스 패턴 금지 |
| FE1 | CODE-4 | App Router 경계 위반 |
| FE2 | CODE-5 | Shadcn 우회 |
| FE3 | CODE-6 | revalidatePath 누락 |
