import { ArrowRight, ChevronLeft } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { getJson, postJson } from "../../lib/api";

type DepositProductRate = {
  depositProductRateId: number;
  minSavingMonth: number;
  maxSavingMonth: number;
  interestRate: number;
};

type DepositProduct = {
  depositProductId: number;
  depositProductName: string;
  depositProductType: "FIXED_DEPOSIT" | "FIXED_SAVING";
  depositProductDescription: string;
  depositMinAmount: number;
  depositMaxAmount: number | null;
  minSavingMonth: number;
  maxSavingMonth: number;
  rates: DepositProductRate[];
};

type AccountSummary = {
  accountId: number;
  accountName: string;
  accountNumber: string;
  balance: number;
};

type DepositAccountActionResponse = {
  depositAccountId: number;
  status: string;
  currentBalance: number;
  amount: number;
  message: string;
};

function formatWon(value: number | null | undefined) {
  if (value == null) {
    return "-";
  }

  return `${value.toLocaleString("ko-KR")}원`;
}

function parseNumber(input: string) {
  const numeric = input.replace(/[^\d]/g, "");
  return numeric ? Number(numeric) : 0;
}

function formatRateLabel(product: DepositProduct) {
  if (product.rates.length === 0) {
    return "금리 정보 없음";
  }

  const values = product.rates.map((rate) => rate.interestRate);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return min === max ? `연 ${min.toFixed(2)}%` : `연 ${min.toFixed(2)}% ~ ${max.toFixed(2)}%`;
}

function getPeriodOptions(product: DepositProduct) {
  if (product.rates.length === 0) {
    const options: number[] = [];
    for (let month = product.minSavingMonth; month <= product.maxSavingMonth; month += 1) {
      options.push(month);
    }
    return options;
  }

  return Array.from(
    new Set(
      product.rates.flatMap((rate) => {
        const options: number[] = [];
        for (let month = rate.minSavingMonth; month <= rate.maxSavingMonth; month += 1) {
          options.push(month);
        }
        return options;
      }),
    ),
  ).sort((left, right) => left - right);
}

function getProductBadge(product: DepositProduct) {
  return product.depositProductType === "FIXED_DEPOSIT" ? "목돈 예치" : "매월 납입";
}

