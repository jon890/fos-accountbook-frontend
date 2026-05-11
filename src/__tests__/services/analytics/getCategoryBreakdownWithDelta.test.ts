/**
 * getCategoryBreakdownWithDelta service 단위 테스트
 * @jest-environment node
 */

jest.mock("@/lib/env/server.env", () => ({
  serverEnv: {
    BACKEND_API_URL: "http://localhost:8080",
  },
}));
jest.mock("@/lib/server/auth/auth", () => ({
  handlers: {},
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/lib/server/api/client");
jest.mock("@/lib/server/cache");

import { getCategoryBreakdownWithDelta } from "@/services/analytics/analytics-service";
import { getMonthlyCategoryBreakdown } from "@/services/dashboard/dashboard-service";

jest.mock("@/services/dashboard/dashboard-service");

const mockGetMonthlyCategoryBreakdown = getMonthlyCategoryBreakdown as jest.MockedFunction<
  typeof getMonthlyCategoryBreakdown
>;

const FAMILY_UUID = "family-uuid-test";

const makeBreakdown = (
  year: number,
  month: number,
  items: Array<{ categoryUuid: string; name: string; icon: string; totalAmount: number; percentage: number }>
) => ({
  year,
  month,
  totalExpense: items.reduce((sum, i) => sum + i.totalAmount, 0),
  items,
});

describe("getCategoryBreakdownWithDelta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("이번 달만 있고 직전 달 없음 → deltaPercent: null, totalDelta: null", async () => {
    mockGetMonthlyCategoryBreakdown
      .mockResolvedValueOnce(
        makeBreakdown(2026, 5, [
          { categoryUuid: "cat-1", name: "식비", icon: "🍔", totalAmount: 100000, percentage: 100 },
        ]) as never
      )
      .mockResolvedValueOnce(makeBreakdown(2026, 4, []) as never); // 직전 달 빈 데이터

    const result = await getCategoryBreakdownWithDelta(FAMILY_UUID, 2026, 5);

    expect(result.year).toBe(2026);
    expect(result.month).toBe(5);
    expect(result.totalExpense).toBe(100000);
    expect(result.totalDelta).toBeNull();
    expect(result.items[0].deltaPercent).toBeNull();
  });

  it("양쪽 있음 → delta % 정확 계산", async () => {
    // 식비: 100000 → 150000 (+50%)
    // 교통: 50000 → 25000 (-50%)
    mockGetMonthlyCategoryBreakdown
      .mockResolvedValueOnce(
        makeBreakdown(2026, 5, [
          { categoryUuid: "cat-1", name: "식비", icon: "🍔", totalAmount: 150000, percentage: 86 },
          { categoryUuid: "cat-2", name: "교통", icon: "🚌", totalAmount: 25000, percentage: 14 },
        ]) as never
      )
      .mockResolvedValueOnce(
        makeBreakdown(2026, 4, [
          { categoryUuid: "cat-1", name: "식비", icon: "🍔", totalAmount: 100000, percentage: 67 },
          { categoryUuid: "cat-2", name: "교통", icon: "🚌", totalAmount: 50000, percentage: 33 },
        ]) as never
      );

    const result = await getCategoryBreakdownWithDelta(FAMILY_UUID, 2026, 5);

    const sikbi = result.items.find((i) => i.categoryUuid === "cat-1");
    const traffic = result.items.find((i) => i.categoryUuid === "cat-2");

    expect(sikbi?.deltaPercent).toBe(50); // +50%
    expect(traffic?.deltaPercent).toBe(-50); // -50%

    // totalDelta: 175000 vs 150000 → +17%
    expect(result.totalDelta).toBe(17);
  });

  it("직전 달에 없던 카테고리 신규 → deltaPercent: null", async () => {
    mockGetMonthlyCategoryBreakdown
      .mockResolvedValueOnce(
        makeBreakdown(2026, 5, [
          { categoryUuid: "cat-new", name: "구독", icon: "📱", totalAmount: 30000, percentage: 100 },
        ]) as never
      )
      .mockResolvedValueOnce(
        makeBreakdown(2026, 4, [
          { categoryUuid: "cat-1", name: "식비", icon: "🍔", totalAmount: 50000, percentage: 100 },
        ]) as never
      );

    const result = await getCategoryBreakdownWithDelta(FAMILY_UUID, 2026, 5);

    expect(result.items[0].categoryUuid).toBe("cat-new");
    expect(result.items[0].deltaPercent).toBeNull();
    // totalDelta: 30000 vs 50000 → -40%
    expect(result.totalDelta).toBe(-40);
  });

  it("직전 달 totalExpense = 0 → totalDelta: null", async () => {
    mockGetMonthlyCategoryBreakdown
      .mockResolvedValueOnce(makeBreakdown(2026, 5, [
        { categoryUuid: "cat-1", name: "식비", icon: "🍔", totalAmount: 50000, percentage: 100 },
      ]) as never)
      .mockResolvedValueOnce(makeBreakdown(2026, 4, []) as never);

    const result = await getCategoryBreakdownWithDelta(FAMILY_UUID, 2026, 5);

    expect(result.totalDelta).toBeNull();
  });

  it("이번 달 빈 데이터 → items: [], totalExpense: 0", async () => {
    mockGetMonthlyCategoryBreakdown
      .mockResolvedValueOnce(makeBreakdown(2026, 5, []) as never)
      .mockResolvedValueOnce(makeBreakdown(2026, 4, [
        { categoryUuid: "cat-1", name: "식비", icon: "🍔", totalAmount: 100000, percentage: 100 },
      ]) as never);

    const result = await getCategoryBreakdownWithDelta(FAMILY_UUID, 2026, 5);

    expect(result.totalExpense).toBe(0);
    expect(result.items).toEqual([]);
    // totalDelta: 0 vs 100000 — 0/100000 = 0% → -100%
    expect(result.totalDelta).toBe(-100);
  });
});
