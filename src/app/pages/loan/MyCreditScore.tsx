import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

import { getJson, postJson } from "../../lib/api";

type CreditFactor = {
  title: string;
  value: string;
  description: string;
};

type CreditScoreApiResponse = {
  success: boolean;
  message: string;
  creditScore: number;
  creditGrade: string;
  evaluationResult: string;
  evaluatedAt: string;
  scoreChange: number | null;
  factors: CreditFactor[];
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

function formatAmount(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

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
  const [isResultSummaryOpen, setIsResultSummaryOpen] = useState(false);
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const [isRiskOpen, setIsRiskOpen] = useState(false);
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

  const scorePercentage = data ? Math.min((data.creditScore / 950) * 100, 100) : 0;
  const scoreReasons = [
    "입출금 계좌와 예적금 잔액에서 대출 잔여원금을 차감한 순자산을 반영합니다.",
    "최근 3개월 카드 거래량과 소비 변동성, 최근 거래일을 기준으로 활동성을 평가합니다.",
    "대출 상환 일정의 연체 여부와 예적금 유지·납입 이력을 금융 습관 지표로 함께 반영합니다.",
  ];

  const riskInsights = data
    ? [
        "현재 평가는 순자산, 최근 카드 거래, 대출 상환 상태, 예적금 유지 흐름을 기준으로 산정한 내부 참고용 결과입니다.",
        data.creditScore >= 800
          ? "순자산과 상환 안정성, 저축 습관이 비교적 안정적으로 반영되어 내부 등급에 긍정적으로 작용했습니다."
          : "순자산, 대출 부담, 소비 흐름 중 일부 지표가 보수적으로 반영되어 상위 구간 진입이 제한되었습니다.",
        data.scoreChange !== null && data.scoreChange < 0
          ? "직전 평가 대비 점수가 하락해 최근 거래 흐름과 대출·예적금 상태 변화를 함께 확인하는 것이 좋습니다."
          : "실제 대출 심사 시에는 상품 조건과 추가 심사 정보가 함께 반영될 수 있습니다.",
      ]
    : [
        "아직 저장된 평가 결과가 없거나 결과를 불러오지 못했습니다.",
        "페이지 진입 시 현재 로그인한 회원의 계좌, 카드, 대출, 예적금 데이터를 기준으로 자동 평가를 진행합니다.",
        "첫 평가 이후에는 점수, 내부 등급, 참고 한도와 이전 평가 이력을 이 페이지에서 바로 확인할 수 있습니다.",
      ];

  const sectionHeaderClass = "flex w-full items-start justify-between gap-4 text-left";
  const sectionToggleClass =
    "flex items-center justify-center p-0 text-slate-400 transition hover:text-slate-600";

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
                <p className="text-xs tracking-[0.12em] text-slate-500">내부 평가 점수</p>
                <p className="mt-3 break-keep text-2xl font-semibold sm:text-3xl">
                  {isLoading ? "계산 중" : data ? `${data.creditScore}점` : "미평가"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {data ? "현재 백엔드 평가 결과 기준입니다." : "평가 전에는 점수 대신 상태만 표시됩니다."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-sm font-medium text-slate-500">내부 평가 등급</p>
                <p className="mt-4 break-keep text-xl font-bold text-slate-900 sm:text-2xl">
                  {isLoading ? "불러오는 중" : data?.creditGrade ?? "평가 대기"}
                </p>
                <p className="mt-2 text-sm text-slate-500">순자산, 상환 안정성, 저축 습관을 종합해 산정한 내부 등급입니다.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-sm font-medium text-slate-500">최근 변화</p>
                <div className="mt-4 flex items-center gap-2">
                  <p className="break-keep text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {isLoading
                      ? "계산 중"
                      : !data
                        ? "미평가"
                        : data.scoreChange === null
                          ? "신규"
                          : `${data.scoreChange > 0 ? "+" : ""}${data.scoreChange}점`}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-500">직전 평가 기록과 비교한 점수 변동입니다.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
                <p className="text-sm font-medium text-slate-500">최근 평가일</p>
                <p className="mt-4 text-lg font-bold leading-snug text-slate-900 sm:text-xl xl:text-2xl">
                  {isLoading ? "계산 중" : data?.evaluatedAt ?? "평가 기록 없음"}
                </p>
                <p className="mt-2 text-sm text-slate-500">페이지에 진입할 때마다 최신 기준으로 자동 평가를 진행합니다.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-8">
            <section className="border-b border-slate-100 pb-8">
              <button className={sectionHeaderClass} onClick={() => setIsOverviewOpen((prev) => !prev)} type="button">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 개요</h2>
                  <p className="mt-1 text-sm text-slate-500">현재 점수 계산에 반영되는 핵심 항목과 계산 흐름을 함께 보여줍니다.</p>
                </div>
                <span className={sectionToggleClass}>
                  {isOverviewOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isOverviewOpen && (
                <div className="mt-6 space-y-6">
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-900">평가 반영 항목</h3>
                      <p className="mt-1 text-sm text-slate-500">실제 점수 계산에 사용되는 입력 데이터입니다.</p>
                    </div>

                    <div className="grid gap-x-6 md:grid-cols-2">
                      {requiredChecks.map((item) => (
                        <div className="border-b border-slate-100 py-4 last:border-b-0" key={item.title}>
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
                      <p className="mt-1 text-sm text-slate-500">백엔드가 내부 점수를 계산하는 순서를 요약했습니다.</p>
                    </div>

                    <div className="grid gap-x-6 md:grid-cols-2">
                      {evaluationSteps.map((step, index) => (
                        <div className="flex items-start gap-3 border-b border-slate-100 px-1 py-3 last:border-b-0" key={step}>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{step}</p>
                            <p className="mt-0.5 text-xs text-slate-500">외부 CB 점수가 아니라 서비스 내부 기준으로 계산합니다.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="border-b border-slate-100 pb-8">
              <button className={sectionHeaderClass} onClick={() => setIsResultSummaryOpen((prev) => !prev)} type="button">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 결과 요약</h2>
                  <p className="mt-1 text-sm text-slate-500">순자산, 최근 활동성, 대출 상환 상태, 예적금 습관을 함께 반영한 결과입니다.</p>
                </div>
                <span className={sectionToggleClass}>
                  {isResultSummaryOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isResultSummaryOpen && (
                <div className="mt-5 p-1">
                  <div className="flex items-end gap-4">
                    <p className="text-6xl font-bold tracking-tight text-slate-900">{isLoading ? "..." : data?.creditScore ?? "-"}</p>
                    <p className="pb-2 text-xl text-slate-400">/ 950</p>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                      <span>현재 내부 평가 구간</span>
                      <span className="font-semibold text-slate-900">{data?.creditGrade ?? "평가 대기"}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-slate-900" style={{ width: `${scorePercentage}%` }} />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {data?.evaluationResult ?? "저장된 내부 평가 결과가 없으면 신용평가를 실행한 뒤 이 영역에서 요약 결과를 확인할 수 있습니다."}
                  </p>
                </div>
              )}
            </section>

            <section className="border-b border-slate-100 pb-8">
              <button className={sectionHeaderClass} onClick={() => setIsCriteriaOpen((prev) => !prev)} type="button">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">평가 기준 안내</h2>
                  <p className="mt-1 text-sm text-slate-500">현재 백엔드 산식에 맞춘 설명이며, 향후 데이터가 늘어나면 조정될 수 있습니다.</p>
                </div>
                <span className={sectionToggleClass}>
                  {isCriteriaOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isCriteriaOpen && (
                <>
                  <div className="mt-5 grid gap-0 md:grid-cols-2 md:gap-x-6">
                    {evaluationCriteria.map((criterion) => (
                      <div className="flex items-start gap-3 border-b border-slate-100 p-4 last:border-b-0" key={criterion}>
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-700" />
                        <p className="text-sm leading-6 text-slate-700">{criterion}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                    본 평가는 순자산, 최근 카드 거래, 대출 상환 상태, 예적금 유지 이력을 기준으로 산정한 내부 참고용 지표입니다. 외부 신용평점과는 다른 기준으로 계산되며, 대외 제출용 또는 공식 증빙용으로 사용할 수 없습니다.
                  </div>

                  {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
                </>
              )}
            </section>

            <section className="grid gap-8 border-b border-slate-100 pb-8 lg:grid-cols-2">
              <div>
                <button className={sectionHeaderClass} onClick={() => setIsReasonOpen((prev) => !prev)} type="button">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">점수 산출 사유</h2>
                    <p className="mt-1 text-sm text-slate-500">현재 내부 점수에 직접 반영되는 핵심 판단 요소입니다.</p>
                  </div>
                  <span className={sectionToggleClass}>
                    {isReasonOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>

                {isReasonOpen && (
                  <div className="mt-5">
                    {scoreReasons.map((reason) => (
                      <div className="border-b border-slate-100 px-1 py-4 text-sm leading-6 text-slate-700 last:border-b-0" key={reason}>
                        {reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button className={sectionHeaderClass} onClick={() => setIsRiskOpen((prev) => !prev)} type="button">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">리스크 해석</h2>
                    <p className="mt-1 text-sm text-slate-500">현재 데이터 기준으로 내부 평가 결과를 해석한 문장입니다.</p>
                  </div>
                  <span className={sectionToggleClass}>
                    {isRiskOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>

                {isRiskOpen && (
                  <div className="mt-5">
                    {riskInsights.map((insight) => (
                      <div className="border-b border-slate-100 px-1 py-4 text-sm leading-6 text-slate-700 last:border-b-0" key={insight}>
                        {insight}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="border-b border-slate-100 pb-8">
              <button className={sectionHeaderClass} onClick={() => setIsHistoryOpen((prev) => !prev)} type="button">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">이전 신용 평가 점수 내역</h2>
                  <p className="mt-1 text-sm text-slate-500">최근 자동 평가 기록을 기준으로 점수 변화 흐름을 확인할 수 있습니다.</p>
                </div>
                <span className={sectionToggleClass}>
                  {isHistoryOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isHistoryOpen && (
                <div className="mt-6 mb-2">
                  {histories.length > 0 ? (
                    histories.slice(0, 3).map((history, index) => (
                      <div className="border-b border-slate-100 px-1 py-4 last:border-b-0" key={history.creditHistoryId}>
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
                    <div className="px-1 py-4 text-sm leading-6 text-slate-600">
                      자동 평가 기록이 아직 없습니다. 평가가 정상적으로 완료되면 최근 점수 내역이 이 영역에 표시됩니다.
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
