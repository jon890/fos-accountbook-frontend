import { serverApiClient } from "@/lib/server/api/client";
import { getSelectedFamilyUuid } from "@/lib/server/auth/auth-helpers";
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

export async function checkUserFamily(): Promise<{
  hasFamily: boolean;
  familyId?: string;
}> {
  try {
    const { auth } = await import("@/lib/server/auth");
    const session = await auth();
    if (!session?.user?.id) {
      return { hasFamily: false };
    }

    const families = await getFamilies().catch(() => null);
    if (!families || families.length === 0) {
      return { hasFamily: false };
    }

    let selectedFamilyUuid = await getSelectedFamilyUuid();
    if (!selectedFamilyUuid) {
      selectedFamilyUuid = families[0].uuid;
    }

    return { hasFamily: true, familyId: selectedFamilyUuid };
  } catch {
    return { hasFamily: false };
  }
}

export async function getSelectedFamily(): Promise<string | null> {
  return getSelectedFamilyUuid();
}

export async function setDefaultFamily(familyUuid: string): Promise<void> {
  await serverApiClient("/users/me/profile", {
    method: "PUT",
    body: JSON.stringify({ defaultFamilyUuid: familyUuid }),
  });
}
