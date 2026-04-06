import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

type LoanApplyConfig = {
  name: string;
  subtitle: string;
  limit: string;
  period: string;
  rate: string;
  defaultAmount: string;
  defaultPurpose: string;
};

type StoredLoanApplication = {
  applicationId: string;
  productId: string;
  productName: string;
  status: string;
  appliedAt: string;
  requestedAmount: string;
  loanTerm: string;
  purpose: string;
};

const LOAN_APPLICATIONS_KEY = "loanApplications";

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

function readLoanApplications() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LOAN_APPLICATIONS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as StoredLoanApplication[];
  } catch {
    return [];
  }
}

export default function LoanApply() {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const product = productId ? productConfigs[productId] : undefined;
  const existingApplications = useMemo(readLoanApplications, []);
  const existing = existingApplications.find((item) => item.productId === productId) ?? null;

  const [amount, setAmount] = useState(product?.defaultAmount ?? "");
  const [loanTerm, setLoanTerm] = useState(productId === "youth-loan" ? "24개월" : "12개월");
  const [purpose, setPurpose] = useState(product?.defaultPurpose ?? "");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!agreeTerms || !agreePrivacy) {
      setError("약관 동의와 개인정보 동의를 모두 체크해 주세요.");
      return;
    }

    const nextApplications = existing
      ? existingApplications
      : [
          ...existingApplications,
          {
            applicationId: `APP-${Date.now()}`,
            productId,
            productName: product.name,
            status: productId === "youth-loan" ? "DOCUMENT_REQUIRED" : "UNDER_REVIEW",
            appliedAt: new Date().toISOString(),
            requestedAmount: amount,
            loanTerm,
            purpose,
          },
        ];

    window.localStorage.setItem(LOAN_APPLICATIONS_KEY, JSON.stringify(nextApplications));
    window.dispatchEvent(new Event("loan-application-change"));
    navigate("/loan/management");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8">
        <Link
          to={`/loan/products/${productId}`}
          className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          ← 상품 상세로 돌아가기
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
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
                <option>12개월</option>
                <option>18개월</option>
                <option>24개월</option>
              </select>
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
              className="w-full rounded-2xl bg-[#6d8ca6] py-4 font-semibold text-white shadow-md transition hover:bg-[#5c7c97]"
            >
              대출 신청 완료
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
              신청 정보는 브라우저 임시 저장 상태로 관리되고 있으며, 백엔드 연동 이후 실제 신청 데이터와 연결됩니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
