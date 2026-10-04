import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Đã có lỗi nhỏ xảy ra khi tải trang
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Ứng dụng gặp sự cố không mong muốn. Bạn hãy nhấn tải lại trang để tiếp tục nhé!
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tải lại ứng dụng</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all"
              >
                Xóa cache & Tải lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
