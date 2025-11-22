import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <header className="w-full py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
        <div className="relative">
          <div className="inline-block mb-6 animate-bounce">
            <img 
              src="/sonju.png" 
              alt="밥상 손주 캐릭터" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
            밥상 손주
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            부모님의 건강하고 따뜻한 밥상을 위하여
          </p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* 기능 소개 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card/95 backdrop-blur border-2 border-border rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-bold text-foreground mb-2">음식 분석</h3>
              <p className="text-sm text-muted-foreground">
                사진만 찍으면 자동으로 영양 정보 분석
              </p>
            </div>
            
            <div className="bg-card/95 backdrop-blur border-2 border-border rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
              <div className="text-4xl mb-3">🏥</div>
              <h3 className="font-bold text-foreground mb-2">건강 관리</h3>
              <p className="text-sm text-muted-foreground">
                개인 맞춤형 건강 위험도 분석
              </p>
            </div>
            
            <div className="bg-card/95 backdrop-blur border-2 border-border rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold text-foreground mb-2">식단 기록</h3>
              <p className="text-sm text-muted-foreground">
                매일의 식단으로 건강 추적
              </p>
            </div>
          </div>

          {/* 시작하기 버튼 */}
          <div className="flex justify-center">
            <Button
              onClick={() => navigate("/analyze")}
              size="lg"
              className="w-full md:w-auto px-16 py-8 text-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
            >
              🍽️ 시작하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
