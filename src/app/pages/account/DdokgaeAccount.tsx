import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

export default function DdokgaeAccount() {
  const transactions = [
    { id: 1, type: "결제", amount: -15000, balance: 350000, merchant: "카페 스타벅스", date: "2026-03-24 14:30" },
    { id: 2, type: "상환", amount: 10000, balance: 365000, merchant: "자동상환", date: "2026-03-24 12:00" },
    { id: 3, type: "결제", amount: -45000, balance: 355000, merchant: "올리브영", date: "2026-03-23 18:20" },
    { id: 4, type: "입금", amount: 1000000, balance: 400000, merchant: "월급", date: "2026-03-20 09:00" },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-lg">똑개 통장</h1>

        {/* 계좌 카드 */}
        <div className="bg-white/15 backdrop-blur-lg text-white p-8 rounded-xl shadow-2xl mb-8 border-2 border-white/30">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-100 mb-2">똑개 체크카드 연동 계좌</p>
              <p className="text-sm text-blue-200">123-456-789012</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm border border-white/30">메인 계좌</div>
          </div>
          
          <div className="mb-6">
            <p className="text-blue-100 text-sm mb-1">잔액</p>
            <p className="text-4xl font-bold">350,000 원</p>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-white/90 text-blue-600 py-3 rounded-lg font-semibold hover:bg-white transition-all shadow-md flex items-center justify-center gap-2 border border-white/40">
              <ArrowUpRight className="w-5 h-5" />
              송금
            </button>
            <button className="flex-1 bg-white/20 backdrop-blur-sm text-white py-3 rounded-lg font-semibold hover:bg-white/30 transition-all shadow-md flex items-center justify-center gap-2 border-2 border-white/40">
              <ArrowDownLeft className="w-5 h-5" />
              입금
            </button>
          </div>
        </div>

        {/* 거래 내역 */}
        <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl border-2 border-white/30">
          <div className="p-6 border-b border-white/30">
            <h2 className="text-xl font-bold text-white">거래 내역</h2>
          </div>
          <div className="divide-y divide-white/20">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border-2 ${
                        transaction.amount > 0 ? "bg-green-500/20 border-green-400/50" : "bg-red-500/20 border-red-400/50"
                      }`}
                    >
                      {transaction.amount > 0 ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-300" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{transaction.merchant}</p>
                      <div className="flex items-center gap-2 text-sm text-blue-200">
                        <Clock className="w-3 h-3" />
                        <span>{transaction.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        transaction.amount > 0 ? "text-green-300" : "text-white"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toLocaleString()} 원
                    </p>
                    <p className="text-sm text-blue-200">잔액 {transaction.balance.toLocaleString()} 원</p>
                  </div>
                </div>
                {transaction.type === "상환" && (
                  <div className="mt-2 ml-14 bg-blue-400/20 backdrop-blur-sm border-2 border-blue-300/40 px-3 py-2 rounded text-sm text-blue-100">
                    자동상환 적용
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
