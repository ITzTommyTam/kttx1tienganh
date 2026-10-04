import React, { useState, useMemo } from 'react';
import { WORD_FAMILIES, WordFamily } from '../data/wordForms';
import { speakWord } from '../utils/soundEffects';
import {
  Sparkles,
  Search,
  Volume2,
  BookOpen,
  ArrowRight,
  Flame,
  CheckCircle2,
  ChevronRight,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface WordFormsViewProps {
  onStartWordFormQuiz: () => void;
  onOpenWordFormFlashcards?: () => void;
}

export const WordFormsView: React.FC<WordFormsViewProps> = ({
  onStartWordFormQuiz,
  onOpenWordFormFlashcards,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSection, setActiveSection] = useState<string>('ALL');

  const filteredFamilies = useMemo(() => {
    return WORD_FAMILIES.filter((wf) => {
      if (activeSection !== 'ALL' && wf.section !== activeSection) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          wf.root.toLowerCase().includes(q) ||
          wf.meaning.toLowerCase().includes(q) ||
          (wf.verb && wf.verb.toLowerCase().includes(q)) ||
          (wf.noun && wf.noun.toLowerCase().includes(q)) ||
          (wf.nounPerson && wf.nounPerson.toLowerCase().includes(q)) ||
          (wf.adj && wf.adj.toLowerCase().includes(q)) ||
          (wf.adv && wf.adv.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [searchQuery, activeSection]);

  const uniqueSections = useMemo(() => {
    const s = new Set<string>();
    WORD_FAMILIES.forEach((wf) => s.add(wf.section));
    return ['ALL', ...Array.from(s)];
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Chuyên đề trọng tâm thi học kỳ & THPT
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Họ Từ Vựng (Word Forms & Word Families)
          </h2>
          <p className="text-indigo-200 text-xs sm:text-base leading-relaxed mb-6">
            Bảng quy đổi và bài tập trắc nghiệm chuyên sâu về các dạng từ: <strong>Động từ (Verb) ➔ Danh từ (Noun) ➔ Tính từ (Adjective) ➔ Trạng từ (Adverb)</strong>. Ví dụ: <em>resist ➔ resistance (n), resistant (adj)</em>; <em>admire ➔ admiration (n), admirable (adj)</em>.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onStartWordFormQuiz}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>Trả bài trắc nghiệm Dạng từ</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenWordFormFlashcards && (
              <button
                type="button"
                onClick={onOpenWordFormFlashcards}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-xs active:scale-95 transition-all"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Học Flashcard Dạng từ (43 thẻ)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo từ gốc (vd: resist, admire) hoặc nghĩa (kháng cự, cống hiến)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
            Có <span className="text-indigo-600 font-black">{filteredFamilies.length}</span> họ từ vựng
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {uniqueSections.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeSection === sec
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {sec === 'ALL' ? 'Tất cả các phần' : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Word Family Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFamilies.map((wf) => (
          <div
            key={wf.id}
            className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/90 hover:border-indigo-300 transition-all"
          >
            {/* Top Root & Meaning */}
            <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                  {wf.section}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span>{wf.root}</span>
                  <button
                    type="button"
                    onClick={() => speakWord(wf.root)}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  Nghĩa: {wf.meaning}
                </p>
              </div>
            </div>

            {/* Matrix of Forms (Verb - Noun - Adj - Adv) */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              {/* Verb */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                  Động từ (Verb)
                </span>
                {wf.verb ? (
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-indigo-950 font-mono text-sm">
                      {wf.verb}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakWord(wf.verb!)}
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 mt-1">-</span>
                )}
              </div>

              {/* Noun */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="font-bold text-emerald-800 uppercase tracking-wide text-[10px]">
                  Danh từ (Noun)
                </span>
                {wf.noun || wf.nounPerson ? (
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      {wf.noun && (
                        <span className="font-extrabold text-emerald-950 font-mono text-sm block">
                          {wf.noun}
                        </span>
                      )}
                      {wf.nounPerson && (
                        <span className="text-[11px] font-bold text-emerald-700 font-mono block">
                          {wf.nounPerson} <span className="text-[10px] text-slate-600">(chỉ người)</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => speakWord(wf.noun || wf.nounPerson!)}
                      className="text-slate-400 hover:text-emerald-600"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 mt-1">-</span>
                )}
              </div>

              {/* Adjective */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="font-bold text-amber-800 uppercase tracking-wide text-[10px]">
                  Tính từ (Adjective)
                </span>
                {wf.adj ? (
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-amber-950 font-mono text-sm">
                      {wf.adj}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakWord(wf.adj!)}
                      className="text-slate-400 hover:text-amber-600"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 mt-1">-</span>
                )}
              </div>

              {/* Adverb */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <span className="font-bold text-purple-800 uppercase tracking-wide text-[10px]">
                  Trạng từ (Adverb)
                </span>
                {wf.adv ? (
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-purple-950 font-mono text-sm">
                      {wf.adv}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakWord(wf.adv!)}
                      className="text-slate-400 hover:text-purple-600"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 mt-1">
                    {wf.adj ? `${wf.adj}ly*` : '-'}
                  </span>
                )}
              </div>
            </div>

            {/* Example sentence for gap fill practice */}
            {wf.exampleSentence && (
              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 text-xs">
                <span className="font-bold text-indigo-900 block mb-0.5">
                  Bài tập điển hình:
                </span>
                <p className="text-slate-700 font-medium italic">
                  "{wf.exampleSentence}"
                </p>
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Điền: <strong className="text-emerald-700">{wf.exampleAnswer}</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
