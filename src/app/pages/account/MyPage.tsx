import { BadgeCheck, CreditCard, FileText, User } from "lucide-react";
import { Link } from "react-router";

const quickMenus = [
  {
    title: "회원정보 관리",
    description: "기본 회원 정보와 최근 이용 상태를 확인합니다.",
    icon: User,
  },
  {
    title: "대출 관리",
    description: "진행 중인 대출과 상환 일정을 확인합니다.",
    icon: FileText,
  },
  {
    title: "카드 이용내역",
    description: "최근 결제 내역과 카드 사용 흐름을 조회합니다.",
    icon: CreditCard,
  },
  {
    title: "인증 결과 조회",
    description: "서류 제출 결과와 인증 진행 상태를 확인합니다.",
    icon: BadgeCheck,
  },
];

export default function MyPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full border-2 border-white/30 bg-white/20 p-3 shadow-lg backdrop-blur-md">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 drop-shadow-lg">마이페이지</h1>
          </div>
          <p className="ml-16 text-xl text-slate-600 drop-shadow-lg">
            내 정보와 금융 이용 현황을 한 곳에서 확인할 수 있습니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-3xl border-2 border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-lg">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-slate-900">내 금융 현황</h2>
                  <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-semibold text-slate-900 shadow-md">
                    요약 보기
                  </span>
                </div>

                <div className="mb-6">
                  <div className="mb-2 text-5xl font-bold text-blue-600">NUDGE CARE</div>
                  <p className="text-base text-slate-600">
                    계좌, 대출, 카드 이용 상태를 빠르게 확인하고 필요한 메뉴로 바로 이동할 수 있습니다.
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-sm text-slate-500">보유 계좌</p>
                    <p className="text-2xl font-bold text-slate-900">2개</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-500">이용 중 대출</p>
                    <p className="text-2xl font-bold text-slate-900">1건</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-slate-500">최근 확인 항목</p>
                    <p className="text-2xl font-bold text-slate-900">대출 관리</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                    계좌 조회
                  </span>
                  <span className="rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                    대출 현황
                  </span>
                  <span className="rounded-lg bg-white px-4 py-2 text-sm text-slate-700 shadow-sm">
                    카드 내역
                  </span>
                </div>
              </div>

              <div className="relative hidden h-64 w-64 flex-shrink-0 items-center justify-center md:flex">
                <div className="absolute h-32 w-48 rounded-[40%_60%_70%_30%/60%_30%_70%_40%] bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 opacity-80 shadow-2xl blur-sm" />
                <div className="absolute h-28 w-40 rounded-[60%_40%_30%_70%/40%_70%_30%_60%] bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 shadow-xl" />
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                to="/mypage"
                className="flex-1 rounded-xl bg-white py-4 text-center font-bold text-slate-900 shadow-sm transition-all hover:bg-white/90"
              >
                내 정보 보기
              </Link>
              <Link
                to="/loan/management"
                className="flex-1 rounded-xl bg-blue-100 py-4 text-center font-bold text-slate-900 shadow-md transition-all hover:bg-blue-200"
              >
                대출 관리로 이동
              </Link>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border-2 border-white/40 bg-white/60 p-6 shadow-2xl backdrop-blur-lg">
              <h3 className="mb-4 text-xl font-bold text-slate-900">대출 현황</h3>
              <div className="mb-4 text-3xl font-bold text-blue-600">상환 진행 중</div>
              <div className="mb-6 space-y-2 text-slate-600">
                <p>진행 중인 대출 1건</p>
                <p>다음 납입일 2026.04.25</p>
                <p>내 대출 관리에서 상세 확인 가능</p>
              </div>
              <Link
                to="/loan/management"
                className="block w-full rounded-xl bg-white py-3 text-center font-bold text-slate-900 shadow-sm transition-all hover:bg-white/90"
              >
                상세 보기
              </Link>
            </section>

            <section className="rounded-3xl border-2 border-white/40 bg-white/60 p-6 shadow-2xl backdrop-blur-lg">
              <h3 className="mb-4 text-xl font-bold text-slate-900">알림</h3>
              <div className="mb-6 space-y-2 text-slate-600">
                <p>제출 서류와 인증 결과는 대출 관리에서 확인할 수 있습니다.</p>
                <p>상품 신청 상태에 따라 추가 안내가 표시됩니다.</p>
              </div>
              <Link
                to="/loan/management"
                className="block w-full rounded-xl bg-white py-3 text-center font-bold text-slate-900 shadow-sm transition-all hover:bg-white/90"
              >
                확인하러 가기
              </Link>
            </section>
          </div>
        </div>

        <section className="rounded-3xl border-2 border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-lg">
          <div className="mb-6">
            <p className="mb-2 text-sm text-slate-500">빠른 메뉴</p>
            <h2 className="text-2xl font-bold text-slate-900">자주 찾는 서비스</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {quickMenus.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg transition-all hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
                <p className="text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
