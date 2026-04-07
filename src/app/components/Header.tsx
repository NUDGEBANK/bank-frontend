import { useEffect, useState } from "react";
import { Link } from "react-router";
import { LogIn } from "lucide-react";

import { postJson } from "../lib/api";

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
    submenu: [{ label: "은행 소개", path: "" }],
  },
  {
    label: "예금·적금",
    description: "일상 자금 관리에 맞는 입출금 상품과 적금 상품을 안내합니다.",
    submenu: [
      { label: "입출금 예금", path: "#" },
      { label: "입출금 적금", path: "#" },
    ],
  },
  {
    label: "대출",
    description: "맞춤형 대출 상품과 대출 관리, 신용 평가 정보를 확인할 수 있습니다.",
    submenu: [
      { label: "대출상품", path: "/loan/products" },
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
    submenu: [{ label: "고객센터", path: "" }],
  },
];

export default function Header() {
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem("isLoggedIn") === "true",
  );

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };

    syncAuthState();
    window.addEventListener("storage", syncAuthState);
    window.addEventListener("auth-change", syncAuthState);

    return () => {
      window.removeEventListener("storage", syncAuthState);
      window.removeEventListener("auth-change", syncAuthState);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await postJson<{ ok: boolean }>("/api/auth/logout", {});
    } catch {
      // Ignore logout errors so local auth state is always cleared.
    } finally {
      localStorage.removeItem("isLoggedIn");
      window.dispatchEvent(new Event("auth-change"));
    }
  };

  const activeMenu = menuItems.find((item) => item.label === activeMenuLabel) ?? null;

  return (
    <>
      <div className="sticky top-0 z-50" onMouseLeave={() => setActiveMenuLabel(null)}>
        <header className="border-b border-white/20 bg-gray-900/80 shadow-lg backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid h-16 grid-cols-[180px_1fr_280px] items-center gap-4">
              <Link to="/" className="text-2xl font-bold text-white drop-shadow-lg">
                NUDGEBANK
              </Link>

              <nav className="flex items-center justify-center">
                <div
                  className="mx-auto flex items-center justify-center gap-14"
                  style={{ width: `${MENU_TRACK_WIDTH}px` }}
                >
                  {menuItems.map((item) => (
                    <div
                      key={item.label}
                      className="relative flex h-16 items-center justify-center"
                      onMouseEnter={() => setActiveMenuLabel(item.label)}
                    >
                      {item.submenu && item.submenu.length > 0 ? (
                        <button className="py-2 text-base font-semibold tracking-tight text-white/90 transition-colors hover:text-white">
                          {item.label}
                        </button>
                      ) : (
                        <Link
                          to={item.path || "#"}
                          className="py-2 text-base font-semibold tracking-tight text-white/90 transition-colors hover:text-white"
                        >
                          {item.label}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </nav>

              <div className="flex items-center justify-end gap-3">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/account/mypage"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/20 px-4 py-2 font-semibold leading-none text-white shadow-lg transition-all hover:bg-white/30"
                    >
                      마이페이지
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/20 px-4 py-2 font-semibold leading-none text-white shadow-lg transition-all hover:bg-white/30"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/20 px-4 py-2 font-semibold leading-none text-white shadow-lg transition-all hover:bg-white/30"
                  >
                    <LogIn className="h-4 w-4" />
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        {activeMenuLabel && (
          <div className="pointer-events-none fixed inset-0 top-16 z-30 bg-black/20 backdrop-blur-sm" />
        )}

        {activeMenuLabel && (
          <div className="absolute left-0 right-0 top-full z-40 border-b border-white/20 bg-gray-800/50 shadow-2xl backdrop-blur-xl">
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

                <div className="opacity-0">
                  <div className="px-4 py-2">로그인</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
