import { Award, Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
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

  const remainingInterestAmount = summary?.remainingInterestAmount ?? 0;
  const completedDate = selectedCompletedLoan?.completedAt ?? summary?.endDate ?? "-";
  const visibleRepaymentHistories = isRepaymentHistoryExpanded
    ? repaymentHistories
    : repaymentHistories.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-6 md:px-8">
            <Link
              to="/loan/management"
              className="mb-6 inline-flex items-center gap-1 text-sm text-slate-600 transition-colors hover:text-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
              대출 관리 페이지
            </Link>
            {completedLoans.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {completedLoans.map((loan) => {
                  const isSelected = String(loan.loanHistoryId) === loanHistoryId;
                  return (
                    <Link
                      key={loan.loanHistoryId}
                      to={`/loan/management/completed/${loan.loanHistoryId}`}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-500 hover:text-slate-900"
                      }`}
                      style={isSelected ? { color: "#ffffff" } : undefined}
                    >
                      {loan.productName}
                    </Link>
                  );
                })}
              </div>
            )}
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600">
              Completed Loan
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              완납 대출 상세
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              이전에 이용한 대출 상품의 상환 기록과 최종 이용 정보를 확인할 수 있습니다.
            </p>
          </div>

          <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
            <section className="rounded-3xl border border-emerald-100 bg-emerald-50/70 px-6 py-6">
              <div className="flex items-start gap-4">
                  <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-emerald-100">
                    <Award className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
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
                <section className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-sm font-semibold text-slate-700">
                        이전 상품 내역
                      </div>
                      <h3 className="text-3xl font-bold text-slate-900">
                        {selectedCompletedLoan?.productName ?? "완납 상품"}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                        기존 대출관리와 같은 기준으로, 이전 대출의 원금·금리·상환 이력을 다시 확인할 수 있습니다.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-600">최종 금리</p>
                        <p className="mt-3 whitespace-nowrap text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                          연 {summary.interestRate.toFixed(2)}%
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-600">총 원금</p>
                        <p className="mt-3 whitespace-nowrap text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                          {formatAmount(summary.totalPrincipal)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-600">완납일</p>
                        <p className="mt-3 whitespace-nowrap text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                          {completedDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                    <p className="text-sm text-slate-500">상환 기간</p>
                    <p className="mt-3 text-xl font-bold text-slate-900">{summary.startDate} ~ {summary.endDate}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                    <p className="text-sm text-slate-500">누적 상환 원금</p>
                    <p className="mt-3 text-xl font-bold text-slate-900">{formatAmount(summary.repaidPrincipal)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                    <p className="text-sm text-slate-500">현재 상태</p>
                    <p className="mt-3 text-xl font-bold text-slate-900">완납 완료</p>
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
                            {completedDate}
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

                <section className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">상환 일정</h2>
                  </div>
                  <div className="mt-4 space-y-3">
                    {repaymentSchedules.map((schedule) => (
                      <div
                        key={schedule.scheduleId}
                        className="rounded-xl border border-slate-100 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-medium text-slate-700">{schedule.dueDate}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            schedule.settled
                              ? "bg-slate-200 text-slate-700"
                              : (schedule.overdueDays ?? 0) > 0
                                ? "bg-red-50 text-red-600"
                                : "bg-slate-100 text-slate-700"
                          }`}>
                            {schedule.settled ? "납부 완료" : (schedule.overdueDays ?? 0) > 0 ? "연체" : "납부 예정"}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-4 text-sm text-slate-700 md:grid-cols-4">
                          <div className="flex justify-between md:flex-col">
                            <span>예정 원금</span>
                            <span className="text-sm font-semibold text-slate-900 md:mt-1 md:text-base">
                              {formatAmount(schedule.plannedPrincipal)}
                            </span>
                          </div>
                          <div className="flex justify-between md:flex-col">
                            <span>예정 이자</span>
                            <span className="text-sm font-semibold text-slate-900 md:mt-1 md:text-base">
                              {formatAmount(schedule.plannedInterest)}
                            </span>
                          </div>
                          <div className="flex justify-between md:flex-col">
                            <span>납부 원금</span>
                            <span className="text-sm font-semibold text-slate-900 md:mt-1 md:text-base">
                              {formatAmount(schedule.paidPrincipal)}
                            </span>
                          </div>
                          <div className="flex justify-between md:flex-col">
                            <span>납부 이자</span>
                            <span className="text-sm font-semibold text-slate-900 md:mt-1 md:text-base">
                              {formatAmount(schedule.paidInterest)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {repaymentSchedules.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-600">
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
