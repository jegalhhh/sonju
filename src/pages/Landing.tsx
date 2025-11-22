import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex items-center justify-center p-6">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* 왼쪽: 로고 + 서비스 소개 */}
        <div className="flex-1 space-y-8 max-w-xl">
          {/* 로고 + 제목 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <img src="/sonju.png" alt="밥상 손주 로고" className="w-16 h-16 object-contain" />
              <h1 className="text-5xl lg:text-6xl font-jua text-primary tracking-tight">밥상 손주</h1>
            </div>
          </div>

          {/* 메인 카피 */}
          <div className="space-y-4 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              부모님의 밥상을<br />건강하고 따뜻하게
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              AI 기반 음식 분석으로 부모님의 건강한 식습관을 돕습니다.<br />
              사진 한 장으로 영양소 분석부터 질병별 맞춤 조언까지.
            </p>
          </div>

          {/* 시작하기 버튼 */}
          <Button 
            onClick={() => navigate("/analyze")} 
            size="lg" 
            className="w-full lg:w-auto px-12 py-6 text-xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
          >
            🍽️ 시작하기
          </Button>
        </div>

        {/* 오른쪽: 패드 목업 */}
        <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
          <div className="relative w-full lg:h-[calc(100vh-8rem)]">
            {/* 패드 프레임 */}
            <div className="relative w-full h-full lg:aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-4 shadow-2xl">
              {/* 화면 영역 */}
              <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden shadow-inner">
                {/* 실제 작동하는 앱 화면 */}
                <iframe 
                  src="/analyze" 
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  title="앱 미리보기"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Landing;