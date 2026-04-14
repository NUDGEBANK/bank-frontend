import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
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

function isLoanDisbursementTransaction(transaction: CardHistoryTransaction) {
  return (
    transaction.marketName === "NudgeBank 대출 실행" ||
    transaction.categoryName === "대출 실행 입금"
  );
}

function isExcludedConsumptionTransaction(transaction: CardHistoryTransaction) {
  return (
    transaction.amount <= 0 ||
    isLoanDisbursementTransaction(transaction) ||
    EXCLUDED_CATEGORY_NAMES.has(transaction.categoryName) ||
    EXCLUDED_MARKET_NAMES.has(transaction.marketName)
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
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

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
  if (Math.abs(value) < 0.05) {
    return "0.0%";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatMonthLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getMonth() + 1}월`;
}

function resolveTrendTone(rate: number): TrendTone {
  if (rate > 3) {
    return "increase";
  }

  if (rate < -3) {
    return "decrease";
  }

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

        let baselineResponse: ConsumerBaselineResponse | null = null;
        let foundTransactions = false;

        try {
          const historyResponse = await getJson<CardHistoryResponse>("/api/cards/history");
          const allTransactions = historyResponse.accounts.flatMap((account) => account.transactions);
          foundTransactions = allTransactions.length > 0;
          baselineResponse = await getJson<ConsumerBaselineResponse>("/api/baselines/consumer/me")
            .catch(() => null);

          if (isMounted) {
            setCardTransactions(allTransactions);
          }
        } catch {
          baselineResponse = await getJson<ConsumerBaselineResponse>("/api/baselines/consumer/me")
            .catch(() => null);
        }

        if (!isMounted) {
          return;
        }

        setOverview(overviewResponse);
        setBaseline(baselineResponse);
        setHasTransactions(foundTransactions);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "REQUEST_FAILED";
        setErrorMessage(
          message === "UNAUTHORIZED"
            ? "로그인 후 소비 분석을 확인할 수 있습니다."
            : "소비 분석 정보를 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleRunPrediction() {
    if (!hasTransactions || isPredicting) {
      return;
    }

    setIsPredicting(true);
    setPredictionMessage("");
    setErrorMessage("");

    try {
      await postJson<ConsumerPredictionResponse>("/api/consumption-analysis/me/prediction/run", {});
      const refreshedOverview = await getJson<ConsumptionAnalysisOverviewResponse>(
        "/api/consumption-analysis/me/overview",
      );
      setOverview(refreshedOverview);
      setPredictionMessage("최신 카드 결제 내역 기준으로 AI 소비 예측을 다시 계산했습니다.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "REQUEST_FAILED";
      setErrorMessage(
        message === "UNAUTHORIZED"
          ? "로그인 후 AI 소비 예측을 실행할 수 있습니다."
          : "AI 소비 예측을 다시 계산하지 못했습니다.",
      );
    } finally {
      setIsPredicting(false);
    }
  }

  const viewModel = useMemo(() => {
    const monthlyAnalyses = overview?.monthlyAnalyses ?? [];
    const latestPrediction = overview?.latestPrediction ?? null;

    if (monthlyAnalyses.length === 0) {
      return null;
    }

    const currentMonth = monthlyAnalyses[monthlyAnalyses.length - 1];
    const previousMonth = monthlyAnalyses[monthlyAnalyses.length - 2] ?? null;

    const currentMonthSpending = toNumber(currentMonth.currentMonthSpending);
    const previousMonthSpending = toNumber(previousMonth?.currentMonthSpending ?? 0);
    const predictedNextMonthSpending = toNumber(latestPrediction?.predictedTotalSpending ?? 0);
    const monthOverMonthRate =
      previousMonthSpending === 0 ? 0 : ((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100;
    const tone = resolveTrendTone(
      currentMonthSpending === 0
        ? 0
        : ((predictedNextMonthSpending - currentMonthSpending) / currentMonthSpending) * 100,
    );

    const essentialRatio = toNumber(baseline?.essentialRatio);
    const normalRatio = toNumber(baseline?.normalRatio);
    const discretionaryRatio = toNumber(baseline?.discretionaryRatio);
    const riskRatio = toNumber(baseline?.riskRatio);
    const volatility = toNumber(baseline?.volatility);
    const averageSpending = toNumber(baseline?.avgSpending);
    const sixMonthAverage = Math.round(
      monthlyAnalyses.reduce((sum, item) => sum + toNumber(item.currentMonthSpending), 0) / monthlyAnalyses.length,
    );

    return {
      currentMonthAnalysisYearMonth: currentMonth.analysisYearMonth,
      hasPreviousMonth: previousMonth !== null,
      latestPrediction,
      currentMonthSpending,
      predictedNextMonthSpending,
      monthOverMonthRate,
      essentialRatio,
      normalRatio,
      discretionaryRatio,
      riskRatio,
      volatility,
      averageSpending,
      sixMonthAverage,
      insightLines: buildInsightLines({
        tone,
        discretionaryRatio,
        riskRatio,
        volatility,
      }),
    };
  }, [baseline, overview]);

  const categoryStats = useMemo(() => {
    const totalsByCategory = new Map<string, number>();

    for (const transaction of cardTransactions) {
      if (isExcludedConsumptionTransaction(transaction)) {
        continue;
      }

      const amount = transaction.amount;
      totalsByCategory.set(
        transaction.categoryName,
        (totalsByCategory.get(transaction.categoryName) ?? 0) + amount,
      );
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
  }, [cardTransactions]);

  const monthlyConsumptionFlow = useMemo(() => {
    const totalsByMonth = new Map<
      string,
      { essential: number; normal: number; discretionary: number; risk: number }
    >();

    for (const transaction of cardTransactions) {
      if (isExcludedConsumptionTransaction(transaction)) {
        continue;
      }

      const monthKey = formatMonthKey(transaction.transactionDatetime);
      const bucket = totalsByMonth.get(monthKey) ?? {
        essential: 0,
        normal: 0,
        discretionary: 0,
        risk: 0,
      };
      const group = classifyConsumptionGroup(transaction.categoryName);
      bucket[group] += transaction.amount;
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

  const currentMonthRiskStats = useMemo(() => {
    if (!viewModel) {
      return null;
    }

    const currentMonthKey = formatMonthKey(viewModel.currentMonthAnalysisYearMonth);

    let totalCount = 0;
    let totalAmount = 0;
    let riskCount = 0;
    let riskAmount = 0;

    for (const transaction of cardTransactions) {
      if (
        formatMonthKey(transaction.transactionDatetime) !== currentMonthKey ||
        isExcludedConsumptionTransaction(transaction)
      ) {
        continue;
      }

      totalCount += 1;
      totalAmount += transaction.amount;

      if (classifyConsumptionGroup(transaction.categoryName) === "risk") {
        riskCount += 1;
        riskAmount += transaction.amount;
      }
    }

    return {
      riskCount,
      totalCount,
      riskAmount,
      riskCountRatio: totalCount === 0 ? 0 : riskCount / totalCount,
      riskAmountRatio: totalAmount === 0 ? 0 : riskAmount / totalAmount,
    };
  }, [cardTransactions, viewModel]);

  const toggleIconClass =
    "flex items-center justify-center p-0 text-slate-400 transition hover:text-slate-600";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          소비 분석 정보를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (errorMessage && !viewModel) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="rounded-[32px] border border-rose-200 bg-rose-50 px-6 py-12 text-center text-sm text-rose-700">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!viewModel) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          표시할 소비 분석 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
            Spending Analysis
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">소비 분석</h1>
          <p className="mt-2 text-sm text-slate-500">
            월별 소비 흐름과 AI 소비 예측을 함께 확인할 수 있습니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-[24px] border border-sky-100 bg-[linear-gradient(180deg,_#f8fbff_0%,_#f2f7ff_100%)] px-6 py-5 text-slate-900">
              <p className="text-sm font-medium text-sky-600">이번 달 총소비</p>
              <p className="mt-3 text-[2.1rem] font-bold tracking-tight">{formatAmount(viewModel.currentMonthSpending)}</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#f8fbff_0%,_#f3f7fd_100%)] px-6 py-5">
              <p className="text-sm font-medium text-slate-500">6개월 평균 소비</p>
              <p className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900">{formatAmount(viewModel.sixMonthAverage)}</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,_#fafcff_0%,_#f5f7fb_100%)] px-6 py-5">
              <p className="text-sm font-medium text-slate-500">전월 대비</p>
              <p className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900">
                {viewModel.hasPreviousMonth ? formatSignedPercent(viewModel.monthOverMonthRate) : "없음"}
              </p>
            </div>

            <div className="rounded-[24px] border border-indigo-100 bg-[linear-gradient(180deg,_#f8fbff_0%,_#f2f5ff_100%)] px-6 py-5">
              <p className="text-sm font-medium text-slate-500">가장 큰 소비 항목</p>
              <p className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900">
                {categoryStats[0]?.name ?? "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
          {errorMessage && (
            <section className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
              {errorMessage}
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => setIsAiInsightOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI 소비예측</h2>
                <p className="mt-1 text-sm text-slate-500">
                  다음 달 예상 소비금액과 설명용 feature를 바탕으로 AI 인사이트를 제공합니다.
                </p>
              </div>
              <span className={toggleIconClass}>
                {isAiInsightOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </span>
            </button>

            {isAiInsightOpen && (
              <div className="mt-5 space-y-5">
                <div className="flex flex-col gap-3 rounded-3xl border border-blue-100 bg-[linear-gradient(135deg,_rgba(239,246,255,0.95)_0%,_rgba(255,255,255,1)_100%)] p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">예측 결과</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      {formatAmount(viewModel.predictedNextMonthSpending)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-blue-700">
                      예측 모델: {viewModel.latestPrediction?.modelVersion || "XGBoost"}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <button
                      type="button"
                      onClick={() => void handleRunPrediction()}
                      disabled={!hasTransactions || isPredicting}
                      className="inline-flex h-10 items-center justify-center rounded-[16px] border border-slate-200 bg-slate-50 px-5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {isPredicting ? "AI 소비 예측 계산 중..." : "AI 소비 예측 하기"}
                    </button>
                    <p className="text-sm text-slate-500">
                      {hasTransactions
                        ? "카드 결제 내역 기준으로 예측을 다시 계산합니다."
                        : "카드 결제 내역이 있어야 예측을 실행할 수 있습니다."}
                    </p>
                  </div>
                </div>

                {predictionMessage && (
                  <p className="text-sm font-medium text-emerald-700">{predictionMessage}</p>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <article className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">개인 필수소비 비율</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatRatio(viewModel.essentialRatio)}</p>
                  </article>

                  <article className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">개인 일반소비 비율</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatRatio(viewModel.normalRatio)}</p>
                  </article>

                  <article className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">개인 선택소비 비율</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatRatio(viewModel.discretionaryRatio)}</p>
                  </article>

                  <article className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">개인 위험소비 비율</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatRatio(viewModel.riskRatio)}</p>
                  </article>

                  <article className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                    <p className="text-sm text-slate-500">평균 거래 소비</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{formatAmount(viewModel.averageSpending)}</p>
                  </article>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">예측 근거</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        다음 달 예상 소비금액은 이번 달 실제 소비와 소비 성향 feature를 함께 반영해 계산한 결과입니다.
                      </p>
                      <p className="mt-1 text-sm font-medium text-blue-700">
                        XGBoost 기반 예측 모델이 최신 소비 패턴을 반영해 결과를 계산합니다.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white bg-white px-4 py-4">
                      <p className="text-sm font-medium text-slate-500">1. 이번 달 실제 소비</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {formatAmount(viewModel.currentMonthSpending)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        가장 최근 월의 실제 카드 소비 금액이 예측의 기본 기준값으로 사용됩니다.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white bg-white px-4 py-4">
                      <p className="text-sm font-medium text-slate-500">2. 최근 소비 추세</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {viewModel.hasPreviousMonth
                          ? `전월 대비 ${formatSignedPercent(viewModel.monthOverMonthRate)}`
                          : "전월 데이터 없음"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {viewModel.hasPreviousMonth
                          ? "최근 소비가 증가 흐름인지 감소 흐름인지에 따라 다음 달 예측치가 조정됩니다."
                          : "비교할 전월 데이터가 아직 없어 최근 추세 비교는 반영되지 않았습니다."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white bg-white px-4 py-4">
                      <p className="text-sm font-medium text-slate-500">3. 개인 소비 성향 비율</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        필수 {formatRatio(viewModel.essentialRatio)} · 일반 {formatRatio(viewModel.normalRatio)} · 선택 {formatRatio(viewModel.discretionaryRatio)} · 위험 {formatRatio(viewModel.riskRatio)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        필수, 일반, 선택, 위험 소비 비중을 함께 보고 다음 달 지출 확대 가능성을 반영합니다.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white bg-white px-4 py-4">
                      <p className="text-sm font-medium text-slate-500">4. 소비 변동성</p>
                      <p className="mt-2 text-xl font-bold text-slate-900">
                        {viewModel.volatility.toFixed(2)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        최근 소비 패턴이 들쭉날쭉할수록 예측 범위도 커질 수 있어 추가 보정값으로 반영됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {viewModel.insightLines.map((line) => (
                    <div
                      key={line}
                      className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 py-5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">{line}</p>
                    </div>
                  ))}
                </div>

                {!baseline && (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    최근 거래 기준 feature 데이터가 아직 없어 일부 비율은 0으로 표시됩니다.
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => setIsMonthlyInsightOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">이번 달 소비 해석</h2>
                <p className="mt-1 text-sm text-slate-500">
                  단순 합계가 아니라 전월과 평균 기준에서 현재 소비 흐름을 해석합니다.
                </p>
              </div>
              <span className={toggleIconClass}>
                {isMonthlyInsightOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </span>
            </button>

            {isMonthlyInsightOpen && (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <article className="flex min-h-[168px] flex-col rounded-2xl border border-rose-100 bg-rose-50/80 p-5">
                  <p className="text-sm font-medium text-slate-500">위험소비 건수</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {currentMonthRiskStats?.riskCount.toLocaleString("ko-KR") ?? 0}건
                  </p>
                  <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                    이번 달 전체 소비 거래 {currentMonthRiskStats?.totalCount.toLocaleString("ko-KR") ?? 0}건 중
                    위험소비로 분류된 거래 수입니다.
                  </p>
                </article>

                <article className="flex min-h-[168px] flex-col rounded-2xl border border-pink-100 bg-pink-50/80 p-5">
                  <p className="text-sm font-medium text-slate-500">이번 달 위험소비 비율</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {formatRatio(currentMonthRiskStats?.riskAmountRatio ?? 0)}
                  </p>
                  <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                    이번 달 실제 소비금액 중 위험소비가 차지하는 비중입니다.
                  </p>
                </article>

                <article className="flex min-h-[168px] flex-col rounded-2xl border border-amber-100 bg-amber-50/90 p-5">
                  <p className="text-sm font-medium text-slate-500">위험소비 금액</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {formatAmount(currentMonthRiskStats?.riskAmount ?? 0)}
                  </p>
                  <p className="mt-auto pt-4 text-sm leading-6 text-slate-600">
                    주점, 노래방 등 위험소비로 분류된 이번 달 총 지출입니다.
                  </p>
                </article>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <button
              type="button"
              onClick={() => setIsCategoryStatsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">카테고리별 소비 통계</h2>
                <p className="mt-1 text-sm text-slate-500">
                  카드 결제내역 기준으로 소비 항목별 금액과 비율을 큰 순서대로 보여줍니다.
                </p>
              </div>
              <span className={toggleIconClass}>
                {isCategoryStatsOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </span>
            </button>

            {isCategoryStatsOpen && (categoryStats.length > 0 ? (
              <div className="mt-6">
                <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-2.5 text-base font-semibold text-slate-700">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#2f7de1]" />
                    필수 소비
                  </div>
                  <div className="flex items-center gap-2.5 text-base font-semibold text-slate-700">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#22c55e]" />
                    일반 소비
                  </div>
                  <div className="flex items-center gap-2.5 text-base font-semibold text-slate-700">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#facc15]" />
                    선택 소비
                  </div>
                  <div className="flex items-center gap-2.5 text-base font-semibold text-slate-700">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#ec4899]" />
                    위험 소비
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.34fr_0.66fr]">
                <div className="flex min-h-[500px] items-center justify-center rounded-3xl border border-slate-100 bg-slate-50/70 p-1.5">
                  <div className="w-full">
                    <ResponsiveContainer width="100%" height={472}>
                    <RechartsPieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <RechartsPie
                        data={categoryStats}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="52%"
                        innerRadius={118}
                        outerRadius={186}
                        paddingAngle={2}
                        label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryStats.map((item) => (
                          <Cell key={item.name} fill={item.color} />
                        ))}
                      </RechartsPie>
                      <Tooltip formatter={(value: number) => formatAmount(value)} />
                    </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-3">
                  {categoryStats.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-[1.02rem] font-semibold text-slate-800">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[1.02rem] font-bold text-slate-900">{formatAmount(item.value)}</p>
                        <p className="text-[0.95rem] font-medium text-slate-500">{(item.ratio * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
                집계할 소비 카테고리 데이터가 없습니다.
              </div>
            ))}
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
                  카드 결제내역을 기준으로 필수, 일반, 선택, 위험 소비를 나눠 월별 변화를 비교합니다.
                </p>
              </div>
              <span className={toggleIconClass}>
                {isMonthlyFlowOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </span>
            </button>

            {isMonthlyFlowOpen && (
              <div className="mt-6">
                <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-center gap-2.5 text-base font-semibold text-slate-700">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#2f7de1]" />
                    필수 소비
                  </div>
                  <div className="flex items-center gap-2.5 text-base font-semibold text-slate-700">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#22c55e]" />
                    일반 소비
                  </div>
                  <div className="flex items-center gap-2.5 text-base font-semibold text-slate-700">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#facc15]" />
                    선택 소비
                  </div>
                  <div className="flex items-center gap-2.5 text-base font-semibold text-slate-700">
                    <span className="h-3.5 w-3.5 rounded-full bg-[#ec4899]" />
                    위험 소비
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyConsumptionFlow} barGap={8} barCategoryGap="22%">
                    <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                    <Bar dataKey="essential" name="필수 소비" fill="#2f7de1" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="normal" name="일반 소비" fill="#22c55e" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="discretionary" name="선택 소비" fill="#facc15" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="risk" name="위험 소비" fill="#ec4899" radius={[10, 10, 0, 0]} />
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
