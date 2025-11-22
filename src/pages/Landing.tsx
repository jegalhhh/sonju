import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

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
          <img 
            src="/sonju.png" 
            alt="밥상 손주 캐릭터" 
            className="w-64 h-64 md:w-80 md:h-80 object-contain"
          />
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
        >
          시작하기
        </Button>
      </div>
    </div>
  );
};

export default Landing;
