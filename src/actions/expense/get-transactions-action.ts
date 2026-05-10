"use server";

import { z } from "zod";
import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import { getExpenses } from "@/services/expense/expense-service";
import { getIncomes } from "@/services/income/income-service";
import { getRecurringExpenses } from "@/services/recurring-expense/recurring-expense-service";
import {
  applyClientFilters,
  groupTransactionsWithTotal,
} from "@/services/transaction/transaction-service";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";
import type { RecurringExpense } from "@/types/recurring-expense";
import type { DateGroupWithTotal, TransactionFilters } from "@/types/transaction";

const filtersSchema = z.object({
  tab: z.enum(["expenses", "incomes", "recurring"]),
  categoryUuid: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amountMin: z.number().min(0, "amountMin 은 0 이상이어야 합니다").optional(),
  amountMax: z.number().min(0, "amountMax 는 0 이상이어야 합니다").optional(),
  q: z.string().max(100, "검색어는 100자 이하여야 합니다").optional(),
  page: z.number().optional(),
});

type TransactionsActionResult =
  | { items: Expense[]; dateGroups: DateGroupWithTotal<Expense>[]; totalCount: number }
  | { items: Income[]; dateGroups: DateGroupWithTotal<Income>[]; totalCount: number }
  | { items: RecurringExpense[]; dateGroups: null; totalCount: number };

export async function getTransactionsAction(
  filters: TransactionFilters & { tab: "expenses" | "incomes" | "recurring"; page?: number }
): Promise<ActionResult<TransactionsActionResult>> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const parsed = filtersSchema.safeParse(filters);
    if (!parsed.success) {
      throw ActionError.invalidInput(
        "filters",
        filters,
        parsed.error.issues.map((e) => e.message).join(", ")
      );
    }

    const { tab, categoryUuid, startDate, endDate, amountMin, amountMax, q, page } = parsed.data;
    const clientFilters = { amountMin, amountMax, q };

    if (tab === "expenses") {
      const response = await getExpenses(familyUuid, {
        categoryId: categoryUuid,
        startDate,
        endDate,
        page,
      });
      const filtered = applyClientFilters(response.items, clientFilters);
      return successResult({
        items: filtered,
        dateGroups: groupTransactionsWithTotal(filtered),
        totalCount: filtered.length,
      });
    }

    if (tab === "incomes") {
      const response = await getIncomes(familyUuid, {
        categoryId: categoryUuid,
        startDate,
        endDate,
        page,
      });
      const filtered = applyClientFilters(response.items, clientFilters);
      return successResult({
        items: filtered,
        dateGroups: groupTransactionsWithTotal(filtered),
        totalCount: filtered.length,
      });
    }

    // tab === "recurring"
    const response = await getRecurringExpenses(familyUuid);
    const filtered = applyClientFilters(response.items, clientFilters);
    return successResult({
      items: filtered,
      dateGroups: null,
      totalCount: filtered.length,
    });
  } catch (error) {
    return handleActionError(error, "거래 내역 조회에 실패했습니다");
  }
}
