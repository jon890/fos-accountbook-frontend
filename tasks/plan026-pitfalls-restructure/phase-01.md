# Phase 01 — common-pitfalls fos-accountbook 전용 분리

**Goal**: `.claude/skills/_shared/common-pitfalls.md` 에서 다른 레포(fos-blog 등) 전용 함정을 들어내고, fos-accountbook 에 실제 적용되는 함정만 남긴다.

## 배경

파일 452줄 / 36개 함정 중 대부분이 다른 레포 함정이다.
파일 마지막 줄이 `이 파일은 3 레포 (fos-blog / webtoon-maker-v1 / 기타) 에서 동기화된다` 라고 명시한다.

§ 3·§ 4 함정이 전제하는 기술이 fos-accountbook 에는 전부 없다 (2026-06-02 실측):

- drizzle-orm · pino · hast · shiki · mermaid · rehype · react-markdown · vitest → 각 0곳
- 이 레포 실제 스택: next-auth · ky · jest · radix

무관한 함정이 단순 노이즈를 넘어 능동적 피해를 준다 — BLG9(fos-blog 함정)가 이 레포 Tailwind 스캔에 걸려 dev 를 500 으로 깼다.

## 작업

1. **남길 함정** (이 레포 관련):
   - `§ 1` plan 작성 (1-1~1-9) — 레포 무관 공통
   - `§ 2` team 운영 (2-1~2-10) — build-with-teams 공통
   - `3-3` CSS custom property `as CSSProperties` (이 레포 2곳 사용)
   - `3-4` inline style vs Tailwind arbitrary class (이 레포 관례, CLAUDE.md 명시)
   - `BLG9` Tailwind 가 markdown 스캔 → invalid CSS (Tailwind v4 공통, 이 레포 실증)
   - `FE1~FE3` App Router 경계 / Shadcn 우회 / revalidatePath 누락
2. **제거 함정** (다른 레포 전용):
   - `3-1, 3-2, 3-5 ~ 3-17` — Drizzle / SVG stop / rate-limit / hast / server-only+vitest / react-hook-form / Drizzle timestamp 등 fos-blog
   - `BE1~BE3` (Spring) · `CLI1~CLI3` (dooray-cli)
   - `BLG1~BLG8, BLG10~BLG17` — Drizzle / pino / NJS proxy / shiki 등 fos-blog
3. **헤더 갱신**: 제목을 `# Common Pitfalls — fos-accountbook` 로. 마지막 줄의 "3 레포 동기화" 문구 제거 → "fos-accountbook 전용. 다른 레포는 각자 common-pitfalls 유지" 로 교체.
4. **§ 3/§ 4 의 남는 항목**(3-3, 3-4, FE1~3, BLG9)은 일단 그 자리에 두고 phase 03 에서 재배치.

## 주의

- 제거 전 각 함정이 정말 이 레포 무관인지 확인 (해당 기술 `grep` 0곳). "dead code" 판단 금지 — 실측 후 제거.
- 이 phase 는 **삭제 중심**. 형식/인덱스는 phase 02·03 에서.

## 검증

```bash
F=.claude/skills/_shared/common-pitfalls.md
# 남은 함정이 이 레포 스택만 참조하는지 — 제거 대상 기술 0건
grep -ciE "drizzle|pino|hast|shiki|mermaid|rehype|react-markdown|vitest|spring|commander" "$F"   # = 0
# "3 레포 동기화" 문구 제거됨
grep -c "3 레포" "$F"   # = 0
# 줄 수 대폭 감소 (452 → 대략 150 이하)
wc -l "$F"
```

성공 기준:

- 제거 대상 기술 언급 0건
- "3 레포 동기화" 0건
- 남은 함정이 plan 작성 / team 운영 / 이 레포 코드 패턴(3-3, 3-4, BLG9, FE1~3) 으로만 구성
