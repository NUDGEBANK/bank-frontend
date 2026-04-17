import { useEffect, useMemo, useState } from "react";
import { CreditCard, Receipt, Wallet, ChevronDown, Info } from "lucide-react";
import { useNavigate } from "react-router";

import { getJson } from "../../lib/api";

// --- Types & Utils (기존 로직 동일) ---
type CardHistoryResponse = {
  ok: boolean;
  message: string;
  accounts: CardHistoryAccount[];
};

type CardHistoryAccount = {
  accountId: number;
  accountName: string;
  accountNumber: string;
  balance: number;
  cardId: number | null;
  cardNumber: string | null;
  expiredYm: string | null;
  cardStatus: string | null;
  spentThisMonth: number;
  transactions: CardHistoryTransaction[];
};

type CardHistoryTransaction = {
  transactionId: number;
  marketName: string;
  categoryName: string;
  amount: number;
  transactionDatetime: string;
  menuName: string | null;
  quantity: number | null;
  autoRepaymentApplied: boolean;
  repaymentAmount: number | null;
};

type DepositAccountSummary = {
  depositAccountId: number;
  linkedAccountId: number;
};

type DepositTransaction = {
  depositTransactionId: number;
  transactionType: string;
  amount: number;
  transactionDatetime: string;
  status: string;
};

type DepositAccountDetail = {
  depositAccountId: number;
  depositProductName: string;
  linkedAccountId: number;
  transactions: DepositTransaction[];
};

type HistoryTransaction = CardHistoryTransaction & {
  sourceType: "CARD" | "DEPOSIT";
};

const UI_TEXT = {
  title: "카드 이용 내역",
  subtitle: "카드 잔액과 최근 결제 내역을 확인할 수 있습니다.",
  selectAccount: "연결 계좌 선택",
  noAccount: "표시할 계좌가 없습니다",
  availableBalance: "사용 가능한 잔액",
  noBankAccount: "계좌 없음",
  monthlySpent: "이번 달 사용액",
  monthlySpentHint: "카드 거래 기준 누적 금액",
  cardInfo: "카드 정보",
  noCardInfo: "카드 정보 없음",
  noCardIssued: "미발급",
  activeCard: "정상 사용 가능",
  noLinkedCard: "연결된 카드 없음",
  loading: "카드 이용 내역을 불러오는 중입니다.",
  unauthorized: "로그인 후 카드 이용 내역을 확인할 수 있습니다.",
  requestFailed: "카드 이용 내역을 불러오지 못했습니다.",
  emptyTitle: "이용 내역이 없습니다",
  emptyBody: "카드 결제가 발생하면 최근 거래 내역이 이곳에 표시됩니다.",
} as const;

function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function isSavingsTransaction(transaction: HistoryTransaction) {
  return transaction.categoryName === "예적금";
}

function isLoanDisbursementTransaction(transaction: CardHistoryTransaction) {
  return (
      transaction.marketName === "NudgeBank 대출 실행" ||
      transaction.categoryName === "대출"
  );
}

function isIncomingTransaction(transaction: HistoryTransaction) {
  return transaction.amount > 0;
}

function formatDepositTransactionLabel(type: string) {
  switch (type) {
    case "OPEN": return "예적금 가입";
    case "PAY": return "적금 납입";
    case "MATURITY": return "만기해지";
    case "EARLY_CLOSE": return "중도해지";
    default: return "예적금 거래";
  }
}

function isDepositIncomingTransaction(type: string) {
  return type === "MATURITY" || type === "EARLY_CLOSE";
}

function toDepositHistoryTransaction(
    detail: DepositAccountDetail,
    transaction: DepositTransaction,
): HistoryTransaction {
  const signedAmount = isDepositIncomingTransaction(transaction.transactionType)
      ? Math.abs(transaction.amount)
      : -Math.abs(transaction.amount);

  return {
    transactionId: -transaction.depositTransactionId,
    marketName: detail.depositProductName,
    categoryName: "예적금",
    amount: signedAmount,
    transactionDatetime: transaction.transactionDatetime,
    menuName: formatDepositTransactionLabel(transaction.transactionType),
    quantity: null,
    autoRepaymentApplied: false,
    repaymentAmount: null,
    sourceType: "DEPOSIT",
  };
}

function maskCardNumber(cardNumber: string | null) {
  if (!cardNumber) return UI_TEXT.noCardInfo;
  const parts = cardNumber.split("-");
  if (parts.length !== 4) return cardNumber;
  return `${parts[0]}-****-****-${parts[3]}`;
}

