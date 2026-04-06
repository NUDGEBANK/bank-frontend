import { useState } from "react";
import { AlertTriangle, Bell, BellOff } from "lucide-react";
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

const categoryData: CategoryDatum[] = [
  { name: "생활비", value: 450000, color: "#2563eb" },
  { name: "쇼핑", value: 850000, color: "#4f46e5" },
  { name: "교통", value: 120000, color: "#0f766e" },
  { name: "문화/여가", value: 320000, color: "#64748b" },
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
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(2000000);

  const totalSpending = categoryData.reduce((sum, item) => sum + item.value, 0);
  const sortedCategoryData = [...categoryData].sort((left, right) => right.value - left.value);
  const topCategory = sortedCategoryData[0];
  const averageMonthly =
    monthlyData.reduce((sum, item) => sum + item.essential + item.discretionary, 0) /
    monthlyData.length;
  const currentMonthSpending =
    monthlyData[monthlyData.length - 1].essential +
    monthlyData[monthlyData.length - 1].discretionary;
  const previousMonthSpending =
    monthlyData[monthlyData.length - 2].essential +
    monthlyData[monthlyData.length - 2].discretionary;
  const spendingDiff = currentMonthSpending - averageMonthly;
  const monthOverMonthDiff = currentMonthSpending - previousMonthSpending;
  const isOverspending = spendingDiff > 0;
  const projectedMonthEndSpending = Math.round(currentMonthSpending * 1.12);
  const recommendedCutAmount = Math.round(topCategory.value * 0.18);
  const fixedSpendingRatio = Math.round(
    (monthlyData[monthlyData.length - 1].essential / currentMonthSpending) * 100,
  );
  const variableSpendingRatio = 100 - fixedSpendingRatio;
  const recentThreeMonthAverage = Math.round(
    monthlyData
      .slice(-3)
      .reduce((sum, item) => sum + item.essential + item.discretionary, 0) / 3,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
            Spending Analysis
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            소비 분석
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            월별 소비 흐름과 카테고리 비중을 한눈에 확인할 수 있습니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,_rgba(219,234,254,0.95)_0%,_rgba(239,246,255,0.98)_48%,_rgba(248,250,252,1)_100%)] px-5 py-5 text-slate-900 shadow-[0_20px_45px_rgba(148,163,184,0.18)]">
              <p className="text-xs tracking-[0.12em] text-sky-700/70">이번 달 총 소비</p>
              <p className="mt-3 text-3xl font-semibold">{formatAmount(totalSpending)}</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">월 평균 소비</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                {formatAmount(Math.round(averageMonthly))}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/90 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">전월 대비</p>
              <div className="mt-4">
                <p className="text-2xl font-bold text-slate-900">
                  {isOverspending ? "+" : ""}
                  {(((currentMonthSpending - averageMonthly) / averageMonthly) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">가장 큰 소비 항목</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">쇼핑</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">이번 달 소비 해석</h2>
                <p className="mt-1 text-sm text-slate-500">
                  단순 합계보다 변화 폭과 패턴을 먼저 보여줍니다.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <article className="flex min-h-[168px] flex-col rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
                  <p className="text-sm font-medium text-slate-500">전월 대비 변화</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {monthOverMonthDiff > 0 ? "+" : ""}
                    {formatAmount(Math.abs(monthOverMonthDiff))}
                  </p>
                  <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                    지난달보다{" "}
                    <span className="font-semibold text-slate-800">
                      {monthOverMonthDiff > 0 ? "지출이 늘었습니다" : "지출이 줄었습니다"}
                    </span>
                  </p>
                </article>

                <article className="flex min-h-[168px] flex-col rounded-2xl border border-indigo-100 bg-indigo-50/80 p-5">
                  <p className="text-sm font-medium text-slate-500">예상 월말 소비</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {formatAmount(projectedMonthEndSpending)}
                  </p>
                  <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                    현재 추세가 유지되면 이 수준까지 갈 가능성이 큽니다.
                  </p>
                </article>

                <article className="flex min-h-[168px] flex-col rounded-2xl border border-slate-200 bg-slate-50/90 p-5">
                  <p className="text-sm font-medium text-slate-500">최근 3개월 평균</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {formatAmount(recentThreeMonthAverage)}
                  </p>
                  <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                    단기 흐름 기준으로 현재 소비 수준을 비교할 수 있습니다.
                  </p>
                </article>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">분석 인사이트</h2>
                <p className="mt-1 text-sm text-slate-500">
                  지금 소비 패턴에서 바로 읽히는 포인트입니다.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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
                    {topCategory.name} 항목을 조금만 줄여도 이번 달 부담을 낮출 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {isOverspending && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50/90 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">소비 주의 신호</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    이번 달 소비가 평균보다 {formatAmount(Math.round(spendingDiff))} 많습니다.
                    특히 쇼핑과 선택 지출 비중이 커져서 다음 결제까지 한 번 점검하는 편이 좋습니다.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">카테고리별 소비 통계</h2>
              <p className="mt-1 text-sm text-slate-500">
                소비 항목별 금액과 비중을 보여줍니다.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
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
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
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
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
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
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">월별 소비 흐름</h2>
              <p className="mt-1 text-sm text-slate-500">
                생활비와 선택 지출을 분리해 추이를 비교합니다.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => formatAmount(value)} />
                  <Legend />
                  <Bar
                    dataKey="essential"
                    name="생활비"
                    radius={[10, 10, 0, 0]}
                    fill="#2563eb"
                  />
                  <Bar
                    dataKey="discretionary"
                    name="선택 지출"
                    radius={[10, 10, 0, 0]}
                    fill="#93c5fd"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-blue-100 bg-blue-50/80 p-6">
              <h3 className="text-lg font-semibold text-slate-900">안정적인 고정 지출</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                생활비는 최근 몇 달 동안 큰 변동 없이 유지되고 있습니다. 기본 소비 구조는 안정적인 편입니다.
              </p>
            </article>

            <article className="rounded-3xl border border-amber-100 bg-amber-50/80 p-6">
              <h3 className="text-lg font-semibold text-slate-900">선택 지출 증가</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                쇼핑과 여가 지출이 이번 달에 빠르게 늘었습니다. 다음 주까지 추이를 한 번 더 보는 편이 좋습니다.
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-slate-50/90 p-6">
              <h3 className="text-lg font-semibold text-slate-900">상환 여력 메모</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                현재 패턴 기준으로는 생활비를 유지한 채 선택 지출만 줄여도 상환 여력을 일정 수준 확보할 수 있습니다.
              </p>
            </article>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">과소비 알림 설정</h2>
                <p className="mt-1 text-sm text-slate-500">
                  사이트 전반의 톤에 맞춰 차분하게 안내만 제공하도록 구성했습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAlertEnabled(!alertEnabled)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  alertEnabled
                    ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {alertEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                {alertEnabled ? "알림 켜짐" : "알림 꺼짐"}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  월간 소비 한도 설정
                </label>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="range"
                    min="1000000"
                    max="5000000"
                    step="100000"
                    value={alertThreshold}
                    onChange={(event) => setAlertThreshold(Number(event.target.value))}
                    className="flex-1 accent-blue-600"
                    disabled={!alertEnabled}
                  />
                  <input
                    type="number"
                    value={alertThreshold}
                    onChange={(event) => setAlertThreshold(Number(event.target.value))}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 md:w-44"
                    disabled={!alertEnabled}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                <p className="text-sm leading-6 text-slate-600">
                  {alertEnabled
                    ? `현재 소비 금액은 ${formatAmount(totalSpending)}이며 설정한 한도는 ${formatAmount(
                        alertThreshold,
                      )}입니다. ${
                        totalSpending > alertThreshold
                          ? "이미 한도를 초과한 상태입니다."
                          : "아직 설정 범위 안에 있습니다."
                      }`
                    : "알림이 꺼져 있습니다. 다시 켜면 초과 시점에 맞춰 경고를 받을 수 있습니다."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
