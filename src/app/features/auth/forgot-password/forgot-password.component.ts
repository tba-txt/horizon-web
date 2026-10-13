import { Component, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { animate, stagger } from 'motion';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { strictEmailValidator } from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout imagePosition="right" imageSrc="assets/recSenha-Image.webp">
      <div class="auth-glass-wrapper position-relative w-100 d-flex justify-content-center align-items-center" style="z-index: 1; min-height: 100%;">
        
        <!-- Card com Efeito Glassmorphism Padronizado -->
        <div class="glass-card p-4 p-md-5 w-100">

          <!-- Header / Branding -->
          <div class="text-center mb-4 forgot-anim-item">
            <div class="globe-scene mb-3 mx-auto">
              <!-- Globo Imagem -->
              <img src="assets/globo.webp" alt="Globo" class="globe-svg" style="object-fit: contain;" />
              <!-- Container da Órbita e Avião -->
              <div class="globe-plane-container">
                <svg class="globe-plane" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21,16 L21,14 L13,9 L13,3.5 C13,2.67 12.33,2 11.5,2 C10.67,2 10,2.67 10,3.5 L10,9 L2,14 L2,16 L10,13.5 L10,19 L8,20.5 L8,22 L11.5,21 L15,22 L15,20.5 L13,19 L13,13.5 L21,16 Z"/>
                </svg>
              </div>
            </div>
            <h2 class="h3 fw-bold mb-1 text-dark" style="letter-spacing: -0.3px;">
              Recuperar <span style="color: #4A90E2;">Senha</span>
            </h2>
            <p class="text-muted small mb-0">
              Digite seu email para receber o link de redefinição de senha.
            </p>
          </div>

          <!-- Mensagem de Sucesso -->
          @if (successMessage()) {
            <div class="alert alert-success d-flex flex-column align-items-center text-center p-4 rounded-4 border-0 shadow-sm forgot-anim-item" role="alert" style="background: rgba(240, 253, 244, 0.95); color: #166534; backdrop-filter: blur(8px);">
              <div class="rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 48px; height: 48px; background: #dcfce7;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#16a34a" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
              </div>
              <h5 class="fw-bold mb-1" style="color: #15803d;">Solicitação enviada!</h5>
              <p class="small mb-3 text-secondary">{{ successMessage() }}</p>
              <a routerLink="/login" class="btn btn-horizon-action w-100 py-2 fw-semibold text-decoration-none">
                Voltar para o login
              </a>
            </div>
          } @else {
            
            <!-- Mensagem de Erro -->
            @if (errorMessage()) {
              <div class="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2 px-3 rounded-3 border-0 shadow-sm" role="alert" style="background: rgba(254, 242, 242, 0.95); color: #991b1b; backdrop-filter: blur(8px);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                <span class="small fw-medium">{{ errorMessage() }}</span>
              </div>
            }

            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" novalidate>
              <!-- Campo Email -->
              <div class="mb-4 forgot-anim-item">
                <label for="email" class="form-label small fw-bold text-dark mb-2">Email cadastrado *</label>
                <div class="custom-glass-input-group">
                  <span class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zM16 11.801V4.697l-5.803 3.546L16 11.801z"/>
                    </svg>
                  </span>
                  <input 
                    id="email" 
                    type="email" 
                    formControlName="email"
                    class="form-control form-control-glass"
                    [class.is-invalid]="isFieldInvalid('email')"
                    placeholder="nome@exemplo.com"
                    autocomplete="email"
                  />
                </div>
                @if (isFieldInvalid('email')) {
                  <div class="text-danger small mt-1 ms-1 fw-medium">
                    {{ forgotPasswordForm.get('email')?.errors?.['message'] || 'Informe um email válido.' }}
                  </div>
                }
              </div>

              <!-- Botão Enviar Link -->
              <div class="forgot-anim-item mb-3">
                <button 
                  type="submit" 
                  [disabled]="forgotPasswordForm.invalid || isLoading()"
                  class="btn btn-horizon-action w-100 py-3 fw-bold d-flex align-items-center justify-content-center shadow-sm"
                >
                  @if (isLoading()) {
                    <div class="spinner"><div></div><div></div><div></div><div></div><div></div></div>
                    <span>Enviando solicitação...</span>
                  } @else {
                    <span>Enviar link de recuperação</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" class="ms-2">
                      <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  }
                </button>
              </div>

              <!-- Separador "ou" -->
              <div class="d-flex align-items-center gap-3 my-3 forgot-anim-item">
                <hr class="flex-grow-1 border-secondary-subtle opacity-50 m-0">
                <span class="small fw-medium text-muted">ou</span>
                <hr class="flex-grow-1 border-secondary-subtle opacity-50 m-0">
              </div>

              <!-- Link Voltar ao Login -->
              <div class="text-center forgot-anim-item">
                <a routerLink="/login" class="small fw-bold text-decoration-none hover-link d-inline-flex align-items-center gap-1" style="color: #4A90E2;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                  </svg>
                  <span>Voltar para o login</span>
                </a>
              </div>
            </form>

          }

        </div>
      </div>
    </app-auth-layout>
  `,
  styles: [`
    /* =========================================================
       CARD COM GLASSMORPHISM PADRONIZADO DO HORIZON
       ========================================================= */
    .auth-glass-wrapper {
      padding: 1rem;
    }

    .glass-card {
      max-width: 440px;
      background: linear-gradient(
        135deg, 
        rgba(255, 255, 255, 0.28) 0%, 
        rgba(255, 255, 255, 0.08) 100%
      );
      backdrop-filter: blur(36px) saturate(210%) contrast(106%);
      -webkit-backdrop-filter: blur(36px) saturate(210%) contrast(106%);
      border: 1.5px solid rgba(255, 255, 255, 0.65);
      border-radius: clamp(20px, 3vw, 28px);
      box-shadow: 
        0 30px 60px -12px rgba(11, 37, 69, 0.15),
        0 12px 28px -6px rgba(74, 144, 226, 0.08),
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95),
        inset 0 -1.5px 1px 0 rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
    }

    .glass-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.28) 0%,
        rgba(255, 255, 255, 0.04) 40%,
        transparent 100%
      );
      pointer-events: none;
      z-index: 0;
    }

    /* =========================================================
       ANIMAÇÃO DO GLOBO E AVIÃO 2D
       ========================================================= */
    .globe-scene {
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .globe-svg {
      width: 76px;
      height: 76px;
      opacity: 0.95;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
    }

    .globe-plane-container {
      position: absolute;
      width: 110px;
      height: 110px;
      top: 50%; left: 50%;
      margin-top: -55px;
      margin-left: -55px;
      border-radius: 50%;
      animation: orbit2D 2.5s linear infinite;
    }

    /* Rastro (Trail) do Avião */
    .globe-plane-container::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      border: 2px solid transparent;
      border-top-color: rgba(255, 255, 255, 0.9);
      border-left-color: rgba(255, 255, 255, 0.15);
      transform: rotate(-45deg);
      opacity: 0.8;
      pointer-events: none;
    }

    .globe-plane {
      position: absolute;
      top: -12px;
      left: calc(50% - 12px);
      width: 24px;
      height: 24px;
      color: #ffffff;
      transform: rotate(90deg);
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
      z-index: 2;
    }

    @keyframes orbit2D {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* =========================================================
       INPUTS PADRONIZADOS COM SOMBREAMENTO E CONTRASTE
       ========================================================= */
    .custom-glass-input-group {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .input-icon {
      position: absolute;
      left: 15px;
      color: #4A90E2;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 2;
    }

    .form-control-glass {
      width: 100%;
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1.5px solid rgba(74, 144, 226, 0.32);
      border-radius: 14px;
      padding: 0.75rem 1rem 0.75rem 2.85rem;
      font-size: 0.95rem;
      color: #1e293b;
      box-shadow: 
        0 4px 16px -2px rgba(11, 37, 69, 0.08),
        0 2px 6px 0 rgba(74, 144, 226, 0.04),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.9);
      transition: all 0.25s ease;
      outline: none;
      position: relative;
      z-index: 1;
    }

    .form-control-glass::placeholder {
      color: #94a3b8;
    }

    .form-control-glass:focus {
      background: #ffffff;
      border-color: #4A90E2;
      box-shadow: 
        0 8px 24px -4px rgba(74, 144, 226, 0.25),
        0 0 0 4px rgba(74, 144, 226, 0.18),
        inset 0 1px 2px rgba(255, 255, 255, 0.9);
    }

    .form-control-glass.is-invalid {
      border-color: #ef4444;
      background: rgba(254, 242, 242, 0.85);
    }

    /* Botão de Ação com degradê azul Horizon */
    .btn-horizon-action {
      background: linear-gradient(135deg, #4A90E2 0%, #2b6cb0 100%);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 14px;
      color: white;
      font-size: 1rem;
      letter-spacing: 0.3px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn-horizon-action:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(74, 144, 226, 0.35);
      background: linear-gradient(135deg, #357ABD 0%, #1d5088 100%);
      color: white;
    }

    .btn-horizon-action:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-horizon-action:disabled {
      opacity: 0.55;
      color: white;
      cursor: not-allowed;
    }

    .hover-link {
      transition: all 0.2s ease;
    }

    .hover-link:hover {
      color: #2b6cb0 !important;
      text-decoration: underline !important;
    }

    .forgot-anim-item {
      opacity: 1;
    }

    @media (max-width: 575.98px) {
      .glass-card {
        padding: 1.5rem !important;
      }
    }
  `]
})
export class ForgotPasswordComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, strictEmailValidator()]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngAfterViewInit(): void {
    setTimeout(() => {
      const items = document.querySelectorAll('.forgot-anim-item');
      if (items.length > 0) {
        animate(
          items,
          { opacity: [0, 1], y: [14, 0] },
          { delay: stagger(0.06), duration: 0.4, ease: 'easeOut' }
        );
      }
    }, 40);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.forgotPasswordForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const { email } = this.forgotPasswordForm.value;

    this.authService.forgotPassword({ email: email! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Se o email estiver cadastrado, as instruções para redefinição foram enviadas.');
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao processar solicitação.');
      }
    });
  }
}
