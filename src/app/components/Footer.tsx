export default function Footer() {
  return (
    <footer className="bg-zinc-950 backdrop-blur-md border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
          <div>
            <h3 className="font-bold text-lg mb-3 text-white">NUDGEBANK</h3>
            <p className="text-sm text-white/75">고객과 함께 성장하는 은행</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white">고객센터</h4>
            <p className="text-sm text-white/75">1588-0000</p>
            <p className="text-sm text-white/60">평일 09:00 - 18:00</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white">빠른 링크</h4>
            <ul className="text-sm text-white/75 space-y-1">
              <li>이용약관</li>
              <li>개인정보처리방침</li>
              <li>전자금융거래약관</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-white">정보</h4>
            <p className="text-sm text-white/75">대표이사: 넛지</p>
            <p className="text-sm text-white/60">
              사업자등록번호: 123-45-67890
            </p>
          </div>
        </div>
        <div className="border-t border-white/20 pt-6 text-center text-sm text-white/50">
          © 2026 NUDGEBANK. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
