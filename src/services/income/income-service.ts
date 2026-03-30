import { serverApiClient, serverApiGet } from "@/lib/server/api/client";
import type {
  CreateIncomeRequest,
  GetIncomesParams,
  GetIncomesResponse,
  IncomeResponse,
} from "@/types/income";

export async function createIncome(
  familyUuid: string,
  data: {
    amount: number;
    description?: string;
    categoryId: string;
    date?: string;
  }
): Promise<void> {
  const requestBody: CreateIncomeRequest = {
    categoryUuid: data.categoryId,
    amount: data.amount,
    description: data.description,
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
  };
  await serverApiClient<{ data: IncomeResponse }>(
    `/families/${familyUuid}/incomes`,
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    }
  );
}

export async function getIncomes(
  params: GetIncomesParams
): Promise<GetIncomesResponse> {
  const queryParams = new URLSearchParams();
  if (params.categoryId) queryParams.set("categoryUuid", params.categoryId);
  if (params.startDate) queryParams.set("startDate", params.startDate);
  if (params.endDate) queryParams.set("endDate", params.endDate);
  queryParams.set("page", String((params.page || 1) - 1));
  queryParams.set("size", String(params.limit || 25));

  const queryString = queryParams.toString();
  const endpoint = `/families/${params.familyId}/incomes${
    queryString ? `?${queryString}` : ""
  }`;

  return serverApiGet<GetIncomesResponse>(endpoint);
}

export async function updateIncome(
  familyUuid: string,
  incomeUuid: string,
  data: {
    amount?: number;
    description?: string;
    categoryId?: string;
    date?: string;
  }
): Promise<void> {
  const updateData: {
    categoryUuid?: string;
    amount?: number;
    description?: string;
    date?: string;
  } = {};

  if (data.categoryId) updateData.categoryUuid = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date) updateData.date = new Date(data.date).toISOString();

  await serverApiClient<{ data: IncomeResponse }>(
    `/families/${familyUuid}/incomes/${incomeUuid}`,
    {
      method: "PUT",
      body: JSON.stringify(updateData),
    }
  );
}

export async function deleteIncome(
  familyUuid: string,
  incomeUuid: string
): Promise<void> {
  await serverApiClient(
    `/families/${familyUuid}/incomes/${incomeUuid}`,
    {
      method: "DELETE",
    }
  );
}
