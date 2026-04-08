import { BadgeCheck, ChevronDown, ChevronUp, CreditCard, FileText, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getJson, postJson } from "../../lib/api";

type MyProfile = {
  memberId: number;
  loginId: string;
  name: string;
  birth: string | null;
  gender: string | null;
  phoneNumber: string | null;
};

type CardHistoryResponse = {
  ok: boolean;
  message: string;
  accounts: CardHistoryAccount[];
};

type CardHistoryAccount = {
  accountId: number;
  accountName: string;
  accountNumber: string;
  balance: number;
  cardId: number | null;
  cardNumber: string | null;
  expiredYm: string | null;
  cardStatus: string | null;
  spentThisMonth: number;
};

type AuthResponse = {
  ok: boolean;
  message: string;
};

type MyLoanSummary = {
  loanHistoryId: number;
  status: string;
  totalPrincipal: number;
  remainingPrincipal: number;
  repaidPrincipal: number;
  interestRate: number;
  startDate: string;
  endDate: string;
  nextPaymentDate: string | null;
  nextPaymentAmount: number;
  cumulativeInterest: number;
  repaymentAccountNumber: string;
};

const quickMenus = [
  {
    title: "회원정보 관리",
    description: "기본 정보 확인",
    icon: User,
    to: "/account/mypage",
  },
  {
    title: "대출 관리",
    description: "대출 현황 확인",
    icon: FileText,
    to: "/loan/management",
  },
  {
    title: "카드 이용내역",
    description: "결제 내역 확인",
    icon: CreditCard,
    to: "/card/history",
  },
  {
    title: "인증 결과 조회",
    description: "서류 결과 확인",
    icon: BadgeCheck,
    to: "/loan/management",
  },
] as const;

function formatBirth(birth: string | null) {
  return birth || "등록 전";
}

function formatPhoneNumber(phoneNumber: string | null) {
  return phoneNumber || "등록 전";
}

