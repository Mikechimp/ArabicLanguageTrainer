/**
 * Alphabet View
 *
 * Interactive Arabic alphabet trainer. Click any letter to see:
 *   - All 4 positional forms (isolated, initial, medial, final)
 *   - Stroke direction guide
 *   - Pronunciation tips
 *   - Example words using that letter
 *   - Audio pronunciation via TTS
 */

import { View } from '../services/router';
import { getTTSService, TTSState } from '../services/tts-service';

interface LetterData {
  name: string;
  transliteration: string;
  sound: string;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
  strokeHint: string;
  examples: { arabic: string; transliteration: string; english: string }[];
}

interface PracticeWord {
  arabic: string;
  transliteration: string;
  english: string;
  tip: string;
}

const PRACTICE_LEVELS: { title: string; description: string; words: PracticeWord[] }[] = [
  {
    title: 'Level 1 — Simple Connections',
    description: 'Short words with basic letter joins. Focus on connecting just 2-3 letters.',
    words: [
      { arabic: 'أب', transliteration: 'ab', english: 'father', tip: 'Alif + Ba — non-connecting into connecting' },
      { arabic: 'يد', transliteration: 'yad', english: 'hand', tip: 'Ya + Dal — smooth baseline connection' },
      { arabic: 'نار', transliteration: 'nar', english: 'fire', tip: 'Nun + Alif + Ra — all baseline letters' },
      { arabic: 'باب', transliteration: 'bab', english: 'door', tip: 'Ba + Alif + Ba — repeating shape builds rhythm' },
      { arabic: 'بيت', transliteration: 'bayt', english: 'house', tip: 'Ba connects to Ya connects to Ta — teeth shapes' },
      { arabic: 'ولد', transliteration: 'walad', english: 'boy', tip: 'Waw + Lam + Dal — descending strokes' },
    ]
  },
  {
    title: 'Level 2 — Building Flow',
    description: 'Medium words that train your hand to move smoothly through connections.',
    words: [
      { arabic: 'كتاب', transliteration: 'kitab', english: 'book', tip: 'Kaf + Ta + Alif + Ba — mix of tall and short strokes' },
      { arabic: 'سلام', transliteration: 'salam', english: 'peace', tip: 'Sin teeth into Lam rise into Alif-Mim — classic flow word' },
      { arabic: 'قلم', transliteration: 'qalam', english: 'pen', tip: 'Qaf loop into Lam rise into Mim loop — writing about writing' },
      { arabic: 'جميل', transliteration: 'jamil', english: 'beautiful', tip: 'Jim cup into Mim-Ya-Lam — curves and dots' },
      { arabic: 'حبيب', transliteration: 'habib', english: 'beloved', tip: 'Ha into Ba-Ya-Ba — deep curve then teeth' },
      { arabic: 'نجمة', transliteration: 'najma', english: 'star', tip: 'Nun-Jim-Mim-Ta marbouta — varied shapes' },
    ]
  },
  {
    title: 'Level 3 — Flowing Phrases',
    description: 'Longer words and common phrases. Train your hand for real Arabic writing.',
    words: [
      { arabic: 'بسم الله', transliteration: 'bismillah', english: 'in the name of God', tip: 'Most written phrase in Arabic — practice until it flows naturally' },
      { arabic: 'الحمد لله', transliteration: 'alhamdulillah', english: 'praise be to God', tip: 'Alif-Lam ligature into Ha-Mim-Dal — essential phrase' },
      { arabic: 'إن شاء الله', transliteration: 'insha\'allah', english: 'God willing', tip: 'Three connected groups — practice the spaces between words' },
      { arabic: 'مدرسة', transliteration: 'madrasa', english: 'school', tip: 'Mim-Dal-Ra-Sin-Ta marbouta — five different letter forms' },
      { arabic: 'مكتبة', transliteration: 'maktaba', english: 'library', tip: 'Mim-Kaf-Ta-Ba-Ta marbouta — rich in connections' },
      { arabic: 'الجمهورية', transliteration: 'al-jumhuriyya', english: 'the republic', tip: 'Long word with Alif-Lam prefix — builds stamina' },
    ]
  },
];

