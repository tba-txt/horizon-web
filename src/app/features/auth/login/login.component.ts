import { Component, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { animate, stagger } from 'motion';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { strictEmailValidator } from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mobileHeroImage = signal<string>('/assets/santorini.webp');

  loginForm = this.fb.group({
    email: ['', [Validators.required, strictEmailValidator()]],
    password: ['', [Validators.required]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  ngOnInit(): void {
    const emailParam = this.route.snapshot.queryParamMap.get('email');
    if (emailParam) {
      this.loginForm.patchValue({ email: emailParam });
    }
  }

  onMobileHeroError(event: any): void {
    const target = event?.target as HTMLImageElement;
    if (target && !target.src.includes('maldivas.webp')) {
      target.src = '/assets/maldivas.webp';
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const items = document.querySelectorAll('.login-anim-item');
      if (items.length > 0) {
        animate(
          items,
          { opacity: [0, 1], y: [14, 0] },
          { delay: stagger(0.06), duration: 0.4, ease: 'easeOut' }
        );
      }
    }, 40);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

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
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/destinations';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'E-mail ou senha incorretos.');
      }
    });
  }
}
