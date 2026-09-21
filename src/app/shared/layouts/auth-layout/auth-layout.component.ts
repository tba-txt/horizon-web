import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container-fluid min-vh-100 p-0 overflow-hidden">
      <div class="row g-0 min-vh-100">
        
        <!-- Coluna de Imagem / Branding -->
        <div 
          class="col-12 col-md-6 d-none d-md-flex align-items-center justify-content-center position-relative auth-brand-side p-0 overflow-hidden"
          [ngClass]="{'order-1': imagePosition === 'left', 'order-2': imagePosition === 'right'}"
        >
          @if (imageSrc) {
            <img 
              [src]="imageSrc" 
              alt="Horizon Auth" 
              class="w-100 h-100 object-fit-cover position-absolute top-0 start-0"
            />
          } @else {
            <div class="auth-bg-overlay"></div>
            <div class="position-relative z-2 text-center max-w-brand text-white p-5">
              <h1 class="display-4 fw-bold mb-3 tracking-tight">Horizon</h1>
              <p class="lead mb-0 text-white-50">
                Sua agência de viagens com recomendações inteligentes e personalizadas.
              </p>
            </div>
          }
        </div>

        <!-- Coluna de Formulário -->
        <div 
          class="col-12 col-md-6 d-flex align-items-center justify-content-center p-4 p-md-5 bg-white"
          [ngClass]="{'order-2': imagePosition === 'left', 'order-1': imagePosition === 'right'}"
        >
          <div class="w-100 auth-form-container">
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
    
    .auth-brand-side {
      background: linear-gradient(135deg, #0b2545 0%, #134074 50%, #1d2d44 100%);
      min-height: 100vh;
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
      max-width: 420px;
    }
  `]
})
export class AuthLayoutComponent {
  @Input() imagePosition: 'left' | 'right' = 'left';
  @Input() imageSrc?: string;
}
