/**
 * Resources View
 *
 * Curated collection of YouTube channels and search-based links for Arabic
 * pronunciation lessons, organized by category.
 *
 * Link strategy:
 *   - Channel links point to verified, well-known Arabic learning YouTube channels
 *   - Topic links use YouTube search URLs that always return relevant results
 *   - This ensures links never go stale or 404
 */

import { View } from '../services/router';

interface Resource {
  title: string;
  description: string;
  url: string;
  category: ResourceCategory;
  level: 'Beginner' | 'Intermediate';
  type: 'channel' | 'search';
}

type ResourceCategory =
  | 'Arabic Letter Sounds (Makharij)'
  | 'Short vs Long Vowels'
  | 'Pronunciation Drills'
  | 'Common Beginner Words';

const RESOURCE_CATEGORIES: { name: ResourceCategory; icon: string; description: string }[] = [
  {
    name: 'Arabic Letter Sounds (Makharij)',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    description: 'Learn where each Arabic sound originates in the mouth and throat',
  },
  {
    name: 'Short vs Long Vowels',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
    description: 'Understand the critical difference between fatha/kasra/damma and their long forms',
  },
  {
    name: 'Pronunciation Drills',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    description: 'Repeat-after-me exercises to build muscle memory for Arabic sounds',
  },
  {
    name: 'Common Beginner Words',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    description: 'Hear correct pronunciation of the most common Arabic words for daily use',
  },
];

