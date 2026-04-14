import { useEffect, useMemo, useState } from "react";
import { CreditCard, Receipt, Wallet } from "lucide-react";

import { getJson } from "../../lib/api";

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
  title: "\uCE74\uB4DC \uC774\uC6A9 \uB0B4\uC5ED",
  subtitle: "\uCE74\uB4DC \uC794\uC561\uACFC \uCD5C\uADFC \uACB0\uC81C \uB0B4\uC5ED\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  selectAccount: "\uC5F0\uACB0 \uACC4\uC88C \uC120\uD0DD",
  noAccount: "\uD45C\uC2DC\uD560 \uACC4\uC88C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
  availableBalance: "\uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uC794\uC561",
  noBankAccount: "\uACC4\uC88C \uC5C6\uC74C",
  monthlySpent: "\uC774\uBC88 \uB2EC \uC0AC\uC6A9\uC561",
  monthlySpentHint: "\uCE74\uB4DC \uAC70\uB798 \uAE30\uC900 \uB204\uC801 \uAE08\uC561",
  cardInfo: "\uCE74\uB4DC \uC815\uBCF4",
  noCardInfo: "\uCE74\uB4DC \uC815\uBCF4 \uC5C6\uC74C",
  noCardIssued: "\uBBF8\uBC1C\uAE09",
  activeCard: "\uC815\uC0C1 \uC0AC\uC6A9 \uAC00\uB2A5",
  noLinkedCard: "\uC5F0\uACB0\uB41C \uCE74\uB4DC \uC5C6\uC74C",
  loading: "\uCE74\uB4DC \uC774\uC6A9 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.",
  unauthorized: "\uB85C\uADF8\uC778 \uD6C4 \uCE74\uB4DC \uC774\uC6A9 \uB0B4\uC5ED\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  requestFailed: "\uCE74\uB4DC \uC774\uC6A9 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
  emptyTitle: "\uC774\uC6A9 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
  emptyBody: "\uCE74\uB4DC \uACB0\uC81C\uAC00 \uBC1C\uC0DD\uD558\uBA74 \uCD5C\uADFC \uAC70\uB798 \uB0B4\uC5ED\uC774 \uC774\uACF3\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
} as const;

