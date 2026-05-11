# Phase 02 — Categories list + Dialog stale fix + plan002 톤 팔레트

**Model**: sonnet
**Status**: pending
**Goal**: handoff Categories (Screen 6) 적용 — 카테고리 list row 토큰 교체 + Add/Edit/Delete Dialog 의 stale state fix (PR #233 패턴) + 색 팔레트 8개를 plan002 톤 fg 값으로 매핑.

## Context (자기완결)

- 영향 파일 (`src/app/(authenticated)/categories/_components/`):
  - `page.tsx` (42줄) — 헤더
  - `CategoryPageClient.tsx` (96줄)
  - `CategoryList.tsx` (90줄)
  - `CategoryItem.tsx` (85줄)
  - `AddCategoryDialog.tsx` (240줄) — useState 5개 (name/color/icon/excludeFromBudget/isSubmitting) + hex 팔레트
  - `EditCategoryDialog.tsx` (240줄) — 동일 + useEffect 의존성
  - `DeleteCategoryDialog.tsx` (53줄) — useActionState 0 (fix 불필요)
- handoff 참조: `mobile-extra.jsx` line 281~466 + `desktop-extra.jsx` line 198~365
- handoff 의 색 팔레트: `window.tokens.color.category[pickedHue]` — 8개 도메인 키 (food/cafe/transit/telecom/home/shopping/health/leisure).

## 작업 항목

### 1. AddCategoryDialog / EditCategoryDialog stale state fix

PR #233 의 inner body 패턴 동일 적용. 양 파일에:

```tsx
export function AddCategoryDialog({ open, onOpenChange, ... }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="...">
        ...
        {open ? <AddCategoryDialogBody ... /> : null}
      </DialogContent>
    </Dialog>
  );
}

function AddCategoryDialogBody({ onOpenChange, ... }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);  // 8 hex 중 첫 번째
  // ...
}
```

EditCategoryDialog 의 `useEffect(() => setColor(category.color), [category.color])` 패턴은 inner body 안의 initial state 로 흡수 — open 변경 시 자동 reset. **다른 카테고리 row 를 연속 수정 시 inner body 가 동일 prop shape 라 React 가 동일 mount 로 인식할 위험** → 반드시 `<EditCategoryDialogBody key={category.uuid} ... />` 로 key prop 강제. 강제 unmount/remount = initial value 새로 잡힘.

### 2. 색 팔레트 8개 → plan002 톤 fg 매핑

`PALETTE` 상수 (현재 EditCategoryDialog line 61~68 의 8 hex):

```ts
// 변경 전 (Tailwind 기본 색)
const PALETTE = ["#ef4444", "#f59e0b", "#ec4899", "#10b981", "#3b82f6", "#8b5cf6", "#06b6d4", "#f43f5e"];

// 변경 후 (plan002 카테고리 톤 fg — OKLCH)
const PALETTE = [
  "oklch(0.560 0.140 35)",   // food coral
  "oklch(0.520 0.110 60)",   // cafe bronze
  "oklch(0.540 0.130 230)",  // transit blue
  "oklch(0.540 0.130 280)",  // telecom violet
  "oklch(0.510 0.110 188)",  // home teal
  "oklch(0.560 0.140 330)",  // shopping pink
  "oklch(0.520 0.120 152)",  // health green
  "oklch(0.520 0.120 105)",  // leisure olive
];
```

DB 의 `category.color` 는 여전히 string — hex 또는 OKLCH 둘 다 수용. 단 OKLCH 문자열을 backend 가 그대로 저장 (validation 없음 가정 — backend 점검 필요. 가드 추가).

backend 가 hex 만 수용한다면 plan 본문에 보고 + plan011 로 backend 변경 분리.

### 3. CategoryList row 토큰 교체

`CategoryList.tsx` + `CategoryItem.tsx`:
- 카테고리 icon cell: 기존 `bg-[${color}]/15 text-[${color}]` Tailwind arbitrary 패턴 → inline style 로 교체. **color 가 OKLCH 문자열이므로 alpha 합성은 슬래시 문법 사용** (hex 접미사 `26` 같은 합성 불가):
  ```ts
  // OKLCH 슬래시 alpha 합성 helper
  function withAlpha(oklch: string, a: number): string {
    // "oklch(0.560 0.140 35)" → "oklch(0.560 0.140 35 / 0.16)"
    return oklch.replace(/\)$/, ` / ${a})`);
  }
  // 사용
  style={{ background: withAlpha(color, 0.16), color }}
  ```
  hex fallback (backend 거부 시) 의 경우만 `color + "29"` (16%) 사용 — 16진 alpha 는 hex string 일 때만 유효.
