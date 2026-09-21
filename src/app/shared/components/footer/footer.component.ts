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
        <div class="d-flex align-items-center">
          <a routerLink="/destinations" class="d-flex align-items-center text-decoration-none">
            <img src="assets/LogoH.png" alt="Horizon" class="footer-logo" />
          </a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-horizon {
      background-color: #4895CC;
      width: 100%;
    }

    .footer-logo {
      height: 40px;
      width: auto;
      object-fit: contain;
      display: block;
    }
  `]
})
export class FooterComponent {}