const RESOURCES: Resource[] = [
  // ── Arabic Letter Sounds (Makharij) ─────────────────────────────────

  {
    title: 'ArabicPod101 — Alphabet & Pronunciation Series',
    description: '30 video lessons covering every Arabic letter with pronunciation and common mistakes to avoid. 15-lesson "Alphabet Made Easy" series plus full pronunciation guide.',
    url: 'https://www.youtube.com/@ArabicPod101/search?query=alphabet%20pronunciation',
    category: 'Arabic Letter Sounds (Makharij)',
    level: 'Beginner',
    type: 'channel',
  },
  {
    title: 'Arabic 101 — Letters & Makharij (1M+ subscribers)',
    description: 'Professional linguistics-trained teacher covers reading, writing, and Tajweed including makharij across 12 structured playlists.',
    url: 'https://www.youtube.com/@Arabic101/search?query=alphabet+letters',
    category: 'Arabic Letter Sounds (Makharij)',
    level: 'Beginner',
    type: 'channel',
  },
  {
    title: 'Learn Arabic with Maha — Alphabet Lessons',
    description: 'Certified Arabic teacher Maha (636K+ subscribers) teaches the alphabet with pronunciation guides and cultural context.',
    url: 'https://www.youtube.com/@LearnArabicwithMaha/search?query=alphabet+letters',
    category: 'Arabic Letter Sounds (Makharij)',
    level: 'Beginner',
    type: 'channel',
  },
  {
    title: 'Makharij Al-Huruf — Points of Articulation',
    description: 'Learn exactly where each Arabic sound is produced in the mouth, throat, and tongue.',
    url: 'https://www.youtube.com/results?search_query=makharij+al+huruf+Arabic+articulation+points+lesson',
    category: 'Arabic Letter Sounds (Makharij)',
    level: 'Intermediate',
    type: 'search',
  },

  // ── Short vs Long Vowels ────────────────────────────────────────────

  {
    title: 'Arabic Vowels — Fatha, Kasra, Damma Explained',
    description: 'Introduction to the three short vowels and how they change word meaning.',
    url: 'https://www.youtube.com/results?search_query=Arabic+fatha+kasra+damma+short+vowels+beginner+lesson',
    category: 'Short vs Long Vowels',
    level: 'Beginner',
    type: 'search',
  },
  {
    title: 'Short vs Long Vowels in Arabic',
    description: 'Understand the timing difference between short and long vowels (alif, waw, ya) with examples.',
    url: 'https://www.youtube.com/results?search_query=Arabic+short+vs+long+vowels+pronunciation+difference',
    category: 'Short vs Long Vowels',
    level: 'Beginner',
    type: 'search',
  },
  {
    title: 'Arabic Diacritics (Tashkeel) — Complete Guide',
    description: 'Covers all diacritic marks: fatha, kasra, damma, sukun, shadda, and tanwin.',
    url: 'https://www.youtube.com/results?search_query=Arabic+tashkeel+diacritics+harakat+complete+guide',
    category: 'Short vs Long Vowels',
    level: 'Intermediate',
    type: 'search',
  },

  // ── Pronunciation Drills ────────────────────────────────────────────

  {
    title: 'Arabic Khatawaat — Step-by-Step Pronunciation',
    description: 'Over 280 videos with step-by-step Arabic sound, vocabulary, and phrase lessons at three difficulty levels.',
    url: 'https://www.youtube.com/channel/UCW2AgHPThj9_8raWYE2yjfw',
    category: 'Pronunciation Drills',
    level: 'Beginner',
    type: 'channel',
  },
  {
    title: 'Easy Arabic — Street Interviews with Subtitles',
    description: 'Real-world pronunciation exposure through native speaker interviews with Arabic and English subtitles. "Super Easy" sub-series for beginners.',
    url: 'https://www.youtube.com/results?search_query=Easy+Arabic+Easy+Languages+pronunciation+beginner',
    category: 'Pronunciation Drills',
    level: 'Beginner',
    type: 'search',
  },
  {
    title: 'Arabic Pronunciation Practice — Repeat After Me',
    description: 'Follow-along drill sessions covering Arabic letters and words with pauses for repetition.',
    url: 'https://www.youtube.com/results?search_query=Arabic+pronunciation+practice+repeat+after+me+beginner',
    category: 'Pronunciation Drills',
    level: 'Beginner',
    type: 'search',
  },
  {
    title: 'Emphatic Letters Drill — Sad, Dad, Ta, Dha',
    description: 'Focused practice on the four emphatic consonants (ص ض ط ظ) that have no English equivalent.',
    url: 'https://www.youtube.com/results?search_query=Arabic+emphatic+letters+pronunciation+sad+dad+ta+dha+practice',
    category: 'Pronunciation Drills',
    level: 'Intermediate',
    type: 'search',
  },

  // ── Common Beginner Words ───────────────────────────────────────────

  {
    title: 'Arabic with Toqa — Vocabulary & Phrases',
    description: 'Popular MSA-focused channel with vocabulary lessons and a playlist for learning Arabic through songs.',
    url: 'https://www.youtube.com/@ArabicwithToqa/search?query=words+vocabulary',
    category: 'Common Beginner Words',
    level: 'Beginner',
    type: 'channel',
  },
  {
    title: 'Madinah Arabic — Beginner Conversation Course',
    description: 'Nearly 70 videos in the beginner playlist with slow-speed explanations, Arabic writing subtitles, and romanized Arabic.',
    url: 'https://www.youtube.com/@MadinahArabicTuition/search?query=beginner+conversation',
    category: 'Common Beginner Words',
    level: 'Beginner',
    type: 'channel',
  },
  {
    title: 'Most Common Arabic Words — Pronunciation Guide',
    description: 'Learn the pronunciation of the most frequently used Arabic words for everyday conversation.',
    url: 'https://www.youtube.com/results?search_query=most+common+Arabic+words+pronunciation+beginner+100',
    category: 'Common Beginner Words',
    level: 'Beginner',
    type: 'search',
  },
  {
    title: 'Arabic Greetings & Essential Phrases',
    description: 'Essential greetings and conversational phrases (As-salamu alaykum, Shukran, etc.) with correct pronunciation.',
    url: 'https://www.youtube.com/results?search_query=Arabic+greetings+essential+phrases+pronunciation+beginner',
    category: 'Common Beginner Words',
    level: 'Beginner',
    type: 'search',
  },
];

export class ResourcesView implements View {
  private activeCategory: ResourceCategory | 'All' = 'All';
  private activeLevel: 'All' | 'Beginner' | 'Intermediate' = 'All';
  private searchQuery: string = '';

  render(): HTMLElement {
    const container = document.createElement('div');
    this.renderContent(container);
    return container;
  }

