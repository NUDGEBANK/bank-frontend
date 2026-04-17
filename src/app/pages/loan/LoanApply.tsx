import { ArrowRight, ChevronLeft } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { getJson, postJson } from "../../lib/api";

type LoanApplyConfig = {
  name: string;
  subtitle: string;
  limit: string;
  period: string;
  rate: string;
  defaultAmount: string;
  defaultPurpose: string;
  amountRange: { min: number; max: number };
  termOptions: string[];
};

const amountRanges: Record<string, { min: number; max: number }> = {
  "consumption-loan": { min: 500000, max: 10000000 },
  "youth-loan": { min: 500000, max: 5000000 },
};

const termOptionsByProduct: Record<string, string[]> = {
  "consumption-loan": ["6개월", "12개월", "18개월"],
  "youth-loan": ["12개월", "18개월", "24개월"],
};

type LoanApplicationSummary = {
  loanApplicationId: number;
  productKey: string;
  productName: string;
  applicationStatus: string;
  appliedAt: string;
  requiresCertificateSubmission: boolean;
  certificateSubmitted: boolean;
};

type LoanEligibilityResponse = {
  eligible: boolean;
  decision: "APPROVED" | "REJECTED";
  creditScore: number;
  productKey: string;
  reasons: string[];
};

type CardHistoryResponse = {
  ok: boolean;
  message: string;
  accounts: CardHistoryAccount[];
};

type CardHistoryAccount = {
  accountId: number;
  accountName: string;
  accountNumber: string;
  cardId: number | null;
  cardNumber: string | null;
};

const productConfigs: Record<string, LoanApplyConfig> = {
  "consumption-loan": {
    name: "넛지 대출",
    subtitle: "소비 흐름을 기준으로 자금 운용 부담을 조절할 수 있는 상품입니다.",
    limit: "최대 1,000만원",
    period: "6개월 ~ 18개월",
    rate: "연 5% ~ 12%",
    defaultAmount: "2000000",
    defaultPurpose: "생활비 및 소비 관리",
    amountRange: { min: 500000, max: 10000000 },
    termOptions: ["6개월", "12개월", "18개월"],
  },
  "youth-loan": {
    name: "자기계발 대출",
    subtitle: "자격증, 어학, 직무 교육 등 자기계발 비용을 준비하는 청년 대상 상품입니다.",
    limit: "최대 500만원",
    period: "12개월 ~ 24개월",
    rate: "연 5.5% (우대 적용 시 최저 3.5%)",
    defaultAmount: "3000000",
    defaultPurpose: "자격증 및 직무 교육 준비",
    amountRange: { min: 500000, max: 5000000 },
    termOptions: ["12개월", "18개월", "24개월"],
  },
};

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

