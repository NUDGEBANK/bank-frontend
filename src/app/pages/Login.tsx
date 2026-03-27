import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogIn, User, Lock } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제 로그인 로직은 여기에 구현
    console.log("Login attempt:", { username, password });
    // 로그인 성공 시 홈으로 이동
    navigate("/");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 로그인 카드 */}
        <div className="bg-white/15 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 border-white/30">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4 border-2 border-white/40">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">로그인</h1>
            <p className="text-blue-100">똑개뱅크에 오신 것을 환영합니다</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* 로그인 유지 & 비밀번호 찾기 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-2 border-white/40 bg-white/20 text-blue-500 focus:ring-2 focus:ring-white/50"
                />
                <span className="text-sm text-blue-100">로그인 유지</span>
              </label>
              <Link to="#" className="text-sm text-blue-300 hover:text-blue-200 hover:underline">
                비밀번호 찾기
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              className="w-full py-3 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg font-bold hover:bg-white transition-all shadow-lg border border-white/40"
            >
              로그인
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
              to="#"
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