const ALPHABET: LetterData[] = [
  { name: 'Alif', transliteration: 'a/aa', sound: 'Like "a" in "father" or a glottal stop', isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا', strokeHint: 'Single vertical stroke, top to bottom', examples: [{ arabic: 'أب', transliteration: 'ab', english: 'father' }, { arabic: 'أنا', transliteration: 'ana', english: 'I/me' }] },
  { name: 'Ba', transliteration: 'b', sound: 'Like "b" in "book"', isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب', strokeHint: 'Right to left curve with one dot below', examples: [{ arabic: 'بيت', transliteration: 'bayt', english: 'house' }, { arabic: 'باب', transliteration: 'bab', english: 'door' }] },
  { name: 'Ta', transliteration: 't', sound: 'Like "t" in "table"', isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت', strokeHint: 'Same shape as Ba with two dots above', examples: [{ arabic: 'تمر', transliteration: 'tamr', english: 'dates (fruit)' }, { arabic: 'تاب', transliteration: 'tab', english: 'repented' }] },
  { name: 'Tha', transliteration: 'th', sound: 'Like "th" in "think"', isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث', strokeHint: 'Same shape as Ba with three dots above', examples: [{ arabic: 'ثلج', transliteration: 'thalj', english: 'snow' }, { arabic: 'ثلاثة', transliteration: 'thalatha', english: 'three' }] },
  { name: 'Jim', transliteration: 'j', sound: 'Like "j" in "jump"', isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج', strokeHint: 'Open curve with one dot below', examples: [{ arabic: 'جمل', transliteration: 'jamal', english: 'camel' }, { arabic: 'جبل', transliteration: 'jabal', english: 'mountain' }] },
  { name: 'Ha', transliteration: 'h', sound: 'Deep breathy "h" from the throat', isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح', strokeHint: 'Same shape as Jim with no dot', examples: [{ arabic: 'حب', transliteration: 'hubb', english: 'love' }, { arabic: 'حليب', transliteration: 'halib', english: 'milk' }] },
  { name: 'Kha', transliteration: 'kh', sound: 'Like "ch" in Scottish "loch"', isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ', strokeHint: 'Same shape as Jim with one dot above', examples: [{ arabic: 'خبز', transliteration: 'khubz', english: 'bread' }, { arabic: 'أخ', transliteration: 'akh', english: 'brother' }] },
  { name: 'Dal', transliteration: 'd', sound: 'Like "d" in "dog"', isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد', strokeHint: 'Small right-angle stroke, right to left', examples: [{ arabic: 'دار', transliteration: 'dar', english: 'home' }, { arabic: 'ديك', transliteration: 'dik', english: 'rooster' }] },
  { name: 'Dhal', transliteration: 'dh', sound: 'Like "th" in "this"', isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ', strokeHint: 'Same as Dal with one dot above', examples: [{ arabic: 'ذهب', transliteration: 'dhahab', english: 'gold' }, { arabic: 'ذئب', transliteration: 'dhi\'b', english: 'wolf' }] },
  { name: 'Ra', transliteration: 'r', sound: 'Rolled "r", like Spanish "r"', isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر', strokeHint: 'Small hook, right to left', examples: [{ arabic: 'رجل', transliteration: 'rajul', english: 'man' }, { arabic: 'رأس', transliteration: 'ra\'s', english: 'head' }] },
  { name: 'Zay', transliteration: 'z', sound: 'Like "z" in "zoo"', isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز', strokeHint: 'Same as Ra with one dot above', examples: [{ arabic: 'زيت', transliteration: 'zayt', english: 'oil' }, { arabic: 'زهرة', transliteration: 'zahra', english: 'flower' }] },
  { name: 'Sin', transliteration: 's', sound: 'Like "s" in "sun"', isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس', strokeHint: 'Three teeth then a long swoop, right to left', examples: [{ arabic: 'سمك', transliteration: 'samak', english: 'fish' }, { arabic: 'شمس', transliteration: 'shams', english: 'sun' }] },
  { name: 'Shin', transliteration: 'sh', sound: 'Like "sh" in "ship"', isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش', strokeHint: 'Same as Sin with three dots above', examples: [{ arabic: 'شجرة', transliteration: 'shajara', english: 'tree' }, { arabic: 'شكرا', transliteration: 'shukran', english: 'thank you' }] },
  { name: 'Sad', transliteration: 's', sound: 'Emphatic "s" — tongue pressed to roof', isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص', strokeHint: 'Rounded loop then swoop, right to left', examples: [{ arabic: 'صباح', transliteration: 'sabah', english: 'morning' }, { arabic: 'صديق', transliteration: 'sadiq', english: 'friend' }] },
  { name: 'Dad', transliteration: 'd', sound: 'Emphatic "d" — unique to Arabic', isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض', strokeHint: 'Same as Sad with one dot above', examples: [{ arabic: 'ضوء', transliteration: 'daw\'', english: 'light' }, { arabic: 'أرض', transliteration: 'ard', english: 'earth' }] },
  { name: 'Ta (emphatic)', transliteration: 't', sound: 'Emphatic "t" — tongue pressed to roof', isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط', strokeHint: 'Tall loop with vertical stroke', examples: [{ arabic: 'طعام', transliteration: 'ta\'am', english: 'food' }, { arabic: 'طفل', transliteration: 'tifl', english: 'child' }] },
  { name: 'Dha (emphatic)', transliteration: 'dh', sound: 'Emphatic "dh" — heavier than Dhal', isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ', strokeHint: 'Same as Ta emphatic with one dot above', examples: [{ arabic: 'ظل', transliteration: 'dhil', english: 'shadow' }, { arabic: 'نظر', transliteration: 'nadhar', english: 'sight' }] },
  { name: 'Ayn', transliteration: '\'', sound: 'Deep throat constriction — no English equivalent', isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع', strokeHint: 'Like a reversed "c" shape', examples: [{ arabic: 'عين', transliteration: '\'ayn', english: 'eye' }, { arabic: 'عرب', transliteration: '\'arab', english: 'Arabs' }] },
  { name: 'Ghayn', transliteration: 'gh', sound: 'Like gargling — French "r" sound', isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ', strokeHint: 'Same as Ayn with one dot above', examples: [{ arabic: 'غداء', transliteration: 'ghada\'', english: 'lunch' }, { arabic: 'لغة', transliteration: 'lugha', english: 'language' }] },
  { name: 'Fa', transliteration: 'f', sound: 'Like "f" in "fan"', isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف', strokeHint: 'Small loop with one dot above', examples: [{ arabic: 'فيل', transliteration: 'fil', english: 'elephant' }, { arabic: 'فن', transliteration: 'fann', english: 'art' }] },
  { name: 'Qaf', transliteration: 'q', sound: 'Deep "k" from back of throat', isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق', strokeHint: 'Loop with two dots above, deeper tail', examples: [{ arabic: 'قلب', transliteration: 'qalb', english: 'heart' }, { arabic: 'قمر', transliteration: 'qamar', english: 'moon' }] },
  { name: 'Kaf', transliteration: 'k', sound: 'Like "k" in "king"', isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك', strokeHint: 'Upward stroke with inner hamza mark', examples: [{ arabic: 'كتاب', transliteration: 'kitab', english: 'book' }, { arabic: 'كلب', transliteration: 'kalb', english: 'dog' }] },
  { name: 'Lam', transliteration: 'l', sound: 'Like "l" in "lamp"', isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل', strokeHint: 'Tall vertical stroke curving right at bottom', examples: [{ arabic: 'ليل', transliteration: 'layl', english: 'night' }, { arabic: 'لبن', transliteration: 'laban', english: 'yogurt' }] },
  { name: 'Mim', transliteration: 'm', sound: 'Like "m" in "moon"', isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم', strokeHint: 'Small closed loop with tail dropping down', examples: [{ arabic: 'ماء', transliteration: 'ma\'', english: 'water' }, { arabic: 'مدينة', transliteration: 'madina', english: 'city' }] },
  { name: 'Nun', transliteration: 'n', sound: 'Like "n" in "noon"', isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن', strokeHint: 'Half-bowl shape with one dot above', examples: [{ arabic: 'نار', transliteration: 'nar', english: 'fire' }, { arabic: 'نجم', transliteration: 'najm', english: 'star' }] },
  { name: 'Ha', transliteration: 'h', sound: 'Light breathy "h" like sighing', isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه', strokeHint: 'Small circle/loop shape', examples: [{ arabic: 'هواء', transliteration: 'hawa\'', english: 'air' }, { arabic: 'وجه', transliteration: 'wajh', english: 'face' }] },
  { name: 'Waw', transliteration: 'w/oo', sound: 'Like "w" in "water" or "oo" in "moon"', isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو', strokeHint: 'Small head with tail dropping down', examples: [{ arabic: 'ولد', transliteration: 'walad', english: 'boy' }, { arabic: 'نور', transliteration: 'nur', english: 'light' }] },
  { name: 'Ya', transliteration: 'y/ee', sound: 'Like "y" in "yes" or "ee" in "see"', isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي', strokeHint: 'Curved stroke with two dots below', examples: [{ arabic: 'يد', transliteration: 'yad', english: 'hand' }, { arabic: 'يوم', transliteration: 'yawm', english: 'day' }] },
];

export class AlphabetView implements View {
  private selectedLetter: LetterData | null = null;
  private activeTab: 'alphabet' | 'practice' = 'alphabet';
  private tts = getTTSService();

  render(): HTMLElement {
    const container = document.createElement('div');
    this.renderContent(container);
    return container;
  }

  destroy(): void {
    this.tts.stop();
  }

  private renderContent(container: HTMLElement): void {
    let html = `
      <div class="view-header">
        <h2>Arabic Alphabet</h2>
        <p>Learn letters, forms, and build writing muscle memory</p>
      </div>

      <div class="alphabet-tabs">
        <button class="alphabet-tab ${this.activeTab === 'alphabet' ? 'active' : ''}" data-tab="alphabet">Letters</button>
        <button class="alphabet-tab ${this.activeTab === 'practice' ? 'active' : ''}" data-tab="practice">Writing Practice</button>
      </div>
    `;

    if (this.activeTab === 'practice') {
      html += this.renderPracticeSection();
    } else {
      html += this.renderAlphabetSection();
    }

    container.innerHTML = html;
    this.attachHandlers(container);
  }

  private renderAlphabetSection(): string {
    let html = '<div class="alphabet-grid">';

    for (const letter of ALPHABET) {
      const isSelected = this.selectedLetter?.name === letter.name;
      html += `
        <div class="alphabet-letter ${isSelected ? 'selected' : ''}" data-letter="${letter.name}">
          <span class="alphabet-char">${letter.isolated}</span>
          <span class="alphabet-name">${letter.name}</span>
        </div>
      `;
    }

    html += '</div>';

    if (this.selectedLetter) {
      const l = this.selectedLetter;
      html += `
        <div class="letter-detail fade-in">
          <div class="letter-detail-header">
            <div class="letter-detail-char">${l.isolated}</div>
            <div class="letter-detail-info">
              <h3>${l.name} <span style="color: var(--text-muted); font-weight: 400;">(${l.transliteration})</span></h3>
              <p class="letter-sound">${l.sound}</p>
              <button class="tts-btn tts-btn-inline" data-arabic="${l.isolated}" title="Listen to pronunciation">
                <svg class="tts-icon tts-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <svg class="tts-icon tts-icon-playing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
                <svg class="tts-icon tts-icon-loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                  <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
                </svg>
                <span>Listen</span>
              </button>
            </div>
          </div>

          <div class="letter-forms-section">
            <h4>Letter Forms</h4>
            <p class="letter-forms-hint">Arabic letters change shape depending on their position in a word</p>
            <div class="letter-forms">
              <div class="letter-form">
                <span class="form-char">${l.isolated}</span>
                <span class="form-label">Isolated</span>
              </div>
              <div class="letter-form">
                <span class="form-char">${l.initial}</span>
                <span class="form-label">Beginning</span>
              </div>
              <div class="letter-form">
                <span class="form-char">${l.medial}</span>
                <span class="form-label">Middle</span>
              </div>
              <div class="letter-form">
                <span class="form-char">${l.final}</span>
                <span class="form-label">End</span>
              </div>
            </div>
          </div>

          <div class="letter-stroke-section">
            <h4>How to Write</h4>
            <p class="stroke-hint">${l.strokeHint}</p>
            <p class="stroke-direction">Arabic is written <strong>right to left</strong>. Start from the right side.</p>
          </div>

          <div class="letter-examples-section">
            <h4>Example Words</h4>
            <div class="letter-examples">
              ${l.examples.map(ex => `
                <div class="letter-example">
                  <span class="example-arabic">${ex.arabic}</span>
                  <span class="example-translit">${ex.transliteration}</span>
                  <span class="example-english">${ex.english}</span>
                  <button class="tts-btn tts-btn-sm" data-arabic="${ex.arabic}" title="Listen">
                    <svg class="tts-icon tts-icon-play" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    <svg class="tts-icon tts-icon-playing" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                      <rect x="6" y="4" width="4" height="16"/>
                      <rect x="14" y="4" width="4" height="16"/>
                    </svg>
                    <svg class="tts-icon tts-icon-loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                      <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    return html;
  }

  private renderPracticeSection(): string {
    let html = '<div class="practice-section">';

    html += `
      <div class="practice-intro card">
        <p>Practice writing these words by hand on paper or a tablet. Start with Level 1 and work your way up.</p>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 8px;">
          Tip: Write each word 5-10 times. Focus on smooth connections between letters, not speed.
        </p>
      </div>
    `;

    for (const level of PRACTICE_LEVELS) {
      html += `
        <div class="practice-level">
          <h3>${level.title}</h3>
          <p class="practice-level-desc">${level.description}</p>
          <div class="practice-words">
      `;
      for (const word of level.words) {
        html += `
          <div class="practice-word card">
            <div class="practice-word-arabic">${word.arabic}</div>
            <div class="practice-word-info">
              <span class="practice-word-translit">${word.transliteration}</span>
              <span class="practice-word-english">${word.english}</span>
            </div>
            <button class="tts-btn tts-btn-practice" data-arabic="${word.arabic}" title="Listen to pronunciation">
              <svg class="tts-icon tts-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <svg class="tts-icon tts-icon-playing" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              <svg class="tts-icon tts-icon-loading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
              </svg>
              <span>Listen</span>
            </button>
            <div class="practice-word-tip">${word.tip}</div>
          </div>
        `;
      }
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }

  private attachHandlers(container: HTMLElement): void {
    // Tab switching
    container.querySelectorAll('.alphabet-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = (btn as HTMLElement).dataset.tab as 'alphabet' | 'practice';
        this.renderContent(container);
      });
    });

    // Letter click handlers (only in alphabet tab)
    container.querySelectorAll('.alphabet-letter').forEach(el => {
      el.addEventListener('click', () => {
        const name = (el as HTMLElement).dataset.letter;
        const letter = ALPHABET.find(l => l.name === name);
        if (letter) {
          this.selectedLetter = this.selectedLetter?.name === letter.name ? null : letter;
          this.renderContent(container);
        }
      });
    });

    // TTS button handlers
    container.querySelectorAll('.tts-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const arabic = (btn as HTMLElement).dataset.arabic;
        if (arabic) {
          this.playPronunciation(arabic, btn as HTMLButtonElement);
        }
      });
    });
  }

  private playPronunciation(text: string, btn: HTMLButtonElement): void {
    this.tts.speak(text, (state: TTSState) => {
      this.setButtonState(btn, state);
    });
  }

  private setButtonState(btn: HTMLButtonElement, state: TTSState): void {
    const playIcon = btn.querySelector('.tts-icon-play') as HTMLElement;
    const playingIcon = btn.querySelector('.tts-icon-playing') as HTMLElement;
    const loadingIcon = btn.querySelector('.tts-icon-loading') as HTMLElement;
    if (!playIcon || !playingIcon || !loadingIcon) return;

    playIcon.style.display = 'none';
    playingIcon.style.display = 'none';
    loadingIcon.style.display = 'none';

    btn.classList.remove('tts-playing', 'tts-loading', 'tts-error');

    switch (state) {
      case 'playing':
        playingIcon.style.display = 'block';
        btn.classList.add('tts-playing');
        break;
      case 'loading':
        loadingIcon.style.display = 'block';
        btn.classList.add('tts-loading');
        break;
      case 'error':
        playIcon.style.display = 'block';
        btn.classList.add('tts-error');
        break;
      default:
        playIcon.style.display = 'block';
        break;
    }
  }
}
