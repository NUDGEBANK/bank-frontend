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
    label: "상품소개",
    path: "#",
    submenu: [{ label: "상품안내", path: "" }],
  },
  // {
  //   label: "통장",
  //   submenu: [
  //     { label: "내 통장", path: "/account/my" },
  //     { label: "똑개 통장", path: "/account/ddokgae" },
  //   ],
  // },
  {
    label: "예금/적금",
    submenu: [
      { label: "똑개 예금", path: "#" },
      { label: "똑개 적금", path: "#" },
    ],
  },
  {
    label: "대출",
    submenu: [
      { label: "대출상품", path: "/loan/products" },
      { label: "대출관리", path: "/loan/management" },
      { label: "신용점수조회", path: "/loan/credit-score" },
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
    submenu: [{ label: "고객센터", path: "" }],
  },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");

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
      // Ignore logout errors to ensure local state clears.
    } finally {
      localStorage.removeItem("isLoggedIn");
      window.dispatchEvent(new Event("auth-change"));
    }
  };

  return (
    <>
      {/* <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-lg"> */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-[180px_1fr_140px] items-center h-16 gap-4">
            {/* 로고 */}
            <Link to="/" className="font-bold text-2xl text-white drop-shadow-lg">
              NUDGEBANK
            </Link>

            {/* 네비게이션 메뉴 */}
            <nav 
              className="flex items-center justify-center"
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              {menuItems.map((item, index) => (
                <div key={index} className="relative h-16 flex items-center w-[110px] justify-center">
                  {item.submenu && item.submenu.length > 0 ? (
                    <button className="py-2 text-white/90 hover:text-white transition-colors font-semibold text-base">
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      to={item.path || "#"}
                      className="py-2 text-white/90 hover:text-white transition-colors font-semibold text-base"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* 우측 영역 - 로그인 버튼 */}
            <div className="flex items-center justify-end gap-3">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/40 text-white rounded-lg hover:bg-white/30 transition-all shadow-lg font-semibold"
                >
                  로그아웃
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/40 text-white rounded-lg hover:bg-white/30 transition-all shadow-lg font-semibold"
                >
                  <LogIn className="w-4 h-4" />
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 블러 오버레이 - 메뉴 열려있을 때 */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/20 backdrop-blur-sm z-30"
        />
      )}

      {/* 메가 메뉴 드롭다운 - 모든 서브메뉴 표시 */}
      {isMenuOpen && (
        <div
          className="fixed left-0 right-0 top-16 bg-gray-800/50 backdrop-blur-xl border-b border-white/20 shadow-2xl z-40"
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-[180px_1fr_140px] items-start gap-4">
              {/* 로고 공간 (헤더와 동일하게 정렬) */}
              <div className="font-bold text-2xl text-transparent">똑개뱅크</div>

              {/* 서브메뉴 영역 (헤더 네비게이션과 정렬) */}
              <nav className="flex items-start justify-center">
                {menuItems.map((item, index) => (
                  <div key={index} className="w-[110px] flex flex-col items-center text-center">
                    {item.submenu && item.submenu.length > 0 && (
                      <div className="space-y-1.5 w-full">
                        {item.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            to={subItem.path}
                            className="block w-full text-white/90 hover:text-white transition-colors text-base py-0.5 text-center">
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* 로그인 버튼 공간 (헤더와 동일하게 정렬) */}
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


