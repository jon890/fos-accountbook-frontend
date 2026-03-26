<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# (authenticated)

## Purpose
인증이 필요한 모든 페이지의 라우트 그룹. `layout.tsx`에서 세션 검증 후 미인증 시 로그인 페이지로 리다이렉트. Header + BottomNavigation이 포함된 공통 레이아웃 제공.

## Key Files

| File | Description |
|------|-------------|
| `layout.tsx` | 인증 레이아웃 — 세션 확인, Header, BottomNavigation 렌더링 |
| `loading.tsx` | 전역 로딩 UI (Suspense fallback) |
| `page.tsx` | 인증 후 첫 진입점 (대시보드로 리다이렉트) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `dashboard/` | 메인 대시보드 (통계, 빠른 액션, 최근 내역, 캘린더) |
| `transactions/` | 수입/지출 통합 내역 탭 페이지 |
| `expenses/` | 지출 전용 페이지 |
| `categories/` | 카테고리 관리 |
| `settings/` | 사용자 설정 (프로필, 알림 등) |
| `families/` | 가족 선택(`select/`), 가족 생성(`create/`) |
| `invite/[token]/` | 가족 초대 수락 페이지 |

## For AI Agents

### Working In This Directory
- 새 페이지 추가 시 이 그룹 하위에 배치 → 자동으로 인증 적용됨
- 인터랙티브 클라이언트 로직은 `_components/` 하위 Client Component로 분리
- 배경은 `app-background` 클래스 사용 (layout.tsx에 적용됨)

### Common Patterns
```tsx
// 페이지 기본 구조 (Server Component)
export default async function SomePage() {
  const data = await fetchData(); // 서버에서 직접 데이터 페칭
  return <SomePageClient data={data} />;
}
```

<!-- MANUAL: -->
