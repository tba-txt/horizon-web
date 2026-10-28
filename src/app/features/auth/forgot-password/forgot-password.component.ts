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
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  mobileHeroImage = signal<string>('assets/maldivas.webp');

  forgotPasswordForm = this.fb.group({
    email: ['', [Validators.required, strictEmailValidator()]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  onMobileHeroError(event: any): void {
    const target = event?.target as HTMLImageElement;
    if (target && !target.src.includes('santorini.webp')) {
      target.src = 'assets/santorini.webp';
    }
  }

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
