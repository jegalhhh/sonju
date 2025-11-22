import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";

type Step = "intro" | "analyze";

interface Disease {
  id: string;
  name: string;
  description?: string;
}

const Index = () => {
  const navigate = useNavigate();
  
  // Step management
  const [step, setStep] = useState<Step>("intro");

  // Personal info
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [hidePersonal, setHidePersonal] = useState(false);

  // Disease selection
  const [diseaseOptions, setDiseaseOptions] = useState<Disease[]>([]);
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);

  // Image analysis
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [riskComment, setRiskComment] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load disease metadata
  useEffect(() => {
    const loadDiseases = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('diseases-meta');
        
        if (error) throw error;
        
        if (data?.items) {
          setDiseaseOptions(data.items);
        }
      } catch (err: any) {
        console.error('질병 목록 로드 실패:', err);
        toast.error('질병 목록을 불러올 수 없습니다.');
      }
    };

    loadDiseases();
  }, []);

  const handleFileSelect = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    const newPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(newPreviewUrl);
    setResult("");
    setRiskLevel("");
    setRiskComment("");
    setCalories("");
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
    setRiskLevel("");
    setRiskComment("");
    setCalories("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      selectedDiseases.forEach(diseaseId => {
        formData.append("diseases", diseaseId);
      });

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
        setRiskLevel(functionData.risk_level || "");
        setRiskComment(functionData.risk_comment || "");
        setCalories(functionData.calories || "");
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
    setRiskLevel("");
    setRiskComment("");
    setCalories("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProceedToAnalyze = () => {
    if (!age || !gender || !height || !weight) {
      toast.error("모든 건강 정보를 입력해주세요.");
      return;
    }
    setStep("analyze");
  };

  const handleBackToIntro = () => {
    setStep("intro");
  };

  const getSelectedDiseaseNames = () => {
    if (selectedDiseases.length === 0) return "선택 없음";
    return selectedDiseases
      .map(id => diseaseOptions.find(d => d.id === id)?.name || id)
      .join(", ");
  };

  const handleSave = async () => {
    if (!result || !previewUrl) {
      toast.error("저장할 분석 결과가 없습니다.");
      return;
    }

    try {
      const { error } = await supabase
        .from("food_logs")
        .insert({
          food_name: result,
          image_url: previewUrl,
          calories: calories || null,
          risk_level: riskLevel || null,
          risk_comment: riskComment || null,
        });

      if (error) throw error;

      toast.success("식단 기록이 저장되었습니다!");
      navigate("/my-diet");
    } catch (err: any) {
      console.error("Error saving food log:", err);
      toast.error("저장에 실패했습니다.");
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
        <header className="w-full py-16 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
          <div className="relative">
            <div className="inline-block mb-4">
              <div className="text-6xl">📋</div>
            </div>
            <h1 className="text-6xl font-bold text-foreground mb-4 tracking-tight">
              내 건강 정보 입력
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              나이, BMI, 질병 정보를 입력하고 내게 맞는 식단인지 확인해보세요.
            </p>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 pb-12">
          <Card className="w-full max-w-2xl shadow-2xl border-2 bg-card/95 backdrop-blur">
            <CardContent className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-lg font-semibold">
                    나이
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    placeholder="예: 35"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-lg font-semibold">
                    성별
                  </Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-12 px-3 rounded-md border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
                  >
                    <option value="">선택하세요</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height" className="text-lg font-semibold">
                    키 (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    placeholder="예: 170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-lg font-semibold">
                    체중 (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="예: 65.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diseases" className="text-lg font-semibold">
                  질병 (복수 선택 가능)
                </Label>
                <select
                  id="diseases"
                  multiple
                  value={selectedDiseases}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedDiseases(selected);
                  }}
                  className="w-full min-h-[200px] p-3 rounded-lg border-2 border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {diseaseOptions.map(disease => (
                    <option key={disease.id} value={disease.id} className="py-2">
                      {disease.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-muted-foreground mt-1">
                  Ctrl(또는 Command) 키를 누른 채 클릭하면 여러 개를 선택할 수 있어요.
                </p>
              </div>

              <div className="flex flex-col gap-4 mt-8">
                <Button
                  onClick={handleProceedToAnalyze}
                  disabled={!age || !gender || !height || !weight}
                  className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  🍽️ 식단 체크하기
                </Button>
                <Button
                  onClick={() => navigate("/my-diet")}
                  variant="outline"
                  className="w-full h-14 text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  📋 내 식단 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
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
            업로드한 음식이 나의 건강 상태와 어울리는지 확인해보세요.
          </p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-3xl shadow-2xl border-2 bg-card/95 backdrop-blur">
          <CardContent className="p-10 space-y-8">
            {/* User Info Bar */}
            <Card className="bg-gradient-to-r from-secondary/40 to-secondary/20 border-2 border-secondary/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    {!hidePersonal ? (
                      <div className="space-y-1">
                        <p className="text-base font-medium text-foreground">
                          <span className="font-semibold">나이:</span> {age || "-"}
                        </p>
                        <p className="text-base font-medium text-foreground">
                          <span className="font-semibold">성별:</span> {gender === "male" ? "남성" : gender === "female" ? "여성" : "-"}
                        </p>
                        <p className="text-base font-medium text-foreground">
                          <span className="font-semibold">키:</span> {height ? `${height}cm` : "-"}
                        </p>
                        <p className="text-base font-medium text-foreground">
                          <span className="font-semibold">체중:</span> {weight ? `${weight}kg` : "-"}
                        </p>
                        <p className="text-base font-medium text-foreground">
                          <span className="font-semibold">질병:</span> {getSelectedDiseaseNames()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground italic">
                        개인 정보가 숨김 처리되었습니다.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => setHidePersonal(!hidePersonal)}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {hidePersonal ? "👁️ 개인 정보 보이기" : "🙈 개인 정보 숨기기"}
                    </Button>
                    <Button
                      onClick={handleBackToIntro}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      ✏️ 정보 다시 입력
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Upload Area */}
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

            {/* Action Buttons */}
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
              {result && (
                <Button
                  onClick={handleSave}
                  variant="secondary"
                  className="h-14 px-10 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                >
                  <Save className="mr-2 h-5 w-5" />
                  저장
                </Button>
              )}
              <Button
                onClick={handleReset}
                variant="outline"
                className="h-14 px-10 text-lg font-semibold hover:bg-secondary/50 transition-all hover:scale-[1.02]"
              >
                🔄 초기화
              </Button>
            </div>

            {/* Result Card */}
            <Card className="bg-gradient-to-br from-secondary/60 to-secondary/30 border-2 border-secondary shadow-lg">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span>✨</span> 결과
                </h2>
                <div className="min-h-[100px] flex flex-col gap-3 justify-center rounded-lg bg-card/50 p-6">
                  {error ? (
                    <p className="text-destructive text-lg font-semibold flex items-center gap-2">
                      <span>❌</span> {error}
                    </p>
                  ) : result ? (
                    <>
                      <p className="text-2xl font-bold text-primary">
                        음식: {result}
                      </p>
                      {calories && (
                        <p className="text-lg font-medium text-foreground">
                          대략적인 칼로리: {calories}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-lg italic">
                      분석 결과가 여기에 표시됩니다.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Risk Box */}
            {riskLevel && (
              <Card className={`border-2 shadow-lg ${
                riskLevel === "안전" 
                  ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                  : riskLevel === "위험"
                  ? "bg-red-50 dark:bg-red-950/20 border-red-500"
                  : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500"
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">
                      {riskLevel === "안전" ? "🟢" : riskLevel === "위험" ? "🔴" : "🟡"}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 ${
                        riskLevel === "안전"
                          ? "text-green-700 dark:text-green-300"
                          : riskLevel === "위험"
                          ? "text-red-700 dark:text-red-300"
                          : "text-yellow-700 dark:text-yellow-300"
                      }`}>
                        {riskLevel === "안전" ? "안전" : riskLevel === "위험" ? "위험" : "주의"}
                      </h3>
                      {riskComment && (
                        <p className="text-base text-foreground/90">
                          {riskComment}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
