# Flow — fos-accountbook 사용자 흐름

## 1. 최초 사용자 온보딩

```
[앱 접속]
    │
    ▼
세션 확인
    │
    ├─ 미로그인 → /auth/signin
    │               └─ Google / Naver OAuth 선택
    │                       └─ NextAuth 처리 → JWT 발급 → /
    │
    └─ 로그인됨 → defaultFamilyUuid 확인
                    │
                    ├─ 없음 → /families/create
                    │           └─ 가족 이름 + 월 예산 입력
                    │                   └─ 가족 생성 → 기본 카테고리('미분류') 자동 생성
                    │                           └─ /dashboard
                    │
                    └─ 있음 → /dashboard
```

---

## 2. 가족 초대 플로우

```
[초대자 (OWNER)]
    │
    ├─ /settings → 가족 관리 탭
    │   └─ "초대 링크 생성" 클릭
    │           └─ createInvitationLinkAction()
    │                   └─ 토큰 생성 (UUID 기반 256bit)
    │                   └─ 만료: 72시간
    │                   └─ URL 복사: /invite/{token}
    │
    └─ 링크 공유 (카카오톡, 문자 등)

[수락자]
    │
    ├─ /invite/{token} 접속
    │   └─ getInvitationInfoAction(token)
    │           ├─ 만료/사용됨 → 오류 메시지
    │           └─ 유효 → 가족명 + 초대자 표시
    │                   └─ "수락" 클릭
    │                           └─ acceptInvitationAction(token)
    │                                   └─ FamilyMember 생성 (MEMBER 역할)
    │                                   └─ defaultFamilyUuid 설정
    │                                   └─ /dashboard 리다이렉트
```

---

## 3. 지출 등록 플로우

```
[트랜잭션 페이지 또는 대시보드]
    │
    └─ "+ 지출 추가" 버튼
            └─ AddExpenseDialog (Sheet) 열림
                    │
                    ├─ 카테고리 선택 (드롭다운)
                    ├─ 금액 입력 (숫자)
                    ├─ 날짜 선택 (DatePicker, default: 오늘)
                    └─ 메모 입력 (선택)
                            │
                            └─ 저장 → createExpenseAction()
                                    ├─ requireAuthOrRedirect()
                                    ├─ getSelectedFamilyUuid()
                                    ├─ Zod 검증
                                    └─ createExpense() → POST /families/{uuid}/expenses
                                            └─ revalidatePath 3곳
                                                    └─ toast 성공 메시지
```

---

## 4. 지출 수정/삭제 플로우

```
[ExpenseItem]
    │
    ├─ 수정 아이콘 클릭
    │   └─ EditExpenseDialog 열림 (기존 값 pre-fill)
    │           └─ 수정 후 저장 → updateExpenseAction()
    │                   └─ 검증 → updateExpense() → PUT /expenses/{uuid}
    │                           └─ revalidatePath → UI 갱신
    │
    └─ 삭제 아이콘 클릭
            └─ 확인 AlertDialog
                    └─ 확인 → deleteExpenseAction()
                            └─ DELETE /expenses/{uuid} (Soft Delete)
                                    └─ revalidatePath → 목록에서 제거
```

---

## 5. 대시보드 데이터 흐름

```
[/dashboard 접속] (Server Component)
    │
    ├─ getDashboardStatsAction() → /dashboard/stats/monthly
    │       └─ { monthlyExpense, monthlyIncome, remainingBudget, budget }
    │
    ├─ getRecentExpensesAction() → /expenses?limit=10
    │       └─ [ { amount, description, date, category } × 10 ]
    │
    └─ getMonthlyDailyStatsAction() → /dashboard/daily-stats
            └─ [ { date, income, expense } × N일 ]

[DashboardClient (Client Component)]
    ├─ StatsCards: 월지출 / 월수입 / 남은예산
    ├─ CalendarView: 일별 수입·지출 바 차트
    └─ RecentExpenseList: 최근 10개 지출
```

---

## 6. 예산 알림 플로우 (백엔드)

```
[지출 등록/수정]
    │
    └─ ExpenseCreatedEvent / ExpenseUpdatedEvent 발행
            │
            └─ BudgetAlertService 수신
                    │
                    ├─ 해당 월 지출 합계 계산 (excludeFromBudget 제외)
                    │
                    ├─ 80% 이상 → BUDGET_WARNING Notification 생성
                    │               (yearMonth 기준 중복 방지)
                    │
                    └─ 100% 이상 → BUDGET_EXCEEDED Notification 생성
                                    (yearMonth 기준 중복 방지)

[프론트엔드]
    └─ Header의 NotificationBell
            ├─ getUnreadCountAction() (주기적 조회)
            └─ 클릭 → 알림 목록 → markNotificationReadAction()
```

---

## 7. 카테고리 삭제 플로우