function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}\uC6D0`;
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
    case "OPEN":
      return "예적금 가입";
    case "PAY":
      return "적금 납입";
    case "MATURITY":
      return "만기해지";
    case "EARLY_CLOSE":
      return "중도해지";
    default:
      return "예적금 거래";
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
    sourceType: "DEPOSIT",
  };
}

function maskCardNumber(cardNumber: string | null) {
  if (!cardNumber) {
    return UI_TEXT.noCardInfo;
  }

  const parts = cardNumber.split("-");
  if (parts.length !== 4) {
    return cardNumber;
  }

  return `${parts[0]}-****-****-${parts[3]}`;
}

export default function CardHistory() {
  const [accounts, setAccounts] = useState<CardHistoryAccount[]>([]);
  const [depositDetails, setDepositDetails] = useState<DepositAccountDetail[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoading(true);
      setErrorMessage("");

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

        if (!isMounted) {
          return;
        }

        setAccounts(response.accounts);
        setDepositDetails(details.filter((detail): detail is DepositAccountDetail => detail !== null));
        setSelectedAccountId((current) => current ?? response.accounts[0]?.accountId ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "REQUEST_FAILED";
        setErrorMessage(message === "UNAUTHORIZED" ? UI_TEXT.unauthorized : UI_TEXT.requestFailed);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.accountId === selectedAccountId) ?? accounts[0] ?? null,
    [accounts, selectedAccountId],
  );

  const mergedTransactions = useMemo(() => {
    if (!selectedAccount) {
      return [];
    }

    const cardTransactions: HistoryTransaction[] = selectedAccount.transactions.map((transaction) => ({
      ...transaction,
      sourceType: "CARD",
    }));

    const depositTransactions = depositDetails
      .filter((detail) => detail.linkedAccountId === selectedAccount.accountId)
      .flatMap((detail) =>
        detail.transactions.map((transaction) => toDepositHistoryTransaction(detail, transaction)),
      );

    return [...cardTransactions, ...depositTransactions].sort(
      (left, right) =>
        new Date(right.transactionDatetime).getTime() - new Date(left.transactionDatetime).getTime(),
    );
  }, [depositDetails, selectedAccount]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
                Card History
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{UI_TEXT.title}</h1>
              <p className="mt-2 text-sm text-slate-500">{UI_TEXT.subtitle}</p>
            </div>

            <div className="w-full lg:max-w-sm">
              <label
                htmlFor="card-history-account-select"
                className="mb-2 block text-sm font-medium text-slate-500"
              >
                {UI_TEXT.selectAccount}
              </label>
              <select
                id="card-history-account-select"
                value={selectedAccountId ?? ""}
                onChange={(event) => setSelectedAccountId(Number(event.target.value))}
                disabled={accounts.length === 0 || isLoading}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                {accounts.length === 0 ? (
                  <option value="">{UI_TEXT.noAccount}</option>
                ) : (
                  accounts.map((account) => (
                    <option key={account.accountId} value={account.accountId}>
                      {account.accountName} {account.accountNumber}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,_rgba(219,234,254,0.95)_0%,_rgba(239,246,255,0.98)_48%,_rgba(248,250,252,1)_100%)] px-5 py-5 text-slate-900 shadow-[0_20px_45px_rgba(148,163,184,0.18)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs tracking-[0.12em] text-sky-700/70">{UI_TEXT.availableBalance}</p>
                  <p className="mt-3 text-3xl font-semibold">
                    {selectedAccount ? formatAmount(selectedAccount.balance) : "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/80 p-3 text-sky-600 shadow-sm">
                  <Wallet className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <span>{selectedAccount?.accountName ?? UI_TEXT.noBankAccount}</span>
                <span>{selectedAccount?.accountNumber ?? "-"}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{UI_TEXT.monthlySpent}</p>
                <CreditCard className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                {selectedAccount ? formatAmount(selectedAccount.spentThisMonth) : "-"}
              </p>
              <p className="mt-2 text-sm text-slate-500">{UI_TEXT.monthlySpentHint}</p>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">{UI_TEXT.cardInfo}</p>
              <p className="mt-4 text-lg font-semibold text-slate-900">
                {maskCardNumber(selectedAccount?.cardNumber ?? null)}
              </p>
              <p className="mt-1 text-sm text-slate-500">{selectedAccount?.cardStatus ?? UI_TEXT.noCardIssued}</p>
              <p className="mt-4 text-sm font-medium text-emerald-700">
                {selectedAccount?.cardId ? UI_TEXT.activeCard : UI_TEXT.noLinkedCard}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 md:px-8">{UI_TEXT.loading}</div>
        ) : errorMessage ? (
          <div className="px-6 py-16 text-center md:px-8">
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
          </div>
        ) : !selectedAccount || mergedTransactions.length === 0 ? (
          <div className="px-6 py-16 text-center md:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Receipt className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">{UI_TEXT.emptyTitle}</p>
            <p className="mt-2 text-sm text-slate-500">{UI_TEXT.emptyBody}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {mergedTransactions.map((transaction) => (
              <div
                key={transaction.transactionId}
                className={`px-6 py-5 transition-colors md:px-8 ${
                  isLoanDisbursementTransaction(transaction)
                    ? "bg-emerald-50/50 hover:bg-emerald-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                        isLoanDisbursementTransaction(transaction)
                          ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                          : "border-blue-100 bg-blue-50 text-blue-500"
                      }`}
                    >
                      <Receipt className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-900">
                        {transaction.marketName}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {isLoanDisbursementTransaction(transaction)
                          ? "대출 실행 입금"
                          : isSavingsTransaction(transaction)
                            ? transaction.menuName ?? "예적금 거래"
                          : transaction.categoryName}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{transaction.transactionDatetime}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-lg font-bold md:text-xl ${
                        isIncomingTransaction(transaction)
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {isIncomingTransaction(transaction) ? "+" : "-"}
                      {formatAmount(Math.abs(transaction.amount))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
