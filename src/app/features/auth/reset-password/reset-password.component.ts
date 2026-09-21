import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout imagePosition="right">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900">Redefinir senha</h2>
        <p class="mt-2 text-sm text-gray-600">
          Crie uma nova senha para sua conta.
        </p>
      </div>

      @if (successMessage()) {
        <div class="rounded-md bg-green-50 p-4 mb-6">
          <h3 class="text-sm font-medium text-green-800">{{ successMessage() }}</h3>
          <div class="mt-4">
            <a routerLink="/login" class="text-sm font-medium text-green-700 hover:text-green-600">Ir para o login</a>
          </div>
        </div>
      } @else {
        <form [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()" class="space-y-6">
          @if (errorMessage()) {
            <div class="rounded-md bg-red-50 p-4">
              <h3 class="text-sm font-medium text-red-800">{{ errorMessage() }}</h3>
            </div>
          }

          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700">Nova Senha</label>
            <input 
              id="newPassword" 
              type="password" 
              formControlName="newPassword"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
            @if (resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched) {
              <p class="mt-2 text-sm text-red-600">A senha deve ter pelo menos 6 caracteres.</p>
            }
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
            <input 
              id="confirmPassword" 
              type="password" 
              formControlName="confirmPassword"
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
            @if (resetPasswordForm.errors?.['passwordMismatch'] && resetPasswordForm.get('confirmPassword')?.touched) {
              <p class="mt-2 text-sm text-red-600">As senhas não coincidem.</p>
            }
          </div>

          <div>
            <button 
              type="submit" 
              [disabled]="resetPasswordForm.invalid || isLoading() || !token"
              class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ isLoading() ? 'Redefinindo...' : 'Redefinir Senha' }}
            </button>
          </div>
        </form>
      }
    </app-auth-layout>
  `
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  
  token: string | null = null;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  resetPasswordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.errorMessage.set('Token de redefinição de senha inválido ou ausente.');
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
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
