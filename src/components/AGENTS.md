<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# components

## Purpose
재사용 가능한 React 컴포넌트. `ui/`(Shadcn 기반), `layout/`, 도메인별 컴포넌트(`dashboard/`, `expenses/`, `incomes/`, `categories/`, `families/`)로 구성된다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `ui/` | Shadcn UI 기반 기본 컴포넌트 23개 (see `ui/AGENTS.md`) |
| `layout/` | Header, BottomNavigation 앱 레이아웃 컴포넌트 |
| `dashboard/` | 대시보드 전용 위젯 (통계 카드, 빠른 액션, 캘린더 뷰 등) |
| `expenses/` | 지출 관련 컴포넌트 (forms, list, dialogs, summary) |
| `incomes/` | 수입 관련 컴포넌트 (dialogs, list) |
| `categories/` | 카테고리 관련 컴포넌트 (내부 `_components` 패턴 사용) |
| `families/` | 가족 선택 및 관리 컴포넌트 |
| `notifications/` | 알림 벨, 알림 목록 컴포넌트 |
| `auth/` | OAuth 제공자 아이콘, 로그인 폼 |
| `common/` | 공통 컴포넌트 (LoadingSpinner, ApiErrorBoundary) |

## For AI Agents

### Working In This Directory
- `ui/` 컴포넌트를 **우선 활용** — 새 UI 요소 추가 전 기존 Shadcn 컴포넌트 확인
- CVA(`class-variance-authority`)로 variant 관리, `cn()` 유틸로 클래스 병합
- 하드코딩 색상 금지 — `globals.css` 시맨틱 클래스 사용
- Client Component는 파일 최상단 `"use client"` 선언 필수

### Common Patterns
```tsx
// Client Component 기본 패턴
"use client";
import { cn } from "@/lib/client/utils";

// 색상 사용 패턴 (올바른 예)
<div className="gradient-expense text-white rounded-xl p-4">

// 색상 사용 패턴 (금지)
<div className="from-rose-500 to-red-600 bg-gradient-to-br">
```

## Dependencies

### Internal
- `src/lib/client/` — 클라이언트 훅, API 클라이언트
- `src/app/actions/` — Server Actions 호출
- `src/types/` — 타입 정의

### External
- `@radix-ui/*` — Headless UI 프리미티브
- `lucide-react` — 아이콘
- `sonner` — Toast (`toast.success()`, `toast.error()` 사용)
- `react-hook-form` — 폼 상태
- `zod` — 폼 스키마 검증

<!-- MANUAL: -->
