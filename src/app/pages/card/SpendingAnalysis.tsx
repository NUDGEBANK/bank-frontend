import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { TrendingUp, AlertTriangle, Bell, BellOff } from "lucide-react";
import { useState } from "react";

export default function SpendingAnalysis() {
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(2000000);

  // 카테고리별 소비 데이터
  const categoryData = [
    { name: "식비", value: 450000, color: "#3b82f6" },
    { name: "쇼핑", value: 850000, color: "#8b5cf6" },
    { name: "교통", value: 120000, color: "#10b981" },
    { name: "문화/여가", value: 320000, color: "#f59e0b" },
    { name: "생활", value: 280000, color: "#ec4899" },
    { name: "기타", value: 510250, color: "#6b7280" },
  ];

  // 월별 소비 트렌드
  const monthlyData = [
    { month: "10월", 생필품: 800000, 사치품: 500000 },
    { month: "11월", 생필품: 850000, 사치품: 650000 },
    { month: "12월", 생필품: 900000, 사치품: 1200000 },
    { month: "1월", 생필품: 750000, 사치품: 400000 },
    { month: "2월", 생필품: 820000, 사치품: 550000 },
    { month: "3월", 생필품: 881250, 사치품: 1649000 },
  ];

  const totalSpending = categoryData.reduce((sum, item) => sum + item.value, 0);
  const averageMonthly = monthlyData.reduce((sum, item) => sum + item.생필품 + item.사치품, 0) / monthlyData.length;
  const currentMonthSpending = monthlyData[monthlyData.length - 1].생필품 + monthlyData[monthlyData.length - 1].사치품;
  const isOverspending = currentMonthSpending > averageMonthly;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-lg">소비 분석</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/20 backdrop-blur-lg p-6 rounded-lg shadow-2xl border-2 border-white/40">
          <p className="text-sm text-blue-200 mb-2">이번 달 총 소비</p>
          <p className="text-2xl font-bold text-white">{totalSpending.toLocaleString()} 원</p>
        </div>
        <div className="bg-white/20 backdrop-blur-lg p-6 rounded-lg shadow-2xl border-2 border-white/40">
          <p className="text-sm text-blue-200 mb-2">월 평균 소비</p>
          <p className="text-2xl font-bold text-white">{Math.round(averageMonthly).toLocaleString()} 원</p>
        </div>
        <div className="bg-white/20 backdrop-blur-lg p-6 rounded-lg shadow-2xl border-2 border-white/40">
          <p className="text-sm text-blue-200 mb-2">전월 대비</p>
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${isOverspending ? "text-red-400" : "text-green-400"}`} />
            <p className={`text-2xl font-bold ${isOverspending ? "text-red-400" : "text-green-400"}`}>
              {isOverspending ? "+" : ""}
              {(((currentMonthSpending - averageMonthly) / averageMonthly) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-lg p-6 rounded-lg shadow-2xl border-2 border-white/40">
          <p className="text-sm text-blue-200 mb-2">가장 많이 쓴 항목</p>
          <p className="text-2xl font-bold text-purple-300">쇼핑</p>
        </div>
      </div>

      {/* 과소비 경고 */}
      {isOverspending && (
        <div className="bg-red-500/20 backdrop-blur-lg border-l-4 border-red-400 p-6 rounded-lg mb-8 flex items-start gap-4 shadow-xl border-2 border-red-400/50">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-red-300 mb-1">과소비 경고</h3>
            <p className="text-red-200">
              이번 달 소비가 평균보다{" "}
              {(currentMonthSpending - averageMonthly).toLocaleString()}원 많습니다.
              특히 사치품 소비를 줄여보는 것은 어떨까요?
            </p>
          </div>
        </div>
      )}

      {/* 카테고리별 소비 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 mb-8 border-2 border-white/30">
        <h2 className="text-xl font-bold mb-6 text-white">카테고리별 소비 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 파이 차트 */}
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 border-2 border-white/40">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} 원`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 카테고리 리스트 */}
          <div className="space-y-3">
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/40">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="font-semibold text-white">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{category.value.toLocaleString()} 원</p>
                  <p className="text-sm text-blue-200">
                    {((category.value / totalSpending) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 월별 소비 트렌드 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 mb-8 border-2 border-white/30">
        <h2 className="text-xl font-bold mb-6 text-white">월별 소비 트렌드</h2>
        <div className="bg-white/20 backdrop-blur-md rounded-lg p-4 border-2 border-white/40">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toLocaleString()} 원`} />
              <Legend />
              <Bar dataKey="생필품" fill="#10b981" />
              <Bar dataKey="사치품" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 소비 인사이트 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 mb-8 border-2 border-white/30">
        <h2 className="text-xl font-bold mb-6 text-white">소비 인사이트</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-2 border-blue-300/50 bg-blue-500/20 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="font-bold text-blue-300 mb-2">👍 잘하고 있어요</h3>
            <p className="text-sm text-blue-100">
              생필품 소비는 적정 수준을 유지하고 있습니다. 이대로 유지하세요!
            </p>
          </div>
          <div className="border-2 border-orange-300/50 bg-orange-500/20 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="font-bold text-orange-300 mb-2">⚠️ 주의하세요</h3>
            <p className="text-sm text-orange-100">
              쇼핑 항목의 사치품 소비가 증가하고 있습니다. 계획적인 소비를 권장합니다.
            </p>
          </div>
          <div className="border-2 border-green-300/50 bg-green-500/20 backdrop-blur-sm p-6 rounded-lg">
            <h3 className="font-bold text-green-300 mb-2">💡 팁</h3>
            <p className="text-sm text-green-100">
              대출 자동 상환으로 이번 달 749,000원을 상환했습니다. 신용 관리에 도움이 됩니다!
            </p>
          </div>
        </div>
      </div>

      {/* 과소비 경고 알림 설정 */}
      <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 border-2 border-white/30">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">과소비 경고 알림 설정</h2>
          <button
            onClick={() => setAlertEnabled(!alertEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors backdrop-blur-sm ${
              alertEnabled
                ? "bg-blue-500/80 text-white hover:bg-blue-600/80 border border-white/40"
                : "bg-white/20 text-white hover:bg-white/30 border border-white/40"
            }`}
          >
            {alertEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            {alertEnabled ? "알림 켜짐" : "알림 꺼짐"}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">월간 소비 한도 설정</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1000000"
                max="5000000"
                step="100000"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                className="flex-1"
                disabled={!alertEnabled}
              />
              <input
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(Number(e.target.value))}
                className="w-40 px-4 py-2 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 disabled:bg-white/10 text-white placeholder-blue-200"
                disabled={!alertEnabled}
              />
              <span className="text-blue-200">원</span>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/40">
            <p className="text-sm text-blue-100">
              {alertEnabled ? (
                <>
                  현재 소비 금액({totalSpending.toLocaleString()}원)이 설정한 한도(
                  {alertThreshold.toLocaleString()}원)
                  {totalSpending > alertThreshold ? "를 초과했습니다" : "내에 있습니다"}.
                </>
              ) : (
                "알림이 꺼져있습니다. 과소비 경고를 받으려면 알림을 켜주세요."
              )}
            </p>
          </div>

          <div className="border-t border-white/20 pt-4">
            <h3 className="font-semibold mb-2 text-white">알림 발송 조건</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li className="flex items-start gap-2">
                <span className="text-blue-300">•</span>
                <span>월간 소비가 설정한 한도를 초과할 때</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-300">•</span>
                <span>사치품 소비가 급증할 때</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-300">•</span>
                <span>전월 대비 소비가 30% 이상 증가할 때</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
