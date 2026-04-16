import { Outlet, useLocation } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";

export default function Root() {
  const location = useLocation();
  const isChatHistoryPage = location.pathname === "/help/chat-history";
  const isAdminPage = location.pathname.startsWith("/admin/ragdocs");
  const isHomePage = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="relative z-10 min-h-screen flex flex-col">
        {isAdminPage ? null : <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
        {isAdminPage ? null : <Footer />}
        {!isChatHistoryPage && !isAdminPage ? <ChatBot /> : null}
        <Header />
        <main className={isHomePage ? "flex flex-col" : "flex-1 flex flex-col"}>
          <Outlet />
        </main>
        <div>
          <Footer />
        </div>
        {!isChatHistoryPage ? <ChatBot /> : null}
      </div>
    </div>
  );
}
