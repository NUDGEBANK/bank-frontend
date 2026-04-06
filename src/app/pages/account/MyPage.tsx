import { useRef, useState } from "react";
import {
  BadgeCheck,
  CreditCard,
  FileSearch,
  FileText,
  Upload,
  User,
} from "lucide-react";
import { API_BASE } from "../../lib/api";

const quickMenus = [
  {
    title: "내 정보 관리",
    description: "회원 정보와 이용 현황을 한 번에 확인합니다.",
    icon: User,
  },
  {
    title: "대출 관리",
    description: "진행 중인 대출과 상환 일정을 확인합니다.",
    icon: FileText,
  },
  {
    title: "카드 이용내역",
    description: "최근 결제 내역과 상세 사용 정보를 조회합니다.",
    icon: CreditCard,
  },
  {
    title: "인증 결과 조회",
    description: "자격증 인증 결과와 제출 상태를 확인합니다.",
    icon: BadgeCheck,
  },
];

const ocrSteps = [
  "자격증 종류 선택",
  "파일 업로드",
  "OCR 텍스트 추출",
  "자격증명과 발급기관 검증",
];

const certificateGroups = [
  {
    label: "사무/기초",
    options: [
      { id: "1", label: "컴퓨터활용능력 1급" },
      { id: "2", label: "컴퓨터활용능력 2급" },
      { id: "3", label: "워드프로세서" },
      { id: "4", label: "한국사능력검정시험" },
    ],
  },
  {
    label: "IT/데이터",
    options: [
      { id: "5", label: "정보처리기사" },
      { id: "6", label: "정보처리산업기사" },
      { id: "7", label: "ADsP" },
      { id: "8", label: "SQLD" },
      { id: "9", label: "빅데이터분석기사" },
    ],
  },
  {
    label: "회계/금융",
    options: [
      { id: "10", label: "전산회계 1급" },
      { id: "11", label: "전산세무 2급" },
      { id: "12", label: "투자자산운용사" },
      { id: "13", label: "AFPK" },
      { id: "14", label: "신용분석사" },
    ],
  },
  {
    label: "어학",
    options: [
      { id: "18", label: "JLPT" },
      { id: "19", label: "HSK" },
    ],
  },
  {
    label: "전문 자격",
    options: [
      { id: "20", label: "공인중개사" },
      { id: "21", label: "감정평가사" },
      { id: "22", label: "세무사" },
      { id: "23", label: "공인회계사" },
      { id: "24", label: "변호사" },
    ],
  },
  {
    label: "기사",
    options: [
      { id: "25", label: "전기기사" },
      { id: "26", label: "산업안전기사" },
      { id: "27", label: "건축기사" },
      { id: "28", label: "토목기사" },
      { id: "29", label: "기계기사" },
    ],
  },
];

type UploadStatus = "idle" | "selected" | "uploading" | "completed" | "failed";

type CertificateSubmissionResponse = {
  submissionId: number;
  filename: string;
  contentType: string;
  extractedText: string;
  lines: string[];
  lineCount: number;
  verificationStatus: string;
  failureReason: string | null;
  submittedAt: string;
};

const NO_TEXT_DETECTED_MESSAGE =
  "자격증 내용을 확인할 수 없습니다. 자격증 전체가 잘 보이는 이미지 또는 PDF를 업로드해 주세요.";

const failureReasonMessages: Record<string, string> = {
  CERTIFICATE_NAME_MISMATCH:
    "선택한 자격증 종류와 업로드한 문서가 일치하지 않습니다.",
  ISSUER_NAME_MISMATCH:
    "발급기관 정보를 확인할 수 없습니다. 문서 원본을 다시 확인해 주세요.",
  NAME_MISMATCH: "회원 정보의 이름과 문서의 이름이 일치하지 않습니다.",
  PASS_KEYWORD_NOT_FOUND:
    "합격 또는 취득을 확인할 수 있는 문구를 찾지 못했습니다.",
  INVALID_DOCUMENT_TYPE: "자격증 인증용 문서로 확인되지 않았습니다.",
  OCR_TEXT_NOT_DETECTED: NO_TEXT_DETECTED_MESSAGE,
};

