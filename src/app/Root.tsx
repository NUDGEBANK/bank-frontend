import { Outlet, useLocation } from "react-router";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";

export default function Root() {
  const location = useLocation();
  const isChatHistoryPage = location.pathname === "/help/chat-history";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        {!isChatHistoryPage ? <ChatBot /> : null}
      </div>
    </div>
  );
}
