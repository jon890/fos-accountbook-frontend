# Phase 01 — Header 토큰 일관화 + 로고 단색 + 모바일 '가족 전환'

**Model**: sonnet
**Status**: pending
**Goal**: `Header.tsx` 의 legacy 토큰 제거 + 로고 텍스트 그라디언트 → text-fg 단색 + Avatar dropdown 안에 모바일 전용 "가족 전환" 항목 추가 (Sheet 형태 진입점).

## Context (자기완결)

- 현재: `src/components/layout/Header.tsx` (115 줄). `(authenticated)/layout.tsx` 에서 호출 → 전 인증 페이지 일관 표시.
- legacy 잔재:
  - `bg-white/80 border-gray-200/50` — dark mode 미지원
  - `from-gray-900 to-gray-700 bg-clip-text text-transparent` — 텍스트 그라디언트
  - `gradient-primary` (구 brand 토큰?)
  - `ring-blue-100` Avatar
  - `text-muted-foreground` shadcn legacy
  - `variant="destructive"` DropdownMenuItem
- 구조 약점: `<div className="hidden md:block"><FamilySelectorDropdown /></div>` — 모바일에서 FamilySelector 진입 불가
- 데이터: session prop + selectedFamilyUuid prop (server 측 결정)

## 작업 항목

### 1. 헤더 외곽 토큰 교체

```tsx
// 변경 전
<header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm">

// 변경 후
<header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-elev/95 border-b border-border shadow-sm">
```

`bg-bg-elev/95` alpha 변형 작동 확인 — plan001 의 OKLCH 토큰 + Tailwind v4 가 자동 alpha 변형 지원. 미작동 시 `globals.css` 의 `@theme` 블록 외부에 `.bg-header { background: color-mix(in srgb, var(--color-bg-elev) 95%, transparent); }` 커스텀 클래스를 추가해 사용한다. **inline `style={{ ... }}` 작성 금지** (ADR-F13 / CLAUDE.md OKLCH 토큰 규칙 — 토큰 외부 하드코딩 차단).

### 2. 로고 단색 + brand 아이콘

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
  <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white" />
</div>
<h1 className="text-base md:text-xl font-bold text-fg tracking-tight">
  우리집 가계부
</h1>
```

`gradient-primary` 폐기 — plan001 의 brand-500 단색이 대체. `shadow-lg` 도 제거 (sticky header 그림자만 유지).

### 3. Avatar ring 토큰

```tsx
// 변경 전
<Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-blue-100">

// 변경 후
<Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-brand-100">

// AvatarFallback
className="bg-brand-500 text-white font-semibold text-xs md:text-sm"
// (기존 gradient-primary → bg-brand-500 단색)
```

### 4. Dropdown 본문 토큰 + '가족 전환' 항목

```tsx
<DropdownMenuContent align="end" className="w-56 bg-bg-elev border-border">
  <DropdownMenuLabel>
    <div className="flex flex-col space-y-1">
      <p className="text-sm font-medium text-fg leading-none">{session.user?.name}</p>
      <p className="text-xs text-fg-muted leading-none">{session.user?.email}</p>
    </div>
  </DropdownMenuLabel>
  <DropdownMenuSeparator />

  {/* 모바일 전용 — 가족 전환 진입점 */}
  <DropdownMenuItem
    className="md:hidden"
    onClick={() => setFamilySheetOpen(true)}
  >
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

`variant="destructive"` → `text-expense focus:text-expense` 명시 (시맨틱 토큰).

### 5. 모바일 가족 전환 Sheet

```tsx
const [familySheetOpen, setFamilySheetOpen] = useState(false);

// Header 본문 마지막에 추가:
<Sheet open={familySheetOpen} onOpenChange={setFamilySheetOpen}>
  <SheetContent side="bottom" className="h-auto bg-bg-elev">
    <SheetHeader>
      <SheetTitle>가족 전환</SheetTitle>
    </SheetHeader>
    {/* FamilySelectorDropdown 의 list 부분만 inline — 또는 별도 FamilySelectorList 컴포넌트로 추출 */}
    <FamilySelectorList onSelected={(_familyUuid) => setFamilySheetOpen(false)} />
  </SheetContent>
</Sheet>
```

