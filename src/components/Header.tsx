import React from 'react';
import {
  BookOpen,
  BrainCircuit,
  Layers,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'quiz' | 'wordforms' | 'flashcard' | 'table';
  setActiveTab: (tab: 'quiz' | 'wordforms' | 'flashcard' | 'table') => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  bookmarkCount: number;
  totalVocabCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  setSoundEnabled,
  totalVocabCount,
}) => {
  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-2">
            {/* Logo & Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
                <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                    <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>Lớp 12</span>
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {totalVocabCount} từ
                  </span>
                </div>
                <h1 className="text-sm sm:text-lg font-black text-slate-900 truncate tracking-tight">
                  Unit 1: Life Story We Admire
                </h1>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 text-xs sm:text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-white text-indigo-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Award className="w-4 h-4 text-indigo-500" />
                <span>Trắc nghiệm</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wordforms')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'wordforms'
                    ? 'bg-white text-indigo-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Dạng từ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('flashcard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                  activeTab === 'flashcard'
                    ? 'bg-white text-indigo-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Flashcard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
                  activeTab === 'table'
                    ? 'bg-white text-indigo-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Từ điển</span>
              </button>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                className="p-2 sm:p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Visible only on mobile devices) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'quiz'
              ? 'text-indigo-600 font-extrabold bg-indigo-50/80'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Award className={`w-5 h-5 mb-0.5 ${activeTab === 'quiz' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="text-[11px] leading-tight">Trắc nghiệm</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wordforms')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'wordforms'
              ? 'text-amber-600 font-extrabold bg-amber-50/80'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Sparkles className={`w-5 h-5 mb-0.5 ${activeTab === 'wordforms' ? 'text-amber-500' : 'text-slate-400'}`} />
          <span className="text-[11px] leading-tight">Dạng từ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('flashcard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'flashcard'
              ? 'text-emerald-600 font-extrabold bg-emerald-50/80'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Layers className={`w-5 h-5 mb-0.5 ${activeTab === 'flashcard' ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="text-[11px] leading-tight">Flashcard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('table')}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all ${
            activeTab === 'table'
              ? 'text-indigo-600 font-extrabold bg-indigo-50/80'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-0.5 ${activeTab === 'table' ? 'text-indigo-600' : 'text-slate-400'}`} />
          <span className="text-[11px] leading-tight">Từ điển</span>
        </button>
      </nav>
    </>
  );
};
