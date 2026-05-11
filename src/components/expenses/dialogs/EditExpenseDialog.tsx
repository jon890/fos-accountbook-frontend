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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SubmitButton } from "@/components/ui/submit-button";
import { ExpenseFormFields } from "@/components/expenses/forms/ExpenseFormFields";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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

const initialState: UpdateExpenseFormState = { message: "", errors: {}, success: false };

export function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
  familyUuid,
  categories,
  isLoadingCategories = false,
}: EditExpenseDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // open && <Body /> — useState + useActionState 자동 reset.
  // 같은 row 반복 수정 시 toast / error 잔재 회피.
  const body = open ? (
    <EditExpenseDialogBody
      expense={expense}
      familyUuid={familyUuid}
      categories={categories}
      isLoadingCategories={isLoadingCategories}
      onOpenChange={onOpenChange}
    />
  ) : null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[720px] bg-bg-elev">
          <DialogHeader>
            <DialogTitle>지출 수정</DialogTitle>
            <DialogDescription>지출 내역을 수정합니다</DialogDescription>
          </DialogHeader>
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 bg-bg-elev">
        <SheetHeader className="px-5 py-3 border-b border-border">
          <SheetTitle>지출 수정</SheetTitle>
        </SheetHeader>
        <div className="px-5 py-4 overflow-y-auto h-[calc(100dvh-56px)]">{body}</div>
      </SheetContent>
    </Sheet>
  );
}

interface EditExpenseDialogBodyProps {
  expense: EditExpenseDialogProps["expense"];
  familyUuid: string;
  categories: CategoryResponse[];
  isLoadingCategories: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditExpenseDialogBody({
  expense,
  familyUuid,
  categories,
  isLoadingCategories,
  onOpenChange,
}: EditExpenseDialogBodyProps) {
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
  );
}
