import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

import { getJson, postJson } from "../../lib/api";

type CreditScoreApiResponse = {
  success: boolean;
  message: string;
  creditScore: number;
  creditGrade: string;
  evaluationResult: string;
  evaluatedAt: string;
  scoreChange: number | null;
};

type CreditHistoryItem = {
  creditHistoryId: number;
  creditScore: number;
  creditGrade: string;
  evaluationResult: string;
  evaluatedAt: string;
};

type CreditHistoryListResponse = {
  success: boolean;
  message: string;
  histories: CreditHistoryItem[];
};

const requiredChecks = [
  {
    title: "순자산 정보",
    status: "반영 항목",
    description:
      "입출금 계좌와 예적금 잔액에서 대출 잔여원금을 차감한 순자산을 반영합니다.",
  },
  {
    title: "최근 3개월 거래",
    status: "반영 항목",
    description:
      "최근 3개월 카드 거래 건수와 활성 월 수를 함께 반영합니다.",
  },
  {
    title: "대출 상환 상태",
    status: "반영 항목",
    description:
      "대출 잔여원금 규모와 상환 일정의 연체 여부를 함께 반영합니다.",
  },
  {
    title: "예적금 유지 흐름",
    status: "반영 항목",
    description:
      "예적금 보유, 만기 유지, 적금 납입 이력을 저축 습관 지표로 반영합니다.",
  },
];

const evaluationSteps = [
  "회원 계좌, 카드, 대출, 예적금 데이터를 함께 조회합니다.",
  "계좌와 예적금 잔액에서 대출 잔여원금을 차감해 순자산을 계산합니다.",
  "최근 3개월 소비 흐름, 대출 상환 상태, 예적금 유지 성실도를 함께 평가합니다.",
  "내부 평가 점수와 등급을 산출하고 결과를 저장합니다.",
];

const evaluationCriteria = [
  "자산 점수는 전체 계좌와 예적금 잔액에서 대출 잔여원금을 차감한 순자산 기준으로 계산합니다.",
  "활성 월은 최근 3개월 중 해당 월 카드 거래가 2건 이상일 때만 인정됩니다.",
  "월평균 소비액이 순자산 대비 과도하면 감점되고, 부담이 낮으면 가산됩니다.",
  "대출 연체 여부와 예적금 유지·납입 이력도 함께 반영하며, 최근 거래 데이터가 부족하면 보수적으로 평가합니다.",
];

