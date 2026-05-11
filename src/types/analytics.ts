/**
 * Analytics 관련 타입
 */

export type AnalyticsPeriod = "m1" | "m3" | "m6" | "y1";

export interface MonthlyTrendPoint {
  year: number;
  month: number; // 1~12
  totalExpense: number;
}

export interface MonthlyTrend {
  period: AnalyticsPeriod;
  points: MonthlyTrendPoint[]; // 시간 asc 정렬
  average: number; // 기간 평균
}

export interface CategoryWithDelta {
  categoryUuid: string;
  name: string;
  icon: string;
  totalAmount: number;
  percentage: number;
  deltaPercent: number | null; // 전월 대비 %, null = 직전 달 데이터 없음
}

// `getCategoryBreakdownWithDelta` 의 반환 형태
export interface CategoryBreakdownWithDelta {
  year: number;
  month: number;
  totalExpense: number;
  totalDelta: number | null; // 전체 합계의 전월 대비 %, null = 직전 달 데이터 없음
  items: CategoryWithDelta[];
}
