function levenshtein(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] =
        b[i - 1] === a[j - 1]
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

export function stringSimilarity(a, b) {
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDist = levenshtein(longer, shorter);
  return (longer.length - editDist) / longer.length;
}

export function normalizeTransliteration(str) {
  return str
    .toLowerCase()
    .replace(/[ʿḥṣḍṭẓāīū'']/g, (m) => {
      const map = {
        ʿ: '',
        ḥ: 'h',
        ṣ: 's',
        ḍ: 'd',
        ṭ: 't',
        ẓ: 'z',
        ā: 'a',
        "'": '',
        ī: 'i',
        "\u2018": '',
        ū: 'u',
      };
      return map[m] || m;
    })
    .replace(/[\s\-']/g, '');
}
