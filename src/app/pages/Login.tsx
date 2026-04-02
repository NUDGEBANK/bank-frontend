import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { User, Lock } from "lucide-react";
import { postJson } from "../lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // @ts-ignore
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await postJson<{ ok: boolean; message?: string }>("/api/auth/login", {
        userId: username,
        password,
      });
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new Event("auth-change"));
      navigate("/");
    } catch (err) {
      const message =
        err instanceof Error && err.message === "INVALID_CREDENTIALS"
          ? "아이디 또는 비밀번호를 확인해주세요."
          : "로그인에 실패했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 로그인 카드 */}
        <div className="bg-white/15 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 border-white/30">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">로그인</h1>
            <p className="text-blue-100">똑개뱅크에 오신 것을 환영합니다</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-sm text-red-900 bg-red-100/90 border border-red-300 rounded-lg px-3 py-2 font-medium">
                {error}
              </p>
            )}
            {/* 아이디 입력 */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-white mb-2">
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-blue-200" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 text-white placeholder-blue-200 transition-all"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-blue-200" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 text-white placeholder-blue-200 transition-all"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="w-full py-3 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg font-bold hover:bg-white transition-all shadow-lg border border-white/40 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-blue-100">또는</span>
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <p className="text-blue-100 mb-4">아직 계정이 없으신가요?</p>
            <Link
              to="/Signup"
              className="inline-block w-full py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white rounded-lg font-semibold hover:bg-white/30 transition-all"
            >
              회원가입
            </Link>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-blue-100">
            로그인에 문제가 있으신가요?{" "}
            <Link to="#" className="text-blue-300 hover:text-blue-200 hover:underline font-semibold">
              고객센터
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
