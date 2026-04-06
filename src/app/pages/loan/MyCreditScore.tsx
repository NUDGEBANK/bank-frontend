import { ChevronRight, Shield, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getJson } from "../../lib/api";

type CreditFactor = {
  title: string;
  value: string;
  description: string;
};

type RecommendedLoan = {
  id: string;
  name: string;
  rate: string;
  limit: string;
  reason: string;
};

type CreditScoreApiResponse = {
  success: boolean;
  message: string;
  creditScore: number;
  creditGrade: string;
  evaluationResult: string;
  evaluatedAt: string;
  scoreChange: number | null;
  estimatedLoanLimit: number;
  factors: CreditFactor[];
  recommendedLoans: RecommendedLoan[];
};

function getScoreGradeColor(score: number) {
  if (score >= 900) return "text-emerald-600";
  if (score >= 800) return "text-blue-600";
  if (score >= 700) return "text-amber-600";
  return "text-orange-600";
}

function formatAmount(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function MyCreditScore() {
  const [data, setData] = useState<CreditScoreApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const response = await getJson<CreditScoreApiResponse>("/api/credits/me");
        setData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "REQUEST_FAILED");
      } finally {
        setIsLoading(false);
      }
    };

    fetchScore();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white px-8 py-16 text-center text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          내부 신용 평가 점수를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="rounded-[32px] border border-red-200 bg-white px-8 py-16 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <h1 className="text-2xl font-bold text-slate-900">내부 신용 평가 점수</h1>
          <p className="mt-4 text-sm text-slate-500">
            점수 정보를 불러오지 못했습니다. 로그인 상태를 확인한 뒤 다시 시도해 주세요.
          </p>
          <p className="mt-2 text-sm font-medium text-red-600">{error ?? data?.message}</p>
          <div className="mt-6">
            <Link
              to="/loan/credit-evaluation"
              className="inline-flex rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              신용평가 페이지로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const scorePercentage = (data.creditScore / 1000) * 100;
  const scoreColor = getScoreGradeColor(data.creditScore);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
            Internal Credit Score
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            내부 신용 평가 점수
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            본 점수는 당사 내부 기준으로 산정된 참고용 지표이며, NICE·KCB 등 외부
            신용평점과 다를 수 있습니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,_rgba(219,234,254,0.95)_0%,_rgba(239,246,255,0.98)_48%,_rgba(248,250,252,1)_100%)] px-5 py-5 text-slate-900 shadow-[0_20px_45px_rgba(148,163,184,0.18)]">
              <p className="text-xs tracking-[0.12em] text-sky-700/70">내부 평가 점수</p>
              <p className="mt-3 text-3xl font-semibold">{data.creditScore}점</p>
              <p className="mt-2 text-sm text-slate-500">최근 평가 결과 기준입니다.</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">평가 등급</p>
              <p className={`mt-4 text-2xl font-bold ${scoreColor}`}>{data.creditGrade}</p>
              <p className="mt-2 text-sm text-slate-500">
                상환 이력과 소비 안정성을 함께 반영합니다.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/90 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">최근 변화</p>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <p className="text-2xl font-bold text-slate-900">
                  {data.scoreChange === null
                    ? "신규"
                    : `${data.scoreChange > 0 ? "+" : ""}${data.scoreChange}점`}
                </p>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                최근 상환 흐름과 소비 변동을 반영한 결과입니다.
              </p>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">최근 평가일</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">{data.evaluatedAt}</p>
              <p className="mt-2 text-sm text-slate-500">
                내부 심사 기준에 따라 주기적으로 갱신됩니다.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-stretch">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 결과 요약</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    회원별 계좌, 카드, 소비 흐름을 바탕으로 계산한 내부 결과입니다.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                <div className="flex items-end gap-4">
                  <p className="text-6xl font-bold tracking-tight text-slate-900">{data.creditScore}</p>
                  <p className="pb-2 text-xl text-slate-400">/ 1000</p>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                    <span>내부 평가 구간</span>
                    <span className={`font-semibold ${scoreColor}`}>{data.creditGrade}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#60a5fa_0%,_#2563eb_100%)]"
                      style={{ width: `${scorePercentage}%` }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{data.evaluationResult}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">대출 참고 한도</h2>
                <p className="mt-1 text-sm text-slate-500">
                  현재 내부 평가 결과를 바탕으로 계산한 참고용 예상 한도입니다.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-5 py-5">
                <p className="text-sm text-slate-500">예상 가능 한도</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {formatAmount(data.estimatedLoanLimit)}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  실제 한도는 상품 조건, 부채 상태, 추가 심사 정보에 따라 달라질 수
                  있습니다.
                </p>
              </div>

              <div className="mt-4 grid gap-4">
                {data.factors.map((factor) => (
                  <div
                    key={factor.title}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">{factor.title}</p>
                      <p className="text-sm font-semibold text-slate-900">{factor.value}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">추천 대출 상품</h2>
              <p className="mt-1 text-sm text-slate-500">
                현재 내부 평가 결과와 계정 데이터를 기준으로 참고용 추천 상품을
                보여줍니다.
              </p>
            </div>

            <div className="space-y-4">
              {data.recommendedLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{loan.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{loan.reason}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                        <p>
                          금리 <span className="ml-1 font-semibold text-slate-900">{loan.rate}</span>
                        </p>
                        <p>
                          한도 <span className="ml-1 font-semibold text-slate-900">{loan.limit}</span>
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/loan/products/${loan.id}`}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      상세보기
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/loan/credit-evaluation"
                className="flex-1 rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-blue-700"
              >
                신용평가 다시 하기
              </Link>
              <Link
                to="/loan/products"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                전체 대출 상품 보기
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
