import {useEffect, useState, type FormEvent} from "react";
import {useNavigate} from "react-router";
import {Shield, TrendingDown, Zap} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import {getJson, postJson} from "../../lib/api";
import {checkAuthentication} from "../../lib/auth";
import nudgeCardBackImage from "../../../assets/nudgecard-back.png";
import elephantImage from "../../../assets/elephant.png";

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

export default function NudgeCard() {
    const navigate = useNavigate();
    const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
    const [ownedCards, setOwnedCards] = useState<SelectableCard[]>([]);
    const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
    const [accountName, setAccountName] = useState("");
    const [cardPassword, setCardPassword] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [issueResult, setIssueResult] = useState<CardIssueResponse | null>(
        null,
    );
    const [cardPreview, setCardPreview] =
        useState<CardPreview>(DEFAULT_CARD_PREVIEW);
    const [currentUserName, setCurrentUserName] = useState(
        DEFAULT_CARD_PREVIEW.cardHolderName,
    );

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
                    .filter(
                        (account) => account.cardId != null && !!account.cardNumber?.trim(),
                    )
                    .map((account) => ({
                        ...account,
                        displayLabel: `${account.accountName} ${account.accountNumber}`,
                    }));

                setOwnedCards(nextOwnedCards);

                const nextSelectedCard =
                    nextOwnedCards.find((card) => card.cardId === selectedCardId) ??
                    nextOwnedCards[0] ??
                    null;

                setSelectedCardId(nextSelectedCard?.cardId ?? null);
                setCardPreview(
                    nextSelectedCard
                        ? {
                            cardNumber: formatPreviewCardNumber(
                                nextSelectedCard.cardNumber,
                            ),
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

        const selected =
            ownedCards.find((card) => card.cardId === selectedCardId) ?? null;
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
            description:
                "필수소비, 위험소비, 선택소비, 일반소비를 구분하여 소비 패턴을 분석합니다.",
        },
        {
            icon: TrendingDown,
            title: "자동 상환",
            description:
                "넛지 대출 가입후 카드 결제시 자동상환비율에 따라서 자동 상환 처리됩니다.",
        },
        {
            icon: Shield,
            title: "신용점수 관리",
            description: "체계적인 상환 흐름으로 신용점수 관리에 도움을 줍니다.",
        },
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
                setSubmitError("이미 넛지 체크카드가 발급된 회원입니다.");
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
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl px-6 pt-12 pb-6">
                <h1 className="text-2xl font-bold text-slate-800">넛지 체크카드</h1>
                <p className="mt-2 text-sm text-slate-400">
                    카드 기능과 혜택을 확인하고 발급을 진행해보세요
                </p>
            </div>

            <div className="mx-auto max-w-6xl px-6 pb-14">
                <div
                    className="group mb-8 overflow-hidden rounded-2xl bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
                    <div className="mx-auto max-w-5xl">
                        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                            <div>
                                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                                    넛지 체크카드
                                </h2>
                                <p className="mb-4 text-xl text-slate-400">
                                    AI가 분석하는 스마트한 소비 관리
                                </p>
                                <p className="mb-6 text-xl leading-7 text-slate-500">
                                    소비 흐름을 분석하고 주요 사용 패턴을 정리해주는 생활형
                                    체크카드입니다.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        className="rounded-full bg-black px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                                        onClick={openApplyFlow}
                                        type="button"
                                    >
                                        <span style={{color: "#fff"}}>신청하기</span>
                                    </button>
                                </div>
                            </div>

                            <div className="relative md:-mt-5">
                                {ownedCards.length > 0 && (
                                    <div className="mb-3 flex items-center justify-end gap-3">
                                        <label
                                            htmlFor="card-preview-select"
                                            className="text-[11px] font-semibold whitespace-nowrap text-slate-500"
                                        >
                                            표시 카드 선택
                                        </label>
                                        <div className="w-full max-w-[12rem]">
                                            <select
                                                id="card-preview-select"
                                                value={selectedCardId ?? ""}
                                                onChange={(event) =>
                                                    setSelectedCardId(Number(event.target.value))
                                                }
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
                                    <div
                                        className="relative aspect-[1.58/1] w-full overflow-hidden rounded-2xl bg-center bg-no-repeat bg-cover shadow-[0_12px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/10"
                                        style={{backgroundImage: `url(${nudgeCardBackImage})`}}
                                    >
                                        <div
                                            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.12),transparent_22%),radial-gradient(circle_at_78%_8%,rgba(245,214,150,0.10),transparent_20%),linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_42%,transparent_58%)]"/>
                                        <div
                                            className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/10 to-transparent"/>
                                        <div
                                            className="absolute -left-10 bottom-0 h-28 w-36 rounded-full bg-black/30 blur-3xl"/>
                                        <div
                                            className="absolute right-0 top-12 h-24 w-24 rounded-full bg-amber-200/10 blur-2xl"/>
                                        <div className="relative flex h-full flex-col px-10 py-8">
                                            <div className="flex items-start justify-between">
                                                <div
                                                    className="relative h-10 w-[5.5rem] rounded-2xl bg-gradient-to-br from-[#e8edf5]/45 to-[#8a93a3]/30 backdrop-blur-sm ring-1 ring-[#d7deea]/40">
                                                    <img
                                                        src={elephantImage}
                                                        alt=""
                                                        className="absolute inset-0 z-10 h-full w-full object-contain p-1"
                                                    />
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className="text-[11px] uppercase tracking-[0.22em] text-[#e4eaf3]/88"
                                                        style={{
                                                            textShadow:
                                                                "0 1px 0 #778196, 0 2px 4px rgba(0,0,0,0.5)",
                                                        }}
                                                    >
                                                        NUDGEBANK
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-9">
                                                <p
                                                    className="text-[10px] uppercase tracking-[0.26em] text-[#e4eaf3]/75"
                                                    style={{
                                                        textShadow:
                                                            "0 1px 0 #778196, 0 2px 4px rgba(0,0,0,0.4)",
                                                    }}
                                                >
                                                    Digital Private Card
                                                </p>
                                            </div>

                                            <div className="mt-auto space-y-3 pb-6">
                                                <div
                                                    className="font-mono text-[1.22rem] tracking-[0.1em] text-[#e7edf6]"
                                                    style={{
                                                        textShadow:
                                                            "0 1px 0 #7a8498, 0 2px 0 #5f6879, 0 6px 14px rgba(0,0,0,0.5)",
                                                    }}
                                                >
                                                    {cardPreview.cardNumber}
                                                </div>

                                                <div className="flex items-end justify-between text-[#e4eaf3]/85">
                                                    <div>
                                                        <p className="text-[9px] uppercase tracking-[0.22em] text-[#e4eaf3]/68">
                                                            Valid Thru
                                                        </p>
                                                        <p
                                                            className="mt-1 font-mono text-[1.08rem] tracking-[0.06em] text-[#e7edf6]"
                                                            style={{
                                                                textShadow:
                                                                    "0 1px 0 #7a8498, 0 2px 5px rgba(0,0,0,0.45)",
                                                            }}
                                                        >
                                                            {cardPreview.expiredYm}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] uppercase tracking-[0.22em] text-[#e4eaf3]/68">
                                                            Card Holder
                                                        </p>
                                                        <p
                                                            className="mt-1 text-[1rem] font-semibold tracking-tight text-[#e7edf6]"
                                                            style={{
                                                                textShadow:
                                                                    "0 1px 0 #7a8498, 0 2px 5px rgba(0,0,0,0.45)",
                                                            }}
                                                        >
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

                <div className="mb-8 rounded-2xl bg-white p-4 shadow-[0_2px_20px_rgba(0,0,0,0.08)] md:p-6">
                    <div
                        className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
                        {features.map((feature, index) => {
                            return (
                                <div className="px-4 py-5 md:px-6" key={index}>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-1 text-base leading-7 text-slate-500">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="mb-8 rounded-2xl bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.08)]">
                    <h2 className="mb-6 text-2xl font-bold text-slate-900">
                        체크카드 및 계좌 이용 안내
                    </h2>

                    <div className="space-y-6 text-base leading-8 text-slate-600">
                        <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                            <h3 className="mb-3 text-lg font-semibold text-slate-900">
                                1. 발급 및 연결 단계
                            </h3>
                            <p>
                  <span className="font-semibold text-slate-800">
                    통합 개설:
                  </span>{" "}
                                이 체크카드를 신청하면 결제 대금이 빠져나갈 전용 계좌가 동시에
                                생성됩니다.
                            </p>
                            <p>
                  <span className="font-semibold text-slate-800">
                    대출 필수 조건:
                  </span>{" "}
                                이 카드를 발급받아 보유하고 있어야만 대출 심사 및 실행이
                                가능합니다.
                            </p>
                        </section>

                        <section className="rounded-xl border border-slate-200 p-5">
                            <h3 className="mb-3 text-lg font-semibold text-slate-900">
                                2. 넛지 대출 상품 이용 시 (자동 상환)
                            </h3>
                            <p className="mb-2">
                                이 카드의 가장 큰 특징은{" "}
                                <span className="font-semibold text-slate-800">
                    "결제"가 곧 "상환"
                  </span>
                                으로 이어진다는 점입니다.
                            </p>
                            <p>
                  <span className="font-semibold text-slate-800">
                    1차 결제 (상품 구매):
                  </span>{" "}
                                가상 결제 프로세스에서 카테고리별 상품을 결제합니다.
                            </p>
                            <p>
                  <span className="font-semibold text-slate-800">
                    2차 결제 (원금 상환):
                  </span>{" "}
                                설정된 자동 상환 비율에 따라 계좌에서 추가 금액이 빠져나가며
                                대출 원금+이자를 갚게 됩니다.
                            </p>
                            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                <p className="font-semibold text-slate-800">
                                    실제 예시 (상환 비율 5% 가정)
                                </p>
                                <p>카페에서 50,000원 결제 시</p>
                                <p>
                                    본인 계좌에서 50,000원(결제 대금) + 2,500원(원금 상환액) =
                                    총 52,500원이 인출됩니다.
                                </p>
                                <p className="mt-1">
                                    결과적으로 소비를 할 때마다 대출 잔액이 자동으로 줄어드는
                                    구조입니다.
                                </p>
                            </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 p-5">
                            <h3 className="mb-3 text-lg font-semibold text-slate-900">
                                3. 자기계발 대출 상품 이용 시
                            </h3>
                            <p>
                  <span className="font-semibold text-slate-800">
                    단순 결제:
                  </span>{" "}
                                자기계발 대출은 카드 결제와 상환이 직접적으로 연동되지
                                않습니다.
                            </p>
                            <p>
                                <span className="font-semibold text-slate-800">용도:</span>{" "}
                                카드는 일반적인 체크카드 용도로 사용하며, 대출 상환은 별도의
                                정해진 스케줄에 따라 이루어집니다.
                            </p>
                        </section>

                        <section>
                            <h3 className="mb-3 text-lg font-semibold text-slate-900">
                                요약 비교
                            </h3>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div
                                    className="grid grid-cols-[150px_1fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                                    <div>구분</div>
                                    <div>넛지 대출</div>
                                    <div>자기계발 대출</div>
                                </div>
                                <div
                                    className="grid grid-cols-[150px_1fr_1fr] gap-4 border-b border-slate-100 px-4 py-3">
                                    <div className="font-semibold text-slate-800">
                                        카드/계좌 발급
                                    </div>
                                    <div>필수</div>
                                    <div>필수</div>
                                </div>
                                <div
                                    className="grid grid-cols-[150px_1fr_1fr] gap-4 border-b border-slate-100 px-4 py-3">
                                    <div className="font-semibold text-slate-800">
                                        주요 상환 방식
                                    </div>
                                    <div>카드 결제 시 자동 상환 및 수동 상환</div>
                                    <div>수동 상환</div>
                                </div>
                                <div className="grid grid-cols-[150px_1fr_1fr] gap-4 px-4 py-3">
                                    <div className="font-semibold text-slate-800">
                                        결제와 상환의 관계
                                    </div>
                                    <div>매우 밀접 (결제할수록 대출 감소)</div>
                                    <div>무관 (단순 결제 수단)</div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
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
        <DialogContent
            className="sm:max-w-5xl border-slate-200 bg-white p-0 text-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            {issueResult ? (
                <div>
                    <div
                        className="border-b border-slate-200 bg-slate-50 px-8 py-6">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl text-slate-900">가상카드 발급이 완료되었습니다</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                계좌 생성과 카드 발급이 모두 완료되었습니다. 아래 정보를 확인해주세요.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="space-y-6 px-8 py-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-3 text-sm font-semibold text-slate-900">생성된 계좌 정보</p>
                                <div className="space-y-3 text-sm text-slate-700">
                                    <div>
                                        <p className="text-slate-900">계좌명</p>
                                        <p>{issueResult.accountName}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-900">계좌번호</p>
                                        <p>{issueResult.accountNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-900">시작 잔고</p>
                                        <p>{issueResult.balance?.toLocaleString("ko-KR")}원</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-3 text-sm font-semibold text-slate-900">발급된 카드 정보</p>
                                <div className="space-y-3 text-sm text-slate-700">
                                    <div>
                                        <p className="text-slate-900">카드번호</p>
                                        <p>{issueResult.cardNumber}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-slate-900">유효기간</p>
                                            <p>{issueResult.expiredYm}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-900">CVC</p>
                                            <p>{issueResult.cvc}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-slate-900">상태</p>
                                        <p>{issueResult.status}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t border-slate-200 bg-slate-50 px-8 py-5">
                        <button
                            className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-800"
                            onClick={closeDialog} type="button">
                            <span style={{color: "#fff"}}>확인</span>
                        </button>
                    </DialogFooter>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div
                        className="border-b border-slate-200 bg-slate-50 px-8 py-6">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-2xl text-slate-900">계좌 생성 및 카드 발급 신청</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">
                                입력한 계좌명으로 계좌가 생성되고, 해당 계좌에 연결된 가상카드가 발급됩니다.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="space-y-6 px-8 py-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-3 text-sm font-semibold text-slate-900">계좌 생성 정보</p>
                                <div className="space-y-3 text-sm text-slate-700">
                                    <div>
                                        <p className="text-slate-900">계좌명</p>
                                        <p>입력한 계좌명으로 계좌가 생성됩니다.</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-900">계좌번호</p>
                                        <p>14자리 번호가 자동 발급됩니다.</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-900">초기 정보</p>
                                        <p>잔고 0원으로 생성됩니다.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-3 text-sm font-semibold text-slate-900">카드 생성 정보</p>
                                <div className="space-y-3 text-sm text-slate-700">
                                    <div>
                                        <p className="text-slate-900">카드번호</p>
                                        <p>카드번호가 자동 생성됩니다.</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-900">유효기간 / CVC</p>
                                        <p>발급 시 자동 생성되며 완료 화면에서 바로 확인할 수 있습니다.</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-900">발급 상태</p>
                                        <p>발급 완료 직후 ACTIVE 상태로 사용할 수 있습니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-3 text-sm font-semibold text-slate-900">계좌 정보 입력</p>
                                <div className="space-y-3 text-sm text-slate-700">
                                    <div>
                                        <label className="mb-1 block text-slate-900"
                                               htmlFor="account-name">계좌명</label>
                                        <input
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                                            id="account-name"
                                            onChange={(event) => setAccountName(event.target.value)}
                                            value={accountName}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="mb-3 text-sm font-semibold text-slate-900">카드 정보 입력</p>
                                <div className="space-y-3 text-sm text-slate-700">
                                    <div>
                                        <label className="mb-1 block text-slate-900" htmlFor="card-password">카드
                                            비밀번호</label>
                                        <input
                                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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

                        {submitError &&
                            <p className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-800">{submitError}</p>}
                    </div>

                    <DialogFooter className="border-t border-slate-200 bg-slate-50 px-8 py-5">
                        <button
                            className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50"
                            onClick={closeDialog} type="button">
                            닫기
                        </button>
                        <button
                            className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            disabled={isSubmitting}
                            type="submit"
                        >
                            <span style={{color: "#fff"}}>{isSubmitting ? "발급 중..." : "계좌 생성 및 카드 발급"}</span>
                        </button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
    </Dialog>
</>
)
    ;
}
