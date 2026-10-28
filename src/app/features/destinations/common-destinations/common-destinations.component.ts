import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationsService } from '../services/destinations.service';
import { Destination } from '../models/destination.model';

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';
import { BackToTopComponent } from '../../../shared/components/back-to-top/back-to-top.component';

@Component({
  selector: 'app-common-destinations',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, PlaneLoaderComponent, BackToTopComponent],
  templateUrl: './common-destinations.component.html',
  styleUrls: ['./common-destinations.component.scss']
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
    this.destinationsService.getDestinations(true).subscribe({
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
