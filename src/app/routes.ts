import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DepositApply from "./pages/account/DepositApply";
import DepositManagement from "./pages/account/DepositManagement";
import DepositProducts from "./pages/account/DepositProducts";
import MyAccount from "./pages/account/MyAccount";
import DdokgaeAccount from "./pages/account/DdokgaeAccount";
import LoanProducts from "./pages/loan/LoanProducts";
import LoanDetail from "./pages/loan/LoanDetail";
import LoanApply from "./pages/loan/LoanApply";
import MyLoanManagement from "./pages/loan/MyLoanManagement";
import MyCreditScore from "./pages/loan/MyCreditScore";
import CompletedLoanDetail from "./pages/loan/CompletedLoanDetail";
import DdokgaeCard from "./pages/card/DdokgaeCard";
import CardHistory from "./pages/card/CardHistory";
import SpendingAnalysis from "./pages/card/SpendingAnalysis";
import MyPage from "./pages/account/MyPage";
import ChatHistory from "./pages/help/ChatHistory";
import LoanApplicationGuide from "./pages/loan/LoanApplicationGuide";
import RagDocsAdmin from "./pages/admin/RagDocsAdmin";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "deposit/products", Component: DepositProducts },
      { path: "deposit/products/:productId/apply", Component: DepositApply },
      { path: "deposit/management", Component: DepositManagement },
      { path: "account/my", Component: MyAccount },
      { path: "account/ddokgae", Component: DdokgaeAccount },
      { path: "loan/products", Component: LoanProducts },
      { path: "loan/apply-guide", Component: LoanApplicationGuide },
      { path: "loan/products/:productId", Component: LoanDetail },
      { path: "loan/products/:productId/apply", Component: LoanApply },
      { path: "loan/management", Component: MyLoanManagement },
      { path: "loan/management/completed/:loanHistoryId", Component: CompletedLoanDetail },
      { path: "loan/credit-score", Component: MyCreditScore },
      { path: "card/ddokgae", Component: DdokgaeCard },
      { path: "card/history", Component: CardHistory },
      { path: "card/spending-analysis", Component: SpendingAnalysis },
      { path: "account/mypage", Component: MyPage },
      { path: "help/chat-history", Component: ChatHistory },
      { path: "admin/ragdocs", Component: RagDocsAdmin },
    ],
  },
]);
