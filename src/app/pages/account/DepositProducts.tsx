import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getJson } from "../../lib/api";
import depositFixedImg from "../../../assets/deposit-fixed.png";
import depositSavingImg from "../../../assets/deposit-saving.png";

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

function formatAmount(value: number | null) {
  if (value == null) {
    return "한도 없음";
  }

  return `${value.toLocaleString("ko-KR")}원`;
}

function getRateDisplay(rates: DepositProductRate[]) {
  if (rates.length === 0) {
    return { main: "확인 필요", sub: "" };
  }

  const values = rates.map((rate) => rate.interestRate);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    return {
      main: `${min.toFixed(2)}%`,
      sub: "",
    };
  }

  return {
    main: `${min.toFixed(2)}%`,
    sub: `${max.toFixed(2)}%`,
  };
}

function getProductBadge(product: DepositProduct) {
  return product.depositProductType === "FIXED_DEPOSIT" ? "목돈 예치" : "매월 납입";
}

function getProductSummary(product: DepositProduct) {
  if (product.depositProductType === "FIXED_DEPOSIT") {
    return "한 번에 예치하고 만기까지 유지하는 예금 상품입니다";
  }

  return "매달 일정 금액을 쌓아가는 적금 상품입니다";
}

function getProductTone(product: DepositProduct) {
  if (product.depositProductType === "FIXED_DEPOSIT") {
    return {
      badge: "text-[#2a4b78]",
      image: depositFixedImg,
    };
  }

  return {
    badge: "text-[#245063]",
    image: depositSavingImg,
  };
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 pb-14 pt-12">
        <h1 className="text-2xl font-bold text-slate-800">예적금 상품</h1>
        <p className="mt-2 text-sm text-slate-400">
          예금과 적금 상품을 비교하고 바로 가입해보세요
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-14">
        {isLoading ? (
          <section className="rounded-2xl bg-white px-6 py-16 text-center text-sm text-slate-500 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            상품 정보를 불러오는 중입니다.
          </section>
        ) : error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center text-sm text-red-700 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            상품 정보를 불러오지 못했습니다. {error}
          </section>
        ) : products.length === 0 ? (
          <section className="rounded-2xl bg-white px-6 py-16 text-center shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
            <h2 className="text-2xl font-bold text-slate-900">
              현재 가입 가능한 상품이 없습니다
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              잠시 후 다시 확인하거나 예적금 관리에서 기존 가입 내역을 확인해 주세요
            </p>
            <Link
              to="/deposit/management"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              예적금 관리
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {products.map((product) => {
              const tone = getProductTone(product);
              const rate = getRateDisplay(product.rates);

              return (
                <div
                  key={product.depositProductId}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={tone.image}
                      alt={product.depositProductName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4">
                      <span
                        className={`rounded-full bg-white/90 px-3.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${tone.badge}`}
                      >
                        {getProductBadge(product)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                    <p className="mb-4 text-sm leading-6 text-slate-400">
                      {product.depositProductDescription}
                    </p>

                    <div className="mb-4 flex items-baseline gap-1">
                      {rate.sub ? (
                        <>
                          <span className="text-lg font-bold text-slate-500">연</span>
                          <span className="text-3xl font-extrabold text-slate-900">
                            {rate.main.replace("%", "")}
                          </span>
                          <span className="text-lg font-medium text-slate-500">~</span>
                          <span className="text-3xl font-extrabold text-slate-900">
                            {rate.sub.replace("%", "")}
                          </span>
                          <span className="text-lg font-bold text-slate-500">%</span>
                        </>
                      ) : (
                        <span className="text-2xl font-extrabold text-slate-900">
                          연 {rate.main}
                        </span>
                      )}
                    </div>

                    <div className="mb-5 flex gap-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
                      <div>
                        <span className="text-xs text-slate-500">가입 금액</span>
                        <p className="font-semibold text-slate-700">
                          {formatAmount(product.depositMinAmount)}
                          {product.depositMaxAmount != null ? "부터" : ""}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">기간</span>
                        <p className="font-semibold text-slate-700">
                          {product.minSavingMonth}~{product.maxSavingMonth}개월
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500">유형</span>
                        <p className="font-semibold text-slate-700">
                          {product.depositProductType === "FIXED_DEPOSIT" ? "예금" : "적금"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-5 rounded-xl bg-slate-50 p-4">
                      <p className="text-xs text-slate-500">가입 가능 범위</p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {formatAmount(product.depositMinAmount)} ~ {formatAmount(product.depositMaxAmount)}
                      </p>
                    </div>

                    <div className="mt-auto">
                      <Link
                        to={`/deposit/products/${product.depositProductId}/apply`}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-black py-3.5 text-sm font-semibold transition-colors hover:bg-gray-800"
                        style={{ color: "#ffffff" }}
                      >
                        가입하기
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
