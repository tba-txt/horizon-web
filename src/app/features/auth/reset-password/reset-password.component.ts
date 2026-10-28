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
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
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
