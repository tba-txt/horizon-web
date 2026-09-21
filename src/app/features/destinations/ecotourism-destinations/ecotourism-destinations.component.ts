import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationsService } from '../services/destinations.service';
import { Destination } from '../models/destination.model';
import { DestinationWeather } from '../models/weather.model';

@Component({
  selector: 'app-ecotourism-destinations',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/ecoturismo.webp" 
        alt="Ecoturismo Hero" 
        class="w-100 hero-image"
        (error)="handleHeroError($event)"
      />
    </header>

    <main class="container py-5">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/destinations" class="text-decoration-none">Destinos</a></li>
          <li class="breadcrumb-item active" aria-current="page">Ecoturismo</li>
        </ol>
      </nav>

      <div class="mb-4 pb-3">
        <h1 class="h2 fw-bold mb-1" style="color: #63B921;">Destinos de Ecoturismo</h1>
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
          <div class="spinner-border text-success mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
          <p class="text-muted fw-medium">Carregando destinos ecológicos...</p>
        </div>
      } @else if (filteredDestinations().length === 0) {
        <div class="text-center py-5 rounded-4 bg-light border border-secondary border-opacity-10">
          <p class="text-secondary mb-0 fw-medium">Não foram encontrados destinos para este continente.</p>
        </div>
      } @else {
        <div class="row row-cols-1 row-cols-md-2 g-4">
          @for (dest of filteredDestinations(); track dest.id) {
            <div class="col">
              <div class="card h-100 border rounded-3 overflow-hidden destination-card shadow-sm" style="border-color: #63B921 !important; border-width: 2px !important; background-color: #f4f7f9;">
                
                <div class="position-relative cursor-pointer" style="height: 220px;" (click)="openDetailModal(dest)">
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

                  <!-- Botão Info (Bottom Right overlapping) - VERDE -->
                  <button class="btn position-absolute rounded-3 p-1 d-flex align-items-center justify-content-center shadow-sm"
                          style="bottom: -16px; right: 15px; width: 32px; height: 32px; background-color: #63B921; border: 2px solid white; z-index: 5;"
                          (click)="openDetailModal(dest); $event.stopPropagation()">
                    <img src="assets/info-icon.png" alt="Info" class="w-100 h-100 object-fit-contain">
                  </button>
                </div>

                <!-- Card Body -->
                <div class="card-body p-4 pt-3 d-flex flex-column" (click)="openDetailModal(dest)">
                  <h3 class="h5 mb-1 cursor-pointer" style="color: #63B921;">
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

    <!-- MODAL DE DETALHES DO DESTINO -->
    @if (selectedDestination()) {
      <div class="modal fade show d-block modal-backdrop-custom" tabindex="-1" role="dialog" aria-modal="true" style="background-color: rgba(0,0,0,0.7);" (click)="closeModal()">
        <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document" style="max-width: 850px;" (click)="$event.stopPropagation()">
          <div class="modal-content border-0 shadow-lg overflow-hidden" style="background-color: #eef2f6; border-radius: 0;">
            
            <!-- Close Button -->
            <button type="button" class="btn-close position-absolute top-0 end-0 m-4" style="z-index: 1055; filter: invert(1); opacity: 0.9;" (click)="closeModal()" aria-label="Close"></button>

            <!-- Modal Body -->
            <div class="modal-body p-0">
              
              <!-- Hero Image Area -->
              <div class="position-relative w-100" style="height: 320px;">
                <img [src]="selectedDestination()!.imageUrl || placeholderImage" class="w-100 h-100 object-fit-cover" alt="Destination Image">
                
                <!-- Gradient Overlay -->
                <div class="position-absolute bottom-0 start-0 w-100 p-4 pb-3" style="background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);">
                  <h2 class="text-white fw-bold mb-2" style="font-size: 3rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">{{ selectedDestination()!.name }}</h2>
                </div>
              </div>

              <!-- Content Area -->
              <div class="p-4 p-md-5">
                <h3 class="fw-bold mb-4 fs-5 text-dark">{{ selectedDestination()!.country }}</h3>
                
                <div class="row g-5">
                  <!-- Weather Chart -->
                  <div class="col-12 col-md-6">
                    <div class="card border rounded-3 h-100 p-4 shadow-sm bg-white d-flex flex-column justify-content-between" style="border-color: #dee2e6 !important;">
                      <div class="d-flex justify-content-between align-items-end gap-3" style="min-height: 200px;">
                        
                        <!-- Bar 1 (Mock) -->
                        <div class="d-flex flex-column align-items-center flex-grow-1">
                          <div class="w-100 rounded-top-2 d-flex flex-column justify-content-end pb-2 align-items-center transition-all" style="background-color: #63B921;" [style.height.px]="getBarHeight(getMockTemp(-2))">
                            <span class="text-white fw-bold" style="font-size: 0.8rem;">Em 3 dias</span>
                          </div>
                          <div class="bg-white w-100 border border-top-0 text-center py-2 rounded-bottom-2">
                            <i class="bi fs-5 text-secondary d-block" [class.bi-snow]="isPolarDestination()" [class.bi-cloud-fill]="!isPolarDestination()"></i>
                            <span class="fw-bold small d-block mt-1">{{ getMockTemp(-2) }}°C</span>
                            <span class="text-dark fw-medium d-block mt-1" style="font-size: 0.65rem;">
                              <i class="bi" [class.bi-snow]="isPolarDestination()" [class.bi-droplet-fill]="!isPolarDestination()"></i> {{ getMockHumidity(-4) }}%
                            </span>
                          </div>
                        </div>

                        <!-- Bar 2 (Mock) -->
                        <div class="d-flex flex-column align-items-center flex-grow-1">
                          <div class="w-100 rounded-top-2 d-flex flex-column justify-content-end pb-2 align-items-center transition-all" style="background-color: #63B921;" [style.height.px]="getBarHeight(getMockTemp(-1))">
                            <span class="text-white fw-bold" style="font-size: 0.8rem;">Em 2 dias</span>
                          </div>
                          <div class="bg-white w-100 border border-top-0 text-center py-2 rounded-bottom-2">
                            <i class="bi fs-5 text-secondary d-block" [class.bi-cloud-snow-fill]="isPolarDestination()" [class.bi-cloud-sun-fill]="!isPolarDestination()"></i>
                            <span class="fw-bold small d-block mt-1">{{ getMockTemp(-1) }}°C</span>
                            <span class="text-dark fw-medium d-block mt-1" style="font-size: 0.65rem;">
                              <i class="bi" [class.bi-snow]="isPolarDestination()" [class.bi-droplet-fill]="!isPolarDestination()"></i> {{ getMockHumidity(8) }}%
                            </span>
                          </div>
                        </div>

                        <!-- Bar 3 (Mock) -->
                        <div class="d-flex flex-column align-items-center flex-grow-1">
                          <div class="w-100 rounded-top-2 d-flex flex-column justify-content-end pb-2 align-items-center transition-all" style="background-color: #63B921;" [style.height.px]="getBarHeight(getMockTemp(+1))">
                            <span class="text-white fw-bold" style="font-size: 0.8rem;">Amanhã</span>
                          </div>
                          <div class="bg-white w-100 border border-top-0 text-center py-2 rounded-bottom-2">
                            <i class="bi fs-5 text-secondary d-block" [class.bi-snow2]="isPolarDestination()" [class.bi-cloud-fill]="!isPolarDestination()"></i>
                            <span class="fw-bold small d-block mt-1">{{ getMockTemp(+1) }}°C</span>
                            <span class="text-dark fw-medium d-block mt-1" style="font-size: 0.65rem;">
                              <i class="bi" [class.bi-snow]="isPolarDestination()" [class.bi-droplet-fill]="!isPolarDestination()"></i> {{ getMockHumidity(-6) }}%
                            </span>
                          </div>
                        </div>

                        <!-- Bar 4 (Real API Data) -->
                        <div class="d-flex flex-column align-items-center flex-grow-1">
                          <div class="w-100 rounded-top-2 d-flex flex-column justify-content-end pb-2 align-items-center transition-all" style="background-color: #63B921;" [style.height.px]="getBarHeight(getRealTemp())">
                            <span class="text-white fw-bold" style="font-size: 0.8rem;">Hoje</span>
                          </div>
                          <div class="bg-white w-100 border border-top-0 text-center py-2 rounded-bottom-2">
                            <i class="bi fs-5 text-secondary d-block" [class.bi-snow]="isPolarDestination()" [class.bi-cloud-sun-fill]="!isPolarDestination()"></i>
                            <span class="fw-bold small d-block mt-1">{{ getRealTemp() }}°C</span>
                            <span class="text-dark fw-medium d-block mt-1" style="font-size: 0.65rem;">
                              <i class="bi" [class.bi-snow]="isPolarDestination()" [class.bi-droplet-fill]="!isPolarDestination()"></i> {{ getRealHumidity() }}%
                            </span>
                          </div>
                        </div>

                      </div>

                      <!-- Open-Meteo Extra Features Strip -->
                      <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center small text-muted">
                        <div>
                          <i class="bi bi-thermometer-half me-1 text-secondary"></i>
                          <span>Sensação: <strong class="text-dark">{{ getApparentTemp() }}°C</strong></span>
                        </div>
                        <div>
                          <i class="bi bi-wind me-1 text-secondary"></i>
                          <span>Vento: <strong class="text-dark">{{ getWindSpeed() }} km/h</strong></span>
                        </div>
                        <div>
                          <span class="fw-medium text-secondary">{{ getWeatherConditionLabel() }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="col-12 col-md-6">
                    <h3 class="fw-bold mb-3 fs-3 text-dark">{{ selectedDestination()!.name }}</h3>
                    <p class="text-dark fw-medium" style="line-height: 1.5; font-size: 0.95rem;">
                      {{ selectedDestination()!.description || 'Descubra este incrível destino com a Horizon. Paisagens deslumbrantes, cultura rica e uma experiência inesquecível aguardam por você nesta viagem especial.' }}
                    </p>
                  </div>
                </div>

                <!-- Gallery Placeholder -->
                <div class="mt-5">
                  <h3 class="fw-bold mb-4 fs-3 text-dark">Confira algumas fotos da cidade</h3>
                  <div class="row g-3">
                    <div class="col-12 col-md-4">
                      <div class="wireframe-box w-100" style="height: 350px;"></div>
                    </div>
                    <div class="col-12 col-md-8">
                      <div class="row g-3 h-100">
                        <div class="col-6" style="height: 167px;">
                          <div class="wireframe-box w-100 h-100"></div>
                        </div>
                        <div class="col-6" style="height: 167px;">
                          <div class="wireframe-box w-100 h-100"></div>
                        </div>
                        <div class="col-12" style="height: 167px;">
                          <div class="row g-3 h-100">
                            <div class="col-4"><div class="wireframe-box w-100 h-100"></div></div>
                            <div class="col-4"><div class="wireframe-box w-100 h-100"></div></div>
                            <div class="col-4"><div class="wireframe-box w-100 h-100"></div></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Sticky Footer -->
            <div class="modal-footer bg-white border-top-0 shadow p-3 px-md-4 d-flex justify-content-between align-items-center flex-nowrap z-3 position-relative">
              <div>
                <h4 class="fw-bold mb-0 fs-6 text-dark">São Paulo (SAO) - {{ selectedDestination()!.name }}</h4>
              </div>
              
              <div class="d-flex align-items-center gap-4">
                <div class="text-end d-none d-sm-block">
                  <span class="fw-bold d-block lh-1 text-dark" style="font-size: 0.8rem;">Por</span>
                  <span class="fw-bold fs-5 mt-1 d-block" style="color: #63B921;">{{ formatPrice(selectedDestination()!.basePrice) }}</span>
                </div>
                <button class="btn border-0 text-white fw-bold px-4 py-2" style="background-color: #ff5c8d; border-radius: 4px; font-size: 1rem; letter-spacing: 0.5px;" (click)="navigateToFlights(selectedDestination()!.id)">
                  RESERVAR AGORA
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    }
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
      color: #63B921 !important;
      border-bottom: 3px solid #63B921 !important;
    }
    .nav-link:hover {
      color: #63B921 !important;
    }
    .destination-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .destination-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08) !important;
    }
    .cursor-pointer {
      cursor: pointer;
    }
    .pointer-events-none {
      pointer-events: none;
    }
    .transition-all {
      transition: all 0.3s ease-in-out;
    }
  `]
})
export class EcotourismDestinationsComponent implements OnInit {
  private destinationsService = inject(DestinationsService);
  private router = inject(Router);

  destinations = signal<Destination[]>([]);
  isLoading = signal(true);

  selectedDestination = signal<Destination | null>(null);
  weather = signal<DestinationWeather | null>(null);
  isLoadingWeather = signal(false);

  continents = [
    'América do Sul', 'América do Norte', 'Europa', 'África', 'Ásia', 'Oceania', 'Antártida'
  ];
  selectedContinent = signal<string | null>(null);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=800&auto=format&fit=crop';

  filteredDestinations = computed(() => {
    const list = this.destinations();
    const cont = this.selectedContinent();
    if (!cont) return list;
    return list.filter(d => this.getContinent(d) === cont);
  });

  ngOnInit(): void {
    this.destinationsService.getDestinations().subscribe({
      next: (data) => {
        const list = (data || []).filter(d => (d.tourismType || '').toUpperCase() === 'ECOTURISMO');
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
      'Equador': 'América do Sul',
      'Bolívia': 'América do Sul',
      'França': 'Europa',
      'Itália': 'Europa',
      'Espanha': 'Europa',
      'Portugal': 'Europa',
      'Alemanha': 'Europa',
      'Inglaterra': 'Europa',
      'Reino Unido': 'Europa',
      'Holanda': 'Europa',
      'Suíça': 'Europa',
      'Grécia': 'Europa',
      'Noruega': 'Europa',
      'Japão': 'Ásia',
      'China': 'Ásia',
      'Tailândia': 'Ásia',
      'Coreia do Sul': 'Ásia',
      'Índia': 'Ásia',
      'Indonésia': 'Ásia',
      'Malásia': 'Ásia',
      'África do Sul': 'África',
      'Egito': 'África',
      'Marrocos': 'África',
      'Tanzânia': 'África',
      'Quênia': 'África',
      'Namíbia': 'África',
      'Estados Unidos': 'América do Norte',
      'Canadá': 'América do Norte',
      'México': 'América do Norte',
      'Austrália': 'Oceania',
      'Nova Zelândia': 'Oceania',
      'Fiji': 'Oceania',
      'Antártida': 'Antártida'
    };

    return countryMap[dest.country] || 'Outros';
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  handleHeroError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }

  openDetailModal(dest: Destination): void {
    this.selectedDestination.set(dest);
    this.weather.set(null);
    this.isLoadingWeather.set(true);

    this.destinationsService.getDestinationWeather(dest.id).subscribe({
      next: (w) => {
        this.weather.set(w);
        this.isLoadingWeather.set(false);
      },
      error: (err) => {
        console.warn('Erro ao carregar clima para destino', err);
        this.isLoadingWeather.set(false);
      }
    });
  }

  closeModal(): void {
    this.selectedDestination.set(null);
    this.weather.set(null);
  }

  navigateToFlights(destinationId: number): void {
    this.closeModal();
    this.router.navigate(['/flights'], { queryParams: { destinationId } });
  }

  isPolarDestination(): boolean {
    const name = (this.selectedDestination()?.name || '').toLowerCase();
    const city = (this.selectedDestination()?.city || '').toLowerCase();
    const country = (this.selectedDestination()?.country || '').toLowerCase();
    return name.includes('antártida') || name.includes('antarctica') || city.includes('antártida') || country.includes('antártida');
  }

  getRealTemp(): number {
    const isPolar = this.isPolarDestination();
    const fMax = this.weather()?.forecast?.maxTemperature;
    if (fMax !== undefined && fMax !== null) {
      return Math.round(fMax);
    }
    const hMax = this.weather()?.historicalContext?.maxTemperature;
    if (hMax !== undefined && hMax !== null) {
      return Math.round(hMax);
    }
    return isPolar ? -18 : 25;
  }

  getMockTemp(offset: number): number {
    return this.getRealTemp() + offset;
  }

  getBarHeight(temp: number): number {
    const t1 = this.getMockTemp(-2);
    const t2 = this.getMockTemp(-1);
    const t3 = this.getMockTemp(+1);
    const t4 = this.getRealTemp();
    const min = Math.min(t1, t2, t3, t4);
    const max = Math.max(t1, t2, t3, t4);

    if (max === min) {
      return 100;
    }

    const ratio = (temp - min) / (max - min);
    return Math.round(70 + ratio * 70);
  }

  getApparentTemp(): number {
    const app = this.weather()?.forecast?.apparentTemperature;
    if (app !== undefined && app !== null) {
      return Math.round(app);
    }
    return this.isPolarDestination() ? -28 : (this.getRealTemp() + 2);
  }

  getWindSpeed(): number {
    const wind = this.weather()?.forecast?.windSpeedKmH;
    if (wind !== undefined && wind !== null) {
      return Math.round(wind);
    }
    return this.isPolarDestination() ? 48 : 14;
  }

  getWeatherConditionLabel(): string {
    if (this.isPolarDestination()) {
      return 'Vento Polar & Neve';
    }
    return this.weather()?.forecast?.weatherDescription || this.weather()?.forecast?.description || 'Céu Limpo';
  }

  getRealHumidity(): number {
    if (this.isPolarDestination()) {
      return 85;
    }
    if (this.weather() && this.weather()!.forecast) {
      return this.weather()!.forecast!.precipitationProbabilityPercent ?? 16;
    }
    if (this.weather() && this.weather()!.historicalContext) {
      return this.weather()!.historicalContext!.rainyDaysCount ? 24 : 12;
    }
    return 16;
  }

  getMockHumidity(offset: number): number {
    const val = this.getRealHumidity() + offset;
    return Math.max(5, Math.min(95, val));
  }
}
