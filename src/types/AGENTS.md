<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-26 | Updated: 2026-03-26 -->

# types

## Purpose
프로젝트 전체에서 사용하는 TypeScript 타입 정의. 도메인 모델 타입과 NextAuth 타입 확장을 포함한다.

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | 타입 배럴 익스포트 |
| `category.ts` | 카테고리 도메인 타입 |
| `common.ts` | 공통 타입 (페이지네이션, API 응답 등) |
| `dashboard.ts` | 대시보드 통계 타입 |
| `expense.ts` | 지출 도메인 타입 |
| `family.ts` | 가족 도메인 타입 |
| `income.ts` | 수입 도메인 타입 |
| `invitation.ts` | 초대 관련 타입 |
| `next-auth.d.ts` | NextAuth Session 타입 확장 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/` | 인증 관련 타입 (응답, 토큰, 유저 프로필) |
| `actions/` | Server Action 응답 타입 (notification 등) |

## For AI Agents

### Working In This Directory
- 새 도메인 타입 추가 시 `index.ts` 배럴 익스포트에 추가
- `next-auth.d.ts`는 Session에 커스텀 필드 추가 시 수정
- `any` 사용 절대 금지 — 타입을 모를 때는 `unknown` 사용 후 타입 가드 적용

<!-- MANUAL: -->
