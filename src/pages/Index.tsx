import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    // 이전 미리보기 URL 정리
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    const newPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(newPreviewUrl);
    setResult("");
    setError("");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    handleFileSelect(selectedFile);
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError("먼저 이미지를 업로드해주세요.");
      toast.error("먼저 이미지를 업로드해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        "predict",
        {
          body: formData,
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (functionData?.food) {
        setResult(functionData.food);
        toast.success("분석 완료!");
      } else {
        setResult("결과를 확인할 수 없습니다.");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "알 수 없는 오류입니다.";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("분석 오류:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl("");
    setResult("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="w-full py-12 px-4 text-center bg-gradient-to-b from-primary/10 to-transparent">
        <h1 className="text-5xl font-bold text-foreground mb-3 tracking-tight">
          AI 음식 인식
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          사진을 업로드하면 OpenAI Vision이 어떤 음식인지 알려드립니다.
        </p>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardContent className="p-8 space-y-6">
            {/* 이미지 업로드 영역 */}
            <div
              onClick={handleUploadAreaClick}
              className={`
                relative w-full min-h-[320px] rounded-lg border-2 border-dashed
                flex items-center justify-center cursor-pointer
                transition-all duration-300 overflow-hidden
                ${
                  previewUrl
                    ? "border-primary bg-card"
                    : "border-upload-border bg-upload-bg hover:border-primary hover:bg-primary/5"
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="업로드된 이미지 미리보기"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="text-7xl mb-4">📷</div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    이미지를 드래그하거나 클릭해서 업로드하세요.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG 등 이미지 파일 지원
                  </p>
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {isLoading ? "분석 중..." : "분석하기"}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="h-12 px-8 text-base font-medium"
              >
                초기화
              </Button>
            </div>

            {/* 결과 카드 */}
            <Card className="bg-secondary/50 border-secondary">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-3">결과</h2>
                <div className="min-h-[60px] flex items-center justify-center">
                  {error ? (
                    <p className="text-destructive text-base font-medium">{error}</p>
                  ) : result ? (
                    <p className="text-2xl font-bold text-primary">{result}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      분석 결과가 여기에 표시됩니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
