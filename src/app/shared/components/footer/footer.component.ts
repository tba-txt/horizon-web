import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer-horizon py-4 mt-auto">
      <div class="container">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <a routerLink="/destinations" class="d-flex align-items-center text-decoration-none" aria-label="Horizon Travel">
            <img src="assets/LogoH.png" alt="Horizon Travel" class="footer-logo" width="120" height="38" loading="lazy" decoding="async" />
          </a>

          <div class="text-white text-opacity-90 small fw-medium">
            © 2026 Horizon Travel. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-horizon {
      background-color: #4895CC;
      width: 100%;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
    }

    .footer-logo {
      height: 38px;
      width: auto;
      object-fit: contain;
      display: block;
    }
  `]
})
export class FooterComponent {}
