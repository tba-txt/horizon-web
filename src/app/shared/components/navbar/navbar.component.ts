import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg navbar-dark" 
         [ngClass]="isTransparent ? 'position-absolute top-0 mt-4 pt-1 start-0 w-100 shadow-none navbar-glass-home' : 'sticky-top shadow-sm navbar-glass-other'"
         [style.transition]="'background-color 0.3s ease'"
         [style.z-index]="1050">
      <div class="container">
        <a class="navbar-brand d-flex align-items-center" routerLink="/destinations">
          <img src="assets/LogoH.png" alt="Horizon" class="navbar-logo" />
        </a>

        <button 
          class="navbar-toggler" 
          type="button" 
          (click)="toggleMenu()"
          aria-controls="navbarNav" 
          [attr.aria-expanded]="isMenuOpen" 
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="isMenuOpen" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li class="nav-item">
              <a class="nav-link" routerLink="/destinations" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
                Destinos
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/quiz" routerLinkActive="active">
                Quiz
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/feed" routerLinkActive="active">
                Feed
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/recommendations" routerLinkActive="active">
                Recomendações
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/flights" routerLinkActive="active">
                Voos
              </a>
            </li>
          </ul>

          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-outline-light btn-sm px-3 fw-semibold" (click)="logout()">
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar-glass-home {
      background: rgba(255, 255, 255, 0.15) !important;
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .navbar-glass-other {
      background: rgba(255, 255, 255, 0.2) !important;
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    }

    .nav-link {
      font-size: 1.12rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.92) !important;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
      transition: all 0.2s ease-in-out;
      padding: 0.55rem 1.1rem;
    }

    .nav-link:hover, .nav-link.active {
      color: #ffffff !important;
      font-weight: 700;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
    }

    .nav-link.active {
      border-bottom: 3px solid #3a86ff;
    }

    .navbar-logo {
      height: 38px;
      width: auto;
      object-fit: contain;
      display: block;
    }
  `]
})
export class NavbarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isMenuOpen = false;
  isTransparent = false;

  ngOnInit() {
    this.checkUrl(this.router.url);

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkUrl(event.urlAfterRedirects);
    });
  }

  private checkUrl(url: string) {
    this.isTransparent = url.includes('/destinations') || 
                         url.includes('/flights') || 
                         url.includes('/feed') || 
                         url.includes('/recommendations') || 
                         url.includes('/quiz') || 
                         url === '/';
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