function getGuideTexts(product: DepositProduct) {
  if (product.depositProductType === "FIXED_DEPOSIT") {
    return {
      guideItems: [
        "가입 시 한 번에 예치할 금액과 만기 기간을 확인합니다.",
        "만기 시 원금과 이자가 연결 계좌로 입금됩니다.",
        "중도 해지 시 적용 금리가 달라질 수 있습니다.",
      ],
      notices: [
        "예금은 가입 후 추가 납입이 불가능합니다.",
        "중도 해지 시 약정 금리와 실제 적용 금리가 달라질 수 있습니다.",
        "가입 금액은 선택한 출금 계좌 잔액 이내에서만 설정할 수 있습니다.",
      ],
    };
  }

  return {
    guideItems: [
      "초기 납입 금액과 매월 납입 금액을 함께 설정합니다.",
      "자동이체일을 설정하면 월 납입 일정에 맞춰 처리됩니다.",
      "만기 전까지 동일한 납입 흐름을 유지하는 것이 중요합니다.",
    ],
    notices: [
      "적금은 매월 납입 금액이 동일해야 정상 납입 처리됩니다.",
      "자동이체 실패 시 해당 회차 납입 상태를 다시 확인해야 합니다.",
      "회차 누락 시 만기 수령액과 실제 이자가 달라질 수 있습니다.",
    ],
  };
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

export default function DepositApply() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();

  const [product, setProduct] = useState<DepositProduct | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [sourceAccountId, setSourceAccountId] = useState("");
  const [savingMonth, setSavingMonth] = useState("");
  const [joinAmount, setJoinAmount] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [autoTransferDay, setAutoTransferDay] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      if (!productId) {
        return;
      }

      setIsLoading(true);
      setLoadError("");

      try {
        const [nextProduct, nextAccounts] = await Promise.all([
          getJson<DepositProduct>(`/api/deposit-products/${productId}`),
          getJson<AccountSummary[]>("/api/accounts/me"),
        ]);

        if (!isMounted) {
          return;
        }

        setProduct(nextProduct);
        setAccounts(nextAccounts);
        setSourceAccountId(nextAccounts[0]?.accountId.toString() ?? "");

        const options = getPeriodOptions(nextProduct);
        setSavingMonth(options[0]?.toString() ?? "");
        setJoinAmount(String(nextProduct.depositMinAmount ?? ""));

        if (nextProduct.depositProductType === "FIXED_SAVING") {
          setMonthlyAmount(String(nextProduct.depositMinAmount ?? ""));
          setAutoTransferDay("25");
        }
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setLoadError(nextError instanceof Error ? nextError.message : "REQUEST_FAILED");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPageData();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.accountId.toString() === sourceAccountId) ?? null,
    [accounts, sourceAccountId],
  );

  if (!productId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">가입 화면을 준비하는 중입니다.</h1>
          <p className="text-sm text-slate-500">상품 정보와 계좌 정보를 불러오고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!product || loadError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">가입할 상품을 찾을 수 없습니다.</h1>
          <p className="text-sm text-slate-500">{loadError || "상품 정보가 없습니다."}</p>
          <Link
            to="/deposit/products"
            className="mt-4 inline-block text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            예적금 상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isSavingProduct = product.depositProductType === "FIXED_SAVING";
  const periodOptions = getPeriodOptions(product);
  const guideTexts = getGuideTexts(product);
  const hasAccounts = accounts.length > 0;

  const validateInput = () => {
    setError("");

    const parsedJoinAmount = parseNumber(joinAmount);
    const parsedMonthlyAmount = parseNumber(monthlyAmount);
    const parsedSavingMonth = Number(savingMonth);
    const selected = accounts.find((account) => account.accountId.toString() === sourceAccountId);

    if (!selected) {
      setError("출금 계좌를 선택해 주세요.");
      return false;
    }

    if (!periodOptions.includes(parsedSavingMonth)) {
      setError("가입 기간을 다시 선택해 주세요.");
      return false;
    }

    if (parsedJoinAmount < product.depositMinAmount) {
      setError(`가입 금액은 최소 ${formatWon(product.depositMinAmount)} 이상이어야 합니다.`);
      return false;
    }

    if (product.depositMaxAmount != null && parsedJoinAmount > product.depositMaxAmount) {
      setError(`가입 금액은 최대 ${formatWon(product.depositMaxAmount)} 이하이어야 합니다.`);
      return false;
    }

    if (selected.balance < parsedJoinAmount) {
      setError("선택한 출금 계좌의 잔액이 부족합니다.");
      return false;
    }

    if (isSavingProduct) {
      if (parsedMonthlyAmount <= 0) {
        setError("월 납입 금액을 입력해 주세요.");
        return false;
      }

      const parsedAutoTransferDay = Number(autoTransferDay);
      if (!Number.isInteger(parsedAutoTransferDay) || parsedAutoTransferDay < 1 || parsedAutoTransferDay > 31) {
        setError("자동이체일은 1일부터 31일 사이로 입력해 주세요.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!agreeTerms || !agreePrivacy) {
      setError("약관 동의와 개인정보 동의를 모두 체크해 주세요.");
      return;
    }

    if (!validateInput()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await postJson<DepositAccountActionResponse>("/api/deposit-accounts", {
        depositProductId: product.depositProductId,
        accountId: Number(sourceAccountId),
        joinAmount: parseNumber(joinAmount),
        savingMonth: Number(savingMonth),
        monthlyPaymentAmount: isSavingProduct ? parseNumber(monthlyAmount) : null,
        autoTransferYn: isSavingProduct,
        autoTransferDay: isSavingProduct ? Number(autoTransferDay) : null,
      });

      window.alert(response.message || "예적금 가입이 완료되었습니다.");
      navigate("/deposit/management");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "가입 요청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 pb-14 pt-10">
        <Link
          to="/deposit/products"
          className="mb-8 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
          상품 목록으로 돌아가기
        </Link>

        <div className="rounded-2xl bg-white px-6 pb-6 pt-7 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-bold text-slate-900">{product.depositProductName} 가입</h1>
          <p className="mt-1.5 text-sm text-slate-400">{product.depositProductDescription}</p>

          <div className="mt-5 flex border-t border-slate-100 pt-5">
            <div className="flex-1 border-r border-slate-100 pr-5">
              <span className="text-xs text-slate-400">유형</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">{getProductBadge(product)}</p>
            </div>
            <div className="flex-1 border-r border-slate-100 px-5">
              <span className="text-xs text-slate-400">기간</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {product.minSavingMonth}개월 ~ {product.maxSavingMonth}개월
              </p>
            </div>
            <div className="flex-1 pl-5">
              <span className="text-xs text-slate-400">금리</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">{formatRateLabel(product)}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h3 className="mb-3 text-sm font-bold text-slate-900">가입 안내</h3>
          <ul className="space-y-1.5 text-sm text-slate-500">
            {guideTexts.guideItems.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h3 className="mb-3 text-sm font-bold text-slate-900">유의 사항</h3>
          <ul className="space-y-1.5 text-sm text-slate-500">
            {guideTexts.notices.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>

        <form className="mt-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <h2 className="mb-5 text-sm font-bold text-slate-900">가입 정보</h2>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">가입 기간</label>
                <select
                  value={savingMonth}
                  onChange={(event) => setSavingMonth(event.target.value)}
                  className={inputClass}
                >
                  {periodOptions.map((month) => (
                    <option key={month} value={month}>
                      {month}개월
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">가입 금액</label>
                <input
                  value={joinAmount}
                  onChange={(event) => setJoinAmount(event.target.value.replace(/[^\d]/g, ""))}
                  className={inputClass}
                  placeholder="가입 금액을 입력해 주세요"
                />
              </div>

              {isSavingProduct && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">월 납입 금액</label>
                    <input
                      value={monthlyAmount}
                      onChange={(event) => setMonthlyAmount(event.target.value.replace(/[^\d]/g, ""))}
                      className={inputClass}
                      placeholder="월 납입 금액을 입력해 주세요"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">자동이체일</label>
                    <input
                      value={autoTransferDay}
                      onChange={(event) => setAutoTransferDay(event.target.value.replace(/[^\d]/g, "").slice(0, 2))}
                      className={inputClass}
                      placeholder="매월 자동이체일을 입력해 주세요"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">출금 계좌</label>
                {hasAccounts ? (
                  <>
                    <select
                      value={sourceAccountId}
                      onChange={(event) => setSourceAccountId(event.target.value)}
                      className={inputClass}
                    >
                      {accounts.map((account) => (
                        <option key={account.accountId} value={account.accountId}>
                          {account.accountName} / {account.accountNumber}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-slate-400">
                      선택 계좌 잔액 {selectedAccount ? formatWon(selectedAccount.balance) : "-"}
                    </p>
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    연결된 출금 계좌가 없습니다. 먼저 계좌를 개설한 뒤 다시 시도해 주세요.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <h3 className="mb-4 text-sm font-bold text-slate-900">가입 요약</h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 px-4 py-4">
                <p className="text-xs text-slate-500">상품명</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{product.depositProductName}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-4">
                <p className="text-xs text-slate-500">가입 금액</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{formatWon(parseNumber(joinAmount))}</p>
              </div>
              {isSavingProduct && (
                <div className="rounded-xl bg-slate-50 px-4 py-4">
                  <p className="text-xs text-slate-500">월 납입 금액</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatWon(parseNumber(monthlyAmount))}</p>
                </div>
              )}
              <div className="rounded-xl bg-slate-50 px-4 py-4">
                <p className="text-xs text-slate-500">출금 계좌</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedAccount ? `${selectedAccount.accountName} ${selectedAccount.accountNumber}` : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                상품 안내와 가입 조건을 확인했고 이에 동의합니다.
              </label>
              <label className="flex items-start gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(event) => setAgreePrivacy(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                가입 진행을 위한 개인정보 처리에 동의합니다.
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !hasAccounts}
            className={`mt-5 flex w-full items-center justify-center gap-1.5 rounded-full py-3.5 text-sm font-semibold transition-colors ${
              isSubmitting || !hasAccounts
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-black hover:bg-gray-800"
            }`}
            style={isSubmitting || !hasAccounts ? undefined : { color: "#ffffff" }}
          >
            {isSubmitting ? "가입 처리 중..." : "가입 요청"}
            {!isSubmitting && hasAccounts && <ArrowRight className="h-4 w-4" style={{ color: "#ffffff" }} />}
          </button>
        </form>
      </div>
    </div>
  );
}
