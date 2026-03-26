/**
 * Budget Page - Server Component
 * 예산 관리 전용 페이지
 */

import { getDashboardStatsAction } from "@/app/actions/dashboard/get-dashboard-stats-action";
import { BudgetClient } from "@/app/(authenticated)/budget/_components/BudgetClient";
import { getActionDataOrDefault } from "@/lib/server/action-result-handler";
import { auth } from "@/lib/server/auth";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
import { redirect } from "next/navigation";

export default async function BudgetPage() {
  const session = await auth();
  if (!session) {
    redirect("/auth/signin");
  }

  const selectedFamilyUuid = await getSelectedFamilyUuid();
  if (!selectedFamilyUuid) {
    redirect("/");
  }

  const statsResult = await getDashboardStatsAction();
  const stats = getActionDataOrDefault(statsResult, {
    monthlyExpense: 0,
    monthlyIncome: 0,
    remainingBudget: 0,
    familyMembers: 0,
    budget: 0,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  return (
    <BudgetClient
      budget={stats.budget}
      monthlyExpense={stats.monthlyExpense}
      remainingBudget={stats.remainingBudget}
      year={stats.year}
      month={stats.month}
    />
  );
}
