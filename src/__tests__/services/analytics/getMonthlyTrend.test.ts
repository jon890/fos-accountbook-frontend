/**
 * getMonthlyTrend service 단위 테스트
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

import { getMonthlyTrend } from "@/services/analytics/analytics-service";
import { getMonthlyCategoryBreakdown } from "@/services/dashboard/dashboard-service";

jest.mock("@/services/dashboard/dashboard-service");

const mockGetMonthlyCategoryBreakdown = getMonthlyCategoryBreakdown as jest.MockedFunction<
  typeof getMonthlyCategoryBreakdown
>;

const FAMILY_UUID = "family-uuid-test";

function makeMockBreakdown(year: number, month: number, totalExpense: number) {
  return {
    year,
    month,
    totalExpense,
    items: [],
  };
}

describe("getMonthlyTrend", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("m1 — 1개 포인트 반환, 평균 = totalExpense", async () => {
    mockGetMonthlyCategoryBreakdown.mockResolvedValue(
      makeMockBreakdown(2026, 5, 300000) as never
    );

    const result = await getMonthlyTrend(FAMILY_UUID, "m1", 2026, 5);

    expect(result.period).toBe("m1");
    expect(result.points).toHaveLength(1);
    expect(result.points[0]).toEqual({ year: 2026, month: 5, totalExpense: 300000 });
    expect(result.average).toBe(300000);
  });

  it("m3 — 3개 포인트 asc 정렬", async () => {
    mockGetMonthlyCategoryBreakdown
      .mockResolvedValueOnce(makeMockBreakdown(2026, 3, 100000) as never)
      .mockResolvedValueOnce(makeMockBreakdown(2026, 4, 200000) as never)
      .mockResolvedValueOnce(makeMockBreakdown(2026, 5, 300000) as never);

    const result = await getMonthlyTrend(FAMILY_UUID, "m3", 2026, 5);

    expect(result.period).toBe("m3");
    expect(result.points).toHaveLength(3);
    expect(result.points[0]).toMatchObject({ year: 2026, month: 3 });
    expect(result.points[2]).toMatchObject({ year: 2026, month: 5 });
    expect(result.average).toBe(200000); // (100000+200000+300000)/3
  });

  it("m6 — 6개 포인트 반환", async () => {
    mockGetMonthlyCategoryBreakdown.mockResolvedValue(
      makeMockBreakdown(2026, 1, 100000) as never
    );

    const result = await getMonthlyTrend(FAMILY_UUID, "m6", 2026, 6);

    expect(result.points).toHaveLength(6);
  });

  it("y1 — 12개 포인트 반환", async () => {
    mockGetMonthlyCategoryBreakdown.mockResolvedValue(
      makeMockBreakdown(2026, 1, 50000) as never
    );

    const result = await getMonthlyTrend(FAMILY_UUID, "y1", 2026, 12);

    expect(result.points).toHaveLength(12);
  });

  it("빈 월 (totalExpense=0) 처리 — 평균 계산 포함", async () => {
    mockGetMonthlyCategoryBreakdown
      .mockResolvedValueOnce(makeMockBreakdown(2026, 4, 0) as never)
      .mockResolvedValueOnce(makeMockBreakdown(2026, 5, 0) as never)
      .mockResolvedValueOnce(makeMockBreakdown(2026, 6, 300000) as never);

    const result = await getMonthlyTrend(FAMILY_UUID, "m3", 2026, 6);

    expect(result.points[0].totalExpense).toBe(0);
    expect(result.average).toBe(100000); // (0+0+300000)/3
  });

  it("연도 경계 — 1월 기준 m3 이전 달이 전년 12월, 11월", async () => {
    mockGetMonthlyCategoryBreakdown
      .mockResolvedValueOnce(makeMockBreakdown(2025, 11, 100000) as never)
      .mockResolvedValueOnce(makeMockBreakdown(2025, 12, 200000) as never)
      .mockResolvedValueOnce(makeMockBreakdown(2026, 1, 300000) as never);

    const result = await getMonthlyTrend(FAMILY_UUID, "m3", 2026, 1);

    expect(result.points[0]).toMatchObject({ year: 2025, month: 11 });
    expect(result.points[1]).toMatchObject({ year: 2025, month: 12 });
    expect(result.points[2]).toMatchObject({ year: 2026, month: 1 });
  });
});
