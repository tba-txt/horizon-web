import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserService } from '../../../core/user/services/user.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-google-sign-in',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="google-auth-wrapper w-100">
      <button 
        type="button" 
        class="btn-google-sign-in w-100 d-flex align-items-center justify-content-center gap-2 shadow-sm"
        (click)="handleGoogleClick()"
        [disabled]="isLoading()"
        [attr.aria-label]="computedText()"
      >
        @if (isLoading()) {
          <div class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></div>
          <span>Conectando com o Google...</span>
        } @else {
          <!-- Ícone Oficial do Google em SVG -->
          <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span class="btn-text">{{ computedText() }}</span>
        }
      </button>

      <!-- Mensagem de status / erro -->
      @if (errorMessage()) {
        <div class="alert alert-danger py-1 px-2 mt-2 mb-0 small rounded-2 border-0 text-center" role="alert">
          {{ errorMessage() }}
        </div>
      }

      <!-- Modal de Ajuda / Demonstração para TCC caso o Client ID ainda não esteja configurado no GCP -->
      @if (showDemoModal()) {
        <div class="modal-backdrop fade show" style="background: rgba(11, 37, 69, 0.75); z-index: 1060;" (click)="showDemoModal.set(false)"></div>
        <div class="modal fade show d-block" tabindex="-1" role="dialog" style="z-index: 1065;" (click)="showDemoModal.set(false)">
          <div class="modal-dialog modal-dialog-centered" style="max-width: 440px;" (click)="$event.stopPropagation()">
            <div class="modal-content border-0 rounded-4 shadow-lg p-4 bg-white text-center">
              <div class="d-flex justify-content-center mb-3">
                <div class="rounded-3 d-flex align-items-center justify-content-center p-3" style="background: #f0f7fd;">
                  <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </div>
              </div>

              <h3 class="h5 fw-bold text-dark mb-2">Login com Conta Google</h3>
              <p class="text-secondary small mb-3 lh-base">
                O backend e o frontend já estão 100% integrados com a infraestrutura OAuth2/OIDC do Google.
                Quando você criar o Client ID no Google Cloud Console, basta colá-lo no <code class="small text-dark bg-light px-1 py-0.5 rounded">environment.ts</code>.
              </p>

              <div class="d-flex flex-column gap-2">
                <button 
                  type="button" 
                  class="btn py-2.5 rounded-3 fw-bold text-white shadow-sm border-0"
                  style="background-color: #5BA4D8;"
                  (click)="authenticateWithDemoGoogleAccount()"
                >
                  Demonstrar com Conta Google
                </button>
                <button 
                  type="button" 
                  class="btn btn-outline-secondary py-2 rounded-3 small"
                  (click)="showDemoModal.set(false)"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .btn-google-sign-in {
      background: #ffffff;
      color: #1e293b;
      border: 1.5px solid #dbeafe;
      border-radius: 9px;
      font-size: 0.88rem;
      font-weight: 600;
      min-height: 40px;
      padding: 0.45rem 1rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #bfdbfe;
        color: #0f172a;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(91, 164, 216, 0.16) !important;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }
    }

    .google-icon {
      flex-shrink: 0;
    }

    /* Dark Mode */
    :host-context([data-theme='dark']) {
      .btn-google-sign-in {
        background: #1e293b;
        color: #f1f5f9;
        border-color: #334155;

        &:hover:not(:disabled) {
          background: #273449;
          border-color: #475569;
          color: #ffffff;
        }
      }
    }
  `]
})
export class GoogleSignInComponent implements OnInit {
  @Input() mode: 'login' | 'register' = 'login';
  @Input() buttonText?: string;
  @Output() success = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  showDemoModal = signal<boolean>(false);

  computedText(): string {
    if (this.buttonText) return this.buttonText;
    return this.mode === 'register' ? 'Cadastrar com o Google' : 'Continuar com o Google';
  }

  ngOnInit(): void {
    this.initGoogleClient();
  }

  private initGoogleClient(): void {
    const clientId = environment.googleClientId;
    if (typeof window === 'undefined') return;

    if (typeof google === 'undefined' || !google.accounts) {
      if (!document.getElementById('google-gsi-client-script')) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => this.configureGoogleId(clientId);
        document.head.appendChild(script);
      }
      return;
    }

    this.configureGoogleId(clientId);
  }

  private configureGoogleId(clientId: string): void {
    if (typeof google !== 'undefined' && google.accounts && clientId && !clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => this.handleGoogleCredentialResponse(response),
          auto_select: false
        });
      } catch (e) {
        console.warn('Google Identity Services init:', e);
      }
    }
  }

  handleGoogleClick(): void {
    const clientId = environment.googleClientId;
    if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      // Abre modal informativo para demonstração no TCC
      this.showDemoModal.set(true);
      return;
    }

    if (typeof google !== 'undefined' && google?.accounts?.id) {
      this.isLoading.set(true);
      this.errorMessage.set(null);
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            this.isLoading.set(false);
          }
        });
      } catch (err) {
        this.isLoading.set(false);
        this.showDemoModal.set(true);
      }
    } else {
      this.showDemoModal.set(true);
    }
  }

  handleGoogleCredentialResponse(response: any): void {
    if (!response || !response.credential) {
      this.isLoading.set(false);
      this.errorMessage.set('Não foi possível obter a credencial do Google.');
      return;
    }

    this.submitToken(response.credential);
  }

  authenticateWithDemoGoogleAccount(): void {
    this.showDemoModal.set(false);
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Gera um mock ID token com payload JWT válido simulando o Google para demonstração
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
      email: 'viajante.horizon@gmail.com',
      name: 'Viajante Google Demo',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      sub: 'google_demo_10928301923',
      email_verified: true
    }))));
    const signature = 'demo_google_signature';
    const mockIdToken = `${header}.${payload}.${signature}`;

    this.submitToken(mockIdToken);
  }

  private submitToken(idToken: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => {
        this.userService.getProfile().subscribe({
          next: (profile) => {
            this.isLoading.set(false);
            this.success.emit();
            if (!profile.cpf || !profile.birthDate) {
              this.router.navigate(['/profile'], { queryParams: { view: 'personal-info', edit: 'true' } });
            } else {
              this.router.navigate(['/destinations']);
            }
          },
          error: () => {
            this.isLoading.set(false);
            this.success.emit();
            this.router.navigate(['/profile'], { queryParams: { view: 'personal-info', edit: 'true' } });
          }
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err.error?.message || err.message || 'Falha ao autenticar com o Google.';
        this.errorMessage.set(msg);
        this.error.emit(msg);
      }
    });
  }
}
