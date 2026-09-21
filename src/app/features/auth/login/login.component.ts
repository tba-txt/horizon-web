import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout imagePosition="left" imageSrc="assets/login.webp">
      <div class="mb-4">
        <h2 class="h3 fw-bold text-dark mb-1">Acesse sua conta</h2>
        <p class="text-muted small">
          Entre com seu email e senha para explorar o Horizon.
        </p>
      </div>

      @if (errorMessage()) {
        <div class="alert alert-danger d-flex align-items-center mb-4 py-2 px-3 small" role="alert">
          <div>{{ errorMessage() }}</div>
        </div>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
        <!-- Email -->
        <div class="mb-3">
          <label for="email" class="form-label small fw-semibold text-secondary">Email</label>
          <input 
            id="email" 
            type="email" 
            formControlName="email"
            class="form-control"
            [class.is-invalid]="isFieldInvalid('email')"
            placeholder="nome@exemplo.com"
            autocomplete="email"
          />
          @if (isFieldInvalid('email')) {
            <div class="invalid-feedback small">
              @if (loginForm.get('email')?.hasError('required')) {
                O email é obrigatório.
              } @else if (loginForm.get('email')?.hasError('email')) {
                Informe um formato de email válido.
              }
            </div>
          }
        </div>

        <!-- Senha -->
        <div class="mb-3">
          <label for="password" class="form-label small fw-semibold text-secondary mb-1">Senha</label>
          <input 
            id="password" 
            type="password" 
            formControlName="password"
            class="form-control"
            [class.is-invalid]="isFieldInvalid('password')"
            placeholder="••••••••"
            autocomplete="current-password"
          />
          @if (isFieldInvalid('password')) {
            <div class="invalid-feedback small">
              A senha é obrigatória.
            </div>
          }
        </div>

        <!-- Botão Entrar -->
        <button 
          type="submit" 
          [disabled]="loginForm.invalid || isLoading()"
          class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center mb-3"
        >
          @if (isLoading()) {
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <span>Entrando...</span>
          } @else {
            <span>Entrar no Horizon</span>
          }
        </button>

        <!-- Link para Cadastro -->
        <div class="text-center pt-2 border-top">
          <span class="text-muted small">Ainda não possui uma conta? </span>
          <a routerLink="/register" class="small fw-semibold text-decoration-none text-primary">
            Cadastre-se
          </a>
        </div>
      </form>
    </app-auth-layout>
  `,
  styles: [`
    .btn-primary {
      background-color: #0d6efd;
      border-color: #0d6efd;
      transition: all 0.2s ease-in-out;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0b5ed7;
      border-color: #0a58ca;
    }

    .form-control:focus {
      border-color: #86b7fe;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15);
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/destinations']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'E-mail ou senha incorretos.');
      }
    });
  }
}
