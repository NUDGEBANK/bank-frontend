import { BadgeCheck, CreditCard, FileText, User } from "lucide-react";

const quickMenus = [
  {
    title: "내 정보 관리",
    description: "회원 정보와 연락처를 확인하고 수정할 수 있습니다.",
    icon: User,
  },
  {
    title: "대출 관리",
    description: "진행 중인 대출 현황과 적용 금리를 조회합니다.",
    icon: FileText,
  },
  {
    title: "카드 이용내역",
    description: "최근 결제 내역과 월별 사용 흐름을 빠르게 확인합니다.",
    icon: CreditCard,
  },
  {
    title: "자격증 인증",
    description: "자격증 업로드 후 우대 금리 적용 여부를 확인합니다.",
    icon: BadgeCheck,
  },
];

export default function MyPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-md rounded-full p-3 shadow-lg border-2 border-white/30">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#1F2937] drop-shadow-lg">
              고객님의 금융 정보를 한눈에 확인하세요
            </h1>
          </div>
          <p className="text-xl text-[#475569] ml-16 drop-shadow-lg">
            계좌, 대출, 카드, 자격증 인증 현황까지 마이페이지에서 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <section className="lg:col-span-2 bg-white/60 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-2 border-white/40">
            <div className="flex justify-between items-start gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-[#1F2937]">홍길동 님의 마이페이지</h2>
                  <span className="bg-[#B7C9FF] text-[#1F2937] px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                    정상 이용중
                  </span>
                </div>

                <div className="mb-6">
                  <div className="text-5xl font-bold text-[#4A67E8] mb-2">VIP CARE</div>
                  <p className="text-base text-[#475569]">
                    맞춤 금융 서비스와 자격증 인증 우대 혜택을 확인해보세요.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-[#64748B] mb-1">보유 계좌</p>
                    <p className="font-bold text-[#1F2937] text-2xl">2개</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B] mb-1">이용 중 대출</p>
                    <p className="font-bold text-[#1F2937] text-2xl">1건</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B] mb-1">인증 상태</p>
                    <p className="font-bold text-[#1F2937] text-2xl">1건 완료</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="bg-white text-[#334155] px-4 py-2 rounded-lg text-sm shadow-sm">
                    예금/적금 현황 확인
                  </span>
                  <span className="bg-white text-[#334155] px-4 py-2 rounded-lg text-sm shadow-sm">
                    대출 금리 조회
                  </span>
                  <span className="bg-white text-[#334155] px-4 py-2 rounded-lg text-sm shadow-sm">
                    자격증 인증 연동 예정
                  </span>
                </div>
              </div>

              <div className="relative w-64 h-64 flex-shrink-0 hidden md:flex items-center justify-center">
                <div className="absolute w-48 h-32 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 rounded-[40%_60%_70%_30%/60%_30%_70%_40%] shadow-2xl opacity-80 blur-sm"></div>
                <div className="absolute w-40 h-28 bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 rounded-[60%_40%_30%_70%/40%_70%_30%_60%] shadow-xl"></div>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-white text-[#1F2937] py-4 rounded-xl font-bold text-center hover:bg-white/90 transition-all shadow-sm">
                내 정보 보기
              </button>
              <button className="flex-1 bg-[#B7C9FF] text-[#1F2937] py-4 rounded-xl font-bold hover:bg-[#a7bcff] transition-all shadow-md">
                자격증 인증하기
              </button>
            </div>
          </section>

          <div className="space-y-6">
            <section className="bg-white/60 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border-2 border-white/40">
              <h3 className="text-xl font-bold text-[#1F2937] mb-4">대출 현황</h3>
              <div className="text-3xl font-bold text-[#4A67E8] mb-4">연 3.2% 적용중</div>
              <div className="space-y-2 mb-6 text-[#475569]">
                <p>소비연동형 자동상환 대출</p>
                <p>잔여 한도 1,200만원</p>
                <p>다음 납부일 2026.04.25</p>
              </div>
              <button className="block w-full bg-white text-[#1F2937] py-3 rounded-xl font-bold text-center hover:bg-white/90 transition-all shadow-sm">
                상세 보기
              </button>
            </section>

            <section className="bg-white/60 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border-2 border-white/40">
              <h3 className="text-xl font-bold text-[#1F2937] mb-4">자격증 인증 상태</h3>
              <div className="text-3xl font-bold text-[#4A67E8] mb-4">미인증</div>
              <div className="space-y-2 mb-6 text-[#475569]">
                <p>인증 가능한 자격증 업로드</p>
                <p>OCR 인증 결과 확인</p>
                <p>우대 금리 적용 여부 안내</p>
              </div>
              <button className="block w-full bg-white text-[#1F2937] py-3 rounded-xl font-bold text-center hover:bg-white/90 transition-all shadow-sm">
                인증하러 가기
              </button>
            </section>
          </div>
        </div>

        <section className="bg-white/60 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border-2 border-white/40">
          <div className="mb-6">
            <p className="text-sm text-[#64748B] mb-2">빠른 메뉴</p>
            <h2 className="text-2xl font-bold text-[#1F2937]">자주 찾는 서비스</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {quickMenus.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="p-6 bg-white/80 rounded-2xl shadow-lg border border-white/70 hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#E0E8FF] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#4A67E8]" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[#1F2937]">{title}</h3>
                <p className="text-[#64748B] leading-6 text-sm">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