function formatGender(gender: string | null) {
  return gender || "등록 전";
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function maskCardNumber(cardNumber: string | null) {
  if (!cardNumber) {
    return "미발급";
  }

  const digitsOnly = cardNumber.replace(/\D/g, "");
  if (digitsOnly.length < 8) {
    return "****-****-****-****";
  }

  return `${digitsOnly.slice(0, 4)}-****-****-${digitsOnly.slice(-4)}`;
}

export default function MyPage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [accounts, setAccounts] = useState<CardHistoryAccount[]>([]);
  const [loanSummary, setLoanSummary] = useState<MyLoanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isShowingAllCardNumbers, setIsShowingAllCardNumbers] = useState(false);
  const [isRevealFormOpen, setIsRevealFormOpen] = useState(false);
  const [accountPasswordInput, setAccountPasswordInput] = useState("");
  const [accountPasswordError, setAccountPasswordError] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isBankingOpen, setIsBankingOpen] = useState(false);
  const [isLoanOpen, setIsLoanOpen] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [profileResponse, cardHistoryResponse, loanSummaryResponse] = await Promise.all([
          getJson<MyProfile>("/api/auth/me"),
          getJson<CardHistoryResponse>("/api/cards/history"),
          getJson<MyLoanSummary>("/api/loans/me/summary").catch(() => null),
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(profileResponse);
        setAccounts(cardHistoryResponse.accounts);
        setLoanSummary(loanSummaryResponse);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : "REQUEST_FAILED";
        setProfile(null);
        setAccounts([]);
        setLoanSummary(null);
        setErrorMessage(
          message === "UNAUTHORIZED"
            ? "로그인 후 마이페이지를 확인할 수 있습니다."
            : "사용자 정보를 불러오지 못했습니다.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const issuedCards = accounts.filter((account) => account.cardId);
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const sectionToggleClass =
    "flex items-center justify-center p-0 text-slate-400 transition hover:text-slate-600";

  const handleOpenRevealForm = () => {
    setIsRevealFormOpen(true);
    setAccountPasswordInput("");
    setAccountPasswordError("");
  };

  const handleConfirmReveal = async () => {
    if (!accountPasswordInput.trim()) {
      setAccountPasswordError("계정 비밀번호를 입력해 주세요.");
      return;
    }

    setIsVerifyingPassword(true);
    setAccountPasswordError("");

    try {
      await postJson<AuthResponse>("/api/auth/verify-password", {
        password: accountPasswordInput,
      });
      setIsShowingAllCardNumbers(true);
      setIsRevealFormOpen(false);
      setAccountPasswordInput("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "REQUEST_FAILED";
      setAccountPasswordError(
        message === "INVALID_CREDENTIALS"
          ? "계정 비밀번호가 일치하지 않습니다."
          : "비밀번호 확인 중 오류가 발생했습니다.",
      );
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleHideAllCardNumbers = () => {
    setIsShowingAllCardNumbers(false);
    setIsRevealFormOpen(false);
    setAccountPasswordInput("");
    setAccountPasswordError("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_38%),linear-gradient(135deg,_#f8fbff_0%,_#ffffff_52%,_#f8fafc_100%)] px-6 py-6 md:px-8">
          <div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">마이페이지</h1>
              <p className="mt-2 text-sm text-slate-500">
                내 정보와 계좌, 카드 정보를 한 번에 확인할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-sky-100 bg-[linear-gradient(135deg,_rgba(219,234,254,0.95)_0%,_rgba(239,246,255,0.98)_48%,_rgba(248,250,252,1)_100%)] px-5 py-5 text-slate-900 shadow-[0_20px_45px_rgba(148,163,184,0.18)]">
              <p className="text-sm text-slate-500">보유 계좌 · 카드</p>
              <p className="mt-3 text-3xl font-semibold">{accounts.length}개</p>
            </div>
            <div className="rounded-3xl border border-blue-100 bg-blue-50/70 px-5 py-5">
              <p className="text-sm text-slate-500">총 예금 잔액</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{formatAmount(totalBalance)}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500 md:px-8">
            사용자 정보를 불러오는 중입니다.
          </div>
        ) : errorMessage ? (
          <div className="px-6 py-16 text-center md:px-8">
            <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
            <Link
              to="/login"
              className="mt-4 inline-flex rounded-xl bg-[#6d8ca6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5c7c97]"
            >
              로그인하러 가기
            </Link>
          </div>
        ) : profile ? (
          <div className="space-y-8 px-6 py-8 md:px-8 lg:px-10">
            <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <h2 className="text-2xl font-bold text-slate-900">기본 정보</h2>
                  <span className={sectionToggleClass}>
                    {isProfileOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>
                {isProfileOpen && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                      <p className="text-sm text-slate-500">회원 번호</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{profile.memberId}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                      <p className="text-sm text-slate-500">아이디</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{profile.loginId}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                      <p className="text-sm text-slate-500">생년월일</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {formatBirth(profile.birth)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                      <p className="text-sm text-slate-500">성별</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {formatGender(profile.gender)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <button
                  type="button"
                  onClick={() => setIsContactOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <h2 className="text-2xl font-bold text-slate-900">연락 정보</h2>
                  <span className={sectionToggleClass}>
                    {isContactOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>
                {isContactOpen && (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                      <p className="text-sm text-slate-500">전화번호</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        {formatPhoneNumber(profile.phoneNumber)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setIsLoanOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <h2 className="text-2xl font-bold text-slate-900">대출</h2>
                <span className={sectionToggleClass}>
                  {isLoanOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>
              {isLoanOpen && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                    <p className="text-sm text-slate-500">잔여 원금</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {loanSummary ? formatAmount(loanSummary.remainingPrincipal) : "대출 정보 없음"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                    <p className="text-sm text-slate-500">누적 상환액</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {loanSummary ? formatAmount(loanSummary.repaidPrincipal) : "대출 정보 없음"}
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setIsBankingOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <h2 className="text-2xl font-bold text-slate-900">계좌 및 카드</h2>
                <span className={sectionToggleClass}>
                  {isBankingOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>

              {isBankingOpen && (
                <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-slate-900">계좌</h3>
                    </div>

                    {accounts.length > 0 ? (
                      <div className="space-y-4">
                        {accounts.map((account) => (
                          <div
                            key={account.accountId}
                            className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-3"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-base font-semibold text-slate-900">{account.accountName}</p>
                                <p className="mt-1 text-sm text-slate-500">{account.accountNumber}</p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-slate-500">계좌 상태</p>
                                <p className="mt-1 font-semibold text-slate-900">정상</p>
                              </div>
                              <div>
                                <p className="text-slate-500">잔액</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {formatAmount(account.balance)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6">
                        <p className="text-sm text-slate-500">현재 보유한 계좌가 없습니다.</p>
                        <Link
                          to="/account/ddokgae"
                          className="mt-4 inline-flex rounded-xl bg-[#6d8ca6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5c7c97]"
                        >
                          계좌 개설하러 가기
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                    <div className="mb-6 flex items-center justify-between gap-3">
                      <h3 className="text-2xl font-bold text-slate-900">카드</h3>
                      <div className="flex items-center gap-2">
                        {issuedCards.length > 0 &&
                          (isShowingAllCardNumbers ? (
                            <button
                              type="button"
                              onClick={handleHideAllCardNumbers}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              카드번호 숨기기
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleOpenRevealForm}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              전체 번호 보기
                            </button>
                          ))}
                        <Link
                          to="/card/history"
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          카드 내역
                        </Link>
                      </div>
                    </div>

                    {issuedCards.length > 0 ? (
                      <div className="space-y-4">
                        {!isShowingAllCardNumbers && isRevealFormOpen && (
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                            <p className="text-sm font-medium text-slate-700">
                              계정 비밀번호를 입력하면 카드번호를 볼 수 있습니다.
                            </p>
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                              <input
                                type="password"
                                autoComplete="current-password"
                                value={accountPasswordInput}
                                onChange={(event) => setAccountPasswordInput(event.target.value)}
                                className="h-11 rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-44"
                                placeholder="계정 비밀번호"
                              />
                              <button
                                type="button"
                                onClick={handleConfirmReveal}
                                disabled={isVerifyingPassword}
                                className="rounded-xl bg-[#6d8ca6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#5c7c97] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isVerifyingPassword ? "확인 중" : "확인"}
                              </button>
                              <button
                                type="button"
                                onClick={handleHideAllCardNumbers}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                취소
                              </button>
                            </div>
                            {accountPasswordError && (
                              <p className="mt-3 text-sm text-rose-600">{accountPasswordError}</p>
                            )}
                          </div>
                        )}

                        {issuedCards.map((account) => (
                          <div
                            key={account.cardId}
                            className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-3"
                          >
                            <p className="text-base font-semibold text-slate-900">{account.accountName}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {isShowingAllCardNumbers
                                ? account.cardNumber ?? "미발급"
                                : maskCardNumber(account.cardNumber)}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-slate-500">카드 상태</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {account.cardStatus ?? "확인 필요"}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-500">이번 달 사용액</p>
                                <p className="mt-1 font-semibold text-slate-900">
                                  {formatAmount(account.spentThisMonth)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-6">
                        <p className="text-sm text-slate-500">현재 발급된 카드가 없습니다.</p>
                        <Link
                          to="/card/ddokgae"
                          className="mt-4 inline-flex rounded-xl bg-[#6d8ca6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5c7c97]"
                        >
                          카드 신청하러 가기
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
              <button
                type="button"
                onClick={() => setIsQuickMenuOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <h2 className="text-2xl font-bold text-slate-900">자주 가는 메뉴</h2>
                <span className={sectionToggleClass}>
                  {isQuickMenuOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </span>
              </button>
              {isQuickMenuOpen && (
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {quickMenus.map(({ title, description, icon: Icon, to }) => (
                    <Link
                      key={title}
                      to={to}
                      className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 transition hover:border-slate-200 hover:bg-white"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
