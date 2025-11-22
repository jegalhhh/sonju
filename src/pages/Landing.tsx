import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";
const Landing = () => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAllStorage = async () => {
    if (!confirm("⚠️ Storage의 모든 이미지를 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    try {
      // List all files in food-images bucket
      const { data: files, error: listError } = await supabase.storage
        .from("food-images")
        .list();

      if (listError) throw listError;

      if (!files || files.length === 0) {
        toast({
          title: "알림",
          description: "삭제할 파일이 없습니다.",
        });
        return;
      }

      // Delete all files
      const filePaths = files.map(file => file.name);
      const { error: deleteError } = await supabase.storage
        .from("food-images")
        .remove(filePaths);

      if (deleteError) throw deleteError;

      toast({
        title: "삭제 완료",
        description: `${filePaths.length}개의 파일이 삭제되었습니다.`,
      });
    } catch (error) {
      console.error("Storage deletion error:", error);
      toast({
        title: "오류",
        description: "파일 삭제에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 flex items-center justify-center p-6 relative">
      {/* 임시 삭제 버튼 */}
      <Button
        onClick={handleDeleteAllStorage}
        disabled={isDeleting}
        variant="destructive"
        size="sm"
        className="fixed bottom-4 left-4 z-50"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? "삭제 중..." : "Storage 전체 삭제"}
      </Button>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* 왼쪽: 로고 + 서비스 소개 */}
        <div className="flex-1 space-y-8 max-w-xl">
          {/* 로고 + 제목 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <img src="/sonju.png" alt="밥상 손주 로고" className="w-32 h-32 object-contain" />
              <h1 className="text-6xl font-jua text-primary tracking-tight lg:text-8xl">밥상 손주</h1>
            </div>
          </div>

          {/* 메인 카피 */}
          <div className="space-y-6 text-center lg:text-left">
            <h2 className="text-3xl lg:text-3xl font-bold text-foreground leading-tight">
              부모님의 밥상을 건강하고 따뜻하게
            </h2>
            <p className="text-xl lg:text-xl text-muted-foreground leading-relaxed">
              AI 기반 음식 분석으로 부모님의 건강한 식습관을 돕습니다.
              <br />
              사진 한 장으로 영양소 분석부터 질병별 맞춤 조언까지.
            </p>
          </div>

          {/* 음식 갤러리 */}
          <div className="flex gap-6 justify-center lg:justify-start">
            {[
              {
                img: "/food-1.jpg",
                label: "치킨",
              },
              {
                img: "/food-2.jpeg",
                label: "된장찌개",
              },
              {
                img: "/food-3.jpg",
                label: "커피",
              },
            ].map((food, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(
                      {
                        type: "LOAD_DEMO_IMAGE",
                        imageUrl: food.img,
                      },
                      window.location.origin,
                    );
                    toast({
                      description: `${food.label} 샘플이 로드됩니다!`,
                    });
                  }
                }}
                className="group relative w-36 h-36 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer"
              >
                <img src={food.img} alt={food.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-3">
                  <span className="text-white text-base font-semibold">{food.label}</span>
                </div>
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-3xl">👆</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-base text-muted-foreground text-center lg:text-left mt-3">
            ⬆️ 샘플 음식을 클릭하면 바로 분석할 수 있어요
          </p>
        </div>

        {/* 오른쪽: 패드 목업 */}
        <div className="flex-shrink-0 w-full lg:w-1/2 flex justify-center">
          <div className="relative w-full h-[calc(100vh-8rem)]">
            {/* 화면 영역 (테두리 없이) */}
            <div className="relative w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* 실제 작동하는 앱 화면 */}
              <iframe
                ref={iframeRef}
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
  );
};
export default Landing;
