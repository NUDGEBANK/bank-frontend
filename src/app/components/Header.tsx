import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";

import { postJson } from "../lib/api";
import { useAuthStatus } from "../hooks/useAuthStatus";
import nudgeLogo from "../../assets/nudge.png";

interface MenuItem {
  label: string;
  path?: string;
  description?: string;
  submenu?: { label: string; path: string }[];
}

const MENU_TRACK_WIDTH = 760;
const DROPDOWN_INFO_WIDTH = 96;

const menuItems: MenuItem[] = [
  {
    label: "은행 소개",
    path: "/about",
    description: "NUDGEBANK의 서비스 방향과 핵심 금융 기능을 소개합니다.",
    submenu: [{ label: "은행 소개", path: "/about" }],
  },
  {
    label: "예금·적금",
    description: "일상 자금 관리에 맞는 입출금 상품과 적금 상품을 안내합니다.",
    submenu: [
      { label: "예금·적금 상품", path: "/deposit/products" },
      { label: "예금·적금 관리", path: "/deposit/management" },
    ],
  },
  {
    label: "대출",
    description: "맞춤형 대출 상품과 대출 관리, 신용 평가 정보를 확인할 수 있습니다.",
    submenu: [
      { label: "대출 상품", path: "/loan/products" },
      { label: "대출 신청 안내", path: "/loan/apply-guide" },
      { label: "대출 관리", path: "/loan/management" },
      { label: "신용 평가", path: "/loan/credit-score" },
    ],
  },
  {
    label: "카드",
    description: "넛지 카드 발급과 이용 내역, 소비 분석 서비스를 제공합니다.",
    submenu: [
      { label: "넛지 체크카드", path: "/card/nudgecard" },
      { label: "카드 이용 내역", path: "/card/history" },
      { label: "소비 분석", path: "/card/spending-analysis" },
    ],
  },
  {
    label: "증권",
    description: "투자 관련 서비스와 연계 자산 관리 기능을 준비 중입니다.",
    submenu: [{ label: "ANTMILLION", path: "#" }],
  },
  {
    label: "챗봇",
    path: "#",
    description: "이용 안내와 고객 지원 정보를 확인할 수 있습니다.",
    submenu: [
      { label: "NUDGEBOT", path: "/help/chat-history" }
    ],
  },
];

