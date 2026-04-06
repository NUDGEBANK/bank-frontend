import { Calendar, Calculator, TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";

const loanInfo = {
  totalPrincipal: 20000000,
  remainingPrincipal: 15000000,
  monthlyPayment: 450000,
  interestRate: 3.5,
  startDate: "2024-03-25",
  maturityDate: "2028-03-24",
  nextPaymentDate: "2026-04-25",
  nextPaymentAmount: 450000,
  cumulativeInterest: 1320000,
  estimatedRemainingInterest: 1840000,
  repaymentType: "원리금균등상환",
  autoDebitAccount: "110-294-882104",
};

const recentRepayments = [
  { date: "2026-03-25", amount: 450000, principal: 338000, interest: 112000 },
  { date: "2026-02-25", amount: 450000, principal: 335000, interest: 115000 },
  { date: "2026-01-25", amount: 450000, principal: 331000, interest: 119000 },
];

function formatAmount(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function MyLoanManagement() {
  const [simulationAmount, setSimulationAmount] = useState(1000000);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const repaidPrincipal = loanInfo.totalPrincipal - loanInfo.remainingPrincipal;
  const repaymentProgress = (repaidPrincipal / loanInfo.totalPrincipal) * 100;

  const nextPaymentDate = new Date(`${loanInfo.nextPaymentDate}T00:00:00`);
  const daysUntilNextPayment = Math.max(
    Math.ceil((nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    0,
  );

  const averagePrincipalPayment = useMemo(() => {
    return Math.round(
      recentRepayments.reduce((sum, item) => sum + item.principal, 0) / recentRepayments.length,
    );
  }, []);

  const remainingAfterSimulation = Math.max(loanInfo.remainingPrincipal - simulationAmount, 0);
  const estimatedSavedMonths =
    averagePrincipalPayment > 0 ? Math.floor(simulationAmount / averagePrincipalPayment) : 0;
  const estimatedInterestSavings = Math.round(
    simulationAmount * (loanInfo.interestRate / 100) * (Math.max(estimatedSavedMonths, 1) / 12) * 0.55,
  );

  const calculateSimulationDate = () => {
    if (remainingAfterSimulation <= 0) {
      return "즉시 상환 가능";
    }

    const completionDate = new Date(`${loanInfo.maturityDate}T00:00:00`);
    completionDate.setMonth(completionDate.getMonth() - estimatedSavedMonths);
    return completionDate.toLocaleDateString("ko-KR");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
            Loan Management
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">대출 관리</h1>
          <p className="mt-2 text-sm text-slate-500">
            대출 원금, 상환 진행률, 최근 상환 내역을 기준으로 현재 상태를 관리하는 화면입니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,_rgba(219,234,254,0.95)_0%,_rgba(239,246,255,0.98)_48%,_rgba(248,250,252,1)_100%)] px-5 py-5 text-slate-900 shadow-[0_20px_45px_rgba(148,163,184,0.18)]">
              <p className="text-xs tracking-[0.12em] text-sky-700/70">대출 잔액</p>
              <p className="mt-3 text-3xl font-semibold">{formatAmount(loanInfo.remainingPrincipal)}</p>
              <p className="mt-2 text-sm text-slate-500">현재 남아 있는 원금 기준입니다.</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">차입금</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                {formatAmount(loanInfo.totalPrincipal)}
              </p>
              <p className="mt-2 text-sm text-slate-500">최초 실행한 대출 원금입니다.</p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">상환액</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                {formatAmount(repaidPrincipal)}
              </p>
              <p className="mt-2 text-sm text-slate-500">누적 상환한 원금 기준 금액입니다.</p>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">금리</p>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                연 {loanInfo.interestRate.toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-slate-500">현재 적용 중인 기준 금리입니다.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">대출 현황</h2>
                <p className="mt-1 text-sm text-slate-500">
                  원금 상환 진행률과 월 납입 계획을 함께 보여줍니다.
                </p>
              </div>
              <p className="text-sm font-medium text-slate-500">
                만기일<span className="ml-1 text-slate-900">{loanInfo.maturityDate}</span>
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
              <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">원금 상환 진행률</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {repaymentProgress.toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                    <span>누적 상환 원금</span>
                    <span className="font-semibold text-slate-900">
                      {formatAmount(repaidPrincipal)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,_#60a5fa_0%,_#2563eb_100%)]"
                      style={{ width: `${repaymentProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">월 납입 예정액</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {formatAmount(loanInfo.monthlyPayment)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                  <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">예정 만기일</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {loanInfo.maturityDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)] lg:items-stretch">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">조기 상환 시뮬레이션</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    추가 상환 원금이 들어간다고 가정하고 잔액과 예상 종료 시점을 계산합니다.
                  </p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">추가 상환 원금</label>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    type="range"
                    min="0"
                    max={loanInfo.remainingPrincipal}
                    step="100000"
                    value={simulationAmount}
                    onChange={(event) => setSimulationAmount(Number(event.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <input
                    type="number"
                    value={simulationAmount}
                    onChange={(event) => setSimulationAmount(Number(event.target.value))}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 md:w-44"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-5">
                  <p className="text-sm text-slate-500">추가 상환 후 잔액</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(remainingAfterSimulation)}
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-5 py-5">
                  <p className="text-sm text-slate-500">예상 종료 시점</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {calculateSimulationDate()}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/80 px-5 py-5">
                  <p className="text-sm text-slate-500">예상 절감 이자</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatAmount(estimatedInterestSavings)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-5">
                  <p className="text-sm text-slate-500">예상 단축 기간</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    약 {estimatedSavedMonths}개월
                  </p>
                </div>
              </div>

              <button className="mt-6 w-full rounded-2xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-700">
                추가 상환하기
              </button>

              <p className="mt-4 text-center text-sm text-slate-500">
                실제 조기 상환 수수료, 상환 방식, 이자 계산 규칙에 따라 값은 달라질 수 있습니다.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">관리 정보</h2>
                <p className="mt-1 text-sm text-slate-500">
                  백엔드 연동 시 즉시 확인해야 할 핵심 상태를 보여주는 영역입니다.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex min-h-[148px] flex-col rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">다음 납입 예정일</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {loanInfo.nextPaymentDate} / {formatAmount(loanInfo.nextPaymentAmount)}
                  </p>
                  <p className="mt-auto pt-3 text-sm leading-6 text-slate-600">
                    오늘 기준 {daysUntilNextPayment}일 남았습니다.
                  </p>
                </div>

                <div className="flex min-h-[148px] flex-col rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">상환 진도</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    총 원금의 {repaymentProgress.toFixed(1)}%를 상환했습니다.
                  </p>
                </div>

                <div className="flex min-h-[148px] flex-col rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">추가 상환 효과</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    약 {estimatedSavedMonths}개월 단축 예상
                  </p>
                </div>

                <div className="flex min-h-[148px] flex-col rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">상환 방식 / 출금 계좌</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {loanInfo.repaymentType}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    자동이체 계좌 {loanInfo.autoDebitAccount}
                  </p>
                </div>

                <div className="flex min-h-[148px] flex-col rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-4 sm:col-span-2">
                  <p className="text-sm text-slate-500">이번 달 체크 사항</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    다음 납입일 전에 출금 계좌 잔액을 확인하고, 여유 자금이 있다면 조기 상환으로 남은 이자 부담을 줄일 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">최근 상환 내역</h2>
                <p className="mt-1 text-sm text-slate-500">
                  최근 납입 금액과 원금, 이자 구성 비율을 확인할 수 있습니다.
                </p>
              </div>

              <div className="space-y-3">
                {recentRepayments.map((repayment) => (
                  <div
                    key={repayment.date}
                    className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between ${
                      repayment === recentRepayments[0]
                        ? "border-blue-100 bg-blue-50/70"
                        : "border-slate-100 bg-slate-50/80"
                    }`}
                  >
                    <div>
                      <p className="text-sm text-slate-500">{repayment.date}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">
                        {formatAmount(repayment.amount)}
                      </p>
                      {repayment === recentRepayments[0] && (
                        <p className="mt-1 text-xs font-medium text-blue-600">가장 최근 상환</p>
                      )}
                    </div>

                    <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 md:gap-8">
                      <div>
                        <p className="text-slate-500">원금</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(repayment.principal)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">이자</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatAmount(repayment.interest)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">이자 정보</h2>
                <p className="mt-1 text-sm text-slate-500">
                  지금까지 낸 이자와 앞으로 예상되는 부담을 함께 봅니다.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">누적 상환 이자</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(loanInfo.cumulativeInterest)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">남은 예상 이자</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {formatAmount(loanInfo.estimatedRemainingInterest)}
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">현재 금리 기준 메모</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    현재 금리와 평균 원금 상환 속도를 기준으로 보면 조기 상환 시 이자 절감 효과가 분명한 구간입니다.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                  <p className="text-sm text-slate-500">한 줄 해석</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    앞으로 낼 예상 이자가 아직 큰 편이라, 여유 자금이 있을 때 일부 원금을 먼저 줄이는 전략이 유리합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
