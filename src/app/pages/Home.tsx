import { Link } from "react-router";
import { BadgeCent, ChartColumn, ChevronLeft, ChevronRight, CreditCard, HandCoins } from "lucide-react";
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
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/50 bg-white/70 p-3 text-slate-700 transition hover:bg-white/85"
          aria-label="이전 슬라이드"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>
  );
}

function NextArrow(props: any) {
  const { onClick } = props;
  return (
      <button
          onClick={onClick}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/50 bg-white/70 p-3 text-slate-700 transition hover:bg-white/85"
          aria-label="다음 슬라이드"
      >
        <ChevronRight className="h-7 w-7" />
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
                <div className="relative border-y border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#f2f7ff_100%)]">
                  <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-8 py-11 md:grid-cols-2 md:px-10">
                    <div className="max-w-xl text-left space-y-5">
                      <h1 className="text-[40px] font-bold tracking-tight text-slate-800">똑개 통장</h1>
                      <p className="text-[20px] text-slate-600">체크카드 연동 주거래 계좌</p>
                      <p className="text-[15px] leading-7 text-slate-500">
                        생활 자금을 관리하기 좋은 기본 계좌입니다. 첫 입금 고객에게는 현금 3만원 혜택을 제공합니다.
                      </p>
                      <Link
                          to="/account/ddokgae"
                          className="inline-flex items-center justify-center rounded-lg bg-[#2a4b78] px-7 py-3.5 text-base font-semibold leading-none text-white transition hover:bg-[#223f64]"
                      >
                        <span style={{ color: "#fff", lineHeight: 1 }}>통장 개설하기</span>
                      </Link>
                    </div>
                    <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
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
                <div className="relative border-y border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#f1f5ff_100%)]">
                  <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-8 py-11 md:grid-cols-2 md:px-10">
                    <div className="max-w-xl text-left space-y-5">
                      <h1 className="text-[40px] font-bold tracking-tight text-slate-800">맞춤형 대출</h1>
                      <p className="text-[20px] text-slate-600">상황에 맞춰 비교하는 대출 상품</p>
                      <p className="text-[15px] leading-7 text-slate-500">
                        주요 상품의 한도와 금리를 비교하고, 현재 조건에 맞는 대출을 차분하게 검토할 수 있습니다.
                      </p>
                      <Link
                          to="/loan/products"
                          className="inline-flex items-center justify-center rounded-lg bg-[#2a4b78] px-7 py-3.5 text-base font-semibold leading-none text-white transition hover:bg-[#223f64]"
                      >
                        <span style={{ color: "#fff", lineHeight: 1 }}>대출 상담하기</span>
                      </Link>
                    </div>
                    <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
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
                <div className="relative border-y border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#f1f6ff_100%)]">
                  <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-8 py-11 md:grid-cols-2 md:px-10">
                    <div className="max-w-xl text-left space-y-5">
                      <h1 className="text-[40px] font-bold tracking-tight text-slate-800">똑개 카드</h1>
                      <p className="text-[20px] text-slate-600">AI 소비 분석 체크카드</p>
                      <p className="text-[15px] leading-7 text-slate-500">
                        전월 실적 부담 없이 생활 소비를 관리하고, 소비 흐름을 함께 확인할 수 있는 체크카드입니다.
                      </p>
                      <Link
                          to="/card/ddokgae"
                          className="inline-flex items-center justify-center rounded-lg bg-[#2a4b78] px-7 py-3.5 text-base font-semibold leading-none text-white transition hover:bg-[#223f64]"
                      >
                        <span style={{ color: "#fff", lineHeight: 1 }}>카드 신청하기</span>
                      </Link>
                    </div>
                    <div className="relative h-80 overflow-hidden rounded-2xl border border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
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
        <section className="mt-16 border-b border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-800">주요 서비스</h2>
              <p className="mt-3 text-base text-slate-500">자주 사용하는 기능을 한 화면에서 바로 이동할 수 있습니다.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <Link
                    to="/deposit/products"
                    className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.08)]"
                >
                  <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                    <BadgeCent className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                <h3 className="mb-2 text-xl font-bold">예적금 상품</h3>
                <p className="text-sm leading-6 text-slate-500">현재 가입 가능한 예금과 적금 상품을 바로 확인</p>
                </Link>

              <Link
                  to="/loan/products"
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.08)]"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <HandCoins className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h3 className="mb-2 text-xl font-bold">대출 상품</h3>
                <p className="text-sm leading-6 text-slate-500">상황에 맞게 비교할 수 있는 주요 대출 상품</p>
              </Link>

              <Link
                  to="/card/ddokgae"
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.08)]"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h3 className="mb-2 text-xl font-bold">똑개 카드</h3>
                <p className="text-sm leading-6 text-slate-500">AI 소비 분석을 바탕으로 설계한 체크카드</p>
              </Link>

              <Link
                  to="/card/spending-analysis"
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.08)]"
              >
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <ChartColumn className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <h3 className="mb-2 text-xl font-bold">소비 분석</h3>
                <p className="text-sm leading-6 text-slate-500">월별 소비 흐름과 카테고리 패턴을 한눈에 확인</p>
              </Link>
            </div>
          </div>
        </section>

        {/* 특별 혜택 */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-800">이달의 특별 혜택</h2>
              <p className="mt-3 text-base text-slate-500">이번 달에 바로 확인할 수 있는 핵심 혜택만 모았습니다.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-2 text-sm font-semibold text-slate-400">신규 고객</div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">예적금 둘러보기</h3>
                <p className="mb-4 text-sm leading-6 text-slate-500">현재 가입 가능한 예금과 적금 상품을 한 번에 확인할 수 있습니다.</p>
                <Link to="/deposit/products" className="font-semibold text-[#478FFF] hover:text-[#2f74d6]">
                  자세히 보기 →
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-2 text-sm font-semibold text-slate-400">대출</div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">청년 대출 특별 금리</h3>
                <p className="mb-4 text-sm leading-6 text-slate-500">대상 조건을 충족하면 특별 금리 구간을 확인할 수 있습니다.</p>
                <Link to="/loan/products" className="font-semibold text-[#478FFF] hover:text-[#2f74d6]">
                  자세히 보기 →
                </Link>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <div className="mb-2 text-sm font-semibold text-slate-400">카드</div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">체크카드 캐시백</h3>
                <p className="mb-4 text-sm leading-6 text-slate-500">전월 실적 없이도 주요 가맹점 캐시백 혜택을 제공합니다.</p>
                <Link to="/card/ddokgae" className="font-semibold text-[#478FFF] hover:text-[#2f74d6]">
                  자세히 보기 →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
  );
}
