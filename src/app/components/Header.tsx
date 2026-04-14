import { useEffect, useState } from "react";
import { Link } from "react-router";
import { LogIn, Menu, X } from "lucide-react";

import { postJson } from "../lib/api";
import { useAuthStatus } from "../hooks/useAuthStatus";

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
    path: "#",
    description: "NUDGEBANK의 서비스 방향과 핵심 금융 기능을 소개합니다.",
    submenu: [{ label: "은행 소개", path: "/" }],
  },
  {
    label: "예금·적금",
    description: "일상 자금 관리에 맞는 입출금 상품과 적금 상품을 안내합니다.",
    submenu: [
      { label: "예적금 상품", path: "/deposit/products" },
      { label: "예적금 관리", path: "/deposit/management" },
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
    description: "똑개 카드 발급과 이용 내역, 소비 분석 서비스를 제공합니다.",
    submenu: [
      { label: "똑개 카드", path: "/card/ddokgae" },
      { label: "카드이용내역", path: "/card/history" },
      { label: "소비 분석", path: "/card/spending-analysis" },
    ],
  },
  {
    label: "증권",
    description: "투자 관련 서비스와 연계 자산 관리 기능을 준비 중입니다.",
    submenu: [{ label: "ANTMILLION", path: "#" }],
  },
  {
    label: "고객센터",
    path: "#",
    description: "이용 안내와 고객 지원 정보를 확인할 수 있습니다.",
    submenu: [
      { label: "고객센터", path: "" },
      { label: "NUDGEBOT", path: "/help/chat-history" }
    ],
  },
];

export default function Header() {
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuthStatus();

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
        className="sticky top-0 z-50"
        onMouseLeave={() => setActiveMenuLabel(null)}
      >
        <header className="border-b border-white/20 bg-gray-900/80 shadow-lg backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-4 min-[1180px]:grid-cols-[150px_1fr_220px] min-[1280px]:grid-cols-[180px_1fr_280px]">
              <Link to="/" className="text-2xl font-bold text-white drop-shadow-lg">
                NUDGEBANK
              </Link>

              <nav className="hidden items-center justify-center min-[1180px]:flex">
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
                          className="whitespace-nowrap py-2 text-sm font-semibold tracking-tight text-white/90 transition-colors hover:text-white md:text-base"
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
                          className="whitespace-nowrap py-2 text-sm font-semibold tracking-tight text-white/90 transition-colors hover:text-white md:text-base"
                        >
                          {item.label}
                        </button>
                      ) : (
                        <Link
                          to={item.path || "#"}
                          className="whitespace-nowrap py-2 text-sm font-semibold tracking-tight text-white/90 transition-colors hover:text-white md:text-base"
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
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 py-2 text-sm font-semibold leading-none text-white shadow-lg transition-all hover:bg-white/30 lg:px-4"
                    >
                      마이페이지
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 py-2 text-sm font-semibold leading-none text-white shadow-lg transition-all hover:bg-white/30 lg:px-4"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/20 px-3 py-2 text-sm font-semibold leading-none text-white shadow-lg transition-all hover:bg-white/30 lg:px-4"
                  >
                    <LogIn className="h-4 w-4" />
                    로그인
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 min-[1180px]:hidden">
                {isAuthenticated ? (
                  <Link
                    to="/account/mypage"
                    className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/20 px-3 py-2 text-sm font-semibold leading-none text-white transition-all hover:bg-white/30"
                  >
                    마이페이지
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/20 px-3 py-2 text-sm font-semibold leading-none text-white transition-all hover:bg-white/30"
                  >
                    로그인
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/40 bg-white/20 text-white transition-all hover:bg-white/30"
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
          <div className="absolute left-0 right-0 top-full z-40 hidden border-b border-white/20 bg-gray-800/50 shadow-2xl backdrop-blur-xl min-[1180px]:block">
            <div className="mx-auto max-w-7xl px-4 py-6">
              <div className="grid min-h-[116px] grid-cols-[180px_1fr_280px] items-start gap-4">
                <div className="pt-1">
                  {activeMenu && (
                    <div className="space-y-2">
                      <p className="text-base font-semibold tracking-tight text-white">{activeMenu.label}</p>
                      <p className="text-sm leading-5 text-white/70">{activeMenu.description}</p>
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
                              className="whitespace-nowrap py-1 text-base font-medium text-white/90 transition-colors hover:text-white"
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
          <div className="border-b border-white/20 bg-gray-900/95 shadow-2xl backdrop-blur-md min-[1180px]:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4">
              <div className="space-y-5">
                {menuItems.map((item) => (
                  <div key={item.label} className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
                    <Link
                      to={getPrimaryPath(item) || "#"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-base font-semibold text-white"
                    >
                      {item.label}
                    </Link>
                    {item.description && (
                      <p className="mt-2 text-sm leading-6 text-white/65">{item.description}</p>
                    )}
                    {item.submenu && item.submenu.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.label}
                            to={subItem.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/85 transition hover:bg-white/10"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/15"
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
