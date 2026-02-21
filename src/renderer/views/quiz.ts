/**
 * Quiz View
 *
 * Interactive quiz that tests vocabulary knowledge.
 * Shows Arabic text and asks the user to select the correct English translation.
 * Tracks correct/incorrect answers and reports results to the backend.
 */

import { View } from '../services/router';
import { ApiClient, QuizQuestion } from '../services/api-client';

export class QuizView implements View {
  private questions: QuizQuestion[] = [];
  private currentIndex = 0;
  private score = 0;
  private streak = 0;
  private container: HTMLElement | null = null;

  constructor(private api: ApiClient) {}

  render(): HTMLElement {
    this.container = document.createElement('div');
    this.container.className = 'quiz-container';
    this.showStartScreen();
    return this.container;
  }

  private showStartScreen(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="view-header" style="text-align: center;">
        <h2>Arabic Quiz</h2>
        <p>Test your vocabulary knowledge. Match the Arabic word to its English meaning.</p>
      </div>

      <div style="text-align: center; padding: 48px 0;">
        <div style="font-family: var(--font-arabic); font-size: 4rem; color: var(--accent-primary); margin-bottom: 24px;">
          اختبار
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 32px; font-size: 1.1rem;">
          10 questions, multiple choice
        </p>
        <button class="btn btn-primary btn-lg" id="start-quiz">Start Quiz</button>
      </div>
    `;

    this.container.querySelector('#start-quiz')?.addEventListener('click', () => {
      this.startQuiz();
    });
  }

  private async startQuiz(): Promise<void> {
    try {
      this.questions = await this.api.getQuiz();
      this.currentIndex = 0;
      this.score = 0;
      this.streak = 0;
      this.showQuestion();
    } catch {
      if (this.container) {
        this.container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">!</div>
            <p>Failed to load quiz. Please try again.</p>
            <button class="btn btn-primary" id="retry-quiz" style="margin-top: 16px;">Retry</button>
          </div>
        `;
        this.container.querySelector('#retry-quiz')?.addEventListener('click', () => {
          this.startQuiz();
        });
      }
    }
  }

  private showQuestion(): void {
    if (!this.container) return;
    const q = this.questions[this.currentIndex];

    const progress = ((this.currentIndex) / this.questions.length) * 100;

    this.container.innerHTML = `
      <div class="quiz-progress">
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="quiz-progress-text">${this.currentIndex + 1} / ${this.questions.length}</span>
      </div>

      <div class="quiz-card">
        <div class="quiz-arabic">${q.arabic}</div>
        <div class="quiz-transliteration">${q.transliteration}</div>
      </div>

      <div class="quiz-options">
        ${q.options.map((option, i) => `
          <button class="quiz-option" data-answer="${this.escapeHtml(option)}" data-index="${i}">
            ${option}
          </button>
        `).join('')}
      </div>

      <div style="text-align: center; margin-top: 16px;">
        <span style="color: var(--text-muted); font-size: 0.85rem;">
          Score: ${this.score} | Streak: ${this.streak}
        </span>
      </div>
    `;

    // Attach click handlers
    this.container.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        this.handleAnswer(btn as HTMLButtonElement, q);
      });
    });
  }

  private async handleAnswer(button: HTMLButtonElement, question: QuizQuestion): Promise<void> {
    const answer = button.dataset.answer || '';
    const correct = answer === question.correctAnswer;

    // Disable all buttons
    this.container?.querySelectorAll('.quiz-option').forEach(btn => {
      (btn as HTMLButtonElement).disabled = true;
      if (btn.getAttribute('data-answer') === question.correctAnswer) {
        btn.classList.add('correct');
      }
    });

    if (correct) {
      button.classList.add('correct');
      this.score++;
      this.streak++;
    } else {
      button.classList.add('incorrect');
      this.streak = 0;
    }

    // Report to backend
    try {
      const result = await this.api.submitAnswer(question.vocabularyId, correct);
      this.streak = result.streak;
    } catch {
      // Continue even if reporting fails
    }

    // Move to next question after a delay
    setTimeout(() => {
      this.currentIndex++;
      if (this.currentIndex < this.questions.length) {
        this.showQuestion();
      } else {
        this.showResults();
      }
    }, 1200);
  }

  private showResults(): void {
    if (!this.container) return;

    const percentage = Math.round((this.score / this.questions.length) * 100);
    const message = percentage >= 90 ? 'Outstanding!' :
                    percentage >= 70 ? 'Great job!' :
                    percentage >= 50 ? 'Good effort!' : 'Keep practicing!';

    this.container.innerHTML = `
      <div class="quiz-results">
        <h3>${message}</h3>
        <div class="results-score">${this.score}/${this.questions.length}</div>
        <div class="results-label">${percentage}% correct</div>

        <div style="display: flex; gap: 16px; justify-content: center; margin-top: 24px;">
          <button class="btn btn-primary btn-lg" id="quiz-retry">Take Another Quiz</button>
          <button class="btn btn-secondary btn-lg" id="quiz-home">Back to Dashboard</button>
        </div>
      </div>
    `;

    this.container.querySelector('#quiz-retry')?.addEventListener('click', () => {
      this.startQuiz();
    });

    this.container.querySelector('#quiz-home')?.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view="dashboard"]')?.dispatchEvent(new Event('click'));
    });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
