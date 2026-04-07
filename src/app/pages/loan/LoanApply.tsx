import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { postJson } from "../../lib/api";

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
  "consumption-loan": { min: 500000, max: 3000000 },
  "youth-loan": { min: 500000, max: 5000000 },
  "situate-loan": { min: 300000, max: 2000000 },
};

const termOptionsByProduct: Record<string, string[]> = {
  "consumption-loan": ["6개월", "12개월", "18개월"],
  "youth-loan": ["12개월", "18개월", "24개월"],
  "situate-loan": ["1개월", "3개월", "6개월", "12개월"],
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

const productConfigs: Record<string, LoanApplyConfig> = {
  "consumption-loan": {
    name: "소비분석 대출",
    subtitle: "소비 흐름을 기준으로 자금 운용 부담을 조절할 수 있는 상품입니다.",
    limit: "최대 300만원",
    period: "6개월 ~ 18개월",
    rate: "연 4.2% ~ 8.9%",
    defaultAmount: "2000000",
    defaultPurpose: "생활비 및 소비 관리",
  },
  "youth-loan": {
    name: "자기계발 대출",
    subtitle: "자격증, 어학, 직무 교육 등 자기계발 비용을 준비하는 청년 대상 상품입니다.",
    limit: "최대 500만원",
    period: "12개월 ~ 24개월",
    rate: "연 3.8% ~ 6.2%",
    defaultAmount: "3000000",
    defaultPurpose: "자격증 및 직무 교육 준비",
  },
  "situate-loan": {
    name: "비상금 대출",
    subtitle: "갑작스러운 지출에 빠르게 대응할 수 있는 소액 단기 상품입니다.",
    limit: "최대 200만원",
    period: "1개월 ~ 12개월",
    rate: "연 5.1% ~ 9.9%",
    defaultAmount: "1000000",
    defaultPurpose: "단기 긴급 자금",
  },
};

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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!productId || !product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">신청할 상품을 찾을 수 없습니다</h1>
          <Link
            to="/loan/products"
            className="mt-4 inline-block font-semibold text-blue-600 hover:underline"
          >
            대출 상품 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!agreeTerms || !agreePrivacy) {
      setError("약관 동의와 개인정보 동의를 모두 체크해 주세요.");
      return;
    }

    if (!productId) {
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

    setIsSubmitting(true);
    try {
      await postJson<LoanApplicationSummary>("/api/loan-applications", {
        productKey: productId,
        loanAmount: parsedAmount,
        loanTerm,
        monthlyIncome: parsedMonthlyIncome,
        salaryDate: parsedSalaryDate,
        purpose,
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
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <Link
          to={`/loan/products/${productId}`}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          ← 상품 상세로 돌아가기
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
            Application
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{product.name} 신청</h1>
          <p className="mt-3 text-slate-600">{product.subtitle}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">한도</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{product.limit}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">기간</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{product.period}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-600">금리</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{product.rate}</p>
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">신청 금액</label>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="신청 금액을 입력해 주세요"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">상환 기간</label>
              <select
                value={loanTerm}
                onChange={(event) => setLoanTerm(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                {termOptions.map((termOption) => (
                  <option key={termOption} value={termOption}>
                    {termOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">월 소득</label>
                <input
                  value={monthlyIncome}
                  onChange={(event) => setMonthlyIncome(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="월 소득을 입력해 주세요"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600">급여일</label>
                <input
                  value={salaryDate}
                  onChange={(event) => setSalaryDate(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="매월 급여일을 입력해 주세요"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">신청 목적</label>
              <textarea
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(event) => setAgreeTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>대출 상품 설명서 및 약관 내용을 확인했고 이에 동의합니다.</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(event) => setAgreePrivacy(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>대출 심사를 위한 개인정보 수집 및 이용에 동의합니다.</span>
              </label>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#6d8ca6] py-4 font-semibold text-white shadow-md transition hover:bg-[#5c7c97]"
            >
              {isSubmitting ? "신청 처리 중..." : "대출 신청 완료"}
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">신청 절차</p>
                <h2 className="text-lg font-bold text-slate-900">진행 순서</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <p>1. 상품 조건 확인</p>
              <p>2. 약관 동의 및 신청 정보 입력</p>
              <p>3. 신청 완료 후 내 대출 관리에서 상태 확인</p>
              {productId === "youth-loan" && <p>4. 자기계발 대출은 OCR 서류 제출 진행</p>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">확인 사항</p>
                <h2 className="text-lg font-bold text-slate-900">안내</h2>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <p>신청 후 실제 승인 여부는 심사 결과에 따라 달라질 수 있습니다.</p>
              <p>자기계발 대출은 신청 후 내 대출 관리에서 OCR 인증을 진행합니다.</p>
              <p>소비분석 대출은 신청 후 바로 심사 상태를 조회할 수 있습니다.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-200 p-3 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">보안 안내</p>
                <h2 className="text-lg font-bold text-slate-900">개인정보 보호</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              신청 정보는 백엔드에 바로 저장되며, 내 대출 관리에서 실제 신청 상태를 확인할 수 있습니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
