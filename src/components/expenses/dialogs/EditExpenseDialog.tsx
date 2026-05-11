"use client";

import { updateExpenseAction } from "@/actions/expense/update-expense-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";
import { ExpenseFormFields } from "@/components/expenses/forms/ExpenseFormFields";
import type { UpdateExpenseFormState } from "@/types/expense";
import type { CategoryResponse } from "@/types/category";
import { toLocalDateInput } from "@/lib/utils/format";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: {
    uuid: string;
    amount: string;
    description?: string;
    date: Date | string;
    categoryUuid: string;
  };
  familyUuid: string;
  categories: CategoryResponse[];
  isLoadingCategories?: boolean;
}

const initialState: UpdateExpenseFormState = {
  message: "",
  errors: {},
  success: false,
};

export function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
  familyUuid,
  categories,
  isLoadingCategories = false,
}: EditExpenseDialogProps) {
  const [state, formAction] = useActionState(updateExpenseAction, initialState);
  const [amount, setAmount] = useState(Number(expense.amount));
  const [categoryUuid, setCategoryUuid] = useState<string | null>(expense.categoryUuid);
  const [date, setDate] = useState(toLocalDateInput(expense.date));
  const [description, setDescription] = useState(expense.description ?? "");

  useEffect(() => {
    if (state.success) {
      toast.success(state.message || "지출이 수정되었습니다");
      onOpenChange(false);
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>지출 수정</DialogTitle>
          <DialogDescription>지출 내역을 수정합니다</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="expenseUuid" value={expense.uuid} />
          <input type="hidden" name="familyUuid" value={familyUuid} />
          <ExpenseFormFields
            categories={categories}
            amount={amount}
            onAmountChange={setAmount}
            categoryUuid={categoryUuid}
            onCategoryChange={setCategoryUuid}
            date={date}
            onDateChange={setDate}
            description={description}
            onDescriptionChange={setDescription}
            isLoadingCategories={isLoadingCategories}
            errors={state.errors}
          />
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <SubmitButton className="flex-1" pendingText="수정 중...">
              수정하기
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
