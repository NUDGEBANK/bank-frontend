import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Lock, User } from "lucide-react";

import { postJson } from "../lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">로그인</h1>
            <p className="text-slate-500">똑개뱅크에 오신 것을 환영합니다</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-semibold text-slate-700">
                아이디
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="아이디를 입력하세요"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                비밀번호
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 py-3 font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-slate-400">또는</span>
            </div>
          </div>

          <div className="text-center">
            <p className="mb-4 text-slate-500">아직 계정이 없으신가요?</p>
            <Link
              to="/Signup"
              className="inline-block w-full rounded-2xl border border-slate-200 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              회원가입
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            로그인에 문제가 있으신가요?{" "}
            <Link to="#" className="font-semibold text-slate-900 hover:text-blue-600 hover:underline">
              고객센터
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
