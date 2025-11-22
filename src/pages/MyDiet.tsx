import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useUserInfo } from "@/contexts/UserInfoContext";
interface FoodLog {
  id: string;
  food_name: string;
  image_url: string;
  calories: string | null;
  risk_level: string | null;
  risk_comment: string | null;
  created_at: string;
}
const MyDiet = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    userInfo
  } = useUserInfo();
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate BMR using Harris-Benedict equation
  const calculateDailyCalories = () => {
    if (!userInfo) return null;
    const {
      age,
      gender,
      height,
      weight
    } = userInfo;
    let bmr: number;
    if (gender === "male") {
      bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
    } else {
      bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
    }

    // Apply activity factor for elderly (1.3)
    return Math.round(bmr * 1.3);
  };

  // Calculate total consumed calories
  const calculateConsumedCalories = () => {
    return foodLogs.reduce((total, log) => {
      if (!log.calories) return total;
      // Parse calories from strings like "약 550 kcal" or "550 kcal"
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
  const loadFoodLogs = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("food_logs").select("*").order("created_at", {
        ascending: false
      });
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
      // Extract file path from image URL
      const filePath = imageUrl.split("/object/public/food-images/")[1];
      
      // Delete image from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from("food-images")
          .remove([filePath]);
        
        if (storageError) {
          console.error("Storage deletion error:", storageError);
        }
      }

      // Delete record from database
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
  return <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6 px-4 shadow-md">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/analyze")} className="text-primary-foreground hover:bg-primary-foreground/20">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-bold text-xl">내 식단 기록</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        {dailyCalories && <Card className={`mb-8 ${
          caloriePercentage > 100 
            ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 border-red-300 dark:border-red-800" 
            : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
        }`}>
            <CardContent className="p-6">
              <h2 className={`text-xl font-bold mb-4 ${
                caloriePercentage > 100 ? "text-red-600 dark:text-red-400" : "text-primary"
              }`}>하루 권장 칼로리</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">권장 칼로리:</span>
                  <span className={`font-bold ${
                    caloriePercentage > 100 ? "text-red-600 dark:text-red-400" : "text-primary"
                  }`}>{dailyCalories} kcal</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">섭취 칼로리:</span>
                  <span className={`font-bold ${
                    caloriePercentage > 100 ? "text-red-700 dark:text-red-300" : ""
                  }`}>{consumedCalories} kcal</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">달성률</span>
                    <span className={`text-2xl font-bold ${
                      caloriePercentage > 100 ? "text-red-600 dark:text-red-400 animate-pulse" : "text-primary"
                    }`}>{caloriePercentage}%</span>
                  </div>
                  <Progress 
                    value={caloriePercentage} 
                    className={`h-4 ${
                      caloriePercentage > 100 ? "[&>div]:bg-red-500 dark:[&>div]:bg-red-600" : ""
                    }`} 
                  />
                </div>
                {caloriePercentage > 100 ? (
                  <div className="bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-700 rounded-lg p-4 animate-fade-in">
                    <p className="text-center font-bold text-red-700 dark:text-red-300 text-lg">
                      ⚠️ 권장 칼로리를 초과했습니다! 식사량을 조절해주세요.
                    </p>
                  </div>
                ) : caloriePercentage >= 100 && (
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    🎉 오늘 권장 칼로리를 달성했습니다!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>}

        {loading ? <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">불러오는 중...</p>
          </div> : foodLogs.length === 0 ? <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              저장된 식단 기록이 없습니다.
            </p>
            <Button onClick={() => navigate("/")} className="mt-4">
              음식 분석하러 가기
            </Button>
          </div> : <div className="space-y-6">
            {foodLogs.map(log => <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-row gap-6">
                    <div className="flex-shrink-0">
                      <img src={log.image_url} alt={log.food_name} className="w-full md:w-48 h-48 object-cover rounded-lg" />
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
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(log.id, log.image_url)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {log.calories && <div>
                          <p className="text-lg font-medium">
                            칼로리: {log.calories}
                          </p>
                        </div>}

                      {log.risk_level && <div className={`p-4 rounded-lg border-2 ${log.risk_level === "안전" ? "bg-green-50 dark:bg-green-950/20 border-green-500" : log.risk_level === "위험" ? "bg-red-50 dark:bg-red-950/20 border-red-500" : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500"}`}>
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">
                              {log.risk_level === "안전" ? "🟢" : log.risk_level === "위험" ? "🔴" : "🟡"}
                            </div>
                            <div>
                              <h4 className={`font-bold mb-1 ${log.risk_level === "안전" ? "text-green-700 dark:text-green-300" : log.risk_level === "위험" ? "text-red-700 dark:text-red-300" : "text-yellow-700 dark:text-yellow-300"}`}>
                                {log.risk_level}
                              </h4>
                              {log.risk_comment && <p className="text-foreground/90 text-xs">
                                  {log.risk_comment}
                                </p>}
                            </div>
                          </div>
                        </div>}
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </main>
    </div>;
};
export default MyDiet;