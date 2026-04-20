import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  CreditCard,
  PieChart,
  BarChart3
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getJson, postJson } from "../../lib/api";

type NumericLike = number | string | null;

type ConsumptionAnalysisOverviewResponse = {
  monthlyAnalyses: ConsumerMonthlyAnalysisResponse[];
  latestPrediction: ConsumerPredictionResponse | null;
};

type ConsumerMonthlyAnalysisResponse = {
  analysisYearMonth: string;
  currentMonthSpending: NumericLike;
};

type ConsumerPredictionResponse = {
  predictedTotalSpending: NumericLike;
  modelVersion: string;
};

type ConsumerBaselineResponse = {
  avgSpending: NumericLike;
  essentialRatio: NumericLike;
  normalRatio: NumericLike;
  discretionaryRatio: NumericLike;
  riskRatio: NumericLike;
  volatility: NumericLike;
};

type CardHistoryResponse = {
  accounts: CardHistoryAccount[];
};

type CardHistoryAccount = {
  transactions: CardHistoryTransaction[];
};

type CardHistoryTransaction = {
  transactionId: number;
  marketName: string;
  categoryName: string;
  amount: number;
  transactionDatetime: string;
  menuName?: string | null;
};

type TrendTone = "increase" | "decrease" | "stable";
type ConsumptionGroup = "essential" | "normal" | "discretionary" | "risk";

type CategoryStat = {
  name: string;
  value: number;
  ratio: number;
  color: string;
};

const GROUP_COLORS: Record<ConsumptionGroup, string> = {
  essential: "#2f7de1",
  normal: "#22c55e",
  discretionary: "#facc15",
  risk: "#ec4899",
};

const EXCLUDED_CATEGORY_NAMES = new Set(["넛지뱅크", "대출", "대출 실행 입금"]);
const EXCLUDED_MARKET_NAMES = new Set(["NudgeBank 대출 실행", "넛지뱅크"]);
const EXCLUDED_MENU_NAMES = new Set(["대출금 자동상환"]);
const LOAN_KEYWORD = "대출";
const REPAYMENT_KEYWORD = "상환";

function normalizeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function isLoanDisbursementTransaction(transaction: CardHistoryTransaction) {
  const marketName = normalizeText(transaction.marketName);
  const categoryName = normalizeText(transaction.categoryName);
  return (
      marketName === "NudgeBank 대출 실행" ||
      categoryName === "대출 실행 입금"
  );
}

function isExcludedConsumptionTransaction(transaction: CardHistoryTransaction) {
  const categoryName = normalizeText(transaction.categoryName);
  const marketName = normalizeText(transaction.marketName);
  const menuName = normalizeText(transaction.menuName);

  return (
      transaction.amount <= 0 ||
      isLoanDisbursementTransaction(transaction) ||
      EXCLUDED_CATEGORY_NAMES.has(categoryName) ||
      EXCLUDED_MARKET_NAMES.has(marketName) ||
      EXCLUDED_MENU_NAMES.has(menuName) ||
      categoryName.includes(LOAN_KEYWORD) ||
      marketName.includes(LOAN_KEYWORD) ||
      menuName.includes(LOAN_KEYWORD) ||
      menuName.includes(REPAYMENT_KEYWORD) ||
      categoryName.includes("입금") ||
      marketName.includes("입금")
  );
}

function classifyConsumptionGroup(categoryName: string): ConsumptionGroup {
  switch (categoryName) {
    case "주점":
    case "노래방":
      return "risk";
    case "택시":
    case "대중교통":
    case "편의점":
    case "마트":
    case "병원":
    case "약국":
    case "공과금":
    case "통신비":
      return "essential";
    case "영화관":
    case "문화취미(pc방, 헬스장 등)":
    case "백화점":
    case "의류":
    case "서점":
    case "미용실":
    case "카페":
      return "discretionary";
    default:
      return "normal";
  }
}

function formatMonthKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 7);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function toNumber(value: NumericLike): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatAmount(value: NumericLike) {
  return `${Math.round(toNumber(value)).toLocaleString("ko-KR")}원`;
}

function formatRatio(value: NumericLike) {
  return `${(toNumber(value) * 100).toFixed(1)}%`;
}

function formatSignedPercent(value: number) {
  if (Math.abs(value) < 0.05) return "0.0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatMonthLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}월`;
}

function resolveTrendTone(rate: number): TrendTone {
  if (rate > 3) return "increase";
  if (rate < -3) return "decrease";
  return "stable";
}

function buildInsightLines(params: {
  tone: TrendTone;
  discretionaryRatio: number;
  riskRatio: number;
  volatility: number;
}) {
  const lines: string[] = [];
  lines.push(
      params.tone === "increase"
          ? "다음 달 소비는 이번 달보다 커질 가능성이 있습니다."
          : params.tone === "decrease"
              ? "다음 달 소비는 이번 달보다 낮아질 가능성이 있습니다."
              : "다음 달 소비는 이번 달 흐름과 비슷하게 유지될 가능성이 있습니다.",
  );
  lines.push(
      params.discretionaryRatio >= 0.35
          ? "선택 소비 비중이 높아 소비 확대 가능성이 있습니다."
          : "선택 소비 비중은 비교적 안정적인 수준입니다.",
  );
  lines.push(
      params.riskRatio >= 0.2
          ? "위험 소비 비율이 높아 일시적 과소비 가능성을 점검할 필요가 있습니다."
          : "위험 소비 비율은 낮은 편이라 급격한 과소비 신호는 크지 않습니다.",
  );
  lines.push(
      params.volatility >= 0.3
          ? "최근 소비 변동성이 높아 지출 관리가 필요합니다."
          : "최근 소비 변동성은 비교적 안정적인 편입니다.",
  );
  return lines;
}

