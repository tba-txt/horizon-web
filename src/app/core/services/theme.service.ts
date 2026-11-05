import { Injectable, signal } from '@angular/core';

export type HorizonTheme = 'light' | 'dark';

const STORAGE_KEY = 'horizon-theme';

/**
 * Controla o modo claro/escuro. Respeita a preferência do sistema
 * (prefers-color-scheme) até o usuário escolher manualmente.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<HorizonTheme>(this.initialTheme());

  constructor() {
    this.apply(this.theme());

    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Só acompanha o sistema se o usuário ainda não escolheu manualmente.
        if (!this.storedTheme()) {
          this.set(e.matches ? 'dark' : 'light', false);
        }
      });
    }
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: HorizonTheme, persist = true): void {
    this.theme.set(theme);
    this.apply(theme);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // armazenamento indisponível: segue sem persistir
      }
    }
  }

  private apply(theme: HorizonTheme): void {
    const root = document.documentElement;
    root.setAttribute('data-bs-theme', theme);
    root.setAttribute('data-theme', theme);
  }

  private storedTheme(): HorizonTheme | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch {
      return null;
    }
  }

  private initialTheme(): HorizonTheme {
    const stored = this.storedTheme();
    if (stored) return stored;
    return typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
}
