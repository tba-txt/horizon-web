import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationDetailModalComponent } from '../components/destination-detail-modal/destination-detail-modal.component';
import { DestinationsService } from '../services/destinations.service';
import { Destination } from '../models/destination.model';
import { DestinationWeather } from '../models/weather.model';

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';

@Component({
  selector: 'app-ecotourism-destinations',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, DestinationDetailModalComponent, PlaneLoaderComponent],
  templateUrl: './ecotourism-destinations.component.html',
  styleUrls: ['./ecotourism-destinations.component.scss']
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
    this.destinationsService.getDestinations(true).subscribe({
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
      return 'Vento Polar e Neve';
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
