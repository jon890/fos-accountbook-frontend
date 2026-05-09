/**
 * Dashboard Page - Server Component
 * 대시보드 전용 페이지
 *
 * 역할:
 * - 선택된 가족의 대시보드 데이터 표시
 * - 통계, 최근 지출 등 렌더링
 */

import { getDashboardStatsAction } from "@/actions/dashboard/get-dashboard-stats-action";
import { getMonthlyCategoryBreakdownAction } from "@/actions/dashboard/get-monthly-category-breakdown-action";
import { getRecentExpensesAction } from "@/actions/dashboard/get-recent-expenses-action";
import { getFamiliesAction } from "@/actions/family/get-families-action";
import { getRecurringExpensesTotalAction } from "@/actions/recurring-expense";
import { BudgetHeroCard } from "@/components/dashboard/BudgetHeroCard";
import { CategoryDistribution } from "@/components/dashboard/CategoryDistribution";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { IncomeExpenseStats } from "@/components/dashboard/IncomeExpenseStats";
import { RecurringExpenseCard } from "@/components/dashboard/RecurringExpenseCard";
import { getActionDataOrDefault } from "@/lib/server/action-result-handler";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const selectedFamilyUuid = await getSelectedFamilyUuid();
  if (!selectedFamilyUuid) {
    redirect("/");
  }

  const [statsResult, recentExpensesResult, familiesResult, recurringTotalResult, categoryBreakdownResult] = await Promise.all(
    [
      getDashboardStatsAction(),
      getRecentExpensesAction(10),
      getFamiliesAction(),
      getRecurringExpensesTotalAction(),
      getMonthlyCategoryBreakdownAction(),
    ],
  );

  const statsData = getActionDataOrDefault(statsResult, {
    monthlyExpense: 0,
    monthlyIncome: 0,
    remainingBudget: 0,
    familyMembers: 0,
    budget: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const recentExpenses = getActionDataOrDefault(recentExpensesResult, []);

  const families = getActionDataOrDefault(familiesResult, []);

  const recurringTotal = getActionDataOrDefault(recurringTotalResult, null);

  const categoryBreakdown = getActionDataOrDefault(categoryBreakdownResult, {
    year: statsData.year,
    month: statsData.month,
    totalExpense: 0,
    items: [],
  });

  const selectedFamily =
    families.find((f) => f.uuid === selectedFamilyUuid) || null;

  const members =
    selectedFamily?.members?.map((m) => ({
      uuid: m.uuid,
      name: m.userName ?? m.userEmail ?? "멤버",
      avatarUrl: m.userImage,
    })) ?? [];

  const now = new Date();
  const lastDayOfMonth = new Date(
    statsData.year,
    statsData.month,
    0
  ).getDate();
  const daysRemaining = Math.max(0, lastDayOfMonth - now.getDate());

  return (
    <DashboardClient recentExpenses={recentExpenses}>
      <DashboardHeader
        familyName={selectedFamily?.name ?? null}
        members={members}
        year={statsData.year}
        month={statsData.month}
      />
      <BudgetHeroCard
        remainingBudget={statsData.remainingBudget}
        monthlyExpense={statsData.monthlyExpense}
        budget={statsData.budget}
        daysRemaining={daysRemaining}
      />
      <IncomeExpenseStats
        monthlyIncome={statsData.monthlyIncome}
        monthlyExpense={statsData.monthlyExpense}
      />
      <CategoryDistribution breakdown={categoryBreakdown} />
      {recurringTotal !== null && (
        <RecurringExpenseCard total={recurringTotal} />
      )}
      <div className="my-6">
        <CalendarView />
      </div>
    </DashboardClient>
  );
}
