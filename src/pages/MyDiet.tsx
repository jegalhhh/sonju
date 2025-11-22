import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";

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
  const { toast } = useToast();
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFoodLogs();
  }, []);

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
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("food_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFoodLogs(foodLogs.filter((log) => log.id !== id));
      toast({
        title: "삭제 완료",
        description: "식단 기록이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Error deleting food log:", error);
      toast({
        title: "오류",
        description: "식단 기록 삭제에 실패했습니다.",
        variant: "destructive",
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
            onClick={() => navigate("/")}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-2xl font-bold">내 식단 기록</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 max-w-4xl">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">불러오는 중...</p>
          </div>
        ) : foodLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              저장된 식단 기록이 없습니다.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-4"
            >
              음식 분석하러 가기
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {foodLogs.map((log) => (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
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
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(log.id)}
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
                        <div
                          className={`p-4 rounded-lg border-2 ${
                            log.risk_level === "안전"
                              ? "bg-green-50 dark:bg-green-950/20 border-green-500"
                              : log.risk_level === "위험"
                              ? "bg-red-50 dark:bg-red-950/20 border-red-500"
                              : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">
                              {log.risk_level === "안전"
                                ? "🟢"
                                : log.risk_level === "위험"
                                ? "🔴"
                                : "🟡"}
                            </div>
                            <div>
                              <h4
                                className={`font-bold mb-1 ${
                                  log.risk_level === "안전"
                                    ? "text-green-700 dark:text-green-300"
                                    : log.risk_level === "위험"
                                    ? "text-red-700 dark:text-red-300"
                                    : "text-yellow-700 dark:text-yellow-300"
                                }`}
                              >
                                {log.risk_level}
                              </h4>
                              {log.risk_comment && (
                                <p className="text-sm text-foreground/90">
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