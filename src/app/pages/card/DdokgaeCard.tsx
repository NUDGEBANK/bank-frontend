import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { CheckCircle, Shield, TrendingDown, Zap } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { getJson, postJson } from "../../lib/api";
import { checkAuthentication } from "../../lib/auth";

type CardIssueResponse = {
  ok: boolean;
  message: string;
  accountId: number | null;
  accountName: string | null;
  accountNumber: string | null;
  balance: number | null;
  cardId: number | null;
  cardNumber: string | null;
  expiredYm: string | null;
  cvc: string | null;
  status: string | null;
};

type CardHistoryResponse = {
  ok: boolean;
  message: string;
  accounts: CardPreviewAccount[];
};

type CardPreviewAccount = {
  accountId: number;
  accountName: string;
  accountNumber: string;
  balance: number;
  cardId: number | null;
  cardNumber: string | null;
  expiredYm: string | null;
  cardStatus: string | null;
};

type CardPreview = {
  cardNumber: string;
  expiredYm: string;
  cardHolderName: string;
};

type SelectableCard = CardPreviewAccount & {
  displayLabel: string;
};

type MyProfile = {
  name: string;
};

const DEFAULT_CARD_PREVIEW: CardPreview = {
  cardNumber: "1234 5678 9012 3456",
  expiredYm: "03/29",
  cardHolderName: "HONG GIL DONG",
};

function formatPreviewCardNumber(cardNumber: string | null) {
  if (!cardNumber) {
    return DEFAULT_CARD_PREVIEW.cardNumber;
  }

  const normalized = cardNumber.replace(/-/g, " ").trim();
  return normalized.length > 0 ? normalized : DEFAULT_CARD_PREVIEW.cardNumber;
}

function formatPreviewExpiredYm(expiredYm: string | null) {
  if (!expiredYm) {
    return DEFAULT_CARD_PREVIEW.expiredYm;
  }

  if (expiredYm.includes("/")) {
    return expiredYm;
  }

  if (/^\d{4}$/.test(expiredYm)) {
    return `${expiredYm.slice(0, 2)}/${expiredYm.slice(2)}`;
  }

  return expiredYm;
}

