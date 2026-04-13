import { Landmark, PiggyBank, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getJson } from "../../lib/api";

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

function formatWon(value: number | null) {
  if (value == null) {
    return "한도 없음";
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatRate(rates: DepositProductRate[]) {
  if (rates.length === 0) {
    return "금리 확인 필요";
  }

  const values = rates.map((rate) => rate.interestRate);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return min === max ? `연 ${min.toFixed(2)}%` : `연 ${min.toFixed(2)}% ~ ${max.toFixed(2)}%`;
}

function getFeatures(product: DepositProduct) {
  if (product.depositProductType === "FIXED_DEPOSIT") {
    return [
      "가입 시 한 번에 예치하고 만기까지 유지",
      "만기 시 원금과 이자를 함께 수령",
      "목돈 운용용 상품",
    ];
  }

  return [
    "매월 정해진 금액을 납입",
    "자동이체 일정 관리 가능",
    "목표 자금 마련용 상품",
  ];
}

function getNotice(product: DepositProduct) {
  if (product.depositProductType === "FIXED_DEPOSIT") {
    return "중도 해지 시 약정 금리보다 낮은 중도해지 금리가 적용될 수 있습니다.";
  }

  return "적금은 회차별 납입이 누락되면 만기 수령액과 적용 금리가 달라질 수 있습니다.";
}

export default function DepositProducts() {
  const [products, setProducts] = useState<DepositProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      try {
        const response = await getJson<DepositProduct[]>("/api/deposit-products");
        if (!isMounted) {
          return;
        }
        setProducts(response);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }
        setProducts([]);
        setError(nextError instanceof Error ? nextError.message : "REQUEST_FAILED");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_34%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_55%,_#eef4fb_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Deposit Products
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              예금과 적금 상품을 비교하고 가입하세요
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              현재 가입 가능한 예적금 상품 조건을 실시간으로 불러오고 있습니다. 금리, 기간, 가입 가능 금액을
              비교한 뒤 바로 가입 화면으로 이동할 수 있습니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm">
              <p className="text-xs tracking-[0.12em] text-slate-500">상품 수</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {isLoading ? "-" : `${products.length}개`}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm">
              <p className="text-xs tracking-[0.12em] text-slate-500">구성</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">예금 / 적금</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <section className="rounded-[32px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          상품 정보를 불러오는 중입니다.
        </section>
      ) : error ? (
        <section className="rounded-[32px] border border-red-200 bg-red-50 p-12 text-center text-sm text-red-700 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
          상품 정보를 불러오지 못했습니다. {error}
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {products.map((product) => {
            const Icon = product.depositProductType === "FIXED_DEPOSIT" ? Landmark : PiggyBank;
            const features = getFeatures(product);

            return (
              <section
                key={product.depositProductId}
                className="flex h-full flex-col rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]"
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900">{product.depositProductName}</h2>
                      <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {product.depositProductType === "FIXED_DEPOSIT" ? "목돈 예치" : "매월 납입"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{product.depositProductDescription}</p>
                  </div>
                </div>

                <div className="mb-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">금리</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">{formatRate(product.rates)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">가입 가능 금액</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {formatWon(product.depositMinAmount)} ~ {formatWon(product.depositMaxAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">가입 기간</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {product.minSavingMonth}개월 ~ {product.maxSavingMonth}개월
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    주요 특징
                  </h3>
                  <div className="mt-4 space-y-3">
                    {features.map((feature) => (
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
                  {getNotice(product)}
                </div>

                <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
                  <Link
                    to={`/deposit/products/${product.depositProductId}/apply`}
                    className="flex-1 rounded-2xl bg-[#2a4b78] px-5 py-4 text-center text-sm font-semibold transition hover:bg-[#223f64]"
                    style={{ color: "#ffffff" }}
                  >
                    가입하기
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">다음 단계</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              상품 가입 후에는 마이페이지 또는 예적금 관리 화면에서 가입 내역, 납입 현황, 만기일을 확인할 수 있도록
              연결하면 됩니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/deposit/management"
                className="rounded-full bg-[#2a4b78] px-4 py-2 text-sm font-semibold transition hover:bg-[#223f64]"
                style={{ color: "#ffffff" }}
              >
                예적금 관리
              </Link>
              <Link
                to="/account/mypage"
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                마이페이지로 이동
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
