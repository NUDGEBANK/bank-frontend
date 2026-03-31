import { ShoppingBag, Coffee, Utensils, Smartphone, Bus, TrendingUp } from "lucide-react";

interface Transaction {
  id: number;
  date: string;
  merchant: string;
  category: string;
  amount: number;
  classification: "생필품" | "사치품";
  repaymentAmount: number;
  icon: any;
}

export default function CardHistory() {
  const transactions: Transaction[] = [
    {
      id: 1,
      date: "2026-03-24 14:30",
      merchant: "스타벅스 강남점",
      category: "카페/음료",
      amount: 15000,
      classification: "생필품",
      repaymentAmount: 0,
      icon: Coffee,
    },
    {
      id: 2,
      date: "2026-03-24 12:00",
      merchant: "애플스토어",
      category: "전자기기",
      amount: 1500000,
      classification: "사치품",
      repaymentAmount: 300000,
      icon: Smartphone,
    },
    {
      id: 3,
      date: "2026-03-23 18:20",
      merchant: "올리브영",
      category: "생활용품",
      amount: 45000,
      classification: "생필품",
      repaymentAmount: 0,
      icon: ShoppingBag,
    },
    {
      id: 4,
      date: "2026-03-23 13:15",
      merchant: "백화점 식당가",
      category: "외식",
      amount: 120000,
      classification: "사치품",
      repaymentAmount: 24000,
      icon: Utensils,
    },
    {
      id: 5,
      date: "2026-03-22 08:30",
      merchant: "지하철",
      category: "교통",
      amount: 1250,
      classification: "생필품",
      repaymentAmount: 0,
      icon: Bus,
    },
    {
      id: 6,
      date: "2026-03-21 19:45",
      merchant: "명품관",
      category: "패션/잡화",
      amount: 850000,
      classification: "사치품",
      repaymentAmount: 425000,
      icon: ShoppingBag,
    },
  ];

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalRepayment = transactions.reduce((sum, t) => sum + t.repaymentAmount, 0);
  const essentialSpent = transactions
    .filter((t) => t.classification === "생필품")
    .reduce((sum, t) => sum + t.amount, 0);
  const luxurySpent = transactions
    .filter((t) => t.classification === "사치품")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-lg">카드 이용 내역</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/20 backdrop-blur-lg p-6 rounded-lg shadow-2xl border-2 border-white/40">
          <p className="text-sm text-blue-200 mb-2">이번 달 총 사용</p>
          <p className="text-2xl font-bold text-white">{totalSpent.toLocaleString()} 원</p>
        </div>
        <div className="bg-green-500/20 backdrop-blur-lg p-6 rounded-lg shadow-2xl border-2 border-green-300/50">
          <p className="text-sm text-blue-200 mb-2">생필품 소비</p>
          <p className="text-2xl font-bold text-green-300">{essentialSpent.toLocaleString()} 원</p>
        </div>
        <div className="bg-orange-500/20 backdrop-blur-lg p-6 rounded-lg shadow-2xl border-2 border-orange-300/50">
          <p className="text-sm text-blue-200 mb-2">사치품 소비</p>
          <p className="text-2xl font-bold text-orange-300">{luxurySpent.toLocaleString()} 원</p>
        </div>
        <div className="bg-blue-500/20 backdrop-blur-lg p-6 rounded-lg shadow-2xl border-2 border-blue-300/50">
          <p className="text-sm text-blue-200 mb-2">자동 상환액</p>
          <p className="text-2xl font-bold text-blue-300">{totalRepayment.toLocaleString()} 원</p>
        </div>
      </div>

      {/* 이용 내역 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl border-2 border-white/30">
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">똑개 체크카드 이용 내역</h2>
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <span>AI 분류 기준:</span>
            <span className="bg-green-500/30 backdrop-blur-sm text-green-300 px-2 py-1 rounded border border-green-400/50">생필품</span>
            <span className="bg-orange-500/30 backdrop-blur-sm text-orange-300 px-2 py-1 rounded border border-orange-400/50">사치품</span>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {transactions.map((transaction) => {
            const Icon = transaction.icon;
            return (
              <div key={transaction.id} className="p-6 hover:bg-white/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm border ${
                        transaction.classification === "생필품"
                          ? "bg-green-500/30 border-green-400/50"
                          : "bg-orange-500/30 border-orange-400/50"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          transaction.classification === "생필품"
                            ? "text-green-300"
                            : "text-orange-300"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white">{transaction.merchant}</h3>
                        <span
                          className={`text-xs px-2 py-1 rounded backdrop-blur-sm ${
                            transaction.classification === "생필품"
                              ? "bg-green-500/30 text-green-300 border border-green-400/50"
                              : "bg-orange-500/30 text-orange-300 border border-orange-400/50"
                          }`}
                        >
                          {transaction.classification}
                        </span>
                      </div>
                      <p className="text-sm text-blue-200 mb-2">{transaction.category}</p>
                      <p className="text-xs text-blue-100">{transaction.date}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-white mb-1">
                      {transaction.amount.toLocaleString()} 원
                    </p>
                    {transaction.repaymentAmount > 0 && (
                      <div className="bg-blue-500/30 backdrop-blur-sm border-2 border-blue-400/50 px-3 py-1 rounded">
                        <div className="flex items-center gap-1 text-blue-200">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs font-semibold">
                            상환액 {transaction.repaymentAmount.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI 분류 설명 */}
                {transaction.classification === "사치품" && transaction.repaymentAmount > 0 && (
                  <div className="mt-4 ml-16 bg-blue-500/20 backdrop-blur-sm border-l-4 border-blue-400 p-3 text-sm">
                    <p className="text-blue-100">
                      <strong>AI 분석:</strong> 해당 소비는 사치품으로 분류되어 결제 금액의{" "}
                      {((transaction.repaymentAmount / transaction.amount) * 100).toFixed(0)}%
                      가 대출 상환에 자동 적용되었습니다.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 정보 안내 */}
      <div className="mt-8 bg-white/15 backdrop-blur-lg border-2 border-white/30 p-6 rounded-lg shadow-xl">
        <h3 className="font-bold mb-3 text-white">AI 분류 안내</h3>
        <ul className="space-y-2 text-sm text-blue-100">
          <li className="flex items-start gap-2">
            <span className="text-blue-300">•</span>
            <span>
              <strong>생필품:</strong> 식료품, 생활용품, 교통비, 의료비, 교육비 등 일상적인 필수
              소비
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-300">•</span>
            <span>
              <strong>사치품:</strong> 고가 전자기기, 명품, 유흥비, 고급 외식 등 선택적 소비
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-300">•</span>
            <span>AI가 자동으로 분류하며, 필요 시 고객센터를 통해 재분류 요청이 가능합니다</span>
          </li>
        </ul>
      </div>
    </div>
  );
}