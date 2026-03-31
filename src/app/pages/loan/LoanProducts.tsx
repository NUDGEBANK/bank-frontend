import { Link } from "react-router";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import backgroundImg from "figma:asset/a1fdfd62e9258f5117d1a2174261b21bd02d7d66.png";

const loanProducts = [
  {
    id: "consumption-loan",
    name: "소비연동형 자동상환 대출",
    badge: "피커금리",
    rateMin: "3.2",
    rateMax: "8.5",
    limit: "3억원",
    period: "1년 ~ 10년",
    available: "5분 이내",
    features: ["중도상환수수료 없음", "대출 심사약 24시간", "우대금 선정"],
    isFeatured: true,
  },
  {
    id: "youth-loan",
    name: "맛살론15",
    rateMin: "15.9",
    rateMax: null,
    limit: null,
    features: ["최대 2천만원", "서민금융진흥원"],
    isFeatured: false,
  },
  {
    id: "situate-loan",
    name: "시잇트2",
    rateMin: "4.5",
    rateMax: "14.9",
    limit: null,
    features: ["최대 3천만원", "서울보증보험"],
    isFeatured: false,
  },
];

export default function LoanProducts() {
  const featuredProduct = loanProducts.find((p) => p.isFeatured);
  const otherProducts = loanProducts.filter((p) => !p.isFeatured);

  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 py-12 relative">
        {/* 헤더 */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-3 shadow-lg border-2 border-white/30">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">고객님께 딱 맞는 대출 상품을 찾았습니다</h1>
          </div>
          <p className="text-xl text-blue-100 ml-16 drop-shadow-lg">3개의 맞춤 상품을 추천드립니다</p>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 추천 상품 (큰 카드) */}
          {featuredProduct && (
            <div className="lg:col-span-2 bg-white/15 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-2 border-white/30">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      {featuredProduct.name}
                    </h2>
                    {featuredProduct.badge && (
                      <span className="bg-blue-500/30 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md border border-white/30">
                        {featuredProduct.badge}
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="text-5xl font-bold text-blue-300 mb-2">
                      연 {featuredProduct.rateMin}%
                      {featuredProduct.rateMax && ` ~ ${featuredProduct.rateMax}%`}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-blue-200 mb-1">최대 한도</p>
                      <p className="font-bold text-white">{featuredProduct.limit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-200 mb-1">상환 방법</p>
                      <p className="font-bold text-white">{featuredProduct.period}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-200 mb-1">신청 가능+</p>
                      <p className="font-bold text-white">{featuredProduct.available}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {featuredProduct.features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm border border-white/20"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3D 그래픽 영역 */}
                <div className="relative w-64 h-64 flex-shrink-0 ml-6">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-32 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 rounded-[40%_60%_70%_30%/60%_30%_70%_40%] shadow-2xl opacity-90 blur-sm"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-28 bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 rounded-[60%_40%_30%_70%/40%_70%_30%_60%] shadow-xl"></div>
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  to={`/loan/products/${featuredProduct.id}`}
                  className="flex-1 bg-white/10 backdrop-blur-sm text-white py-4 rounded-xl font-bold text-center hover:bg-white/20 transition-all shadow-sm border border-white/30"
                >
                  상세 보기
                </Link>
                <button className="flex-1 bg-blue-500/30 backdrop-blur-sm text-white py-4 rounded-xl font-bold hover:bg-blue-500/40 transition-all shadow-md border border-white/30">
                  대출 신청하기
                </button>
              </div>
            </div>
          )}

          {/* 다른 상품들 (작은 카드) */}
          <div className="space-y-6">
            {otherProducts.map((product) => (
              <div key={product.id} className="bg-white/15 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border-2 border-white/30">
                <h3 className="text-xl font-bold text-white mb-4">{product.name}</h3>
                <div className="text-3xl font-bold text-blue-300 mb-4">
                  연 {product.rateMin}%
                  {product.rateMax && ` ~ ${product.rateMax}%`}
                </div>
                <div className="space-y-2 mb-6">
                  {product.features.map((feature, index) => (
                    <p key={index} className="text-sm text-blue-200">
                      {feature}
                    </p>
                  ))}
                </div>
                <Link
                  to={`/loan/products/${product.id}`}
                  className="block w-full bg-white/10 backdrop-blur-sm text-white py-3 rounded-xl font-bold text-center hover:bg-white/20 transition-all shadow-sm border border-white/30"
                >
                  상세 보기
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 네비게이션 */}
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/20 border border-white/30">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">다시 상담하기</span>
          </button>

          <div className="flex gap-6 text-sm text-blue-100">
            <a href="#" className="hover:text-white transition-colors">
              이용약관
            </a>
            <a href="#" className="hover:text-white transition-colors">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-white transition-colors">
              상품공시실
            </a>
            <a href="#" className="hover:text-white transition-colors">
              고객센터
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-blue-200 text-sm">
          © 2025 똑개뱅크. All rights reserved.
        </div>
      </div>
    </div>
  );
}
