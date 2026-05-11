# Phase 05 — 통합 검증 + legacy 잔재 grep + index.json completed 마킹

**Model**: haiku
**Status**: pending
**Goal**: plan011 전체 phase 결과 통합 검증. legacy 토큰/패턴 0 확인. index.json status="completed" 마킹.

## 작업 항목

### 1. 통합 빌드/린트/테스트

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/011-landing-auth-redesign

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build
```

모두 통과해야 함.

### 2. legacy 토큰 잔재 grep

```bash
# Auth 영역 전체에서 legacy 클래스/색 잔재 0
! grep -rnE 'app-background|glass-card|bg-red-50|text-red-700|text-gray-[0-9]' \
  src/app/auth/ \
  src/components/auth/ \
  src/components/landing/

# 하드코딩 hex 0 (Naver brand #03C75A 는 예외 — 주석 동반)
LEAK=$(grep -rnE '#[0-9a-fA-F]{6}' src/app/auth/ src/components/auth/ src/components/landing/ \
  | grep -v '03C75A' || true)
[ -z "$LEAK" ] || { echo "❌ 하드코딩 hex 잔재: $LEAK"; exit 1; }
```

### 3. 신규 파일 존재 확인

```bash
test -f src/app/page.tsx
test -f src/components/landing/LandingPage.tsx
test -f src/components/landing/MiniStats.tsx
test -f src/components/auth/AuthCenterCard.tsx
```

### 4. 라우팅 smoke (사용자 수동)

| 시나리오 | 기대 결과 |
|---|---|
| 시크릿 창 + `/` | Landing 표시 |
| 시크릿 창 + `/dashboard` | `/` 또는 `/auth/signin` 으로 redirect |
| 로그인 후 + `/` | `/dashboard` 자동 redirect |
| `/auth/signin` | 새 카드 디자인 (gradient-family 로고 + Google/Naver 버튼) |
| `/auth/signout` | 새 카드 + "다시 로그인" CTA |
| `/auth/error?error=OAuthAccountNotLinked` | 매핑된 한국어 메시지 + AlertCircle 아이콘 |

### 5. index.json completed 마킹

```bash
# 모든 phase status="completed" 갱신 + 최상위 status="completed" + completed_at
```

`tasks/plan011-landing-auth-redesign/index.json` 의 phases 배열 각 `status` 를 `"completed"` 로, 최상위 `status` 를 `"completed"`, `completed_at` 필드를 오늘 날짜로 추가.

### 6. 최종 커밋

```bash
git add tasks/plan011-landing-auth-redesign/index.json
git commit -m "chore(plan011): mark completed"
```

## Out of Scope

- 사용자 onboarding 흐름 (Landing → signin → family 생성) end-to-end 자동 테스트 — 수동 smoke 만
- Lighthouse / SEO score 측정
