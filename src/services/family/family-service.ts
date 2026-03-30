import { serverApiClient } from "@/lib/server/api/client";
import type {
  CreateFamilyData,
  CreateFamilyResult,
  Family,
  UpdateFamilyRequest,
} from "@/types/family";

export async function createFamily(
  data: CreateFamilyData
): Promise<CreateFamilyResult> {
  const result = await serverApiClient<{ data: CreateFamilyResult }>(
    "/families",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );

  // Set default family after creation
  await serverApiClient("/users/me/profile", {
    method: "PUT",
    body: JSON.stringify({ defaultFamilyUuid: result.data.uuid }),
  });

  return result.data;
}

export async function getFamilies(): Promise<Family[]> {
  const result = await serverApiClient<{ data: Family[] }>("/families", {
    method: "GET",
  });
  return result.data;
}

export async function getFamilyById(familyUuid: string): Promise<Family> {
  const result = await serverApiClient<{ data: Family }>(
    `/families/${familyUuid}`,
    {
      method: "GET",
    }
  );
  return result.data;
}

export async function updateFamily(
  familyUuid: string,
  data: UpdateFamilyRequest
): Promise<Family> {
  const result = await serverApiClient<{ data: Family }>(
    `/families/${familyUuid}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
  return result.data;
}

export async function selectFamily(familyUuid: string): Promise<void> {
  const families = await getFamilies();
  const familyExists = families.some((f) => f.uuid === familyUuid);
  if (!familyExists) {
    const { ActionError } = await import("@/lib/errors");
    throw ActionError.entityNotFound("가족", familyUuid);
  }
  await setDefaultFamily(familyUuid);
}

export async function setDefaultFamily(familyUuid: string): Promise<void> {
  await serverApiClient("/users/me/profile", {
    method: "PUT",
    body: JSON.stringify({ defaultFamilyUuid: familyUuid }),
  });
}
