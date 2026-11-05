import { Injectable, inject, signal } from '@angular/core';
import { SpeechService } from './speech.service';

export interface A11ySettings {
  /** Tamanho do texto em porcentagem (100, 115, 130 ou 150). */
  fontScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
  /** Fonte de alta legibilidade (Atkinson Hyperlegible). */
  readableFont: boolean;
  /** Espaçamento de linhas, letras e palavras (WCAG 1.4.12). */
  textSpacing: boolean;
  underlineLinks: boolean;
  voiceEnabled: boolean;
  /** Lê em voz alta o elemento que recebe foco (teclado). */
  readOnFocus: boolean;
  voiceRate: number;
  voiceUri: string | null;
}

export const DEFAULT_A11Y: A11ySettings = {
  fontScale: 100,
  highContrast: false,
  reduceMotion: false,
  readableFont: false,
  textSpacing: false,
  underlineLinks: false,
  voiceEnabled: false,
  readOnFocus: false,
  voiceRate: 1,
  voiceUri: null,
};

const STORAGE_KEY = 'horizon-a11y';

/**
 * Preferências de acessibilidade do usuário. Aplicadas como classes no <html>
 * (estilos em styles/_horizon-a11y-dark.scss) e salvas no navegador.
 */
@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private speech = inject(SpeechService);

  readonly settings = signal<A11ySettings>(this.load());

  private readonly onFocusIn = (event: FocusEvent) => this.readFocused(event.target as HTMLElement | null);

  constructor() {
    this.apply(this.settings());
  }

  update(patch: Partial<A11ySettings>): void {
    const next = { ...this.settings(), ...patch };
    this.settings.set(next);
    this.apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // armazenamento indisponível: segue sem persistir
    }
  }

  reset(): void {
    this.speech.stop();
    this.update({ ...DEFAULT_A11Y });
  }

  private apply(s: A11ySettings): void {
    const root = document.documentElement;
    root.style.fontSize = s.fontScale === 100 ? '' : `${s.fontScale}%`;
    root.classList.toggle('a11y-high-contrast', s.highContrast);
    root.classList.remove('a11y-reduce-motion', 'a11y-readable-font', 'a11y-text-spacing', 'a11y-underline-links');

    this.speech.configure(s.voiceRate, s.voiceUri);
    document.removeEventListener('focusin', this.onFocusIn);
    if (s.voiceEnabled && s.readOnFocus) {
      document.addEventListener('focusin', this.onFocusIn);
    }
    if (!s.voiceEnabled) this.speech.stop();
  }

  private readFocused(el: HTMLElement | null): void {
    if (!el || el === document.body) return;
    if (el.closest('[data-no-speech]')) return;

    const labelled = (el as HTMLInputElement).labels?.[0]?.innerText;
    const name =
      el.getAttribute('aria-label') ||
      labelled ||
      el.innerText ||
      el.getAttribute('title') ||
      el.getAttribute('placeholder') ||
      '';
    const text = name.replace(/\s+/g, ' ').trim();
    if (!text) return;

    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role');
    let kind = '';
    if (tag === 'a') kind = 'link';
    else if (tag === 'button' || role === 'button') kind = 'botão';
    else if (tag === 'input' || tag === 'textarea') kind = 'campo de texto';
    else if (tag === 'select') kind = 'lista de opções';

    this.speech.speak(kind ? `${text}, ${kind}` : text);
  }

  private load(): A11ySettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_A11Y, ...JSON.parse(raw) };
    } catch {
      // ignora valores corrompidos
    }
    return { ...DEFAULT_A11Y };
  }
}
