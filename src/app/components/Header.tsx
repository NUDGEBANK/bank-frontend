import { useEffect, useState } from "react";
import { Link } from "react-router";
import { LogIn } from "lucide-react";

import { postJson } from "../lib/api";

interface MenuItem {
  label: string;
  path?: string;
  submenu?: { label: string; path: string }[];
}

const menuItems: MenuItem[] = [
  {
    label: "대출상품소개",
    path: "#",
    submenu: [{ label: "대출 상품 안내", path: "" }],
  },
  {
    label: "예금·적금",
    submenu: [
      { label: "입출금 예금", path: "#" },
      { label: "입출금 적금", path: "#" },
    ],
  },
  {
    label: "대출",
    submenu: [
      { label: "대출상품", path: "/loan/products" },
      { label: "대출 관리", path: "/loan/management" },
      { label: "신용 평가", path: "/loan/credit-score" },
    ],
  },
  {
    label: "카드",
    submenu: [
      { label: "똑개 카드", path: "/card/ddokgae" },
      { label: "카드이용내역", path: "/card/history" },
      { label: "소비 분석", path: "/card/spending-analysis" },
    ],
  },
  {
    label: "증권",
    submenu: [{ label: "ANTMILLION", path: "#" }],
  },
  {
    label: "고객센터",
    path: "#",
    submenu: [
      { label: "고객센터", path: "" },
      { label: "마이페이지", path: "/account/mypage" },
    ],
  },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/20 bg-gray-900/80 shadow-lg backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid h-16 grid-cols-[180px_1fr_140px] items-center gap-4">
            <Link to="/" className="text-2xl font-bold text-white drop-shadow-lg">
              NUDGEBANK
            </Link>

            <nav
              className="flex items-center justify-center"
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              {menuItems.map((item) => (
                <div
                  key={item.label}
                  className="relative flex h-16 w-[110px] items-center justify-center"
                >
                  {item.submenu && item.submenu.length > 0 ? (
                    <button className="py-2 text-base font-semibold text-white/90 transition-colors hover:text-white">
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      to={item.path || "#"}
                      className="py-2 text-base font-semibold text-white/90 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center justify-end gap-3">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:bg-white/30"
                >
                  로그아웃
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-lg border border-white/40 bg-white/20 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:bg-white/30"
                >
                  <LogIn className="h-4 w-4" />
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && <div className="fixed inset-0 top-16 z-30 bg-black/20 backdrop-blur-sm" />}

      {isMenuOpen && (
        <div
          className="fixed left-0 right-0 top-16 z-40 border-b border-white/20 bg-gray-800/50 shadow-2xl backdrop-blur-xl"
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="grid grid-cols-[180px_1fr_140px] items-start gap-4">
              <div className="text-2xl font-bold text-transparent">NUDGEBANK</div>

              <nav className="flex items-start justify-center">
                {menuItems.map((item) => (
                  <div key={item.label} className="flex w-[110px] flex-col items-center text-center">
                    {item.submenu && item.submenu.length > 0 && (
                      <div className="w-full space-y-1.5">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.label}
                            to={subItem.path}
                            className="block w-full py-0.5 text-center text-base text-white/90 transition-colors hover:text-white"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="flex items-center justify-end gap-3 opacity-0">
                <div className="px-4 py-2">로그인</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
