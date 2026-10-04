import { VocabItem, ALL_FULL_VOCABULARY, SectionId } from '../data/vocabulary';
import { WORD_FAMILIES, WordFamily } from '../data/wordForms';
import {
  PREPOSITION_QUESTIONS,
  QUANTIFIER_QUESTIONS,
  ARTICLE_QUESTIONS,
  IF_UNLESS_QUESTIONS,
  CONDITIONAL_WISH_QUESTIONS,
  SYNONYM_QUESTIONS,
  ALL_GRAMMAR_QUESTIONS,
  GrammarQuestionItem,
} from '../data/grammarQuestions';

export type QuestionType =
  | 'ENG_TO_VIE'
  | 'VIE_TO_ENG'
  | 'WORD_FORM'
  | 'PREPOSITION'
  | 'QUANTIFIER'
  | 'ARTICLE'
  | 'IF_UNLESS'
  | 'CONDITIONAL_WISH'
  | 'SYNONYM'
  | 'COLLOCATION'
  | 'FILL_IN_BLANK'
  | 'LISTENING';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  subPrompt?: string;
  targetVocab: VocabItem;
  options: string[];
  correctAnswer: string;
  explanation: string;
  audioText?: string;
}

// Utility: shuffle array (Fisher-Yates)
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function determineQuestionType(
  item: VocabItem,
  mode: 'ALL' | QuestionType,
  pool: VocabItem[]
): QuestionType {
  if (mode !== 'ALL') {
    if (mode === 'WORD_FORM') {
      const hasWf = WORD_FAMILIES.some(
        (w) => w.root === item.word || item.word.startsWith(w.root)
      );
      if (hasWf || (item.relatedWords && item.relatedWords.length > 0) || item.isSubWord) {
        return 'WORD_FORM';
      }
    }
    if (mode === 'COLLOCATION' && (item.grammarNote || (item.collocations && item.collocations.length > 0))) {
      return 'COLLOCATION';
    }
    if (mode === 'FILL_IN_BLANK' && item.example) {
      return 'FILL_IN_BLANK';
    }
    return mode;
  }

  // Pick suitable type based on available properties
  const candidates: QuestionType[] = ['ENG_TO_VIE', 'VIE_TO_ENG', 'LISTENING'];
  const wf = WORD_FAMILIES.find((w) => w.root === item.word || item.word.startsWith(w.root));
  if (wf || (item.relatedWords && item.relatedWords.length > 0) || item.isSubWord) {
    candidates.push('WORD_FORM', 'WORD_FORM');
  }
  if (item.grammarNote || (item.collocations && item.collocations.length > 0)) {
    candidates.push('COLLOCATION');
  }
  if (item.example) {
    candidates.push('FILL_IN_BLANK');
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function generateQuestions(
  pool: VocabItem[],
  count: number,
  mode: 'ALL' | QuestionType = 'ALL'
): QuizQuestion[] {
  // Check if requested mode is a specific grammar/synonym mode
  if (mode === 'PREPOSITION') {
    return shuffle(PREPOSITION_QUESTIONS).slice(0, count);
  }
  if (mode === 'QUANTIFIER') {
    return shuffle(QUANTIFIER_QUESTIONS).slice(0, count);
  }
  if (mode === 'ARTICLE') {
    return shuffle(ARTICLE_QUESTIONS).slice(0, count);
  }
  if (mode === 'IF_UNLESS') {
    return shuffle(IF_UNLESS_QUESTIONS).slice(0, count);
  }
  if (mode === 'CONDITIONAL_WISH') {
    return shuffle(CONDITIONAL_WISH_QUESTIONS).slice(0, count);
  }
  if (mode === 'SYNONYM') {
    return shuffle(SYNONYM_QUESTIONS).slice(0, count);
  }

  if (pool.length === 0) return [];

  const shuffledVocab = shuffle(pool);
  const questions: QuizQuestion[] = [];

  // Phase 1: Guarantee every single item in the pool gets at least one question
  for (let i = 0; i < shuffledVocab.length; i++) {
    if (questions.length >= count) break;
    const item = shuffledVocab[i];
    const qType = determineQuestionType(item, mode, pool);
    const question = buildQuestion(item, qType, pool);
    if (question) {
      questions.push(question);
    }
  }

  // Phase 2: If mode is ALL and we have extra slots, inject high-yield grammar/synonym questions
  if (mode === 'ALL' && questions.length < count) {
    const grammarPool = shuffle(ALL_GRAMMAR_QUESTIONS);
    for (const gq of grammarPool) {
      if (questions.length >= count) break;
      questions.push(gq);
    }
  }

  // Phase 3: If more questions are still needed, loop through pool with alternate question types
  let loopIdx = 0;
  while (questions.length < count && loopIdx < pool.length * 5) {
    const item = shuffledVocab[loopIdx % shuffledVocab.length];
    loopIdx++;

    let qType = determineQuestionType(item, mode, pool);
    if (mode === 'ALL') {
      const altTypes: QuestionType[] = ['ENG_TO_VIE', 'VIE_TO_ENG', 'WORD_FORM', 'LISTENING'];
      qType = altTypes[loopIdx % altTypes.length];
    }

    const question = buildQuestion(item, qType, pool);
    if (question) {
      questions.push(question);
    }
    if (questions.length >= count) break;
  }

  return questions.slice(0, count);
}

function buildQuestion(item: VocabItem, type: QuestionType, pool: VocabItem[]): QuizQuestion | null {
  const cleanItemWord = item.word.trim().toLowerCase();
  const cleanItemMeaning = item.meaning.trim().toLowerCase();

  const otherItems = pool.filter(
    (v) =>
      v.word.trim().toLowerCase() !== cleanItemWord &&
      v.meaning.trim().toLowerCase() !== cleanItemMeaning
  );

  // 1. DEDICATED WORD FORM QUESTION BUILDER
  if (type === 'WORD_FORM') {
    if (item.isSubWord && item.rootWord) {
      const parentRoot = item.rootWord;
      const options = shuffle([
        `${item.pos === '(n)' ? 'Danh từ' : item.pos === '(adj)' ? 'Tính từ' : item.pos === '(adv)' ? 'Trạng từ' : 'Động từ'} (${item.pos}): ${item.meaning}`,
        'Động từ chỉ hành động (v)',
        'Tính từ miêu tả tính chất (adj)',
        'Trạng từ chỉ cách thức (adv)',
      ]);
      const correctOpt = `${item.pos === '(n)' ? 'Danh từ' : item.pos === '(adj)' ? 'Tính từ' : item.pos === '(adv)' ? 'Trạng từ' : 'Động từ'} (${item.pos}): ${item.meaning}`;

      return {
        id: `q-wf-sub-${item.id}-${Math.random().toString(36).substring(7)}`,
        type: 'WORD_FORM',
        prompt: `Trong họ từ vựng của gốc "${parentRoot}", từ "${item.word}" là dạng từ gì và có nghĩa là gì?`,
        subPrompt: `Từ gốc: ${parentRoot} ➔ Dạng từ phụ: ${item.word}`,
        targetVocab: item,
        options,
        correctAnswer: correctOpt,
        audioText: item.word,
        explanation: `Chính xác! "${item.word}" ${item.ipa} là dạng ${correctOpt} xuất phát từ từ gốc "${parentRoot}".`,
      };
    }

    const wf = WORD_FAMILIES.find(
      (w) =>
        w.root === item.word ||
        item.word.startsWith(w.root) ||
        w.noun === item.word ||
        w.verb === item.word ||
        w.adj === item.word
    );

    if (wf) {
      const styles = ['IDENTIFY_FORM', 'GAP_FILL'];
      const chosenStyle = wf.exampleSentence ? styles[Math.floor(Math.random() * styles.length)] : 'IDENTIFY_FORM';

      if (chosenStyle === 'GAP_FILL' && wf.exampleSentence && wf.exampleAnswer) {
        const variants = [wf.noun, wf.adj, wf.verb, wf.adv, wf.nounPerson].filter(Boolean) as string[];
        const distractors = variants.filter((v) => v !== wf.exampleAnswer);
        if (distractors.length < 3) {
          distractors.push(`${wf.root}ing`, `${wf.root}ed`, `${wf.root}ly`);
        }
        const options = shuffle([wf.exampleAnswer, ...shuffle(distractors).slice(0, 3)]);

        return {
          id: `q-wf-gap-${wf.id}-${Math.random().toString(36).substring(7)}`,
          type: 'WORD_FORM',
          prompt: `Cho dạng từ thích hợp của từ trong ngoặc (${wf.root}):`,
          subPrompt: wf.exampleSentence,
          targetVocab: item,
          options,
          correctAnswer: wf.exampleAnswer,
          audioText: wf.exampleAnswer,
          explanation: `Đáp án đúng là "${wf.exampleAnswer}". Họ từ vựng của ${wf.root} (${wf.meaning}): Động từ (v): ${wf.verb || '-'} | Danh từ (n): ${wf.noun || '-'} | Tính từ (adj): ${wf.adj || '-'}.`,
        };
      }

      const targetPosList: Array<{ posName: string; correctWord: string; note: string }> = [];
      if (wf.noun && wf.noun !== wf.root) {
        targetPosList.push({ posName: 'Danh từ (Noun)', correctWord: wf.noun, note: `Danh từ: ${wf.noun} (${wf.nounIpa || ''})` });
      }
      if (wf.nounPerson) {
        targetPosList.push({ posName: 'Danh từ chỉ người (Person Noun)', correctWord: wf.nounPerson, note: `Danh từ chỉ người: ${wf.nounPerson} (${wf.nounPersonIpa || ''})` });
      }
      if (wf.adj) {
        targetPosList.push({ posName: 'Tính từ (Adjective)', correctWord: wf.adj, note: `Tính từ: ${wf.adj} (${wf.adjIpa || ''})` });
      }
      if (wf.verb && wf.verb !== wf.noun) {
        targetPosList.push({ posName: 'Động từ (Verb)', correctWord: wf.verb, note: `Động từ: ${wf.verb} (${wf.verbIpa || ''})` });
      }

      if (targetPosList.length > 0) {
        const picked = targetPosList[Math.floor(Math.random() * targetPosList.length)];
        const allWfWords = [wf.verb, wf.noun, wf.nounPerson, wf.adj, wf.adv].filter(Boolean) as string[];
        const distractors = allWfWords.filter((w) => w !== picked.correctWord);
        if (distractors.length < 3) {
          const fakeForms = [`${wf.root}ment`, `${wf.root}able`, `${wf.root}ness`, `${wf.root}ful`, `${wf.root}ing`];
          for (const f of fakeForms) {
            if (!distractors.includes(f) && f !== picked.correctWord) distractors.push(f);
            if (distractors.length >= 3) break;
          }
        }
        const options = shuffle([picked.correctWord, ...shuffle(distractors).slice(0, 3)]);

        return {
          id: `q-wf-id-${wf.id}-${picked.correctWord}-${Math.random().toString(36).substring(7)}`,
          type: 'WORD_FORM',
          prompt: `${picked.posName} của từ "${wf.root}" (${wf.meaning}) là gì?`,
          subPrompt: `Ví dụ: resist ➔ resistance; admire ➔ admiration`,
          targetVocab: item,
          options,
          correctAnswer: picked.correctWord,
          audioText: picked.correctWord,
          explanation: `Chính xác! ${picked.note}. Các dạng từ chính: Verb: ${wf.verb || '-'}, Noun: ${wf.noun || '-'}, Adj: ${wf.adj || '-'}.`,
        };
      }
    }

    if (item.relatedWords && item.relatedWords.length > 0) {
      const rel = item.relatedWords[Math.floor(Math.random() * item.relatedWords.length)];
      const otherRelWords = item.relatedWords.map((r) => r.word).filter((w) => w !== rel.word);
      const randomDistractors = shuffle(otherItems).slice(0, 3 - otherRelWords.length).map((o) => o.word);
      const options = shuffle([rel.word, ...otherRelWords, ...randomDistractors]);

      return {
        id: `q-wf-rel-${item.id}-${rel.word}-${Math.random().toString(36).substring(7)}`,
        type: 'WORD_FORM',
        prompt: `Dạng từ liên quan ${rel.pos} của từ "${item.word}" là gì?`,
        subPrompt: `Nghĩa: ${rel.meaning}`,
        targetVocab: item,
        options,
        correctAnswer: rel.word,
        audioText: rel.word,
        explanation: `Chính xác! Dạng ${rel.pos} của "${item.word}" là "${rel.word}" (${rel.ipa || ''}): ${rel.meaning}.`,
      };
    }
  }

  // 2. ENGLISH TO VIETNAMESE
  if (type === 'ENG_TO_VIE') {
    const distractors = shuffle(otherItems)
      .slice(0, 3)
      .map((o) => o.meaning);
    const options = shuffle([item.meaning, ...distractors]);

    const isSub = item.isSubWord && item.rootWord;

    return {
      id: `q-e2v-${item.id}-${Math.random().toString(36).substring(7)}`,
      type: 'ENG_TO_VIE',
      prompt: isSub
        ? `Từ phụ/Dạng từ "${item.word}" (gốc "${item.rootWord}") có nghĩa là gì?`
        : `Từ "${item.word}" có nghĩa là gì?`,
      subPrompt: `${item.pos} ${item.ipa}`,
      targetVocab: item,
      options,
      correctAnswer: item.meaning,
      audioText: item.word,
      explanation: `"${item.word}" ${item.pos} ${item.ipa} ${isSub ? `(từ loại của gốc "${item.rootWord}")` : ''} mang nghĩa là: "${item.meaning}".`,
    };
  }

  // 3. VIETNAMESE TO ENGLISH
  if (type === 'VIE_TO_ENG') {
    const distractors = shuffle(otherItems)
      .slice(0, 3)
      .map((o) => o.word);
    const options = shuffle([item.word, ...distractors]);

    return {
      id: `q-v2e-${item.id}-${Math.random().toString(36).substring(7)}`,
      type: 'VIE_TO_ENG',
      prompt: `Từ tiếng Anh nào có nghĩa là: "${item.meaning}"?`,
      subPrompt: `Loại từ: ${item.pos} ${item.isSubWord ? `(gốc "${item.rootWord}")` : ''}`,
      targetVocab: item,
      options,
      correctAnswer: item.word,
      audioText: item.word,
      explanation: `Đáp án đúng là "${item.word}" ${item.ipa} (${item.pos}): ${item.meaning}.`,
    };
  }

  // 4. LISTENING
  if (type === 'LISTENING') {
    const distractors = shuffle(otherItems)
      .slice(0, 3)
      .map((o) => `${o.word} (${o.pos})`);
    const correctOpt = `${item.word} (${item.pos})`;
    const options = shuffle([correctOpt, ...distractors]);

    return {
      id: `q-list-${item.id}-${Math.random().toString(36).substring(7)}`,
      type: 'LISTENING',
      prompt: 'Nghe phát âm và chọn từ chính xác:',
      subPrompt: 'Nhấn nút loa để nghe lại nếu cần thiết',
      targetVocab: item,
      options,
      correctAnswer: correctOpt,
      audioText: item.word,
      explanation: `Từ bạn vừa nghe là "${item.word}" ${item.ipa}: ${item.meaning}.`,
    };
  }

  // 5. COLLOCATION & GRAMMAR
  if (type === 'COLLOCATION' && (item.grammarNote || (item.collocations && item.collocations.length > 0))) {
    const phrase = item.grammarNote || item.collocations![0];
    if (phrase.includes('+ to V')) {
      const options = shuffle(['to V', 'V-ing', 'bare V', 'V-ed']);
      return {
        id: `q-col-${item.id}-${Math.random().toString(36).substring(7)}`,
        type: 'COLLOCATION',
        prompt: `Cấu trúc chính xác đi với động từ "${item.word}" là gì?`,
        subPrompt: `${item.word} + _______`,
        targetVocab: item,
        options,
        correctAnswer: 'to V',
        audioText: item.word,
        explanation: `Cấu trúc chuẩn trong bài: ${item.word} + to V. Ví dụ: ${item.example || ''}`,
      };
    }

    if (item.word.includes('on top of the world')) {
      const options = shuffle([
        'cực kỳ vui sướng, hạnh phúc',
        'cực kỳ mệt mỏi, kiệt sức',
        'rất tức giận và thất vọng',
        'lo lắng về tương lai',
      ]);
      return {
        id: `q-col-${item.id}-${Math.random().toString(36).substring(7)}`,
        type: 'COLLOCATION',
        prompt: `Thành ngữ "${item.word}" có nghĩa là gì?`,
        subPrompt: 'Idiom trong Unit 1',
        targetVocab: item,
        options,
        correctAnswer: 'cực kỳ vui sướng, hạnh phúc',
        audioText: item.word,
        explanation: `"on top of the world" = be on cloud nine = cực kỳ vui sướng, hạnh phúc.`,
      };
    }
  }

  // 6. FILL IN THE BLANK (GAP FILL CONTEXT)
  if (type === 'FILL_IN_BLANK' && item.example) {
    const sentence = item.example;
    const cleanWord = item.word.replace(/\s*\(.*\)/, '').trim();
    const regex = new RegExp(`\\b${cleanWord}\\b`, 'i');

    if (regex.test(sentence)) {
      const blanked = sentence.replace(regex, '_______');
      const distractors = shuffle(otherItems)
        .slice(0, 3)
        .map((o) => o.word.replace(/\s*\(.*\)/, '').trim());
      const options = shuffle([cleanWord, ...distractors]);

      return {
        id: `q-fib-${item.id}-${Math.random().toString(36).substring(7)}`,
        type: 'FILL_IN_BLANK',
        prompt: 'Chọn từ chính xác để điền vào chỗ trống:',
        subPrompt: blanked,
        targetVocab: item,
        options,
        correctAnswer: cleanWord,
        audioText: sentence,
        explanation: `Câu hoàn chỉnh: "${sentence}". (Nghĩa: ${item.exampleMeaning || item.meaning})`,
      };
    }
  }

  // Default fallback: ENG_TO_VIE
  const distractors = shuffle(otherItems)
    .slice(0, 3)
    .map((o) => o.meaning);
  const options = shuffle([item.meaning, ...distractors]);

  return {
    id: `q-default-${item.id}-${Math.random().toString(36).substring(7)}`,
    type: 'ENG_TO_VIE',
    prompt: `Từ "${item.word}" có nghĩa là gì?`,
    subPrompt: `${item.pos} ${item.ipa}`,
    targetVocab: item,
    options,
    correctAnswer: item.meaning,
    audioText: item.word,
    explanation: `"${item.word}" ${item.pos} ${item.ipa} mang nghĩa là: "${item.meaning}".`,
  };
}
