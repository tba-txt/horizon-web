import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../../core/services/accessibility.service';
import { SpeechService } from '../../../core/services/speech.service';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Controles rápidos de acessibilidade e tema fixados na lateral direita:
 * 1. Toggles modernos de Modo Escuro e Alto Contraste.
 * 2. Aba deslizante "Ler página" com microfone (padrão puxador idêntico ao quiz de destinations).
 */
@Component({
  selector: 'app-speech-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="floating-controls-dock" aria-label="Controles rápidos de acessibilidade e tema" data-no-speech>
      
      <!-- Toggles Rápidos no Canto Direito: Modo Escuro e Alto Contraste -->
      <div class="theme-toggles-cluster shadow-sm">
        <!-- Toggle Modo Escuro / Claro -->
        <button 
          type="button" 
          class="toggle-btn"
          [class.is-active]="theme.theme() === 'dark'"
          (click)="theme.toggle()"
          [attr.aria-label]="theme.theme() === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'"
          [attr.title]="theme.theme() === 'dark' ? 'Modo claro' : 'Modo escuro'"
        >
          @if (theme.theme() === 'dark') {
            <i class="bi bi-sun-fill" aria-hidden="true"></i>
          } @else {
            <i class="bi bi-moon-stars-fill" aria-hidden="true"></i>
          }
        </button>

        <!-- Toggle Alto Contraste -->
        <button 
          type="button" 
          class="toggle-btn"
          [class.is-active]="a11y.settings().highContrast"
          (click)="toggleContrast()"
          [attr.aria-label]="a11y.settings().highContrast ? 'Desativar alto contraste' : 'Ativar alto contraste'"
          title="Alto contraste"
        >
          <i class="bi bi-circle-half" aria-hidden="true"></i>
        </button>
      </div>

      <!-- Aba Puxador de Leitura em Voz Alta (Lateral direita com Microfone) -->
      @if (a11y.settings().voiceEnabled && speech.supported) {
        <div class="speech-tab-wrapper">
          <button 
            type="button" 
            class="btn-floating-speech"
            [class.is-speaking]="speech.speaking()"
            [class.is-expanded]="isExpanded()"
            (mouseenter)="isExpanded.set(true)"
            (mouseleave)="isExpanded.set(false)"
            (click)="toggleSpeech()"
            [attr.aria-label]="speech.speaking() ? 'Parar leitura em voz alta' : 'Ler esta página em voz alta'"
          >
            <i class="bi speech-icon" [class.bi-mic-fill]="!speech.speaking()" [class.bi-stop-fill]="speech.speaking()" aria-hidden="true"></i>
            <span class="speech-tab-text">
              {{ speech.speaking() ? 'Parar leitura' : 'Ler página' }}
            </span>
          </button>
        </div>
      }

    </aside>
  `,
  styles: [`
    .floating-controls-dock {
      position: fixed;
      right: 0;
      top: 32%;
      transform: translateY(-50%);
      z-index: 1045;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      pointer-events: none;
      user-select: none;
    }

    /* Container de Toggles (Modo Escuro + Alto Contraste) */
    .theme-toggles-cluster {
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      gap: 5px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1.5px solid #cbd5e1;
      border-right: none;
      border-radius: 12px 0 0 12px;
      padding: 6px;
      transition: background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
      box-shadow: 0 8px 20px rgba(11, 37, 69, 0.12);
    }

    .toggle-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: #475569;
      font-size: 1.05rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        background: rgba(91, 164, 216, 0.15);
        color: #5BA4D8;
        transform: scale(1.08);
      }

      &.is-active {
        background: #5BA4D8;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(91, 164, 216, 0.4);
      }
    }

    /* Aba Deslizante de Leitura (Docked no lado direito) */
    .speech-tab-wrapper {
      pointer-events: auto;
    }

    .btn-floating-speech {
      position: relative;
      height: 42px;
      min-width: 140px;
      background-color: #5BA4D8;
      color: #ffffff;
      border: 1.5px solid rgba(255, 255, 255, 0.85);
      border-right: none;
      border-radius: 12px 0 0 12px;
      display: flex;
      align-items: center;
      padding: 0 14px;
      gap: 9px;
      cursor: pointer;
      font-size: 0.88rem;
      font-weight: 700;
      letter-spacing: -0.2px;
      box-shadow: 0 6px 18px rgba(91, 164, 216, 0.35);
      transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, box-shadow 0.25s ease;
      transform: translateX(calc(100% - 44px));

      &:hover,
      &.is-expanded,
      &.is-speaking {
        transform: translateX(0);
        box-shadow: 0 10px 24px rgba(11, 37, 69, 0.28);
      }

      &.is-speaking {
        background-color: #dc2626;
        animation: pulseSpeak 2s infinite ease-in-out;
      }

      .speech-icon {
        font-size: 1.15rem;
        flex-shrink: 0;
      }

      .speech-tab-text {
        white-space: nowrap;
        font-weight: 700;
      }
    }

    @keyframes pulseSpeak {
      0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.6); }
      50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
    }

    /* Ajustes no Modo Escuro */
    :host-context([data-theme='dark']) {
      .theme-toggles-cluster {
        background: rgba(30, 41, 59, 0.95);
        border-color: #475569;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
      }
      .toggle-btn {
        color: #cbd5e1;
        &:hover {
          background: rgba(91, 164, 216, 0.25);
          color: #8cc4ec;
        }
        &.is-active {
          background: #5BA4D8;
          color: #ffffff;
        }
      }
      .btn-floating-speech {
        border-color: rgba(255, 255, 255, 0.35);
      }
    }

    /* Em telas pequenas/celular (abaixo de 992px), oculta completamente os controles flutuantes
       para não cobrir o conteúdo nem atrapalhar a visão do usuário mobile.
       As opções continuam acessíveis no menu hambúrguer e em /profile (Acessibilidade). */
    @media (max-width: 991.98px) {
      :host,
      .floating-controls-dock {
        display: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    }
  `]
})
export class SpeechControlComponent {
  readonly a11y = inject(AccessibilityService);
  readonly speech = inject(SpeechService);
  readonly theme = inject(ThemeService);

  readonly isExpanded = signal<boolean>(false);

  toggleContrast(): void {
    const current = this.a11y.settings().highContrast;
    this.a11y.update({ highContrast: !current });
  }

  toggleSpeech(): void {
    if (this.speech.speaking()) {
      this.speech.stop();
    } else {
      this.speech.readPage();
    }
  }
}