export default function LoanApply() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const product = productId ? productConfigs[productId] : undefined;
  const [amount, setAmount] = useState(product?.defaultAmount ?? "");
  const termOptions = productId ? termOptionsByProduct[productId] ?? ["12개월"] : ["12개월"];
  const amountRange =
    productId ? amountRanges[productId] ?? { min: 0, max: Number.MAX_SAFE_INTEGER } : { min: 0, max: Number.MAX_SAFE_INTEGER };
  const [loanTerm, setLoanTerm] = useState(termOptions[0] ?? "12개월");
  const [purpose, setPurpose] = useState(product?.defaultPurpose ?? "");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [salaryDate, setSalaryDate] = useState("");
  const [accounts, setAccounts] = useState<CardHistoryAccount[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | "">("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [eligibility, setEligibility] = useState<LoanEligibilityResponse | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibilityError, setEligibilityError] = useState("");

  useEffect(() => {
    if (!product) {
      return;
    }
    setAmount(product.defaultAmount);
    setPurpose(product.defaultPurpose);
    setLoanTerm(product.termOptions[0] ?? "12개월");
  }, [productId, product]);

  useEffect(() => {
    let isMounted = true;

    async function loadAccounts() {
      try {
        const response = await getJson<CardHistoryResponse>("/api/cards/history");
        if (!isMounted) {
          return;
        }

        setAccounts(response.accounts);
        setSelectedCardId(
          (current) =>
            current || response.accounts.find((account) => account.cardId)?.cardId || "",
        );
      } catch {
        if (isMounted) {
          setAccounts([]);
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

    async function checkEligibility() {
      if (!productId) {
        return;
      }

      setIsCheckingEligibility(true);
      setEligibilityError("");
      setEligibility(null);

      try {
        const result = await postJson<LoanEligibilityResponse>("/api/loan-products/eligibility", {
          productKey: productId,
        });

        if (!isMounted) {
          return;
        }

        setEligibility(result);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setEligibility(null);
        setEligibilityError(err instanceof Error ? err.message : "대출 가능 여부를 확인하지 못했습니다.");
      } finally {
        if (isMounted) {
          setIsCheckingEligibility(false);
        }
      }
    }

    void checkEligibility();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (!productId || !product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">요청한 상품을 찾을 수 없습니다.</h1>
          <Link to="/loan/products" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            대출 상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isSubmitDisabled =
      isSubmitting ||
      isCheckingEligibility ||
      !eligibility ||
      !eligibility.eligible;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!eligibility || !eligibility.eligible) {
      setError("현재 조건으로는 대출 신청이 불가능합니다.");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setError("약관 및 개인정보 동의를 모두 체크해 주세요.");
      return;
    }

    const parsedAmount = Number(amount);
    const parsedMonthlyIncome = Number(monthlyIncome);
    const parsedSalaryDate = Number(salaryDate);

    if (Number.isNaN(parsedAmount) || parsedAmount < amountRange.min || parsedAmount > amountRange.max) {
      setError(`신청 금액은 ${amountRange.min.toLocaleString("ko-KR")}원~${amountRange.max.toLocaleString("ko-KR")}원 범위로 입력해 주세요.`);
      return;
    }

    if (!termOptions.includes(loanTerm)) {
      setError("상품 조건에 맞는 상환 기간을 선택해 주세요.");
      return;
    }

    if (Number.isNaN(parsedMonthlyIncome) || parsedMonthlyIncome <= 0) {
      setError("월 소득을 입력해 주세요.");
      return;
    }

    if (Number.isNaN(parsedSalaryDate) || parsedSalaryDate < 1 || parsedSalaryDate > 31) {
      setError("급여일은 1일부터 31일 사이로 입력해 주세요.");
      return;
    }

    if (!selectedCardId) {
      setError("신청 카드를 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await postJson<LoanApplicationSummary>("/api/loan-applications/submit", {
        productKey: productId,
        loanAmount: parsedAmount,
        loanTerm,
        monthlyIncome: parsedMonthlyIncome,
        salaryDate: parsedSalaryDate,
        purpose,
        cardId: selectedCardId,
      });
      window.dispatchEvent(new Event("loan-application-change"));
      navigate("/loan/management");
    } catch (err) {
      setError(err instanceof Error ? err.message : "대출 신청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-14">
        {/* 뒤로가기 */}
        <Link
          to={`/loan/products/${productId}`}
          className="mb-8 inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600"
        >
          <ChevronLeft className="h-4 w-4" />
          상품 상세로 돌아가기
        </Link>

        {/* 상품 요약 카드 */}
        <div className="rounded-2xl bg-white px-6 pb-6 pt-7 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-bold text-slate-900">{product.name} 신청</h1>
          <p className="mt-1.5 text-sm text-slate-400">{product.subtitle}</p>

          <div className="mt-5 flex border-t border-slate-100 pt-5">
            <div className="flex-1 border-r border-slate-100 pr-5">
              <span className="text-xs text-slate-400">한도</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">{product.limit}</p>
            </div>
            <div className="flex-1 border-r border-slate-100 px-5">
              <span className="text-xs text-slate-400">기간</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">{product.period}</p>
            </div>
            <div className="flex-1 pl-5">
              <span className="text-xs text-slate-400">금리</span>
              <p className="mt-1 text-sm font-semibold text-slate-700">{product.rate}</p>
            </div>
          </div>
        </div>

        {/* 대출 가능 여부 */}
        <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <span className="text-xs text-slate-400">대출 가능 여부</span>
          {isCheckingEligibility ? (
            <p className="mt-1.5 text-sm text-slate-500">조회 중입니다...</p>
          ) : eligibilityError ? (
            <p className="mt-1.5 text-sm text-red-500">대출 가능 여부를 확인하지 못했습니다.</p>
          ) : eligibility ? (
            <>
              <p className={`mt-1.5 text-sm font-semibold ${eligibility.eligible ? "text-emerald-600" : "text-red-500"}`}>
                {eligibility.eligible ? "대출 신청 가능" : "대출 신청 불가"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                내부 신용점수 {eligibility.creditScore}점
                {eligibility.reasons[0] && <span className="ml-1 text-slate-400">· {eligibility.reasons[0]}</span>}
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-sm text-slate-500">대출 가능 여부 정보가 없습니다.</p>
          )}
        </div>

        {/* 진행 순서 */}
        <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h3 className="mb-3 text-sm font-bold text-slate-900">진행 순서</h3>
          <ol className="space-y-1.5 text-sm text-slate-500">
            <li>1. 상품 조건 확인</li>
            <li>2. 대출 가능 여부 확인</li>
            <li>3. 신청 정보 입력 및 동의</li>
            <li>4. 신청 완료 후 내 대출 관리에서 상태 확인</li>
            {productId === "youth-loan" && <li>5. 자기계발 대출은 OCR 서류 제출 진행</li>}
          </ol>
        </div>

        {/* 안내 사항 */}
        <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h3 className="mb-3 text-sm font-bold text-slate-900">안내 사항</h3>
          <ul className="space-y-1.5 text-sm text-slate-500">
            <li>· 신청 후 실제 승인 여부는 심사 결과에 따라 달라질 수 있습니다.</li>
            {productId === "youth-loan" && (
              <li>· 자기계발 대출은 신청 후 내 대출 관리에서 OCR 인증을 진행합니다.</li>
            )}
            {productId === "consumption-loan" && (
              <li>· 넛지 대출은 신청 후 바로 심사 상태를 조회할 수 있습니다.</li>
            )}
            <li>· 대출 가능 여부는 내부 신용점수를 기준으로 판단됩니다.</li>
            <li>· 신용점수가 500점 이상이면 신청 버튼이 활성화됩니다.</li>
            <li>· 신청 정보는 안전하게 저장되며, 대출 관리 화면에서 확인할 수 있습니다.</li>
          </ul>
        </div>

        {/* 신청 폼 */}
        <form className="mt-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <h2 className="mb-5 text-sm font-bold text-slate-900">신청 정보</h2>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">신청 금액</label>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className={inputClass}
                  placeholder="신청 금액을 입력해 주세요"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">상환 기간</label>
                <select
                  value={loanTerm}
                  onChange={(event) => setLoanTerm(event.target.value)}
                  className={inputClass}
                >
                  {termOptions.map((termOption) => (
                    <option key={termOption} value={termOption}>
                      {termOption}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">신청 카드</label>
                <select
                  value={selectedCardId}
                  onChange={(event) => setSelectedCardId(event.target.value ? Number(event.target.value) : "")}
                  className={inputClass}
                >
                  <option value="">카드를 선택해 주세요</option>
                  {accounts
                    .filter((account) => account.cardId)
                    .map((account) => (
                      <option key={account.cardId} value={account.cardId ?? ""}>
                        {account.cardNumber ?? "카드 없음"} / {account.accountName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">월 소득</label>
                  <input
                    value={monthlyIncome}
                    onChange={(event) => setMonthlyIncome(event.target.value)}
                    className={inputClass}
                    placeholder="월 소득을 입력해 주세요"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">급여일</label>
                  <input
                    value={salaryDate}
                    onChange={(event) => setSalaryDate(event.target.value)}
                    className={inputClass}
                    placeholder="매월 급여일을 입력해 주세요"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">신청 목적</label>
                <textarea
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
          </div>

          {/* 동의 */}
          <div className="mt-4 rounded-2xl bg-white px-6 py-5 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <div className="space-y-3">
              <label className="flex items-start gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                대출 상품 설명서 및 약관 내용을 확인했고 이에 동의합니다.
              </label>
              <label className="flex items-start gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(event) => setAgreePrivacy(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
                />
                대출 심사를 위한 개인정보 수집 및 이용에 동의합니다.
              </label>
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`mt-5 flex w-full items-center justify-center gap-1.5 rounded-full py-3.5 text-sm font-semibold transition-colors ${
              isSubmitDisabled
                ? "cursor-not-allowed bg-slate-200 text-slate-400"
                : "bg-black hover:bg-gray-800"
            }`}
            style={isSubmitDisabled ? undefined : { color: "#ffffff" }}
          >
            {isSubmitting
              ? "신청 처리 중..."
              : eligibility && !eligibility.eligible
                ? "대출 신청 불가"
                : "대출 신청 완료"}
            {!isSubmitDisabled && <ArrowRight className="h-4 w-4" style={{ color: "#ffffff" }} />}
          </button>
        </form>

      </div>
    </div>
  );
}
