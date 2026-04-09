import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

type DepositApplyConfig = {
  name: string;
  subtitle: string;
  badge: string;
  amountLabel: string;
  periodLabel: string;
  rateLabel: string;
  defaultPeriod: string;
  periodOptions: string[];
  defaultJoinAmount: string;
  defaultMonthlyAmount?: string;
  defaultAutoTransferDay?: string;
  documentSummary: string[];
  productImportantNotice: string[];
  consumerRights: string[];
  joinChecklist: string[];
  notices: string[];
};

const depositProductConfigs: Record<string, DepositApplyConfig> = {
  "fixed-deposit": {
    name: "정기예금",
    subtitle: "목돈을 한 번에 예치하고 만기까지 유지하는 기본 예금 가입 화면입니다.",
    badge: "목돈 예치",
    amountLabel: "최소 100만 원부터",
    periodLabel: "6개월 ~ 24개월",
    rateLabel: "연 2.8% ~ 3.6%",
    defaultPeriod: "12개월",
    periodOptions: ["6개월", "12개월", "24개월"],
    defaultJoinAmount: "3000000",
    documentSummary: [
      "상품설명서에는 가입 대상, 예치 기간, 이자 지급 방식이 포함됩니다.",
      "예금거래 기본약관과 중도해지 기준을 가입 전에 확인해야 합니다.",
      "가입 시점 금리와 만기 처리 방식은 최종 확인 화면에서 다시 안내됩니다.",
    ],
    productImportantNotice: [
      "약정 금리는 가입 시점에 확정되며 만기 전 해지 시 별도 중도해지 금리가 적용될 수 있습니다.",
      "만기일 이후에는 약정 금리가 아닌 만기 후 이율이 적용될 수 있습니다.",
      "세전 이자 기준으로 안내되며 실제 수령액은 세금 공제 후 달라질 수 있습니다.",
    ],
    consumerRights: [
      "상품 가입 전 상품설명서와 약관을 충분히 확인할 권리가 있습니다.",
      "이해되지 않는 조건이나 수수료, 금리 구조에 대해 설명을 요구할 수 있습니다.",
      "전자금융거래 관련 보안 유의사항과 개인정보 제공 범위를 확인해야 합니다.",
    ],
    joinChecklist: [
      "가입 금액과 만기 처리 방식을 정확히 선택했는지 확인합니다.",
      "출금 계좌 잔액이 가입 금액 이상인지 확인합니다.",
      "중도해지, 만기 후 이율, 세금 관련 안내를 읽고 동의해야 가입이 진행됩니다.",
    ],
    notices: [
      "중도 해지 시 약정 금리보다 낮은 중도해지 금리가 적용될 수 있습니다.",
      "가입 후 예치 금액을 추가 납입하는 방식은 지원하지 않습니다.",
      "실제 가입 가능 금리와 만기 수령 금액은 상품 확정 후 반영됩니다.",
    ],
  },
  "fixed-saving": {
    name: "정기적금",
    subtitle: "매월 일정 금액을 납입하며 목표 자금을 모으는 적금 가입 화면입니다.",
    badge: "월 납입",
    amountLabel: "월 10만 원부터",
    periodLabel: "6개월 ~ 36개월",
    rateLabel: "연 3.0% ~ 4.1%",
    defaultPeriod: "12개월",
    periodOptions: ["6개월", "12개월", "24개월", "36개월"],
    defaultJoinAmount: "500000",
    defaultMonthlyAmount: "300000",
    defaultAutoTransferDay: "25",
    documentSummary: [
      "상품설명서에는 월 납입 조건, 자동이체, 만기 처리 방식이 포함됩니다.",
      "적금 약관에는 미납, 중도해지, 만기 후 처리 기준이 안내됩니다.",
      "가입 시점 금리와 우대조건 적용 여부는 최종 확인 단계에서 다시 확인합니다.",
    ],
    productImportantNotice: [
      "약정 금리는 기본금리와 우대금리 조건으로 나뉠 수 있으며 실제 적용 금리는 가입 조건에 따라 달라집니다.",
      "중도 해지 또는 미납 회차 발생 시 약정 금리와 다른 해지 이율이 적용될 수 있습니다.",
      "만기일 이후에는 만기 후 이율이 적용될 수 있으며, 자동이체 실패 시 납입 회차가 누락될 수 있습니다.",
    ],
    consumerRights: [
      "상품 가입 전 월 납입 구조와 자동이체 조건에 대해 설명을 요구할 수 있습니다.",
      "우대금리 조건과 적용 제외 조건을 사전에 확인할 권리가 있습니다.",
      "전자금융거래 및 개인정보 제공 범위를 읽고 동의 여부를 결정할 수 있습니다.",
    ],
    joinChecklist: [
      "월 납입 금액과 자동이체일을 정확히 선택했는지 확인합니다.",
      "출금 계좌 잔액과 자동이체 가능 상태를 확인합니다.",
      "미납, 중도해지, 만기 후 이율 안내를 읽고 동의해야 가입이 진행됩니다.",
    ],
    notices: [
      "미납 회차가 있으면 만기 수령 금액이나 적용 금리가 달라질 수 있습니다.",
      "자동이체 실패 시 해당 회차 납입 상태를 다시 확인해야 합니다.",
      "실제 가입 가능 금리와 우대 조건은 상품 확정 후 반영됩니다.",
    ],
  },
};

