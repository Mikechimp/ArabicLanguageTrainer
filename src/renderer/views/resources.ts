/**
 * Resources View
 *
 * Curated collection of YouTube pronunciation lessons organized by category.
 * Categories: Letter sounds (makharij), vowels, pronunciation drills, beginner words.
 * Each resource card opens the YouTube link in the default browser.
 */

import { View } from '../services/router';

interface Resource {
  title: string;
  description: string;
  url: string;
  category: ResourceCategory;
  level: 'Beginner' | 'Intermediate';
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
  // Arabic Letter Sounds (Makharij)
  {
    title: 'Arabic Alphabet Pronunciation — All 28 Letters',
    description: 'Clear pronunciation of every Arabic letter with mouth position guidance.',
    url: 'https://www.youtube.com/watch?v=iySKaBmFQfo',
    category: 'Arabic Letter Sounds (Makharij)',
    level: 'Beginner',
  },
  {
    title: 'Makharij Al-Huruf — Points of Articulation',
    description: 'Detailed explanation of where each Arabic sound is produced in the mouth.',
    url: 'https://www.youtube.com/watch?v=09RHCuL0Lwg',
    category: 'Arabic Letter Sounds (Makharij)',
    level: 'Beginner',
  },
  {
    title: 'Arabic Letters That Sound Similar — How to Tell Them Apart',
    description: 'Learn to distinguish between commonly confused letter pairs like ح/ه and ص/س.',
    url: 'https://www.youtube.com/watch?v=ORnOak6bVfY',
    category: 'Arabic Letter Sounds (Makharij)',
    level: 'Intermediate',
  },
  {
    title: 'Throat Letters in Arabic (Huruf Halqiyyah)',
    description: 'Master the guttural sounds unique to Arabic: ع غ ح خ ه ء.',
    url: 'https://www.youtube.com/watch?v=zVOaRCZjYlk',
    category: 'Arabic Letter Sounds (Makharij)',
    level: 'Intermediate',
  },

  // Short vs Long Vowels
  {
    title: 'Arabic Vowels Explained — Fatha, Kasra, Damma',
    description: 'Introduction to the three short vowels and how they change word meaning.',
    url: 'https://www.youtube.com/watch?v=WaSLMwGVWzQ',
    category: 'Short vs Long Vowels',
    level: 'Beginner',
  },
  {
    title: 'Short vs Long Vowels in Arabic',
    description: 'Understand the timing difference between short and long vowels with examples.',
    url: 'https://www.youtube.com/watch?v=SgAlz4EEOfE',
    category: 'Short vs Long Vowels',
    level: 'Beginner',
  },
  {
    title: 'Arabic Diacritics (Tashkeel) — Complete Guide',
    description: 'Covers fatha, kasra, damma, sukun, shadda, and tanwin marks.',
    url: 'https://www.youtube.com/watch?v=PO_VXFJn0nE',
    category: 'Short vs Long Vowels',
    level: 'Intermediate',
  },

  // Pronunciation Drills
  {
    title: 'Arabic Pronunciation Practice — Repeat After Me',
    description: 'Follow-along drill session covering all 28 letters with pauses for repetition.',
    url: 'https://www.youtube.com/watch?v=kp-0n-oPvzM',
    category: 'Pronunciation Drills',
    level: 'Beginner',
  },
  {
    title: 'Arabic Reading Practice for Beginners',
    description: 'Practice reading Arabic words and short phrases with guided pronunciation.',
    url: 'https://www.youtube.com/watch?v=PKFjNfOBwDU',
    category: 'Pronunciation Drills',
    level: 'Beginner',
  },
  {
    title: 'Emphatic Letters Drill — ص ض ط ظ',
    description: 'Focused practice on the four emphatic consonants that have no English equivalent.',
    url: 'https://www.youtube.com/watch?v=h6EpGXfNxH0',
    category: 'Pronunciation Drills',
    level: 'Intermediate',
  },

  // Common Beginner Words
  {
    title: '100 Most Common Arabic Words with Pronunciation',
    description: 'Learn the pronunciation of the 100 most frequently used Arabic words.',
    url: 'https://www.youtube.com/watch?v=J1gAHil89Z4',
    category: 'Common Beginner Words',
    level: 'Beginner',
  },
  {
    title: 'Arabic Greetings and Common Phrases',
    description: 'Essential greetings and conversational phrases with correct pronunciation.',
    url: 'https://www.youtube.com/watch?v=OoS3z2VKHMU',
    category: 'Common Beginner Words',
    level: 'Beginner',
  },
  {
    title: 'Numbers 1-100 in Arabic — Pronunciation Guide',
    description: 'Learn to pronounce Arabic numbers with clear, slow audio examples.',
    url: 'https://www.youtube.com/watch?v=T9FKcGJqoMo',
    category: 'Common Beginner Words',
    level: 'Beginner',
  },
  {
    title: 'Arabic Colors, Days, and Months Pronunciation',
    description: 'Everyday vocabulary categories with native-speaker pronunciation.',
    url: 'https://www.youtube.com/watch?v=3JBqjLZ-iHQ',
    category: 'Common Beginner Words',
    level: 'Intermediate',
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
        <p>Curated YouTube lessons for Arabic pronunciation</p>
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
              <span class="resource-level resource-level-${resource.level.toLowerCase()}">${resource.level}</span>
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
