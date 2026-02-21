import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import LETTERS from '../data/letters.json';
import { xpForLevel } from '../utils/xp-calculator.js';

const STORAGE_KEY = 'arabic-mastery-state';

function buildInitialMastery() {
  const m = {};
  LETTERS.forEach((l) => {
    m[l.name] = 0;
  });
  return m;
}

const defaultState = {
  xp: 0,
  level: 1,
  streak: 0,
  maxStreak: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  letterMastery: buildInitialMastery(),
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultState, ...parsed };
    }
  } catch {
    // ignore
  }
  return defaultState;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'CORRECT_ANSWER': {
      const newStreak = state.streak + 1;
      const newMaxStreak = Math.max(newStreak, state.maxStreak);
      let newXP = state.xp + action.xp;
      let newLevel = state.level;

      while (newXP >= xpForLevel(newLevel)) {
        newXP -= xpForLevel(newLevel);
        newLevel++;
      }

      const newMastery = { ...state.letterMastery };
      if (action.letterName && action.letterName !== 'Vocab') {
        newMastery[action.letterName] = Math.min(
          3,
          (newMastery[action.letterName] || 0) + 1
        );
      }

      return {
        ...state,
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        maxStreak: newMaxStreak,
        totalCorrect: state.totalCorrect + 1,
        totalAnswered: state.totalAnswered + 1,
        letterMastery: newMastery,
      };
    }
    case 'WRONG_ANSWER':
      return {
        ...state,
        streak: 0,
        totalAnswered: state.totalAnswered + 1,
      };
    case 'BREAK_STREAK':
      return {
        ...state,
        streak: 0,
      };
    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, null, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const correctAnswer = useCallback((xp, letterName) => {
    dispatch({ type: 'CORRECT_ANSWER', xp, letterName });
  }, []);

  const wrongAnswer = useCallback(() => {
    dispatch({ type: 'WRONG_ANSWER' });
  }, []);

  const breakStreak = useCallback(() => {
    dispatch({ type: 'BREAK_STREAK' });
  }, []);

  return (
    <GameContext.Provider
      value={{ state, correctAnswer, wrongAnswer, breakStreak }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
