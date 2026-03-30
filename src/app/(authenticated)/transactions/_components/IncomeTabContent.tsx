"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddIncomeDialog } from "@/components/incomes/dialogs/AddIncomeDialog";

/**
 * Income Tab Content Component
 * Transactions 페이지의 수입 탭 전용 컴포넌트
 * familyUuid는 AddIncomeDialog가 카테고리 페칭 시 직접 획득
 */
export function IncomeTabContent() {
  const [addIncomeDialogOpen, setAddIncomeDialogOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setAddIncomeDialogOpen(true)}
        className="gradient-income hover:opacity-90 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        수입 추가
      </Button>

      <AddIncomeDialog
        open={addIncomeDialogOpen}
        onOpenChange={setAddIncomeDialogOpen}
      />
    </>
  );
}