export default function MyPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] =
    useState<CertificateSubmissionResponse | null>(null);
  const [memberId, setMemberId] = useState("");
  const [loanId, setLoanId] = useState("");
  const [certificateId, setCertificateId] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      setUploadStatus("idle");
      setUploadError(null);
      setOcrResult(null);
      return;
    }

    setSelectedFile(file);
    setUploadStatus("selected");
    setUploadError(null);
    setOcrResult(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    if (!memberId || !loanId || !certificateId) {
      setUploadStatus("failed");
      setUploadError("회원 ID, 대출 ID, 자격증 종류를 모두 입력해 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("memberId", memberId);
    formData.append("loanId", loanId);
    formData.append("certificateId", certificateId);
    formData.append("file", selectedFile);

    setUploadStatus("uploading");
    setUploadError(null);

    try {
      const response = await fetch(`${API_BASE}/api/certificates/submissions`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        const message = errorBody?.message ?? "자격증 업로드에 실패했습니다.";
        throw new Error(
          message.includes("No text detected from image")
            ? NO_TEXT_DETECTED_MESSAGE
            : message,
        );
      }

      const result =
        (await response.json()) as CertificateSubmissionResponse;
      setOcrResult(result);

      if (
        result.verificationStatus === "VERIFICATION_FAILED" &&
        result.failureReason
      ) {
        setUploadStatus("failed");
        setUploadError(
          failureReasonMessages[result.failureReason] ??
            "자격증 인증에 실패했습니다. 업로드한 문서를 다시 확인해 주세요.",
        );
        return;
      }

      setUploadStatus("completed");
    } catch (error) {
      setUploadStatus("failed");
      setUploadError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
      );
      setOcrResult(null);
    }
  };

  const statusText: Record<UploadStatus, string> = {
    idle: "자격증 종류를 선택하고 파일을 업로드해 주세요.",
    selected: `선택된 파일: ${selectedFile?.name ?? ""}`,
    uploading: "OCR 요청을 전송하고 있습니다.",
    completed: "OCR 업로드가 완료되었습니다. 인증 결과를 확인해 주세요.",
    failed: uploadError ?? "업로드 중 오류가 발생했습니다.",
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full border-2 border-white/30 bg-white/20 p-3 shadow-lg backdrop-blur-md">
              <User className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#1F2937] drop-shadow-lg">
              마이페이지
            </h1>
          </div>
          <p className="ml-16 text-xl text-[#475569] drop-shadow-lg">
            자격증 인증과 대출 이용 현황을 한 화면에서 확인할 수 있습니다.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-3xl border-2 border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-lg">
            <div className="mb-8 flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#1F2937]">
                    내 금융 현황
                  </h2>
                  <span className="rounded-full bg-[#B7C9FF] px-4 py-1 text-sm font-semibold text-[#1F2937] shadow-md">
                    자격증 인증 가능
                  </span>
                </div>

                <div className="mb-6">
                  <div className="mb-2 text-5xl font-bold text-[#4A67E8]">
                    NUDGE CARE
                  </div>
                  <p className="text-base text-[#475569]">
                    자격증 인증 결과를 바탕으로 자기개발 대출 이용 여부를
                    확인할 수 있습니다.
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-sm text-[#64748B]">보유 계좌</p>
                    <p className="text-2xl font-bold text-[#1F2937]">2개</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[#64748B]">이용 중 대출</p>
                    <p className="text-2xl font-bold text-[#1F2937]">1건</p>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-[#64748B]">인증 상태</p>
                    <p className="text-2xl font-bold text-[#1F2937]">심사 중</p>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-white px-4 py-2 text-sm text-[#334155] shadow-sm">
                    계좌 조회
                  </span>
                  <span className="rounded-lg bg-white px-4 py-2 text-sm text-[#334155] shadow-sm">
                    대출 현황
                  </span>
                  <span className="rounded-lg bg-white px-4 py-2 text-sm text-[#334155] shadow-sm">
                    자격증 인증
                  </span>
                </div>
              </div>

              <div className="relative hidden h-64 w-64 flex-shrink-0 items-center justify-center md:flex">
                <div className="absolute h-32 w-48 rounded-[40%_60%_70%_30%/60%_30%_70%_40%] bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 opacity-80 shadow-2xl blur-sm"></div>
                <div className="absolute h-28 w-40 rounded-[60%_40%_30%_70%/40%_70%_30%_60%] bg-gradient-to-br from-blue-300 via-blue-400 to-blue-600 shadow-xl"></div>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 rounded-xl bg-white py-4 text-center font-bold text-[#1F2937] shadow-sm transition-all hover:bg-white/90">
                내 정보 보기
              </button>
              <button className="flex-1 rounded-xl bg-[#B7C9FF] py-4 font-bold text-[#1F2937] shadow-md transition-all hover:bg-[#a7bcff]">
                자격증 인증 시작
              </button>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border-2 border-white/40 bg-white/60 p-6 shadow-2xl backdrop-blur-lg">
              <h3 className="mb-4 text-xl font-bold text-[#1F2937]">
                대출 현황
              </h3>
              <div className="mb-4 text-3xl font-bold text-[#4A67E8]">
                심사 진행 중
              </div>
              <div className="mb-6 space-y-2 text-[#475569]">
                <p>자기개발 대출 신청 1건</p>
                <p>예상 한도 1,200만원</p>
                <p>다음 확인일 2026.04.25</p>
              </div>
              <button className="block w-full rounded-xl bg-white py-3 text-center font-bold text-[#1F2937] shadow-sm transition-all hover:bg-white/90">
                상세 보기
              </button>
            </section>

            <section className="rounded-3xl border-2 border-white/40 bg-white/60 p-6 shadow-2xl backdrop-blur-lg">
              <h3 className="mb-4 text-xl font-bold text-[#1F2937]">
                자격증 인증 상태
              </h3>
              <div className="mb-4 text-3xl font-bold text-[#4A67E8]">
                서류 업로드 대기
              </div>
              <div className="mb-6 space-y-2 text-[#475569]">
                <p>자격증 파일을 올리면 OCR 인증이 시작됩니다.</p>
                <p>인증 완료 후 결과를 마이페이지에서 확인할 수 있습니다.</p>
              </div>
              <button className="block w-full rounded-xl bg-white py-3 text-center font-bold text-[#1F2937] shadow-sm transition-all hover:bg-white/90">
                인증하러 가기
              </button>
            </section>
          </div>
        </div>

        <section className="mb-8 rounded-3xl border-2 border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-lg">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-6">
                <p className="mb-2 text-sm text-[#64748B]">자격증 인증</p>
                <h2 className="text-2xl font-bold text-[#1F2937]">
                  자격증 종류를 선택하고 파일을 업로드해 주세요
                </h2>
                <p className="mt-3 leading-7 text-[#64748B]">
                  자격증 종류를 먼저 선택한 뒤 이미지 또는 PDF를 업로드하면 OCR
                  추출과 자격증 검증을 진행합니다.
                </p>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <input
                  type="number"
                  min="1"
                  value={memberId}
                  onChange={(event) => setMemberId(event.target.value)}
                  placeholder="회원 ID"
                  className="rounded-xl border border-[#D7DEEA] bg-white px-4 py-3 text-sm text-[#1F2937] shadow-sm focus:border-[#94A3B8] focus:outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={loanId}
                  onChange={(event) => setLoanId(event.target.value)}
                  placeholder="대출 ID"
                  className="rounded-xl border border-[#D7DEEA] bg-white px-4 py-3 text-sm text-[#1F2937] shadow-sm focus:border-[#94A3B8] focus:outline-none"
                />
                <div className="rounded-xl border border-[#D7DEEA] bg-white px-4 py-2 shadow-sm">
                  <p className="mb-1 text-xs font-medium text-[#64748B]">
                    자격증 종류
                  </p>
                  <select
                    value={certificateId}
                    onChange={(event) => setCertificateId(event.target.value)}
                    className="w-full bg-transparent py-1 text-sm text-[#1F2937] focus:outline-none"
                  >
                    <option value="">자격증 종류 선택</option>
                    {certificateGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((certificate) => (
                          <option key={certificate.id} value={certificate.id}>
                            {certificate.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-[#E2E8F0] bg-white/80 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-[#334155]">
                    지원 자격증 안내
                  </p>
                  <span className="rounded-full bg-[#E0E8FF] px-3 py-1 text-xs font-semibold text-[#3653d6]">
                    총 26종
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[#475569]">
                  {certificateGroups.map((group) => (
                    <span
                      key={group.label}
                      className="rounded-full border border-[#D7DEEA] bg-[#F8FAFF] px-3 py-1"
                    >
                      {group.label}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#64748B]">
                  점수형 어학 시험은 제외되며, 합격 또는 급수형 시험만 선택할 수
                  있습니다.
                </p>
              </div>

              <div className="rounded-3xl border-2 border-dashed border-[#B7C9FF] bg-[#F8FAFF] p-8">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E0E8FF]">
                  <Upload className="h-7 w-7 text-[#4A67E8]" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#1F2937]">
                  자격증 파일 업로드
                </h3>
                <p className="mb-6 text-[#64748B]">
                  JPG, PNG, PDF 형식의 자격증 파일을 업로드해 주세요.
                </p>

                <div className="mb-6 rounded-2xl border border-[#E2E8F0] bg-white px-5 py-4 shadow-sm">
                  <p className="text-sm font-medium text-[#334155]">
                    {selectedFile ? selectedFile.name : "선택된 파일이 없습니다."}
                  </p>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {selectedFile
                      ? `${Math.ceil(selectedFile.size / 1024)}KB`
                      : "파일을 선택하면 이 영역에 파일명이 표시됩니다."}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="sm:flex-1 rounded-xl bg-[#B7C9FF] py-4 font-bold text-[#1F2937] shadow-md transition-all hover:bg-[#a7bcff]"
                  >
                    파일 선택
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadStatus === "uploading"}
                    className="sm:flex-1 rounded-xl bg-white py-4 font-bold text-[#1F2937] shadow-sm transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadStatus === "uploading"
                      ? "업로드 중..."
                      : "업로드 시작"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-lg">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E0E8FF]">
                    <FileSearch className="h-5 w-5 text-[#4A67E8]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">OCR 진행 상태</p>
                    <h3 className="text-lg font-bold text-[#1F2937]">
                      업로드 현황
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#64748B]">{statusText[uploadStatus]}</p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-lg">
                <p className="mb-3 text-sm text-[#64748B]">인증 단계</p>
                <div className="space-y-3">
                  {ocrSteps.map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E0E8FF] text-sm font-semibold text-[#4A67E8]">
                        {index + 1}
                      </div>
                      <p className="text-sm font-medium text-[#334155]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-lg">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F8EE]">
                    <BadgeCheck className="h-5 w-5 text-[#16A34A]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">인증 결과</p>
                    <h3 className="text-lg font-bold text-[#1F2937]">
                      자기개발 대출 검증
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-[#64748B]">
                  인증 완료 후 자격증 기준과 제출 문서를 비교한 결과를
                  보여줍니다.
                </p>
              </div>

              {uploadStatus === "failed" && uploadError && (
                <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-5 shadow-lg">
                  <p className="mb-2 text-sm text-[#B91C1C]">업로드 오류</p>
                  <p className="text-sm text-[#7F1D1D]">{uploadError}</p>
                </div>
              )}

              {uploadStatus === "completed" && (
                <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-lg">
                  <p className="mb-2 text-sm text-[#64748B]">업로드 결과</p>
                  <h3 className="mb-2 text-lg font-bold text-[#1F2937]">
                    OCR 연동 완료
                  </h3>
                  <div className="space-y-3 text-sm text-[#475569]">
                    <p>
                      인증 상태:{" "}
                      <span className="font-semibold text-[#1F2937]">
                        {ocrResult?.verificationStatus ?? "-"}
                      </span>
                    </p>
                    <p>
                      추출 라인 수:{" "}
                      <span className="font-semibold text-[#1F2937]">
                        {ocrResult?.lineCount ?? 0}
                      </span>
                    </p>
                    <p className="font-medium text-[#334155]">
                      OCR 추출 결과
                    </p>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-[#334155]">
                      {ocrResult?.lines?.length ? (
                        <div className="space-y-2">
                          {ocrResult.lines.map((line, index) => (
                            <p key={`${line}-${index}`}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p>추출된 텍스트가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border-2 border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-lg">
          <div className="mb-6">
            <p className="mb-2 text-sm text-[#64748B]">빠른 메뉴</p>
            <h2 className="text-2xl font-bold text-[#1F2937]">
              자주 찾는 서비스
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {quickMenus.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-lg transition-all hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E0E8FF]">
                  <Icon className="h-6 w-6 text-[#4A67E8]" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[#1F2937]">
                  {title}
                </h3>
                <p className="text-sm leading-6 text-[#64748B]">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
