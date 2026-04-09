import { Landmark, PiggyBank, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

type DepositProduct = {
  id: string;
  name: string;
  badge: string;
  rate: string;
  amount: string;
  period: string;
  summary: string;
  features: string[];
  notice: string;
};

const depositProducts: DepositProduct[] = [
  {
    id: "fixed-deposit",
    name: "정기예금",
    badge: "목돈 예치",
    rate: "연 2.8% ~ 3.6%",
    amount: "최소 100만 원부터",
    period: "6개월 ~ 24개월",
    summary: "한 번에 목돈을 예치하고 만기까지 유지하는 기본 예금 상품입니다.",
    features: [
      "가입 시 금리 확정",
      "만기일에 원금과 이자 수령",
      "생활 자금과 분리해 목돈 관리",
    ],
    notice: "중도 해지 시 약정 금리보다 낮은 중도해지 금리가 적용될 수 있습니다.",
  },
  {
    id: "fixed-saving",
    name: "정기적금",
    badge: "월 납입",
    rate: "연 3.0% ~ 4.1%",
    amount: "월 10만 원부터",
    period: "6개월 ~ 36개월",
    summary: "매월 일정 금액을 납입하며 목표 자금을 차근차근 모으는 적금 상품입니다.",
    features: [
      "월 납입액 기준으로 자동 적립",
      "납입 회차와 만기 일정 관리",
      "단기 목표 자금 마련에 적합",
    ],
    notice: "미납 회차가 있으면 만기 수령 금액과 적용 금리가 달라질 수 있습니다.",
  },
];

export default function DepositProducts() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_34%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_55%,_#eef4fb_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Deposit Products
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              정기예금과 정기적금을 비교하고 고르세요
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              예치형 상품이 필요한지, 매월 납입형 상품이 필요한지 먼저 구분한 뒤 가입 조건과
              기간을 비교할 수 있도록 상품 구성을 정리했습니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm">
              <p className="text-xs tracking-[0.12em] text-slate-500">상품 수</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">2개</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm">
              <p className="text-xs tracking-[0.12em] text-slate-500">구성</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">예금 / 적금</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {depositProducts.map((product) => {
          const Icon = product.id === "fixed-deposit" ? Landmark : PiggyBank;

          return (
            <section
              key={product.id}
              className="flex h-full flex-col rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">{product.name}</h2>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {product.badge}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{product.summary}</p>
                </div>
              </div>

              <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 md:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">금리</p>
                  <p className="mt-2 text-xl font-bold text-slate-900">{product.rate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">가입 금액</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{product.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">가입 기간</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{product.period}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  핵심 포인트
                </h3>
                <div className="mt-4 space-y-3">
                  {product.features.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-4 text-sm text-slate-700"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 text-sm text-amber-900">
                {product.notice}
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  상세 페이지 준비 중
                </button>
                <Link
                  to={`/deposit/products/${product.id}/apply`}
                  className="flex-1 rounded-2xl bg-[#2a4b78] px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-[#223f64]"
                >
                  가입하기
                </Link>
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">다음 단계</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              지금은 예적금 상품 목록 화면까지 연결한 상태입니다. 다음 단계는 가입 폼과 내 예적금
              조회 화면입니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/account/mypage"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                마이페이지로 이동
              </Link>
              <Link
                to="/loan/products"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                대출 상품 페이지 보기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
