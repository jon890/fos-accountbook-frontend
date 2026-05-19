# Phase 01 — Header 토큰 일관화 + brand-fg 신설 + 모바일 '가족 전환'

**Model**: sonnet
**Status**: pending
**Goal**: `Header.tsx` 의 legacy 토큰 제거 + 로고 텍스트 그라디언트 → text-fg 단색 + `--color-brand-fg` 토큰 신설 (ADR-F23 준수) + Avatar dropdown 안에 모바일 전용 "가족 전환" 항목 (Sheet 진입점) + `FamilySelectorList` 추출.

## Context (자기완결)

- 변경 대상: `src/components/layout/Header.tsx` (115줄). `(authenticated)/layout.tsx` 에서 호출 → 전 인증 페이지 일관 표시.
- legacy 잔재:
  - `bg-white/80 border-gray-200/50` — dark mode 미지원
  - `from-gray-900 to-gray-700 bg-clip-text text-transparent` — 텍스트 그라디언트
  - `gradient-primary` (구 brand 토큰)
  - `ring-blue-100` Avatar
  - `text-muted-foreground` shadcn legacy
  - `variant="destructive"` DropdownMenuItem
- 구조 약점: `<div className="hidden md:block"><FamilySelectorDropdown /></div>` — 모바일에서 FamilySelector 진입 불가
- 데이터: session prop + selectedFamilyUuid prop (server 측 결정)
- 부수 정리: `FamilySelectorDropdown.tsx` 의 loading skeleton `bg-gray-100` 도 legacy → 본 phase 의 grep 범위 포함

## 사전 조건 — `--color-brand-fg` 신설 (ADR-F23 준수)

현재 `globals.css` 의 `@theme` 블록에 `--color-expense-fg` 만 정의돼 있고 `--color-brand-fg` 가 없다. `bg-brand-500` 위 텍스트 색을 `text-white` 로 하드코딩하면 ADR-F23 (강조 배경 위 텍스트 색은 시맨틱 foreground 토큰) 위반.

`src/app/globals.css` 의 `@theme` 블록 (line 22 부근, `--color-expense-fg` 아래) 에 추가:

```css
--color-brand-fg: oklch(0.985 0.003 188); /* brand-500 위 near-white. hue=188 (brand) */
```

이 토큰이 정의되면 Tailwind v4 가 `text-brand-fg` 유틸리티를 자동 생성. AvatarFallback / 로고 Wallet 아이콘 모두 `text-brand-fg` 로 통일.

## 작업 항목 (5 items)

### 1. globals.css 토큰 추가 + Header 외곽 토큰 교체

`src/app/globals.css` 의 `@theme` 에 `--color-brand-fg` 추가 (위 사전 조건 참조).

`src/components/layout/Header.tsx`:

```tsx
// 변경 전
<header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">

// 변경 후
<header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-elev/95 border-b border-border shadow-sm">
```

`bg-bg-elev/95` alpha 변형은 Tailwind v4 의 OKLCH 토큰 자동 alpha 변형으로 작동. **객관 검증**: phase 완료 시 `pnpm build` 후 `find .next -name "*.css" | xargs grep -l "bg-elev\|color-mix"` 로 emit 확인. 미emit 시 `globals.css` 외부에 커스텀 클래스 추가 fallback. **inline `style={{ ... }}` 작성 금지** (ADR-F13).

### 2. 로고/아이콘 토큰 (brand 단색 + brand-fg)

```tsx
// 변경 전
<div className="w-8 h-8 md:w-10 md:h-10 gradient-primary rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
  <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" />
</div>
<div>
  <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
    우리집 가계부
  </h1>
</div>

// 변경 후
<div className="w-8 h-8 md:w-10 md:h-10 bg-brand-500 rounded-xl flex items-center justify-center">
  <Wallet className="w-4 h-4 md:w-5 md:h-5 text-brand-fg" />
</div>
<h1 className="text-base md:text-xl font-bold text-fg tracking-tight">
  우리집 가계부
</h1>
```

- `gradient-primary` → `bg-brand-500` 단색
- Wallet 아이콘 색: `text-white` 금지 (ADR-F23) → `text-brand-fg`
- 로고 텍스트: 그라디언트 → `text-fg` 단색
- `shadow-lg` 제거 (sticky header 그림자만 유지)

### 3. Avatar + Dropdown 본문 토큰 + '가족 전환' 항목 (모바일)

