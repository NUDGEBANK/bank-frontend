import {
  AlertCircle,
  CalendarDays,
  Landmark,
  PiggyBank,
  RefreshCcw,
  Wallet,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { getJson, postJson } from "../../lib/api";

type DepositAccountSummary = {
  depositAccountId: number;
  depositProductId: number;
  depositProductName: string;
  depositProductType: "FIXED_DEPOSIT" | "FIXED_SAVING";
  linkedAccountId: number;
  linkedAccountNumber: string;
  depositAccountNumber: string;
  joinAmount: number;
  currentBalance: number;
  interestRate: number;
  savingMonth: number;
  startDate: string;
  maturityDate: string;
  status: string;
  paidInstallmentCount: number;
  totalInstallmentCount: number;
};

type DepositPaymentSchedule = {
  depositPaymentScheduleId: number;
  installmentNo: number;
  dueDate: string;
  plannedAmount: number;
  paidAmount: number | null;
  paidAt: string | null;
  isPaid: boolean;
  autoTransferYn: boolean;
  autoTransferDay: number | null;
  autoTransferStatus: string | null;
};

type DepositTransaction = {
  depositTransactionId: number;
  depositPaymentScheduleId: number | null;
  transactionType: string;
  amount: number;
  transactionDatetime: string;
  status: string;
};

type DepositAccountDetail = {
  depositAccountId: number;
  depositProductId: number;
  depositProductName: string;
  depositProductType: "FIXED_DEPOSIT" | "FIXED_SAVING";
  depositProductDescription: string;
  linkedAccountId: number;
  linkedAccountNumber: string;
  depositAccountNumber: string;
  joinAmount: number;
  currentBalance: number;
  interestRate: number;
  savingMonth: number;
  startDate: string;
  maturityDate: string;
  status: string;
  paidInstallmentCount: number;
  totalInstallmentCount: number;
  schedules: DepositPaymentSchedule[];
  transactions: DepositTransaction[];
};

type DepositAccountActionResponse = {
  depositAccountId: number;
  status: string;
  currentBalance: number;
  processedAmount: number;
  message: string;
};

function formatWon(value: number | null | undefined) {
  if (value == null) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatRate(rate: number | null | undefined) {
  if (rate == null) {
    return "-";
  }
  return `연 ${rate.toFixed(2)}%`;
}

function parseAmount(input: string) {
  const numeric = input.replace(/[^\d]/g, "");
  return numeric ? Number(numeric) : 0;
}

function formatStatus(status: string) {
  switch (status) {
    case "ACTIVE":
      return "유지중";
    case "CLOSED":
      return "만기해지";
    case "EARLY_CLOSED":
      return "중도해지";
    default:
      return status;
  }
}

function formatTransactionType(type: string) {
  switch (type) {
    case "OPEN":
      return "가입";
    case "PAY":
      return "납입";
    case "MATURITY":
      return "만기해지";
    case "EARLY_CLOSE":
      return "중도해지";
    default:
      return type;
  }
}

function formatAutoTransferStatus(status: string | null) {
  switch (status) {
    case "READY":
      return "대기";
    case "SUCCESS":
      return "성공";
    case "FAILED":
      return "실패";
    case "STOPPED":
      return "중지";
    default:
      return status ?? "-";
  }
}

function getProductLabel(type: DepositAccountSummary["depositProductType"] | DepositAccountDetail["depositProductType"]) {
  return type === "FIXED_DEPOSIT" ? "정기예금" : "정기적금";
}

function getDisplayJoinAmount(detail: DepositAccountDetail) {
  if (detail.depositProductType === "FIXED_DEPOSIT") {
    return detail.joinAmount;
  }

  return detail.schedules[0]?.plannedAmount ?? detail.joinAmount;
}

export default function DepositManagement() {
  const [accounts, setAccounts] = useState<DepositAccountSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DepositAccountDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [actionError, setActionError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const selectedSummary = useMemo(
    () => accounts.find((account) => account.depositAccountId === selectedId) ?? null,
    [accounts, selectedId],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadAccounts() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getJson<DepositAccountSummary[]>("/api/deposit-accounts/me");
        if (!isMounted) {
          return;
        }
        setAccounts(response);
        setSelectedId((current) => current ?? response[0]?.depositAccountId ?? null);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }
        setAccounts([]);
        setSelectedId(null);
        setError(nextError instanceof Error ? nextError.message : "REQUEST_FAILED");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAccounts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      if (!selectedId) {
        setDetail(null);
        return;
      }

      setIsRefreshing(true);
      setActionError("");

      try {
        const response = await getJson<DepositAccountDetail>(`/api/deposit-accounts/me/${selectedId}`);
        if (!isMounted) {
          return;
        }
        setDetail(response);
        if (response.depositProductType === "FIXED_SAVING") {
          const nextSchedule = response.schedules.find((schedule) => !schedule.isPaid);
          setPaymentAmount(nextSchedule ? String(nextSchedule.plannedAmount) : "");
        } else {
          setPaymentAmount("");
        }
      } catch (nextError) {
        if (!isMounted) {
          return;
        }
        setDetail(null);
        setActionError(nextError instanceof Error ? nextError.message : "REQUEST_FAILED");
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  async function refreshAccountsAndDetail(targetId: number) {
    const nextAccounts = await getJson<DepositAccountSummary[]>("/api/deposit-accounts/me");
    const nextSelectedId =
      nextAccounts.find((account) => account.depositAccountId === targetId)?.depositAccountId ??
      nextAccounts[0]?.depositAccountId ??
      null;

    setAccounts(nextAccounts);
    setSelectedId(nextSelectedId);

    if (nextSelectedId == null) {
      setDetail(null);
      setPaymentAmount("");
      return;
    }

    const nextDetail = await getJson<DepositAccountDetail>(`/api/deposit-accounts/me/${nextSelectedId}`);
    setDetail(nextDetail);

    if (nextDetail.depositProductType === "FIXED_SAVING") {
      const nextSchedule = nextDetail.schedules.find((schedule) => !schedule.isPaid);
      setPaymentAmount(nextSchedule ? String(nextSchedule.plannedAmount) : "");
    } else {
      setPaymentAmount("");
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) {
      return;
    }

    const amount = parseAmount(paymentAmount);
    if (amount <= 0) {
      setActionError("납입 금액을 입력해 주세요.");
      return;
    }

    setIsPaying(true);
    setActionError("");

    try {
      const response = await postJson<DepositAccountActionResponse>(
        `/api/deposit-accounts/${detail.depositAccountId}/deposit`,
        { amount },
      );
      window.alert(response.message || "예적금 납입이 완료되었습니다.");
      await refreshAccountsAndDetail(detail.depositAccountId);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "REQUEST_FAILED");
    } finally {
      setIsPaying(false);
    }
  }

  async function handleWithdraw() {
    if (!detail) {
      return;
    }

    const confirmed = window.confirm("해당 예적금 계좌를 해지하시겠습니까?");
    if (!confirmed) {
      return;
    }

    setIsClosing(true);
    setActionError("");

    try {
      const response = await postJson<DepositAccountActionResponse>(
        `/api/deposit-accounts/${detail.depositAccountId}/withdraw`,
        {},
      );
      window.alert(response.message || "예적금 해지가 완료되었습니다.");
      await refreshAccountsAndDetail(detail.depositAccountId);
    } catch (nextError) {
      setActionError(nextError instanceof Error ? nextError.message : "REQUEST_FAILED");
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_34%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_55%,_#eef4fb_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Deposit Management</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              예적금 관리
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              가입한 예금과 적금 계좌를 한 화면에서 확인하고, 적금 납입과 해지까지 처리할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/deposit/products"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              상품 보러가기
            </Link>
          </div>
        </div>
      </div>

      {isLoading ? (
        <section className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          예적금 계좌를 불러오는 중입니다.
        </section>
      ) : error ? (
        <section className="rounded-[32px] border border-red-200 bg-red-50 p-12 text-center text-sm text-red-700 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          예적금 정보를 불러오지 못했습니다. {error}
        </section>
      ) : accounts.length === 0 ? (
        <section className="rounded-[32px] border border-slate-200 bg-white p-12 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-bold text-slate-900">아직 가입한 예적금이 없습니다.</h2>
          <p className="mt-3 text-sm text-slate-600">상품을 둘러보고 바로 예금이나 적금에 가입해 보세요.</p>
          <Link
            to="/deposit/products"
            className="mt-6 inline-flex rounded-2xl bg-[#2a4b78] px-5 py-4 text-sm font-semibold"
            style={{ color: "#ffffff" }}
          >
            예적금 상품 보기
          </Link>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.4fr)]">
          <aside className="space-y-4">
            {accounts.map((account) => {
              const isSelected = account.depositAccountId === selectedId;
              const Icon = account.depositProductType === "FIXED_DEPOSIT" ? Landmark : PiggyBank;

              return (
                <button
                  key={account.depositAccountId}
                  type="button"
                  onClick={() => setSelectedId(account.depositAccountId)}
                  className={`w-full rounded-[28px] border p-6 text-left shadow-[0_20px_50px_rgba(15,23,42,0.06)] transition ${
                    isSelected
                      ? "border-sky-300 bg-sky-50/90"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-white p-3 text-sky-700 shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{account.depositProductName}</p>
                        <p className="mt-1 text-sm text-slate-500">{account.depositAccountNumber}</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {getProductLabel(account.depositProductType)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3">
                      <p className="text-xs tracking-[0.12em] text-slate-500">현재 잔액</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{formatWon(account.currentBalance)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3">
                      <p className="text-xs tracking-[0.12em] text-slate-500">진행 상태</p>
                      <p className="mt-2 text-base font-semibold text-slate-900">{formatStatus(account.status)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>{formatRate(account.interestRate)}</span>
                    <span>
                      {account.paidInstallmentCount}/{account.totalInstallmentCount || account.savingMonth} 회차
                    </span>
                  </div>
                </button>
              );
            })}
          </aside>

          <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            {!detail || isRefreshing ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-12 text-center text-sm text-slate-500">
                선택한 예적금 정보를 불러오는 중입니다.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
                      {getProductLabel(detail.depositProductType)}
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-900">{detail.depositProductName}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{detail.depositProductDescription}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4">
                    <p className="text-sm text-slate-500">계좌 상태</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{formatStatus(detail.status)}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-5">
                    <p className="text-sm text-slate-500">예적금 계좌번호</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{detail.depositAccountNumber}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-5">
                    <p className="text-sm text-slate-500">연결 계좌</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{detail.linkedAccountNumber}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-5">
                    <p className="text-sm text-slate-500">현재 잔액</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{formatWon(detail.currentBalance)}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-5">
                    <p className="text-sm text-slate-500">적용 금리</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{formatRate(detail.interestRate)}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-sky-700" />
                      <div>
                        <p className="text-sm text-slate-500">가입 기간</p>
                        <p className="mt-1 font-semibold text-slate-900">{detail.savingMonth}개월</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-sky-700" />
                      <div>
                        <p className="text-sm text-slate-500">
                          {detail.depositProductType === "FIXED_DEPOSIT" ? "가입 금액" : "월 납입 금액"}
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">{formatWon(getDisplayJoinAmount(detail))}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5">
                    <div className="flex items-center gap-3">
                      <RefreshCcw className="h-5 w-5 text-sky-700" />
                      <div>
                        <p className="text-sm text-slate-500">납입 진행</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {detail.paidInstallmentCount}/{detail.totalInstallmentCount || detail.savingMonth}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                    <h3 className="text-xl font-bold text-slate-900">납입 / 해지</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      적금은 다음 회차 납입 금액을 확인하고 바로 납입할 수 있습니다. 예금과 적금 모두 현재 상태에서 해지할 수 있습니다.
                    </p>

                    {detail.depositProductType === "FIXED_SAVING" && detail.status === "ACTIVE" && (
                      <form className="mt-5 space-y-4" onSubmit={handlePaymentSubmit}>
                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-600">납입 금액</span>
                          <input
                            value={paymentAmount}
                            onChange={(event) => setPaymentAmount(event.target.value.replace(/[^\d]/g, ""))}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            placeholder="납입 금액을 입력하세요"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={isPaying}
                          className="rounded-2xl bg-[#2a4b78] px-5 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                          style={{ color: "#ffffff" }}
                        >
                          {isPaying ? "납입 처리 중..." : "납입하기"}
                        </button>
                      </form>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleWithdraw}
                        disabled={isClosing || detail.status !== "ACTIVE"}
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isClosing ? "해지 처리 중..." : "해지하기"}
                      </button>
                    </div>

                    {actionError && (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {actionError}
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-700" />
                      <h3 className="text-xl font-bold text-amber-950">안내 사항</h3>
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-amber-950">
                      <p>가입일: {detail.startDate}</p>
                      <p>만기일: {detail.maturityDate}</p>
                      <p>예금은 추가 납입 없이 유지되며, 적금은 회차별 납입이 필요합니다.</p>
                      <p>만기 이전 해지는 중도해지로 처리됩니다.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <section className="rounded-3xl border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold text-slate-900">납입 스케줄</h3>
                    <div className="mt-5 space-y-3">
                      {detail.schedules.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
                          표시할 납입 스케줄이 없습니다.
                        </div>
                      ) : (
                        detail.schedules.map((schedule) => (
                          <div
                            key={schedule.depositPaymentScheduleId}
                            className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{schedule.installmentNo}회차</p>
                                <p className="mt-1 text-sm text-slate-500">예정일 {schedule.dueDate}</p>
                              </div>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                {schedule.isPaid ? "납입완료" : "대기중"}
                              </span>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <p className="text-sm text-slate-600">예정 금액 {formatWon(schedule.plannedAmount)}</p>
                              <p className="text-sm text-slate-600">실제 금액 {formatWon(schedule.paidAmount)}</p>
                              <p className="text-sm text-slate-600">자동이체 여부 {schedule.autoTransferYn ? "사용" : "미사용"}</p>
                              <p className="text-sm text-slate-600">
                                자동이체 상태 {formatAutoTransferStatus(schedule.autoTransferStatus)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white p-6">
                    <h3 className="text-xl font-bold text-slate-900">거래 내역</h3>
                    <div className="mt-5 space-y-3">
                      {detail.transactions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
                          표시할 거래 내역이 없습니다.
                        </div>
                      ) : (
                        detail.transactions.map((transaction) => (
                          <div
                            key={transaction.depositTransactionId}
                            className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {formatTransactionType(transaction.transactionType)}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">{transaction.transactionDatetime}</p>
                              </div>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                {transaction.status}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">{formatWon(transaction.amount)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
