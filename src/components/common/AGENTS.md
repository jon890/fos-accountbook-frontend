<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# common

## Purpose
앱 전체에서 공유하는 범용 컴포넌트. 로딩 스피너, API 에러 바운더리 등.

## Key Files

| File | Description |
|------|-------------|
| `ApiErrorBoundary.tsx` | API 오류 시 폴백 UI 제공하는 React Error Boundary |
| `LoadingSpinner.tsx` | 인라인 로딩 스피너 |
| `PageLoadingSpinner.tsx` | 전체 페이지 로딩 오버레이 |

## For AI Agents

### Working In This Directory
- `ApiErrorBoundary`는 `"use client"` 필수 (Error Boundary는 Client Component)

<!-- MANUAL: -->
