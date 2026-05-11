"use client";

import { Button } from "@/components/ui/button";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import type { RecentExpense } from "@/types/dashboard";
import { Wallet, Plus } from "lucide-react";
import Link from "next/link";

interface RecentActivityProps {
  expenses: RecentExpense[];
}

export function RecentActivity({ expenses }: RecentActivityProps) {
  const hasExpenses = expenses.length > 0;

  return (
    <div className="bg-bg-elev rounded-[var(--radius-xl)] shadow-[var(--shadow-default)] mb-4 md:mb-6">
      <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-5 pb-3">
        <h3 className="text-sm md:text-base font-semibold text-fg">최근 활동</h3>
        <span className="text-xs text-fg-muted">{expenses.length}건</span>
      </div>

      <div className="px-4 md:px-6 pb-4 md:pb-5">
        {!hasExpenses ? (
          <div className="text-center py-8">
            <div className="size-14 bg-bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="size-7 text-fg-subtle" />
            </div>
            <p className="text-sm font-semibold text-fg mb-1">
              아직 지출 내역이 없습니다
            </p>
            <p className="text-xs text-fg-muted mb-4">첫 번째 지출을 추가해보세요!</p>
            <Link href="/expenses">
              <Button className="gradient-primary text-white rounded-xl text-sm px-6 hover:opacity-90">
                <Plus className="size-4 mr-1.5" />
                첫 지출 추가하기
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--color-border)]">
              {expenses.map((expense) => (
                <TransactionRow
                  key={expense.uuid}
                  variant="compact"
                  tx={{
                    uuid: expense.uuid,
                    amount: Number(expense.amount),
                    description: expense.description,
                    date: expense.date,
                    category: expense.category,
                    createdBy: expense.createdBy ?? null,
                  }}
                />
              ))}
            </div>
            {expenses.length >= 10 && (
              <div className="pt-3">
                <Link href="/expenses">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-sm border-[var(--color-border)]"
                  >
                    모든 지출 내역 보기
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
