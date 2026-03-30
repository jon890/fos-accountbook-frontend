"use client";

import { ExpenseFilters } from "@/components/expenses/forms/ExpenseFilters";
import { ExpenseTabContent } from "@/app/(authenticated)/transactions/_components/ExpenseTabContent";
import { IncomeTabContent } from "@/app/(authenticated)/transactions/_components/IncomeTabContent";
import { cn } from "@/lib/client/utils";
import type { CategoryResponse } from "@/types/category";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactNode } from "react";

interface TransactionsPageClientProps {
  familyUuid: string;
  categories: CategoryResponse[];
  activeTab: "expenses" | "incomes";
  searchParams: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    limit?: string;
  };
  expenseListContent: ReactNode;
  incomeListContent: ReactNode;
}

export function TransactionsPageClient({
  familyUuid,
  categories,
  activeTab,
  searchParams,
  expenseListContent,
  incomeListContent,
}: TransactionsPageClientProps) {
  const router = useRouter();
  const currentSearchParams = useSearchParams();

  const handleTabChange = (tab: "expenses" | "incomes") => {
    const params = new URLSearchParams(currentSearchParams.toString());
    params.set("tab", tab);
    params.set("page", "1");
    router.push(`/transactions?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* 탭 + 추가 버튼 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => handleTabChange("expenses")}
            className={cn(
              "flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              activeTab === "expenses"
                ? "gradient-expense text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            )}
          >
            <TrendingDown className="w-4 h-4" />
            <span>지출</span>
          </button>
          <button
            onClick={() => handleTabChange("incomes")}
            className={cn(
              "flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
              activeTab === "incomes"
                ? "gradient-income text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span>수입</span>
          </button>
        </div>

        <div className="shrink-0">
          {activeTab === "expenses" ? (
            <ExpenseTabContent categories={categories} familyUuid={familyUuid} />
          ) : (
            <IncomeTabContent />
          )}
        </div>
      </div>

      {/* 필터 바 */}
      <ExpenseFilters
        categories={categories}
        defaultStartDate={searchParams.startDate}
        defaultEndDate={searchParams.endDate}
      />

      {/* 내역 목록 */}
      <div>
        {activeTab === "expenses" ? expenseListContent : incomeListContent}
      </div>
    </div>
  );
}
