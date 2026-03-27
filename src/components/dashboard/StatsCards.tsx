"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface StatsData {
  monthlyExpense: number;
  monthlyIncome: number;
  remainingBudget: number;
  familyMembers: number;
  budget: number;
}

interface StatsCardsProps {
  data: StatsData;
}

export function StatsCards({ data }: StatsCardsProps) {
  const router = useRouter();
  // 예산 대비 지출 비율 계산
  const expenseRatio =
    data.budget > 0 ? (data.monthlyExpense / data.budget) * 100 : 0;
  const budgetUsagePercent = Math.min(Math.round(expenseRatio), 100);

  // 남은 예산 비율 계산
  const remainingRatio =
    data.budget > 0 ? (data.remainingBudget / data.budget) * 100 : 100;
  const remainingPercent = Math.max(Math.round(remainingRatio), 0);

  // 예산 초과 여부
  const isBudgetExceeded = data.remainingBudget < 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
      {/* Monthly Expense Card */}
      <Card
        className="relative overflow-hidden gradient-expense text-white border-0 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={() => router.push("/transactions?tab=expenses")}
      >
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-3 bg-white/20 rounded-lg md:rounded-2xl backdrop-blur-sm">
              <TrendingUp className="w-3.5 h-3.5 md:w-6 md:h-6" />
            </div>
            <ArrowUpRight className="w-3 h-3 md:w-5 md:h-5 gradient-card-sublabel" />
          </div>
          <div>
            <p className="gradient-card-label text-[10px] md:text-sm font-medium mb-0.5 md:mb-1">
              이번 달 지출
            </p>
            <p className="text-base md:text-3xl font-bold mb-1 md:mb-2">
              ₩{data.monthlyExpense.toLocaleString()}
            </p>
            <div className="flex items-center space-x-1 md:space-x-2">
              <Progress
                value={budgetUsagePercent}
                className="flex-1 h-1 md:h-2 bg-white/20"
              />
              <span className="text-[9px] md:text-xs gradient-card-sublabel">
                {budgetUsagePercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Income Card */}
      <Card
        className="relative overflow-hidden gradient-income text-white border-0 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={() => router.push("/transactions?tab=incomes")}
      >
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-3 bg-white/20 rounded-lg md:rounded-2xl backdrop-blur-sm">
              <TrendingUp className="w-3.5 h-3.5 md:w-6 md:h-6" />
            </div>
            <ArrowUpRight className="w-3 h-3 md:w-5 md:h-5 gradient-card-sublabel" />
          </div>
          <div>
            <p className="gradient-card-label text-[10px] md:text-sm font-medium mb-0.5 md:mb-1">
              이번 달 수입
            </p>
            <p className="text-base md:text-3xl font-bold mb-1 md:mb-2">
              ₩{data.monthlyIncome.toLocaleString()}
            </p>
            <p className="text-[9px] md:text-xs gradient-card-sublabel">
              순수익: ₩
              {(data.monthlyIncome - data.monthlyExpense).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Budget Card */}
      <Card
        className={`relative overflow-hidden ${
          isBudgetExceeded ? "gradient-expense" : "gradient-budget"
        } text-white border-0 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95`}
        onClick={() => router.push("/settings")}
      >
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-3 bg-white/20 rounded-lg md:rounded-2xl backdrop-blur-sm">
              <PiggyBank className="w-3.5 h-3.5 md:w-6 md:h-6" />
            </div>
            {isBudgetExceeded ? (
              <Badge className="bg-white/20 text-white border-0 text-[9px] md:text-xs px-1.5 py-0.5">
                초과
              </Badge>
            ) : (
              <ArrowDownRight className="w-3 h-3 md:w-5 md:h-5 gradient-card-sublabel" />
            )}
          </div>
          <div>
            <p className="gradient-card-label text-[10px] md:text-sm font-medium mb-0.5 md:mb-1">
              {isBudgetExceeded ? "예산 초과" : "예산 남은 금액"}
            </p>
            <p className="text-base md:text-3xl font-bold mb-1 md:mb-2">
              ₩
              {isBudgetExceeded
                ? Math.abs(data.remainingBudget).toLocaleString()
                : data.remainingBudget.toLocaleString()}
            </p>
            {data.budget > 0 ? (
              <div className="flex items-center space-x-1 md:space-x-2">
                <Progress
                  value={isBudgetExceeded ? 100 : remainingPercent}
                  className="flex-1 h-1 md:h-2 bg-white/20"
                />
                <span className="text-[9px] md:text-xs gradient-card-sublabel">
                  {isBudgetExceeded ? 0 : remainingPercent}%
                </span>
              </div>
            ) : (
              <p className="text-[9px] md:text-xs gradient-card-sublabel">
                예산 미설정
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Family Members Card */}
      <Card
        className="relative overflow-hidden gradient-family text-white border-0 shadow-lg cursor-pointer transition-transform hover:scale-105 active:scale-95"
        onClick={() => router.push("/settings")}
      >
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <div className="p-1.5 md:p-3 bg-white/20 rounded-lg md:rounded-2xl backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 md:w-6 md:h-6" />
            </div>
            <Badge className="bg-white/20 text-white border-0 text-[9px] md:text-xs px-1.5 py-0.5">
              활성
            </Badge>
          </div>
          <div>
            <p className="gradient-card-label text-[10px] md:text-sm font-medium mb-0.5 md:mb-1">
              가족 구성원
            </p>
            <p className="text-base md:text-3xl font-bold mb-1 md:mb-2">
              {data.familyMembers}명
            </p>
            <p className="text-[9px] md:text-xs gradient-card-sublabel">함께 관리 중</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
