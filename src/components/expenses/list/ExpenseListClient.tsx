"use client";

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { DateGroupSection } from "@/components/transactions/DateGroupSection";
import { groupTransactionsWithTotal } from "@/services/transaction/transaction-service";
import type { CategoryResponse } from "@/types/category";
import type { Expense } from "@/types/expense";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeleteExpenseDialog } from "../dialogs/DeleteExpenseDialog";
import { EditExpenseDialog } from "../dialogs/EditExpenseDialog";
import { ExpenseItem } from "./ExpenseItem";
import type { ExpenseItemData } from "@/types/expense";

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
  const groups = groupTransactionsWithTotal(expenses);

  return (
    <>
      <div className="space-y-5">
        {groups.map((group) => (
          <DateGroupSection
            key={group.dateKey}
            group={group}
            renderItem={(expense) => {
              const cat = categoryMap.get(expense.categoryUuid);
              const expenseData: ExpenseItemData = {
                uuid: expense.uuid,
                amount: expense.amount,
                description: expense.description,
                date: expense.date,
                categoryUuid: expense.categoryUuid,
                categoryName: cat?.name || expense.category?.name || "기타",
                categoryColor: cat?.color || expense.category?.color,
                categoryIcon: cat?.icon || expense.category?.icon || "💸",
              };
              return (
                <ExpenseItem
                  key={expense.uuid}
                  expense={expenseData}
                  onEdit={() => setEditingExpense(expense)}
                  onDelete={() => setDeletingExpense(expense)}
                />
              );
            }}
          />
        ))}
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
