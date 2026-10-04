import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  VocabItem,
  VOCABULARY_LIST,
  ALL_FULL_VOCABULARY,
  SECTIONS,
  SectionId,
} from '../data/vocabulary';
import {
  QuizQuestion,
  QuestionType,
  generateQuestions,
} from '../utils/quizGenerator';
import {
  PREPOSITION_QUESTIONS,
  QUANTIFIER_QUESTIONS,
  ARTICLE_QUESTIONS,
  IF_UNLESS_QUESTIONS,
  CONDITIONAL_WISH_QUESTIONS,
  SYNONYM_QUESTIONS,
  ALL_GRAMMAR_QUESTIONS,
} from '../data/grammarQuestions';
import { playSound, speakWord } from '../utils/soundEffects';
import {
  CheckCircle2,
  XCircle,
  Volume2,
  Bookmark,
  Sparkles,
  ArrowRight,
  ChevronRight,
  RotateCcw,
  Clock,
  Flame,
  Award,
  BookOpen,
  Play,
  Send,
} from 'lucide-react';

interface QuizViewProps {
  soundEnabled?: boolean;
  bookmarks?: string[];
  toggleBookmark?: (id: string) => void;
  isBookmarked?: (id: string) => boolean;
  mistakes?: string[];
  addMistake?: (id: string) => void;
  removeMistake?: (id: string) => void;
  initialQuestionType?: 'ALL' | QuestionType;
  recordQuizStat?: (stat: any) => void;
}

export function isAnswerMatching(userChoice: string, correctAnswer: string): boolean {
  if (!userChoice) return false;
  const u = userChoice.trim().toLowerCase();
  const c = correctAnswer.trim().toLowerCase();

  if (u === c) return true;

  // Zero article / No article aliases
  const zeroArticleAliases = [
    'ø',
    'ø (no article)',
    'ø (không dùng)',
    'no article',
    'no',
    'x',
    'không dùng',
    '0',
    'none',
    'zero article',
    'zero',
  ];
  if (zeroArticleAliases.includes(c) && zeroArticleAliases.includes(u)) {
    return true;
  }

  // Prefix matching for direct article types
  if ((u === 'a' || u === 'an' || u === 'the') && c.startsWith(u)) {
    return true;
  }

  return false;
}

function parseSentenceBlank(text: string): { before: string; blank: string; after: string } | null {
  const match = text.match(/(.*?)(\b_{2,}\b|_{2,})(.*)/);
  if (!match) return null;
  return {
    before: match[1],
    blank: match[2],
    after: match[3],
  };
}

