"use client";

import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import { createExpenseAction } from "@/actions/expense/create-expense-action";
import { createIncomeAction } from "@/actions/income/create-income-action";
import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { toLocalDateInput } from "@/lib/utils/format";
import type { CreateExpenseFormState } from "@/types/expense";
import type { CreateIncomeFormState } from "@/types/income";
import type { CategoryResponse } from "@/types/category";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type TransactionType = "expense" | "income";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
}

const initialExpenseState: CreateExpenseFormState = { message: "", errors: {}, success: false };
const initialIncomeState: CreateIncomeFormState = { message: "", errors: {}, success: false };

export function AddExpenseDialog({
  open,
  onOpenChange,
  defaultType = "expense",
}: AddExpenseDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [activeTypeDraft, setActiveTypeDraft] = useState<TransactionType | null>(null);
  const activeType = activeTypeDraft ?? defaultType;
  const setActiveType = setActiveTypeDraft;
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [familyUuid, setFamilyUuid] = useState<string>("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const [amount, setAmount] = useState(0);
  const [categoryUuid, setCategoryUuid] = useState<string | null>(null);
  const [date, setDate] = useState(toLocalDateInput());
  const [description, setDescription] = useState("");

  const [expenseState, expenseFormAction] = useActionState(createExpenseAction, initialExpenseState);
  const [incomeState, incomeFormAction] = useActionState(createIncomeAction, initialIncomeState);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // open 진입 시점에 fetch 시작 신호 — derived value 로 대체 불가 (fetch 실패 시 영원히 loading)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingCategories(true);
    getFamilyCategoriesAction()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setCategories(result.data);
          if (result.data.length > 0) setFamilyUuid(result.data[0].familyUuid);
        } else {
          toast.error(result.error.message);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("카테고리를 불러오는데 실패했습니다");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (expenseState.success) {
      toast.success(expenseState.message);
      onOpenChange(false);
    } else if (expenseState.message && !expenseState.success) {
      toast.error(expenseState.message);
    }
  }, [expenseState, onOpenChange]);

  useEffect(() => {
    if (incomeState.success) {
      toast.success(incomeState.message);
      onOpenChange(false);
    } else if (incomeState.message && !incomeState.success) {
      toast.error(incomeState.message);
    }
  }, [incomeState, onOpenChange]);

  const isExpense = activeType === "expense";
  const formAction = isExpense ? expenseFormAction : incomeFormAction;
  const errors = isExpense ? expenseState.errors : incomeState.errors;

  const body = (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="familyUuid" value={familyUuid} />
      <div className="flex gap-1 bg-bg-muted p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveType("expense")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
            isExpense ? "gradient-expense text-white shadow-sm" : "text-fg-muted hover:text-fg",
          )}
        >
          <TrendingDown className="w-4 h-4" />
          지출
        </button>
        <button
          type="button"
          onClick={() => setActiveType("income")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all",
            !isExpense ? "gradient-income text-white shadow-sm" : "text-fg-muted hover:text-fg",
          )}
        >
          <TrendingUp className="w-4 h-4" />
          수입
        </button>
      </div>

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
        errors={errors}
      />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
          취소
        </Button>
        <SubmitButton
          className={cn(
            "flex-1 text-white hover:opacity-90",
            isExpense ? "gradient-expense" : "gradient-income",
          )}
          pendingText="추가 중..."
        >
          {isExpense ? "지출" : "수입"} 추가
        </SubmitButton>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[720px] bg-bg-elev">
          <DialogHeader>
            <DialogTitle className="sr-only">거래 추가</DialogTitle>
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
          <SheetTitle>거래 추가</SheetTitle>
        </SheetHeader>
        <div className="px-5 py-4 overflow-y-auto h-[calc(100dvh-56px)]">{body}</div>
      </SheetContent>
    </Sheet>
  );
}