export default function DdokgaeCard() {
  const navigate = useNavigate();
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [ownedCards, setOwnedCards] = useState<SelectableCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [accountName, setAccountName] = useState("");
  const [cardPassword, setCardPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueResult, setIssueResult] = useState<CardIssueResponse | null>(null);
  const [cardPreview, setCardPreview] = useState<CardPreview>(DEFAULT_CARD_PREVIEW);
  const [currentUserName, setCurrentUserName] = useState(DEFAULT_CARD_PREVIEW.cardHolderName);

  useEffect(() => {
    let isMounted = true;

    async function loadCardPreview() {
      try {
        const isAuthenticated = await checkAuthentication();
        if (!isMounted) {
          return;
        }

        if (!isAuthenticated) {
          setCurrentUserName(DEFAULT_CARD_PREVIEW.cardHolderName);
          setCardPreview(DEFAULT_CARD_PREVIEW);
          return;
        }

        const [profile, response] = await Promise.all([
          getJson<MyProfile>("/api/auth/me"),
          getJson<CardHistoryResponse>("/api/cards/history"),
        ]);
        if (!isMounted) {
          return;
        }

        const resolvedUserName = profile.name?.trim()
          ? profile.name.toUpperCase()
          : DEFAULT_CARD_PREVIEW.cardHolderName;
        setCurrentUserName(resolvedUserName);

        const nextOwnedCards = response.accounts
          .filter((account) => account.cardId != null && !!account.cardNumber?.trim())
          .map((account) => ({
            ...account,
            displayLabel: `${account.accountName} ${account.accountNumber}`,
          }));

        setOwnedCards(nextOwnedCards);

        const nextSelectedCard =
          nextOwnedCards.find((card) => card.cardId === selectedCardId) ?? nextOwnedCards[0] ?? null;

        setSelectedCardId(nextSelectedCard?.cardId ?? null);
        setCardPreview(
          nextSelectedCard
            ? {
                cardNumber: formatPreviewCardNumber(nextSelectedCard.cardNumber),
                expiredYm: formatPreviewExpiredYm(nextSelectedCard.expiredYm),
                cardHolderName: resolvedUserName,
              }
            : {
                ...DEFAULT_CARD_PREVIEW,
                cardHolderName: resolvedUserName,
              },
        );
      } catch {
        if (isMounted) {
          setCurrentUserName(DEFAULT_CARD_PREVIEW.cardHolderName);
          setCardPreview(DEFAULT_CARD_PREVIEW);
          setOwnedCards([]);
          setSelectedCardId(null);
        }
      }
    }

    void loadCardPreview();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedCardId == null) {
      return;
    }

    const selected = ownedCards.find((card) => card.cardId === selectedCardId) ?? null;
    if (!selected) {
      return;
    }

    setCardPreview({
      cardNumber: formatPreviewCardNumber(selected.cardNumber),
      expiredYm: formatPreviewExpiredYm(selected.expiredYm),
      cardHolderName: currentUserName,
    });
  }, [currentUserName, ownedCards, selectedCardId]);

  const features = [
    {
      icon: Zap,
      title: "AI 소비 분석",
      description: "생필품과 사치품을 자동으로 분류하여 소비 패턴을 분석합니다.",
    },
    {
      icon: TrendingDown,
      title: "스마트 상환",
      description: "사치품 소비는 자동 상환, 생필품 소비는 일반 결제로 처리합니다.",
    },
    {
      icon: Shield,
      title: "신용점수 관리",
      description: "체계적인 상환 흐름으로 신용점수 관리에 도움을 줍니다.",
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
    void (async () => {
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        navigate("/login");
        return;
      }

      setSubmitError("");
      setIssueResult(null);
      setIsApplyDialogOpen(true);
    })();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await postJson<CardIssueResponse>("/api/cards/apply", {
        accountName,
        cardPassword,
      });
      setIssueResult(response);
      setCardPreview({
        cardNumber: formatPreviewCardNumber(response.cardNumber),
        expiredYm: formatPreviewExpiredYm(response.expiredYm),
        cardHolderName: currentUserName,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "REQUEST_FAILED";

      if (message === "UNAUTHORIZED") {
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
        setSubmitError("계좌명과 카드 비밀번호를 모두 입력해주세요.");
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
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">똑개 체크카드</h1>

        <div className="mb-12 overflow-hidden rounded-[32px] border border-slate-200 bg-white p-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
              <div>
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">똑개 체크카드</h2>
                <p className="mb-4 text-xl text-slate-600">AI가 분석하는 스마트한 소비 관리</p>
                <p className="mb-6 text-base leading-7 text-slate-500">
                  소비 흐름을 분석하고 주요 사용 패턴을 정리해주는 생활형 체크카드입니다.
                </p>
                <div className="flex gap-3">
                  <button
                    className="rounded-2xl bg-[#2a4b78] px-8 py-3 font-semibold text-white transition hover:bg-[#223f64]"
                    onClick={openApplyFlow}
                    type="button"
                  >
                    <span style={{ color: "#fff" }}>신청하기</span>
                  </button>
                  <button className="rounded-2xl border border-slate-200 bg-white px-8 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                    혜택 보기
                  </button>
                </div>
              </div>

              <div className="relative md:-mt-9">
                {ownedCards.length > 0 && (
                  <div className="mb-3 flex items-center justify-end gap-3">
                    <label htmlFor="card-preview-select" className="text-[11px] font-semibold whitespace-nowrap text-slate-500">
                      표시 카드 선택
                    </label>
                    <div className="w-full max-w-[12rem]">
                      <select
                        id="card-preview-select"
                        value={selectedCardId ?? ""}
                        onChange={(event) => setSelectedCardId(Number(event.target.value))}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      >
                        {ownedCards.map((card) => (
                          <option key={card.cardId} value={card.cardId}>
                            {card.displayLabel}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="mx-auto flex max-w-md justify-center">
                  <div className="relative aspect-[1.58/1] w-full overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#8ea2ff_0%,#4f66ff_28%,#223dff_64%,#1b28c9_100%)] shadow-[0_14px_36px_rgba(9,11,18,0.28)] ring-1 ring-white/10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.24),transparent_22%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.12),transparent_14%),radial-gradient(circle_at_50%_100%,rgba(111,129,255,0.20),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_24%)]" />
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/14 to-transparent" />
                    <div className="absolute -left-10 bottom-0 h-28 w-36 rounded-full bg-white/6 blur-3xl" />
                    <div className="absolute right-0 top-12 h-24 w-24 rounded-full bg-sky-200/8 blur-2xl" />
                    <div className="relative flex h-full flex-col px-10 py-8">
                      <div className="flex items-start justify-between">
                        <div className="relative h-14 w-[5.5rem] rounded-2xl bg-gradient-to-br from-white/28 to-white/10 backdrop-blur-sm ring-1 ring-white/15">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
                        </div>
                        <div className="text-right">
                          <div className="mb-2 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-white/30 to-white/14 ring-1 ring-white/10">
                            <div className="flex items-center gap-0.5">
                              <span className="h-3.5 w-1 rounded-full bg-white/70" />
                              <span className="h-3.5 w-1 rounded-full bg-white/70" />
                              <span className="h-3.5 w-1 rounded-full bg-white/70" />
                            </div>
                          </div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">NUDGEBANK</p>
                        </div>
                      </div>

                      <div className="mt-9">
                        <p className="text-[10px] uppercase tracking-[0.26em] text-white/50">Digital Private Card</p>
                      </div>

                      <div className="mt-auto space-y-3 pb-6">
                        <div className="font-mono text-[1.22rem] tracking-[0.1em] text-white drop-shadow-[0_2px_10px_rgba(12,16,40,0.22)]">
                          {cardPreview.cardNumber}
                        </div>

                        <div className="flex items-end justify-between text-white/80">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.22em] text-white/45">Valid Thru</p>
                            <p className="mt-1 font-mono text-[1.08rem] tracking-[0.06em] text-white/90">{cardPreview.expiredYm}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-[0.22em] text-white/45">Card Holder</p>
                            <p className="mt-1 text-[1rem] font-semibold tracking-tight text-white/95 drop-shadow-[0_2px_8px_rgba(12,16,40,0.16)]">
                              {cardPreview.cardHolderName}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="mb-8 grid gap-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">똑개 체크카드란?</h2>
            <p className="text-base leading-7 text-slate-500">
              AI 기술을 활용해 소비 흐름을 분류하고, 카드 이용 패턴을 보다 쉽게 관리할 수 있도록 만든 생활형 체크카드입니다.
              과한 장식보다 실제 사용 흐름과 정보 확인에 집중한 카드 경험을 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  className="flex items-start gap-4 border-b border-slate-100 py-4 first:pt-0 last:border-b-0 last:pb-0"
                  key={index}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">주요 혜택</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0 md:border-b-0" key={index}>
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <span className="text-slate-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">이용 방법</h2>

          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="grid grid-cols-[120px_1fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm font-semibold text-slate-500">
              <div>구분</div>
              <div>생필품 소비</div>
              <div>사치품 소비</div>
            </div>

            <div className="grid grid-cols-[120px_1fr_1fr] gap-4 border-b border-slate-100 px-6 py-4 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">예시</div>
              <div>식료품, 의류, 교통비 등</div>
              <div>명품, 고가 전자기기, 유흥비 등</div>
            </div>

            <div className="grid grid-cols-[120px_1fr_1fr] gap-4 border-b border-slate-100 px-6 py-4 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">결제 방식</div>
              <div>통장에서 즉시 결제</div>
              <div>결제 금액의 일부가 대출 자동 상환</div>
            </div>

            <div className="grid grid-cols-[120px_1fr_1fr] gap-4 px-6 py-4 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">특징</div>
              <div>일반 체크카드처럼 사용</div>
              <div>신용점수 관리 흐름에 도움</div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f3f7fc_100%)] p-12 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <h3 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">지금 바로 신청하세요</h3>
          <p className="mb-8 text-xl text-slate-600">똑똑한 소비 관리의 시작, 똑개 체크카드</p>
          <button
            className="rounded-2xl bg-[#2a4b78] px-12 py-4 text-lg font-bold text-white transition hover:bg-[#223f64]"
            onClick={openApplyFlow}
            type="button"
          >
            <span style={{ color: "#fff" }}>지금 신청하기</span>
          </button>
          <p className="mt-4 text-sm text-slate-500">※ 신청 후 즉시 가상카드가 발급됩니다.</p>
        </div>
      </div>

      <Dialog
        onOpenChange={(open) => {
          setIsApplyDialogOpen(open);
          if (!open) {
            setSubmitError("");
          }
        }}
        open={isApplyDialogOpen}
      >
        <DialogContent className="sm:max-w-5xl border-white/50 bg-gradient-to-br from-blue-50/95 via-white/95 to-sky-100/95 p-0 text-slate-800 shadow-2xl">
          {issueResult ? (
            <div>
              <div className="border-b border-blue-200/80 bg-gradient-to-r from-blue-200/70 via-sky-100/80 to-purple-100/70 px-8 py-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl text-slate-800">가상카드 발급이 완료되었습니다</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    계좌 생성과 카드 발급이 모두 완료되었습니다. 아래 정보를 확인해주세요.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-6 px-8 py-6">
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
                          <p>{issueResult.expiredYm}</p>
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

              <DialogFooter className="border-t border-blue-200/80 bg-white/50 px-8 py-5">
                <button className="rounded-lg bg-[#2a4b78] px-5 py-2.5 font-semibold text-white transition-all hover:bg-[#223f64]" onClick={closeDialog} type="button">
                  <span style={{ color: "#fff" }}>확인</span>
                </button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="border-b border-blue-200/80 bg-gradient-to-r from-blue-200/70 via-sky-100/80 to-purple-100/70 px-8 py-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl text-slate-800">계좌 생성 및 카드 발급 신청</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600">
                    입력한 계좌명으로 계좌가 생성되고, 해당 계좌에 연결된 가상카드가 발급됩니다.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-6 px-8 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-blue-700">계좌 생성 정보</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-slate-800">계좌명</p>
                        <p>입력한 계좌명으로 계좌가 생성됩니다.</p>
                      </div>
                      <div>
                        <p className="text-slate-800">계좌번호</p>
                        <p>14자리 번호가 자동 발급됩니다.</p>
                      </div>
                      <div>
                        <p className="text-slate-800">초기 정보</p>
                        <p>잔고 0원으로 생성됩니다.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-blue-700">카드 생성 정보</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <p className="text-slate-800">카드번호</p>
                        <p>카드번호가 자동 생성됩니다.</p>
                      </div>
                      <div>
                        <p className="text-slate-800">유효기간 / CVC</p>
                        <p>발급 시 자동 생성되며 완료 화면에서 바로 확인할 수 있습니다.</p>
                      </div>
                      <div>
                        <p className="text-slate-800">발급 상태</p>
                        <p>발급 완료 직후 ACTIVE 상태로 사용할 수 있습니다.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-blue-700">계좌 정보 입력</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <label className="mb-1 block text-slate-800" htmlFor="account-name">계좌명</label>
                        <input
                          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-400"
                          id="account-name"
                          onChange={(event) => setAccountName(event.target.value)}
                          value={accountName}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-200/80 bg-white/80 p-5 shadow-sm">
                    <p className="mb-3 text-sm font-semibold text-blue-700">카드 정보 입력</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <div>
                        <label className="mb-1 block text-slate-800" htmlFor="card-password">카드 비밀번호</label>
                        <input
                          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-blue-400"
                          id="card-password"
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

                {submitError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</p>}
              </div>

              <DialogFooter className="border-t border-blue-200/80 bg-white/50 px-8 py-5">
                <button className="rounded-lg border border-blue-200 bg-white px-5 py-2.5 text-slate-700 transition-colors hover:bg-blue-50" onClick={closeDialog} type="button">
                  닫기
                </button>
                <button
                  className="rounded-lg bg-[#2a4b78] px-5 py-2.5 font-semibold text-white transition-all hover:bg-[#223f64] disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={isSubmitting}
                  type="submit"
                >
                  <span style={{ color: "#fff" }}>{isSubmitting ? "발급 중..." : "계좌 생성 및 카드 발급"}</span>
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
