# CLAUDE.md — fos-accountbook

이 파일은 Claude Code가 코드 리뷰 및 작업 시 참조하는 프로젝트 가이드입니다.

## 프로젝트 개요

**우리집 가계부** — 가족 단위로 수입/지출을 함께 관리하는 Next.js 웹 앱.
- 가족 구성원을 초대하고 공동으로 가계부를 관리
- 카테고리별 지출 분류, 월별 예산 설정, 대시보드 통계 제공

## 기술 스택

| 항목 | 버전/도구 |
|------|-----------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript 5 (strict mode) |
| 스타일 | Tailwind CSS v4 + CSS 변수 기반 테마 |
| UI 컴포넌트 | Radix UI + Shadcn 패턴 |
| 인증 | NextAuth (OAuth: Google, Naver) |
| 패키지 관리 | pnpm 10 |
| 테스트 | Jest + Testing Library |
| 런타임 | Node.js 22 |

## 파일/폴더 구조

```
src/
├── app/
│   ├── (authenticated)/      # 인증 필요 라우트 그룹
│   │   ├── layout.tsx        # 인증 레이아웃 (Header + BottomNavigation)
│   │   ├── dashboard/        # 대시보드
│   │   ├── transactions/     # 수입/지출 내역
│   │   ├── categories/       # 카테고리 관리
│   │   ├── settings/         # 사용자 설정
│   │   └── families/         # 가족 관리
│   ├── actions/              # Next.js Server Actions
│   │   ├── expense/
│   │   ├── income/
│   │   ├── category/
│   │   └── family/
│   ├── api/auth/             # NextAuth API Route
│   ├── globals.css           # 전역 스타일 + CSS 변수 테마
│   └── layout.tsx            # Root Layout
├── components/
│   ├── ui/                   # Shadcn 기반 기본 컴포넌트
│   ├── layout/               # Header, BottomNavigation
│   ├── dashboard/            # 대시보드 전용 컴포넌트
│   ├── expenses/             # 지출 관련 컴포넌트
│   ├── incomes/              # 수입 관련 컴포넌트
│   └── categories/           # 카테고리 관련 컴포넌트
└── __tests__/                # 테스트 파일
```

## 코딩 컨벤션

### TypeScript
- `strict: true` 필수 — `any` 타입 사용 금지
- 명시적 반환 타입 권장 (특히 Server Actions)
- Zod를 사용한 런타임 유효성 검사 (폼, API 경계)

### React / Next.js
- **Server Component가 기본** — 클라이언트 상태가 필요한 경우에만 `"use client"` 추가
- `"use client"` 지시어는 파일 최상단 첫 줄에 위치
- Server Actions는 `src/app/actions/` 하위에 위치, `"use server"` 지시어 필수
- `useRouter`, `useState`, `useEffect` 등 훅은 Client Component에서만 사용
- 데이터 페칭은 Server Component에서 직접 처리 (fetch 또는 DB 직접 접근)

### 스타일링
- **Tailwind CSS v4** 사용 — `tailwind.config.js` 없음, `@theme` 블록 사용
- 색상은 `globals.css`에 정의된 CSS 변수 및 시맨틱 클래스 사용:
  - `gradient-expense` (지출: 로즈-레드)
  - `gradient-income` (수입: 에메랄드)
  - `gradient-budget` (예산: 앰버)
  - `gradient-family` (가족: 바이올렛)
  - `gradient-category` (카테고리: 인디고)
  - `gradient-primary` (기본 액션: 블루)
- **하드코딩 색상 금지** — `from-blue-500 to-purple-600` 같은 임의 그라디언트 대신 시맨틱 클래스 사용
- 인라인 `style={{ }}` 속성 최소화

### 컴포넌트
- Shadcn 컴포넌트(`src/components/ui/`)를 우선 사용
- CVA(class-variance-authority)로 variant 관리
- `cn()` 유틸리티로 클래스 병합

## 금지사항

- `alert()`, `confirm()`, `prompt()` 사용 금지 → `toast` (sonner) 사용
- `console.log` 프로덕션 코드에 남기지 않기
- 하드코딩된 색상 값 직접 사용 금지 (시맨틱 클래스 사용)
- `any` 타입 사용 금지
- 환경 변수를 클라이언트 번들에 노출 금지 (`NEXT_PUBLIC_` 접두사 없는 변수는 서버 전용)

## 테스트

- 테스트 파일 위치: `src/__tests__/`
- 실행: `pnpm test` / `pnpm test:ci` (CI 환경)
- Server Actions에 비즈니스 로직이 있다면 단위 테스트 권장
- UI 컴포넌트는 Testing Library로 사용자 상호작용 중심 테스트

## PR 리뷰 포인트

코드 리뷰 시 특히 주의할 점:
1. Server/Client Component 경계가 올바른가?
2. 새로운 색상/스타일이 시맨틱 클래스를 사용하는가?
3. TypeScript 타입이 충분히 엄격한가?
4. Server Actions에서 인증/권한 확인이 누락되지 않았는가?
5. `alert()` 등 브라우저 기본 UI 사용 여부
6. 에러 처리가 적절한가? (try/catch, 사용자 피드백)
