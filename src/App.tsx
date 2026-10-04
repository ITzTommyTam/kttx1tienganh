/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { QuizView } from './components/QuizView';
import { WordFormsView } from './components/WordFormsView';
import { FlashcardView } from './components/FlashcardView';
import { VocabTableView } from './components/VocabTableView';
import { useVocabStorage } from './hooks/useVocabStorage';
import { ALL_FULL_VOCABULARY, VOCABULARY_LIST } from './data/vocabulary';
import { QuestionType } from './utils/quizGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'wordforms' | 'flashcard' | 'table'>('quiz');
  const [quizInitialType, setQuizInitialType] = useState<'ALL' | QuestionType>('ALL');
  const [flashcardDeckMode, setFlashcardDeckMode] = useState<'VOCAB' | 'WORD_FORMS'>('VOCAB');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    mistakes,
    addMistake,
    removeMistake,
    recordQuizStat,
  } = useVocabStorage();

  const handleStartWordFormQuiz = () => {
    setQuizInitialType('WORD_FORM');
    setActiveTab('quiz');
  };

  const handleOpenWordFormFlashcards = () => {
    setFlashcardDeckMode('WORD_FORMS');
    setActiveTab('flashcard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'quiz') {
            setQuizInitialType('ALL');
          }
          if (tab === 'flashcard' && activeTab !== 'flashcard') {
            // Keep current deck mode or reset to VOCAB if coming from general nav
            // User can still toggle freely inside flashcard view
          }
          setActiveTab(tab);
        }}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        bookmarkCount={bookmarks.length}
        totalVocabCount={ALL_FULL_VOCABULARY.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-28 md:pb-16">
        {activeTab === 'quiz' && (
          <QuizView
            key={quizInitialType}
            soundEnabled={soundEnabled}
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
            isBookmarked={isBookmarked}
            mistakes={mistakes}
            addMistake={addMistake}
            removeMistake={removeMistake}
            initialQuestionType={quizInitialType}
            recordQuizStat={recordQuizStat}
          />
        )}

        {activeTab === 'wordforms' && (
          <WordFormsView
            onStartWordFormQuiz={handleStartWordFormQuiz}
            onOpenWordFormFlashcards={() => setActiveTab('flashcard')}
          />
        )}

        {activeTab === 'flashcard' && (
          <FlashcardView
            soundEnabled={soundEnabled}
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
            isBookmarked={isBookmarked}
          />
        )}

        {activeTab === 'table' && (
          <VocabTableView
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
            isBookmarked={isBookmarked}
          />
        )}
      </main>

      {/* Quick Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xs py-6 text-center text-xs text-slate-700 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Tiếng Anh 12 - Unit 1: Life Story We Admire</span>
            <span>•</span>
            <span>Đầy đủ 8 phần từ trang 1 đến trang 5 & 43 Họ dạng từ (Word Forms)</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => {
                setQuizInitialType('ALL');
                setActiveTab('quiz');
              }}
              className="text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Trắc nghiệm
            </button>
            <button
              onClick={() => setActiveTab('wordforms')}
              className="text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Dạng từ
            </button>
            <button
              onClick={() => setActiveTab('flashcard')}
              className="text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Flashcard
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className="text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Từ điển
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
