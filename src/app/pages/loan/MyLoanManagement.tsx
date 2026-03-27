import { Calculator, TrendingDown, Calendar } from "lucide-react";
import { useState } from "react";

export default function MyLoanManagement() {
  const [simulationAmount, setSimulationAmount] = useState(100000);

  const loanInfo = {
    totalLoan: 20000000,
    repaid: 5000000,
    remaining: 15000000,
    monthlyPayment: 450000,
    interestRate: 3.5,
    maturityDate: "2028-03-24",
  };

  const calculateSimulation = () => {
    const remaining = loanInfo.remaining - simulationAmount;
    const monthsLeft = Math.ceil(remaining / loanInfo.monthlyPayment);
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsLeft);
    return completionDate.toLocaleDateString("ko-KR");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-lg">내 대출 관리</h1>

      {/* 대출 현황 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 mb-8 border-2 border-white/30">
        <h2 className="text-xl font-bold mb-6 text-white">대출 현황</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-lg border-2 border-blue-300/50">
            <p className="text-sm text-blue-200 mb-2">대출 잔액</p>
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              {loanInfo.remaining.toLocaleString()} 원
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-lg border-2 border-white/50">
            <p className="text-sm text-blue-200 mb-2">차입금</p>
            <p className="text-2xl font-bold text-white">
              {loanInfo.totalLoan.toLocaleString()} 원
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-lg border-2 border-green-300/50">
            <p className="text-sm text-blue-200 mb-2">상환액</p>
            <p className="text-2xl font-bold text-green-300 drop-shadow-lg">
              {loanInfo.repaid.toLocaleString()} 원
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-blue-200">상환 진행률</span>
            <span className="font-semibold text-white">
              {((loanInfo.repaid / loanInfo.totalLoan) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 border border-white/30">
            <div
              className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all shadow-lg"
              style={{ width: `${(loanInfo.repaid / loanInfo.totalLoan) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-4 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/50">
            <div className="bg-blue-500/30 backdrop-blur-sm p-3 rounded-full border border-white/30">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-200">월 상환액</p>
              <p className="text-xl font-bold text-white">{loanInfo.monthlyPayment.toLocaleString()} 원</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-white/50">
            <div className="bg-blue-500/30 backdrop-blur-sm p-3 rounded-full border border-white/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-200">만기일</p>
              <p className="text-xl font-bold text-white">{loanInfo.maturityDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 완납 시뮬레이션 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 border-2 border-white/30">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
          <Calculator className="w-6 h-6 text-white" />
          완납 시뮬레이션
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-3 text-white">추가 상환 금액</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max={loanInfo.remaining}
              step="100000"
              value={simulationAmount}
              onChange={(e) => setSimulationAmount(Number(e.target.value))}
              className="flex-1"
            />
            <input
              type="number"
              value={simulationAmount}
              onChange={(e) => setSimulationAmount(Number(e.target.value))}
              className="w-40 px-4 py-2 bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-blue-200"
            />
            <span className="text-blue-200">원</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-6 rounded-lg border-2 border-white/40">
          <div className="flex justify-between items-center mb-4">
            <span className="text-blue-100">추가 상환 후 남은 잔액</span>
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {(loanInfo.remaining - simulationAmount).toLocaleString()} 원
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-100">예상 완제일</span>
            <span className="text-xl font-bold text-purple-300 drop-shadow-lg">{calculateSimulation()}</span>
          </div>
        </div>

        <button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-lg font-semibold transition-all shadow-lg backdrop-blur-sm border border-white/30">
          추가 상환하기
        </button>

        <p className="text-sm text-blue-200 mt-4 text-center">
          ※ 실제 상환 금액은 이자 계산에 따라 달라질 수 있습니다
        </p>
      </div>
    </div>
  );
}