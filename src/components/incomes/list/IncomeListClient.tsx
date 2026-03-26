"use client";

import type { Income } from "@/types/income";
import type { CategoryResponse } from "@/types/category";
import { groupByDate } from "@/lib/utils/group-by-date";
import { useRouter, useSearchParams } from "next/navigation";
import { IncomeItem } from "./IncomeItem";

interface IncomeListClientProps {
  incomes: Income[];
  familyUuid: string;
  categories: CategoryResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export function IncomeListClient({
  incomes,
  familyUuid,
  categories,
  totalPages,
  currentPage,
}: IncomeListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/transactions?${params.toString()}`);
  };

  // 날짜별 그룹핑
  const groups = groupByDate(incomes);

  return (
    <div className="space-y-4">
      <div className="space-y-5">
        {groups.map(({ dateKey, label, items }) => {
          const groupTotal = items.reduce((sum, i) => sum + Number(i.amount), 0);

          return (
            <div key={dateKey}>
              {/* 날짜 헤더 */}
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {label}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  +₩{groupTotal.toLocaleString()}
                </span>
              </div>

              {/* 해당 날짜의 수입 목록 */}
              <div className="bg-white rounded-2xl overflow-hidden divide-y divide-gray-50">
                {items.map((income) => (
                  <IncomeItem
                    key={income.uuid}
                    income={income}
                    familyUuid={familyUuid}
                    categories={categories}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            이전
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
