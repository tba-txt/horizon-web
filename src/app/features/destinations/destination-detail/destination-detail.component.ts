import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationsService } from '../services/destinations.service';
import { Destination } from '../models/destination.model';

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="container py-5">
      <!-- Breadcrumb / Voltar -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/destinations" class="text-decoration-none">Destinos</a></li>
          <li class="breadcrumb-item active" aria-current="page">
            {{ destination() ? destination()!.name : 'Detalhes' }}
          </li>
        </ol>
      </nav>

      <!-- Estado: Loading -->
      @if (isLoading()) {
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Carregando detalhes...</span>
          </div>
          <p class="text-muted fw-medium">Buscando informações do destino...</p>
        </div>
      }

      <!-- Estado: Erro -->
      @else if (errorMessage()) {
        <div class="alert alert-danger d-flex flex-column align-items-center justify-content-center p-4 my-4 rounded-3 text-center" role="alert">
          <h5 class="fw-bold mb-2">Não foi possível carregar os detalhes deste destino.</h5>
          <p class="mb-3 small text-danger-emphasis">{{ errorMessage() }}</p>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-danger btn-sm px-4" (click)="loadDestination()">
              Tentar novamente
            </button>
            <a routerLink="/destinations" class="btn btn-secondary btn-sm px-4">
              Voltar para a lista
            </a>
          </div>
        </div>
      }

      <!-- Estado: Sucesso -->
      @else if (destination()) {
        <div class="row g-5">
          <!-- Coluna da Imagem -->
          <div class="col-lg-7">
            <div class="position-relative rounded-4 overflow-hidden shadow-sm detail-image-wrapper">
              <img 
                [src]="destination()!.imageUrl || placeholderImage" 
                [alt]="destination()!.name" 
                class="img-fluid w-100 h-100 object-fit-cover"
                (error)="handleImageError($event)"
              />
              @if (destination()!.tourismType) {
                <span class="badge bg-dark bg-opacity-75 position-absolute top-0 end-0 m-4 px-3 py-2 rounded-pill fs-6 shadow-sm">
                  {{ formatTourismType(destination()!.tourismType!) }}
                </span>
              }
            </div>
          </div>

          <!-- Coluna de Informações e Ações -->
          <div class="col-lg-5 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-primary-subtle text-primary fw-semibold px-3 py-1 rounded-pill">
                  {{ destination()!.city }}, {{ destination()!.country }}
                </span>
              </div>

              <h1 class="display-6 fw-bold text-dark mb-3">
                {{ destination()!.name }}
              </h1>

              <p class="text-secondary lead fs-6 mb-4">
                Explore as belezas e atrações inesquecíveis que {{ destination()!.name }} tem a oferecer. 
                Uma experiência completa pensada para o seu estilo de viagem.
              </p>

              <!-- Card de Preço / Destaque -->
              <div class="card border-0 bg-light rounded-4 p-4 mb-4">
                <span class="text-muted small mb-1">Preço base sugerido</span>
                <div class="d-flex align-items-baseline gap-2">
                  <span class="display-6 fw-bold text-primary">
                    {{ formatPrice(destination()!.basePrice) }}
                  </span>
                  <span class="text-muted small">/ por pessoa</span>
                </div>
              </div>
            </div>

            <!-- Botões de Ação do Fluxo -->
            <div class="d-flex flex-column gap-3 pt-3">
              <a routerLink="/quiz" class="btn btn-primary py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm">
                <span>Personalizar Perfil (Quiz)</span>
                <span>→</span>
              </a>

              <a routerLink="/flights" class="btn btn-outline-primary py-3 rounded-3 fw-semibold text-center">
                Consultar Voos Disponíveis
              </a>

              <a routerLink="/destinations" class="btn btn-link text-secondary text-center text-decoration-none small">
                ← Voltar para lista de destinos
              </a>
            </div>
          </div>
        </div>
      }
    </main>

    <!-- Footer -->
    <app-footer></app-footer>
  `,
  styles: [`
    .detail-image-wrapper {
      min-height: 420px;
      max-height: 520px;
      background-color: #f1f5f9;
    }

    .object-fit-cover {
      object-fit: cover;
    }
  `]
})
export class DestinationDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destinationsService = inject(DestinationsService);

  destination = signal<Destination | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop';

  ngOnInit(): void {
    this.loadDestination();
  }

  loadDestination(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage.set('Identificador do destino não informado.');
      this.isLoading.set(false);
      return;
    }

    const id = Number(idParam);
    if (isNaN(id)) {
      this.errorMessage.set('Identificador de destino inválido.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.destinationsService.getDestinationById(id).subscribe({
      next: (data) => {
        this.destination.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Destino não encontrado.');
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
}
