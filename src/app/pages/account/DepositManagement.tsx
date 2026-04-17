import { AlertCircle, ArrowRight, CalendarDays, Landmark, RefreshCcw, Wallet } from "lucide-react";
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

function getProductLabel(
  type: DepositAccountSummary["depositProductType"] | DepositAccountDetail["depositProductType"],
) {
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
  const [accountPage, setAccountPage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);
  const pageSize = 3;
  const schedulePageSize = 6;

  const selectedSummary = useMemo(
    () => accounts.find((account) => account.depositAccountId === selectedId) ?? null,
    [accounts, selectedId],
  );

  const nextUnpaidSchedule = useMemo(() => {
    if (!detail || detail.depositProductType !== "FIXED_SAVING") {
      return null;
    }

    return detail.schedules.find((schedule) => !schedule.isPaid) ?? null;
  }, [detail]);

  const pagedAccounts = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(accounts.length / pageSize));
    const currentPage = Math.min(accountPage, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    return accounts.slice(startIndex, startIndex + pageSize);
  }, [accounts, accountPage]);

  const accountTotalPages = useMemo(
    () => Math.max(1, Math.ceil(accounts.length / pageSize)),
    [accounts],
  );
  const pagedSchedules = useMemo(() => {
    const schedules = detail?.schedules ?? [];
    const totalPages = Math.max(1, Math.ceil(schedules.length / schedulePageSize));
    const currentPage = Math.min(schedulePage, totalPages);
    const startIndex = (currentPage - 1) * schedulePageSize;
    return schedules.slice(startIndex, startIndex + schedulePageSize);
  }, [detail?.schedules, schedulePage]);
  const scheduleTotalPages = useMemo(
    () => Math.max(1, Math.ceil((detail?.schedules.length ?? 0) / schedulePageSize)),
    [detail?.schedules.length],
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
        const response = await getJson<DepositAccountDetail>(
          `/api/deposit-accounts/me/${selectedId}`,
        );
        if (!isMounted) {
          return;
        }
        setDetail(response);
        setSchedulePage(1);
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
    const selectedIndex =
      nextSelectedId == null
        ? -1
        : nextAccounts.findIndex((account) => account.depositAccountId === nextSelectedId);
    const nextPage = selectedIndex >= 0 ? Math.floor(selectedIndex / pageSize) + 1 : 1;

    setAccounts(nextAccounts);
    setSelectedId(nextSelectedId);
    setAccountPage(nextPage);

    if (nextSelectedId == null) {
      setDetail(null);
      setPaymentAmount("");
      return;
    }

    const nextDetail = await getJson<DepositAccountDetail>(
      `/api/deposit-accounts/me/${nextSelectedId}`,
    );
    setDetail(nextDetail);
    setSchedulePage(1);

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

    if (detail.depositProductType === "FIXED_SAVING") {
      if (!nextUnpaidSchedule) {
        setActionError("납입 가능한 회차가 없습니다.");
        return;
      }
      if (amount !== nextUnpaidSchedule.plannedAmount) {
        setActionError(
          `이번 회차 납입 금액은 ${formatWon(nextUnpaidSchedule.plannedAmount)} 이어야 합니다.`,
        );
        return;
      }
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 pb-14 pt-12">
        <h1 className="text-2xl font-bold text-slate-800">예적금 관리</h1>
        <p className="mt-2 text-sm text-slate-400">
          가입한 예금과 적금의 상태를 확인하고 납입과 해지를 처리할 수 있습니다
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-14">
        {isLoading ? (
          <section className="rounded-2xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            예적금 계좌를 불러오는 중입니다.
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-700 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            예적금 정보를 불러오지 못했습니다. {error}
          </section>
        ) : accounts.length === 0 ? (
          <section className="rounded-2xl bg-white px-6 py-16 text-center shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-bold text-slate-900">아직 가입한 예적금이 없습니다.</h2>
            <p className="mt-3 text-sm text-slate-500">
              상품을 둘러보고 바로 예금이나 적금에 가입해 보세요.
            </p>
            <Link
              to="/deposit/products"
              className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-5 py-3 text-sm font-semibold transition-colors hover:bg-gray-800"
              style={{ color: "#ffffff" }}
            >
              예적금 상품 보기
            </Link>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pagedAccounts.map((account) => {
                  const isSelected = account.depositAccountId === selectedId;

                  return (
                    <button
                      key={account.depositAccountId}
                      type="button"
                      onClick={() => setSelectedId(account.depositAccountId)}
                      className={`w-full rounded-2xl px-5 py-5 text-left shadow-[0_2px_20px_rgba(0,0,0,0.06)] transition ${
                        isSelected
                          ? "bg-white ring-1 ring-slate-900"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {account.depositProductName}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {account.depositAccountNumber}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {getProductLabel(account.depositProductType)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-100 px-4 py-3">
                          <p className="text-xs text-slate-400">현재 잔액</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatWon(account.currentBalance)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-100 px-4 py-3">
                          <p className="text-xs text-slate-400">상태</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatStatus(account.status)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                        <span>{formatRate(account.interestRate)}</span>
                        <span>
                          {account.paidInstallmentCount}/
                          {account.totalInstallmentCount || account.savingMonth} 회차
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {accounts.length > pageSize && (
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={accountPage <= 1}
                    onClick={() => setAccountPage((current) => Math.max(1, current - 1))}
                  >
                    이전
                  </button>
                  <span className="text-sm text-slate-500">
                    {accountPage} / {accountTotalPages}
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={accountPage >= accountTotalPages}
                    onClick={() =>
                      setAccountPage((current) => Math.min(accountTotalPages, current + 1))
                    }
                  >
                    다음
                  </button>
                </div>
              )}
            </section>

            <section className="space-y-4">
              {isRefreshing ? (
                <div className="rounded-2xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
                  선택한 예적금 정보를 불러오는 중입니다.
                </div>
              ) : !detail ? (
                <div
                  className={`rounded-2xl px-6 py-16 text-center text-sm shadow-[0_2px_20px_rgba(0,0,0,0.08)] ${
                    actionError
                      ? "border border-red-200 bg-red-50 text-red-700"
                      : "bg-white text-slate-500"
                  }`}
                >
                  {actionError || "선택한 예적금 정보를 불러오지 못했습니다."}
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-white px-6 pb-6 pt-7 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-400">{getProductLabel(detail.depositProductType)}</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">
                          {detail.depositProductName}
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                          {detail.depositProductDescription}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {formatStatus(detail.status)}
                      </span>
                    </div>

                    <div className="mt-5 flex border-t border-slate-100 pt-5">
                      <div className="flex-1 border-r border-slate-100 pr-5">
                        <span className="text-xs text-slate-400">현재 잔액</span>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatWon(detail.currentBalance)}
                        </p>
                      </div>
                      <div className="flex-1 border-r border-slate-100 px-5">
                        <span className="text-xs text-slate-400">적용 금리</span>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {formatRate(detail.interestRate)}
                        </p>
                      </div>
                      <div className="flex-1 pl-5">
                        <span className="text-xs text-slate-400">가입 기간</span>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {detail.savingMonth}개월
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-slate-700" />
                        <div>
                          <p className="text-xs text-slate-400">
                            {detail.depositProductType === "FIXED_DEPOSIT" ? "가입 금액" : "월 납입 금액"}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatWon(getDisplayJoinAmount(detail))}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-5 w-5 text-slate-700" />
                        <div>
                          <p className="text-xs text-slate-400">만기일</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {detail.maturityDate}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-3">
                        <RefreshCcw className="h-5 w-5 text-slate-700" />
                        <div>
                          <p className="text-xs text-slate-400">납입 진행</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {detail.paidInstallmentCount}/
                            {detail.totalInstallmentCount || detail.savingMonth}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-5 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-3">
                        <Landmark className="h-5 w-5 text-slate-700" />
                        <div>
                          <p className="text-xs text-slate-400">연결 계좌</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {detail.linkedAccountNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.86fr)]">
                    <section className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                      <h3 className="text-sm font-bold text-slate-900">납입 / 해지</h3>
                      <p className="mt-2 text-sm text-slate-500">
                        적금은 다음 회차 금액으로 납입할 수 있고, 예금과 적금 모두 현재 상태에서 해지할 수 있습니다.
                      </p>

                      {detail.depositProductType === "FIXED_SAVING" && detail.status === "ACTIVE" && (
                        <form className="mt-5 space-y-4" onSubmit={handlePaymentSubmit}>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-500">
                              납입 금액
                            </label>
                            <input
                              value={paymentAmount}
                              onChange={(event) =>
                                setPaymentAmount(event.target.value.replace(/[^\d]/g, ""))
                              }
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                              placeholder="납입 금액을 입력하세요"
                            />
                          </div>
                          {nextUnpaidSchedule && (
                            <p className="text-sm text-slate-500">
                              다음 납입 회차 {nextUnpaidSchedule.installmentNo}회차 ·{" "}
                              {formatWon(nextUnpaidSchedule.plannedAmount)}
                            </p>
                          )}
                          <button
                            type="submit"
                            disabled={isPaying}
                            className="rounded-full bg-black px-5 py-3 text-sm font-semibold transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            style={isPaying ? undefined : { color: "#ffffff" }}
                          >
                            {isPaying ? "납입 처리 중..." : "납입하기"}
                          </button>
                        </form>
                      )}

                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={handleWithdraw}
                          disabled={isClosing || detail.status !== "ACTIVE"}
                          className="rounded-full bg-black px-5 py-3 text-sm font-semibold transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                          style={isClosing || detail.status !== "ACTIVE" ? undefined : { color: "#ffffff" }}
                        >
                          {isClosing ? "해지 처리 중..." : "해지하기"}
                        </button>
                      </div>

                      {actionError && (
                        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                          {actionError}
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-slate-700" />
                        <h3 className="text-sm font-bold text-slate-900">안내 사항</h3>
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-slate-500">
                        <p>가입일 {detail.startDate}</p>
                        <p>만기일 {detail.maturityDate}</p>
                        <p>예금은 추가 납입 없이 유지되며, 적금은 회차별 납입이 필요합니다.</p>
                        <p>만기 이전 해지는 중도해지로 처리됩니다.</p>
                      </div>
                    </section>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <section className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-slate-900">납입 스케줄</h3>
                        {detail.schedules.length > schedulePageSize && (
                          <span className="text-sm text-slate-400">
                            {schedulePage} / {scheduleTotalPages}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 space-y-3">
                        {detail.schedules.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                            표시할 납입 스케줄이 없습니다.
                          </div>
                        ) : (
                          pagedSchedules.map((schedule) => (
                            <div
                              key={schedule.depositPaymentScheduleId}
                              className="rounded-xl border border-slate-100 px-4 py-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {schedule.installmentNo}회차
                                  </p>
                                  <p className="mt-1 text-sm text-slate-400">
                                    예정일 {schedule.dueDate}
                                  </p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  {schedule.isPaid ? "납입완료" : "대기중"}
                                </span>
                              </div>
                              <div className="mt-3 grid gap-2 text-sm text-slate-500">
                                <p>예정 금액 {formatWon(schedule.plannedAmount)}</p>
                                <p>실제 금액 {formatWon(schedule.paidAmount)}</p>
                                <p>자동이체 여부 {schedule.autoTransferYn ? "사용" : "미사용"}</p>
                                <p>
                                  자동이체 상태 {formatAutoTransferStatus(schedule.autoTransferStatus)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {detail.schedules.length > schedulePageSize && (
                        <div className="mt-4 flex items-center justify-between">
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={schedulePage <= 1}
                            onClick={() => setSchedulePage((current) => Math.max(1, current - 1))}
                          >
                            이전
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={schedulePage >= scheduleTotalPages}
                            onClick={() =>
                              setSchedulePage((current) =>
                                Math.min(scheduleTotalPages, current + 1),
                              )
                            }
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
                      <h3 className="text-sm font-bold text-slate-900">거래 내역</h3>
                      <div className="mt-4 space-y-3">
                        {detail.transactions.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                            표시할 거래 내역이 없습니다.
                          </div>
                        ) : (
                          detail.transactions.map((transaction) => (
                            <div
                              key={transaction.depositTransactionId}
                              className="rounded-xl border border-slate-100 px-4 py-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {formatTransactionType(transaction.transactionType)}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-400">
                                    {transaction.transactionDatetime}
                                  </p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                  {transaction.status}
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-semibold text-slate-900">
                                {formatWon(transaction.amount)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
