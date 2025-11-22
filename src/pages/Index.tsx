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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* 헤더 */}
      <header className="w-full py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
        <div className="relative">
          <div className="inline-block mb-4">
            <div className="text-6xl animate-bounce">🍜</div>
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-4 tracking-tight">
            AI 음식 인식
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            사진을 업로드하면 OpenAI Vision이 어떤 음식인지 알려드립니다.
          </p>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-3xl shadow-2xl border-2 bg-card/95 backdrop-blur">
          <CardContent className="p-10 space-y-8">
            {/* 이미지 업로드 영역 */}
            <div
              onClick={handleUploadAreaClick}
              className={`
                relative w-full rounded-xl border-2 border-dashed
                flex items-center justify-center cursor-pointer
                transition-all duration-300 overflow-hidden
                ${previewUrl ? 'min-h-[400px] max-h-[600px]' : 'min-h-[400px]'}
                ${
                  previewUrl
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-upload-border bg-upload-bg hover:border-primary hover:bg-primary/10 hover:shadow-lg"
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
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={previewUrl}
                    alt="업로드된 이미지 미리보기"
                    className="max-w-full max-h-[560px] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="text-center p-12">
                  <div className="text-8xl mb-6 animate-pulse">📷</div>
                  <p className="text-xl font-semibold text-foreground mb-3">
                    이미지를 드래그하거나 클릭해서 업로드하세요
                  </p>
                  <p className="text-base text-muted-foreground">
                    JPG, PNG 등 이미지 파일 지원
                  </p>
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-4">
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="flex-1 h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    분석 중...
                  </span>
                ) : (
                  "🔍 분석하기"
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="h-14 px-10 text-lg font-semibold hover:bg-secondary/50 transition-all hover:scale-[1.02]"
              >
                🔄 초기화
              </Button>
            </div>

            {/* 결과 카드 */}
            <Card className="bg-gradient-to-br from-secondary/60 to-secondary/30 border-2 border-secondary shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>✨</span> 결과
                </h2>
                <div className="min-h-[80px] flex items-center justify-center rounded-lg bg-card/50 p-6">
                  {error ? (
                    <p className="text-destructive text-lg font-semibold flex items-center gap-2">
                      <span>❌</span> {error}
                    </p>
                  ) : result ? (
                    <p className="text-3xl font-bold text-primary animate-pulse">
                      {result}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-lg italic">
                      분석 결과가 여기에 표시됩니다...
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
