import { Component, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { animate, stagger } from 'motion';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout imagePosition="right" imageSrc="assets/recSenha-Image.webp">
      <div class="auth-glass-wrapper position-relative w-100 d-flex justify-content-center align-items-center" style="z-index: 1; min-height: 100%;">
        
        <!-- Card com Efeito Glassmorphism Padronizado -->
        <div class="glass-card p-4 p-md-5 w-100">

          <!-- Header / Branding -->
          <div class="text-center mb-4 reset-anim-item">
            <div class="brand-badge d-inline-flex align-items-center justify-content-center rounded-circle mb-3 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              </svg>
            </div>
            <h2 class="h3 fw-bold mb-1 text-dark" style="letter-spacing: -0.3px;">
              Redefinir <span style="color: #4A90E2;">Senha</span>
            </h2>
            <p class="text-muted small mb-0">
              Crie uma nova senha segura para a sua conta.
            </p>
          </div>

          <!-- Mensagem de Sucesso -->
          @if (successMessage()) {
            <div class="alert alert-success d-flex flex-column align-items-center text-center p-4 rounded-4 border-0 shadow-sm reset-anim-item" role="alert" style="background: rgba(240, 253, 244, 0.95); color: #166534; backdrop-filter: blur(8px);">
              <div class="rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 48px; height: 48px; background: #dcfce7;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#16a34a" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
              </div>
              <h5 class="fw-bold mb-1" style="color: #15803d;">Senha alterada com sucesso!</h5>
              <p class="small mb-3 text-secondary">{{ successMessage() }}</p>
              <a routerLink="/login" class="btn btn-horizon-action w-100 py-2 fw-semibold text-decoration-none">
                Ir para o login
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

            <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" novalidate>
              
              <!-- Nova Senha -->
              <div class="mb-3 reset-anim-item">
                <label for="newPassword" class="form-label small fw-bold text-dark mb-2">Nova Senha *</label>
                <div class="custom-glass-input-group">
                  <span class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                    </svg>
                  </span>
                  <input 
                    id="newPassword" 
                    [type]="showNewPassword() ? 'text' : 'password'" 
                    formControlName="newPassword"
                    class="form-control form-control-glass pe-5"
                    [class.is-invalid]="resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched"
                    placeholder="Mínimo 6 dígitos"
                    autocomplete="new-password"
                  />
                  <button 
                    type="button" 
                    class="btn-toggle-eye" 
                    (click)="toggleNewPasswordVisibility()" 
                    [attr.aria-label]="showNewPassword() ? 'Ocultar senha' : 'Ver senha'"
                  >
                    @if (showNewPassword()) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                        <path d="M3.35 5.47q-.27.24-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched) {
                  <div class="text-danger small mt-1 ms-1 fw-medium">A senha deve ter pelo menos 6 caracteres.</div>
                }
              </div>

              <!-- Confirmar Nova Senha -->
              <div class="mb-4 reset-anim-item">
                <label for="confirmPassword" class="form-label small fw-bold text-dark mb-2">Confirmar Nova Senha *</label>
                <div class="custom-glass-input-group">
                  <span class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                    </svg>
                  </span>
                  <input 
                    id="confirmPassword" 
                    [type]="showConfirmPassword() ? 'text' : 'password'" 
                    formControlName="confirmPassword"
                    class="form-control form-control-glass pe-5"
                    [class.is-invalid]="resetPasswordForm.errors?.['passwordMismatch'] && resetPasswordForm.get('confirmPassword')?.touched"
                    placeholder="••••••••"
                    autocomplete="new-password"
                  />
                  <button 
                    type="button" 
                    class="btn-toggle-eye" 
                    (click)="toggleConfirmPasswordVisibility()" 
                    [attr.aria-label]="showConfirmPassword() ? 'Ocultar senha' : 'Ver senha'"
                  >
                    @if (showConfirmPassword()) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                        <path d="M3.35 5.47q-.27.24-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                      </svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (resetPasswordForm.errors?.['passwordMismatch'] && resetPasswordForm.get('confirmPassword')?.touched) {
                  <div class="text-danger small mt-1 ms-1 fw-medium">As senhas não coincidem.</div>
                }
              </div>

              <!-- Botão Redefinir Senha -->
              <div class="reset-anim-item mb-3">
                <button 
                  type="submit" 
                  [disabled]="resetPasswordForm.invalid || isLoading() || !token"
                  class="btn btn-horizon-action w-100 py-3 fw-bold d-flex align-items-center justify-content-center shadow-sm"
                >
                  @if (isLoading()) {
                    <div class="spinner"><div></div><div></div><div></div><div></div><div></div></div>
                    <span>Redefinindo...</span>
                  } @else {
                    <span>Redefinir Senha</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" class="ms-2">
                      <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  }
                </button>
              </div>

              <!-- Link Voltar ao Login -->
              <div class="text-center reset-anim-item mt-3">
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

    .brand-badge {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #4A90E2 0%, #2b6cb0 100%);
      box-shadow: 0 8px 18px rgba(74, 144, 226, 0.35);
      position: relative;
      z-index: 1;
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

    /* Botão de Revelar Senha */
    .btn-toggle-eye {
      position: absolute;
      right: 14px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.2s ease, transform 0.15s ease;
      z-index: 2;
    }

    .btn-toggle-eye:hover {
      color: #4A90E2;
      transform: scale(1.1);
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

    .reset-anim-item {
      opacity: 1;
    }

    @media (max-width: 575.98px) {
      .glass-card {
        padding: 1.5rem !important;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  
  token: string | null = null;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  resetPasswordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.errorMessage.set('Token de redefinição de senha inválido ou ausente.');
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const items = document.querySelectorAll('.reset-anim-item');
      if (items.length > 0) {
        animate(
          items,
          { opacity: [0, 1], y: [14, 0] },
          { delay: stagger(0.06), duration: 0.4, ease: 'easeOut' }
        );
      }
    }, 40);
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid || !this.token) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { newPassword } = this.resetPasswordForm.value;

    this.authService.resetPassword({ token: this.token, newPassword: newPassword! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Senha redefinida com sucesso.');
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao redefinir a senha.');
      }
    });
  }
}
