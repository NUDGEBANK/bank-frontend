import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { CalendarDays, Lock, Phone, User } from "lucide-react";

import { postJson } from "../lib/api";

export default function Signup() {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
        phoneNumber,
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
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">회원가입</h1>
            <p className="mt-2 text-sm text-slate-500">
              기본 정보를 입력하고 똑개뱅크를 시작해보세요.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="name">
                  이름
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    required
                    type="text"
                    value={name}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="userId">
                  아이디
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    id="userId"
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    required
                    type="text"
                    value={userId}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="password">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    id="confirmPassword"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="phoneNumber">
                  연락처
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    id="phoneNumber"
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="연락처를 입력하세요"
                    required
                    type="tel"
                    value={phoneNumber}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="birth">
                  생년월일
                </label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    id="birth"
                    onChange={(e) => setBirth(e.target.value)}
                    required
                    type="date"
                    value={birth}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">성별</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <input
                    checked={gender === "남성"}
                    className="h-4 w-4"
                    name="gender"
                    onChange={(e) => setGender(e.target.value)}
                    required
                    type="radio"
                    value="남성"
                  />
                  남성
                </label>

                <label className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                  <input
                    checked={gender === "여성"}
                    className="h-4 w-4"
                    name="gender"
                    onChange={(e) => setGender(e.target.value)}
                    required
                    type="radio"
                    value="여성"
                  />
                  여성
                </label>
              </div>
            </div>

            <button
              className="w-full rounded-2xl bg-[#2a4b78] py-3 text-sm font-semibold text-white transition hover:bg-[#223f64] disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={isSubmitting}
              type="submit"
            >
              <span style={{ color: "#fff" }}>{isSubmitting ? "가입 중..." : "회원가입"}</span>
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-500">이미 계정이 있으신가요?</p>
            <Link
              className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              to="/login"
            >
              로그인 하러가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
