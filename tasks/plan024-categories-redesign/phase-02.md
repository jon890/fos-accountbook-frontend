# Phase 02 — CategoryItem CSS variable 패턴 + 색 코드 텍스트 제거 + 아이콘 정사각형

**Model**: sonnet
**Status**: pending
**Goal**: `CategoryItem.tsx` 의 동적 카테고리 색을 인라인 `style={{ backgroundColor, color }}` 에서 CSS variable + Tailwind arbitrary class 패턴으로 마이그레이션. 색 코드 oklch 문자열 노출 제거. 아이콘 영역 정사각형 통일.

## Context (자기완결)

- 현재 `src/app/(authenticated)/categories/_components/CategoryItem.tsx` (98 줄):
  - L15-23: `withAlpha` helper (oklch alpha 변형 + hex fallback)
  - L36-43: 아이콘 영역 — `w-10 h-8 md:w-12 md:h-12` (mobile 정사각형 아님!) + 인라인 style
  - L70-73: mobile 색 dot — 인라인 style
  - L86-92: desktop 색 dot + `{category.color}` oklch 문자열 노출
- ADR-F13: hex/rgb/hsl 직접 작성 금지 — 단 사용자 정의 동적 색은 예외 (DB 저장 값). CSS variable 로 캡슐화

## 작업 항목

### 1. CSS variable 패턴 적용 + withAlpha helper 제거

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CategoryResponse } from "@/types/category";
import { Edit2, EyeOff, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";

interface CategoryItemProps {
  category: CategoryResponse;
  onEdit: (category: CategoryResponse) => void;
  onDelete: (category: CategoryResponse) => void;
}

export function CategoryItem({ category, onEdit, onDelete }: CategoryItemProps) {
  // 동적 사용자 색 — CSS variable 로 캡슐화 (ADR-F13 정신)
  const colorStyle = {
    "--cat-color": category.color ?? "var(--color-brand-500)",
  } as CSSProperties;

  return (
    <Card className="hover:shadow-md transition-shadow" style={colorStyle}>
      <CardContent className="px-2 md:p-4">
        <div className="flex flex-col justify-between h-full gap-2 md:gap-3">
          <div className="flex items-start justify-between">
            {/* 아이콘 영역 — 정사각형 통일, color-mix 로 alpha 적용 */}
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-xl md:text-2xl shrink-0
                         bg-[color-mix(in_srgb,var(--cat-color)_16%,transparent)]
                         text-[var(--cat-color)]"
            >
              {category.icon}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:h-8 md:w-8"
                onClick={() => onEdit(category)}
              >
                <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:h-8 md:w-8"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-expense" />
              </Button>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm md:text-base text-fg truncate">
                {category.name}
              </h3>

              {/* mobile 색 dot */}
              <div className="w-2.5 h-2.5 rounded-full shrink-0 md:hidden bg-[var(--cat-color)]" />

              {category.excludeFromBudget && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-5 gap-1 text-fg-muted w-fit whitespace-nowrap shrink-0"
                >
                  <EyeOff className="w-3 h-3" />
                  <span className="hidden md:inline">예산 제외</span>
                </Badge>
              )}
            </div>

            {/* desktop 색 dot — 색 코드 텍스트 제거 (UX 노이즈) */}
            <div className="hidden md:flex items-center gap-2 mt-1">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-[var(--cat-color)]" />
              <span className="text-xs text-fg-subtle">색</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 변경 요약

1. **`withAlpha` helper 제거** — `color-mix(in srgb, var(--cat-color) 16%, transparent)` 가 모든 색 포맷 (oklch/hex/rgb) 자동 처리
2. **인라인 style 제거** — Card 의 `style={colorStyle}` 만 유지 (CSS variable 설정). 자식 요소들은 Tailwind arbitrary class
3. **아이콘 영역 정사각형** — `w-10 h-8 md:w-12 md:h-12` → `w-10 h-10 md:w-12 md:h-12`
4. **색 코드 텍스트 제거** — `{category.color}` (oklch 문자열) → "색" 라벨 (또는 dot 만 두고 라벨 자체 제거)
5. **fallback 색** — `category.color` 가 null 일 때 `var(--color-brand-500)` 으로 안전한 기본

### 2. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: feat/plan024-categories-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# 인라인 style 사용 1회만 (CSS variable 설정만)
grep -cE 'style=\{' src/app/\(authenticated\)/categories/_components/CategoryItem.tsx   # == 1

# withAlpha helper 제거
! grep -n 'withAlpha\|function withAlpha' \
  src/app/\(authenticated\)/categories/_components/CategoryItem.tsx

# CSS variable 사용
grep -nE 'cat-color|color-mix' src/app/\(authenticated\)/categories/_components/CategoryItem.tsx | wc -l   # >= 3

# oklch 문자열 노출 제거 ({category.color} 텍스트 표시 안 함)
! grep -nE '\{category\.color\}' src/app/\(authenticated\)/categories/_components/CategoryItem.tsx

# 아이콘 정사각형
grep -n 'w-10 h-10' src/app/\(authenticated\)/categories/_components/CategoryItem.tsx | wc -l   # >= 1
```

수동 smoke:
- 카테고리 카드 아이콘 영역 정사각형 (mobile/desktop 모두)
- 동적 사용자 색이 정확히 표시 (16% 알파 배경 + 100% 색 아이콘 + dot)
- 색 코드 oklch 문자열 미표시
- 다크 모드 → `color-mix` 가 transparent 와 자연 합성

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/categories/_components/CategoryItem.tsx` | CSS variable + arbitrary class + 정사각형 + 색 코드 제거 |

## Out of Scope

- AddDialog / EditDialog 의 색상 picker UX — phase-03 에서 토큰 점검만
- 카테고리 색 새 default 토큰 — 현재 그대로

## Risks

| 리스크 | 완화 |
|---|---|
| Tailwind v4 가 `bg-[color-mix(...)]` arbitrary class 미인식 | Tailwind v4 가 임의 CSS expression 지원 — 미인식 시 `style={{ background: 'color-mix(...)' }}` 일부 분리 |
| `color-mix(in srgb, ...)` 가 oklch 색과 호환 안 됨 | `srgb` 색공간이라 모든 색 포맷 자동 변환. ChromeBlue 등에서 검증 |
| Card 의 `style={colorStyle}` 이 Card 컴포넌트 className 과 충돌 | shadcn Card 가 `className` + `style` 모두 forwardRef 통과 — 충돌 없음 |
| `var(--cat-color)` 가 정의 안 되면 fallback 없음 | `category.color ?? "var(--color-brand-500)"` 명시 |
