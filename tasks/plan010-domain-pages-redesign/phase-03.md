# Phase 03 — FamiliesSelect 카드 행 + plan002 멤버 avatar

**Model**: sonnet
**Status**: pending
**Goal**: handoff FamiliesSelect (Screen 7) 디자인 적용 — 카드 행 구조 유지 + 토큰 교체 + plan002 RecentActivity 의 멤버 avatar 겹침 패턴 재사용.

## Context (자기완결)

- 영향 파일:
  - `src/app/(authenticated)/families/select/page.tsx` (29줄) — Server Component, 직접 렌더 X
  - `src/components/families/FamilySelectorPage.tsx` — wrapper (확인)
  - `src/components/families/FamilySelector.tsx` (~228줄) — 실제 카드 list. 하드코딩 색 다수 (`hover:border-blue-200`, `text-gray-*`, `bg-gray-300` avatar).
- handoff 참조: `mobile-extra.jsx` line 470~575 + `desktop-extra.jsx` line 369~487
- plan002 의 `CoupleAvatars` 헬퍼 또는 RecentActivity 의 avatar 겹침 (`-ml-2 ring-2 ring-bg-elev`) 패턴 재사용.

## 작업 항목

### 1. FamilySelector 카드 토큰 교체

기존 (FamilySelector.tsx line 155~):
```tsx
className="cursor-pointer hover:shadow-lg ... border-2 hover:border-blue-200"
```

신규:
```tsx
className="cursor-pointer transition border-border hover:border-brand-300 hover:shadow-default bg-bg-elev"
```

card 안 텍스트:
- `text-gray-900` → `text-fg`
- `text-gray-600` → `text-fg-muted`
- `text-gray-500` → `text-fg-subtle`
- `text-gray-400` (ChevronRight) → `text-fg-subtle`

### 2. 멤버 avatar 겹침 패턴 (plan002 재사용)

기존 (line 188~):
```tsx
<div className="w-8 h-8 rounded-full bg-gray-300 ...">
```

신규: plan002 `CoupleAvatars` 또는 동일 패턴:

```tsx
<div className="flex">
  {family.members.slice(0, 3).map((m, i) => (
    <div key={m.uuid} className={cn(
      "w-8 h-8 rounded-full ring-2 ring-bg-elev overflow-hidden",
      i > 0 && "-ml-2"
    )}>
      {m.userImage ? (
        <Image src={m.userImage} alt={m.userName ?? ""} width={32} height={32} className="object-cover w-full h-full" />
      ) : (
        <div className="w-full h-full bg-bg-muted text-fg-muted text-xs font-semibold flex items-center justify-center">
          {m.userName?.charAt(0) ?? "U"}
        </div>
      )}
    </div>
  ))}
  {family.members.length > 3 && (
    <div className="-ml-2 w-8 h-8 rounded-full ring-2 ring-bg-elev bg-bg-muted text-fg-muted text-xs font-semibold flex items-center justify-center">
      +{family.members.length - 3}
    </div>
  )}
</div>
```

기존 `text-xs text-gray-500` "+{N}" 패턴 → `+N` cell 자체로 (handoff 스타일).

### 3. 구분선 + 신 가족 만들기 영역

FamilySelector 하단 구분선 (line 220~ "또는"):
- `border-gray-300` → `border-border`
- `bg-gray-50 text-gray-500` → `bg-bg text-fg-muted`

### 4. 에러 / 빈 상태 토큰

`text-red-500` (line 112 error) → `text-expense` (semantic 의미색).

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/010-domain-pages-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

# 하드코딩 잔재 0
! grep -nE 'text-gray-[3-9]|bg-gray-[3-9]|hover:border-blue-|text-red-' src/components/families/FamilySelector.tsx

# 신 토큰 사용
grep -nE 'text-fg|hover:border-brand-300|ring-bg-elev|bg-bg-elev' src/components/families/FamilySelector.tsx | wc -l   # >= 4

# 멤버 avatar 겹침 패턴 (-ml-2 ring)
grep -n '\-ml-2.*ring-' src/components/families/FamilySelector.tsx | wc -l   # >= 1
```

수동 smoke: `/families/select` (다수 가족 보유 시) → 카드 row 표시 + hover brand-300 border + 멤버 avatar 3개 겹침 + "+N" 자연.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/families/FamilySelector.tsx` | 토큰 교체 + avatar 겹침 패턴 |
| `src/components/families/FamilySelectorPage.tsx` (해당 시) | wrapper 토큰 점검 |

## Out of Scope

- FamilySelectorDropdown (drawer 안 가족 전환 UI — 별도 컴포넌트, 본 plan 본문 OOS)
- 가족 row 클릭 → 상세 페이지 (현재 selection only)
- 4명 이상 가족 "+N" 외 cell — 본 plan 은 3 + 1 cell 유지

## Risks

| 리스크 | 완화 |
|---|---|
| `family.members` API 응답에 `userImage` 부재 | 첫 글자 fallback 이미 있음 (line 198) — 토큰만 적용 |
| plan002 `CoupleAvatars` helper 가 export 되지 않을 경우 inline | 인라인 구현으로 충분. 재사용은 추후 plan 에서 helper 추출 검토 |
| ring `ring-bg-elev` 가 dark mode 에서 어색 | plan001 `--color-bg-elev` 가 dark 에서 자연 변환. 시각 점검만 |
