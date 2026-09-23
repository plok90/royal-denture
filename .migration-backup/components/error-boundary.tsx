"use client"

import { Component, ReactNode } from "react"

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#0d0502] text-right"
        style={{ fontFamily: "'Georgia', serif", direction: "rtl" }}
      >
        <div className="text-center max-w-md px-6">
          <p className="text-[#c9a84c] text-5xl mb-4">!</p>
          <h1 className="text-[#f5efe6] text-xl font-serif mb-3">عذراً، حدث خطأ غير متوقع</h1>
          <p className="text-[#8a7060] text-sm mb-6">يرجى إعادة تحميل الصفحة أو المحاولة لاحقاً</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-[#c9a84c] text-[#1a0a05] rounded-lg text-sm font-semibold hover:bg-[#d4b55a] transition-colors"
          >
            إعادة التحميل
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-6 text-[#c0392b] text-xs text-left overflow-auto max-h-48 p-4 bg-[#1a0a05] rounded-lg border border-[#3a1f10]">
              {this.state.error.message}
              {"\n"}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
