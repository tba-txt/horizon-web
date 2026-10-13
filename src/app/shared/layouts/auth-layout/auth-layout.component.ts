import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid min-vh-100 p-0 overflow-hidden d-flex align-items-center justify-content-center auth-viewport-wrapper">
      <div class="auth-card-container d-flex shadow-lg w-100">
        
        <!-- Coluna de Imagem / Branding (expandida para a esquerda) -->
        <div 
          class="d-none d-md-block position-relative auth-brand-side p-0 overflow-hidden h-100"
          style="flex: 1.43;"
          [ngClass]="{'order-1': imagePosition === 'left', 'order-2': imagePosition === 'right'}"
        >
          @if (imageSrc) {
            <img 
              [src]="imageSrc" 
              alt="Horizon Auth" 
              class="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
              style="object-position: left center;"
            />
          } @else {
            <div class="auth-bg-overlay"></div>
            <div class="position-relative z-2 text-center max-w-brand text-white p-5 h-100 d-flex flex-column align-items-center justify-content-center">
              <h1 class="display-4 fw-bold mb-3 tracking-tight">Horizon</h1>
              <p class="lead mb-0 text-white-50">
                Sua agência de viagens com recomendações inteligentes e personalizadas.
              </p>
            </div>
          }
        </div>

        <!-- Coluna de Formulário (Fundo cinza bem claro) -->
        <div 
          class="position-relative p-0 h-100 auth-form-side"
          style="flex: 1;"
          [ngClass]="{'order-2': imagePosition === 'left', 'order-1': imagePosition === 'right'}"
        >
          <div class="w-100 h-100 auth-form-container d-flex align-items-center justify-content-center">
            <ng-content></ng-content>
          </div>
        </div>
        
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .auth-viewport-wrapper {
      background-color: #4A90E2;
      padding: clamp(10px, 2.5vw, 28px) !important;
      min-height: 100vh;
    }

    .auth-card-container {
      max-width: 1680px;
      height: 92vh;
      min-height: 600px;
      border-radius: clamp(24px, 4vw, 56px);
      overflow: hidden;
      background-color: #f4f6f9;
      transition: all 0.3s ease;
    }

    .auth-brand-side {
      background: linear-gradient(135deg, #0b2545 0%, #134074 50%, #1d2d44 100%);
    }

    .auth-form-side {
      background-color: #f4f6f9;
      position: relative;
      overflow-y: auto;
      overflow-x: hidden;
    }

    /* Textura de Ruído Estático e Denso (Film Grain Noise) como na referência */
    .auth-form-side::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.22'/%3E%3C/svg%3E");
      background-repeat: repeat;
      background-size: 140px 140px;
      pointer-events: none;
      z-index: 0;
      mix-blend-mode: multiply;
    }

    .object-fit-cover {
      object-fit: cover;
    }

    .auth-bg-overlay {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
      pointer-events: none;
    }

    .max-w-brand {
      max-width: 480px;
    }

    .auth-form-container {
      width: 100%;
      position: relative;
      z-index: 1;
    }

    /* Ajuste para telas pequenas e celulares */
    @media (max-width: 767.98px) {
      .auth-viewport-wrapper {
        padding: 8px !important;
      }

      .auth-card-container {
        height: auto;
        min-height: calc(100vh - 16px);
        border-radius: 20px;
      }
    }

    /* Telas de notebook com altura reduzida (ex: 1366x768) */
    @media (max-height: 700px) {
      .auth-card-container {
        height: 96vh;
        min-height: 520px;
      }
    }
  `]
})
export class AuthLayoutComponent {
  @Input() imagePosition: 'left' | 'right' = 'left';
  @Input() imageSrc?: string;
}
