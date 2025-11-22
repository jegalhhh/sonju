import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [characterImage, setCharacterImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateCharacter();
  }, []);

  const generateCharacter = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('generate-character');
      
      if (error) throw error;
      
      if (data?.imageUrl) {
        setCharacterImage(data.imageUrl);
      }
    } catch (error) {
      console.error("Error generating character:", error);
      toast({
        title: "캐릭터 로딩 실패",
        description: "캐릭터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 서비스명 */}
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold text-primary">
            밥상 손주
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            부모님의 당신의 건강하고 따뜻한 밥상을 위하여
          </p>
        </div>

        {/* 캐릭터 이미지 */}
        <div className="flex justify-center py-8">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground">캐릭터를 생성하고 있습니다...</p>
            </div>
          ) : characterImage ? (
            <img 
              src={characterImage} 
              alt="밥상 손주 캐릭터" 
              className="w-64 h-64 md:w-80 md:h-80 object-contain rounded-full bg-white/50 p-4 shadow-lg"
            />
          ) : (
            <div className="w-64 h-64 md:w-80 md:h-80 bg-white/50 rounded-full flex items-center justify-center">
              <p className="text-muted-foreground">캐릭터 준비 중...</p>
            </div>
          )}
        </div>

        {/* 서비스 소개 */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            🍚 어르신의 건강한 식단을 지켜드립니다
          </h2>
          <div className="text-left space-y-3 text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-primary font-semibold">✓</span>
              <span>음식 사진만 찍으면 자동으로 영양 정보를 분석합니다</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary font-semibold">✓</span>
              <span>개인 맞춤형 건강 위험도를 알려드립니다</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary font-semibold">✓</span>
              <span>매일의 식단 기록으로 건강을 관리하세요</span>
            </p>
          </div>
        </div>

        {/* 시작하기 버튼 */}
        <Button
          onClick={() => navigate("/analyze")}
          size="lg"
          className="w-full md:w-auto px-12 py-6 text-xl font-semibold"
          disabled={isLoading}
        >
          시작하기
        </Button>
      </div>
    </div>
  );
};

export default Landing;
