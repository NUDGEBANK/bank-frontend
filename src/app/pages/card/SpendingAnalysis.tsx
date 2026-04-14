import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryDatum = {
  name: string;
  value: number;
  color: string;
};

type MonthlyDatum = {
  month: string;
  essential: number;
  discretionary: number;
};

const asOfDate = new Date("2026-04-24T00:00:00");
const daysInMonth = 30;
const elapsedDays = asOfDate.getDate();

const categoryData: CategoryDatum[] = [
  { name: "생활비", value: 450000, color: "#2563eb" },
  { name: "쇼핑", value: 850000, color: "#4f46e5" },
  { name: "교통", value: 120000, color: "#0f766e" },
  { name: "문화·여가", value: 320000, color: "#64748b" },
  { name: "식비", value: 280000, color: "#3b82f6" },
  { name: "기타", value: 510250, color: "#94a3b8" },
];

const monthlyData: MonthlyDatum[] = [
  { month: "10월", essential: 800000, discretionary: 500000 },
  { month: "11월", essential: 850000, discretionary: 650000 },
  { month: "12월", essential: 900000, discretionary: 1200000 },
  { month: "1월", essential: 750000, discretionary: 400000 },
  { month: "2월", essential: 820000, discretionary: 550000 },
  { month: "3월", essential: 881250, discretionary: 1649000 },
];