  private renderContent(container: HTMLElement): void {
    const filtered = this.getFilteredResources();

    container.innerHTML = `
      <div class="view-header">
        <h2>Resources</h2>
        <p>Curated YouTube channels and lessons for Arabic pronunciation</p>
      </div>

      <div class="resources-controls">
        <div class="resources-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" class="resources-search-input" placeholder="Search resources..." value="${this.searchQuery}" />
        </div>
        <div class="resources-level-filter">
          <button class="filter-btn ${this.activeLevel === 'All' ? 'active' : ''}" data-level="All">All Levels</button>
          <button class="filter-btn ${this.activeLevel === 'Beginner' ? 'active' : ''}" data-level="Beginner">Beginner</button>
          <button class="filter-btn ${this.activeLevel === 'Intermediate' ? 'active' : ''}" data-level="Intermediate">Intermediate</button>
        </div>
      </div>

      <div class="resources-categories">
        <button class="resources-cat-btn ${this.activeCategory === 'All' ? 'active' : ''}" data-category="All">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          <span>All Topics</span>
          <span class="resources-cat-count">${RESOURCES.length}</span>
        </button>
        ${RESOURCE_CATEGORIES.map(cat => {
          const count = RESOURCES.filter(r => r.category === cat.name).length;
          return `
            <button class="resources-cat-btn ${this.activeCategory === cat.name ? 'active' : ''}" data-category="${cat.name}">
              ${cat.icon}
              <span>${cat.name}</span>
              <span class="resources-cat-count">${count}</span>
            </button>
          `;
        }).join('')}
      </div>

      ${this.activeCategory !== 'All' ? `
        <div class="resources-cat-desc">
          ${RESOURCE_CATEGORIES.find(c => c.name === this.activeCategory)?.description || ''}
        </div>
      ` : ''}

      <div class="resources-grid">
        ${filtered.length > 0 ? filtered.map(resource => `
          <a class="resource-card" href="${resource.url}" target="_blank" rel="noopener noreferrer">
            <div class="resource-card-header">
              <div class="resource-badges">
                <span class="resource-level resource-level-${resource.level.toLowerCase()}">${resource.level}</span>
                <span class="resource-type resource-type-${resource.type}">${resource.type === 'channel' ? 'Channel' : 'Search'}</span>
              </div>
              <svg class="resource-external" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </div>
            <div class="resource-card-body">
              <div class="resource-play-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <h3 class="resource-title">${resource.title}</h3>
              <p class="resource-description">${resource.description}</p>
            </div>
            <div class="resource-card-footer">
              <span class="resource-category-tag">${resource.category}</span>
            </div>
          </a>
        `).join('') : `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p>No resources match your filters</p>
          </div>
        `}
      </div>
    `;

    this.attachHandlers(container);
  }

  private getFilteredResources(): Resource[] {
    let filtered = RESOURCES;

    if (this.activeCategory !== 'All') {
      filtered = filtered.filter(r => r.category === this.activeCategory);
    }

    if (this.activeLevel !== 'All') {
      filtered = filtered.filter(r => r.level === this.activeLevel);
    }

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  private attachHandlers(container: HTMLElement): void {
    // Category filter
    container.querySelectorAll('.resources-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeCategory = (btn as HTMLElement).dataset.category as ResourceCategory | 'All';
        this.renderContent(container);
      });
    });

    // Level filter
    container.querySelectorAll('.resources-level-filter .filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeLevel = (btn as HTMLElement).dataset.level as 'All' | 'Beginner' | 'Intermediate';
        this.renderContent(container);
      });
    });

    // Search input
    const searchInput = container.querySelector('.resources-search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchQuery = searchInput.value;
        this.renderContent(container);
        // Re-focus and set cursor position after re-render
        const newInput = container.querySelector('.resources-search-input') as HTMLInputElement;
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });
    }

    // Open links — in Electron use shell.openExternal, otherwise fallback to target="_blank"
    container.querySelectorAll('.resource-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const url = (card as HTMLAnchorElement).href;
        if (window.electronAPI?.openExternal) {
          e.preventDefault();
          window.electronAPI.openExternal(url);
        }
        // Otherwise, the anchor's target="_blank" handles it
      });
    });
  }
}
