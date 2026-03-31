import { TrendingUp, Shield, Award, ChevronRight } from "lucide-react";
import { Link } from "react-router";

export default function MyCreditScore() {
  const creditScore = 850;
  const maxScore = 1000;
  const scorePercentage = (creditScore / maxScore) * 100;

  const getScoreGrade = (score: number) => {
    if (score >= 900) return { grade: "매우 우수", color: "text-green-300" };
    if (score >= 800) return { grade: "우수", color: "text-blue-300" };
    if (score >= 700) return { grade: "양호", color: "text-yellow-300" };
    return { grade: "보통", color: "text-orange-300" };
  };

  const { grade, color } = getScoreGrade(creditScore);

  const loanLimit = Math.floor(creditScore * 50000); // 간단한 한도 계산

  const recommendedLoans = [
    {
      id: "consumption-loan",
      name: "소비연동형 자동상환 대출",
      rate: "연 3.5%",
      limit: "최대 5,000만원",
      reason: "신용점수가 우수하여 우대 금리 적용 가능",
    },
    {
      id: "youth-loan",
      name: "청년 자기계발 대출",
      rate: "연 2.5%",
      limit: "최대 3,000만원",
      reason: "청년 우대 프로그램으로 특별 금리 제공",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-lg">내 신용점수</h1>

      {/* 신용점수 조회 */}
      <div className="bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-lg text-white rounded-xl shadow-2xl p-8 mb-8 border-2 border-white/30">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8" />
          <h2 className="text-2xl font-bold">신용점수</h2>
        </div>

        <div className="flex items-end gap-4 mb-6">
          <div className="text-6xl font-bold drop-shadow-lg">{creditScore}</div>
          <div className="text-2xl text-blue-100 mb-2">/ {maxScore}</div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className={`font-semibold ${color} drop-shadow-lg`}>{grade}</span>
            <span className="text-blue-100">{scorePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 border border-white/30">
            <div
              className="bg-gradient-to-r from-white to-blue-200 h-3 rounded-full transition-all shadow-lg"
              style={{ width: `${scorePercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/40">
            <p className="text-blue-100 text-sm mb-1">전월 대비</p>
            <p className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-300" />
              +15점
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/40">
            <p className="text-blue-100 text-sm mb-1">조회일</p>
            <p className="text-xl font-bold">2026-03-24</p>
          </div>
        </div>

        <p className="text-sm text-blue-100 mt-4">
          ※ 신용점수는 매월 업데이트되며, 최근 금융거래 내역을 반영합니다
        </p>
      </div>

      {/* 대출 한도 알아보기 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 mb-8 border-2 border-white/30">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <Award className="w-6 h-6 text-white" />
          대출 한도 알아보기
        </h2>

        <div className="bg-white/20 backdrop-blur-sm border-2 border-blue-300/50 p-6 rounded-lg mb-6">
          <p className="text-blue-200 mb-2">현재 신용점수 기준 예상 대출 한도</p>
          <p className="text-4xl font-bold text-white drop-shadow-lg mb-2">
            최대 {loanLimit.toLocaleString()} 원
          </p>
          <p className="text-sm text-blue-100">
            ※ 실제 한도는 소득, 부채, 거래실적 등 종합적으로 평가됩니다
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/40">
            <p className="text-sm text-blue-200 mb-1">신용대출</p>
            <p className="text-xl font-bold text-white">{(loanLimit * 0.5).toLocaleString()} 원</p>
          </div>
          <div className="text-center p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/40">
            <p className="text-sm text-blue-200 mb-1">마이너스 대출</p>
            <p className="text-xl font-bold text-white">{(loanLimit * 0.3).toLocaleString()} 원</p>
          </div>
          <div className="text-center p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/40">
            <p className="text-sm text-blue-200 mb-1">담보대출</p>
            <p className="text-xl font-bold text-white">{(loanLimit * 1.5).toLocaleString()} 원</p>
          </div>
        </div>
      </div>

      {/* 추천 대출 상품 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 border-2 border-white/30">
        <h2 className="text-xl font-bold mb-6 text-white">추천 대출 상품</h2>
        <p className="text-blue-100 mb-6">
          고객님의 신용점수와 프로필에 맞춰 추천하는 대출 상품입니다
        </p>

        <div className="space-y-4">
          {recommendedLoans.map((loan) => (
            <div
              key={loan.id}
              className="bg-white/20 backdrop-blur-sm border-2 border-white/40 p-6 rounded-lg hover:bg-white/30 hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-2 text-white">{loan.name}</h3>
                  <p className="text-sm text-blue-100 mb-3">{loan.reason}</p>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-sm text-blue-200">금리</span>
                      <span className="ml-2 font-bold text-white">{loan.rate}</span>
                    </div>
                    <div>
                      <span className="text-sm text-blue-200">한도</span>
                      <span className="ml-2 font-bold text-white">{loan.limit}</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={`/loan/products/${loan.id}`}
                  className="text-white hover:text-blue-200 font-semibold flex items-center gap-2 transition-colors bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30"
                >
                  상세보기
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/loan/products"
            className="inline-block text-white hover:text-blue-200 font-semibold bg-white/20 backdrop-blur-sm px-6 py-3 rounded-lg hover:bg-white/30 transition-all border border-white/40"
          >
            더 많은 대출 상품 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}