import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const guideSteps = [
  {
    step: "01",
    title: "상품 선택",
    description: "대출 상품 목록에서 본인 상황에 맞는 상품을 선택하고 주요 조건을 비교합니다.",
  },
  {
    step: "02",
    title: "신청 조건 확인",
    description: "한도, 금리, 상환 기간, 신청 대상과 같은 핵심 조건을 먼저 확인합니다.",
  },
  {
    step: "03",
    title: "정보 및 서류 준비",
    description: "소득 정보, 본인 확인 정보, 필요한 경우 증빙 서류를 준비합니다.",
  },
  {
    step: "04",
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
  "본 페이지는 안내용 화면이며, 실제 신청은 상품 페이지에서 진행됩니다.",
  "상품별 실제 승인 여부와 조건은 심사 결과에 따라 달라질 수 있습니다.",
  "추가 서류 제출이 필요한 경우 별도 안내가 제공될 수 있습니다.",
];

export default function LoanApplicationGuide() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 pt-10 pb-14">
        {/* 헤더 카드 */}
        <div className="rounded-2xl bg-white px-6 pb-6 pt-7 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-bold text-slate-900">대출 신청 안내</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            대출 신청 전에 필요한 절차와 준비 사항을 확인할 수 있습니다.
            실제 신청은 상품 페이지에서 진행해 주세요.
          </p>

          <div className="mt-5 flex gap-2.5">
            <Link
              to="/loan/products"
              className="flex items-center gap-1.5 rounded-full bg-black px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-800"
              style={{ color: "#ffffff" }}
            >
              대출 상품 보기
              <ArrowRight className="h-3.5 w-3.5" style={{ color: "#ffffff" }} />
            </Link>
            <Link
              to="/help/chat-history"
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
            >
              챗봇 문의
            </Link>
          </div>
        </div>

        {/* 신청 절차 */}
        <div className="mt-5 rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h2 className="mb-5 text-sm font-bold text-slate-900">신청 절차</h2>

          <div className="space-y-4">
            {guideSteps.map((item) => (
              <div key={item.step} className="flex gap-4">
                <span className="mt-0.5 text-xs font-bold text-slate-300">{item.step}</span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 준비 항목 */}
        <div className="mt-4 rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 text-sm font-bold text-slate-900">준비 항목</h2>

          <div className="flex flex-wrap gap-2">
            {requiredItems.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-600"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* 유의 사항 */}
        <div className="mt-4 rounded-2xl bg-white px-6 py-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <h2 className="mb-3 text-sm font-bold text-slate-900">유의 사항</h2>

          <ul className="space-y-1.5 text-sm text-slate-500">
            {notices.map((notice) => (
              <li key={notice} className="flex items-start gap-2.5">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                {notice}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
