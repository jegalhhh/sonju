import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex items-center justify-center p-6">
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between gap-12">
        {/* 왼쪽: 서비스 소개 */}
        <div className="flex-1 text-center md:text-left space-y-8">
          <div className="space-y-3 backdrop-blur-md bg-background/10 border border-border/20 rounded-2xl p-8 shadow-xl">
            <h1 className="text-[3.3rem] font-jua text-primary tracking-tight md:text-7xl">밥상 손주</h1>
            <p className="text-lg md:text-xl text-muted-foreground">부모님의 밥상을 건강하고 따뜻하게</p>
          </div>

          {/* 캐릭터 이미지 */}
          <div className="flex justify-center md:justify-start">
            <img src="/sonju.png" alt="밥상 손주 캐릭터" className="w-48 h-48 md:w-64 md:h-64 object-contain" />
          </div>

          {/* 시작하기 버튼 */}
          <Button onClick={() => navigate("/analyze")} size="lg" className="w-full md:w-auto px-16 py-8 text-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]">
            🍽️ 시작하기
          </Button>
        </div>

        {/* 오른쪽: 스마트폰 목업 */}
        <div className="flex-shrink-0">
          <div className="relative">
            {/* 스마트폰 프레임 */}
            <div className="relative w-[280px] h-[580px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
              {/* 노치 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-10"></div>
              
              {/* 화면 영역 */}
              <div className="relative w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                {/* 실제 작동하는 앱 화면 */}
                <iframe 
                  src="/analyze" 
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  title="앱 미리보기"
                />
              </div>

              {/* 홈 버튼 인디케이터 */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Landing;