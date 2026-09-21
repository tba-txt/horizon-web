import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout imagePosition="right" imageSrc="assets/cadastro.webp">
      <div class="mb-4">
        <h2 class="h3 fw-bold text-dark mb-1">Crie sua conta</h2>
        <p class="text-muted small">
          Cadastre-se no Horizon e comece sua jornada personalizada.
        </p>
      </div>

      @if (errorMessage()) {
        <div class="alert alert-danger d-flex align-items-center mb-4 py-2 px-3 small" role="alert">
          <div>{{ errorMessage() }}</div>
        </div>
      }

      @if (successMessage()) {
        <div class="alert alert-success d-flex align-items-center mb-4 py-2 px-3 small" role="alert">
          <div>{{ successMessage() }}</div>
        </div>
      }

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" novalidate>
        
        <!-- Nome Completo -->
        <div class="mb-3">
          <label for="name" class="form-label small fw-semibold text-secondary">Nome Completo *</label>
          <input 
            id="name" 
            type="text" 
            formControlName="name"
            class="form-control"
            [class.is-invalid]="isFieldInvalid('name')"
            placeholder="Ex: Carlos Silva"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback small">O nome é obrigatório.</div>
          }
        </div>

        <!-- Email -->
        <div class="mb-3">
          <label for="email" class="form-label small fw-semibold text-secondary">Email *</label>
          <input 
            id="email" 
            type="email" 
            formControlName="email"
            class="form-control"
            [class.is-invalid]="isFieldInvalid('email')"
            placeholder="nome@exemplo.com"
          />
          @if (isFieldInvalid('email')) {
            <div class="invalid-feedback small">Informe um email válido.</div>
          }
        </div>

        <div class="row g-2 mb-3">
          <!-- CPF (11 dígitos) -->
          <div class="col-12 col-sm-6">
            <label for="cpf" class="form-label small fw-semibold text-secondary">CPF (11 dígitos) *</label>
            <input 
              id="cpf" 
              type="text" 
              formControlName="cpf"
              maxlength="14"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('cpf')"
              placeholder="000.000.000-00"
            />
            @if (isFieldInvalid('cpf')) {
              <div class="invalid-feedback small">CPF válido (11 dígitos) é obrigatório.</div>
            }
          </div>

          <!-- Data de Nascimento -->
          <div class="col-12 col-sm-6">
            <label for="birthDate" class="form-label small fw-semibold text-secondary">Nascimento *</label>
            <input 
              id="birthDate" 
              type="date" 
              formControlName="birthDate"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('birthDate')"
            />
            @if (isFieldInvalid('birthDate')) {
              <div class="invalid-feedback small">Data de nascimento obrigatória.</div>
            }
          </div>
        </div>

        <div class="row g-2 mb-4">
          <!-- Senha -->
          <div class="col-12 col-sm-6">
            <label for="password" class="form-label small fw-semibold text-secondary">Senha *</label>
            <input 
              id="password" 
              type="password" 
              formControlName="password"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('password')"
              placeholder="Mínimo 6 dígitos"
            />
            @if (isFieldInvalid('password')) {
              <div class="invalid-feedback small">Mínimo 6 caracteres.</div>
            }
          </div>

          <!-- Confirmar Senha -->
          <div class="col-12 col-sm-6">
            <label for="confirmPassword" class="form-label small fw-semibold text-secondary">Confirmar Senha *</label>
            <input 
              id="confirmPassword" 
              type="password" 
              formControlName="confirmPassword"
              class="form-control"
              [class.is-invalid]="registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched"
              placeholder="••••••••"
            />
            @if (registerForm.errors?.['passwordMismatch'] && registerForm.get('confirmPassword')?.touched) {
              <div class="invalid-feedback d-block small">Senhas não coincidem.</div>
            }
          </div>
        </div>

        <!-- Botão Registrar -->
        <button 
          type="submit" 
          [disabled]="registerForm.invalid || isLoading()"
          class="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center mb-3"
        >
          @if (isLoading()) {
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            <span>Cadastrando...</span>
          } @else {
            <span>Criar Conta</span>
          }
        </button>

        <!-- Voltar para Login -->
        <div class="text-center pt-2 border-top">
          <span class="text-muted small">Já possui uma conta? </span>
          <a routerLink="/login" class="small fw-semibold text-decoration-none text-primary">
            Fazer login
          </a>
        </div>

      </form>
    </app-auth-layout>
  `,
  styles: [`
    .btn-primary {
      background-color: #0d6efd;
      border-color: #0d6efd;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    cpf: ['', [Validators.required]],
    birthDate: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const rawValue = this.registerForm.value;
    // O backend exige CPF com exatamente 11 dígitos numéricos
    const cleanCpf = (rawValue.cpf || '').replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      this.isLoading.set(false);
      this.errorMessage.set('O CPF deve conter exatamente 11 dígitos numéricos.');
      return;
    }

    const payload = {
      name: rawValue.name!,
      email: rawValue.email!,
      cpf: cleanCpf,
      birthDate: rawValue.birthDate!,
      password: rawValue.password!
    };

    this.authService.register(payload as any).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Conta criada com sucesso! Redirecionando para login...');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Erro ao realizar cadastro.');
      }
    });
  }
}
