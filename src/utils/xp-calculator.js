const XP_BASE = {
  easy: 10,
  medium: 20,
  hard: 35,
  wordBuilder: 25,
  reading: 30,
};

export function calculateXP(mode, streak) {
  const base = XP_BASE[mode] || 10;
  const streakBonus =
    mode === 'wordBuilder'
      ? Math.min(streak, 10) * 3
      : Math.min(streak, 10) * 2;
  return base + streakBonus;
}

export function xpForLevel(level) {
  return level * 100;
}