export default function CardHistory() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<CardHistoryAccount[]>([]);
  const [depositDetails, setDepositDetails] = useState<DepositAccountDetail[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      setIsLoading(true);
      try {
        const [response, depositAccounts] = await Promise.all([
          getJson<CardHistoryResponse>("/api/cards/history"),
          getJson<DepositAccountSummary[]>("/api/deposit-accounts/me").catch(() => []),
        ]);
        const details = await Promise.all(
            depositAccounts.map((account) =>
                getJson<DepositAccountDetail>(`/api/deposit-accounts/me/${account.depositAccountId}`).catch(() => null),
            ),
        );
        if (!isMounted) return;
        setAccounts(response.accounts);
        setDepositDetails(details.filter((detail): detail is DepositAccountDetail => detail !== null));
        setSelectedAccountId((current) => current ?? response.accounts[0]?.accountId ?? null);
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "REQUEST_FAILED";
        setErrorMessage(message === "UNAUTHORIZED" ? UI_TEXT.unauthorized : UI_TEXT.requestFailed);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void loadHistory();
    return () => { isMounted = false; };
  }, []);

  const selectedAccount = useMemo(
      () => accounts.find((account) => account.accountId === selectedAccountId) ?? accounts[0] ?? null,
      [accounts, selectedAccountId],
  );

  const mergedTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    const cardTransactions: HistoryTransaction[] = selectedAccount.transactions.map((transaction) => ({
      ...transaction, sourceType: "CARD",
    }));
    const depositTransactions = depositDetails
        .filter((detail) => detail.linkedAccountId === selectedAccount.accountId)
        .flatMap((detail) => detail.transactions.map((transaction) => toDepositHistoryTransaction(detail, transaction)));

    return [...cardTransactions, ...depositTransactions].sort(
        (left, right) => new Date(right.transactionDatetime).getTime() - new Date(left.transactionDatetime).getTime()
    );
  }, [depositDetails, selectedAccount]);

  const isAutoRepaymentTransaction = (transaction: HistoryTransaction) =>
      transaction.sourceType === "CARD" && transaction.autoRepaymentApplied;

  const handleTransactionClick = (transaction: HistoryTransaction) => {
    if (isAutoRepaymentTransaction(transaction)) {
      navigate(`/loan/management?repaymentTransactionId=${transaction.transactionId}`);
    }
  };

  if (isLoading) return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">{UI_TEXT.loading}</div>
  );

  return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-6">
          <h1 className="text-2xl font-bold text-slate-800">{UI_TEXT.title}</h1>
          <p className="mt-2 text-sm text-slate-400">{UI_TEXT.subtitle}</p>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-14">
          {/* 계좌 선택 및 요약 카드 */}
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:max-w-xs">
                <label className="mb-2 block text-sm font-bold text-slate-400 uppercase tracking-wider">{UI_TEXT.selectAccount}</label>
                <div className="relative">
                  <select
                      value={selectedAccountId ?? ""}
                      onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    {accounts.map((acc) => (
                        <option key={acc.accountId} value={acc.accountId}>{acc.accountName} {acc.accountNumber}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
              <div className="py-4 md:px-6 md:py-2">
                <h3 className="text-sm font-bold text-sky-600 uppercase tracking-wider">{UI_TEXT.availableBalance}</h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">{selectedAccount ? formatAmount(selectedAccount.balance) : "-"}</p>
                <p className="mt-1 text-sm text-slate-400">{selectedAccount?.accountNumber}</p>
              </div>
              <div className="py-4 md:px-6 md:py-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{UI_TEXT.monthlySpent}</h3>
                <p className="mt-2 text-2xl font-bold text-slate-900">{selectedAccount ? formatAmount(selectedAccount.spentThisMonth) : "-"}</p>
                <p className="mt-1 text-sm text-slate-400">{UI_TEXT.monthlySpentHint}</p>
              </div>
              <div className="py-4 md:px-6 md:py-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{UI_TEXT.cardInfo}</h3>
                <p className="mt-2 text-lg font-bold text-slate-900">{maskCardNumber(selectedAccount?.cardNumber ?? null)}</p>
                <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {selectedAccount?.cardId ? UI_TEXT.activeCard : UI_TEXT.noLinkedCard}
                </span>
                </div>
              </div>
            </div>
          </div>

          {/* 안내 문구 추가 */}
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] px-4 py-3.5">
            <Info className="h-5 w-5 text-rose-500 shrink-0" />
            <p className="text-lg font-medium text-rose-500 font-medium leading-relaxed">
              자동상환된 카드내역을 누르면 해당 대출 관리페이지에 최근상환내역으로 이동합니다.
            </p>
          </div>

          {/* 거래 내역 리스트 */}
          <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] overflow-hidden">
            {errorMessage ? (
                <div className="py-20 text-center text-rose-500 font-medium">{errorMessage}</div>
            ) : mergedTransactions.length === 0 ? (
                <div className="py-20 text-center">
                  <Receipt className="mx-auto h-12 w-12 text-slate-200 mb-4" />
                  <p className="text-slate-900 font-bold">{UI_TEXT.emptyTitle}</p>
                  <p className="text-slate-400 text-sm mt-1">{UI_TEXT.emptyBody}</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-50">
                  {mergedTransactions.map((tx) => (
                      <div
                          key={tx.transactionId}
                          onClick={() => handleTransactionClick(tx)}
                          className={`group flex items-center justify-between p-6 transition-all hover:bg-slate-50/80 ${isAutoRepaymentTransaction(tx) ? "cursor-pointer" : ""}`}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-base font-bold text-slate-900">{tx.marketName}</p>
                            <p className="text-sm font-semibold text-slate-400 mt-0.5">
                              {isLoanDisbursementTransaction(tx) ? "대출 실행 입금" : isSavingsTransaction(tx) ? tx.menuName : tx.categoryName}
                              <span className="mx-2 text-slate-200">|</span>
                              {tx.transactionDatetime}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-extrabold ${
                              (tx.sourceType === "CARD" && isLoanDisbursementTransaction(tx)) || (tx.sourceType === "DEPOSIT" && isIncomingTransaction(tx))
                                  ? "text-emerald-500" : "text-slate-900"
                          }`}>
                            {((tx.sourceType === "CARD" && isLoanDisbursementTransaction(tx)) || (tx.sourceType === "DEPOSIT" && isIncomingTransaction(tx))) ? "+" : "-"}
                            {formatAmount(Math.abs(tx.amount))}
                          </p>
                          {isAutoRepaymentTransaction(tx) && tx.repaymentAmount !== null && (
                              <p className="text-sm font-bold text-red-500 mt-1 bg-violet-50 px-2 py-0.5 rounded-md inline-block">
                                {formatAmount(Math.abs(tx.repaymentAmount))} 자동상환
                              </p>
                          )}
                        </div>
                      </div>
                  ))}
                </div>
            )}
          </div>
        </div>
      </div>
  );
}