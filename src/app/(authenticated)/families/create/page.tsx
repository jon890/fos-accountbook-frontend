"use client";

import { createFamilyAction } from "@/app/actions/family/create-family-action";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSessionRefresh } from "@/lib/client/use-session-refresh";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateFamilyPage() {
  const [familyName, setFamilyName] = useState("");
  const [familyType, setFamilyType] = useState<"personal" | "family">("family");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshSession } = useSessionRefresh();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!familyName.trim()) {
      toast.error("가족 이름을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // Server Action 호출 (백엔드 Access Token은 서버의 HTTP-only 쿠키에서 자동 전달)
      const result = await createFamilyAction({
        name: familyName.trim(),
        description: familyType === "personal" ? "개인 가계부" : undefined,
      });

      if (result.success) {
        // 세션 갱신 (프로필의 defaultFamilyUuid가 변경됨)
        await refreshSession();
        toast.success("가족이 성공적으로 생성되었습니다!");
        // 백엔드에서 첫 가족 생성 시 자동으로 defaultFamilyUuid 설정됨
        // 대시보드로 바로 이동 (홈에서 리다이렉트 처리)
        router.push("/dashboard");
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error("Family creation error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "가족 생성 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-background p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              가족 만들기
            </CardTitle>
            <CardDescription>
              새로운 가족을 만들어 가계부를 시작해보세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 가족 타입 선택 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">가족 타입</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={familyType === "personal" ? "default" : "outline"}
                    onClick={() => setFamilyType("personal")}
                    className="h-12"
                  >
                    <div className="text-center">
                      <div className="text-lg">👤</div>
                      <div className="text-xs">혼자 사용</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={familyType === "family" ? "default" : "outline"}
                    onClick={() => setFamilyType("family")}
                    className="h-12"
                  >
                    <div className="text-center">
                      <div className="text-lg">👨‍👩‍👧‍👦</div>
                      <div className="text-xs">가족과 함께</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* 가족 이름 입력 */}
              <div className="space-y-2">
                <Label htmlFor="familyName" className="text-sm font-medium">
                  {familyType === "personal" ? "나의 가계부" : "가족 이름"}
                </Label>
                <Input
                  id="familyName"
                  type="text"
                  placeholder={
                    familyType === "personal"
                      ? "예: 김철수의 가계부"
                      : "예: 우리가족"
                  }
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                className="w-full h-12 text-white gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    생성 중...
                  </div>
                ) : (
                  "가족 만들기"
                )}
              </Button>
            </form>

            {/* 설명 텍스트 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-sm text-blue-900 mb-2">
                {familyType === "personal"
                  ? "혼자 사용하기"
                  : "가족과 함께 사용하기"}
              </h4>
              <p className="text-xs text-blue-700">
                {familyType === "personal"
                  ? "개인 지출을 관리할 수 있는 가계부를 만듭니다. 언제든지 가족을 초대할 수 있습니다."
                  : "가족 구성원들과 함께 지출을 관리할 수 있는 공유 가계부를 만듭니다."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
