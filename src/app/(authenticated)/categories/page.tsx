/**
 * 카테고리 관리 페이지 - Server Component
 */

import { CategoryPageClient } from "./_components/CategoryPageClient";
import { getSelectedFamilyAction } from "@/actions/family/get-selected-family-action";
import { getFamilyCategoriesAction } from "@/actions/category/get-categories-action";
import type { CategoryResponse } from "@/types/category";
import { redirect } from "next/navigation";

export default async function CategoriesPage() {
  // 선택된 가족 UUID 가져오기
  const familyResult = await getSelectedFamilyAction();
  if (!familyResult.success || !familyResult.data) {
    redirect("/families/create");
  }
  const familyUuid = familyResult.data;

  // 선택된 가족의 카테고리 목록 조회
  const categoriesResult = await getFamilyCategoriesAction(familyUuid);
  const categories: CategoryResponse[] = categoriesResult.success
    ? categoriesResult.data
    : [];
  const hasError = !categoriesResult.success;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-fg">카테고리 관리</h1>
        <p className="text-fg-muted mt-1">
          지출 카테고리를 추가, 수정, 삭제할 수 있습니다
        </p>
      </div>

      <CategoryPageClient
        initialCategories={categories}
        familyUuid={familyUuid}
        hasInitialError={hasError}
      />
    </div>
  );
}
