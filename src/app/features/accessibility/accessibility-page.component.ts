import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AccessibilitySettingsComponent } from './accessibility-settings.component';

/** Página pública /accessibility: as mesmas preferências do perfil, sem exigir login. */
@Component({
  selector: 'app-accessibility-page',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, AccessibilitySettingsComponent],
  template: `
    <app-navbar></app-navbar>
    <main class="a11y-page">
      <header class="a11y-hero">
        <div class="container">
          <h1>Acessibilidade</h1>
          <p>Personalize texto, contraste, movimento e leitura em voz alta.</p>
        </div>
      </header>
      <div class="container py-4 py-md-5">
        <app-accessibility-settings></app-accessibility-settings>
      </div>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    .a11y-hero {
      background: #0b2545;
      color: #ffffff;
      padding: 8rem 0 3rem;
    }
    .a11y-hero h1 { font-weight: 700; margin-bottom: 0.5rem; }
    .a11y-hero p { margin: 0; color: #e2e8f0; font-size: 1.1rem; }
    .a11y-page { min-height: 70vh; }
  `],
})
export class AccessibilityPageComponent {}