const sourceAccounts = [
  { id: "main-1", label: "주거래 통장", number: "123-456-789012", balance: "5,420,000원" },
  { id: "main-2", label: "생활비 통장", number: "654-321-987654", balance: "1,830,000원" },
];

const applySteps = [
  { id: "guide", label: "가입안내" },
  { id: "input", label: "정보입력" },
  { id: "confirm", label: "최종확인" },
] as const;

type ApplyStep = (typeof applySteps)[number]["id"];

export default function DepositApply() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const product = productId ? depositProductConfigs[productId] : undefined;
  const isSavingProduct = productId === "fixed-saving";

  const [joinAmount, setJoinAmount] = useState(product?.defaultJoinAmount ?? "");
  const [savingPeriod, setSavingPeriod] = useState(product?.defaultPeriod ?? "");
  const [sourceAccountId, setSourceAccountId] = useState(sourceAccounts[0]?.id ?? "");
  const [maturityInstruction, setMaturityInstruction] = useState("재예치 없이 본인 계좌로 받기");
  const [monthlyAmount, setMonthlyAmount] = useState(product?.defaultMonthlyAmount ?? "");
  const [autoTransferDay, setAutoTransferDay] = useState(product?.defaultAutoTransferDay ?? "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<ApplyStep>("guide");

  const selectedAccount = useMemo(
    () => sourceAccounts.find((account) => account.id === sourceAccountId) ?? sourceAccounts[0],
    [sourceAccountId],
  );

  if (!productId || !product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          <h1 className="text-2xl font-bold text-slate-900">가입할 예적금 상품을 찾을 수 없습니다</h1>
          <Link
            to="/deposit/products"
            className="mt-4 inline-block rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            예적금 상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const validateInputStep = () => {
    setError("");

    if (!savingPeriod) {
      setError("가입 기간을 선택해 주세요.");
      return false;
    }

    if (!joinAmount) {
      setError(isSavingProduct ? "첫 납입 금액을 입력해 주세요." : "가입 금액을 입력해 주세요.");
      return false;
    }

    if (isSavingProduct && !monthlyAmount) {
      setError("월 납입 금액을 입력해 주세요.");
      return false;
    }

    if (isSavingProduct && !autoTransferDay) {
      setError("자동이체일을 입력해 주세요.");
      return false;
    }

    return true;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!agreeTerms || !agreePrivacy) {
      setError("상품 약관 동의와 개인정보 동의를 모두 체크해 주세요.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      navigate("/deposit/products");
    }, 700);
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
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{product.name} 가입</h1>
          <p className="mt-3 text-slate-600">{product.subtitle}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">상품 유형</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{product.badge}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">가입 조건</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{product.amountLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">가입 기간</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{product.periodLabel}</p>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-base font-semibold">{step.label}</p>
                  </div>
                );
              })}
            </div>

            {currentStep === "guide" && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <FileText className="h-5 w-5 text-sky-700" />
                    <h2 className="text-xl font-bold text-slate-900">가입안내 및 상품설명서 확인</h2>
                  </div>
                  <div className="space-y-3">
                    {product.documentSummary.map((item) => (
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
                    <h2 className="text-xl font-bold text-amber-950">상품 중요사항 안내</h2>
                  </div>
                  <div className="space-y-3">
                    {product.productImportantNotice.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-4 text-sm text-amber-950"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-sky-700" />
                      <h2 className="text-xl font-bold text-slate-900">금융소비자의 권리안내</h2>
                    </div>
                    <div className="space-y-3">
                      {product.consumerRights.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-sky-700" />
                      <h2 className="text-xl font-bold text-slate-900">금융상품 가입 주요 안내</h2>
                    </div>
                    <div className="space-y-3">
                      {product.joinChecklist.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
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
                    <label className="mb-2 block text-sm font-medium text-slate-600">가입 기간</label>
                    <select
                      value={savingPeriod}
                      onChange={(event) => setSavingPeriod(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    >
                      {product.periodOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      {isSavingProduct ? "첫 납입 금액" : "가입 금액"}
                    </label>
                    <input
                      value={joinAmount}
                      onChange={(event) => setJoinAmount(event.target.value.replace(/[^\d]/g, ""))}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      placeholder={isSavingProduct ? "첫 납입 금액을 입력해 주세요" : "가입 금액을 입력해 주세요"}
                    />
                  </div>
                </div>

                {isSavingProduct && (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">월 납입 금액</label>
                      <input
                        value={monthlyAmount}
                        onChange={(event) => setMonthlyAmount(event.target.value.replace(/[^\d]/g, ""))}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        placeholder="월 납입 금액을 입력해 주세요"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-600">자동이체일</label>
                      <input
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
                  <h2 className="text-xl font-bold text-slate-900">출금 계좌 및 만기 처리</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">출금 계좌</label>
                    <select
                      value={sourceAccountId}
                      onChange={(event) => setSourceAccountId(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    >
                      {sourceAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.label} {account.number}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-slate-500">선택 계좌 잔액 {selectedAccount.balance}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-600">만기 처리 방식</label>
                    <select
                      value={maturityInstruction}
                      onChange={(event) => setMaturityInstruction(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    >
                      <option value="재예치 없이 본인 계좌로 받기">재예치 없이 본인 계좌로 받기</option>
                      <option value="만기 후 재예치 여부 추후 선택">만기 후 재예치 여부 추후 선택</option>
                    </select>
                  </div>
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
                      <p className="mt-2 font-semibold text-slate-900">{product.name}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">가입 기간</p>
                      <p className="mt-2 font-semibold text-slate-900">{savingPeriod}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">{isSavingProduct ? "첫 납입 금액" : "가입 금액"}</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {joinAmount ? `${Number(joinAmount).toLocaleString("ko-KR")}원` : "-"}
                      </p>
                    </div>
                    {isSavingProduct && (
                      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                        <p className="text-sm text-slate-500">월 납입 금액</p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {monthlyAmount ? `${Number(monthlyAmount).toLocaleString("ko-KR")}원` : "-"}
                        </p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">출금 계좌</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {selectedAccount.label} {selectedAccount.number}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                      <p className="text-sm text-slate-500">만기 처리 방식</p>
                      <p className="mt-2 font-semibold text-slate-900">{maturityInstruction}</p>
                    </div>
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
                    <span>상품설명서와 예금거래 기본약관 내용을 확인했고 이에 동의합니다.</span>
                  </label>
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreePrivacy}
                      onChange={(event) => setAgreePrivacy(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                    />
                    <span>가입 진행을 위한 개인정보 수집 및 이용에 동의합니다.</span>
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
                    className="rounded-2xl bg-[#2a4b78] px-6 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-[#223f64]"
                  >
                    {isSubmitting ? "가입 정보 확인 중..." : "가입 신청"}
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
                <p className="mt-1 font-semibold text-slate-900">{product.name}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                <p className="text-slate-500">가입 기간</p>
                <p className="mt-1 font-semibold text-slate-900">{savingPeriod || "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                <p className="text-slate-500">{isSavingProduct ? "첫 납입 금액" : "가입 금액"}</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {joinAmount ? `${Number(joinAmount).toLocaleString("ko-KR")}원` : "-"}
                </p>
              </div>
              {isSavingProduct && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                  <p className="text-slate-500">월 납입 금액</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {monthlyAmount ? `${Number(monthlyAmount).toLocaleString("ko-KR")}원` : "-"}
                  </p>
                </div>
              )}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4">
                <p className="text-slate-500">출금 계좌</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {selectedAccount.label} {selectedAccount.number}
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
                <p className="text-sm font-medium text-amber-800">가입 전 확인</p>
                <h2 className="text-lg font-bold text-amber-950">최종 유의사항</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-amber-950">
              {product.notices.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