```tsx
// Avatar trigger
<Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-brand-100">
  <AvatarImage src={session.user?.image || ""} />
  <AvatarFallback className="bg-brand-500 text-brand-fg font-semibold text-xs md:text-sm">
    {session.user?.name?.[0] || "U"}
  </AvatarFallback>
</Avatar>

// Dropdown 본문
<DropdownMenuContent align="end" className="w-56 bg-bg-elev border-border">
  <DropdownMenuLabel>
    <div className="flex flex-col space-y-1">
      <p className="text-sm font-medium text-fg leading-none">{session.user?.name}</p>
      <p className="text-xs text-fg-muted leading-none">{session.user?.email}</p>
    </div>
  </DropdownMenuLabel>
  <DropdownMenuSeparator />

  {/* 모바일 전용 — 가족 전환 진입점 */}
  <DropdownMenuItem className="md:hidden" onClick={() => setFamilySheetOpen(true)}>
    <Users className="mr-2 h-4 w-4" />
    <span>가족 전환</span>
  </DropdownMenuItem>
  <DropdownMenuSeparator className="md:hidden" />

  <DropdownMenuItem onClick={() => router.push("/settings")}>
    <User className="mr-2 h-4 w-4" />
    <span>설정</span>
  </DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem className="text-expense focus:text-expense" asChild>
    <form action={signOutAction}>
      <button type="submit" className="flex items-center w-full">
        <LogOut className="mr-2 h-4 w-4" />
        <span>로그아웃</span>
      </button>
    </form>
  </DropdownMenuItem>
</DropdownMenuContent>
```

- AvatarFallback: `bg-brand-500 text-brand-fg` (ADR-F23 준수, `text-white` 금지)
- Avatar ring: `ring-blue-100` → `ring-brand-100`
- DropdownMenuContent: `bg-bg-elev border-border` 명시
- Label 텍스트: `text-fg` / `text-fg-muted` (shadcn `text-muted-foreground` 제거)
- 로그아웃: `variant="destructive"` → `text-expense focus:text-expense`

### 4. FamilySelectorList 신설 (pure refactor — 책임 명확)

`src/components/families/FamilySelectorList.tsx` 신설. **책임**: `FamilySelectorList` 가 `selectFamilyAction` + `refreshSession` + `router.refresh` 까지 모두 내부에서 수행한다. `onSelected` 는 success 후 호출자 알림용 (Sheet close 등). 호출자 (Dropdown / Sheet) 는 trigger UI + 닫기 콜백만 책임.

```tsx
"use client";

import { selectFamilyAction } from "@/actions/family/select-family-action";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { useRouter } from "next/navigation";

interface FamilySelectorListProps {
  families: Family[];
  selectedFamilyUuid: string;
  /** select 성공 후 호출자에게 알림 — Sheet close 등 후속 UI 정리용 */
  onSelected?: (familyUuid: string) => void;
}

export function FamilySelectorList({ families, selectedFamilyUuid, onSelected }: FamilySelectorListProps) {
  const router = useRouter();
  const { refreshSession } = useSessionRefresh();

  const handleSelect = async (familyUuid: string) => {
    const result = await selectFamilyAction(familyUuid);
    if (result.success) {
      await refreshSession();
      router.refresh();
      onSelected?.(familyUuid);
    } else {
      console.error("Failed to select family:", result.error.message);
    }
  };

  // 가족 목록 렌더 (간단한 버튼 list — 현재 Dropdown 의 SelectItem 과 동등한 시각)
  return (
    <ul className="flex flex-col gap-1 py-2">
      {families.map((family) => (
        <li key={family.uuid}>
          <button
            type="button"
            onClick={() => handleSelect(family.uuid)}
            className={`w-full px-3 py-2 text-left text-sm rounded-md transition-colors ${
              family.uuid === selectedFamilyUuid
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-fg hover:bg-bg-muted"
            }`}
          >
            {family.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

`FamilySelectorDropdown.tsx` 는 가족 목록 fetch + 첫 가족 자동 선택 책임만 유지하고 list 렌더는 `FamilySelectorList` 위임. 기존 `loadInitialData` 의 가족 1개 자동 선택 + 쿠키 저장 + refreshSession 로직은 그대로 유지 (회귀 방지). 또한 **loading skeleton `bg-gray-100` → `bg-bg-muted`** 로 함께 토큰화.

### 5. 모바일 Sheet 통합 + Header import 정비 + 테스트 갱신

Header.tsx import 추가:

```tsx
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Users } from "lucide-react";
import { FamilySelectorList } from "@/components/families/FamilySelectorList";
import { getFamiliesAction } from "@/actions/family/get-families-action";
import type { Family } from "@/types/family";
```

Sheet 통합 — Header 본문 마지막에 추가:

```tsx
const [familySheetOpen, setFamilySheetOpen] = useState(false);
const [sheetFamilies, setSheetFamilies] = useState<Family[]>([]);

const handleOpenFamilySheet = async () => {
  // 가족 목록 lazy fetch — 모바일 열 때만
  const result = await getFamiliesAction();
  if (result.success && result.data) setSheetFamilies(result.data);
  setFamilySheetOpen(true);
};

// dropdown 의 '가족 전환' onClick → handleOpenFamilySheet

<Sheet open={familySheetOpen} onOpenChange={setFamilySheetOpen}>
  <SheetContent side="bottom" className="h-auto bg-bg-elev">
    <SheetHeader>
      <SheetTitle>가족 전환</SheetTitle>
    </SheetHeader>
    <FamilySelectorList
      families={sheetFamilies}
      selectedFamilyUuid={selectedFamilyUuid ?? ""}
      onSelected={() => setFamilySheetOpen(false)}
    />
  </SheetContent>
