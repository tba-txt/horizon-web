import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout imagePosition="right">
      <div class="mb-4">
        <h2 class="h3 fw-bold text-dark mb-1">Recuperação de Senha</h2>
        <p class="text-muted small">
          Informe seu email para receber o link de redefinição de senha.
        </p>
      </div>

      @if (successMessage()) {
        <div class="alert alert-success p-4 rounded-3 text-center mb-4" role="alert">
          <h5 class="fw-bold mb-2">Solicitação enviada!</h5>
          <p class="small mb-3 text-success-emphasis">{{ successMessage() }}</p>
          <a routerLink="/login" class="btn btn-outline-success btn-sm px-4">
            Voltar para o login
          </a>
        </div>
      } @else {
        
        @if (errorMessage()) {
          <div class="alert alert-danger py-2 px-3 mb-3 small" role="alert">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="mb-3">
            <label for="email" class="form-label small fw-semibold text-secondary">Email Cadastrado *</label>
            <input 
              id="email" 
              type="email" 
              formControlName="email"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('email')"
              placeholder="seu@email.com"
            />
            @if (isFieldInvalid('email')) {
              <div class="invalid-feedback small">Informe um email válido.</div>
            }
          </div>

          <button 
            type="submit" 
            [disabled]="forgotPasswordForm.invalid || isLoading()"
            class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center mb-3"
          >
            @if (isLoading()) {
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              <span>Enviando solicitação...</span>
            } @else {
              <span>Enviar link de recuperação</span>
            }
          </button>

          <div class="text-center pt-2 border-top">
            <a routerLink="/login" class="small text-decoration-none text-primary fw-semibold">
              ← Voltar para o login
            </a>
          </div>
        </form>

      }
    </app-auth-layout>
  `,
  styles: [`
    .btn-primary {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

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
