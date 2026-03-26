"use client";

import { getDashboardStatsAction } from "@/app/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyDailyStatsAction } from "@/app/actions/dashboard/get-monthly-daily-stats-action";
import { getExpensesAction } from "@/app/actions/expense/get-expenses-action";
import type { DailyTransactionSummary } from "@/app/actions/dashboard/get-monthly-daily-stats-action";
import type { DashboardStats } from "@/types/dashboard";
import type { Expense } from "@/types/expense";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet, BarChart2, PieChart as PieIcon } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { startTransition, useState, useMemo } from "react";
import type { DailyBarChartData } from "./DailyBarChart";

const DailyBarChart = dynamic(
  () => import("./DailyBarChart").then((m) => m.DailyBarChart),
  { ssr: false }
);
const CategoryPieChart = dynamic(
  () => import("./CategoryPieChart").then((m) => m.CategoryPieChart),
  { ssr: false }
);

interface AnalyticsClientProps {
  initialYear: number;
  initialMonth: number;
  initialStats: DashboardStats | null;
  initialDailyStats: DailyTransactionSummary[];
  initialExpenses: Expense[];
  familyUuid: string;
}

interface CategoryStat {
  uuid: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR");
}

function formatShortAmount(amount: number) {
  if (amount >= 100_000_000) return `${(amount / 100_000_000).toFixed(1)}억`;
  if (amount >= 10_000) return `${Math.floor(amount / 10_000)}만`;
  return `${amount.toLocaleString()}`;
}

