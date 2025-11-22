import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 서비스명 */}
        <div className="space-y-3 backdrop-blur-md bg-background/10 border border-border/20 rounded-2xl p-8 shadow-xl">
          <h1 className="text-[3.3rem] font-jua text-primary tracking-tight md:text-8xl">밥상 손주</h1>
          <p className="text-lg md:text-xl text-muted-foreground">부모님의 밥상을 건강하고 따뜻하게</p>
        </div>

        {/* 스마트폰 목업과 캐릭터 */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-8">
          {/* 캐릭터 이미지 */}
          <div className="flex justify-center">
            <img src="/sonju.png" alt="밥상 손주 캐릭터" className="w-60 h-60 md:w-80 md:h-80 object-contain" />
          </div>

          {/* 스마트폰 목업 */}
          <div className="relative">
            {/* 스마트폰 프레임 */}
            <div className="relative w-[280px] h-[580px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
              {/* 노치 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>
              
              {/* 화면 영역 */}
              <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                {/* 앱 미리보기 콘텐츠 */}
                <div className="w-full h-full bg-gradient-to-b from-orange-50 to-amber-50 p-6 flex flex-col items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="text-3xl">📸</div>
                    <h3 className="text-lg font-bold text-primary">음식 사진 분석</h3>
                    <p className="text-sm text-muted-foreground">부모님의 식사를<br />건강하게 관리해요</p>
                    <div className="flex flex-col gap-2 mt-6">
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-xs">
                        🍚 영양소 분석
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-xs">
                        ⚠️ 질병별 주의사항
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-xs">
                        💡 맞춤 식단 추천
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 홈 버튼 인디케이터 */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* 시작하기 버튼 */}
        <Button onClick={() => navigate("/analyze")} size="lg" className="w-full px-16 py-8 text-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
          🍽️ 시작하기
        </Button>
      </div>
    </div>;
};
export default Landing;