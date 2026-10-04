import React, { useState, useMemo } from 'react';
import {
  VocabItem,
  VOCABULARY_LIST,
  ALL_FULL_VOCABULARY,
  SECTIONS,
  SectionId,
} from '../data/vocabulary';
import { speakWord } from '../utils/soundEffects';
import {
  Search,
  Volume2,
  Bookmark,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Filter,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface VocabTableViewProps {
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  isBookmarked: (id: string) => void;
}

export const VocabTableView: React.FC<VocabTableViewProps> = ({
  bookmarks,
  toggleBookmark,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<SectionId>('ALL');
  const [includeSubWords, setIncludeSubWords] = useState<boolean>(true);
  const [onlyStarred, setOnlyStarred] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    const source = includeSubWords ? ALL_FULL_VOCABULARY : VOCABULARY_LIST;
    return source.filter((item) => {
      // Section check
      if (selectedSection !== 'ALL' && item.section !== selectedSection) {
        return false;
      }
      // Starred check
      if (onlyStarred && !bookmarks.includes(item.id)) {
        return false;
      }
      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesWord = item.word.toLowerCase().includes(q);
        const matchesMeaning = item.meaning.toLowerCase().includes(q);
        const matchesRoot = item.rootWord ? item.rootWord.toLowerCase().includes(q) : false;
        const matchesRelated = item.relatedWords?.some(
          (r) => r.word.toLowerCase().includes(q) || r.meaning.toLowerCase().includes(q)
        );
        return matchesWord || matchesMeaning || matchesRoot || matchesRelated;
      }
      return true;
    });
  }, [searchQuery, selectedSection, onlyStarred, bookmarks, includeSubWords]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Header & Search */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
              <BookOpen className="w-3.5 h-3.5" /> Bảng tra cứu từ vựng chuẩn
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Toàn bộ từ vựng Unit 1: Life Story We Admire
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Đầy đủ 8 phần từ trang 1 đến trang 5 với phiên âm IPA, loại từ, từ liên quan và ví dụ.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl self-start sm:self-auto shrink-0">
            Hiển thị <span className="text-indigo-600 font-black">{filteredList.length}</span> / {VOCABULARY_LIST.length} từ
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt (vd: admire, cống hiến, surgeon)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIncludeSubWords(!includeSubWords)}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all shrink-0 ${
                includeSubWords
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Xem cả các từ phụ và dạng từ (resistance, surgery...)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gộp cả từ phụ ({filteredList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all shrink-0 ${
                onlyStarred
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${onlyStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>Đã gắn sao ({bookmarks.length})</span>
            </button>
          </div>
        </div>

        {/* Section Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-4 pt-2 border-t border-slate-100 scrollbar-none">
          {SECTIONS.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSection === sec.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {sec.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Vocab Table / List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            Không tìm thấy từ vựng nào khớp với từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((item, index) => {
              const isStarred = bookmarks.includes(item.id);
              const isExpanded = expandedId === item.id;

              return (
                <div key={item.id} className="transition-colors hover:bg-slate-50/70">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    {/* Left: Index, Word, IPA, POS */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-slate-700 w-6 shrink-0 mt-0.5 sm:mt-0">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base sm:text-lg font-bold text-slate-900">
                            {item.word}
                          </span>
                          {item.isSubWord && item.rootWord && (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                              Dạng từ của "{item.rootWord}"
                            </span>
                          )}
                          <span className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {item.pos} {item.ipa}
                          </span>
                          <span className="hidden md:inline-block text-[10px] uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {item.sectionTitle}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 mt-1 leading-snug">
                          {item.meaning}
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => speakWord(item.word)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBookmark(item.id)}
                        className={`p-2 rounded-xl transition-colors ${
                          isStarred
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                        }`}
                        title={isStarred ? 'Bỏ sao' : 'Gắn sao từ khó'}
                      >
                        <Bookmark className={`w-4 h-4 ${isStarred ? 'fill-amber-500' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 bg-slate-50/50 border-t border-slate-100 text-xs sm:text-sm animate-fadeIn">
                      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-3">
                        {item.grammarNote && (
                          <div className="flex items-center gap-2 text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 font-medium">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>Cấu trúc ngữ pháp:</strong> {item.grammarNote}
                            </span>
                          </div>
                        )}

                        {item.collocations && item.collocations.length > 0 && (
                          <div className="text-slate-700">
                            <span className="font-bold text-slate-900">Cụm từ cố định (Collocations):</span>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-600">
                              {item.collocations.map((col, ci) => (
                                <li key={ci}>{col}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.relatedWords && item.relatedWords.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-900">Họ từ vựng (Word Family):</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                              {item.relatedWords.map((rw, ri) => (
                                <div
                                  key={ri}
                                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                                >
                                  <div>
                                    <span className="font-bold text-indigo-900">{rw.word}</span>{' '}
                                    <span className="text-xs text-slate-500 font-mono">
                                      {rw.pos} {rw.ipa || ''}
                                    </span>
                                    <p className="text-xs text-slate-600 mt-0.5">{rw.meaning}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => speakWord(rw.word)}
                                    className="p-1 text-indigo-600 hover:bg-white rounded"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.example && (
                          <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                            <span className="font-bold text-indigo-900 block mb-1">Ví dụ minh họa:</span>
                            <p className="italic text-slate-800 font-medium">"{item.example}"</p>
                            {item.exampleMeaning && (
                              <p className="text-slate-600 text-xs mt-1">➔ {item.exampleMeaning}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
