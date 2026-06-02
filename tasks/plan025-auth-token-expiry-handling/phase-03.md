# Phase 03 — 로그아웃 버튼 Radix DropdownMenuItem form submit 유실 수정

**Model**: sonnet
**Status**: pending

---

## 목표

로그아웃 버튼이 항상 동작하지 않는 문제를 고친다.
`<DropdownMenuItem asChild><form action={signOutAction}><button type="submit">` 구조에서
클릭 시 `DropdownMenuItem` 의 `onSelect` 가 메뉴를 닫으며 Portal 을 unmount → form 이 DOM 에서
제거되어 native submit 이 발생하기 전에 유실된다. 로그인 시점과 무관하게 항상 실패.

근거: `docs/adr.md` ADR-F27.

**범위 외**:
- 401/세션 만료 처리 → phase 1, 2.
- `signOutAction` 내부 로직(쿠키 삭제 + signOut)은 정상이므로 변경하지 않는다.

---

## 배경 (현재 코드)

`src/components/layout/Header.tsx:127` 근처:

```tsx
<DropdownMenuItem className="text-expense focus:text-expense" asChild>
  <form action={signOutAction}>
    <button type="submit" className="flex items-center w-full">
      <LogOut className="mr-2 h-4 w-4" />
      <span>로그아웃</span>
    </button>
  </form>
</DropdownMenuItem>
```

`Header.tsx` 는 이미 `"use client"` (1행). `signOutAction` 은 `src/actions/auth/signout-action.ts` 의 Server Action — 클라이언트에서 직접 호출 가능 (`await signOutAction()`).
다른 메뉴 항목(설정 등)은 `onClick={() => router.push(...)}` 패턴 사용 — 동일 스타일 참고.

## 작업 항목 (2)

### 1. `src/components/layout/Header.tsx` — form 제거, onSelect 직접 호출

`form` + submit 버튼 구조를 제거하고, `DropdownMenuItem` 의 `onSelect` 에서 자동 닫힘을 막은 뒤 `signOutAction()` 을 직접 호출한다.

```tsx
<DropdownMenuItem
  className="text-expense focus:text-expense"
  onSelect={(e) => {
    e.preventDefault();
    void signOutAction();
  }}
>
  <LogOut className="mr-2 h-4 w-4" />
  <span>로그아웃</span>
</DropdownMenuItem>
```

- `asChild` 제거 (이제 자식이 form 이 아니라 일반 메뉴 항목 내용).
- `e.preventDefault()` 로 Radix 의 자동 메뉴 닫힘(+ Portal unmount)을 막아 Server Action 호출이 유실되지 않게 한다.
- `void` 로 floating promise lint 경고 회피 (`signOutAction` 은 내부에서 `signOut({ redirectTo })` 로 redirect 하므로 호출자는 결과를 기다리지 않아도 됨).

### 2. `src/__tests__/components/layout/Header.test.tsx` — 로그아웃 테스트 갱신

기존 테스트(198행 근처 "로그아웃 버튼을 클릭하면 signOutAction 을 호출한다")가 form submit 기준이면, onSelect/click 기준으로 갱신한다.
- 메뉴를 열고 로그아웃 항목을 클릭(또는 select) → `signOutAction` mock 이 호출되는지 검증.
- 기존 mock 선언(`signOutAction: (...args) => mockSignOutAction(...args)`)은 그대로 활용.

Radix DropdownMenu 의 항목 클릭은 Testing Library 에서 trigger 를 먼저 열어야 한다. 기존 테스트가 메뉴를 여는 방식(userEvent.click(trigger))을 따른다. onSelect 가 keyboard/pointer 양쪽에서 발화하므로 `userEvent.click(로그아웃 항목)` 으로 충분.

---

## Critical Files

| 파일 | 변경 |
|---|---|
| `src/components/layout/Header.tsx` | 수정 — form 제거, onSelect 직접 호출 |
| `src/__tests__/components/layout/Header.test.tsx` | 수정 — 로그아웃 테스트 갱신 |

## 검증

```bash
# cwd: /Users/nhn/personal/fos-accountbook
pnpm lint
pnpm test --silent src/__tests__/components/layout/Header.test.tsx 2>&1 | tail -20

# form action 제거 확인 (로그아웃에 form 미사용)
! grep -nE '<form action=\{signOutAction\}' src/components/layout/Header.tsx

# onSelect 직접 호출 패턴 존재
grep -nE 'onSelect=.*signOutAction|void signOutAction' src/components/layout/Header.tsx
```

기대: 첫 grep exit 1(매치 없음), 둘째 grep 1건 이상, Header 테스트 통과, `pnpm lint` exit 0.

## 의도 메모 (왜)

- `onSelect` + `preventDefault` 가 정답인 이유: Radix `DropdownMenuItem` 의 기본 동작은 select 시 메뉴를 닫는 것이고, 닫힘은 Portal unmount 를 동반한다. form submit 은 그 unmount 와 경쟁해 유실된다. preventDefault 로 닫힘을 막고 명시적으로 Server Action 을 호출하면 경쟁이 사라진다 (ADR-F27).
- `setTimeout` 으로 submit 을 지연시키는 우회는 타이밍 의존이라 채택하지 않음 (ADR-F27 대안 기각).
