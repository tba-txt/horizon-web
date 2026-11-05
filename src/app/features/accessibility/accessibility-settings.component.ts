import { Component, computed, inject } from '@angular/core';
import { A11ySettings, AccessibilityService } from '../../core/services/accessibility.service';
import { SpeechService } from '../../core/services/speech.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-accessibility-settings',
  standalone: true,
  template: `
    <div class="a11y-settings">
      <div class="a11y-grid">
        <!-- Card 1: Aparência -->
        <section class="a11y-block" aria-labelledby="a11y-appearance">
          <h2 id="a11y-appearance" class="a11y-block-title">Aparência</h2>

          <div class="a11y-row">
            <div class="a11y-row-text">
              <label for="a11y-dark" class="a11y-label">Modo escuro</label>
              <span class="a11y-hint">Fundo escuro que cansa menos a vista em ambientes com pouca luz.</span>
            </div>
            <div class="form-check form-switch">
              <input id="a11y-dark" class="form-check-input" type="checkbox" role="switch"
                [checked]="theme.theme() === 'dark'" (change)="theme.toggle()" />
            </div>
          </div>

          <div class="a11y-row">
            <div class="a11y-row-text">
              <label for="a11y-contrast" class="a11y-label">Alto contraste</label>
              <span class="a11y-hint">Texto e bordas com destaque máximo para leitura facilitada.</span>
            </div>
            <div class="form-check form-switch">
              <input id="a11y-contrast" class="form-check-input" type="checkbox" role="switch"
                [checked]="s().highContrast" (change)="toggle('highContrast', $event)" />
            </div>
          </div>
        </section>

        <!-- Card 2: Texto -->
        <section class="a11y-block" aria-labelledby="a11y-text">
          <h2 id="a11y-text" class="a11y-block-title">Texto</h2>

          <div class="a11y-row a11y-row-column">
            <span class="a11y-label" id="a11y-font-size-label">Tamanho do texto</span>
            <div class="a11y-size-group" role="group" aria-labelledby="a11y-font-size-label">
              @for (option of sizeOptions; track option.value) {
                <button type="button" class="a11y-size-btn"
                  [class.active]="s().fontScale === option.value"
                  [attr.aria-pressed]="s().fontScale === option.value"
                  [style.font-size.px]="option.preview"
                  (click)="setSize(option.value)">
                  {{ option.label }}
                </button>
              }
            </div>
          </div>
        </section>

        <!-- Card 3: Leitura em voz alta -->
        <section class="a11y-block" aria-labelledby="a11y-voice">
          <h2 id="a11y-voice" class="a11y-block-title">Leitura em voz alta</h2>

          @if (!speech.supported) {
            <p class="a11y-warning" role="status">
              Este navegador não oferece leitura em voz alta. Experimente o Chrome, Edge ou Safari atualizados.
            </p>
          }

          <div class="a11y-row">
            <div class="a11y-row-text">
              <label for="a11y-voice-on" class="a11y-label">Ativar leitura em voz alta</label>
              <span class="a11y-hint">Mostra o botão "Ler página" no canto da tela e permite ouvir o conteúdo.</span>
            </div>
            <div class="form-check form-switch">
              <input id="a11y-voice-on" class="form-check-input" type="checkbox" role="switch"
                [disabled]="!speech.supported"
                [checked]="s().voiceEnabled" (change)="toggle('voiceEnabled', $event)" />
            </div>
          </div>

          @if (s().voiceEnabled) {
            <div class="a11y-row">
              <div class="a11y-row-text">
                <label for="a11y-voice-focus" class="a11y-label">Ler o item selecionado</label>
                <span class="a11y-hint">Ao navegar com a tecla Tab, lê em voz alta o botão, link ou campo em foco.</span>
              </div>
              <div class="form-check form-switch">
                <input id="a11y-voice-focus" class="form-check-input" type="checkbox" role="switch"
                  [checked]="s().readOnFocus" (change)="toggle('readOnFocus', $event)" />
              </div>
            </div>

            <div class="a11y-row a11y-row-column">
              <label for="a11y-rate" class="a11y-label">
                Velocidade da voz: <strong>{{ rateLabel() }}</strong>
              </label>
              <input id="a11y-rate" class="form-range" type="range" min="0.6" max="1.5" step="0.1"
                [value]="s().voiceRate" (input)="setRate($event)"
                [attr.aria-valuetext]="rateLabel()" />
            </div>

            @if (speech.voices().length > 1) {
              <div class="a11y-row a11y-row-column">
                <label for="a11y-voice-select" class="a11y-label">Voz</label>
                <select id="a11y-voice-select" class="form-select" (change)="setVoice($event)">
                  @for (voice of speech.voices(); track voice.voiceURI) {
                    <option [value]="voice.voiceURI" [selected]="voice.voiceURI === s().voiceUri">
                      {{ voice.name }} ({{ voice.lang }})
                    </option>
                  }
                </select>
              </div>
            }

            <div class="a11y-actions">
              <button type="button" class="a11y-btn" (click)="test()">Testar voz</button>
              <button type="button" class="a11y-btn" (click)="speech.readPage()">Ler esta página</button>
              <button type="button" class="a11y-btn" (click)="speech.stop()">Parar leitura</button>
            </div>
          }
        </section>

        <!-- Card 4: Atalhos de teclado -->
        <section class="a11y-block" aria-labelledby="a11y-keyboard">
          <h2 id="a11y-keyboard" class="a11y-block-title">Atalhos de teclado</h2>
          <ul class="a11y-shortcuts">
            <li><kbd>Tab</kbd> e <kbd>Shift</kbd> + <kbd>Tab</kbd>: avançar e voltar entre itens.</li>
            <li><kbd>Enter</kbd> ou <kbd>Espaço</kbd>: ativar o item selecionado, inclusive confirmar uma opção no quiz.</li>
            <li>No quiz, use as teclas de seta para a direita e para a esquerda para trocar de carta.</li>
            <li><kbd>Esc</kbd>: fechar janelas e interromper a leitura em voz alta.</li>
            <li>O link "Pular para o conteúdo" aparece ao apertar <kbd>Tab</kbd> logo que a página abre.</li>
          </ul>
        </section>
      </div>

      <div class="a11y-footer-actions">
        <button type="button" class="a11y-btn-reset" (click)="reset()">
          <i class="bi bi-sliders me-2" aria-hidden="true"></i>
          Restaurar preferências padrão
        </button>
      </div>
    </div>
  `,
  styles: [`
    .a11y-settings { width: 100%; }
    .a11y-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    @media (min-width: 992px) {
      .a11y-grid {
        grid-template-columns: 1fr 1fr;
        align-items: stretch;
      }
    }
    .a11y-block {
      background: var(--bs-body-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: border-color 0.2s ease, background-color 0.2s ease;
    }
    .a11y-block-title { font-size: 1.15rem; font-weight: 700; margin: 0 0 0.85rem; color: var(--bs-body-color); }
    .a11y-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.6rem 0;
    }
    .a11y-row-column { flex-direction: column; align-items: stretch; gap: 0.5rem; }
    .a11y-row-text { display: flex; flex-direction: column; gap: 2px; }
    .a11y-label { font-weight: 600; color: var(--bs-body-color); }
    .a11y-hint { font-size: 0.875rem; color: var(--bs-secondary-color); }
    .a11y-warning {
      padding: 0.75rem 1rem;
      border-radius: 10px;
      background: rgba(217, 119, 6, 0.14);
      color: var(--bs-body-color);
    }
    .form-switch .form-check-input { width: 3em; height: 1.5em; cursor: pointer; }
    .form-check-input:checked { background-color: #5BA4D8; border-color: #5BA4D8; }
    .a11y-size-group { display: flex; flex-wrap: wrap; gap: 0.6rem; }
    .a11y-size-btn {
      min-width: 64px;
      min-height: 48px;
      padding: 0 1rem;
      border-radius: 10px;
      border: 2px solid var(--bs-border-color);
      background: var(--bs-body-bg);
      color: var(--bs-body-color);
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .a11y-size-btn.active { background: #5BA4D8; border-color: #5BA4D8; color: #ffffff; }
    .a11y-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.75rem; }
    .a11y-btn {
      min-height: 44px;
      padding: 0 1.1rem;
      border-radius: 10px;
      border: 2px solid #5BA4D8;
      background: transparent;
      color: var(--bs-body-color);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .a11y-btn:hover { background: rgba(91, 164, 216, 0.16); }

    .a11y-footer-actions { margin-top: 1.5rem; display: flex; justify-content: flex-start; }
    .a11y-btn-reset {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0.65rem 1.4rem;
      border-radius: 10px;
      border: 1.5px solid #cbd5e1;
      background: var(--bs-body-bg);
      color: var(--bs-body-color);
      font-weight: 600;
      font-size: 0.92rem;
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      i {
        font-size: 1.05rem;
        color: #5BA4D8;
        transition: color 0.2s ease;
      }

      &:hover {
        background: rgba(91, 164, 216, 0.08);
        border-color: #5BA4D8;
        color: #5BA4D8;
        box-shadow: 0 4px 12px rgba(91, 164, 216, 0.15);
        transform: translateY(-1px);

        i {
          color: #5BA4D8;
        }
      }

      &:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }
    }

    .a11y-shortcuts { padding-left: 1.2rem; margin-bottom: 0.5rem; }
    .a11y-shortcuts li { margin-bottom: 0.4rem; }
    kbd {
      padding: 2px 7px;
      border-radius: 6px;
      background: var(--bs-tertiary-bg);
      color: var(--bs-body-color);
      border: 1px solid var(--bs-border-color);
      font-size: 0.85em;
    }

    /* Adaptações do componente para Dark Mode */
    :host-context([data-theme='dark']) {
      .a11y-block {
        background-color: #1e293b !important;
        border-color: #334155 !important;
      }
      .a11y-size-btn {
        background-color: #1e293b;
        border-color: #475569;
        color: #e2e8f0;
        &.active {
          background-color: #5BA4D8;
          border-color: #5BA4D8;
          color: #ffffff;
        }
      }
      .a11y-btn-reset {
        background-color: #1e293b;
        border-color: #475569;
        color: #e2e8f0;
        i { color: #8cc4ec; }
        &:hover {
          background-color: #273449;
          border-color: #8cc4ec;
          color: #8cc4ec;
          i { color: #8cc4ec; }
        }
      }
    }

    /* Adaptações do componente para Alto Contraste */
    :host-context(.a11y-high-contrast) {
      .a11y-block {
        background-color: #ffffff !important;
        border: 2px solid #000000 !important;
        box-shadow: none !important;
      }
      .a11y-block-title,
      .a11y-label {
        color: #000000 !important;
        font-weight: 800 !important;
      }
      .a11y-hint {
        color: #111827 !important;
        font-weight: 600 !important;
      }
      .form-check-input {
        border: 2px solid #000000 !important;
        &:checked {
          background-color: #000000 !important;
          border-color: #000000 !important;
        }
      }
      .a11y-size-btn {
        border: 2px solid #000000 !important;
        color: #000000 !important;
        background: #ffffff !important;
        font-weight: 800 !important;
        &.active {
          background: #000000 !important;
          color: #ffffff !important;
          border-color: #000000 !important;
        }
      }
      .a11y-btn-reset {
        border: 2px solid #000000 !important;
        color: #000000 !important;
        background: #ffffff !important;
        font-weight: 800 !important;
        box-shadow: none !important;
        i { color: #000000 !important; }
        &:hover {
          background: #000000 !important;
          color: #ffffff !important;
          i { color: #ffffff !important; }
        }
      }
      kbd {
        border: 2px solid #000000 !important;
        color: #000000 !important;
        background: #e2e8f0 !important;
        font-weight: 800 !important;
      }
    }

    /* Alto Contraste combinado com Dark Mode */
    :host-context(.a11y-high-contrast[data-theme='dark']) {
      .a11y-block {
        background-color: #000000 !important;
        border: 2px solid #ffffff !important;
      }
      .a11y-block-title,
      .a11y-label {
        color: #ffffff !important;
        font-weight: 800 !important;
      }
      .a11y-hint {
        color: #f1f5f9 !important;
        font-weight: 600 !important;
      }
      .form-check-input {
        border: 2px solid #ffffff !important;
        background-color: #000000 !important;
        &:checked {
          background-color: #ffffff !important;
          border-color: #ffffff !important;
        }
      }
      .a11y-size-btn {
        border: 2px solid #ffffff !important;
        color: #ffffff !important;
        background: #000000 !important;
        font-weight: 800 !important;
        &.active {
          background: #ffffff !important;
          color: #000000 !important;
          border-color: #ffffff !important;
        }
      }
      .a11y-btn-reset {
        border: 2px solid #ffffff !important;
        color: #ffffff !important;
        background: #000000 !important;
        font-weight: 800 !important;
        box-shadow: none !important;
        i { color: #ffffff !important; }
        &:hover {
          background: #ffffff !important;
          color: #000000 !important;
          i { color: #000000 !important; }
        }
      }
      kbd {
        border: 2px solid #ffffff !important;
        color: #ffffff !important;
        background: #1e293b !important;
        font-weight: 800 !important;
      }
    }
  `],
})
export class AccessibilitySettingsComponent {
  private a11y = inject(AccessibilityService);
  readonly speech = inject(SpeechService);
  readonly theme = inject(ThemeService);

  readonly s = this.a11y.settings;
  readonly rateLabel = computed(() => `${this.s().voiceRate.toFixed(1).replace('.', ',')}x`);

  readonly sizeOptions = [
    { value: 100, label: 'Padrão', preview: 15 },
    { value: 115, label: 'Grande', preview: 17 },
    { value: 130, label: 'Maior', preview: 19 },
    { value: 150, label: 'Máximo', preview: 21 },
  ];

  toggle(key: keyof A11ySettings, event: Event): void {
    this.a11y.update({ [key]: (event.target as HTMLInputElement).checked } as Partial<A11ySettings>);
  }

  setSize(value: number): void {
    this.a11y.update({ fontScale: value });
  }

  setRate(event: Event): void {
    this.a11y.update({ voiceRate: Number((event.target as HTMLInputElement).value) });
  }

  setVoice(event: Event): void {
    this.a11y.update({ voiceUri: (event.target as HTMLSelectElement).value });
  }

  test(): void {
    this.speech.speak('Olá! Esta é a voz do Horizon. Você pode ajustar a velocidade e escolher outra voz.');
  }

  reset(): void {
    this.a11y.reset();
  }
}