function formatAmount(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function SpendingAnalysis() {
  const [isMonthlyInsightOpen, setIsMonthlyInsightOpen] = useState(false);
  const [isAnalysisInsightOpen, setIsAnalysisInsightOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isCategoryStatsOpen, setIsCategoryStatsOpen] = useState(false);
  const [isMonthlyFlowOpen, setIsMonthlyFlowOpen] = useState(false);

  const totalSpending = categoryData.reduce((sum, item) => sum + item.value, 0);
  const sortedCategoryData = [...categoryData].sort((left, right) => right.value - left.value);
  const topCategory = sortedCategoryData[0];

  const monthlyTotals = monthlyData.map((item) => ({
    ...item,
    total: item.essential + item.discretionary,
  }));

  if (monthlyTotals.length < 2) {
    return <div>데이터가 부족합니다.</div>;
  }

  const currentMonth = monthlyTotals[monthlyTotals.length - 1];
  const previousMonth = monthlyTotals[monthlyTotals.length - 2];
  const currentMonthSpending = currentMonth.total;
  const previousMonthSpending = previousMonth.total;
  const recentThreeMonthAverage = Math.round(
    monthlyTotals.slice(-3).reduce((sum, item) => sum + item.total, 0) / 3,
  );
  const sixMonthAverage = Math.round(
    monthlyTotals.reduce((sum, item) => sum + item.total, 0) / monthlyTotals.length,
  );

  const monthOverMonthDiff = currentMonthSpending - previousMonthSpending;
  const monthOverMonthRate =
    previousMonthSpending === 0 ? 0 : (monthOverMonthDiff / previousMonthSpending) * 100;
  const averageDiff = currentMonthSpending - sixMonthAverage;
  const averageDiffRate = sixMonthAverage === 0 ? 0 : (averageDiff / sixMonthAverage) * 100;
  const projectedMonthEndSpending = Math.round((currentMonthSpending / elapsedDays) * daysInMonth);
  const fixedSpendingRatio = currentMonthSpending === 0
      ? 0
      : Math.round((currentMonth.essential / currentMonthSpending) * 100);
  const variableSpendingRatio = 100 - fixedSpendingRatio;
  const recommendedCutAmount = Math.round(topCategory.value * 0.18);
  const isAboveAverage = averageDiff > 0;
  const toggleIconClass =
    "flex items-center justify-center p-0 text-slate-400 transition hover:text-slate-600";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
            Spending Analysis
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">소비 분석</h1>
          <p className="mt-2 text-sm text-slate-500">
            월별 소비 흐름과 카테고리 비중을 바탕으로 현재 소비 상태를 해석합니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,_rgba(219,234,254,0.95)_0%,_rgba(239,246,255,0.98)_48%,_rgba(248,250,252,1)_100%)] px-5 py-5 text-slate-900 shadow-[0_20px_45px_rgba(148,163,184,0.18)]">
              <p className="text-xs tracking-[0.12em] text-sky-700/70">이번 달 총소비</p>
              <p className="mt-3 text-3xl font-semibold">{formatAmount(totalSpending)}</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">6개월 평균 소비</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                {formatAmount(sixMonthAverage)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/90 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">전월 대비</p>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">
                  {monthOverMonthRate > 0 ? "+" : ""}
                  {monthOverMonthRate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">가장 큰 소비 항목</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">{topCategory.name}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setIsMonthlyInsightOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900">이번 달 소비 해석</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    단순 합계가 아니라 전월과 평균 기준에서 현재 흐름을 해석합니다.
                  </p>
                </div>
                <span className={toggleIconClass}>
                  {isMonthlyInsightOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isMonthlyInsightOpen && (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <article className="flex min-h-[168px] flex-col rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
                    <p className="text-sm font-medium text-slate-500">전월 대비 변화</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {monthOverMonthDiff > 0 ? "+" : "-"}
                      {formatAmount(Math.abs(monthOverMonthDiff))}
                    </p>
                    <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                      지난달보다{" "}
                      <span className="font-semibold text-slate-800">
                        {monthOverMonthDiff > 0 ? "지출이 늘었습니다." : "지출이 줄었습니다."}
                      </span>
                    </p>
                  </article>

                  <article className="flex min-h-[168px] flex-col rounded-2xl border border-indigo-100 bg-indigo-50/80 p-5">
                    <p className="text-sm font-medium text-slate-500">예상 월말 소비</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {formatAmount(projectedMonthEndSpending)}
                    </p>
                    <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                      이번 달 {elapsedDays}일 기준 일평균 소비를 월말까지 단순 환산한 값입니다.
                    </p>
                  </article>

                  <article className="flex min-h-[168px] flex-col rounded-2xl border border-slate-200 bg-slate-50/90 p-5">
                    <p className="text-sm font-medium text-slate-500">평균 대비 변화</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {averageDiffRate > 0 ? "+" : ""}
                      {averageDiffRate.toFixed(1)}%
                    </p>
                    <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                      최근 6개월 평균과 비교하면{" "}
                      <span className="font-semibold text-slate-800">
                        {isAboveAverage ? "소비가 높은 편입니다." : "소비가 안정적인 편입니다."}
                      </span>
                    </p>
                  </article>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setIsAnalysisInsightOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900">분석 인사이트</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    카테고리 집계와 월별 분석 결과를 바탕으로 핵심 포인트를 요약합니다.
                  </p>
                </div>
                <span className={toggleIconClass}>
                  {isAnalysisInsightOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isAnalysisInsightOpen && (
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">가장 큰 지출 항목</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {topCategory.name} {formatAmount(topCategory.value)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">고정/변동 지출 비율</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      생활비 {fixedSpendingRatio}% / 선택 지출 {variableSpendingRatio}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">절약 가능 금액</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      약 {formatAmount(recommendedCutAmount)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {topCategory.name} 항목을 일부 줄이면 이번 달 부담을 완화할 수 있습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {isAboveAverage && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50/90 px-6 py-5">
              <button
                type="button"
                onClick={() => setIsWarningOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">소비 주의 신호</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      최근 평균보다 소비가 높을 때 확인할 경고 요약입니다.
                    </p>
                  </div>
                </div>
                <span className={toggleIconClass}>
                  {isWarningOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isWarningOpen && (
                <div className="mt-4 pl-[68px]">
                  <p className="text-sm leading-6 text-slate-600">
                    이번 달 소비가 최근 평균보다 {formatAmount(Math.abs(Math.round(averageDiff)))} 많습니다.
                    쇼핑과 선택 지출 비중이 커져 있어 다음 결제 전까지 추가 지출을 점검하는 편이 좋습니다.
                  </p>
                </div>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => setIsCategoryStatsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">카테고리별 소비 통계</h2>
                <p className="mt-1 text-sm text-slate-500">
                  소비 항목별 금액과 비중을 큰 순서대로 보여줍니다.
                </p>
              </div>
              <span className={toggleIconClass}>
                {isCategoryStatsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </span>
            </button>

            {isCategoryStatsOpen && (
              <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={56}
                        dataKey="value"
                        labelLine={false}
                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatAmount(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {sortedCategoryData.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="font-medium text-slate-800">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatAmount(category.value)}</p>
                        <p className="text-sm text-slate-500">
                          {((category.value / totalSpending) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => setIsMonthlyFlowOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">월별 소비 흐름</h2>
                <p className="mt-1 text-sm text-slate-500">
                  생활비와 선택 지출을 나눠서 월별 변화를 비교합니다.
                </p>
              </div>
              <span className={toggleIconClass}>
                {isMonthlyFlowOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </span>
            </button>

            {isMonthlyFlowOpen && (
              <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                    <Legend />
                    <Bar dataKey="essential" name="생활비" radius={[10, 10, 0, 0]} fill="#2563eb" />
                    <Bar dataKey="discretionary" name="선택 지출" radius={[10, 10, 0, 0]} fill="#93c5fd" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
