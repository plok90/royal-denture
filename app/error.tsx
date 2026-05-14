"use client"

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#0d0502] text-right"
      style={{ fontFamily: "'Georgia', serif", direction: "rtl" }}
    >
      <div className="text-center max-w-md px-6">
        <p className="text-[#c9a84c] text-5xl mb-4">!</p>
        <h1 className="text-[#f5efe6] text-xl font-serif mb-3">عذراً، حدث خطأ غير متوقع</h1>
        <p className="text-[#8a7060] text-sm mb-6">يرجى إعادة تحميل الصفحة أو المحاولة لاحقاً</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-[#c9a84c] text-[#1a0a05] rounded-lg text-sm font-semibold hover:bg-[#d4b55a] transition-colors"
          >
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-transparent border border-[#3a1f10] text-[#8a7060] rounded-lg text-sm hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
          >
            إعادة التحميل
          </button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <pre className="mt-6 text-[#c0392b] text-xs text-left overflow-auto max-h-48 p-4 bg-[#1a0a05] rounded-lg border border-[#3a1f10]">
            {error.message}{"\n"}{error.stack}
          </pre>
        )}
      </div>
    </div>
  )
}
