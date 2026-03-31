import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { User, Lock, CalendarDays } from "lucide-react";
import { postJson } from "../lib/api";

export default function Signup() {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // @ts-ignore
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await postJson<{ ok: boolean; message?: string }>("/api/auth/signup", {
        name,
        userId,
        password,
        birth: birth || null,
        gender,
      });
      localStorage.setItem("isLoggedIn", "true");
      window.dispatchEvent(new Event("auth-change"));
      navigate("/");
    } catch (err) {
      const message =
        err instanceof Error && err.message === "DUPLICATE_USER_ID"
          ? "이미 사용 중인 아이디입니다."
          : "회원가입에 실패했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white/15 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 border-white/30">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">회원가입</h1>
            <p className="text-blue-100">똑개뱅크 계정을 만들어보세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="text-sm text-red-100 bg-red-500/20 border border-red-200/40 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                이름
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-blue-200" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 text-white placeholder-blue-200 transition-all"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 아이디 */}
            <div>
              <label htmlFor="userId" className="block text-sm font-semibold text-white mb-2">
                아이디
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-blue-200" />
                </div>
                <input
                  type="text"
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 text-white placeholder-blue-200 transition-all"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 */}
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

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-blue-200" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 text-white placeholder-blue-200 transition-all"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 생년월일 */}
            <div>
              <label htmlFor="birth" className="block text-sm font-semibold text-white mb-2">
                생년월일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDays className="w-5 h-5 text-blue-200" />
                </div>
                <input
                  type="date"
                  id="birth"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 text-white transition-all"
                  required
                />
              </div>
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">성별</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-center gap-2 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg cursor-pointer hover:bg-white/30 transition-all">
                  <input
                    type="radio"
                    name="gender"
                    value="남성"
                    checked={gender === "남성"}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-4 h-4"
                    required
                  />
                  <span className="text-white font-medium">남성</span>
                </label>

                <label className="flex items-center justify-center gap-2 py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 rounded-lg cursor-pointer hover:bg-white/30 transition-all">
                  <input
                    type="radio"
                    name="gender"
                    value="여성"
                    checked={gender === "여성"}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-4 h-4"
                    required
                  />
                  <span className="text-white font-medium">여성</span>
                </label>
              </div>
            </div>

            {/* 회원가입 버튼 */}
            <button
              type="submit"
              className="w-full py-3 bg-white/90 backdrop-blur-sm text-blue-600 rounded-lg font-bold hover:bg-white transition-all shadow-lg border border-white/40 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "가입 중..." : "회원가입"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-blue-100">또는</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-blue-100 mb-4">이미 계정이 있으신가요?</p>
            <Link
              to="/login"
              className="inline-block w-full py-3 bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white rounded-lg font-semibold hover:bg-white/30 transition-all"
            >
              로그인 하러가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
