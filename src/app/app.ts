import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from './core/services/theme.service';
import { AccessibilityService } from './core/services/accessibility.service';
import { SpeechService } from './core/services/speech.service';
import { SpeechControlComponent } from './shared/components/speech-control/speech-control.component';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';

@Component({
  imports: [RouterOutlet, SpeechControlComponent, CustomCursorComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('horizon-web');

  private readonly router = inject(Router);
  // Injetado para aplicar o tema salvo (claro/escuro) já na inicialização.
  private readonly theme = inject(ThemeService);
  // Aplica as preferências de acessibilidade salvas (fonte, contraste, voz...) na inicialização.
  private readonly a11y = inject(AccessibilityService);
  private readonly speech = inject(SpeechService);
  private firstNavigation = true;

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Na primeira carga o foco permanece no início da página (comportamento natural).
        if (this.firstNavigation) {
          this.firstNavigation = false;
          this.markMain();
          return;
        }
        // Em trocas de rota do SPA, leva o foco ao conteúdo principal
        // para que leitores de tela anunciem a nova página.
        setTimeout(() => this.focusMain(), 0);
      });
  }

  skipToMain(event: Event): void {
    event.preventDefault();
    this.focusMain();
  }

  /**
   * Esc fecha o modal aberto (WCAG 2.1.2 / padrão de diálogos).
   * Reaproveita o clique no fundo, que todos os modais do Horizon já tratam como "fechar".
   */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.speech.stop();
    const overlays = document.querySelectorAll<HTMLElement>(
      '.modal.show, .modal-backdrop-glass, .feedback-modal-backdrop, .deactivate-modal-backdrop'
    );
    const top = overlays[overlays.length - 1];
    top?.click();
  }

  private markMain(): void {
    setTimeout(() => {
      const main = document.querySelector('main');
      if (main) {
        main.id = 'main-content';
        main.setAttribute('tabindex', '-1');
      }
    }, 0);
  }

  private focusMain(): void {
    const main = document.querySelector('main') as HTMLElement | null;
    if (!main) return;
    main.id = 'main-content';
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
  }
}
