import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  ShieldCheck,
  Wallet,
} from "lucide-react";
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
  protectedBalance: number;
};

type DepositAccountActionResponse = {
  depositAccountId: number;
  status: string;
  currentBalance: number;
  amount: number;
  message: string;
};

type ApplyStep = "guide" | "input" | "confirm";

const applySteps: { id: ApplyStep; label: string }[] = [
  { id: "guide", label: "가입 안내" },
  { id: "input", label: "정보 입력" },
  { id: "confirm", label: "최종 확인" },
];

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
  return product.rates
    .flatMap((rate) => {
      const options: number[] = [];
      for (let month = rate.minSavingMonth; month <= rate.maxSavingMonth; month += 1) {
        options.push(month);
      }
      return options;
    })
    .filter((month, index, months) => months.indexOf(month) === index);
}

function getProductBadge(product: DepositProduct) {
  return product.depositProductType === "FIXED_DEPOSIT" ? "목돈 예치" : "매월 납입";
}

function getGuideTexts(product: DepositProduct) {
  if (product.depositProductType === "FIXED_DEPOSIT") {
    return {
      guideItems: [
        "가입 시 한 번에 예치할 금액과 만기 기간을 확인합니다.",
        "중도 해지 시 적용 금리가 달라질 수 있으므로 약관을 꼭 확인해야 합니다.",
        "만기 시 원금과 이자가 연결 계좌로 입금됩니다.",
      ],
      notices: [
        "예금은 가입 후 추가 납입이 불가능합니다.",
        "중도 해지 시 우대금리 및 약정금리가 변경될 수 있습니다.",
      ],
    };
  }

  return {
    guideItems: [
      "초기 납입 금액과 매월 납입 금액을 함께 설정합니다.",
      "자동이체일을 설정하면 월 납입 일정 관리가 쉬워집니다.",
      "회차 누락 시 만기 수령액이 달라질 수 있습니다.",
    ],
    notices: [
      "적금은 매월 납입 금액이 동일해야 정상 납입 처리됩니다.",
      "자동이체 실패 시 해당 회차 상태를 다시 확인해야 합니다.",
    ],
  };
}

