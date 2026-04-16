const introSections = [
  {
    title: "서비스가 지향하는 흐름",
    description:
      "NUDGEBANK는 계좌, 카드, 예적금, 대출 기능을 각각 따로 보지 않고 일상 금융의 흐름 안에서 자연스럽게 이어지도록 구성한 서비스입니다.",
  },
  {
    title: "이름에 담은 의미",
    description:
      "NUDGE는 사전적으로 가볍게 밀다, 자연스럽게 유도하다는 뜻을 가지며 사용자가 더 나은 금융 선택으로 편하게 이어질 수 있도록 돕는 의미를 담고 있습니다.",
  },
  {
    title: "일상에 맞춘 관리",
    description:
      "소비 흐름과 자산 관리, 예적금과 대출 이용 상태를 함께 확인하며 자신의 금융 습관을 더 편하게 관리할 수 있도록 설계했습니다.",
  },
] as const;

export default function AboutBank() {
  return (
    <div className="bg-slate-50">
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-7xl flex-col justify-center px-6 py-16 sm:px-8 lg:px-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            일상에 자연스럽게 스며드는 금융
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            NUDGEBANK는 계좌, 카드, 예적금, 대출 기능을 하나의 흐름으로
            연결해 사용자의 일상 금융을 더 단순하고 이해하기 쉽게 정리하는
            서비스를 지향합니다.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {introSections.map((section) => {
            return (
              <article key={section.title} className="max-w-sm">
                <h2 className="text-xl font-bold leading-8 tracking-tight text-slate-900 sm:text-[1.35rem]">
                  {section.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                  {section.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
