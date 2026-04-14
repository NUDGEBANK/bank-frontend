import { ArrowRight, CheckCircle2, FileText, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

const guideSteps = [
  {
    title: "상품 선택",
    description: "대출 상품 목록에서 본인 상황에 맞는 상품을 선택하고 주요 조건을 비교합니다.",
  },
  {
    title: "신청 조건 확인",
    description: "한도, 금리, 상환 기간, 신청 대상과 같은 핵심 조건을 먼저 확인합니다.",
  },
  {
    title: "정보 및 서류 준비",
    description: "소득 정보, 본인 확인 정보, 필요한 경우 증빙 서류를 준비합니다.",
  },
  {
    title: "심사 및 결과 확인",
    description: "신청 후 심사 상태와 결과는 대출 관리 화면 또는 상담을 통해 확인합니다.",
  },
];

const requiredItems = [
  "본인 확인 정보",
  "소득 관련 정보",
  "상환 계획 확인",
  "상품별 추가 증빙 서류",
];

const notices = [
  "본 페이지는 안내용 화면이며 실제 신청은 이 화면에서 처리되지 않습니다.",
  "상품별 실제 승인 여부와 조건은 심사 결과에 따라 달라질 수 있습니다.",
  "추가 서류 제출이 필요한 경우 별도 안내가 제공될 수 있습니다.",
];

export default function LoanApplicationGuide() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f4f8ff_0%,_#f8fbff_30%,_#ffffff_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <section className="rounded-[32px] border border-slate-200 bg-white px-6 py-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:px-10 md:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
            Loan Guide
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
            대출 신청 안내
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
            대출 신청 전에 필요한 절차와 준비 사항을 한 번에 확인할 수 있는 안내 화면입니다.
            실제 신청은 별도 상품 페이지에서 진행하고, 이 페이지는 화면상 안내만 제공합니다.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/loan/products"
              className="inline-flex items-center justify-center rounded-2xl bg-[#2a4b78] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#223f64]"
            >
              대출 상품 보러가기
            </Link>
            {/* 챗봇 상담 화면과 연결 */}
            <Link
              to="/help/chat-history"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              <MessageCircle className="h-4 w-4" />
              챗봇으로 문의하기
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">신청 절차</h2>
            </div>

            <div className="mt-8 space-y-4">
              {guideSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a4b78] text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">준비 항목</h2>
              </div>

              <div className="mt-5 space-y-3">
                {requiredItems.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">유의 사항</h2>
              </div>

              <ul className="mt-5 space-y-3">
                {notices.map((notice) => (
                  <li
                    key={notice}
                    className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-slate-700"
                  >
                    {notice}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
