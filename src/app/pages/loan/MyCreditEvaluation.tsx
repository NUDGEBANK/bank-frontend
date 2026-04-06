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
    title: "기본 금융정보",
    status: "확인 완료",
    description: "회원 기본 정보와 연결된 계좌 상태를 점검합니다.",
  },
  {
    title: "상환 이력",
    status: "확인 완료",
    description: "기존 대출 상환 흐름과 연체 여부를 함께 반영합니다.",
  },
  {
    title: "소비 데이터",
    status: "분석 가능",
    description: "최근 소비 패턴과 월별 변동성을 참고합니다.",
  },
  {
    title: "제출 서류",
    status: "추가 제출 가능",
    description: "필요 시 인증 서류를 더해 평가 정확도를 높일 수 있습니다.",
  },
];

const evaluationSteps = [
  "평가 대상 정보 수집",
  "상환 및 소비 데이터 분석",
  "위험도와 상환 여력 산정",
  "내부 신용 평가 점수 반영",
];

const evaluationCriteria = [
  "연체 여부와 상환 성실도",
  "최근 소비 흐름과 지출 안정성",
  "현재 대출 잔액과 월 상환 부담",
  "인증 정보 및 제출 서류 상태",
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
            신용평가
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            내부 신용 평가 점수를 산정하기 전에 필요한 정보와 평가 절차를 확인하는
            페이지입니다. NICE·KCB 등 외부 신용평점과는 별개의 내부 심사 참고용
            평가입니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,_rgba(219,234,254,0.95)_0%,_rgba(239,246,255,0.98)_48%,_rgba(248,250,252,1)_100%)] px-5 py-5 text-slate-900 shadow-[0_20px_45px_rgba(148,163,184,0.18)]">
              <p className="text-xs tracking-[0.12em] text-sky-700/70">평가 준비 상태</p>
              <p className="mt-3 text-3xl font-semibold">완료</p>
              <p className="mt-2 text-sm text-slate-500">필수 확인 항목을 모두 점검했습니다.</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">기준 데이터</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">최근 거래 반영</p>
              <p className="mt-2 text-sm text-slate-500">로그인한 회원의 최신 계좌·카드 흐름을 사용합니다.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50/90 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">현재 상태</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">재평가 가능</p>
              <p className="mt-2 text-sm text-slate-500">현재 로그인 회원 기준으로 다시 계산할 수 있습니다.</p>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">예상 소요 시간</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">약 1분</p>
              <p className="mt-2 text-sm text-slate-500">수집된 내부 데이터를 기준으로 계산합니다.</p>
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
                  <h2 className="text-xl font-bold text-slate-900">평가 전 확인 정보</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    점수 산정에 앞서 반영되는 항목을 먼저 확인합니다.
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
                    내부 기준으로 어떤 순서로 평가가 진행되는지 보여줍니다.
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
                        외부 CB 점수가 아닌 서비스 내부 데이터 기준으로 계산합니다.
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
                    NICE 방식과 유사한 축을 참고하되, 내부 심사 용도로만 사용합니다.
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
                본 평가는 당사 내부 참고용 지표입니다. NICE·KCB 등 외부 신용평점과는
                다른 기준으로 산정되며, 대외 제출용 또는 공식 증빙용으로 사용할 수
                없습니다.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-bold text-slate-900">평가 실행</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                최근 상환 이력, 소비 패턴, 계좌 잔액 흐름을 다시 반영해 내부 신용 평가
                점수를 계산합니다.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                <p className="text-sm text-slate-500">실행 방식</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">로그인 회원 기준 재평가</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  버튼을 누르면 현재 로그인한 회원의 최신 계좌·카드 데이터를 기준으로
                  점수를 다시 계산하고 저장합니다.
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-center font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {isSubmitting ? "평가 중..." : "신용평가 시작하기"}
                  <ArrowRight className="h-4 w-4" />
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
