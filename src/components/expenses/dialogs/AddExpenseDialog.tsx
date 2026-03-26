/**
 * 거래 추가 다이얼로그 (지출 / 수입 전환 가능)
 */

"use client";

import { getFamilyCategoriesAction } from "@/app/actions/category/get-categories-action";
import { createExpenseAction } from "@/app/actions/expense/create-expense-action";
import type { CreateIncomeFormState } from "@/app/actions/income/create-income-action";
import { createIncomeAction } from "@/app/actions/income/create-income-action";
import { cn } from "@/lib/client/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import type { CreateExpenseFormState } from "@/types/expense";
import type { CategoryResponse } from "@/types/category";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

type TransactionType = "expense" | "income";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TransactionType;
}

const initialExpenseState: CreateExpenseFormState = {
  message: "",
  errors: {},
  success: false,
};

const initialIncomeState: CreateIncomeFormState = {
  message: "",
  errors: {},
  success: false,
};

export function AddExpenseDialog({
  open,
  onOpenChange,
  defaultType = "expense",
}: AddExpenseDialogProps) {
  const [activeType, setActiveType] = useState<TransactionType>(defaultType);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [familyUuid, setFamilyUuid] = useState<string>("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const [expenseState, expenseFormAction] = useActionState(
    createExpenseAction,
    initialExpenseState
  );
  const [incomeState, incomeFormAction] = useActionState(
    createIncomeAction,
    initialIncomeState
  );

  useEffect(() => {
    if (open) {
      setActiveType(defaultType);
      loadData();
    } else {
      setCategories([]);
      setFamilyUuid("");
    }
  }, [open]);

  const loadData = async () => {
    setIsLoadingCategories(true);
    try {
      const result = await getFamilyCategoriesAction();
      if (result.success) {
        setCategories(result.data);
        if (result.data.length > 0) {
          setFamilyUuid(result.data[0].familyUuid);
        }
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("카테고리를 불러오는데 실패했습니다");
    } finally {
      setIsLoadingCategories(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="sr-only">거래 추가</DialogTitle>
          {/* 지출 / 수입 타입 토글 */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveType("expense")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                isExpense
                  ? "gradient-expense text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
              )}
            >
              <TrendingDown className="w-4 h-4" />
              지출
            </button>
            <button
              type="button"
              onClick={() => setActiveType("income")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
                !isExpense
                  ? "gradient-income text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              수입
            </button>
          </div>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="familyUuid" value={familyUuid} />

          {/* 금액 */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액 *</Label>
            <div className="relative">
              <Input
                id="amount"
                name="amount"
                type="number"
                placeholder="0"
                className="text-right pr-8"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                원
              </span>
            </div>
            {errors?.amount && (
              <p className="text-sm text-red-500">{errors.amount[0]}</p>
            )}
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="categoryId">카테고리 *</Label>
            {isLoadingCategories ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              <select
                id="categoryId"
                name="categoryId"
                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map((cat) => (
                  <option key={cat.uuid} value={cat.uuid}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            )}
            {errors?.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId[0]}</p>
            )}
          </div>

          {/* 날짜 */}
          <div className="space-y-2">
            <Label htmlFor="date">날짜 *</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
            {errors?.date && (
              <p className="text-sm text-red-500">{errors.date[0]}</p>
            )}
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="description">메모</Label>
            <Input
              id="description"
              name="description"
              placeholder="간단한 메모를 입력하세요 (선택사항)"
            />
            {errors?.description && (
              <p className="text-sm text-red-500">{errors.description[0]}</p>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <SubmitButton
              className={cn(
                "flex-1 text-white hover:opacity-90",
                isExpense ? "gradient-expense" : "gradient-income"
              )}
              pendingText="추가 중..."
            >
              {isExpense ? "지출" : "수입"} 추가
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
