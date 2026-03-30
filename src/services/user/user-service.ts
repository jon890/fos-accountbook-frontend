import { serverApiClient, serverApiPut } from "@/lib/server/api/client";
import type { UserProfile } from "@/types";

export async function getUserProfile(): Promise<UserProfile> {
  return serverApiClient<UserProfile>("/users/me/profile", {
    method: "GET",
  });
}

export async function setDefaultFamily(familyUuid: string): Promise<void> {
  await serverApiPut<void>("/users/me/profile", { defaultFamilyUuid: familyUuid });
}
