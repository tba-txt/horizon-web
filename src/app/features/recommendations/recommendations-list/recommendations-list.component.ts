import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { RecommendationsService } from '../services/recommendations.service';
import { Recommendation } from '../models/recommendation.model';

@Component({
  selector: 'app-recommendations-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/recommend.jpg" 
        alt="Recomendações Hero" 
        class="w-100 hero-image"
        (error)="handleHeroError($event)"
      />
    </header>

    <main class="container py-5">
      <!-- Header da Pagina -->
      <div class="row mb-4 align-items-center">
        <div class="col-lg-8">
          <h1 class="h3 fw-bold text-dark mb-1">Recomendações</h1>
        </div>

        <div class="col-lg-4 text-lg-end mt-3 mt-lg-0">
          <button (click)="loadRecommendations()" class="btn btn-outline-primary btn-sm px-3 rounded-pill" [disabled]="isLoading()">
            Atualizar Recomendações
          </button>
        </div>
      </div>

      <!-- Estado: Loading -->
      @if (isLoading()) {
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Calculando recomendações...</span>
          </div>
          <p class="text-muted fw-medium">Consultando algoritmo de recomendação...</p>
        </div>
      }

      <!-- Estado: Erro -->
      @else if (errorMessage()) {
        <div class="alert alert-danger d-flex flex-column align-items-center justify-content-center p-4 my-4 rounded-3 text-center" role="alert">
          <h5 class="fw-bold mb-2">Não foi possível carregar as recomendações.</h5>
          <p class="mb-3 small text-danger-emphasis">{{ errorMessage() }}</p>
          <button class="btn btn-outline-danger btn-sm px-4" (click)="loadRecommendations()">
            Tentar novamente
          </button>
        </div>
      }

      <!-- Estado: Lista Vazia -->
      @else if (recommendations().length === 0) {
        <div class="card border shadow-sm rounded-4 text-center p-5 bg-white">
          <h3 class="h5 fw-bold text-dark mb-2">Nenhuma recomendação gerada ainda</h3>
          <p class="text-muted small mb-4">
            Responda ao quiz ou interaja com publicações no feed para gerar suas recomendações.
          </p>
          <div class="d-flex justify-content-center gap-2">
            <a routerLink="/quiz" class="btn btn-primary btn-sm px-4 rounded-pill">
              Responder Quiz
            </a>
            <a routerLink="/feed" class="btn btn-outline-secondary btn-sm px-4 rounded-pill">
              Ir para o Feed
            </a>
          </div>
        </div>
      }

      <!-- Estado: Lista de Recomendações (Grid de 2 colunas) -->
      @else {
        <div class="row row-cols-1 row-cols-md-2 g-4">
          @for (rec of recommendations(); track rec.destinationId) {
            <div class="col">
              <div class="card h-100 border rounded-3 overflow-hidden destination-card shadow-sm" style="border-color: #5BA4D8 !important; border-width: 2px !important; background-color: #f4f7f9;">
                
                <div class="position-relative cursor-pointer" style="height: 220px;" [routerLink]="['/flights']" [queryParams]="{ destinationId: rec.destinationId }">
                  <img 
                    [src]="rec.imageUrl || placeholderImage" 
                    [alt]="rec.destinationName" 
                    class="w-100 h-100 object-fit-cover"
                    loading="lazy"
                    (error)="handleImageError($event)"
                  />
                  
                  <!-- Horizon Tag (Top Left) -->
                  <div class="position-absolute top-0 start-0 p-2 pointer-events-none">
                    <img src="assets/LogoH.png" alt="Horizon" style="height: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); pointer-events: none;">
                  </div>

                  <!-- Score Pill (Top Right) -->
                  @if (rec.score !== undefined && rec.score !== null) {
                    <div class="position-absolute top-0 end-0 m-2">
                      <span class="badge bg-primary text-white rounded-pill px-3 py-2 fw-bold shadow-sm" style="font-size: 0.85rem;">
                        {{ formatScore(rec.score) }}
                      </span>
                    </div>
                  }

                  <!-- Botão Info (Bottom Right overlapping) -->
                  <button class="btn position-absolute rounded-3 p-1 d-flex align-items-center justify-content-center shadow-sm"
                          style="bottom: -16px; right: 15px; width: 32px; height: 32px; background-color: #5BA4D8; border: 2px solid white; z-index: 5;"
                          [routerLink]="['/flights']" [queryParams]="{ destinationId: rec.destinationId }">
                    <img src="assets/info-icon.png" alt="Info" class="w-100 h-100 object-fit-contain">
                  </button>
                </div>

                <!-- Card Body -->
                <div class="card-body p-4 pt-3 d-flex flex-column cursor-pointer" [routerLink]="['/flights']" [queryParams]="{ destinationId: rec.destinationId }">
                  <h3 class="h5 mb-1 cursor-pointer" style="color: #5BA4D8;">
                    <span class="fw-bold">{{ rec.destinationName }}</span> 
                    <span class="fw-normal">({{ rec.country }})</span>
                  </h3>
                  <p class="mb-0 fw-semibold mt-1" style="color: #63B921; font-size: 0.95rem;">
                    Voo de ida e volta a partir de {{ formatPrice(rec.basePrice) }}
                  </p>
                </div>

              </div>
            </div>
          }
        </div>
      }
    </main>

    <!-- Footer -->
    <app-footer></app-footer>
  `,
  styles: [`
    .hero-container {
      width: 100%;
      background: #0b2545;
      max-height: 480px;
    }

    .hero-image {
      width: 100%;
      height: 480px;
      object-fit: cover;
      display: block;
    }

    .destination-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .destination-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.1) !important;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .pointer-events-none {
      pointer-events: none;
    }

    .object-fit-cover {
      object-fit: cover;
    }
  `]
})
export class RecommendationsListComponent implements OnInit {
  private recommendationsService = inject(RecommendationsService);

  recommendations = signal<Recommendation[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop';
  readonly placeholderHero = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop';

  handleHeroError(event: any): void {
    event.target.src = this.placeholderHero;
  }

  ngOnInit(): void {
    this.loadRecommendations();
  }

  loadRecommendations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.recommendationsService.getRecommendations().subscribe({
      next: (data) => {
        this.recommendations.set(data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao obter recomendações.');
      }
    });
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  formatTourismType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }

  formatScore(score?: number): string {
    if (score === undefined || score === null) return '';
    // Converte score retornado pelo backend diretamente para porcentagem
    // Se 0.54 -> 54%. Se 54 -> 54%.
    const percentage = score <= 1.0 ? Math.round(score * 100) : Math.round(score);
    return `${percentage}%`;
  }
}
