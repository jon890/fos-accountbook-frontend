"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/client/utils";
import { AlertTriangle, PiggyBank, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

interface BudgetClientProps {
  budget: number;
  monthlyExpense: number;
  remainingBudget: number;
  year: number;
  month: number;
}

export function BudgetClient({
  budget,
  monthlyExpense,
  remainingBudget,
  year,
  month,
}: BudgetClientProps) {
  const router = useRouter();

  const isBudgetExceeded = remainingBudget < 0;
  const hasBudget = budget > 0;

  const usagePercent = hasBudget
    ? Math.min(Math.round((monthlyExpense / budget) * 100), 100)
    : 0;

  const remainingPercent = hasBudget
    ? Math.max(Math.round((remainingBudget / budget) * 100), 0)
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            예산 관리
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {year}년 {month}월
          </p>
        </div>
        <div className="p-3 gradient-budget rounded-xl shadow-md">
          <PiggyBank className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>

      {/* 예산 미설정 빈 상태 */}
      {!hasBudget && (
        <Card className="border-dashed border-2 border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <PiggyBank className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              예산이 설정되지 않았습니다
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              월별 예산을 설정하면 지출을 효과적으로 관리할 수 있어요
            </p>
            <Button
              variant="default"
              onClick={() => router.push("/settings")}
              className="gradient-budget text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              <Settings className="w-4 h-4" />
              예산 설정하기
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 예산 현황 카드 */}
      {hasBudget && (
        <Card
          className={cn(
            "relative overflow-hidden text-white border-0 shadow-lg",
            isBudgetExceeded ? "gradient-expense" : "gradient-budget"
          )}
        >
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <p
                className={cn(
                  "text-sm font-medium",
                  isBudgetExceeded ? "text-rose-100" : "text-amber-100"
                )}
              >
                {isBudgetExceeded ? "예산 초과" : "예산 남은 금액"}
              </p>
              {isBudgetExceeded && (
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  초과
                </Badge>
              )}
            </div>

            <p className="text-3xl md:text-4xl font-bold mb-1">
              ₩
              {isBudgetExceeded
                ? Math.abs(remainingBudget).toLocaleString()
                : remainingBudget.toLocaleString()}
            </p>
            <p
              className={cn(
                "text-xs mb-4",
                isBudgetExceeded ? "text-rose-200" : "text-amber-200"
              )}
            >
              총 예산 ₩{budget.toLocaleString()}
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className={isBudgetExceeded ? "text-rose-200" : "text-amber-200"}>
                  사용률
                </span>
                <span className={isBudgetExceeded ? "text-rose-200" : "text-amber-200"}>
                  {usagePercent}%
                </span>
              </div>
              <Progress
                value={isBudgetExceeded ? 100 : usagePercent}
                className="h-2 bg-white/20"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 세부 내역 */}
      {hasBudget && (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {/* 이번 달 지출 */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                이번 달 지출
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-lg md:text-xl font-bold text-foreground">
                ₩{monthlyExpense.toLocaleString()}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>예산 대비</span>
                  <span>{usagePercent}%</span>
                </div>
                <Progress value={usagePercent} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          {/* 남은 예산 */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-1 p-4">
              <CardTitle className="text-xs text-muted-foreground font-medium">
                {isBudgetExceeded ? "초과 금액" : "남은 예산"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p
                className={cn(
                  "text-lg md:text-xl font-bold",
                  isBudgetExceeded ? "text-destructive" : "text-foreground"
                )}
              >
                ₩
                {isBudgetExceeded
                  ? Math.abs(remainingBudget).toLocaleString()
                  : remainingBudget.toLocaleString()}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>남은 비율</span>
                  <span>{isBudgetExceeded ? 0 : remainingPercent}%</span>
                </div>
                <Progress
                  value={isBudgetExceeded ? 0 : remainingPercent}
                  className="h-1.5"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 예산 설정 링크 */}
      {hasBudget && (
        <Button
          variant="outline"
          onClick={() => router.push("/settings")}
          className="w-full rounded-xl text-muted-foreground"
        >
          <Settings className="w-4 h-4" />
          예산 수정하기
        </Button>
      )}
    </div>
  );
}
