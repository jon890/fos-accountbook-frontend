<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# ui

## Purpose
Shadcn UI 기반 기본 컴포넌트 라이브러리. Radix UI 프리미티브 + Tailwind CSS로 구성된 재사용 헤드리스 컴포넌트 23개.

## Key Files

| File | Description |
|------|-------------|
| `button.tsx` | 버튼 (variant: default, destructive, outline, ghost, link) |
| `dialog.tsx` | 모달 다이얼로그 |
| `input.tsx` | 텍스트 입력 필드 |
| `select.tsx` | 드롭다운 선택 |
| `form.tsx` | react-hook-form 연동 폼 컴포넌트 |
| `calendar.tsx` | react-day-picker v9 기반 달력 |
| `badge.tsx` | 뱃지/태그 |
| `card.tsx` | 카드 레이아웃 |
| `dropdown-menu.tsx` | 드롭다운 메뉴 |
| `avatar.tsx` | 유저 아바타 |
| `skeleton.tsx` | 로딩 스켈레톤 |
| `submit-button.tsx` | 폼 제출 버튼 (pending 상태 처리) |

## For AI Agents

### Working In This Directory
- Shadcn CLI로 추가: `pnpm dlx shadcn@latest add <component>`
- **직접 수정 최소화** — 커스터마이징은 상위 컴포넌트에서 className prop으로 처리
- `cn()` 유틸로 클래스 병합 (`@/lib/client/utils`)

<!-- MANUAL: -->