```
[CategoryItem] → 삭제 클릭
    │
    └─ deleteCategoryAction(categoryUuid)
            │
            ├─ 기본 카테고리(isDefault=true) → 삭제 불가 오류
            │
            └─ 일반 카테고리 → Soft Delete
                    └─ 해당 카테고리의 모든 Expense → '미분류' 카테고리로 이동
                            └─ revalidatePath → 목록 갱신
```

---

## 8. 인증 토큰 갱신 플로우 (NextAuth)

```
[모든 API 요청]
    │
    └─ NextAuth JWT callback
            │
            ├─ 토큰 만료 5분 전?
            │   └─ Yes → refreshBackendToken()
            │               └─ POST /auth/refresh
            │                       └─ 새 accessToken + refreshToken → JWT 갱신
            │
            └─ No → 기존 accessToken 사용
                    └─ Authorization: Bearer {token} 헤더 추가
```

---

## 9. 가족 선택 플로우 (다중 가족)

```
[Header의 FamilySelector]
    │
    └─ 가족 드롭다운 클릭
            └─ getFamiliesAction() → 내 가족 목록
                    └─ 가족 선택
                            └─ setDefaultFamilyAction(familyUuid)
                                    └─ PUT /users/me/profile { defaultFamilyUuid }
                                            └─ 세션 업데이트 → 전체 페이지 revalidate
```

---

## 10. 반복 지출 등록

```
[거래내역 > 고정지출 탭]
    │
    └─ "+ 고정지출 추가" 버튼
            └─ AddRecurringExpenseSheet 열림
                    ├─ 이름 (필수)
                    ├─ 카테고리 선택 (드롭다운)
                    ├─ 금액 입력 (숫자)
                    └─ 매월 N일 (1~28, 숫자 입력 또는 선택)
                            │
                            └─ 저장 → createRecurringExpenseAction()
                                    ├─ requireAuth()
                                    ├─ Zod 검증 (dayOfMonth 1~28 range check)
                                    └─ POST /families/{uuid}/recurring-expenses
                                            └─ "내일부터 매월 N일에 자동 등록됩니다" toast
                                            └─ revalidatePath("/transactions")
```

---

## 11. 고정지출 탭 조회

```
[거래내역 > 고정지출 탭 접근] (Server Component)
    │
    └─ getRecurringExpensesAction(month)
            └─ GET /families/{uuid}/recurring-expenses?month=YYYY-MM
                    └─ { totalMonthlyAmount, items[] }
                            │
                            ├─ 이달 합계 카드: "이번달 고정비 OOO원"
                            │
                            └─ 템플릿 목록 (day_of_month 오름차순)
                                    ├─ ✓ 아이콘 — generatedThisMonth=true (생성 완료)
                                    ├─ ○ 아이콘 — generatedThisMonth=false (예정)
                                    └─ 항목 클릭 → 아코디언 펼침 (수정/삭제 버튼)
```

---

## 12. 반복 지출 수정/삭제

```
[RecurringExpenseItem 아코디언]
    │
    ├─ 수정 버튼 클릭
    │   └─ EditRecurringExpenseSheet 열림 (기존 값 pre-fill)
    │           └─ 수정 후 저장 → updateRecurringExpenseAction()
    │                   └─ PUT /families/{uuid}/recurring-expenses/{uuid}
    │                           └─ "다음 스케줄부터 반영됩니다" toast
    │                           └─ revalidatePath("/transactions")
    │
    └─ 삭제 버튼 클릭
            └─ AlertDialog: "고정지출을 종료하시겠어요? 기존 등록된 지출은 유지됩니다."
                    └─ 확인 → deleteRecurringExpenseAction()
                            └─ DELETE /families/{uuid}/recurring-expenses/{uuid} (ENDED)
                                    └─ "고정지출이 종료되었습니다" toast
                                    └─ revalidatePath("/transactions")
```

---

## 13. 스케줄러 자동 생성 (백엔드)

```
[매일 새벽 1시 — @Scheduled(cron = "0 0 1 * * ?")]
    │
    └─ RecurringExpenseScheduler.generateRecurringExpenses()
            │
            └─ 오늘 day_of_month인 ACTIVE 템플릿 전체 조회
                    │
                    └─ 각 템플릿에 대해:
                            ├─ Expense INSERT 시도
                            │   ├─ recurring_expense_uuid + year_month UNIQUE 위반 → log.warn 후 skip
                            │   └─ 성공 → RefreshCw 배지용 recurring_expense_uuid, year_month 저장
                            │
                            └─ ApplicationEvent 발행 (AFTER_COMMIT)
                                    └─ RECURRING_EXPENSE_CREATED 알림 생성 (가족 전체)
```

---

## 14. 대시보드 고정비 카드

```
[/dashboard 접속] (Server Component)
    │
    └─ getRecurringExpensesTotalAction()
            └─ GET /families/{uuid}/recurring-expenses/monthly-total
                    └─ { totalMonthlyAmount }
                            │
                            └─ "이달 고정비 OOO원" 카드 렌더링
                                    (기존 4개 요약 카드 아래 새 행)
                                    └─ 클릭 → /transactions?tab=recurring
```
