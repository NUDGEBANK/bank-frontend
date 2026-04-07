import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

export default function DdokgaeAccount() {
  const transactions = [
    { id: 1, type: "결제", amount: -15000, balance: 350000, merchant: "카페 스타벅스", date: "2026-03-24 14:30" },
    { id: 2, type: "상환", amount: 10000, balance: 365000, merchant: "자동상환", date: "2026-03-24 12:00" },
    { id: 3, type: "결제", amount: -45000, balance: 355000, merchant: "올리브영", date: "2026-03-23 18:20" },
    { id: 4, type: "입금", amount: 1000000, balance: 400000, merchant: "월급", date: "2026-03-20 09:00" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">똑개 통장</h1>

        {/* 계좌 카드 */}
        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="mb-2 text-slate-500">똑개 체크카드 연동 계좌</p>
              <p className="text-sm text-slate-400">123-456-789012</p>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">메인 계좌</div>
          </div>
          
          <div className="mb-6">
            <p className="mb-1 text-sm text-slate-500">잔액</p>
            <p className="text-4xl font-bold text-slate-900">350,000 원</p>
          </div>

          <div className="flex gap-3">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 font-semibold text-white transition-all hover:bg-slate-800">
              <ArrowUpRight className="w-5 h-5" />
              송금
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50">
              <ArrowDownLeft className="w-5 h-5" />
              입금
            </button>
          </div>
        </div>

        {/* 거래 내역 */}
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-900">거래 내역</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 transition-colors hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                        transaction.amount > 0 ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
                      }`}
                    >
                      {transaction.amount > 0 ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-rose-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{transaction.merchant}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{transaction.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        transaction.amount > 0 ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount.toLocaleString()} 원
                    </p>
                    <p className="text-sm text-slate-400">잔액 {transaction.balance.toLocaleString()} 원</p>
                  </div>
                </div>
                {transaction.type === "상환" && (
                  <div className="mt-2 ml-14 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
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
