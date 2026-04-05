"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecurringExpenseCardProps {
  total: number;
}

export function RecurringExpenseCard({ total }: RecurringExpenseCardProps) {
  const router = useRouter();

  return (
    <div className="mb-4 md:mb-8">
      <Card
        className="relative overflow-hidden gradient-primary text-white border-0 shadow-lg cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        onClick={() => router.push("/transactions?tab=recurring")}
      >
        <CardContent className="relative p-3 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="p-1.5 md:p-3 gradient-card-overlay rounded-lg md:rounded-2xl backdrop-blur-sm">
                <RefreshCw className="w-3.5 h-3.5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="gradient-card-label text-[10px] md:text-sm font-medium mb-0.5 md:mb-1">
                  이달 고정비
                </p>
                <p className="text-base md:text-3xl font-bold">
                  ₩{total.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-[9px] md:text-xs gradient-card-sublabel">
              상세 보기 →
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
