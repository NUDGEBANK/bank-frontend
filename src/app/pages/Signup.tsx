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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">회원가입</h1>
            <p className="text-slate-500">똑개뱅크 계정을 만들어보세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            {[
              {
                id: "name",
                label: "이름",
                value: name,
                onChange: setName,
                placeholder: "이름을 입력하세요",
                icon: User,
                type: "text",
              },
              {
                id: "userId",
                label: "아이디",
                value: userId,
                onChange: setUserId,
                placeholder: "아이디를 입력하세요",
                icon: User,
                type: "text",
              },
              {
                id: "password",
                label: "비밀번호",
                value: password,
                onChange: setPassword,
                placeholder: "비밀번호를 입력하세요",
                icon: Lock,
                type: "password",
              },
              {
                id: "confirmPassword",
                label: "비밀번호 확인",
                value: confirmPassword,
                onChange: setConfirmPassword,
                placeholder: "비밀번호를 다시 입력하세요",
                icon: Lock,
                type: "password",
              },
              {
                id: "phoneNumber",
                label: "연락처",
                value: phoneNumber,
                onChange: setPhoneNumber,
                placeholder: "연락처를 입력하세요",
                icon: Phone,
                type: "tel",
              },
            ].map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.id}>
                  <label htmlFor={field.id} className="mb-2 block text-sm font-semibold text-slate-700">
                    {field.label}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Icon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type={field.type}
                      id={field.id}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder={field.placeholder}
                      required
                    />
                  </div>
                </div>
              );
            })}

            <div>
              <label htmlFor="birth" className="mb-2 block text-sm font-semibold text-slate-700">
                생년월일
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <CalendarDays className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="date"
                  id="birth"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-slate-900 outline-none transition-all focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">성별</label>
              <div className="grid grid-cols-2 gap-3">
                {["남성", "여성"].map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 transition-all hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={gender === option}
                      onChange={(e) => setGender(e.target.value)}
                      className="h-4 w-4"
                      required
                    />
                    <span className="font-medium text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 py-3 font-bold text-white transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "가입 중..." : "회원가입"}
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
            <p className="mb-4 text-slate-500">이미 계정이 있으신가요?</p>
            <Link
              to="/login"
              className="inline-block w-full rounded-2xl border border-slate-200 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50"
            >
              로그인 하러가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
