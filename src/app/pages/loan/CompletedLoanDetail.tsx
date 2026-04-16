import { Award, Calendar, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { getJson } from "../../lib/api";
import { checkAuthentication } from "../../lib/auth";

type CompletedLoanHistory = {
  loanHistoryId: number;
  productKey: string;
  productName: string;
  status: string;
  totalPrincipal: number;
  interestRate: number;
  repaymentType: string;
  startDate: string;
  completedAt: string;
};

type MyLoanSummary = {
  loanHistoryId: number;
  status: string;
  totalPrincipal: number;
  remainingPrincipal: number;
  repaidPrincipal: number;
  baseInterestRate: number;
  minimumInterestRate: number;
  preferentialRateDiscount: number;
  interestRate: number;
  repaymentType: string;
  startDate: string;
  endDate: string;
  nextPaymentDate: string | null;
  nextPaymentPrincipal: number;
  nextPaymentInterest: number;
  nextPaymentAmount: number;
  cumulativeInterest: number;
  remainingInterestAmount: number;
  repaymentAccountNumber: string | null;
};

type MyLoanRepaymentSchedule = {
  scheduleId: number;
  dueDate: string;
  plannedPrincipal: number;
  plannedInterest: number;
  paidPrincipal: number;
  paidInterest: number;
  settled: boolean;
  overdueDays: number | null;
};

type MyLoanRepaymentHistory = {
  repaymentId: number;
  repaymentAmount: number;
  repaymentRate: number;
  repaymentDatetime: string;
  remainingBalance: number;
};

function formatAmount(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function CompletedLoanDetail() {
  const { loanHistoryId } = useParams();
  const [completedLoans, setCompletedLoans] = useState<CompletedLoanHistory[]>([]);
  const [summary, setSummary] = useState<MyLoanSummary | null>(null);
  const [repaymentSchedules, setRepaymentSchedules] = useState<MyLoanRepaymentSchedule[]>([]);
  const [repaymentHistories, setRepaymentHistories] = useState<MyLoanRepaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRepaymentHistoryExpanded, setIsRepaymentHistoryExpanded] = useState(false);

  useEffect(() => {
    const loadCompletedLoan = async () => {
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated || !loanHistoryId) {
        setCompletedLoans([]);
        setSummary(null);
        setRepaymentSchedules([]);
        setRepaymentHistories([]);
        setErrorMessage("완납 대출 정보를 확인할 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [nextCompletedLoans, nextSummary, nextSchedules, nextHistories] = await Promise.all([
          getJson<CompletedLoanHistory[]>("/api/loans/me/completed"),
          getJson<MyLoanSummary>(`/api/loans/me/completed/${loanHistoryId}/summary`),
          getJson<MyLoanRepaymentSchedule[]>(
            `/api/loans/me/completed/${loanHistoryId}/repayment-schedules`,
          ),
          getJson<MyLoanRepaymentHistory[]>(
            `/api/loans/me/completed/${loanHistoryId}/repayment-histories`,
          ),
        ]);

        setCompletedLoans(nextCompletedLoans);
        setSummary(nextSummary);
        setRepaymentSchedules(nextSchedules);
        setRepaymentHistories(nextHistories);
      } catch (error) {
        setCompletedLoans([]);
        setSummary(null);
        setRepaymentSchedules([]);
        setRepaymentHistories([]);
        setErrorMessage(error instanceof Error ? error.message : "완납 대출 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCompletedLoan();
  }, [loanHistoryId]);

  const selectedCompletedLoan = useMemo(
    () => completedLoans.find((loan) => String(loan.loanHistoryId) === loanHistoryId) ?? null,
    [completedLoans, loanHistoryId],
  );

  const repaymentMethodLabel =
    summary?.repaymentType === "MATURITY_LUMP_SUM" ? "만기일시상환" : "원리금균등분할상환";
  const repaymentMethodDescription =
    summary?.repaymentType === "MATURITY_LUMP_SUM"
      ? "매달 이자를 납부하고 만기일에 원금을 한 번에 상환한 상품입니다."
      : "매달 원금과 이자를 함께 납부해 완납한 상품입니다.";
  const remainingInterestAmount = summary?.remainingInterestAmount ?? 0;
  const visibleRepaymentHistories = isRepaymentHistoryExpanded
    ? repaymentHistories
    : repaymentHistories.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f3f7fb] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-white/70 bg-white/90 shadow-[0_35px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-slate-100 px-6 py-6 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">
              Completed Loan
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              완납 대출 상세
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              이전에 이용한 대출 상품의 상환 기록과 최종 이용 정보를 확인할 수 있습니다.
            </p>
          </div>

          <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
            <section className="rounded-3xl border border-emerald-100 bg-emerald-50/80 px-6 py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-white p-3 shadow-sm">
                    <Award className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                      Congratulations
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-900">
                      축하합니다! 완납하셨습니다.
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedCompletedLoan?.productName ?? "이전 대출 상품"} 상환이 모두 완료되었습니다.
                    </p>
                  </div>
                </div>
                <Link
                  to="/loan/management"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  내 대출 관리로 돌아가기
                </Link>
              </div>
            </section>

            {isLoading ? (
              <section className="rounded-3xl border border-slate-200 bg-slate-50/80 px-6 py-8 text-center text-sm text-slate-500">
                완납 대출 정보를 불러오는 중입니다.
              </section>
            ) : errorMessage || !summary ? (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-800">
                {errorMessage ?? "완납 대출 정보를 확인할 수 없습니다."}
              </section>
            ) : (
              <>
                <section className="rounded-3xl border-2 border-white/30 bg-gradient-to-br from-slate-800 via-sky-800 to-emerald-700 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-sm font-semibold backdrop-blur-sm">
                        이전 상품 내역
                      </div>
                      <h3 className="text-3xl font-bold">
                        {selectedCompletedLoan?.productName ?? "완납 상품"}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm text-slate-100">
                        기존 대출관리와 같은 기준으로, 이전 대출의 원금·금리·상환 이력을 다시 확인할 수 있습니다.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-100">최종 금리</p>
                        <p className="mt-2 text-2xl font-bold">연 {summary.interestRate.toFixed(2)}%</p>
                      </div>
                      <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-100">총 원금</p>
                        <p className="mt-2 text-2xl font-bold">{formatAmount(summary.totalPrincipal)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-100">완납일</p>
                        <p className="mt-2 text-2xl font-bold">
                          {selectedCompletedLoan?.completedAt ?? summary.endDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-3xl border border-sky-100 bg-sky-50/80 px-5 py-5">
                    <p className="text-sm text-slate-500">잔여 원금</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-900">
                      {formatAmount(summary.remainingPrincipal)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                    <p className="text-sm text-slate-500">총 원금</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {formatAmount(summary.totalPrincipal)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 px-5 py-5">
                    <p className="text-sm text-slate-500">누적 상환 원금</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      {formatAmount(summary.repaidPrincipal)}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                    <p className="text-sm text-slate-500">금리</p>
                    <p className="mt-3 text-2xl font-bold text-slate-900">
                      연 {summary.interestRate.toFixed(2)}%
                    </p>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                    <p className="text-sm text-slate-500">상환 방식</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{repaymentMethodLabel}</p>
                    <p className="mt-2 text-sm text-slate-600">{repaymentMethodDescription}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                    <p className="text-sm text-slate-500">대출 기간</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {summary.startDate} ~ {summary.endDate}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      완납일 {selectedCompletedLoan?.completedAt ?? summary.endDate}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 px-5 py-5">
                    <p className="text-sm text-slate-500">완납 상태</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">완납 완료</p>
                    <p className="mt-2 text-sm text-slate-600">
                      상환 일정과 최근 상환 내역은 아래에서 그대로 확인할 수 있습니다.
                    </p>
                  </div>
                </section>

                <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-xl font-bold text-slate-900">최근 상환 내역</h2>
                      {repaymentHistories.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setIsRepaymentHistoryExpanded((prev) => !prev)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          {isRepaymentHistoryExpanded ? "접기" : "더보기"}
                          {isRepaymentHistoryExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="mt-5 space-y-3">
                      {visibleRepaymentHistories.map((repayment) => (
                        <div
                          key={repayment.repaymentId}
                          className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="text-sm text-slate-500">
                              {repayment.repaymentDatetime.slice(0, 10)}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {formatAmount(repayment.repaymentAmount)}
                            </p>
                          </div>
                          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 md:gap-8">
                            <div>
                              <p className="text-slate-500">적용 금리</p>
                              <p className="mt-1 font-semibold text-slate-900">
                                연 {repayment.repaymentRate.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">상환 후 잔액</p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {formatAmount(repayment.remainingBalance)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {repaymentHistories.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
                          상환 내역이 없습니다.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                    <h2 className="text-xl font-bold text-slate-900">이자 정보</h2>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                        <p className="text-sm text-slate-500">누적 납입 이자</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {formatAmount(summary.cumulativeInterest)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                        <p className="text-sm text-slate-500">잔여 예상 이자</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {formatAmount(remainingInterestAmount)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                        <p className="text-sm text-slate-500">완납 요약</p>
                        <p className="mt-2 text-sm text-slate-600">
                          마지막 납입일{" "}
                          <span className="font-semibold text-slate-900">
                            {selectedCompletedLoan?.completedAt ?? summary.endDate}
                          </span>
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          현재 상태{" "}
                          <span className="font-semibold text-slate-900">{summary.status}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-full bg-sky-100 p-2">
                      <Calendar className="h-5 w-5 text-sky-700" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">상환 일정</h2>
                  </div>
                  <div className="mt-5 space-y-3">
                    {repaymentSchedules.map((schedule) => (
                      <div
                        key={schedule.scheduleId}
                        className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm text-slate-500">{schedule.dueDate}</p>
                            <p className="mt-1 text-base font-semibold text-slate-900">
                              {schedule.settled ? "납부 완료" : "납부 예정"}
                            </p>
                          </div>
                          <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-slate-500">예정 원금</p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {formatAmount(schedule.plannedPrincipal)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">예정 이자</p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {formatAmount(schedule.plannedInterest)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">납부 원금</p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {formatAmount(schedule.paidPrincipal)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">납부 이자</p>
                              <p className="mt-1 font-semibold text-slate-900">
                                {formatAmount(schedule.paidInterest)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {repaymentSchedules.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
                        상환 일정이 없습니다.
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
