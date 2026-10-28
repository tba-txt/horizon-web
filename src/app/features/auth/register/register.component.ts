import { Component, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';
import { animate, stagger } from 'motion';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { cpfValidator, birthDateValidator, formatCpf, nameValidator, strictEmailValidator } from '../../../shared/validators/custom-validators';
import { DatePickerComponent } from '../../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent, DatePickerComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registerForm = this.fb.group({
    name: ['', [Validators.required, nameValidator()]],
    socialName: ['', [nameValidator()]],
    email: ['', [Validators.required, strictEmailValidator()]],
    cpf: ['', [Validators.required, cpfValidator()]],
    birthDate: ['', [Validators.required, birthDateValidator()]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  ngAfterViewInit(): void {
    setTimeout(() => {
      const items = document.querySelectorAll('.register-anim-item');
      if (items.length > 0) {
        animate(
          items,
          { opacity: [0, 1], y: [14, 0] },
          { delay: stagger(0.05), duration: 0.4, ease: 'easeOut' }
        );
      }
    }, 40);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onNameInput(event: Event, controlName: 'name' | 'socialName'): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      // Remove qualquer caractere que não seja letra (incluindo acentos), espaço, hífen ou apóstrofo
      let cleaned = input.value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '');
      cleaned = cleaned.replace(/@/g, '');
      if (input.value !== cleaned) {
        input.value = cleaned;
        this.registerForm.get(controlName)?.setValue(cleaned, { emitEvent: false });
      }
    }
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      const formatted = formatCpf(input.value);
      input.value = formatted;
      this.registerForm.get('cpf')?.setValue(formatted, { emitEvent: false });
    }
  }

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
      socialName: rawValue.socialName || undefined,
      email: rawValue.email!,
      cpf: cleanCpf,
      birthDate: rawValue.birthDate!,
      password: rawValue.password!
    };

    this.authService.register(payload as any).pipe(
      switchMap(() => this.authService.login({ email: payload.email, password: payload.password }).pipe(
        catchError((loginErr) => {
          console.warn('Auto-login pós cadastro falhou, direcionando para o login:', loginErr);
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          if (returnUrl) {
            this.router.navigate(['/login'], { queryParams: { returnUrl, email: payload.email } });
          } else {
            this.router.navigate(['/login'], { queryParams: { email: payload.email } });
          }
          return of(null);
        })
      ))
    ).subscribe({
      next: (loginRes) => {
        if (!loginRes) return;
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.successMessage.set(returnUrl ? 'Conta criada com sucesso! Redirecionando para a sua reserva...' : 'Conta criada com sucesso! Entrando...');
        setTimeout(() => {
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
          } else {
            this.router.navigateByUrl('/destinations');
          }
        }, 1200);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Erro ao realizar cadastro.');
      }
    });
  }
}