export default function MyCreditScore() {
  const [data, setData] = useState<CreditScoreApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [histories, setHistories] = useState<CreditHistoryItem[]>([]);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const evaluateAndLoad = async () => {
      try {
        const evaluated = await postJson<CreditScoreApiResponse>("/api/credits/evaluate", {});
        const historyResponse = await getJson<CreditHistoryListResponse>("/api/credits/history");
        setData(evaluated);
        setHistories(historyResponse.success ? historyResponse.histories : []);
        setError(null);
      } catch (err) {
        setData(null);
        setHistories([]);
        setError(err instanceof Error ? err.message : "REQUEST_FAILED");
      } finally {
        setIsLoading(false);
      }
    };

    void evaluateAndLoad();
  }, []);

  const sectionHeaderClass = "flex w-full items-start justify-between gap-4 text-left";
  const sectionToggleClass =
    "flex items-center justify-center p-0 text-slate-400 transition hover:text-slate-600";
  const sectionBodyClass = "mt-6 pl-6 pr-2";
  const summaryLabelClass = "text-sm font-medium text-slate-500";
  const summaryValueClass = "mt-4 break-keep text-xl font-bold tracking-tight text-slate-900 sm:text-2xl";
  const summaryCaptionClass = "mt-2 text-sm text-slate-500";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <div className="border-b border-slate-100 px-6 py-7">
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              내부 신용 평가 점수
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              본 점수는 순자산, 최근 카드 거래, 대출 상환 상태, 예적금 유지 흐름을 기준으로
              산정한 내부 참고용 지표입니다. NICE·KCB 등 외부 신용평점과는 별개이며 대외
              제출용으로 사용할 수 없습니다.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-slate-900">
                <p className={summaryLabelClass}>내부 평가 점수</p>
                <p className={summaryValueClass}>
                  {isLoading ? "계산 중" : data ? `${data.creditScore}점` : "미평가"}
                </p>
                <p className={summaryCaptionClass}>
                  {data ? "가장 최근 결과입니다." : "평가 후 점수가 표시됩니다."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <p className={summaryLabelClass}>내부 평가 등급</p>
                <p className={summaryValueClass}>
                  {isLoading ? "불러오는 중" : data?.creditGrade ?? "평가 대기"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <p className={summaryLabelClass}>최근 변화</p>
                <p className={summaryValueClass}>
                  {isLoading
                    ? "계산 중"
                    : !data
                      ? "미평가"
                      : data.scoreChange === null
                        ? "신규"
                        : `${data.scoreChange > 0 ? "+" : ""}${data.scoreChange}점`}
                </p>
                <p className={summaryCaptionClass}>이전 결과와 비교한 변화입니다.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <p className={summaryLabelClass}>최근 평가일</p>
                <p className={`${summaryValueClass} leading-snug`}>
                  {isLoading ? "계산 중" : data?.evaluatedAt ?? "평가 기록 없음"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-8">
            <section className="border-b border-slate-100 pb-8">
              <button className={sectionHeaderClass} onClick={() => setIsOverviewOpen((prev) => !prev)} type="button">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 개요</h2>
                  <p className="mt-1 text-sm text-slate-500">점수에 반영되는 항목과 평가 순서를 확인할 수 있습니다.</p>
                </div>
                <span className={sectionToggleClass}>
                  {isOverviewOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isOverviewOpen && (
                <div className={`${sectionBodyClass} space-y-6`}>
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900">평가 반영 항목</h3>
                      <p className="mt-1 text-sm text-slate-500">점수에 반영되는 주요 정보입니다.</p>
                    </div>

                    <div className="grid gap-x-6 md:grid-cols-2">
                      {requiredChecks.map((item) => (
                        <div className="border-b border-slate-100 py-4" key={item.title}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">{item.title}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                            </div>
                            <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900">평가 절차</h3>
                      <p className="mt-1 text-sm text-slate-500">점수가 계산되는 흐름입니다.</p>
                    </div>

                    <div className="grid gap-x-6 md:grid-cols-2">
                      {evaluationSteps.map((step) => (
                        <div className="border-b border-slate-100 py-4" key={step}>
                          <div className="min-w-0">
                            <p className="text-sm text-slate-900">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="border-b border-slate-100 pb-8">
              <button className={sectionHeaderClass} onClick={() => setIsCriteriaOpen((prev) => !prev)} type="button">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 기준 안내</h2>
                  <p className="mt-1 text-sm text-slate-500">점수에 반영되는 기준을 확인할 수 있습니다.</p>
                </div>
                <span className={sectionToggleClass}>
                  {isCriteriaOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isCriteriaOpen && (
                <>
                  <div className={`${sectionBodyClass} grid gap-0 md:grid-cols-2 md:gap-x-6`}>
                    {evaluationCriteria.map((criterion) => (
                      <div className="border-b border-slate-100 py-4" key={criterion}>
                        <p className="text-sm leading-6 text-slate-700">{criterion}</p>
                      </div>
                    ))}
                  </div>

                  {error && <div className="mt-4 ml-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
                </>
              )}
            </section>

            <section className="border-b border-slate-100 pb-8">
              <button className={sectionHeaderClass} onClick={() => setIsHistoryOpen((prev) => !prev)} type="button">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">이전 신용 평가 점수 내역</h2>
                  <p className="mt-1 text-sm text-slate-500">이전 평가 점수를 확인할 수 있습니다.</p>
                </div>
                <span className={sectionToggleClass}>
                  {isHistoryOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isHistoryOpen && (
                <div className={`${sectionBodyClass} mb-2`}>
                  {histories.length > 0 ? (
                    histories.slice(0, 3).map((history, index) => (
                      <div className="border-b border-slate-100 py-4 last:border-b-0" key={history.creditHistoryId}>
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm text-slate-500">{index === 0 ? "최신 평가" : `${index + 1}번째 최근 기록`}</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">{history.creditScore}점 · {history.creditGrade}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600 line-clamp-1">{history.evaluationResult}</p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-sm font-medium text-slate-500">{history.evaluatedAt}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-sm leading-6 text-slate-600">
                      평가 기록이 아직 없습니다. 평가가 정상적으로 완료되면 최근 점수 내역이 이 영역에 표시됩니다.
                    </div>
                  )}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
