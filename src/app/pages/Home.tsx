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
      className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-3 text-slate-700 transition-all hover:bg-slate-50"
      aria-label="이전 슬라이드"
    >
      <ChevronLeft className="h-8 w-8" />
    </button>
  );
}

function NextArrow(props: any) {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-3 text-slate-700 transition-all hover:bg-slate-50"
      aria-label="다음 슬라이드"
    >
      <ChevronRight className="h-8 w-8" />
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
      <section className="mt-24">
        <div className="w-full">
          <Slider {...sliderSettings}>
            {/* 통장 배너 */}
            <div>
              <div className="relative border-y border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 p-12 md:grid-cols-2">
                  <div className="text-left space-y-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">Core Account</p>
                    <h1 className="text-6xl font-bold tracking-tight text-slate-900">똑개 통장</h1>
                    <p className="text-2xl text-slate-700">체크카드 연동 주거래 계좌</p>
                    <p className="text-lg text-slate-500">첫 입금 시 현금 3만원 지급</p>
                    <Link
                      to="/account/ddokgae"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 text-lg font-semibold leading-none transition-all hover:bg-slate-800"
                    >
                      <span style={{ color: "#fff", lineHeight: 1 }}>통장 개설하기</span>
                    </Link>
                  </div>
                  <div className="relative h-80 overflow-hidden rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
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
              <div className="relative border-y border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 p-12 md:grid-cols-2">
                  <div className="text-left space-y-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">Loan Products</p>
                    <h1 className="text-6xl font-bold tracking-tight text-slate-900">맞춤형 대출</h1>
                    <p className="text-2xl text-slate-700">AI가 분석한 최적의 대출 상품</p>
                    <p className="text-lg text-slate-500">연 3.2% ~ 8.5% 특별 금리</p>
                    <Link
                      to="/loan/products"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 text-lg font-semibold leading-none transition-all hover:bg-slate-800"
                    >
                      <span style={{ color: "#fff", lineHeight: 1 }}>대출 상담하기</span>
                    </Link>
                  </div>
                  <div className="relative h-80 overflow-hidden rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
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
              <div className="relative border-y border-slate-200 bg-white">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 p-12 md:grid-cols-2">
                  <div className="text-left space-y-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">Card Service</p>
                    <h1 className="text-6xl font-bold tracking-tight text-slate-900">똑개 카드</h1>
                    <p className="text-2xl text-slate-700">AI 소비 분석 체크카드</p>
                    <p className="text-lg text-slate-500">전월 실적 없이 5% 캐시백</p>
                    <Link
                      to="/card/ddokgae"
                      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-8 py-4 text-lg font-semibold leading-none transition-all hover:bg-slate-800"
                    >
                      <span style={{ color: "#fff", lineHeight: 1 }}>카드 신청하기</span>
                    </Link>
                  </div>
                  <div className="relative h-80 overflow-hidden rounded-[28px] shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
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
      <section className="mt-16 border-b border-slate-200 bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">주요 서비스</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Link
              to="/account/ddokgae"
              className="rounded-[28px] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <Wallet className="mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-xl font-bold text-slate-900">똑개 통장</h3>
              <p className="text-slate-500">체크카드 연동 주거래 계좌</p>
            </Link>

            <Link
              to="/loan/products"
              className="rounded-[28px] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <PiggyBank className="mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-xl font-bold text-slate-900">대출 상품</h3>
              <p className="text-slate-500">맞춤형 대출 솔루션</p>
            </Link>

            <Link
              to="/card/ddokgae"
              className="rounded-[28px] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <CreditCard className="mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-xl font-bold text-slate-900">똑개 카드</h3>
              <p className="text-slate-500">AI 소비 분석 체크카드</p>
            </Link>

            <Link
              to="/card/spending-analysis"
              className="rounded-[28px] border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <TrendingUp className="mb-4 h-12 w-12 text-blue-600" />
              <h3 className="mb-2 text-xl font-bold text-slate-900">소비 분석</h3>
              <p className="text-slate-500">스마트한 소비 관리</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 특별 혜택 */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">이달의 특별 혜택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
              <div className="mb-2 text-sm font-bold text-blue-600">신규 고객</div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">통장 개설 이벤트</h3>
              <p className="mb-4 text-slate-500">첫 입금 시 현금 3만원 지급</p>
              <Link to="/account/ddokgae" className="font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                자세히 보기 →
              </Link>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
              <div className="mb-2 text-sm font-bold text-blue-600">대출</div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">청년 대출 특별 금리</h3>
              <p className="mb-4 text-slate-500">연 2.5% 특별 금리 적용</p>
              <Link to="/loan/products" className="font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                자세히 보기 →
              </Link>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
              <div className="mb-2 text-sm font-bold text-blue-600">카드</div>
              <h3 className="mb-2 text-xl font-bold text-slate-900">체크카드 캐시백</h3>
              <p className="mb-4 text-slate-500">전월 실적 없이 5% 캐시백</p>
              <Link to="/card/ddokgae" className="font-semibold text-slate-900 hover:text-blue-600 hover:underline">
                자세히 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
