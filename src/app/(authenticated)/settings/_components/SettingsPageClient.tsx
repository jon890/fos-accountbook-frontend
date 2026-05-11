"use client";

import { updateFamilyAction } from "@/actions/family/update-family-action";
import { setDefaultFamilyAction } from "@/actions/user/set-default-family-action";
import { SettingsCard } from "@/components/layout/SettingsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/client/utils";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import type { Family } from "@/types/family";
import { Check, DollarSign, Edit2, Save, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsPageClientProps {
  families: Family[];
  defaultFamilyUuid: string | null;
}

export function SettingsPageClient({
  families,
  defaultFamilyUuid,
}: SettingsPageClientProps) {
  const router = useRouter();
  const { refreshSession } = useSessionRefresh();
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [currentDefaultFamily, setCurrentDefaultFamily] = useState<string>(
    defaultFamilyUuid || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>({});

  const handleSaveDefaultFamily = async () => {
    if (!selectedFamily) {
      toast.error("기본 가족을 선택해주세요");
      return;
    }

    try {
      setIsSaving(true);
      const result = await setDefaultFamilyAction(selectedFamily);

      if (result.success) {
        setCurrentDefaultFamily(selectedFamily);
        await refreshSession();
        toast.success("기본 가족이 설정되었습니다");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error("Failed to set default family:", error);
      toast.error("기본 가족 설정에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBudget = (familyUuid: string, currentBudget: number) => {
    setEditingBudget(familyUuid);
    setBudgetValues({
      ...budgetValues,
      [familyUuid]: currentBudget.toString(),
    });
  };

  const handleCancelBudget = (familyUuid: string) => {
    setEditingBudget(null);
    const newBudgetValues = { ...budgetValues };
    delete newBudgetValues[familyUuid];
    setBudgetValues(newBudgetValues);
  };

  const handleSaveBudget = async (familyUuid: string, familyName: string) => {
    const budgetStr = budgetValues[familyUuid];
    const budget = parseFloat(budgetStr);

    if (isNaN(budget) || budget < 0) {
      toast.error("올바른 예산 금액을 입력해주세요");
      return;
    }

    try {
      const result = await updateFamilyAction(familyUuid, {
        name: familyName,
        monthlyBudget: budget,
      });

      if (result.success) {
        toast.success("월 예산이 설정되었습니다");
        setEditingBudget(null);
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error("Failed to update budget:", error);
      toast.error("예산 설정에 실패했습니다");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-fg mb-2">설정</h1>
        <p className="text-sm md:text-base text-fg-muted">
          가족 · 예산 · 알림 관리
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 기본 가족 설정 — full width */}
        <SettingsCard
          icon={Users}
          title="기본 가족 설정"
          subtitle="앱 시작 시 보여줄 가족을 선택하세요"
          className="md:col-span-2"
        >
          <div className="px-2 pt-2 pb-3">
            <RadioGroup
              value={selectedFamily || currentDefaultFamily}
              onValueChange={setSelectedFamily}
              className="space-y-1"
            >
              {families.map((family) => {
                const isSelected =
                  (selectedFamily || currentDefaultFamily) === family.uuid;
                return (
                  <div
                    key={family.uuid}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
                      isSelected ? "bg-brand-50" : "hover:bg-bg-muted"
                    )}
                  >
                    <RadioGroupItem value={family.uuid} id={family.uuid} />
                    <Label
                      htmlFor={family.uuid}
                      className="flex-1 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "font-semibold text-sm",
                            isSelected ? "text-brand-700" : "text-fg"
                          )}
                        >
                          {family.name}
                          {currentDefaultFamily === family.uuid && (
                            <span className="inline-flex items-center gap-1 ml-2 text-brand-500 text-xs font-medium">
                              <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                              현재 기본
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-fg-muted mt-0.5">
                          구성원 {family.members?.length || 0}명 · 지출{" "}
                          {family.expenseCount || 0}건
                        </span>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>

            <div className="flex justify-end pt-3">
              <Button
                onClick={handleSaveDefaultFamily}
                disabled={
                  isSaving ||
                  !selectedFamily ||
                  selectedFamily === currentDefaultFamily
                }
                className="gradient-primary hover:opacity-90 text-white"
              >
                {isSaving ? "저장 중..." : "기본 가족으로 설정"}
              </Button>
            </div>
          </div>
        </SettingsCard>

        {/* 월 예산 설정 */}
        <SettingsCard
          icon={DollarSign}
          title="가족별 예산 설정"
          subtitle="이번 달 목표 예산을 입력하세요"
        >
          <div className="flex flex-col">
            {families.map((family, i) => (
              <div
                key={family.uuid}
                className={cn(
                  "flex items-center justify-between px-5 py-3",
                  i > 0 && "border-t border-border"
                )}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-fg text-sm">{family.name}</h3>
                  {editingBudget === family.uuid ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        value={budgetValues[family.uuid] || ""}
                        onChange={(e) =>
                          setBudgetValues({
                            ...budgetValues,
                            [family.uuid]: e.target.value,
                          })
                        }
                        placeholder="월 예산 입력"
                        className="w-36"
                      />
                      <span className="text-xs text-fg-muted">원</span>
                    </div>
                  ) : (
                    <p className="text-xs text-fg-muted mt-0.5">
                      {family.monthlyBudget > 0
                        ? `월 예산: ${family.monthlyBudget.toLocaleString()}원`
                        : "예산 미설정"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingBudget === family.uuid ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelBudget(family.uuid)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleSaveBudget(family.uuid, family.name)
                        }
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleEditBudget(family.uuid, family.monthlyBudget)
                      }
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>

        {/* 내 가족 목록 */}
        <SettingsCard
          icon={Users}
          title="내 가족 목록"
          subtitle="가족을 선택해 구성원·카테고리를 관리하세요"
        >
          <div className="flex flex-col">
            {families.map((family, i) => (
              <div
                key={family.uuid}
                className={cn(
                  "flex items-center justify-between px-5 py-3 hover:bg-bg-muted transition-colors",
                  i > 0 && "border-t border-border"
                )}
              >
                <div>
                  <h3 className="font-medium text-fg text-sm">{family.name}</h3>
                  <p className="text-xs text-fg-muted mt-0.5">
                    구성원 {family.members?.length || 0}명 · 카테고리{" "}
                    {family.categories?.length || 0}개 · 지출{" "}
                    {family.expenseCount || 0}건
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/families/${family.uuid}`)}
                >
                  관리
                </Button>
              </div>
            ))}
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
