import { useState, useEffect } from 'react';

const BOOKMARKS_KEY = 'vocab_quiz_bookmarks';
const MISTAKES_KEY = 'vocab_quiz_mistakes';
const STATS_KEY = 'vocab_quiz_stats';

export interface QuizStatRecord {
  date: string;
  score: number;
  total: number;
  section: string;
  durationSeconds: number;
}

export function useVocabStorage() {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [mistakes, setMistakes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MISTAKES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stats, setStats] = useState<QuizStatRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn(e);
    }
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(MISTAKES_KEY, JSON.stringify(mistakes));
    } catch (e) {
      console.warn(e);
    }
  }, [mistakes]);

  useEffect(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn(e);
    }
  }, [stats]);

  const toggleBookmark = (vocabId: string) => {
    setBookmarks((prev) =>
      prev.includes(vocabId) ? prev.filter((id) => id !== vocabId) : [...prev, vocabId]
    );
  };

  const isBookmarked = (vocabId: string) => bookmarks.includes(vocabId);

  const addMistake = (vocabId: string) => {
    setMistakes((prev) => (prev.includes(vocabId) ? prev : [...prev, vocabId]));
  };

  const removeMistake = (vocabId: string) => {
    setMistakes((prev) => prev.filter((id) => id !== vocabId));
  };

  const clearMistakes = () => setMistakes([]);

  const recordQuizStat = (stat: QuizStatRecord) => {
    setStats((prev) => [stat, ...prev].slice(0, 50));
  };

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    mistakes,
    addMistake,
    removeMistake,
    clearMistakes,
    stats,
    recordQuizStat,
  };
}
