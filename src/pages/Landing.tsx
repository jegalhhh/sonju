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