export default function Header() {
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStatus();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1180px)");
    const syncMenuStateByViewport = () => {
      if (mediaQuery.matches) {
        setIsMobileMenuOpen(false);
      } else {
        setActiveMenuLabel(null);
      }
    };

    syncMenuStateByViewport();
    mediaQuery.addEventListener("change", syncMenuStateByViewport);
    return () => mediaQuery.removeEventListener("change", syncMenuStateByViewport);
  }, []);

  const handleLogout = async () => {
    try {
      await postJson<{ ok: boolean }>("/api/auth/logout", {});
    } catch {
      // Ignore logout errors so local auth state is always cleared.
    } finally {
      window.dispatchEvent(new Event("auth-change"));
      window.location.reload();
    }
  };

  const activeMenu = menuItems.find((item) => item.label === activeMenuLabel) ?? null;
  const authButtonClassName =
    "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-900";
  const authPrimaryButtonClassName =
    "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-600";
  const getPrimaryPath = (item: MenuItem) => {
    const firstSubmenuPath = item.submenu?.[0]?.path;
    if (firstSubmenuPath && firstSubmenuPath !== "#") {
      return firstSubmenuPath;
    }
    if (item.path && item.path !== "#") {
      return item.path;
    }
    return null;
  };

  return (
    <>
      <div
        className={isHomePage ? "absolute left-0 right-0 top-0 z-50" : "sticky top-0 z-50"}
        onMouseLeave={() => setActiveMenuLabel(null)}
      >
        <header className={isHomePage ? "bg-transparent" : "border-b border-slate-200 bg-white"}>
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-4 min-[1180px]:grid-cols-[150px_1fr_220px] min-[1280px]:grid-cols-[180px_1fr_280px]">
              <Link to="/" className="inline-flex items-center gap-3 text-slate-900">
                <img src={nudgeLogo} alt="" className="h-16 w-16 object-contain" />
                <span className="text-3xl font-bold">NUDGEBANK</span>
              </Link>

              <nav className="ml-34 hidden items-center justify-center min-[1180px]:flex">
                <div
                    className="mx-auto flex w-full items-center justify-center gap-6 md:gap-10 lg:gap-14"
                    style={{ maxWidth: `${MENU_TRACK_WIDTH}px` }}
                >
                  {menuItems.map((item) => (
                    <div
                      key={item.label}
                      className="relative flex h-16 items-center justify-center"
                      onMouseEnter={() => setActiveMenuLabel(item.label)}
                    >
                      {getPrimaryPath(item) ? (
                        <Link
                          to={getPrimaryPath(item) || "#"}
                          onFocus={() => setActiveMenuLabel(item.label)}
                          className="whitespace-nowrap py-2 text-base font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-600 md:text-lg"
                        >
                          {item.label}
                        </Link>
                      ) : item.submenu && item.submenu.length > 0 ? (
                        <button
                          type="button"
                          aria-haspopup="menu"
                          aria-expanded={activeMenuLabel === item.label}
                          onFocus={() => setActiveMenuLabel(item.label)}
                          onClick={() =>
                            setActiveMenuLabel((current) =>
                              current === item.label ? null : item.label,
                            )
                          }
                          className="whitespace-nowrap py-2 text-base font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-600 md:text-lg"
                        >
                          {item.label}
                        </button>
                      ) : (
                        <Link
                          to={item.path || "#"}
                          className="whitespace-nowrap py-2 text-base font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-600 md:text-lg"
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </nav>

              <div className="hidden items-center justify-end gap-2 lg:gap-3 min-[1180px]:flex">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/account/mypage"
                      className={authButtonClassName}
                    >
                      마이페이지
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className={authPrimaryButtonClassName}
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className={authPrimaryButtonClassName}
                  >
                    로그인
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 min-[1180px]:hidden">
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                  aria-label="메뉴 열기"
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {activeMenuLabel && (
          <div className="pointer-events-none fixed inset-0 top-16 z-30 hidden bg-black/20 backdrop-blur-sm min-[1180px]:block" />
        )}

        {activeMenuLabel && (
          <div className="absolute left-0 right-0 top-full z-40 hidden border-b border-slate-200/70 bg-white/75 shadow-2xl backdrop-blur-md min-[1180px]:block">
            <div className="mx-auto max-w-7xl px-4 py-8">
              <div className="grid min-h-[150px] grid-cols-[180px_1fr_280px] items-start gap-4">
                <div className="pt-1">
                  {activeMenu && (
                    <div className="space-y-2">
                      <p className="text-2xl font-semibold tracking-tight text-slate-900">{activeMenu.label}</p>
                      <p className="text-base leading-6 text-slate-600">{activeMenu.description}</p>
                    </div>
                  )}
                </div>

                <nav className="flex items-start justify-center pt-1">
                  <div className="mx-auto w-full" style={{ maxWidth: `${MENU_TRACK_WIDTH}px` }}>
                    <div className="flex min-h-[32px] items-start">
                      <div className="shrink-0" style={{ width: `${DROPDOWN_INFO_WIDTH}px` }} />
                      {activeMenu && (
                        <div className="flex items-center gap-10">
                          {activeMenu.submenu?.map((subItem) => (
                            <Link
                              key={subItem.label}
                              to={subItem.path}
                              className="whitespace-nowrap py-1 text-lg font-medium text-slate-900 transition-colors hover:text-slate-600"
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </nav>

                <div aria-hidden="true" className="invisible">
                  <div className="px-4 py-2">로그인</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isMobileMenuOpen && (
          <div className="border-b border-slate-200/70 bg-white/75 shadow-2xl backdrop-blur-md min-[1180px]:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4">
              <div className="space-y-5">
                {menuItems.map((item) => (
                  <div key={item.label} className="border-b border-slate-200 pb-4 last:border-b-0 last:pb-0">
                    <Link
                      to={getPrimaryPath(item) || "#"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-lg font-semibold text-slate-900"
                    >
                      {item.label}
                    </Link>
                    {item.description && (
                      <p className="mt-2 text-base leading-7 text-slate-600">{item.description}</p>
                    )}
                    {item.submenu && item.submenu.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.label}
                            to={subItem.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 transition hover:bg-slate-50"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isAuthenticated ? (
                  <Link
                    to="/account/mypage"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-base font-semibold text-slate-900 transition hover:text-slate-600"
                  >
                    마이페이지
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full rounded-2xl px-4 py-3 text-left text-base font-semibold text-slate-900 transition hover:text-slate-600"
                  >
                    로그인
                  </Link>
                )}

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full rounded-2xl px-4 py-3 text-left text-base font-semibold text-slate-900 transition hover:text-slate-900"
                  >
                    로그아웃
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