- row hover: `hover:bg-bg-muted`
- 텍스트: `text-fg` / `text-fg-muted` 토큰

### 4. CategoryPageClient + page.tsx 헤더 토큰

`page.tsx` line 29~32 의 `text-gray-900` / `text-gray-600` → `text-fg` / `text-fg-muted`. "추가" 버튼이 있으면 `bg-brand-500 text-white` 토큰 적용.

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/010-domain-pages-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm test --run

# Dialog stale fix 패턴 적용 (open ? <Body /> 분리)
grep -n 'CategoryDialogBody\|open\s*?\s*<' src/app/\(authenticated\)/categories/_components/AddCategoryDialog.tsx | wc -l   # >= 1
grep -n 'CategoryDialogBody\|open\s*?\s*<' src/app/\(authenticated\)/categories/_components/EditCategoryDialog.tsx | wc -l   # >= 1

# 8 hex 팔레트 잔재 0 (Tailwind 기본 색)
! grep -nE '#ef4444|#f59e0b|#ec4899|#10b981|#3b82f6|#8b5cf6|#06b6d4|#f43f5e' src/app/\(authenticated\)/categories/

# OKLCH 톤 8개 등록
grep -cE 'oklch\([0-9.]+ [0-9.]+ [0-9]+\)' src/app/\(authenticated\)/categories/_components/AddCategoryDialog.tsx   # >= 8

# 하드코딩 gray 색 잔재 0
! grep -nE 'text-gray-[3-9]|hover:bg-gray-' src/app/\(authenticated\)/categories/
```

수동 smoke: `/categories` → 카테고리 row + 추가 → 다이얼로그 → 색 팔레트 8 동그라미 (plan002 톤). 다이얼로그 두 번 열기 시 stale state 없음. Edit 도 동일.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/app/(authenticated)/categories/_components/AddCategoryDialog.tsx` | inner body 분리 + 팔레트 교체 |
| `src/app/(authenticated)/categories/_components/EditCategoryDialog.tsx` | 동일 |
| `src/app/(authenticated)/categories/_components/CategoryList.tsx` | 토큰 교체 |
| `src/app/(authenticated)/categories/_components/CategoryItem.tsx` | 토큰 교체 |
| `src/app/(authenticated)/categories/_components/CategoryPageClient.tsx` | 토큰 |
| `src/app/(authenticated)/categories/page.tsx` | 헤더 토큰 |

## Out of Scope

- backend `category.color` schema 변경 — OKLCH 문자열 수용 확인 후 별도 plan
- 카테고리 row 의 통계 (이번 달 N건) 추가 — 데이터 의존 별도 plan
- DeleteCategoryDialog 디자인 — 토큰만 (간단), 본 phase 안 포함하되 별도 작업항목 X

## Risks

| 리스크 | 완화 |
|---|---|
| backend 가 OKLCH 문자열 거부 (validation) | dev 환경 fetch 로 확인 — 거부 시 phase 본문에 보고 + 일단 hex 유지 |
| Tailwind v4 가 OKLCH inline `style={{ color: "oklch(...)" }}` 인식 못 함 | inline style 은 CSS color value 그대로 전달 — Tailwind 무관. 브라우저가 처리. 안전 |
| EditCategoryDialog 의 prop 변경 시 inner body remount 자연 동기화 | 동일 row 반복 수정 시 같은 expense prop → Body 가 unmount/remount = initial value 새로. PR #233 패턴과 일관 |
