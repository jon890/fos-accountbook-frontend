"use client";

import { updateCategoryAction } from "@/actions/category/update-category-action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CategoryResponse } from "@/types/category";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryResponse;
  onSuccess: (category: CategoryResponse) => void;
}

// 자주 사용하는 이모지 목록
const commonEmojis = [
  "🍚",
  "☕",
  "🍰",
  "🏠",
  "🚗",
  "🛍️",
  "💊",
  "🎬",
  "📚",
  "📦",
  "💰",
  "🎮",
  "🏃",
  "✈️",
  "📱",
  "💻",
  "👕",
  "🎵",
  "🍕",
  "🍜",
  "🚌",
  "⚡",
  "🔧",
  "🎨",
  "📷",
  "🏥",
  "🏫",
  "💳",
  "🎁",
  "🌟",
];

// 자주 사용하는 색상
const commonColors = [
  "#ef4444",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#f43f5e",
  "#14b8a6",
  "#6b7280",
  "#84cc16",
  "#f97316",
  "#a855f7",
  "#22c55e",
  "#0ea5e9",
];

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: EditCategoryDialogProps) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const [icon, setIcon] = useState(category.icon || "📦");
  const [excludeFromBudget, setExcludeFromBudget] = useState(
    category.excludeFromBudget || false,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon || "📦");
    setExcludeFromBudget(category.excludeFromBudget || false);
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("카테고리 이름을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCategoryAction(category.uuid, {
        name: name.trim(),
        color,
        icon,
        excludeFromBudget,
      });

      if (result.success) {
        toast.success("카테고리가 수정되었습니다");
        onSuccess(result.data);
        onOpenChange(false);
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("카테고리 수정 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>카테고리 수정</DialogTitle>
          <DialogDescription>카테고리 정보를 수정합니다</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 카테고리 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name">카테고리 이름 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 식비, 교통비"
              required
            />
          </div>

          {/* 아이콘 선택 */}
          <div className="space-y-2">
            <Label>아이콘</Label>
            <div className="flex items-center gap-2 mb-2">
              <div className="text-3xl">{icon}</div>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="flex-1"
                placeholder="이모지 입력"
              />
            </div>
            <div className="grid grid-cols-10 gap-1 p-2 border rounded-md max-h-32 overflow-y-auto">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-2xl p-1 hover:bg-gray-100 rounded ${
                    icon === emoji ? "bg-gray-200" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 선택 */}
          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: color }}
              />
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="grid grid-cols-10 gap-1 p-2 border rounded-md">
              {commonColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded border-2 ${
                    color === c ? "border-gray-900" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="excludeFromBudget-edit"
              checked={excludeFromBudget}
              onChange={(e) => setExcludeFromBudget(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="excludeFromBudget-edit" className="cursor-pointer">
              예산 합계에서 제외
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "수정 중..." : "수정"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
