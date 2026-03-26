<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# layout

## Purpose
앱 전체 레이아웃 컴포넌트. Header(상단)와 BottomNavigation(하단)으로 구성되며 `(authenticated)/layout.tsx`에서 사용된다.

## Key Files

| File | Description |
|------|-------------|
| `Header.tsx` | 상단 헤더 — 로고, 가족 선택 드롭다운, 알림 벨, 유저 아바타 |
| `BottomNavigation.tsx` | 하단 탭 네비게이션 — 대시보드, 내역, 분석(준비중), 설정 + FAB 버튼 |

## For AI Agents

### Working In This Directory
- `BottomNavigation.tsx`: 분석 탭은 준비 중 → `toast.info()` 사용 (`alert()` 금지)
- FAB 버튼: `gradient-primary` 클래스 사용
- Header 로고/아바타: `gradient-primary` 클래스 사용
- 두 컴포넌트 모두 `"use client"` — 라우팅 훅 사용

<!-- MANUAL: -->
