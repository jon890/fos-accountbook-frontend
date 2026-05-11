# Phase 01 — Settings 페이지 + SettingsCard helper

**Model**: sonnet
**Status**: pending
**Goal**: handoff Mobile/Desktop Settings (Screen 5) 디자인 적용 — 3 카드 구조 (기본 가족 / 가족별 예산 / 알림) + `SettingsCard` 공용 헬퍼 추출.

## Context (자기완결)

- 현재: `src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` (302줄). 3 Card (line 119, 183, 267) 구조 이미 존재 — 토큰 교체만.
- handoff 참조:
  - 모바일: `/tmp/handoff_plan010/fos-accountbook/project/screens/mobile-extra.jsx` line 136~277
  - 데스크톱: 동일 디렉터리 `desktop-extra.jsx` line 22~194 (2-col grid)
- 사용자 결정: 3 카드 구조 유지 + 토큰 교체.
- 활성 라디오 시각: handoff 패턴 `bg-brand-50 text-brand-700` + brand-500 check icon (sw=2.6).

## 작업 항목

### 1. `SettingsCard` 공용 헬퍼 추출

`src/components/layout/SettingsCard.tsx` 신규. Props:

```ts
interface SettingsCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}
```

Layout: `bg-bg-elev rounded-lg border-border` + header (icon 24px + title 16px font-bold + subtitle 12.5px text-fg-muted) + content.

shadcn `Card` 위에 wrapper — 기존 Card 활용 + 헤더 패턴 일관.

### 2. SettingsPageClient 마이그레이션

3 Card 본문을 `<SettingsCard>` 호출로 교체. 텍스트 색/배경 하드코딩 grep + 토큰 교체:

```bash
grep -nE 'text-gray-|text-green-|hover:bg-gray-|bg-blue-|border-gray-' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx | head
```

교체 매핑:
- `text-gray-900` → `text-fg`
- `text-gray-600` → `text-fg-muted`
- `text-gray-500` → `text-fg-subtle`
- `text-green-600` → `text-brand-600` (현재 기본 표시 — handoff 가 brand 톤)
- `hover:bg-gray-50` → `hover:bg-bg-muted`

### 3. 활성 라디오 시각 (handoff 패턴)

기존 shadcn `RadioGroup` + `RadioGroupItem` 유지하되, 선택 시 행 전체에 `bg-brand-50` 배경 + 가족명 text `text-brand-700` 적용. 현재 기본 표시 ✓ 아이콘은 `text-brand-500`.

```tsx
<div className={cn(
  "flex items-center gap-3 p-3 rounded-md cursor-pointer transition",
  isSelected ? "bg-brand-50" : "hover:bg-bg-muted"
)}>
  <RadioGroupItem value={family.uuid} id={family.uuid} />
  <Label htmlFor={family.uuid} className={cn("flex-1", isSelected && "text-brand-700")}>
    {family.name}
    ...
  </Label>
</div>
```

### 4. 데스크톱 2-col grid 적용

handoff `DesktopSettings` (desktop-extra.jsx line 24~) 가 2-col grid 로 카드 배치. 모바일은 단일 column.

```tsx
<div className="grid gap-4 md:grid-cols-2">
  <SettingsCard ... />  {/* 기본 가족 */}
  <SettingsCard ... />  {/* 예산 */}
  <SettingsCard ... className="md:col-span-2" />  {/* 알림 — full width */}
</div>
```

### 5. 자동 verification

```bash
# cwd: /Users/nhn/personal/fos-accountbook
# branch: plan/010-domain-pages-redesign

pnpm lint
pnpm tsc --noEmit
pnpm build

test -f src/components/layout/SettingsCard.tsx

# 하드코딩 색 잔재 0
! grep -nE 'text-gray-[3-9]|text-green-[5-9]|hover:bg-gray-|bg-blue-50' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx

# 신 토큰 사용
grep -nE 'text-fg|text-fg-muted|text-brand-|bg-brand-50' \
  src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx | wc -l   # >= 5

# md:grid-cols-2 (데스크톱)
grep -n 'md:grid-cols-2' src/app/\(authenticated\)/settings/_components/SettingsPageClient.tsx | wc -l   # >= 1
```

수동 smoke: `/settings` → 3 카드 표시. 기본 가족 라디오 선택 시 brand 톤 활성. 데스크톱 viewport 2-col.

## Critical Files

| 파일 | 상태 |
|---|---|
| `src/components/layout/SettingsCard.tsx` | 신규 |
| `src/app/(authenticated)/settings/_components/SettingsPageClient.tsx` | 수정 (토큰 교체 + SettingsCard 사용) |

## Out of Scope

- Categories / Families 페이지 (phase 2~4)
- 신 Settings 섹션 추가 (프로필 / 로그아웃 등 — handoff 미제공)
- 알림 설정 데이터 모델 변경 (UI 만)

## Risks

| 리스크 | 완화 |
|---|---|
| 알림 설정 데이터 (`notifs`) 가 실제 backend 미연동 | UI 만 — `useState` 로직 유지. 실제 저장은 별도 plan |
| SettingsCard 헬퍼가 Card shadcn 과 prop 충돌 | wrapper 로 명확 분리. 내부에서 `<Card>` 호출 |
| 2-col grid 가 알림 카드 길이 다르면 어색 | 알림 카드 `md:col-span-2` 로 full-width. 또는 grid auto-rows 자연 흐름 |
