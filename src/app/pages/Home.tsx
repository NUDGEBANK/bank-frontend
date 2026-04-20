import {type ReactNode, useRef} from "react";
import {Link} from "react-router";
import {ChevronLeft, ChevronRight} from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import homeBanner1 from "../../assets/home/nudgebank.png";
import homeBanner2 from "../../assets/home/loan.png";
import homeBanner3 from "../../assets/home/card.png";

const heroSlides = [
    {
        title: "카드 쓰고, 소비 흐름까지",
        subtitle: "체크카드 이용 내역과 AI 소비 분석을 함께 관리",
        actionLabel: "카드 신청하기",
        actionTo: "/card/nudgecard",
        image: homeBanner3,
    },
    {
        title: "내 조건에 맞는 상품 찾기",
        subtitle: "상품 비교부터 신청 가이드까지 한 화면에서 확인",
        actionLabel: "상담하기",
        actionTo: "/help/chat-history",
        image: homeBanner2,
    },
    {
        title: "내게 맞는 대출 찾기",
        subtitle: "조건에 맞는 대출 상품을 비교하고 신청해 보세요",
        actionLabel: "대출 신청하기",
        actionTo: "/loan/products",
        image: homeBanner1,
    },
] as const;

const homeCards = [
    {
        badge: "서비스",
        title: "NUDGEBOT",
        description: "궁금한 금융 정보와 이용 방법을 챗봇에서 빠르게 확인해 보세요.",
        to: "/help/chat-history",
        badgeClassName: "bg-orange-200/80 text-orange-900",
    },
    {
        badge: "서비스",
        title: "넛지 체크카드",
        description: "일상 소비에 맞춘 이용방법과 간편한 발급 절차를 한 번에 확인할 수 있습니다.",
        to: "/card/nudgecard",
        badgeClassName: "bg-orange-200/80 text-orange-900",
    },
    {
        badge: "추천 상품",
        title: "넛지 대출",
        description: "카드 사용 패턴과 월별 지출 흐름을 정밀한 AI 분석으로 확인해 보세요.",
        to: "/loan/products/consumption-loan/apply",
        badgeClassName: "bg-sky-200/80 text-sky-900",
    },
    {
        badge: "추천 상품",
        title: "자기계발 대출",
        description: "학습과 커리어 성장을 위한 자금 계획에 맞는 대출 조건을 비교해 보세요.",
        to: "/loan/products/youth-loan/apply",
        badgeClassName: "bg-sky-200/80 text-sky-900",
    },
    {
        badge: "추천 상품",
        title: "예적금 상품 추천",
        description: "지금 가입 가능한 다양한 예금·적금 상품을 한눈에 비교하고 선택할 수 있습니다.",
        to: "/deposit/products",
        badgeClassName: "bg-lime-200/80 text-lime-900",
    },
    {
        badge: "서비스",
        title: "신용 점수 확인",
        description: "현재 내 신용 상태를 실시간으로 확인하고 대출 가능성을 미리 점검하세요.",
        to: "/loan/credit-score",
        badgeClassName: "bg-violet-200/80 text-violet-900",
    },
] as const;

function SliderControls({onPrev, onNext}: { onPrev: () => void; onNext: () => void }) {
    return (
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={onPrev}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-700 transition hover:bg-white md:h-16 md:w-16"
                aria-label="이전 슬라이드"
            >
                <ChevronLeft className="h-8 w-8"/>
            </button>
            <button
                type="button"
                onClick={onNext}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-300 bg-white/80 text-slate-700 transition hover:bg-white md:h-16 md:w-16"
                aria-label="다음 슬라이드"
            >
                <ChevronRight className="h-8 w-8"/>
            </button>
        </div>
    );
}

function ServiceCards() {
    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {homeCards.map((card) => (
                <Link
                    key={card.title}
                    to={card.to}
                    className="group rounded-[40px] border border-slate-200 bg-white p-10 shadow-lg transition-all hover:-translate-y-2"
                >
                    <div
                        className={`mb-6 inline-flex items-center justify-center rounded-2xl px-5 py-2 text-md font-bold ${card.badgeClassName}`}>
                        {card.badge}
                    </div>
                    <h3 className="mb-4 text-2xl font-bold text-slate-900 md:text-3xl">
                        {card.title}
                    </h3>
                    <p className="text-base leading-relaxed text-slate-500 md:text-lg">
                        {card.description}
                    </p>
                </Link>
            ))}
        </div>
    );
}

export default function Home() {
    const sliderRef = useRef<Slider | null>(null);

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 600,
        fade: true,
        cssEase: "ease-in-out",
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 5000,
        arrows: false,
        appendDots: (dots: ReactNode) => (
            <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
                <ul className="m-0 flex items-center gap-2">{dots}</ul>
            </div>
        ),
    };

    return (
        <div className="flex flex-col bg-slate-50">
            <style>{`
                .home-hero-slider .slick-dots li button:before { display: none; }
                .home-hero-slider .slick-dots li { width: 12px; height: 12px; margin: 0 4px; }
                .home-hero-slider .slick-dots li button {
                  width: 12px; height: 12px; padding: 0; border-radius: 50%;
                  background-color: #cbd5e1; transition: all 0.3s;
                }
                .home-hero-slider .slick-dots li.slick-active button {
                  background-color: #334155; transform: scale(1.2);
                }
            `}</style>

            <section className="relative overflow-hidden">
                <Slider ref={sliderRef} className="home-hero-slider" {...sliderSettings}>
                    {heroSlides.map((slide) => (
                        <div key={slide.title}>
                            <div
                                className="relative min-h-[100vh] w-full bg-cover bg-center bg-no-repeat"
                                style={{backgroundImage: `url(${slide.image})`}}
                            >
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/40 to-transparent"/>
                                <div
                                    className="relative mx-auto flex min-h-[105vh] max-w-7xl flex-col px-8 pt-32 md:px-10 md:pt-48">
                                    <div className="max-w-2xl space-y-6">
                                        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
                                            {slide.title}
                                        </h1>
                                        <p className="text-xl text-slate-700 md:text-2xl">
                                            {slide.subtitle}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-4 pt-2">
                                            <Link
                                                to={slide.actionTo}
                                                className="inline-flex h-14 items-center justify-center rounded-3xl border border-slate-300 bg-white/80 px-8 text-lg font-semibold text-black transition hover:bg-white md:h-16"
                                            >
                                                <span>{slide.actionLabel}</span>
                                            </Link>
                                            <SliderControls
                                                onPrev={() => sliderRef.current?.slickPrev()}
                                                onNext={() => sliderRef.current?.slickNext()}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </section>
            <section className="mx-auto w-full max-w-7xl px-8 py-18 md:px-10">
                <ServiceCards/>
            </section>
        </div>
    );
}
