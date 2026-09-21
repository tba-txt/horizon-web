import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationsService } from '../services/destinations.service';
import { Destination } from '../models/destination.model';

@Component({
  selector: 'app-common-destinations',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/comum.webp" 
        alt="Destinos Comuns Hero" 
        class="w-100 hero-image"
        (error)="handleHeroError($event)"
      />
    </header>

    <main class="container py-5">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/destinations" class="text-decoration-none">Destinos</a></li>
          <li class="breadcrumb-item active" aria-current="page">Destinos Comuns</li>
        </ol>
      </nav>

      <div class="mb-4 pb-3">
        <h1 class="h2 fw-bold mb-1" style="color: #4895CC;">Destinos Comuns</h1>
      </div>

      <!-- Filtro por Continente -->
      <div class="mb-4 border-bottom">
        <ul class="nav nav-tabs border-0 custom-tabs flex-nowrap overflow-auto" style="gap: 1.5rem;">
          <li class="nav-item">
            <a class="nav-link px-0 pb-3" [class.active-tab]="selectedContinent() === null" (click)="setContinent(null)" style="cursor: pointer; color: #495057; font-weight: 500; border: none; background: transparent;">Todos</a>
          </li>
          @for (continent of continents; track continent) {
            <li class="nav-item">
              <a class="nav-link px-0 pb-3" [class.active-tab]="selectedContinent() === continent" (click)="setContinent(continent)" style="cursor: pointer; color: #495057; font-weight: 500; border: none; background: transparent; white-space: nowrap;">{{ continent }}</a>
            </li>
          }
        </ul>
      </div>

      @if (isLoading()) {
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
          <p class="text-muted fw-medium">Carregando destinos...</p>
        </div>
      } @else if (filteredDestinations().length === 0) {
        <div class="text-center py-5 rounded-4 bg-light border border-secondary border-opacity-10">
          <p class="text-secondary mb-0 fw-medium">Não foram encontrados destinos para este continente.</p>
        </div>
      } @else {
        <div class="row row-cols-1 row-cols-md-2 g-4">
          @for (dest of filteredDestinations(); track dest.id) {
            <div class="col">
              <div class="card h-100 border rounded-3 overflow-hidden destination-card shadow-sm" style="border-color: #5BA4D8 !important; border-width: 2px !important; background-color: #f4f7f9;">
                
                <div class="position-relative cursor-pointer" style="height: 220px;" [routerLink]="['/flights']" [queryParams]="{ destinationId: dest.id }">
                  <img 
                    [src]="dest.imageUrl || placeholderImage" 
                    [alt]="dest.name" 
                    class="w-100 h-100 object-fit-cover"
                    loading="lazy"
                    (error)="handleImageError($event)"
                  />
                  
                  <!-- Horizon Tag (Top Left) -->
                  <div class="position-absolute top-0 start-0 p-2 pointer-events-none">
                    <img src="assets/LogoH.png" alt="Horizon" style="height: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); pointer-events: none;">
                  </div>

                  <!-- Botão Info (Bottom Right overlapping) -->
                  <button class="btn position-absolute rounded-3 p-1 d-flex align-items-center justify-content-center shadow-sm"
                          style="bottom: -16px; right: 15px; width: 32px; height: 32px; background-color: #5BA4D8; border: 2px solid white; z-index: 5;"
                          [routerLink]="['/flights']" [queryParams]="{ destinationId: dest.id }">
                    <img src="assets/info-icon.png" alt="Info" class="w-100 h-100 object-fit-contain">
                  </button>
                </div>

                <!-- Card Body -->
                <div class="card-body p-4 pt-3 d-flex flex-column cursor-pointer" [routerLink]="['/flights']" [queryParams]="{ destinationId: dest.id }">
                  <h3 class="h5 mb-1 cursor-pointer" style="color: #5BA4D8;">
                    <span class="fw-bold">{{ dest.name }}</span> 
                    <span class="fw-normal">({{ dest.country }})</span>
                  </h3>
                  <p class="mb-0 fw-semibold mt-1" style="color: #63B921; font-size: 0.95rem;">
                    Voo de ida e volta a partir de {{ formatPrice(dest.basePrice) }}
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
    .nav-tabs::-webkit-scrollbar {
      height: 4px;
    }
    .nav-tabs::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 4px;
    }
    .active-tab {
      color: #4895CC !important;
      border-bottom: 3px solid #4895CC !important;
    }
    .nav-link:hover {
      color: #4895CC !important;
    }
    .custom-btn { background-color: #4895CC; border-color: #4895CC; }
    .custom-btn:hover { background-color: #3879a8; border-color: #3879a8; }
    .card-img-container { height: 220px; background: #f1f5f9; }
    .object-fit-cover { object-fit: cover; }
    .destination-card { border-color: #e2e8f0; transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .destination-card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08) !important; }
  `]
})
export class CommonDestinationsComponent implements OnInit {
  private destinationsService = inject(DestinationsService);

  destinations = signal<Destination[]>([]);
  isLoading = signal(true);
  
  continents = [
    'América do Sul', 'América do Norte', 'Europa', 'África', 'Ásia', 'Oceania', 'Antártida'
  ];
  selectedContinent = signal<string | null>(null);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';

  handleHeroError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  filteredDestinations = computed(() => {
    const list = this.destinations();
    const cont = this.selectedContinent();
    if (!cont) return list;
    return list.filter(d => this.getContinent(d) === cont);
  });

  ngOnInit(): void {
    this.destinationsService.getDestinations().subscribe({
      next: (data) => {
        const list = (data || []).filter(d => (d.tourismType || '').toUpperCase() === 'COMUM');
        this.destinations.set(list.length > 0 ? list : (data || []));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setContinent(continent: string | null): void {
    this.selectedContinent.set(continent);
  }

  getContinent(dest: Destination): string {
    if (dest.continent) return dest.continent;
    
    const countryMap: Record<string, string> = {
      'Brasil': 'América do Sul',
      'Argentina': 'América do Sul',
      'Chile': 'América do Sul',
      'Peru': 'América do Sul',
      'Colômbia': 'América do Sul',
      'França': 'Europa',
      'Itália': 'Europa',
      'Espanha': 'Europa',
      'Portugal': 'Europa',
      'Alemanha': 'Europa',
      'Inglaterra': 'Europa',
      'Reino Unido': 'Europa',
      'Holanda': 'Europa',
      'Grécia': 'Europa',
      'Suíça': 'Europa',
      'Japão': 'Ásia',
      'China': 'Ásia',
      'Tailândia': 'Ásia',
      'Coreia do Sul': 'Ásia',
      'Índia': 'Ásia',
      'Vietnã': 'Ásia',
      'África do Sul': 'África',
      'Egito': 'África',
      'Marrocos': 'África',
      'Tanzânia': 'África',
      'Quênia': 'África',
      'Estados Unidos': 'América do Norte',
      'Canadá': 'América do Norte',
      'México': 'América do Norte',
      'Austrália': 'Oceania',
      'Nova Zelândia': 'Oceania',
      'Antártida': 'Antártida'
    };

    return countryMap[dest.country] || 'Outros';
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }
}