</Sheet>
```

**Sheet close 타이밍**: `FamilySelectorList` 가 `router.refresh()` 호출 후 `onSelected` 콜백을 호출 → Sheet close. 즉 refresh 트랜지션 시작 후 close 라 UX 안정적 (router.refresh 는 비동기 server fetch 트리거이고 close 는 즉시 client state).

테스트 갱신 — `src/__tests__/components/layout/Header.test.tsx`:
- `jest.mock("@/components/families/FamilySelectorList", () => ({ FamilySelectorList: () => <div data-testid="family-selector-list" /> }))` 추가
- `jest.mock("@/actions/family/get-families-action", () => ({ getFamiliesAction: jest.fn(() => Promise.resolve({ success: true, data: [] })) }))` 추가
- 기존 expect 는 legacy 토큰을 expect 하지 않으므로 mobile dropdown item ("가족 전환") 표시 확인 케이스만 1건 추가 (선택)

## Verification (mechanical)

```bash
# cwd: /Users/nhn/personal/fos-accountbook/.claude/worktrees/plan019

pnpm lint
pnpm tsc --noEmit
pnpm test --passWithNoTests
pnpm build

# legacy 토큰 0 — Header + FamilySelector 전 영역
! grep -rnE 'bg-white/|border-gray-|from-gray-|to-gray-|gradient-primary|ring-blue-|text-muted-foreground|bg-gray-100' \
  src/components/layout/Header.tsx \
  src/components/families/FamilySelectorDropdown.tsx \
  src/components/families/FamilySelectorList.tsx

# variant="destructive" 0
! grep -n 'variant="destructive"' src/components/layout/Header.tsx

# ADR-F23 — text-white / text-black 0 (Header)
! grep -nE 'text-white|text-black' src/components/layout/Header.tsx

# 신 토큰 사용 (Header 최소 5개)
grep -cE 'bg-bg-elev|border-border|bg-brand-500|ring-brand-100|text-fg|text-brand-fg|text-expense' \
  src/components/layout/Header.tsx   # >= 5

# 모바일 가족 전환 진입점
grep -nE 'md:hidden.*가족 전환|familySheetOpen|FamilySelectorList' src/components/layout/Header.tsx | wc -l   # >= 2

# globals.css 토큰 정의 확인
grep -n 'color-brand-fg' src/app/globals.css   # >= 1

# FamilySelectorList 신규 + 책임 (selectFamilyAction)
test -f src/components/families/FamilySelectorList.tsx
grep -n 'selectFamilyAction\|router.refresh' src/components/families/FamilySelectorList.tsx
```

## 수동 smoke

- 데스크톱 (>= 768px) → FamilySelectorDropdown 우상단 표시 + Avatar dropdown 에 '가족 전환' 항목 미표시
- 모바일 (< 768px) → FamilySelectorDropdown 숨김 + Avatar 클릭 → dropdown → '가족 전환' → Sheet bottom 표시
- Sheet 에서 가족 선택 → 페이지 갱신 후 Sheet 닫힘
- Dark mode → 모든 톤 자연스러움 (특히 brand-500 위 brand-fg 가독성)
- 가족 1개뿐인 사용자 → FamilySelector 표시 유지

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/globals.css` | `--color-brand-fg` 토큰 추가 |
| `src/components/layout/Header.tsx` | 토큰 + 로고 + dropdown + Sheet |
| `src/components/families/FamilySelectorList.tsx` | 신규 (책임: select + refresh + onSelected) |
| `src/components/families/FamilySelectorDropdown.tsx` | loading skeleton 토큰화 (`bg-gray-100` → `bg-bg-muted`) |
| `src/__tests__/components/layout/Header.test.tsx` | mock 추가 (FamilySelectorList, getFamiliesAction) |

## Out of Scope

- 페이지별 헤더 보조 정보 (예: "이번 달 5월" 라벨 일관 표시) — 후속 plan
- 가족 관리 페이지 신규 — 별도
- 로그아웃 확인 dialog — 현재 즉시 처리 유지
- 다국어 (en/ja) — 한국어만
- `FamilySelectorDropdown` 의 Select trigger 자체 디자인 변경 — 본 plan 범위 외 (loading skeleton 만 토큰화)

## Risks

| 리스크 | 완화 |
|---|---|
| `bg-bg-elev/95` 가 backdrop-blur 와 어울려 dark mode 너무 어두움 | 수동 smoke + 필요 시 `bg-bg-elev/90` alpha 조정 |
| FamilySelectorList 추출 시 기존 Dropdown 회귀 (refreshSession 누락 등) | List 가 select + refresh 모두 책임. Dropdown 은 lazy fetch 만. 수동 smoke 에서 데스크톱 가족 전환 동작 확인 |
| `--color-brand-fg` 값이 brand-500 위 contrast 불충분 | `oklch(0.985 0.003 188)` 은 near-white, brand-500 (oklch 0.640) 과 충분 대비. 의심 시 plan001 contrast 표 재확인 |
| dynamic ssr:false 의 Avatar Sheet trigger 가 hydration 미스매치 | Sheet 자체는 useState 만 — server 무관 |
| 모바일 dropdown 4 항목 + 클릭 영역 좁아짐 | shadcn DropdownMenuItem 기본 h-9, touch target 36px+ 유지 |
