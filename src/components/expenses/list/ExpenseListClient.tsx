/**
 * 지출 목록 클라이언트 컴포넌트
 * 수정/삭제 다이얼로그 상태 관리 + 날짜별 그룹핑
 */

"use client";

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import type { CategoryResponse } from "@/types/category";
import type { Expense, ExpenseItemData } from "@/types/expense";
import { groupByDate } from "@/lib/utils/group-by-date";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeleteExpenseDialog } from "../dialogs/DeleteExpenseDialog";
import { EditExpenseDialog } from "../dialogs/EditExpenseDialog";
import { ExpenseItem } from "./ExpenseItem";

interface ExpenseListClientProps {
  expenses: Expense[];
  categories: CategoryResponse[];
  familyUuid: string;
}

export function ExpenseListClient({
  expenses,
  categories: initialCategories,
  familyUuid,
}: ExpenseListClientProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>(initialCategories);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    if (editingExpense && categories.length === 0) {
      loadCategories();
    }
  }, [editingExpense, categories]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const result = await getFamilyCategoriesAction();
      if (result.success) {
        setCategories(result.data);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("카테고리를 불러오는데 실패했습니다");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const categoryMap = new Map(categories.map((cat) => [cat.uuid, cat]));

  // 날짜별 그룹핑
  const groups = groupByDate(expenses);

  return (
    <>
      <div className="space-y-5">
        {groups.map(({ dateKey, label, items }) => {
          const groupTotal = items.reduce((sum, e) => sum + Number(e.amount), 0);

          return (
            <div key={dateKey}>
              {/* 날짜 헤더 */}
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {label}
                </span>
                <span className="text-xs font-semibold text-expense">
                  -₩{groupTotal.toLocaleString()}
                </span>
              </div>

              {/* 해당 날짜의 지출 목록 */}
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
                {items.map((expense) => {
                  const category = categoryMap.get(expense.categoryUuid);
                  const expenseData: ExpenseItemData = {
                    uuid: expense.uuid,
                    amount: expense.amount,
                    description: expense.description,
                    date: expense.date,
                    categoryUuid: expense.categoryUuid,
                    categoryName: category?.name || expense.category?.name || "기타",
                    categoryColor: category?.color || expense.category?.color || "#6366f1",
                    categoryIcon: category?.icon || expense.category?.icon || "💸",
                  };
                  return (
                    <ExpenseItem
                      key={expense.uuid}
                      expense={expenseData}
                      onEdit={() => setEditingExpense(expense)}
                      onDelete={() => setDeletingExpense(expense)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {editingExpense && (
        <EditExpenseDialog
          key={editingExpense.uuid}
          open={!!editingExpense}
          onOpenChange={(open) => {
            if (!open) setEditingExpense(null);
          }}
          expense={{
            uuid: editingExpense.uuid,
            amount: String(editingExpense.amount),
            description: editingExpense.description || undefined,
            date: editingExpense.date,
            categoryUuid: editingExpense.categoryUuid,
          }}
          familyUuid={familyUuid}
          categories={categories}
          isLoadingCategories={isLoadingCategories}
        />
      )}

      {deletingExpense && (
        <DeleteExpenseDialog
          open={!!deletingExpense}
          onOpenChange={(open) => {
            if (!open) setDeletingExpense(null);
          }}
          familyUuid={familyUuid}
          expenseUuid={deletingExpense.uuid}
          expenseDescription={deletingExpense.description || undefined}
          onDeleted={() => {
            setDeletingExpense(null);
          }}
        />
      )}
    </>
  );
}
