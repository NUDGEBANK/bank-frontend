import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, CreditCard, Shield, TrendingDown, Zap } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { postJson } from "../../lib/api";

type CardIssueResponse = {
  ok: boolean;
  message: string;
  accountId: number | null;
  accountName: string | null;
  accountNumber: string | null;
  balance: number | null;
  cardId: number | null;
  cardNumber: string | null;
  validThru: string | null;
  cvc: string | null;
  status: string | null;
};

export default function DdokgaeCard() {
  const navigate = useNavigate();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [cardHolderName, setCardHolderName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardPassword, setCardPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueResult, setIssueResult] = useState<CardIssueResponse | null>(null);

  const features = [
    {
      icon: Zap,
      title: "AI 소비 분석",
      description: "생필품과 사치품을 자동으로 분류하여 소비 패턴을 분석합니다",
    },
    {
      icon: TrendingDown,
      title: "스마트 상환",
      description: "사치품 소비는 자동 상환, 생필품 소비는 일반 결제로 처리",
    },
    {
      icon: Shield,
      title: "신용점수 관리",
      description: "체계적인 상환으로 신용점수를 효과적으로 관리할 수 있습니다",
    },
  ];

  const benefits = [
    "전월 실적 없이 모든 가맹점 5% 캐시백",
    "편의점, 카페 10% 할인",
    "대중교통 무료 (월 60회)",
    "해외 결제 수수료 면제",
    "연회비 영구 무료",
  ];

  const openApplyFlow = () => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      navigate("/login");
      return;
    }

    setSubmitError("");
    setIssueResult(null);
    setIsApplyDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await postJson<CardIssueResponse>("/api/cards/apply", {
        cardHolderName,
        phoneNumber,
        cardPassword,
      });
      setIssueResult(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "REQUEST_FAILED";

      if (message === "UNAUTHORIZED") {
        localStorage.removeItem("isLoggedIn");
        window.dispatchEvent(new Event("auth-change"));
        setIsApplyDialogOpen(false);
        navigate("/login");
        return;
      }

      if (message === "CARD_ALREADY_ISSUED") {
        setSubmitError("이미 똑개 체크카드가 발급된 회원입니다.");
      } else if (message === "INVALID_CARD_PASSWORD") {
        setSubmitError("카드 비밀번호는 숫자 4자리여야 합니다.");
      } else if (message === "MISSING_FIELDS") {
        setSubmitError("카드 명의, 연락처, 카드 비밀번호를 모두 입력해주세요.");
      } else {
        setSubmitError("카드 발급 신청 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setIsApplyDialogOpen(false);
    setSubmitError("");
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-white drop-shadow-lg">똑개 체크카드</h1>

        <div className="bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 backdrop-blur-lg rounded-2xl p-12 mb-12 text-white shadow-2xl border-2 border-white/30">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">똑개 체크카드</h2>
                <p className="text-xl text-blue-100 mb-6">
                  AI가 분석하는 스마트한 소비 관리
                </p>
                <div className="flex gap-3">
                  <button
                    className="bg-white/90 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-white transition-all shadow-lg"
                    onClick={openApplyFlow}
                    type="button"
                  >
                    신청하기
                  </button>
                  <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/40">
                    혜택 보기
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md rounded-2xl p-8 border-2 border-white/40">
                  <div className="flex justify-between items-start mb-8">
                    <CreditCard className="w-12 h-12" />
                    <div className="text-right">
                      <p className="text-sm text-blue-100">똑개뱅크</p>
                      <p className="font-bold">CHECK CARD</p>
                    </div>
                  </div>
                  <div className="mb-6">
                    <p className="text-2xl font-mono tracking-wider">
                      1234 5678 9012 3456
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-blue-100 mb-1">VALID THRU</p>
                      <p className="font-mono">03/29</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-blue-100 mb-1">CARD HOLDER</p>
                      <p className="font-bold">HONG GIL DONG</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 mb-8 border-2 border-white/30">
          <h2 className="text-2xl font-bold mb-6 text-white">똑개 체크카드란?</h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-6">
            똑개 체크카드는 AI 기술을 활용하여 모든 소비를 생필품과 사치품으로 자동 분류하고,
            사치품 소비 시에는 연동된 대출을 자동으로 상환하여 합리적인 소비 습관을 만들어주는
            혁신적인 체크카드입니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="border-2 border-white/40 rounded-lg p-6 bg-white/20 backdrop-blur-sm">
                  <div className="bg-blue-500/30 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center mb-4 border border-white/30">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-blue-100">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 mb-8 border-2 border-white/30">
          <h2 className="text-2xl font-bold mb-6 text-white">주요 혜택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-white/20 backdrop-blur-sm rounded-lg border-2 border-blue-300/50">
                <CheckCircle className="w-6 h-6 text-blue-300 flex-shrink-0" />
                <span className="text-white">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-lg rounded-lg shadow-2xl p-8 mb-8 border-2 border-white/30">
          <h2 className="text-2xl font-bold mb-6 text-white">이용 방법</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-2 border-green-300/50 bg-green-500/20 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-500/80 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border border-white/30">
                  생
                </div>
                <h3 className="text-xl font-bold text-white">생필품 소비</h3>
              </div>
              <ul className="space-y-2 text-blue-100">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>식료품, 의류, 교통비 등</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>일반 체크카드처럼 통장에서 즉시 결제</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <span>자동 상환 대상 아님</span>
                </li>
              </ul>
            </div>

            <div className="border-2 border-orange-300/50 bg-orange-500/20 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-500/80 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border border-white/30">
                  사
                </div>
                <h3 className="text-xl font-bold text-white">사치품 소비</h3>
              </div>
              <ul className="space-y-2 text-blue-100">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
                  <span>명품, 고가 전자기기, 유흥비 등</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
                  <span>결제 금액의 일부가 대출 자동 상환</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-orange-300 flex-shrink-0 mt-0.5" />
                  <span>신용점수 관리에 도움</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-lg rounded-xl p-12 text-center text-white shadow-2xl border-2 border-white/30">
          <h3 className="text-3xl font-bold mb-4 drop-shadow-lg">지금 바로 신청하세요</h3>
          <p className="text-xl text-blue-100 mb-8">
            똑똑한 소비 관리의 시작, 똑개 체크카드
          </p>
          <button
            className="bg-white/90 text-blue-600 px-12 py-4 rounded-lg text-lg font-bold hover:bg-white transition-all shadow-lg"
            onClick={openApplyFlow}
            type="button"
          >
            지금 신청하기
          </button>
          <p className="text-sm text-blue-100 mt-4">
            ※ 신청 후 즉시 가상카드가 발급됩니다.
          </p>
        </div>
      </div>

      <Dialog
        open={isApplyDialogOpen}
        onOpenChange={(open) => {
          setIsApplyDialogOpen(open);
          if (!open) {
            setSubmitError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-6xl border-white/50 bg-gradient-to-br from-blue-50/95 via-white/95 to-sky-100/95 p-0 text-slate-800 shadow-2xl">
          {issueResult ? (
            <div>
              <div className="border-b border-blue-200/80 bg-gradient-to-r from-blue-200/70 via-sky-100/80 to-purple-100/70 px-10 py-7">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl text-slate-800">가상카드 발급이 완료되었습니다</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    계좌 생성과 카드 발급이 모두 완료되었습니다. 아래 정보를 확인해주세요.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-6 px-10 py-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-blue-700">생성된 계좌 정보</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-slate-800">계좌명</p>
                        <p>{issueResult.accountName}</p>
                      </div>
                      <div>
                        <p className="text-slate-800">계좌번호</p>
                        <p>{issueResult.accountNumber}</p>
                      </div>
                      <div>
                        <p className="text-slate-800">시작 잔고</p>
                        <p>{issueResult.balance?.toLocaleString("ko-KR")}원</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-blue-700">발급된 카드 정보</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-slate-800">카드번호</p>
                        <p>{issueResult.cardNumber}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-800">유효기간</p>
                          <p>{issueResult.validThru}</p>
                        </div>
                        <div>
                          <p className="text-slate-800">CVC</p>
                          <p>{issueResult.cvc}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-800">상태</p>
                        <p>{issueResult.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-blue-200/80 bg-white/50 px-10 py-5">
                <button
                  className="rounded-lg bg-blue-500 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-600"
                  onClick={closeDialog}
                  type="button"
                >
                  확인
                </button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="border-b border-blue-200/80 bg-gradient-to-r from-blue-200/70 via-sky-100/80 to-purple-100/70 px-10 py-7">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl text-slate-800">계좌 생성 및 카드 발급 신청</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    로그인된 회원 이름으로 계좌가 생성되고, 입력한 카드 정보로 가상카드가 발급됩니다.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-6 px-10 py-8">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-blue-700">계좌 생성 정보</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-slate-800">계좌명</p>
                        <p>로그인된 회원 이름으로 자동 생성됩니다.</p>
                      </div>
                      <div>
                        <p className="text-slate-800">계좌번호</p>
                        <p>중복되지 않는 14자리 번호가 자동 발급됩니다.</p>
                      </div>
                      <div>
                        <p className="text-slate-800">초기 정보</p>
                        <p>잔고 0원, 보호잔액 0원으로 생성됩니다.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-blue-700">카드 발급 정보</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <label className="mb-1 block text-slate-800" htmlFor="card-holder-name">카드 명의</label>
                        <input
                          id="card-holder-name"
                          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-400"
                          onChange={(event) => setCardHolderName(event.target.value)}
                          value={cardHolderName}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-slate-800" htmlFor="card-phone-number">연락처</label>
                        <input
                          id="card-phone-number"
                          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-400"
                          onChange={(event) => setPhoneNumber(event.target.value)}
                          value={phoneNumber}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-slate-800" htmlFor="card-password">카드 비밀번호</label>
                        <input
                          id="card-password"
                          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-400"
                          inputMode="numeric"
                          maxLength={4}
                          onChange={(event) => setCardPassword(event.target.value.replace(/\D/g, "").slice(0, 4))}
                          type="password"
                          value={cardPassword}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                  <p className="mb-3 text-sm font-semibold text-blue-700">신청 전 확인사항</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• 카드 신청 시 똑개 체크카드 연결 계좌가 함께 생성됩니다.</li>
                    <li>• 카드번호, 유효기간, CVC는 시스템에서 자동 생성됩니다.</li>
                    <li>• 발급 완료 후 즉시 ACTIVE 상태의 가상카드를 사용할 수 있습니다.</li>
                  </ul>
                </div>

                {submitError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {submitError}
                  </p>
                )}
              </div>

              <DialogFooter className="border-t border-blue-200/80 bg-white/50 px-10 py-5">
                <button
                  className="rounded-lg border border-blue-200 bg-white px-5 py-2.5 text-slate-700 transition-colors hover:bg-blue-50"
                  onClick={closeDialog}
                  type="button"
                >
                  닫기
                </button>
                <button
                  className="rounded-lg bg-blue-500 px-5 py-2.5 font-semibold text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-blue-300"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "발급 중..." : "계좌 생성 및 카드 발급"}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
