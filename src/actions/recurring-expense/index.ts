"use server";

import {
  ActionError,
  handleActionError,
  successResult,
  type ActionResult,
} from "@/lib/errors";
import {
  requireAuthOrRedirect,
  requireAuth,
  getSelectedFamilyUuid,
} from "@/lib/server/auth/auth-helpers";
import {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
  getRecurringExpensesMonthlyTotal,
} from "@/services/recurring-expense/recurring-expense-service";
import type {
  RecurringExpense,
  GetRecurringExpensesResponse,
} from "@/types/recurring-expense";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createRecurringExpenseSchema = z.object({
  name: z.string().trim().min(1, "이름은 필수입니다"),
  categoryUuid: z.string().uuid("카테고리를 선택해주세요"),
  amount: z.number().positive("금액은 0보다 커야 합니다"),
  dayOfMonth: z.number().int().min(1).max(28, "1~28일만 선택 가능합니다"),
});

const updateRecurringExpenseSchema = createRecurringExpenseSchema.partial();

export async function createRecurringExpenseAction(
  data: unknown
): Promise<ActionResult<RecurringExpense>> {
  try {
    await requireAuthOrRedirect();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const parsed = createRecurringExpenseSchema.safeParse(data);
    if (!parsed.success) {
      return ActionError.invalidInput(
        "recurringExpense",
        data,
        parsed.error.issues.map((e) => e.message).join(", ")
      ).toFailureResult();
    }

    const result = await createRecurringExpense(familyUuid, parsed.data);

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return successResult(result);
  } catch (error) {
    return handleActionError(error, "고정지출 등록에 실패했습니다");
  }
}

export async function updateRecurringExpenseAction(
  uuid: string,
  data: unknown
): Promise<ActionResult<RecurringExpense>> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    if (!uuid) {
      throw ActionError.invalidInput("uuid", uuid, "필수 값입니다");
    }

    const parsed = updateRecurringExpenseSchema.safeParse(data);
    if (!parsed.success) {
      return ActionError.invalidInput(
        "recurringExpense",
        data,
        parsed.error.issues.map((e) => e.message).join(", ")
      ).toFailureResult();
    }

    const result = await updateRecurringExpense(familyUuid, uuid, parsed.data);

    revalidatePath("/transactions");

    return successResult(result);
  } catch (error) {
    return handleActionError(error, "고정지출 수정에 실패했습니다");
  }
}

export async function deleteRecurringExpenseAction(
  uuid: string
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    if (!uuid) {
      throw ActionError.invalidInput("uuid", uuid, "필수 값입니다");
    }

    await deleteRecurringExpense(familyUuid, uuid);

    revalidatePath("/transactions");

    return successResult(undefined);
  } catch (error) {
    return handleActionError(error, "고정지출 삭제에 실패했습니다");
  }
}

export async function getRecurringExpensesAction(
  month?: string
): Promise<ActionResult<GetRecurringExpensesResponse>> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const result = await getRecurringExpenses(familyUuid, month);

    return successResult(result);
  } catch (error) {
    return handleActionError(error, "고정지출 조회에 실패했습니다");
  }
}

export async function getRecurringExpensesTotalAction(): Promise<
  ActionResult<number>
> {
  try {
    await requireAuth();

    const familyUuid = await getSelectedFamilyUuid();
    if (!familyUuid) {
      throw ActionError.familyNotSelected();
    }

    const result = await getRecurringExpensesMonthlyTotal(familyUuid);

    return successResult(result);
  } catch (error) {
    return handleActionError(error, "고정지출 합계 조회에 실패했습니다");
  }
}
