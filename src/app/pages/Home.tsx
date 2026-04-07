import { Link } from "react-router";
import { CreditCard, Wallet, TrendingUp, PiggyBank, ChevronLeft, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import homeBanner1 from "../../assets/home/1.jpg";
import homeBanner2 from "../../assets/home/2.jpg";
import homeBanner3 from "../../assets/home/3.jpg";

// 커스텀 화살표 컴포넌트
function PrevArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 transition-all shadow-lg"
      aria-label="이전 슬라이드"
    >
      <ChevronLeft className="w-8 h-8 text-white" />
    </button>
  );
}

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full p-3 transition-all shadow-lg"
      aria-label="다음 슬라이드"
    >
      <ChevronRight className="w-8 h-8 text-white" />
    </button>
  );
}

export default function Home() {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  return (
    <div>
      {/* 히어로 섹션 - 슬라이더 */}
      <section className="text-white mt-24">
        <div className="w-full">
          <Slider {...sliderSettings}>
            {/* 통장 배너 */}
            <div>
              <div className="relative bg-[#7BAAF7]/20 backdrop-blur-lg border-y-2 border-white/20 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-12 max-w-7xl mx-auto">
                  <div className="text-left space-y-6">
                    <h1 className="text-6xl text-[#3B4858] font-bold drop-shadow-md">똑개 통장</h1>
                    <p className="text-2xl text-[#3B4858] drop-shadow-md">체크카드 연동 주거래 계좌</p>
                    <p className="text-lg text-[#3B4858] drop-shadow-md">첫 입금 시 현금 3만원 지급</p>
                    <Link
                      to="/account/ddokgae"
                      className="inline-flex items-center justify-center bg-[#478FFF] px-8 py-4 rounded-lg font-semibold hover:bg-[#2f74d6] transition-all shadow-lg border-2 border-[#478FFF] text-lg leading-none"
                    >
                      <span style={{ color: "#fff", lineHeight: 1 }}>통장 개설하기</span>
                    </Link>
                  </div>
                  <div className="relative h-80 rounded-xl overflow-hidden shadow-2xl">
                    <ImageWithFallback
                      src={homeBanner1}
                      alt="똑개 통장"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 대출 배너 */}
            <div>
              <div className="relative bg-[#7BAAF7]/20 backdrop-blur-lg border-y-2 border-white/20 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-12 max-w-7xl mx-auto">
                  <div className="text-left space-y-6">
                    <h1 className="text-6xl text-[#3B4858] font-bold drop-shadow-lg">맞춤형 대출</h1>
                    <p className="text-2xl text-[#3B4858] drop-shadow-md">AI가 분석한 최적의 대출 상품</p>
                    <p className="text-lg text-[#3B4858] drop-shadow-md">연 3.2% ~ 8.5% 특별 금리</p>
                    <Link
                      to="/loan/products"
                      className="inline-flex items-center justify-center bg-[#478FFF] px-8 py-4 rounded-lg font-semibold hover:bg-[#2f74d6] transition-all shadow-lg border-2 border-[#478FFF] text-lg leading-none"
                    >
                      <span style={{ color: "#fff", lineHeight: 1 }}>대출 상담하기</span>
                    </Link>
                  </div>
                  <div className="relative h-80 rounded-xl overflow-hidden shadow-2xl">
                    <ImageWithFallback
                      src={homeBanner2}
                      alt="맞춤형 대출"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 카드 배너 */}
            <div>
              <div className="relative bg-[#7BAAF7]/20 backdrop-blur-lg border-y-2 border-white/20 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-12 max-w-7xl mx-auto">
                  <div className="text-left space-y-6">
                    <h1 className="text-6xl text-[#3B4858] font-bold drop-shadow-lg">똑개 카드</h1>
                    <p className="text-2xl text-[#3B4858] drop-shadow-md">AI 소비 분석 체크카드</p>
                    <p className="text-lg text-[#3B4858] drop-shadow-md">전월 실적 없이 5% 캐시백</p>
                    <Link
                      to="/card/ddokgae"
                      className="inline-flex items-center justify-center bg-[#478FFF] px-8 py-4 rounded-lg font-semibold hover:bg-[#2f74d6] transition-all shadow-lg border-2 border-[#478FFF] text-lg leading-none"
                    >
                      <span style={{ color: "#fff", lineHeight: 1 }}>카드 신청하기</span>
                    </Link>
                  </div>
                  <div className="relative h-80 rounded-xl overflow-hidden shadow-2xl">
                    <ImageWithFallback
                      src={homeBanner3}
                      alt="똑개 카드"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Slider>
        </div>
      </section>

      {/* 주요 서비스 */}
      <section className="py-16 bg-white/5 border-b border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#3B4858] drop-shadow-md">주요 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Link
              to="/account/ddokgae"
              className="p-6 bg-gray-600/40 border-2 border-white/50 rounded-lg hover:shadow-2xl transition-all hover:bg-gray-600/80 text-white"
            >
              <Wallet className="w-12 h-12 text-black mb-4" />
              <h3 className="text-xl font-bold mb-2">똑개 통장</h3>
              <p className="text-blue-100">체크카드 연동 주거래 계좌</p>
            </Link>

            <Link
              to="/loan/products"
              className="p-6 bg-gray-600/40 border-2 border-white/50 rounded-lg hover:shadow-2xl transition-all hover:bg-gray-600/80 text-white"
            >
              <PiggyBank className="w-12 h-12 text-black mb-4" />
              <h3 className="text-xl font-bold mb-2">대출 상품</h3>
              <p className="text-blue-100">맞춤형 대출 솔루션</p>
            </Link>

            <Link
              to="/card/ddokgae"
              className="p-6 bg-gray-600/40 border-2 border-white/50 rounded-lg hover:shadow-2xl transition-all hover:bg-gray-600/80 text-white"
            >
              <CreditCard className="w-12 h-12 text-black mb-4" />
              <h3 className="text-xl font-bold mb-2">똑개 카드</h3>
              <p className="text-blue-100">AI 소비 분석 체크카드</p>
            </Link>

            <Link
              to="/card/spending-analysis"
              className="p-6 bg-gray-600/40 border-2 border-white/50 rounded-lg hover:shadow-2xl transition-all hover:bg-gray-600/80 text-white"
            >
              <TrendingUp className="w-12 h-12 text-black mb-4" />
              <h3 className="text-xl font-bold mb-2">소비 분석</h3>
              <p className="text-blue-100">스마트한 소비 관리</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 특별 혜택 */}
      <section className="py-16 bg-white/5">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#3B4858] drop-shadow-md">이달의 특별 혜택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/15 p-6 rounded-lg shadow-xl border-2 border-white/30">
              <div className="text-blue-300 font-bold text-sm mb-2">신규 고객</div>
              <h3 className="text-xl font-bold mb-2 text-white">통장 개설 이벤트</h3>
              <p className="text-blue-100 mb-4">첫 입금 시 현금 3만원 지급</p>
              <Link to="/account/ddokgae" className="text-blue-300 hover:text-blue-200 hover:underline font-semibold">
                자세히 보기 →
              </Link>
            </div>

            <div className="bg-white/15 p-6 rounded-lg shadow-xl border-2 border-white/30">
              <div className="text-blue-300 font-bold text-sm mb-2">대출</div>
              <h3 className="text-xl font-bold mb-2 text-white">청년 대출 특별 금리</h3>
              <p className="text-blue-100 mb-4">연 2.5% 특별 금리 적용</p>
              <Link to="/loan/products" className="text-blue-300 hover:text-blue-200 hover:underline font-semibold">
                자세히 보기 →
              </Link>
            </div>

            <div className="bg-white/15 p-6 rounded-lg shadow-xl border-2 border-white/30">
              <div className="text-blue-300 font-bold text-sm mb-2">카드</div>
              <h3 className="text-xl font-bold mb-2 text-white">체크카드 캐시백</h3>
              <p className="text-blue-100 mb-4">전월 실적 없이 5% 캐시백</p>
              <Link to="/card/ddokgae" className="text-blue-300 hover:text-blue-200 hover:underline font-semibold">
                자세히 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
