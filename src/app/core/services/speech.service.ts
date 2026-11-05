import { Injectable, signal } from '@angular/core';

/**
 * Leitura em voz alta usando a Web Speech API (speechSynthesis), nativa do navegador.
 * Não envia nenhum dado a servidores da Horizon.
 */
@Injectable({ providedIn: 'root' })
export class SpeechService {
  readonly supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  readonly voices = signal<SpeechSynthesisVoice[]>([]);
  readonly speaking = signal(false);

  private rate = 1;
  private voiceUri: string | null = null;
  private token = 0;

  constructor() {
    if (!this.supported) return;
    this.loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => this.loadVoices());
  }

  configure(rate: number, voiceUri: string | null): void {
    this.rate = rate;
    this.voiceUri = voiceUri;
  }

  /** Fala o texto. Por padrão interrompe qualquer leitura em andamento. */
  speak(text: string, interrupt = true): void {
    if (!this.supported) return;
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return;

    if (interrupt) this.stop();
    const myToken = ++this.token;
    const chunks = this.chunk(clean);
    const voice = this.pickVoice();

    this.speaking.set(true);
    chunks.forEach((part, index) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = voice?.lang ?? 'pt-BR';
      if (voice) utterance.voice = voice;
      utterance.rate = this.rate;
      const finish = () => {
        // Ignora o fim de leituras antigas que já foram canceladas
        if (myToken === this.token && index === chunks.length - 1) this.speaking.set(false);
      };
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (!this.supported) return;
    this.token++;
    window.speechSynthesis.cancel();
    this.speaking.set(false);
  }

  /** Lê o conteúdo visível do <main> da página atual. */
  readPage(): void {
    const text = this.extractMainText();
    this.speak(text ? `${document.title}. ${text}` : document.title);
  }

  private loadVoices(): void {
    const all = window.speechSynthesis.getVoices();
    const portuguese = all.filter(v => v.lang.toLowerCase().startsWith('pt'));
    this.voices.set(portuguese.length ? portuguese : all);
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    const list = this.voices();
    if (this.voiceUri) {
      const chosen = list.find(v => v.voiceURI === this.voiceUri);
      if (chosen) return chosen;
    }
    return (
      list.find(v => v.lang.toLowerCase() === 'pt-br') ??
      list.find(v => v.lang.toLowerCase().startsWith('pt')) ??
      null
    );
  }

  /** Divide em trechos curtos: alguns navegadores interrompem falas muito longas. */
  private chunk(text: string): string[] {
    const sentences = text.split(/(?<=[.!?:;])\s+/);
    const parts: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      if ((current + ' ' + sentence).trim().length > 180 && current) {
        parts.push(current.trim());
        current = sentence;
      } else {
        current = (current + ' ' + sentence).trim();
      }
    }
    if (current) parts.push(current.trim());
    return parts;
  }

  private extractMainText(): string {
    const main = document.querySelector('main');
    if (!main) return '';
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    const pieces: string[] = [];
    let lastHeading: Element | null = null;

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      const text = node.textContent?.replace(/\s+/g, ' ').trim();
      if (!parent || !text) continue;
      if (parent.closest('[aria-hidden="true"], script, style, noscript, svg, [hidden]')) continue;
      if (parent.getClientRects().length === 0) continue; // invisível

      const heading = parent.closest('h1, h2, h3, h4, h5, h6');
      if (lastHeading && heading !== lastHeading && pieces.length) {
        // pausa após títulos
        const prev = pieces[pieces.length - 1];
        if (!/[.!?:;]$/.test(prev)) pieces[pieces.length - 1] = prev + '.';
      }
      lastHeading = heading;
      pieces.push(text);
    }
    return pieces.join(' ');
  }
}
