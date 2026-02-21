/**
 * Client-Side Router
 *
 * A simple view router for single-page desktop applications.
 * Each "view" is a class that renders into the content area.
 *
 * This is a fundamental pattern in desktop app architecture:
 *   - VS Code uses a similar system for its panels/views
 *   - VSTS uses React Router (same concept, different library)
 *
 * In a real production app, you'd likely use React Router, Vue Router, etc.
 * This vanilla implementation teaches you what those libraries do under the hood.
 */

export interface View {
  render(): HTMLElement;
  destroy?(): void;
}

type ViewFactory = () => View;

export class Router {
  private container: HTMLElement;
  private views: Map<string, ViewFactory> = new Map();
  private currentView: View | null = null;
  private currentViewName: string = '';

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Router container #${containerId} not found`);
    this.container = el;
  }

  register(name: string, factory: ViewFactory): void {
    this.views.set(name, factory);
  }

  navigate(name: string): void {
    if (name === this.currentViewName) return;

    // Destroy current view (cleanup event listeners, timers, etc.)
    if (this.currentView?.destroy) {
      this.currentView.destroy();
    }

    // Get the view factory
    const factory = this.views.get(name);
    if (!factory) {
      console.error(`[Router] View "${name}" not registered`);
      return;
    }

    // Create and render the new view
    this.currentView = factory();
    this.currentViewName = name;

    const element = this.currentView.render();
    element.classList.add('fade-in');

    this.container.innerHTML = '';
    this.container.appendChild(element);
  }
}
