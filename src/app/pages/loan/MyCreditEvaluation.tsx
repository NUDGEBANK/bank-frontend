import { ArrowRight, CheckCircle2, FileText, ShieldCheck, Wallet } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { postJson } from "../../lib/api";

type CreditScoreApiResponse = {
  success: boolean;
  message: string;
};

const requiredChecks = [
  {
    title: "자산 정보",
    status: "반영 항목",
    description: "회원 전체 계좌의 현재 잔액 합계를 참고값으로 반영합니다.",
  },
  {
    title: "최근 3개월 거래",
    status: "반영 항목",
    description: "최근 3개월 카드 거래 건수와 활성 월 수를 함께 반영합니다.",
  },
  {
    title: "소비 부담",
    status: "반영 항목",
    description: "최근 3개월 월평균 소비액을 현재 잔액과 비교해 부담 수준을 계산합니다.",
  },
  {
    title: "거래 안정성",
    status: "반영 항목",
    description: "월별 소비 편차와 최근 거래일을 기준으로 최근 사용 흐름을 판단합니다.",
  },
];

const evaluationSteps = [
  "회원 계좌와 카드 거래 데이터를 조회합니다.",
  "최근 3개월 거래 건수와 월별 활성 여부를 계산합니다.",
  "현재 잔액 대비 소비 부담과 월별 소비 변동성을 계산합니다.",
  "내부 평가 점수와 등급을 산출하고 결과를 저장합니다.",
];

const evaluationCriteria = [
  "자산 점수는 전체 계좌의 현재 잔액을 기준으로 계산되며, 최근 활동성이 낮으면 일부만 반영됩니다.",
  "활성 월은 최근 3개월 중 해당 월 카드 거래가 2건 이상일 때만 인정됩니다.",
  "월평균 소비액이 현재 잔액 대비 과도하면 감점되고, 부담이 낮으면 가산됩니다.",
  "최근 거래일이 오래됐거나 최근 3개월 거래 데이터가 부족하면 보수적으로 평가합니다.",
];

export default function MyCreditEvaluation() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEvaluate = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await postJson<CreditScoreApiResponse>("/api/credits/evaluate", {});
      navigate("/loan/credit-score");
    } catch (err) {
      setError(err instanceof Error ? err.message : "REQUEST_FAILED");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
            Credit Evaluation
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            내부 신용 평가
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            내부 신용 평가 점수를 다시 계산하기 전에 현재 반영되는 항목과 계산 흐름을
            안내합니다. 본 평가는 당사 내부 참고용 지표이며 NICE·KCB 등 외부 신용평점과는
            별개입니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,_rgba(219,234,254,0.95)_0%,_rgba(239,246,255,0.98)_48%,_rgba(248,250,252,1)_100%)] px-5 py-5 text-slate-900 shadow-[0_20px_45px_rgba(148,163,184,0.18)]">
              <p className="text-xs tracking-[0.12em] text-sky-700/70">평가 방식</p>
              <p className="mt-3 text-3xl font-semibold">회원별 재계산</p>
              <p className="mt-2 text-sm text-slate-500">
                현재 로그인한 회원의 실제 계좌와 거래 데이터를 기준으로 계산합니다.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">핵심 데이터</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">최근 3개월 거래</p>
              <p className="mt-2 text-sm text-slate-500">
                최근 거래 수, 활성 월 수, 최근 거래일을 함께 반영합니다.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/90 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">현재 상태</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">즉시 재평가 가능</p>
              <p className="mt-2 text-sm text-slate-500">
                기존 결과가 있어도 최신 데이터 기준으로 다시 계산할 수 있습니다.
              </p>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">예상 소요 시간</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">약 1분</p>
              <p className="mt-2 text-sm text-slate-500">
                계좌와 카드 거래 데이터를 바탕으로 즉시 계산합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-stretch">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 반영 항목</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    실제 점수 계산에 사용되는 입력 데이터를 보여줍니다.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {requiredChecks.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 절차</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    현재 백엔드가 어떤 순서로 내부 점수를 계산하는지 요약했습니다.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {evaluationSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{step}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        외부 CB 점수가 아니라 서비스 내부 기준으로 계산합니다.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:items-stretch">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 기준 안내</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    현재 백엔드 산식에 맞춘 설명이며, 향후 데이터가 늘어나면 조정될 수
                    있습니다.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {evaluationCriteria.map((criterion) => (
                  <div
                    key={criterion}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <p className="text-sm leading-6 text-slate-700">{criterion}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-4 text-sm leading-6 text-amber-900">
                본 평가는 현재 계좌 잔액과 최근 카드 거래 데이터를 기준으로 산정한 내부
                참고용 지표입니다. 외부 신용평점과는 다른 기준으로 계산되며, 대외 제출용 또는
                공식 증빙용으로 사용할 수 없습니다.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-bold text-slate-900">평가 실행</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                현재 잔액, 최근 거래 패턴, 소비 부담을 반영해 내부 신용 평가 점수를
                계산합니다.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-500">실행 방식</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">로그인 회원 기준 재평가</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  버튼을 누르면 현재 로그인한 회원의 최신 계좌 잔액과 카드 거래 데이터를
                  기준으로 점수를 다시 계산하고 저장합니다.
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  <span className="inline-flex items-center gap-2" style={{ color: "#fff" }}>
                    <span>{isSubmitting ? "평가 중..." : "신용평가 시작하기"}</span>
                    <ArrowRight className="h-4 w-4" style={{ color: "#fff" }} />
                  </span>
                </button>
                <Link
                  to="/loan/credit-score"
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  최근 평가 결과 보기
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
