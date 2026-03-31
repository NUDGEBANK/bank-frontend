import { createBrowserRouter } from "react-router";
import Root from "./Root";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyAccount from "./pages/account/MyAccount";
import DdokgaeAccount from "./pages/account/DdokgaeAccount";
import LoanProducts from "./pages/loan/LoanProducts";
import LoanDetail from "./pages/loan/LoanDetail";
import MyLoanManagement from "./pages/loan/MyLoanManagement";
import MyCreditScore from "./pages/loan/MyCreditScore";
import DdokgaeCard from "./pages/card/DdokgaeCard";
import CardHistory from "./pages/card/CardHistory";
import SpendingAnalysis from "./pages/card/SpendingAnalysis";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
      { path: "account/my", Component: MyAccount },
      { path: "account/ddokgae", Component: DdokgaeAccount },
      { path: "loan/products", Component: LoanProducts },
      { path: "loan/products/:productId", Component: LoanDetail },
      { path: "loan/management", Component: MyLoanManagement },
      { path: "loan/credit-score", Component: MyCreditScore },
      { path: "card/ddokgae", Component: DdokgaeCard },
      { path: "card/history", Component: CardHistory },
      { path: "card/spending-analysis", Component: SpendingAnalysis },
    ],
  },
]);