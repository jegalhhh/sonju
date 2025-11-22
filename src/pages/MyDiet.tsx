import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useUserInfo } from "@/contexts/UserInfoContext";

interface TopFactor {
  feature: string;
  value: number;
  impact: "increase" | "decrease";
}

interface DiseaseRisk {
  risk: number;
  top_factors: TopFactor[];
}

interface HealthPredictions {
  diabetes: DiseaseRisk;
  hypertension: DiseaseRisk;
  dyslipidemia: DiseaseRisk;
  osas: DiseaseRisk;
}

interface FoodLog {
  id: string;
  food_name: string;
  image_url: string;
  calories: string | null;
  protein: string | null;
  fat: string | null;
  carbs: string | null;
  sugar: string | null;
  sodium: string | null;
  calcium: string | null;
  vitamin_c: string | null;
  risk_level: string | null;
  risk_comment: string | null;
  created_at: string;
}

const MyDiet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userInfo } = useUserInfo();
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthPredictions, setHealthPredictions] = useState<HealthPredictions | null>(null);
  const [predictingHealth, setPredictingHealth] = useState(false);
  const [healthAdvice, setHealthAdvice] = useState<{
    diabetes?: string;
    hypertension?: string;
    dyslipidemia?: string;
    osas?: string;
  }>({});
  const [adviceLoading, setAdviceLoading] = useState<{
    diabetes: boolean;
    hypertension: boolean;
    dyslipidemia: boolean;
    osas: boolean;
  }>({
    diabetes: false,
    hypertension: false,
    dyslipidemia: false,
    osas: false,
  });

  // Calculate BMR using Harris-Benedict equation
  const calculateDailyCalories = () => {
    if (!userInfo) return null;
    const { age, gender, height, weight } = userInfo;
    let bmr: number;
    if (gender === "male") {
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
    }
    return Math.round(bmr * 1.3);
  };

  // Calculate total consumed calories
  const calculateConsumedCalories = () => {
    return foodLogs.reduce((total, log) => {
      if (!log.calories) return total;
      const match = log.calories.match(/(\d+)/);
      return total + (match ? parseInt(match[1]) : 0);
    }, 0);
  };

  const dailyCalories = calculateDailyCalories();
  const consumedCalories = calculateConsumedCalories();
  const caloriePercentage = dailyCalories ? Math.min(Math.round(consumedCalories / dailyCalories * 100), 100) : 0;

  useEffect(() => {
    loadFoodLogs();
  }, []);

  useEffect(() => {
    if (userInfo && foodLogs.length > 0) {
      calculateHealthRisks();
    }
  }, [userInfo, foodLogs]);

  useEffect(() => {
    if (healthPredictions) {
      const diseases = [
        { key: "diabetes" as const, name: "당뇨병", data: healthPredictions.diabetes },
        { key: "hypertension" as const, name: "고혈압", data: healthPredictions.hypertension },
        { key: "dyslipidemia" as const, name: "이상지질혈증", data: healthPredictions.dyslipidemia },
        { key: "osas" as const, name: "폐쇄성수면무호흡증", data: healthPredictions.osas },
      ];

      diseases.forEach(({ key, name, data }) => {
        if (data.risk >= 0.4) {
          generateAdviceForDisease(name, key, data.risk, data.top_factors);
        }
      });
    }
  }, [healthPredictions]);

  const generateAdviceForDisease = async (
    disease: string,
    diseaseKey: keyof HealthPredictions,
    risk: number,
    topFactors: TopFactor[]
  ) => {
    if (risk < 0.4) return;

    setAdviceLoading(prev => ({ ...prev, [diseaseKey]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("generate-health-advice", {
        body: {
          disease,
          risk,
          top_factors: topFactors,
        },
      });

      if (error) throw error;

      setHealthAdvice(prev => ({ ...prev, [diseaseKey]: data.advice }));
    } catch (error) {
      console.error(`Advice generation error for ${disease}:`, error);
      toast({
        title: "조언 생성 실패",
        description: `${disease} 조언을 생성하는 중 오류가 발생했습니다.`,
        variant: "destructive",
      });
    } finally {
      setAdviceLoading(prev => ({ ...prev, [diseaseKey]: false }));
    }
  };

  const calculateHealthRisks = async () => {
    if (!userInfo || foodLogs.length === 0) return;

    setPredictingHealth(true);
    try {
      const parseNumber = (str: string | null): number => {
        if (!str) return 0;
        const match = str.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
      };

      const dailyNutrition = foodLogs.reduce((acc, log) => ({
        energy: acc.energy + parseNumber(log.calories),
        protein: acc.protein + parseNumber(log.protein),
        fat: acc.fat + parseNumber(log.fat),
        carbs: acc.carbs + parseNumber(log.carbs),
        sugar: acc.sugar + parseNumber(log.sugar),
        sodium_mg: acc.sodium_mg + parseNumber(log.sodium),
        calcium_mg: acc.calcium_mg + parseNumber(log.calcium),
        vitaminc_mg: acc.vitaminc_mg + parseNumber(log.vitamin_c),
      }), {
        energy: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        sugar: 0,
        sodium_mg: 0,
        calcium_mg: 0,
        vitaminc_mg: 0,
      });

      const { data, error } = await supabase.functions.invoke('predict-health', {
        body: {
          gender: userInfo.gender === 'male' ? 1 : 0,
          age: userInfo.age,
          ...dailyNutrition,
        }
      });

      if (error) throw error;
      if (data) {
        // Normalize Python API response structure
        const normalized: HealthPredictions = {
          diabetes: {
            risk: data.diabetes.diabetes_risk,
            top_factors: data.diabetes.top_factors || []
          },
          hypertension: {
            risk: data.hypertension.hypertension_risk,
            top_factors: data.hypertension.top_factors || []
          },
          dyslipidemia: {
            risk: data.dyslipidemia.dyslipidemia_risk,
            top_factors: data.dyslipidemia.top_factors || []
          },
          osas: {
            risk: data.osas.osas_risk,
            top_factors: data.osas.top_factors || []
          }
        };
        setHealthPredictions(normalized);
      }
    } catch (error: any) {
      console.error("Health prediction error:", error);
      
      let errorMessage = "건강 위험도 분석 실패";
      let errorDescription = "건강 위험도를 분석하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
      
      if (error.message?.includes("429") || error.message?.includes("많습니다")) {
        errorDescription = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
      } else if (error.message?.includes("network") || error.message?.includes("Failed to fetch")) {
        errorDescription = "네트워크 연결을 확인해 주세요.";
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setPredictingHealth(false);
    }
  };

  const loadFoodLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setFoodLogs(data || []);
    } catch (error) {
      console.error("Error loading food logs:", error);
      toast({
        title: "오류",
        description: "식단 기록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      const filePath = imageUrl.split("/object/public/food-images/")[1];
      
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("food-images")
          .remove([filePath]);
        
        if (storageError) {
          console.error("Storage deletion error:", storageError);
        }
      }

      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;
      
      setFoodLogs(foodLogs.filter(log => log.id !== id));
      toast({
        title: "삭제 완료",
        description: "식단 기록이 삭제되었습니다."
      });
    } catch (error) {
      console.error("Error deleting food log:", error);
      toast({
        title: "오류",
        description: "식단 기록 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6 px-4 shadow-md">
        <div className="container mx-auto flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/analyze")} 
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-bold text-xl">내 식단 기록</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Health Risk Analysis */}
        {healthPredictions && (
          <Card className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-primary">건강 위험도 분석</h2>
              {predictingHealth ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">분석 중...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">당뇨병</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress 
                        value={healthPredictions.diabetes.risk * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        위험도: {(healthPredictions.diabetes.risk * 100).toFixed(1)}%
                      </p>
                      {healthPredictions.diabetes.risk >= 0.4 && (
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          {adviceLoading.diabetes ? (
                            <p className="text-xs text-muted-foreground italic">생성 중...</p>
                          ) : healthAdvice.diabetes ? (
                            <p className="text-xs whitespace-pre-line">{healthAdvice.diabetes}</p>
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">고혈압</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress 
                        value={healthPredictions.hypertension.risk * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        위험도: {(healthPredictions.hypertension.risk * 100).toFixed(1)}%
                      </p>
                      {healthPredictions.hypertension.risk >= 0.4 && (
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          {adviceLoading.hypertension ? (
                            <p className="text-xs text-muted-foreground italic">생성 중...</p>
                          ) : healthAdvice.hypertension ? (
                            <p className="text-xs whitespace-pre-line">{healthAdvice.hypertension}</p>
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">이상지질혈증</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress 
                        value={healthPredictions.dyslipidemia.risk * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        위험도: {(healthPredictions.dyslipidemia.risk * 100).toFixed(1)}%
                      </p>
                      {healthPredictions.dyslipidemia.risk >= 0.4 && (
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          {adviceLoading.dyslipidemia ? (
                            <p className="text-xs text-muted-foreground italic">생성 중...</p>
                          ) : healthAdvice.dyslipidemia ? (
                            <p className="text-xs whitespace-pre-line">{healthAdvice.dyslipidemia}</p>
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">수면무호흡증</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress 
                        value={healthPredictions.osas.risk * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        위험도: {(healthPredictions.osas.risk * 100).toFixed(1)}%
                      </p>
                      {healthPredictions.osas.risk >= 0.4 && (
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          {adviceLoading.osas ? (
                            <p className="text-xs text-muted-foreground italic">생성 중...</p>
                          ) : healthAdvice.osas ? (
                            <p className="text-xs whitespace-pre-line">{healthAdvice.osas}</p>
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                * AI 기반 예측 결과이며 의학적 진단이 아닙니다. 정확한 진단은 의료 전문가와 상담하세요.
              </p>
            </CardContent>
          </Card>
        )}

        {dailyCalories && (
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-primary">하루 권장 칼로리</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">권장 칼로리:</span>
                  <span className="font-bold text-primary">{dailyCalories} kcal</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">섭취 칼로리:</span>
                  <span className="font-bold">{consumedCalories} kcal</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">달성률</span>
                    <span className="text-2xl font-bold text-primary">{caloriePercentage}%</span>
                  </div>
                  <Progress value={caloriePercentage} className="h-4" />
                </div>
                {caloriePercentage >= 100 && (
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    🎉 오늘 권장 칼로리를 달성했습니다!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">불러오는 중...</p>
          </div>
        ) : foodLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              저장된 식단 기록이 없습니다.
            </p>
            <Button onClick={() => navigate("/")} className="mt-4">
              음식 분석하러 가기
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {foodLogs.map(log => (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-row gap-6">
                    <div className="flex-shrink-0">
                      <img 
                        src={log.image_url} 
                        alt={log.food_name} 
                        className="w-full md:w-48 h-48 object-cover rounded-lg" 
                      />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-2xl font-bold text-primary">
                            {log.food_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => handleDelete(log.id, log.image_url)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {log.calories && (
                        <div>
                          <p className="text-lg font-medium">
                            칼로리: {log.calories}
                          </p>
                        </div>
                      )}

                      {log.risk_level && (
                        <div className={`p-4 rounded-lg border-2 ${
                          log.risk_level === "안전" 
                            ? "bg-green-50 dark:bg-green-950/20 border-green-500" 
                            : log.risk_level === "위험" 
                            ? "bg-red-50 dark:bg-red-950/20 border-red-500" 
                            : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">
                              {log.risk_level === "안전" ? "🟢" : log.risk_level === "위험" ? "🔴" : "🟡"}
                            </div>
                            <div>
                              <h4 className={`font-bold mb-1 ${
                                log.risk_level === "안전" 
                                  ? "text-green-700 dark:text-green-300" 
                                  : log.risk_level === "위험" 
                                  ? "text-red-700 dark:text-red-300" 
                                  : "text-yellow-700 dark:text-yellow-300"
                              }`}>
                                {log.risk_level}
                              </h4>
                              {log.risk_comment && (
                                <p className="text-foreground/90 text-xs">
                                  {log.risk_comment}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyDiet;