`FamilySelectorList` 가 별도 추출 안 되어있으면 phase 시작 시 `src/components/families/FamilySelectorDropdown.tsx` 의 내부 list 부분을 분리 (가족 목록 렌더 + select handler):

```ts
// src/components/families/FamilySelectorList.tsx (신규)
interface FamilySelectorListProps {
  /** 선택된 가족 UUID 를 호출자에게 명시적으로 전달 — 호출자가 분기 처리 가능 */
  onSelected?: (familyUuid: string) => void;
}
```

`FamilySelectorDropdown` 의 dropdown content 안에서도 `FamilySelectorList` 재사용 — 데스크톱 / 모바일 단일 책임.

### 6. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/019-header-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# legacy 토큰 0
! grep -nE 'bg-white/|border-gray-|from-gray-|to-gray-|gradient-primary|ring-blue-|text-muted-foreground' \
  src/components/layout/Header.tsx

# variant="destructive" 0
! grep -n 'variant="destructive"' src/components/layout/Header.tsx

# 신 토큰 사용
grep -nE 'bg-bg-elev|border-border|bg-brand-500|ring-brand-100|text-fg|text-fg-muted|text-expense' \
  src/components/layout/Header.tsx | wc -l   # >= 4

# 모바일 가족 전환 항목
grep -nE 'md:hidden.*가족 전환|가족 전환.*md:hidden|familySheetOpen' \
  src/components/layout/Header.tsx | wc -l   # >= 1

# FamilySelectorList 존재
test -f src/components/families/FamilySelectorList.tsx
```

수동 smoke:
- 데스크톱 (>= 768px) → FamilySelectorDropdown 우상단 표시 + Avatar dropdown 에 '가족 전환' 항목 미표시
- 모바일 (< 768px) → FamilySelectorDropdown 숨김 + Avatar 클릭 → dropdown → '가족 전환' → Sheet bottom 표시
- Sheet 에서 가족 선택 → Sheet 닫힘 + 페이지 갱신
- Dark mode → 모든 톤 자연스러움
- 가족 1개뿐인 사용자 → FamilySelector 표시 유지 (가족명 + 관리 진입점)

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/layout/Header.tsx` | 토큰 + 로고 + dropdown + Sheet |
| `src/components/families/FamilySelectorList.tsx` | 신규 (Dropdown 의 list 분리) |
| `src/components/families/FamilySelectorDropdown.tsx` | FamilySelectorList 호출하도록 갱신 |

## Out of Scope

- 페이지별 헤더 보조 정보 (예: "이번 달 5월" 라벨 일관 표시) — 후속 plan
- 가족 관리 페이지 신규 (현재 /families 디렉터리 검토 필요) — 별도
- 로그아웃 확인 dialog — 현재 즉시 처리 유지
- 다국어 (en/ja) — 한국어만

## Risks

| 리스크 | 완화 |
|---|---|
| `bg-bg-elev/95` 가 backdrop-blur 와 어울려 dark mode 너무 어두움 | 수동 smoke + 필요 시 `bg-bg-elev/90` 으로 alpha 조정 |
| FamilySelectorList 추출 시 기존 FamilySelectorDropdown 회귀 | dropdown 사용처 (Header md+) 동작 확인. 추출 = pure refactor 로 동작 변경 없음 |
| dynamic import (ssr: false) 의 Avatar Sheet trigger 가 hydration 미스매치 | Sheet 자체는 useState 만 — server 무관. 단 가족 list 페칭은 client side |
| 모바일 dropdown 에 '가족 전환' 추가로 메뉴 4 항목 — 클릭 영역 좁아짐 | h-11 patch — touch target 44px 이상 유지. 수동 smoke 에서 모바일 클릭 확인 |
