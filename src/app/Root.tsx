import { Outlet, useLocation } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";

export default function Root() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin/");
  const isHomePage = location.pathname === "/";
  const isChatHistoryPage = location.pathname === "/help/chat-history";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <main className={isHomePage ? "flex flex-col" : "flex-1 flex flex-col"}>
          <Outlet />
        </main>
        <div>
          <Footer />
        </div>
        {!isAdminPage && !isChatHistoryPage ? <ChatBot /> : null}      </div>
    </div>
  );
}