export default function DepositApply() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();

  const [product, setProduct] = useState<DepositProduct | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [currentStep, setCurrentStep] = useState<ApplyStep>("guide");
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
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          가입 화면을 준비하는 중입니다.
        </div>
      </div>
    );
  }

  if (!product || loadError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-[32px] border border-red-200 bg-red-50 p-12 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-bold text-red-800">가입할 상품을 불러오지 못했습니다.</h1>
          <p className="mt-3 text-sm text-red-700">{loadError || "상품 정보가 없습니다."}</p>
          <Link
            to="/deposit/products"
            className="mt-5 inline-flex rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isSavingProduct = product.depositProductType === "FIXED_SAVING";
  const periodOptions = getPeriodOptions(product);
  const guideTexts = getGuideTexts(product);

  const validateInputStep = () => {
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

    if (!validateInputStep()) {
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
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <Link
          to="/deposit/products"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          예적금 상품 목록으로 돌아가기
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">Deposit Apply</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{product.depositProductName} 가입</h1>
          <p className="mt-3 text-slate-600">{product.depositProductDescription}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">상품 유형</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{getProductBadge(product)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">가입 기간</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {product.minSavingMonth}개월 ~ {product.maxSavingMonth}개월
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">금리 범위</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatRateLabel(product)}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              {applySteps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = applySteps.findIndex((item) => item.id === currentStep) > index;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border px-4 py-4 text-sm ${
                      isActive
                        ? "border-sky-300 bg-sky-50 text-sky-900"
                        : isCompleted
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Step {index + 1}</p>
                    <p className="mt-2 text-base font-semibold">{step.label}</p>
                  </div>
                );
              })}
            </div>

            {currentStep === "guide" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <PiggyBank className="h-5 w-5 text-sky-700" />
                    <h2 className="text-xl font-bold text-slate-900">가입 전 확인 사항</h2>
                  </div>
                  <div className="space-y-3">
                    {guideTexts.guideItems.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-700" />
                    <h2 className="text-xl font-bold text-amber-950">주의 사항</h2>
                  </div>
                  <div className="space-y-3">
                    {guideTexts.notices.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-4 text-sm text-amber-950"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setCurrentStep("input");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#2a4b78] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#223f64]"
                  >
                    <span>다음</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === "input" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <PiggyBank className="h-5 w-5 text-sky-700" />
                    <h2 className="text-xl font-bold text-slate-900">가입 정보 입력</h2>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="saving-month" className="mb-2 block text-sm font-medium text-slate-600">
                        가입 기간
                      </label>
                      <select
                        id="saving-month"
                        value={savingMonth}
                        onChange={(event) => setSavingMonth(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      >
                        {periodOptions.map((month) => (
                          <option key={month} value={month}>
                            {month}개월
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="join-amount" className="mb-2 block text-sm font-medium text-slate-600">
                        가입 금액
                      </label>
                      <input
                        id="join-amount"
                        value={joinAmount}
                        onChange={(event) => setJoinAmount(event.target.value.replace(/[^\d]/g, ""))}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        placeholder="가입 금액을 입력해 주세요"
                      />
                    </div>
                  </div>

                  {isSavingProduct && (
                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                      <div>
                        <label htmlFor="monthly-amount" className="mb-2 block text-sm font-medium text-slate-600">
                          월 납입 금액
                        </label>
                        <input
                          id="monthly-amount"
                          value={monthlyAmount}
                          onChange={(event) => setMonthlyAmount(event.target.value.replace(/[^\d]/g, ""))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                          placeholder="월 납입 금액을 입력해 주세요"
                        />
                      </div>
                      <div>
                        <label htmlFor="auto-transfer-day" className="mb-2 block text-sm font-medium text-slate-600">
                          자동이체일
                        </label>
                        <input
                          id="auto-transfer-day"
                          value={autoTransferDay}
                          onChange={(event) => setAutoTransferDay(event.target.value.replace(/[^\d]/g, "").slice(0, 2))}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                          placeholder="매월 자동이체일을 입력해 주세요"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-sky-700" />
                    <h2 className="text-xl font-bold text-slate-900">출금 계좌 선택</h2>
                  </div>

                  <div>
                    <label htmlFor="source-account" className="mb-2 block text-sm font-medium text-slate-600">
                      출금 계좌
                    </label>
                    <select
                      id="source-account"
                      value={sourceAccountId}
                      onChange={(event) => setSourceAccountId(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    >
                      {accounts.map((account) => (
                        <option key={account.accountId} value={account.accountId}>
                          {account.accountName} {account.accountNumber}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-slate-500">
                      선택 계좌 잔액 {selectedAccount ? formatWon(selectedAccount.balance) : "-"}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setCurrentStep("guide");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>이전</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateInputStep()) {
                        setCurrentStep("confirm");
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#2a4b78] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#223f64]"
                  >
                    <span>다음</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === "confirm" && (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-sky-700" />
                    <h2 className="text-xl font-bold text-slate-900">최종 확인</h2>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">상품명</p>
                      <p className="mt-2 font-semibold text-slate-900">{product.depositProductName}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">가입 기간</p>
                      <p className="mt-2 font-semibold text-slate-900">{savingMonth}개월</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">가입 금액</p>
                      <p className="mt-2 font-semibold text-slate-900">{formatWon(parseNumber(joinAmount))}</p>
                    </div>
                    {isSavingProduct && (
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                        <p className="text-sm text-slate-500">월 납입 금액</p>
                        <p className="mt-2 font-semibold text-slate-900">{formatWon(parseNumber(monthlyAmount))}</p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">출금 계좌</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {selectedAccount ? `${selectedAccount.accountName} ${selectedAccount.accountNumber}` : "-"}
                      </p>
                    </div>
                    {isSavingProduct && (
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                        <p className="text-sm text-slate-500">자동이체일</p>
                        <p className="mt-2 font-semibold text-slate-900">{autoTransferDay}일</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-5">
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(event) => setAgreeTerms(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <span>상품 안내와 가입 조건을 확인했고 이에 동의합니다.</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(event) => setAgreePrivacy(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <span>가입 진행을 위한 개인정보 처리에 동의합니다.</span>
                  </label>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setCurrentStep("input");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>이전</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-[#2a4b78] px-6 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-[#223f64] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "가입 처리 중..." : "가입 요청"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-sky-100 p-3 text-sky-700">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">현재 선택 조건</p>
                <h2 className="text-lg font-bold text-slate-900">가입 요약</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                <p className="text-slate-500">상품명</p>
                <p className="mt-1 font-semibold text-slate-900">{product.depositProductName}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                <p className="text-slate-500">금리 범위</p>
                <p className="mt-1 font-semibold text-slate-900">{formatRateLabel(product)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                <p className="text-slate-500">가입 금액</p>
                <p className="mt-1 font-semibold text-slate-900">{formatWon(parseNumber(joinAmount))}</p>
              </div>
              {isSavingProduct && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                  <p className="text-slate-500">월 납입 금액</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatWon(parseNumber(monthlyAmount))}</p>
                </div>
              )}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                <p className="text-slate-500">출금 계좌</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedAccount ? `${selectedAccount.accountName} ${selectedAccount.accountNumber}` : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-amber-200 bg-amber-50/80 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/80 p-3 text-amber-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">최종 확인</p>
                <h2 className="text-lg font-bold text-amber-950">가입 전 유의사항</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-amber-950">
              {guideTexts.notices.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">가입 조건</p>
                <h2 className="text-lg font-bold text-slate-900">상품 기본 정보</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <p>최소 가입 금액: {formatWon(product.depositMinAmount)}</p>
              <p>최대 가입 금액: {formatWon(product.depositMaxAmount)}</p>
              <p>
                가입 가능 기간: {product.minSavingMonth}개월 ~ {product.maxSavingMonth}개월
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