const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export function AnalyticsClient({
  initialYear,
  initialMonth,
  initialStats,
  initialDailyStats,
  initialExpenses,
  familyUuid,
}: AnalyticsClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [stats, setStats] = useState(initialStats);
  const [dailyStats, setDailyStats] = useState(initialDailyStats);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isPending, setIsPending] = useState(false);

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() + 1;
  }, [year, month]);

  const handleMonthChange = (direction: "prev" | "next") => {
    let newYear = year;
    let newMonth = month + (direction === "next" ? 1 : -1);

    if (newMonth === 0) { newMonth = 12; newYear -= 1; }
    if (newMonth === 13) { newMonth = 1; newYear += 1; }

    // 미래 이동 차단
    const now = new Date();
    if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth > now.getMonth() + 1)) return;

    setIsPending(true);
    startTransition(async () => {
      const start = `${newYear}-${String(newMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(newYear, newMonth, 0).getDate();
      const end = `${newYear}-${String(newMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const now = new Date();
      const isNewCurrentMonth = newYear === now.getFullYear() && newMonth === now.getMonth() + 1;

      try {
        const [daily, exps, dashboardStats] = await Promise.all([
          getMonthlyDailyStatsAction(newYear, newMonth),
          getExpensesAction({ familyId: familyUuid, startDate: start, endDate: end, limit: 1000 }),
          isNewCurrentMonth ? getDashboardStatsAction() : Promise.resolve(null),
        ]);

        setYear(newYear);
        setMonth(newMonth);
        setDailyStats(daily.success ? daily.data : []);
        setExpenses(exps.success ? exps.data.items : []);
        if (isNewCurrentMonth) {
          setStats(dashboardStats && dashboardStats.success ? dashboardStats.data : null);
        } else {
          setStats(null);
        }
      } catch {
        toast.error("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsPending(false);
      }
    });
  };

  // 일별 차트 데이터 (월의 모든 날짜 채우기)
  const barChartData = useMemo<DailyBarChartData[]>(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const found = dailyStats.find((d) => d.date === dateStr);
      return { day, 지출: found?.expense ?? 0, 수입: found?.income ?? 0 };
    });
  }, [year, month, dailyStats]);

  // 카테고리별 집계
  const categoryStats: CategoryStat[] = useMemo(() => {
    const map = new Map<string, CategoryStat>();
    for (const expense of expenses) {
      const amount = Number(expense.amount);
      const cat = expense.category;
      const existing = map.get(cat.uuid);
      if (existing) {
        existing.total += amount;
        existing.count += 1;
      } else {
        map.set(cat.uuid, {
          uuid: cat.uuid,
          name: cat.name,
          icon: cat.icon ?? "💸",
          color: cat.color ?? "#6366f1",
          total: amount,
          count: 1,
          percentage: 0,
        });
      }
    }
    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const total = list.reduce((s, c) => s + c.total, 0);
    list.forEach((c) => { c.percentage = total > 0 ? (c.total / total) * 100 : 0; });
    return list;
  }, [expenses]);

  const totalExpense = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount), 0),
    [expenses]
  );
  const totalIncome = useMemo(
    () => dailyStats.reduce((s, d) => s + d.income, 0),
    [dailyStats]
  );

  // 지출 TOP 5
  const topExpenses = useMemo(
    () => [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5),
    [expenses]
  );

  const budget = isCurrentMonth ? (stats?.budget ?? 0) : 0;
  const remainingBudget = isCurrentMonth ? (stats?.remainingBudget ?? 0) : 0;

  const now = new Date();
  const isNextDisabled =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1);

  return (
    <div className={`space-y-4 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* 헤더: 월 선택기 */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">분석</h1>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm px-1 py-1">
          <button
            onClick={() => handleMonthChange("prev")}
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-[72px] text-center">
            {year}년 {MONTH_NAMES[month - 1]}
          </span>
          <button
            onClick={() => handleMonthChange("next")}
            disabled={isNextDisabled}
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 요약 카드 3개 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="gradient-expense rounded-2xl p-3 text-white">
          <div className="flex items-center gap-1 mb-2 opacity-80">
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">지출</span>
          </div>
          <p className="text-base font-bold leading-tight">
            ₩{formatShortAmount(totalExpense)}
          </p>
        </div>
        <div className="gradient-income rounded-2xl p-3 text-white">
          <div className="flex items-center gap-1 mb-2 opacity-80">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">수입</span>
          </div>
          <p className="text-base font-bold leading-tight">
            ₩{formatShortAmount(totalIncome)}
          </p>
        </div>
        <div className="gradient-budget rounded-2xl p-3 text-white">
          <div className="flex items-center gap-1 mb-2 opacity-80">
            <Wallet className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">{isCurrentMonth ? "잔여예산" : "예산"}</span>
          </div>
          <p className="text-base font-bold leading-tight">
            {isCurrentMonth && budget > 0
              ? `₩${formatShortAmount(remainingBudget)}`
              : <span className="text-sm opacity-70">-</span>}
          </p>
        </div>
      </div>

      {/* 일별 지출/수입 추이 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-700">일별 추이</h2>
          <div className="ml-auto flex items-center gap-3 text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--chart-expense)" }} />지출</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--chart-income)" }} />수입</span>
          </div>
        </div>
        {totalExpense === 0 && totalIncome === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-300 text-sm">
            이 달의 데이터가 없습니다
          </div>
        ) : (
          <DailyBarChart data={barChartData} />
        )}
      </div>

      {/* 카테고리별 지출 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <PieIcon className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-bold text-gray-700">카테고리별 지출</h2>
          {totalExpense > 0 && (
            <span className="ml-auto text-xs text-gray-400 font-medium">
              총 ₩{formatAmount(totalExpense)}
            </span>
          )}
        </div>

        {categoryStats.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-gray-300 text-sm">
            지출 내역이 없습니다
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            {/* 도넛 차트 */}
            <div className="shrink-0 mx-auto">
              <CategoryPieChart data={categoryStats} />
            </div>

            {/* 카테고리 리스트 */}
            <div className="flex-1 space-y-2 min-w-0">
              {categoryStats.map((cat) => (
                <div key={cat.uuid} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs text-gray-500 shrink-0">{cat.icon}</span>
                  <span className="text-xs font-medium text-gray-700 truncate flex-1">{cat.name}</span>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-gray-800">₩{formatAmount(cat.total)}</p>
                    <p className="text-[10px] text-gray-400">{cat.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 지출 TOP 5 */}
      {topExpenses.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
          <h2 className="text-sm font-bold text-gray-700 mb-3">지출 TOP 5</h2>
          <div className="space-y-2.5">
            {topExpenses.map((expense, idx) => (
              <div key={expense.uuid} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-400 flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                  style={{ backgroundColor: `${expense.category.color}20` }}
                >
                  {expense.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {expense.description || expense.category.name}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {expense.description ? `${expense.category.name} · ` : ""}
                    {expense.date.split("T")[0]}
                  </p>
                </div>
                <p className="text-sm font-bold text-rose-500 shrink-0">
                  -₩{formatAmount(Number(expense.amount))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