export const QuizView: React.FC<QuizViewProps> = ({
  soundEnabled = true,
  bookmarks = [],
  toggleBookmark = () => {},
  mistakes = [],
  addMistake = () => {},
  removeMistake = () => {},
  initialQuestionType = 'ALL',
  recordQuizStat = () => {},
}) => {

  // Quiz Configuration State
  const [quizState, setQuizState] = useState<'CONFIG' | 'RUNNING' | 'FINISHED'>('CONFIG');
  const [selectedSection, setSelectedSection] = useState<SectionId>('ALL');
  const [quizMode, setQuizMode] = useState<'PRACTICE' | 'EXAM'>('PRACTICE');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'ALL' | QuestionType>(
    initialQuestionType
  );
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [isFullQuestions, setIsFullQuestions] = useState<boolean>(false);
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [onlyMistakes, setOnlyMistakes] = useState<boolean>(false);
  const [includeSubWords, setIncludeSubWords] = useState<boolean>(true);

  // Active Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);

  // Instant feedback in practice mode
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState<boolean>(false);
  const [typedInput, setTypedInput] = useState<string>('');

  // Timer
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [examTimeLimit, setExamTimeLimit] = useState<number>(0); // in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Result filter
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'WRONG' | 'CORRECT'>('ALL');

  // Filter pool based on settings
  const filteredVocabPool = useMemo(() => {
    let pool = includeSubWords ? ALL_FULL_VOCABULARY : VOCABULARY_LIST;
    if (selectedSection !== 'ALL') {
      pool = pool.filter((v) => v.section === selectedSection);
    }
    if (onlyBookmarks) {
      pool = pool.filter((v) => bookmarks.includes(v.id));
    }
    if (onlyMistakes) {
      pool = pool.filter((v) => mistakes.includes(v.id));
    }
    return pool;
  }, [selectedSection, onlyBookmarks, onlyMistakes, bookmarks, mistakes, includeSubWords]);

  // Helper to get total available questions for current mode
  const getCategoryAvailableCount = (type: 'ALL' | QuestionType): number => {
    switch (type) {
      case 'ARTICLE':
        return ARTICLE_QUESTIONS.length;
      case 'QUANTIFIER':
        return QUANTIFIER_QUESTIONS.length;
      case 'PREPOSITION':
        return PREPOSITION_QUESTIONS.length;
      case 'IF_UNLESS':
        return IF_UNLESS_QUESTIONS.length;
      case 'CONDITIONAL_WISH':
        return CONDITIONAL_WISH_QUESTIONS.length;
      case 'SYNONYM':
        return SYNONYM_QUESTIONS.length;
      default:
        return filteredVocabPool.length;
    }
  };

  const currentAvailableMax = getCategoryAvailableCount(questionTypeFilter);

  // Keep question count synced if Full mode is active or type changes
  useEffect(() => {
    if (isFullQuestions) {
      setQuestionCount(currentAvailableMax);
    } else if (questionCount > currentAvailableMax && currentAvailableMax > 0) {
      setQuestionCount(currentAvailableMax);
    }
  }, [currentAvailableMax, isFullQuestions]);

  // Start Quiz
  const startQuiz = (
    customPool?: VocabItem[],
    customCount?: number,
    customType?: 'ALL' | QuestionType
  ) => {
    const typeToUse = customType || questionTypeFilter;
    const pool = customPool || filteredVocabPool;
    const maxAvailable = getCategoryAvailableCount(typeToUse);

    if (maxAvailable === 0 && pool.length === 0) return;

    let count = customCount || questionCount;
    if (isFullQuestions || count > maxAvailable) {
      count = maxAvailable;
    }
    if (count <= 0) count = Math.min(10, maxAvailable);

    const generated = generateQuestions(pool, count, typeToUse);
    if (generated.length === 0) return;

    setQuestions(generated);
    setCurrentIndex(0);
    setUserAnswers({});
    setStreak(0);
    setMaxStreak(0);
    setSelectedOption(null);
    setHasAnsweredCurrent(false);
    setTypedInput('');
    setTimerSeconds(0);
    setQuizState('RUNNING');

    if (quizMode === 'EXAM') {
      setExamTimeLimit(generated.length * 30);
    }

    if (soundEnabled) {
      playSound('click');
    }

    if (generated[0]?.type === 'LISTENING' && generated[0]?.audioText) {
      setTimeout(() => speakWord(generated[0].audioText!), 400);
    }
  };

  // Timer effect
  useEffect(() => {
    if (quizState === 'RUNNING') {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (quizMode === 'EXAM' && examTimeLimit > 0 && prev >= examTimeLimit) {
            finishQuiz();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizState, quizMode, examTimeLimit]);

  // Answer handler
  const handleSelectOption = (option: string) => {
    if (hasAnsweredCurrent && quizMode === 'PRACTICE') return;

    const currentQ = questions[currentIndex];
    const isCorrect = isAnswerMatching(option, currentQ.correctAnswer);

    if (quizMode === 'PRACTICE') {
      setSelectedOption(option);
      setHasAnsweredCurrent(true);
      setUserAnswers((prev) => ({ ...prev, [currentQ.id]: option }));

      if (isCorrect) {
        if (soundEnabled) playSound(streak + 1 >= 3 ? 'streak' : 'correct');
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        if (nextStreak > maxStreak) setMaxStreak(nextStreak);
        removeMistake(currentQ.targetVocab.id);
      } else {
        if (soundEnabled) playSound('wrong');
        setStreak(0);
        addMistake(currentQ.targetVocab.id);
      }
    } else {
      // Exam mode: record choice
      setUserAnswers((prev) => ({ ...prev, [currentQ.id]: option }));
      setSelectedOption(option);
      if (soundEnabled) playSound('click');
    }
  };

  // Direct text input submit handler
  const handleInputSubmit = (text: string) => {
    if (!text.trim() || (hasAnsweredCurrent && quizMode === 'PRACTICE')) return;
    const currentQ = questions[currentIndex];
    const cleanText = text.trim();

    // Look for exact or matching option
    const matchedOpt = currentQ.options.find((opt) => isAnswerMatching(cleanText, opt));
    if (matchedOpt) {
      handleSelectOption(matchedOpt);
    } else {
      handleSelectOption(cleanText);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextAns = userAnswers[questions[nextIdx]?.id] || null;
      setSelectedOption(nextAns);
      setHasAnsweredCurrent(quizMode === 'PRACTICE' ? !!nextAns : false);
      setTypedInput('');

      if (questions[nextIdx]?.type === 'LISTENING' && questions[nextIdx]?.audioText) {
        setTimeout(() => speakWord(questions[nextIdx].audioText!), 200);
      }
    } else {
      finishQuiz();
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevAns = userAnswers[questions[prevIdx]?.id] || null;
      setSelectedOption(prevAns);
      setHasAnsweredCurrent(quizMode === 'PRACTICE' ? !!prevAns : false);
      setTypedInput('');
    }
  };

  const finishQuiz = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuizState('FINISHED');

    let correct = 0;
    questions.forEach((q) => {
      const ans = userAnswers[q.id];
      if (ans && isAnswerMatching(ans, q.correctAnswer)) {
        correct++;
        removeMistake(q.targetVocab.id);
      } else {
        addMistake(q.targetVocab.id);
      }
    });

    recordQuizStat({
      date: new Date().toLocaleDateString('vi-VN'),
      score: correct,
      total: questions.length,
      mode: quizMode,
    });

    if (soundEnabled) playSound('finish');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Score statistics
  const correctCount = questions.filter(
    (q) => userAnswers[q.id] && isAnswerMatching(userAnswers[q.id], q.correctAnswer)
  ).length;
  const percentageScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const score10Scale = ((percentageScore / 100) * 10).toFixed(1);
  const wrongQuestions = questions.filter(
    (q) => !userAnswers[q.id] || !isAnswerMatching(userAnswers[q.id], q.correctAnswer)
  );

  // -------------------------------------------------------------
  // VIEW: 1. QUIZ CONFIGURATION
  // -------------------------------------------------------------
  if (quizState === 'CONFIG') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/90 relative overflow-hidden">
          {/* Header Title */}
          <div className="mb-6 border-b border-slate-100 pb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Luyện thi & Kiểm tra Trắc nghiệm Toàn diện</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Cấu hình đề kiểm tra Unit 1: Life Story We Admire
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Bao gồm toàn bộ từ vựng, từ phụ, họ từ, giới từ, mạo từ (a/an/the/Ø), lượng từ, câu điều kiện & đồng nghĩa.
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. Chọn phần bài học */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                1. Phạm vi phần bài học (Sections)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                {SECTIONS.map((sec) => {
                  const isSelected = selectedSection === sec.id;
                  const count =
                    sec.id === 'ALL'
                      ? (includeSubWords ? ALL_FULL_VOCABULARY.length : VOCABULARY_LIST.length)
                      : (includeSubWords ? ALL_FULL_VOCABULARY : VOCABULARY_LIST).filter(
                          (v) => v.section === sec.id
                        ).length;

                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setSelectedSection(sec.id);
                        if (soundEnabled) playSound('click');
                      }}
                      className={`text-left p-3 rounded-2xl border transition-all relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold truncate pr-2">
                          {sec.shortName}
                        </span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{sec.page}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Chế độ kiểm tra & Dạng câu hỏi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  2. Hình thức làm bài
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQuizMode('PRACTICE')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      quizMode === 'PRACTICE'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs sm:text-sm text-slate-900">Luyện tập</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Xem ngay đáp án & giải thích sau từng câu
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuizMode('EXAM')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      quizMode === 'EXAM'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-xs sm:text-sm text-slate-900">Thi tính giờ</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      Bấm giờ, trả lời toàn bộ rồi chấm điểm
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Dạng câu hỏi */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  3. Dạng câu hỏi chuyên đề
                </label>
                <select
                  value={questionTypeFilter}
                  onChange={(e) => {
                    const newType = e.target.value as 'ALL' | QuestionType;
                    setQuestionTypeFilter(newType);
                    setIsFullQuestions(false);
                  }}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">🎲 Hỗn hợp toàn diện (Từ vựng, Dạng từ, Ngữ pháp...)</option>

                  <optgroup label="📖 Chuyên đề Ngữ pháp Trọng điểm (Điền ô trống)">
                    <option value="ARTICLE">🅰️ Mạo từ (Điền a / an / the / Ø no article)</option>
                    <option value="QUANTIFIER">⚖️ Lượng từ (Điền many, much, few, little, each, every, all, both, some, any...)</option>
                    <option value="PREPOSITION">🔗 Giới từ trong bài 1 (admire for, devote to, drop out of...)</option>
                    <option value="IF_UNLESS">🔀 Chọn IF / UNLESS (câu điều kiện)</option>
                    <option value="CONDITIONAL_WISH">⏳ Thì trong câu điều kiện (If) & câu ước (Wish)</option>
                  </optgroup>

                  <optgroup label="📚 Từ vựng, Dạng từ & Đồng nghĩa">
                    <option value="SYNONYM">🔄 Từ đồng nghĩa (Synonyms theo Unit 1)</option>
                    <option value="WORD_FORM">✨ Dạng từ (Word Forms: Noun, Adj, Verb, Adv...)</option>
                    <option value="ENG_TO_VIE">🇬🇧 ➔ 🇻🇳 Tiếng Anh sang nghĩa Tiếng Việt</option>
                    <option value="VIE_TO_ENG">🇻🇳 ➔ 🇬🇧 Nghĩa Tiếng Việt sang Tiếng Anh</option>
                    <option value="LISTENING">🎧 Luyện nghe phát âm chọn từ</option>
                    <option value="FILL_IN_BLANK">📝 Điền từ vào ngữ cảnh câu ví dụ</option>
                    <option value="COLLOCATION">💬 Cụm từ cố định & Thành ngữ</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* 4. Số lượng câu & Bộ lọc đặc biệt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-slate-900">
                    4. Số lượng câu hỏi
                  </label>
                  <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                    Tổng kho: {currentAvailableMax} câu
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[10, 15, 20, 30].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setIsFullQuestions(false);
                        setQuestionCount(Math.min(num, currentAvailableMax));
                      }}
                      className={`flex-1 min-w-[50px] py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                        !isFullQuestions && questionCount === num
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setIsFullQuestions(true);
                      setQuestionCount(currentAvailableMax);
                    }}
                    className={`flex-[1.5] min-w-[130px] py-2 px-3 rounded-xl text-xs sm:text-sm font-black border transition-all flex items-center justify-center gap-1.5 ${
                      isFullQuestions
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Toàn bộ (Full: {currentAvailableMax} câu)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  5. Phạm vi từ & Bộ lọc sao
                </label>
                <div className="flex flex-col gap-2 text-xs sm:text-sm">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeSubWords}
                      onChange={(e) => setIncludeSubWords(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1.5 font-bold text-indigo-950 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Bao gồm cả từ phụ & dạng từ (Full kho từ)</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyBookmarks}
                      onChange={(e) => {
                        setOnlyBookmarks(e.target.checked);
                        if (e.target.checked) setOnlyMistakes(false);
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1 font-medium text-slate-800 text-xs">
                      <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span>Chỉ làm từ đã đánh dấu sao ({bookmarks.length} từ)</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyMistakes}
                      onChange={(e) => {
                        setOnlyMistakes(e.target.checked);
                        if (e.target.checked) setOnlyBookmarks(false);
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="flex items-center gap-1 font-medium text-slate-800 text-xs">
                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Chỉ ôn các từ từng làm sai ({mistakes.length} từ)</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Specialized Topics Quick Shortcuts Grid */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-100/80 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Chuyên đề ôn tập nhanh (Nhấn để luyện tập trực tiếp)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Format điền ô trống chuẩn
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter('ARTICLE');
                    setIsFullQuestions(true);
                    startQuiz(undefined, ARTICLE_QUESTIONS.length, 'ARTICLE');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    questionTypeFilter === 'ARTICLE'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white hover:bg-emerald-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    🅰️ Mạo từ
                  </span>
                  <span className="text-[10px] opacity-80 mt-1">điền a / an / the / Ø</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter('QUANTIFIER');
                    setIsFullQuestions(true);
                    startQuiz(undefined, QUANTIFIER_QUESTIONS.length, 'QUANTIFIER');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    questionTypeFilter === 'QUANTIFIER'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-500/20'
                      : 'bg-white hover:bg-purple-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    ⚖️ Lượng từ
                  </span>
                  <span className="text-[10px] opacity-80 mt-1">many, much, few, little...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter('PREPOSITION');
                    setIsFullQuestions(true);
                    startQuiz(undefined, PREPOSITION_QUESTIONS.length, 'PREPOSITION');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    questionTypeFilter === 'PREPOSITION'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    🔗 Giới từ Bài 1
                  </span>
                  <span className="text-[10px] opacity-80 mt-1">admire for, devote to...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter('IF_UNLESS');
                    setIsFullQuestions(true);
                    startQuiz(undefined, IF_UNLESS_QUESTIONS.length, 'IF_UNLESS');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    questionTypeFilter === 'IF_UNLESS'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-500/20'
                      : 'bg-white hover:bg-rose-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    🔀 Chọn If / Unless
                  </span>
                  <span className="text-[10px] opacity-80 mt-1">phân biệt if vs unless</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter('CONDITIONAL_WISH');
                    setIsFullQuestions(true);
                    startQuiz(undefined, CONDITIONAL_WISH_QUESTIONS.length, 'CONDITIONAL_WISH');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    questionTypeFilter === 'CONDITIONAL_WISH'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20'
                      : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    ⏳ Câu If & Wish
                  </span>
                  <span className="text-[10px] opacity-80 mt-1">thì câu điều kiện & ước</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter('SYNONYM');
                    setIsFullQuestions(true);
                    startQuiz(undefined, SYNONYM_QUESTIONS.length, 'SYNONYM');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    questionTypeFilter === 'SYNONYM'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-500/20'
                      : 'bg-white hover:bg-teal-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    🔄 Từ đồng nghĩa
                  </span>
                  <span className="text-[10px] opacity-80 mt-1">synonyms theo Unit 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter('WORD_FORM');
                    startQuiz(undefined, 20, 'WORD_FORM');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    questionTypeFilter === 'WORD_FORM'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white hover:bg-indigo-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    ✨ Dạng từ
                  </span>
                  <span className="text-[10px] opacity-80 mt-1">resist ➔ resistance...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter('ALL');
                    startQuiz(undefined, 20, 'ALL');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    questionTypeFilter === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold flex items-center gap-1">
                    🎲 Toàn bộ hỗn hợp
                  </span>
                  <span className="text-[10px] opacity-80 mt-1">tổng hợp mọi dạng</span>
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              disabled={currentAvailableMax === 0}
              onClick={() => startQuiz()}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Bắt đầu trả bài ngay</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: 2. ACTIVE QUIZ (RUNNING)
  // -------------------------------------------------------------
  if (quizState === 'RUNNING') {
    const currentQ = questions[currentIndex];
    const isCurrentBookmarked = bookmarks.includes(currentQ.targetVocab.id);
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

    // Sentence with blank parsing
    const rawSentence = currentQ.subPrompt || (currentQ.prompt.includes('__') ? currentQ.prompt : '');
    const sentenceParts = rawSentence ? parseSentenceBlank(rawSentence) : null;

    return (
      <div className="max-w-3xl mx-auto px-4 py-4 sm:py-8">
        {/* Progress & Header */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 text-xs sm:text-sm font-semibold">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                Câu {currentIndex + 1} / {questions.length}
              </span>
              <span className="hidden sm:inline font-bold text-xs text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-md border border-indigo-100">
                {currentQ.type === 'PREPOSITION'
                  ? '🔗 Giới từ Unit 1'
                  : currentQ.type === 'QUANTIFIER'
                  ? '⚖️ Lượng từ (Quantifiers)'
                  : currentQ.type === 'ARTICLE'
                  ? '🅰️ Mạo từ (Articles)'
                  : currentQ.type === 'IF_UNLESS'
                  ? '🔀 Chọn If / Unless'
                  : currentQ.type === 'CONDITIONAL_WISH'
                  ? '⏳ Thì Điều kiện & Wish'
                  : currentQ.type === 'SYNONYM'
                  ? '🔄 Từ Đồng nghĩa'
                  : currentQ.targetVocab.sectionTitle}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {streak > 1 && (
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 text-xs font-bold animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  <span>Chuỗi {streak}🔥</span>
                </div>
              )}

              {quizMode === 'EXAM' && (
                <div className="flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formatTime(examTimeLimit - timerSeconds)}</span>
                </div>
              )}

              <button
                onClick={() => setQuizState('CONFIG')}
                className="text-xs font-medium text-slate-700 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100"
              >
                Thoát
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-slate-200/90 relative">
          {/* Top Actions: Category Badge, Audio & Bookmark */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              {currentQ.type === 'ARTICLE' && '🅰️ Điền mạo từ vào ô trống'}
              {currentQ.type === 'QUANTIFIER' && '⚖️ Điền lượng từ vào ô trống'}
              {currentQ.type === 'PREPOSITION' && '🔗 Điền giới từ vào ô trống'}
              {currentQ.type === 'IF_UNLESS' && '🔀 Chọn If hoặc Unless'}
              {currentQ.type === 'CONDITIONAL_WISH' && '⏳ Thì câu điều kiện / ước'}
              {currentQ.type === 'SYNONYM' && '🔄 Chọn từ đồng nghĩa'}
              {currentQ.type === 'WORD_FORM' && '✨ Dạng từ (Word Family)'}
              {currentQ.type === 'ENG_TO_VIE' && '🇬🇧 Anh ➔ 🇻🇳 Việt'}
              {currentQ.type === 'VIE_TO_ENG' && '🇻🇳 Việt ➔ 🇬🇧 Anh'}
              {currentQ.type === 'LISTENING' && '🎧 Nghe chọn từ'}
              {currentQ.type === 'FILL_IN_BLANK' && '📝 Điền vào chỗ trống'}
            </div>

            <div className="flex items-center gap-1">
              {currentQ.audioText && (
                <button
                  type="button"
                  onClick={() => speakWord(currentQ.audioText!)}
                  className="p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  title="Nghe phát âm chuẩn cả câu"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleBookmark(currentQ.targetVocab.id)}
                className={`p-2 rounded-xl transition-colors ${
                  isCurrentBookmarked
                    ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                }`}
                title={isCurrentBookmarked ? 'Bỏ đánh dấu sao' : 'Đánh dấu từ này để ôn lại'}
              >
                <Bookmark className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-amber-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Question Prompt */}
          <div className="mb-4">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {currentQ.prompt}
            </h3>
          </div>

          {/* SPOTLIGHT SENTENCE DISPLAY WITH LIVE FILL-IN BLANK */}
          {sentenceParts ? (
            <div className="p-4 sm:p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-slate-900 mb-6 leading-relaxed text-base sm:text-lg font-medium">
              <span>{sentenceParts.before}</span>
              <span
                className={`inline-flex items-center justify-center min-w-[70px] sm:min-w-[95px] px-3 py-1 mx-1.5 rounded-xl border-2 font-black text-center transition-all ${
                  hasAnsweredCurrent && quizMode === 'PRACTICE'
                    ? isAnswerMatching(selectedOption || '', currentQ.correctAnswer)
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-500 shadow-xs'
                      : 'bg-rose-50 text-rose-950 border-rose-400'
                    : selectedOption
                    ? 'bg-indigo-100 text-indigo-950 border-indigo-500 shadow-xs'
                    : 'bg-white text-indigo-700 border-dashed border-indigo-400'
                }`}
              >
                {selectedOption ? (
                  hasAnsweredCurrent && quizMode === 'PRACTICE' ? (
                    isAnswerMatching(selectedOption, currentQ.correctAnswer) ? (
                      <span className="flex items-center gap-1">
                        <span>{selectedOption}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs sm:text-sm">
                        <span className="line-through opacity-70">{selectedOption}</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">
                          ➔ {currentQ.correctAnswer}
                        </span>
                      </span>
                    )
                  ) : (
                    <span>{selectedOption}</span>
                  )
                ) : (
                  <span className="text-indigo-400 text-xs sm:text-sm font-mono">[ _____ ]</span>
                )}
              </span>
              <span>{sentenceParts.after}</span>
            </div>
          ) : (
            currentQ.subPrompt && (
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-sm sm:text-base font-mono font-medium text-indigo-900">
                {currentQ.subPrompt}
              </div>
            )
          )}

          {/* Listening button if LISTENING mode */}
          {currentQ.type === 'LISTENING' && (
            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => speakWord(currentQ.audioText!)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all text-sm sm:text-base"
              >
                <Volume2 className="w-5 h-5 animate-bounce" />
                <span>Nhấn để nghe phát âm</span>
              </button>
            </div>
          )}

          {/* SPECIALIZED QUICK-FILL BAR FOR ARTICLE (Mạo từ) */}
          {currentQ.type === 'ARTICLE' && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chọn mạo từ điền vào ô trống:</span>
                </span>
                <span className="text-[11px] text-emerald-700">Chạm để điền ngay</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  let btnColor = 'bg-white hover:bg-emerald-100/60 border-emerald-200 text-slate-800';

                  if (quizMode === 'PRACTICE' && hasAnsweredCurrent) {
                    if (isAnswerMatching(option, currentQ.correctAnswer)) {
                      btnColor = 'bg-emerald-600 text-white border-emerald-600 font-black shadow-sm';
                    } else if (isSelected && !isAnswerMatching(option, currentQ.correctAnswer)) {
                      btnColor = 'bg-rose-500 text-white border-rose-500 font-bold';
                    } else {
                      btnColor = 'bg-white/40 text-slate-400 border-slate-200 opacity-60';
                    }
                  } else if (isSelected) {
                    btnColor = 'bg-emerald-600 text-white border-emerald-600 font-black shadow-xs';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${btnColor}`}
                    >
                      <span className="text-base sm:text-lg font-black tracking-tight">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Direct input for Article */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInputSubmit(typedInput);
                }}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={hasAnsweredCurrent && quizMode === 'PRACTICE'}
                  placeholder="Hoặc gõ trực tiếp (a, an, the, no article)..."
                  className="flex-1 py-2.5 px-3.5 rounded-xl border border-emerald-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={!typedInput.trim() || (hasAnsweredCurrent && quizMode === 'PRACTICE')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Điền</span>
                </button>
              </form>
            </div>
          )}

          {/* SPECIALIZED QUICK-FILL BAR FOR QUANTIFIER (Lượng từ) */}
          {currentQ.type === 'QUANTIFIER' && (
            <div className="mb-5 p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Chọn lượng từ điền vào ô trống:</span>
                </span>
                <span className="text-[11px] text-purple-700">Chạm để điền ngay</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {currentQ.options.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  let btnColor = 'bg-white hover:bg-purple-100/60 border-purple-200 text-slate-800';

                  if (quizMode === 'PRACTICE' && hasAnsweredCurrent) {
                    if (isAnswerMatching(option, currentQ.correctAnswer)) {
                      btnColor = 'bg-purple-600 text-white border-purple-600 font-black shadow-sm';
                    } else if (isSelected && !isAnswerMatching(option, currentQ.correctAnswer)) {
                      btnColor = 'bg-rose-500 text-white border-rose-500 font-bold';
                    } else {
                      btnColor = 'bg-white/40 text-slate-400 border-slate-200 opacity-60';
                    }
                  } else if (isSelected) {
                    btnColor = 'bg-purple-600 text-white border-purple-600 font-black shadow-xs';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${btnColor}`}
                    >
                      <span className="text-sm sm:text-base font-black">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Direct input for Quantifier */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInputSubmit(typedInput);
                }}
                className="mt-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={hasAnsweredCurrent && quizMode === 'PRACTICE'}
                  placeholder="Hoặc gõ lượng từ (many, few, little, each...)..."
                  className="flex-1 py-2.5 px-3.5 rounded-xl border border-purple-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
                <button
                  type="submit"
                  disabled={!typedInput.trim() || (hasAnsweredCurrent && quizMode === 'PRACTICE')}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Điền</span>
                </button>
              </form>
            </div>
          )}

          {/* STANDARD OPTIONS (For other question types, or as option cards) */}
          {currentQ.type !== 'ARTICLE' && currentQ.type !== 'QUANTIFIER' && (
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map((option, idx) => {
                const optionLabel = ['A', 'B', 'C', 'D'][idx];
                const isSelected = selectedOption === option;

                let buttonStyle =
                  'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-800 hover:border-slate-300';
                let badgeStyle = 'bg-slate-200 text-slate-700 font-bold';

                if (quizMode === 'PRACTICE') {
                  if (hasAnsweredCurrent) {
                    if (isAnswerMatching(option, currentQ.correctAnswer)) {
                      buttonStyle =
                        'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-500/20 shadow-xs';
                      badgeStyle = 'bg-emerald-600 text-white font-bold';
                    } else if (isSelected && !isAnswerMatching(option, currentQ.correctAnswer)) {
                      buttonStyle =
                        'border-rose-400 bg-rose-50 text-rose-950 font-semibold ring-2 ring-rose-500/20';
                      badgeStyle = 'bg-rose-500 text-white font-bold';
                    } else {
                      buttonStyle = 'border-slate-200 bg-white/40 text-slate-400 opacity-60';
                    }
                  }
                } else {
                  // Exam mode
                  if (isSelected) {
                    buttonStyle =
                      'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs';
                    badgeStyle = 'bg-indigo-600 text-white font-bold';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={`flex items-start sm:items-center gap-3 p-3.5 sm:p-4 rounded-2xl border text-left transition-all ${buttonStyle}`}
                  >
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs sm:text-sm shrink-0 transition-colors ${badgeStyle}`}
                    >
                      {optionLabel}
                    </span>
                    <span className="text-sm sm:text-base flex-1 pt-0.5 sm:pt-0 leading-snug">
                      {option}
                    </span>

                    {quizMode === 'PRACTICE' && hasAnsweredCurrent && (
                      <div className="shrink-0">
                        {isAnswerMatching(option, currentQ.correctAnswer) && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        )}
                        {isSelected && !isAnswerMatching(option, currentQ.correctAnswer) && (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Direct input for fill in blank if applicable */}
              {sentenceParts && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleInputSubmit(typedInput);
                  }}
                  className="mt-1 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    disabled={hasAnsweredCurrent && quizMode === 'PRACTICE'}
                    placeholder="Hoặc gõ trực tiếp đáp án vào đây..."
                    className="flex-1 py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={!typedInput.trim() || (hasAnsweredCurrent && quizMode === 'PRACTICE')}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Điền</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* PRACTICE MODE: Explanation Box after answering */}
          {quizMode === 'PRACTICE' && hasAnsweredCurrent && (
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-slate-800 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-indigo-900 text-sm sm:text-base">
                      {currentQ.targetVocab.word}
                    </span>
                    <span className="text-xs font-mono text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200/60">
                      {currentQ.targetVocab.pos} {currentQ.targetVocab.ipa}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakWord(currentQ.targetVocab.word)}
                      className="p-1 text-indigo-600 hover:text-indigo-800"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {currentQ.explanation}
                  </p>

                  {/* Related word family if available */}
                  {currentQ.targetVocab.relatedWords && currentQ.targetVocab.relatedWords.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-indigo-200/60 text-xs text-slate-600 flex flex-wrap gap-2">
                      <span className="font-bold text-indigo-900">Từ liên quan:</span>
                      {currentQ.targetVocab.relatedWords.map((r, ri) => (
                        <span key={ri} className="bg-white/90 px-2 py-0.5 rounded border border-indigo-200/50">
                          <strong>{r.word}</strong> {r.pos} {r.ipa || ''}: {r.meaning}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between gap-3">
            {quizMode === 'EXAM' ? (
              <>
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={handlePrevQuestion}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Câu trước
                </button>

                <div className="flex items-center gap-2">
                  {currentIndex === questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={finishQuiz}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20"
                    >
                      Nộp bài thi
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5"
                    >
                      <span>Câu tiếp</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              // Practice mode
              <div className="w-full flex items-center justify-end">
                <button
                  type="button"
                  disabled={!hasAnsweredCurrent}
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span>{currentIndex === questions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: 3. RESULTS & REVIEW
  // -------------------------------------------------------------
  const filteredReviewQuestions = questions.filter((q) => {
    const isCorrect = userAnswers[q.id] && isAnswerMatching(userAnswers[q.id], q.correctAnswer);
    if (reviewFilter === 'WRONG') return !isCorrect;
    if (reviewFilter === 'CORRECT') return isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Score Summary Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90 text-center relative overflow-hidden mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
          <Award className="w-4 h-4" /> Báo cáo kết quả trả bài
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          {percentageScore >= 90
            ? 'Xuất sắc! Bạn thuộc bài rất tốt! 🎉'
            : percentageScore >= 70
            ? 'Làm tốt lắm! Đạt yêu cầu! 👍'
            : 'Cần ôn thêm một chút nữa nhé! 📚'}
        </h2>

        {/* Circular / Badge Score */}
        <div className="my-6 inline-flex flex-col items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-xl shadow-indigo-500/25 p-2">
          <div className="text-3xl sm:text-4xl font-black">{score10Scale}</div>
          <div className="text-xs font-semibold text-indigo-100 uppercase tracking-wider">
            Thang điểm 10
          </div>
          <div className="text-xs font-medium text-indigo-200 mt-0.5">
            {correctCount}/{questions.length} câu đúng ({percentageScore}%)
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mb-6 text-left">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-xs font-medium text-emerald-800">Số câu đúng</span>
            <p className="text-xl font-black text-emerald-700">{correctCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
            <span className="text-xs font-medium text-rose-800">Số câu sai</span>
            <p className="text-xl font-black text-rose-700">{questions.length - correctCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
            <span className="text-xs font-medium text-amber-800">Chuỗi cao nhất</span>
            <p className="text-xl font-black text-amber-700">{maxStreak} câu 🔥</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-medium text-slate-700">Thời gian</span>
            <p className="text-xl font-black text-slate-700">{formatTime(timerSeconds)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => startQuiz()}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại bài này</span>
          </button>

          {wrongQuestions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const wrongPool = wrongQuestions.map((q) => q.targetVocab);
                startQuiz(wrongPool, wrongPool.length);
              }}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-95 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Chỉ làm lại các câu sai ({wrongQuestions.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setQuizState('CONFIG')}
            className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all"
          >
            Đổi phần bài học
          </button>
        </div>
      </div>

      {/* Detailed Review Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/90">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>Chi tiết từng câu hỏi</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {questions.length} câu
            </span>
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setReviewFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reviewFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({questions.length})
            </button>
            <button
              onClick={() => setReviewFilter('WRONG')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reviewFilter === 'WRONG'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Câu sai ({wrongQuestions.length})
            </button>
            <button
              onClick={() => setReviewFilter('CORRECT')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                reviewFilter === 'CORRECT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Câu đúng ({correctCount})
            </button>
          </div>
        </div>

        {/* List of reviewed questions */}
        <div className="space-y-4">
          {filteredReviewQuestions.map((q, idx) => {
            const userAnswer = userAnswers[q.id];
            const isCorrect = userAnswer && isAnswerMatching(userAnswer, q.correctAnswer);
            const isBookmarked = bookmarks.includes(q.targetVocab.id);

            return (
              <div
                key={q.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : 'border-rose-200/80 bg-rose-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isCorrect
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {q.targetVocab.sectionTitle}
                    </span>
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {q.targetVocab.word} ({q.targetVocab.pos})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => speakWord(q.targetVocab.word)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(q.targetVocab.id)}
                      className={`p-1.5 rounded-lg ${
                        isBookmarked
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-slate-400 hover:text-amber-500'
                      }`}
                      title={isBookmarked ? 'Bỏ sao' : 'Gắn sao'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                <p className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                  {q.prompt}
                </p>
                {q.subPrompt && (
                  <p className="text-xs sm:text-sm font-mono text-indigo-700 bg-white/70 p-2 rounded-lg border border-indigo-100 mb-3">
                    {q.subPrompt}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap mb-2">
                  <span className="font-semibold text-slate-600">Đáp án của bạn:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800 line-through'
                    }`}
                  >
                    {userAnswer || '(Bỏ qua)'}
                  </span>

                  {!isCorrect && (
                    <>
                      <span className="font-semibold text-slate-600 ml-2">Đáp án đúng:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {q.correctAnswer}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-2 bg-white/80 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                  💡 <strong>Giải thích:</strong> {q.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