export default function SpendingAnalysis() {
  const [overview, setOverview] = useState<ConsumptionAnalysisOverviewResponse | null>(null);
  const [baseline, setBaseline] = useState<ConsumerBaselineResponse | null>(null);
  const [cardTransactions, setCardTransactions] = useState<CardHistoryTransaction[]>([]);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [predictionMessage, setPredictionMessage] = useState("");

  const [isAiInsightOpen, setIsAiInsightOpen] = useState(true);
  const [isMonthlyInsightOpen, setIsMonthlyInsightOpen] = useState(true);
  const [isCategoryStatsOpen, setIsCategoryStatsOpen] = useState(true);
  const [isMonthlyFlowOpen, setIsMonthlyFlowOpen] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAnalysis() {
      setIsLoading(true);
      try {
        const overviewResponse = await getJson<ConsumptionAnalysisOverviewResponse>(
            "/api/consumption-analysis/me/overview",
        );
        let foundTransactions = false;
        try {
          const historyResponse = await getJson<CardHistoryResponse>("/api/cards/history");
          const allTransactions = historyResponse.accounts.flatMap((account) => account.transactions);
          foundTransactions = allTransactions.length > 0;
          if (isMounted) setCardTransactions(allTransactions);
        } catch { /* ignore */ }

        const baselineResponse = await getJson<ConsumerBaselineResponse>("/api/baselines/consumer/me").catch(() => null);

        if (isMounted) {
          setOverview(overviewResponse);
          setBaseline(baselineResponse);
          setHasTransactions(foundTransactions);
        }
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "REQUEST_FAILED";
        setErrorMessage(message === "UNAUTHORIZED" ? "로그인 후 정보를 확인할 수 있습니다." : "정보를 불러오지 못했습니다.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadAnalysis();
    return () => { isMounted = false; };
  }, []);

  async function handleRunPrediction() {
    if (!hasTransactions || isPredicting) return;
    setIsPredicting(true);
    setPredictionMessage("");
    try {
      const latestPrediction = await postJson<ConsumerPredictionResponse>("/api/consumption-analysis/me/prediction/run", {});
      try {
        const refreshedOverview = await getJson<ConsumptionAnalysisOverviewResponse>("/api/consumption-analysis/me/overview");
        setOverview(refreshedOverview);
      } catch {
        // Prediction is already persisted; keep UI updated with returned latest prediction.
        setOverview((prev) => (prev ? { ...prev, latestPrediction } : prev));
      }
      setErrorMessage("");
      setPredictionMessage("최신 결제 내역 기준으로 예측을 다시 계산했습니다.");
    } catch (error) {
      setErrorMessage("예측 계산 중 오류가 발생했습니다.");
    } finally {
      setIsPredicting(false);
    }
  }

  const viewModel = useMemo(() => {
    const monthlyAnalyses = overview?.monthlyAnalyses ?? [];
    const latestPrediction = overview?.latestPrediction ?? null;
    if (monthlyAnalyses.length === 0) return null;

    const currentMonth = monthlyAnalyses[monthlyAnalyses.length - 1];
    const previousMonth = monthlyAnalyses[monthlyAnalyses.length - 2] ?? null;
    const currentMonthSpending = toNumber(currentMonth.currentMonthSpending);
    const previousMonthSpending = toNumber(previousMonth?.currentMonthSpending ?? 0);
    const predictedNextMonthSpending = toNumber(latestPrediction?.predictedTotalSpending ?? 0);
    const monthOverMonthRate = previousMonthSpending === 0 ? 0 : ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100;
    const tone = resolveTrendTone(currentMonthSpending === 0 ? 0 : ((predictedNextMonthSpending - currentMonthSpending) / currentMonthSpending) * 100);

    return {
      currentMonthAnalysisYearMonth: currentMonth.analysisYearMonth,
      hasPreviousMonth: previousMonth !== null,
      latestPrediction,
      currentMonthSpending,
      predictedNextMonthSpending,
      monthOverMonthRate,
      essentialRatio: toNumber(baseline?.essentialRatio),
      normalRatio: toNumber(baseline?.normalRatio),
      discretionaryRatio: toNumber(baseline?.discretionaryRatio),
      riskRatio: toNumber(baseline?.riskRatio),
      volatility: toNumber(baseline?.volatility),
      averageSpending: toNumber(baseline?.avgSpending),
      sixMonthAverage: Math.round(monthlyAnalyses.reduce((sum, item) => sum + toNumber(item.currentMonthSpending), 0) / monthlyAnalyses.length),
      insightLines: buildInsightLines({ tone, discretionaryRatio: toNumber(baseline?.discretionaryRatio), riskRatio: toNumber(baseline?.riskRatio), volatility: toNumber(baseline?.volatility) }),
    };
  }, [baseline, overview]);

  const categoryStats = useMemo(() => {
    if (!viewModel) return [] as CategoryStat[];
    const currentMonthKey = formatMonthKey(viewModel.currentMonthAnalysisYearMonth);
    const totalsByCategory = new Map<string, number>();
    for (const transaction of cardTransactions) {
      if (formatMonthKey(transaction.transactionDatetime) !== currentMonthKey) continue;
      if (isExcludedConsumptionTransaction(transaction)) continue;
      totalsByCategory.set(transaction.categoryName, (totalsByCategory.get(transaction.categoryName) ?? 0) + transaction.amount);
    }
    const total = Array.from(totalsByCategory.values()).reduce((sum, value) => sum + value, 0);
    return Array.from(totalsByCategory.entries())
        .sort((left, right) => right[1] - left[1])
        .map(([name, value]) => ({
          name,
          value,
          ratio: total === 0 ? 0 : value / total,
          color: GROUP_COLORS[classifyConsumptionGroup(name)],
        })) satisfies CategoryStat[];
  }, [cardTransactions, viewModel]);

  const monthlyConsumptionFlow = useMemo(() => {
    const totalsByMonth = new Map<string, { essential: number; normal: number; discretionary: number; risk: number }>();
    for (const transaction of cardTransactions) {
      if (isExcludedConsumptionTransaction(transaction)) continue;
      const monthKey = formatMonthKey(transaction.transactionDatetime);
      const bucket = totalsByMonth.get(monthKey) ?? { essential: 0, normal: 0, discretionary: 0, risk: 0 };
      bucket[classifyConsumptionGroup(transaction.categoryName)] += transaction.amount;
      totalsByMonth.set(monthKey, bucket);
    }
    return Array.from(totalsByMonth.entries())
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([month, values]) => ({
          month: formatMonthLabel(`${month}-01`),
          essential: values.essential,
          normal: values.normal,
          discretionary: values.discretionary,
          risk: values.risk,
        }));
  }, [cardTransactions]);

  const currentMonthConsumptionStats = useMemo(() => {
    if (!viewModel) {
      return {
        essentialRatio: 0,
        normalRatio: 0,
        discretionaryRatio: 0,
        riskRatio: 0,
        averageTransactionAmount: 0,
      };
    }

    const currentMonthKey = formatMonthKey(viewModel.currentMonthAnalysisYearMonth);
    let totalAmount = 0;
    let totalCount = 0;
    let essentialAmount = 0;
    let normalAmount = 0;
    let discretionaryAmount = 0;
    let riskAmount = 0;

    for (const transaction of cardTransactions) {
      if (formatMonthKey(transaction.transactionDatetime) !== currentMonthKey) continue;
      if (isExcludedConsumptionTransaction(transaction)) continue;

      totalAmount += transaction.amount;
      totalCount += 1;

      const group = classifyConsumptionGroup(transaction.categoryName);
      if (group === "essential") essentialAmount += transaction.amount;
      if (group === "normal") normalAmount += transaction.amount;
      if (group === "discretionary") discretionaryAmount += transaction.amount;
      if (group === "risk") riskAmount += transaction.amount;
    }

    return {
      essentialRatio: totalAmount === 0 ? 0 : essentialAmount / totalAmount,
      normalRatio: totalAmount === 0 ? 0 : normalAmount / totalAmount,
      discretionaryRatio: totalAmount === 0 ? 0 : discretionaryAmount / totalAmount,
      riskRatio: totalAmount === 0 ? 0 : riskAmount / totalAmount,
      averageTransactionAmount: totalCount === 0 ? 0 : totalAmount / totalCount,
    };
  }, [cardTransactions, viewModel]);

  const currentMonthRiskStats = useMemo(() => {
    if (!viewModel) return null;
    const currentMonthKey = formatMonthKey(viewModel.currentMonthAnalysisYearMonth);
    let totalCount = 0, totalAmount = 0, riskCount = 0, riskAmount = 0;
    for (const transaction of cardTransactions) {
      if (formatMonthKey(transaction.transactionDatetime) !== currentMonthKey || isExcludedConsumptionTransaction(transaction)) continue;
      totalCount++; totalAmount += transaction.amount;
      if (classifyConsumptionGroup(transaction.categoryName) === "risk") { riskCount++; riskAmount += transaction.amount; }
    }
    return { riskCount, totalCount, riskAmount, riskCountRatio: totalCount === 0 ? 0 : riskCount / totalCount, riskAmountRatio: totalAmount === 0 ? 0 : riskAmount / totalAmount };
  }, [cardTransactions, viewModel]);

  const toggleIconClass = "flex items-center justify-center p-0 text-slate-400 transition hover:text-slate-600";

  if (isLoading) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-sm text-slate-500">소비 분석 정보를 불러오는 중입니다...</div>
        </div>
    );
  }

  if (!viewModel) {
    return (
        <div className="min-h-screen bg-slate-50 px-6 py-12">
          <div className="mx-auto max-w-6xl rounded-2xl bg-white p-12 text-center shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            {errorMessage || "표시할 소비 데이터가 없습니다."}
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-6">
          <h1 className="text-2xl font-bold text-slate-800">소비 분석</h1>
          <p className="mt-2 text-sm text-slate-400">월별 소비 흐름과 AI 소비 예측을 함께 확인할 수 있습니다.</p>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-14">
          <div className="mb-8 rounded-2xl bg-white p-4 shadow-[0_2px_20px_rgba(0,0,0,0.08)] md:p-6">
            <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-4 md:divide-x md:divide-y-0">
              <div className="px-4 py-5 md:px-6">
                <h3 className="text-sm font-semibold text-blue-600">이번 달 총소비</h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatAmount(viewModel.currentMonthSpending)}</p>
              </div>
              <div className="px-4 py-5 md:px-6">
                <h3 className="text-sm font-semibold text-slate-500">6개월 평균 소비</h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">{formatAmount(viewModel.sixMonthAverage)}</p>
              </div>
              <div className="px-4 py-5 md:px-6">
                <h3 className="text-sm font-semibold text-slate-500">전월 대비</h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {viewModel.hasPreviousMonth ? formatSignedPercent(viewModel.monthOverMonthRate) : "데이터 없음"}
                </p>
              </div>
              <div className="px-4 py-5 md:px-6">
                <h3 className="text-sm font-semibold text-slate-500">주요 소비 항목</h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">{categoryStats[0]?.name ?? "-"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="group rounded-2xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <button
                  type="button"
                  onClick={() => setIsAiInsightOpen(!isAiInsightOpen)}
                  className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">AI 소비예측</h2>
                </div>
                <span className={toggleIconClass}>{isAiInsightOpen ? <ChevronUp /> : <ChevronDown />}</span>
              </button>

              {isAiInsightOpen && (
                  <div className="mt-8 space-y-6">
                    <div className="flex flex-col gap-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-6 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-600">다음 달 예상 소비액</p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">{formatAmount(viewModel.predictedNextMonthSpending)}</p>
                      </div>
                      <button
                          onClick={() => void handleRunPrediction()}
                          disabled={!hasTransactions || isPredicting}
                          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-slate-300"
                      >
                        <span style={{ color: "#fff" }}>{isPredicting ? "계산 중..." : "AI 예측 갱신"}</span>
                      </button>
                    </div>
                    {predictionMessage ? (
                        <p className="text-sm text-emerald-700">{predictionMessage}</p>
                    ) : null}
                    {errorMessage ? (
                        <p className="text-sm text-rose-600">{errorMessage}</p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                      {[
                        { label: "필수소비", val: formatRatio(currentMonthConsumptionStats.essentialRatio) },
                        { label: "일반소비", val: formatRatio(currentMonthConsumptionStats.normalRatio) },
                        { label: "선택소비", val: formatRatio(currentMonthConsumptionStats.discretionaryRatio) },
                        { label: "위험소비", val: formatRatio(currentMonthConsumptionStats.riskRatio) },
                        { label: "평균 거래액", val: formatAmount(currentMonthConsumptionStats.averageTransactionAmount) },
                      ].map((item, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                            <p className="text-sm text-slate-500 font-medium">{item.label}</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">{item.val}</p>
                          </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      {viewModel.insightLines.map((line, idx) => (
                          <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
                            <p className="text-sm text-slate-700 font-medium">{line}</p>
                          </div>
                      ))}
                    </div>
                  </div>
              )}
            </section>

            <section className="group rounded-2xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <button
                  onClick={() => setIsMonthlyInsightOpen(!isMonthlyInsightOpen)}
                  className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">이번 달 위험 소비 분석</h2>
                  <p className="mt-1 text-base text-slate-500">주점, 노래방 등 불필요한 지출 항목 체크</p>
                </div>
                <span className={toggleIconClass}>{isMonthlyInsightOpen ? <ChevronUp /> : <ChevronDown />}</span>
              </button>

              {isMonthlyInsightOpen && (
                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/30 p-6">
                      <p className="text-sm font-semibold text-rose-600">위험소비 건수</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{currentMonthRiskStats?.riskCount ?? 0}건</p>
                    </div>
                    <div className="rounded-2xl border border-pink-100 bg-pink-50/30 p-6">
                      <p className="text-sm font-semibold text-pink-600">위험소비 비중</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{formatRatio(currentMonthRiskStats?.riskAmountRatio ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-6">
                      <p className="text-sm font-semibold text-amber-600">위험소비 총액</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{formatAmount(currentMonthRiskStats?.riskAmount ?? 0)}</p>
                    </div>
                  </div>
              )}
            </section>

            <section className="group rounded-2xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <button
                  onClick={() => setIsCategoryStatsOpen(!isCategoryStatsOpen)}
                  className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">이번 달 카테고리별 통계</h2>
                  <p className="mt-1 text-base text-slate-500">결제 내역 기반 항목별 지출 비율</p>
                </div>
                <span className={toggleIconClass}>{isCategoryStatsOpen ? <ChevronUp /> : <ChevronDown />}</span>
              </button>

              {isCategoryStatsOpen && (
                  <div className="mt-8">
                    <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
                      {[
                        { label: "필수 소비", color: "#2f7de1" },
                        { label: "일반 소비", color: "#22c55e" },
                        { label: "선택 소비", color: "#facc15" },
                        { label: "위험 소비", color: "#ec4899" },
                      ].map((legend) => (
                          <div key={legend.label} className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: legend.color }} />
                            <span className="text-sm font-semibold text-slate-600">{legend.label}</span>
                          </div>
                      ))}
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                      <div className="h-[400px] flex items-center justify-center rounded-2xl border border-slate-50 bg-slate-50/30 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <RechartsPie
                                data={categoryStats}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={80}
                                outerRadius={140}
                                paddingAngle={5}
                            >
                              {categoryStats.map((entry, idx) => (
                                  <Cell key={idx} fill={entry.color} />
                              ))}
                            </RechartsPie>
                            <Tooltip formatter={(value: number) => formatAmount(value)} />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2">
                        {categoryStats.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm font-bold text-slate-700">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">{formatAmount(item.value)}</p>
                                <p className="text-xs text-slate-400">{(item.ratio * 100).toFixed(1)}%</p>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
              )}
            </section>

            <section className="group rounded-2xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <button
                  onClick={() => setIsMonthlyFlowOpen(!isMonthlyFlowOpen)}
                  className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">월별 소비 흐름</h2>
                  <p className="mt-1 text-base text-slate-500">최근 소비 트렌드 변화 비교</p>
                </div>
                <span className={toggleIconClass}>{isMonthlyFlowOpen ? <ChevronUp /> : <ChevronDown />}</span>
              </button>

              {isMonthlyFlowOpen && (
                  <div className="mt-8">
                    <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#2f7de1]" />
                        <span className="text-sm font-semibold text-slate-600">필수 소비</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
                        <span className="text-sm font-semibold text-slate-600">일반 소비</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#facc15]" />
                        <span className="text-sm font-semibold text-slate-600">선택 소비</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#ec4899]" />
                        <span className="text-sm font-semibold text-slate-600">위험 소비</span>
                      </div>
                    </div>

                    <div className="h-[350px] rounded-2xl border border-slate-50 bg-slate-50/30 p-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyConsumptionFlow}>
                          <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip formatter={(value: number) => formatAmount(value)} />
                          <Bar dataKey="essential" fill="#2f7de1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="normal" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="discretionary" fill="#facc15" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="risk" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
              )}
            </section>
          </div>
        </div>
      </div>
  );
}
