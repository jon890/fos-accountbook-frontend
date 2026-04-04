"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRecurringExpenseAction } from "@/actions/recurring-expense";
import type { CategoryResponse } from "@/types/category";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddRecurringExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryResponse[];
}

export function AddRecurringExpenseSheet({
  open,
  onOpenChange,
  categories,
}: AddRecurringExpenseSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: String(formData.get("name")).trim(),
      categoryUuid: String(formData.get("categoryUuid")),
      amount: Number(formData.get("amount")),
      dayOfMonth: Number(formData.get("dayOfMonth")),
    };

    try {
      const result = await createRecurringExpenseAction(data);

      if (result.success) {
        toast.success(
          `내일부터 매월 ${data.dayOfMonth}일에 자동 등록됩니다`
        );
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("고정지출 등록에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>고정지출 추가</SheetTitle>
          <SheetDescription>
            매월 자동으로 등록될 고정지출을 설정합니다
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-4">
          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              name="name"
              placeholder="예: 넷플릭스, 월세"
              required
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="categoryUuid">카테고리 *</Label>
            <select
              id="categoryUuid"
              name="categoryUuid"
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
          </div>

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
                min={1}
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                원
              </span>
            </div>
          </div>

          {/* 매월 N일 */}
          <div className="space-y-2">
            <Label htmlFor="dayOfMonth">매월 결제일 *</Label>
            <div className="relative">
              <Input
                id="dayOfMonth"
                name="dayOfMonth"
                type="number"
                placeholder="1"
                min={1}
                max={28}
                className="pr-8"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                일
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              1~28일까지 선택 가능합니다
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-expense text-white hover:opacity-90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추가 중...
                </>
              ) : (
                "추가"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
