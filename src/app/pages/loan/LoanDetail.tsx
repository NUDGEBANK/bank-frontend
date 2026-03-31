import { useParams, Link } from "react-router";
import { Percent, Users, Coins, Calendar, AlertCircle, FileText, Info } from "lucide-react";

const loanDetails = {
  "consumption-loan": {
    name: "소비연동형 자동상환 대출",
    description: "AI 기술로 소비 패턴을 분석하여 자동으로 대출을 상환하는 혁신적인 대출 상품",
    features: [
      "AI 소비 분석을 통한 맞춤형 상환 계획",
      "생필품 소비는 자동 상환 제외",
      "사치품 소비 시 자동으로 일부 상환",
      "신용점수 관리에 도움",
    ],
    target: "만 19세 이상 개인 고객",
    limit: "최소 500만원 ~ 최대 5,000만원",
    period: "1년 ~ 5년 (12개월 단위)",
    rate: "연 3.5% ~ 7.5% (고객 신용도에 따라 차등 적용)",
  },
  "youth-loan": {
    name: "청년 자기계발 대출",
    description: "청년의 미래를 응원하는 특별 금리 대출 상품",
    features: [
      "만 34세 이하 청년 전용 특별 금리",
      "교육비, 자격증, 어학 연수 등 자기계발 용도",
      "1년 거치 후 원리금 균등 상환",
      "중도 상환 수수료 면제",
    ],
    target: "만 19세 ~ 만 34세 청년",
    limit: "최소 300만원 ~ 최대 3,000만원",
    period: "1년 ~ 3년 (거치 기간 1년 포함)",
    rate: "연 2.5% ~ 4.5% (청년 우대 금리 적용)",
  },
};

export default function LoanDetail() {
  const { productId } = useParams<{ productId: string }>();
  const product = loanDetails[productId as keyof typeof loanDetails];

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center bg-white/95 backdrop-blur-md p-8 rounded-lg shadow-2xl border border-white/20">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">상품을 찾을 수 없습니다</h1>
          <Link to="/loan/products" className="text-blue-600 hover:underline font-semibold">
            대출 상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* 상품명 */}
      <div className="mb-8">
        <Link to="/loan/products" className="text-blue-300 hover:text-white mb-4 inline-block font-semibold transition-colors">
          ← 대출 상품 목록
        </Link>
        <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">{product.name}</h1>
        <p className="text-xl text-blue-100 drop-shadow-md">{product.description}</p>
      </div>

      {/* 주요 정보 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-lg shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">특징</h3>
          </div>
          <p className="text-gray-600 text-sm">{product.features.length}가지 혜택</p>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-lg shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">대상</h3>
          </div>
          <p className="text-gray-600 text-sm">{product.target}</p>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-lg shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded">
              <Coins className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">한도</h3>
          </div>
          <p className="text-gray-600 text-sm">{product.limit}</p>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-6 rounded-lg shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">기간</h3>
          </div>
          <p className="text-gray-600 text-sm">{product.period}</p>
        </div>
      </div>

      {/* 상담 신청 버튼 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg mb-8 text-center shadow-2xl backdrop-blur-md border border-white/20">
        <h3 className="text-2xl font-bold mb-2">지금 바로 상담 신청하세요</h3>
        <p className="mb-6 text-blue-100">전문 상담사가 맞춤 상담을 제공합니다</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg">
          상담 신청하기
        </button>
      </div>

      {/* 탭 섹션 */}
      <div className="bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/20">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button className="px-6 py-4 font-semibold text-blue-600 border-b-2 border-blue-600">
              상품안내
            </button>
            <button className="px-6 py-4 font-semibold text-gray-500 hover:text-gray-700">
              금리안내
            </button>
            <button className="px-6 py-4 font-semibold text-gray-500 hover:text-gray-700">
              약관 및 상품설명서
            </button>
            <button className="px-6 py-4 font-semibold text-gray-500 hover:text-gray-700">
              유의사항 및 기타
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* 상품안내 */}
          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Info className="w-5 h-5 text-blue-600" />
              상품 특징
            </h3>
            <ul className="space-y-3">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2"></div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 금리안내 */}
          <section className="mb-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <Percent className="w-5 h-5 text-blue-600" />
              금리 정보
            </h3>
            <div className="bg-gray-50/80 backdrop-blur-sm p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-700">기본 금리</span>
                <span className="font-bold text-xl text-gray-900">{product.rate}</span>
              </div>
              <p className="text-sm text-gray-600">
                ※ 실제 적용 금리는 고객님의 신용도, 거래실적 등에 따라 달라질 수 있습니다.
              </p>
            </div>
          </section>

          {/* 유의사항 */}
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
              <FileText className="w-5 h-5 text-blue-600" />
              유의사항
            </h3>
            <div className="bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 p-6 rounded-lg">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 대출 실행 후 중도상환 시 수수료가 발생할 수 있습니다.</li>
                <li>• 개인 신용평점이 하락할 수 있으니 신중하게 이용하시기 바랍니다.</li>
                <li>• 과도한 대출은 개인신용평점 하락의 원인이 될 수 있습니다.</li>
                <li>• 귀하의 신용등급 또는 개인신용평점이 하락할 수 있습니다.</li>
                <li>• 연체 시 신용등급 또는 개인신용평점이 하락할 수 있습니다.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
