"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddRecurringExpenseSheet } from "@/components/recurring-expense/AddRecurringExpenseSheet";
import type { CategoryResponse } from "@/types/category";

interface RecurringTabContentProps {
  categories: CategoryResponse[];
}

export function RecurringTabContent({ categories }: RecurringTabContentProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsAddOpen(true)}
        className="gradient-expense hover:opacity-90 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        고정지출 추가
      </Button>

      <AddRecurringExpenseSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        categories={categories}
      />
    </>
  );
}
