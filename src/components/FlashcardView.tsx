import React, { useState, useEffect } from 'react';
import {
  VocabItem,
  VOCABULARY_LIST,
  ALL_FULL_VOCABULARY,
  SECTIONS,
  SectionId,
} from '../data/vocabulary';
import { playSound, speakWord } from '../utils/soundEffects';
import {
  Volume2,
  Bookmark,
  RotateCw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface FlashcardViewProps {
  soundEnabled: boolean;
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  isBookmarked?: (id: string) => boolean;
  initialDeckMode?: 'VOCAB' | 'WORD_FORMS';
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  soundEnabled,
  bookmarks,
  toggleBookmark,
}) => {
  const [selectedSection, setSelectedSection] = useState<SectionId>('ALL');
  const [includeSubWords, setIncludeSubWords] = useState<boolean>(true);
  const [onlyStarred, setOnlyStarred] = useState<boolean>(false);
  const [cardDeck, setCardDeck] = useState<VocabItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  // Build unified deck
  useEffect(() => {
    let pool = includeSubWords ? ALL_FULL_VOCABULARY : VOCABULARY_LIST;

    if (selectedSection !== 'ALL') {
      pool = pool.filter((v) => v.section === selectedSection);
    }
    if (onlyStarred) {
      pool = pool.filter((v) => bookmarks.includes(v.id));
    }

    setCardDeck(pool);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedSection, includeSubWords, onlyStarred, bookmarks]);

  const currentCard = cardDeck[currentIndex];
  const isStarred = currentCard ? bookmarks.includes(currentCard.id) : false;
  const isMastered = currentCard ? masteredIds.includes(currentCard.id) : false;

  const handleNext = () => {
    if (currentIndex < cardDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      if (soundEnabled) playSound('click');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      if (soundEnabled) playSound('click');
    }
  };

  const handleShuffle = () => {
    setCardDeck((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    if (soundEnabled) playSound('click');
  };

  const handleToggleMastered = () => {
    if (!currentCard) return;
    if (isMastered) {
      setMasteredIds((prev) => prev.filter((id) => id !== currentCard.id));
    } else {
      setMasteredIds((prev) => [...prev, currentCard.id]);
      if (soundEnabled) playSound('correct');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cardDeck.length, soundEnabled]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      {/* Controls / Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Section Selector */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value as SectionId)}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SECTIONS.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.shortName}
                </option>
              ))}
            </select>

            {/* Toggle Include Sub-words / Word Forms */}
            <button
              type="button"
              onClick={() => setIncludeSubWords(!includeSubWords)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                includeSubWords
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Gộp chung cả từ phụ và dạng từ (resistance, admirable, surgeon...)"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gộp cả từ phụ & dạng từ</span>
            </button>

            {/* Starred filter */}
            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                onlyStarred
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>Đã gắn sao ({bookmarks.length})</span>
            </button>

            {/* Shuffle */}
            <button
              type="button"
              onClick={handleShuffle}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Xáo trộn thứ tự thẻ"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 self-end sm:self-auto">
            <span>
              Đã thuộc: <strong className="text-emerald-600">{masteredIds.length}</strong> / {cardDeck.length} thẻ
            </span>
          </div>
        </div>
      </div>

      {cardDeck.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200">
          <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 mb-1">Không có từ vựng nào khớp bộ lọc</h3>
          <p className="text-sm text-slate-700">
            Hãy đổi phần bài học hoặc bỏ chọn mục "Đã gắn sao".
          </p>
        </div>
      ) : (
        <>
          {/* Card Indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-3 px-2">
            <span>
              Thẻ {currentIndex + 1} / {cardDeck.length}
            </span>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-mono">
              {currentCard.sectionTitle}
            </span>
          </div>

          {/* Interactive Flip Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[380px] sm:min-h-[420px] bg-white rounded-3xl p-6 sm:p-10 shadow-md border border-slate-200/90 relative cursor-pointer flex flex-col justify-between select-none transition-all duration-300 hover:shadow-lg hover:border-indigo-300"
          >
            {/* Top Toolbar */}
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => speakWord(currentCard.word)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe phát âm</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleBookmark(currentCard.id)}
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
                  onClick={handleToggleMastered}
                  className={`p-2 rounded-xl transition-colors ${
                    isMastered
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                  }`}
                  title={isMastered ? 'Đã thuộc' : 'Đánh dấu đã thuộc'}
                >
                  <CheckCircle2
                    className={`w-4 h-4 ${isMastered ? 'fill-emerald-600 text-white' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Middle Content */}
            <div className="my-auto text-center py-6">
              {!isFlipped ? (
                // FRONT SIDE (English Word)
                <div className="animate-fadeIn">
                  {currentCard.isSubWord ? (
                    <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-extrabold text-amber-800 bg-amber-100/90 px-3 py-1 rounded-full mb-3 border border-amber-300/50">
                      <Sparkles className="w-3 h-3 text-amber-600" /> Dạng từ / Từ phụ (gốc: {currentCard.rootWord})
                    </span>
                  ) : (
                    <span className="inline-block text-xs uppercase tracking-wider font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-3">
                      Tiếng Anh
                    </span>
                  )}

                  <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    {currentCard.word}
                  </h2>

                  <div className="mt-3 flex items-center justify-center gap-2 text-base sm:text-lg font-mono text-indigo-600">
                    <span className="font-semibold text-slate-500">{currentCard.pos}</span>
                    <span>{currentCard.ipa}</span>
                  </div>

                  {currentCard.grammarNote && (
                    <div className="mt-4 inline-block text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60">
                      {currentCard.grammarNote}
                    </div>
                  )}

                  {currentCard.relatedWords && currentCard.relatedWords.length > 0 && (
                    <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-amber-800 font-semibold bg-amber-50/80 px-3 py-1 rounded-full border border-amber-200/60">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Có {currentCard.relatedWords.length} dạng từ liên quan (Lật thẻ để xem)</span>
                    </div>
                  )}
                </div>
              ) : (
                // BACK SIDE (Vietnamese Meaning & Context + Rich Word Forms)
                <div className="animate-fadeIn text-left sm:text-center max-w-xl mx-auto">
                  <span className="inline-block text-xs uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full mb-3">
                    Ý nghĩa Tiếng Việt
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                    {currentCard.meaning}
                  </h3>

                  {currentCard.example && (
                    <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
                      <p className="text-xs sm:text-sm text-slate-800 font-medium italic">
                        "{currentCard.example}"
                      </p>
                      {currentCard.exampleMeaning && (
                        <p className="text-xs text-slate-500 mt-1">
                          ➔ {currentCard.exampleMeaning}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Prominent Word Family / Related Words Block */}
                  {currentCard.relatedWords && currentCard.relatedWords.length > 0 && (
                    <div
                      className="mt-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Họ từ vựng liên quan (Word Family):</span>
                        </div>
                        <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full font-bold">
                          {currentCard.relatedWords.length} biến thể
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentCard.relatedWords.map((rw, rwi) => (
                          <div
                            key={rwi}
                            className="p-2.5 rounded-xl bg-white border border-amber-200/60 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {rw.word}
                                </span>
                                <span className="font-bold text-[10px] uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                  {rw.pos}
                                </span>
                              </div>
                              {rw.ipa && (
                                <span className="text-[11px] font-mono text-slate-500 block">
                                  {rw.ipa}
                                </span>
                              )}
                              <p className="text-[11px] text-slate-700 mt-0.5">{rw.meaning}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakWord(rw.word);
                              }}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg shrink-0 transition-colors"
                              title={`Phát âm ${rw.word}`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Flip Hint */}
            <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 pt-3 border-t border-slate-100">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Chạm thẻ để lật mặt ({isFlipped ? 'Mặt sau ➔ Mặt trước' : 'Mặt trước ➔ Mặt sau'})</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 mt-6">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Thẻ trước</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all"
            >
              Lật thẻ (Space)
            </button>

            <button
              type="button"
              disabled={currentIndex === cardDeck.length - 1}
              onClick={handleNext}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span>Thẻ tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
