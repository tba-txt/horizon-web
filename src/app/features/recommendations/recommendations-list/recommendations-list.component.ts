import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { RecommendationsService } from '../services/recommendations.service';
import { Recommendation } from '../models/recommendation.model';
import { LOCAL_DESTINATION_IMAGES, findLocalImage } from '../../destinations/services/destinations.service';
import { Card3dDirective } from '../../../shared/directives/card-3d.directive';
import { TravelerIdentityComponent } from '../components/traveler-identity/traveler-identity.component';

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';

@Component({
  selector: 'app-recommendations-list',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, Card3dDirective, TravelerIdentityComponent, PlaneLoaderComponent],
  templateUrl: './recommendations-list.component.html',
  styleUrls: ['./recommendations-list.component.scss']
})
export class RecommendationsListComponent implements OnInit {
  private recommendationsService = inject(RecommendationsService);

  recommendations = signal<Recommendation[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop';
  readonly placeholderHero = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop';

  topRecommendations = computed(() => this.recommendations().slice(0, 3));
  otherRecommendations = computed(() => this.recommendations().slice(3));

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

  getImageUrl(rec: Recommendation): string {
    const localImg = findLocalImage(rec.destinationName, rec.city);
    if (localImg) {
      return localImg;
    }
    return rec.imageUrl || this.placeholderImage;
  }

  getRankLabel(index: number): string {
    switch (index) {
      case 0:
        return 'Escolha mais recomendada';
      case 1:
        return 'Recomendado';
      case 2:
        return 'Destaque';
      default:
        return 'Recomendação';
    }
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  formatTourismType(type: string): string {
    return (type || '').replace(/_/g, ' ');
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }

  formatScore(score?: number): string {
    if (score === undefined || score === null) return '';
    return `${this.getScorePercentage(score)}%`;
  }

  getScorePercentage(score?: number): number {
    if (score === undefined || score === null) return 0;
    return score <= 1.0 ? Math.round(score * 100) : Math.round(score);
  }

  getEditorialText(rec: Recommendation, index: number): string {
    if (rec.explanation) {
      return rec.explanation;
    }
    switch (index) {
      case 0:
        return 'Destino principal sugerido pelo algoritmo com base nas suas preferências do quiz. Apresenta clima favorável, alta afinidade cultural e excelentes avaliações de viajantes.';
      case 1:
        return 'Uma excelente alternativa de viagem equilibrando lazer, belas paisagens e ótima gastronomia local. Perfeito para relaxar ou explorar novos horizontes.';
      case 2:
        return 'Destaque especial com atrativos únicos e ótima relação custo-benefício. Ideal para quem busca novas experiências e roteiros fora do convencional.';
      default:
        return 'Destino sugerido com base nas suas preferências e tendências de viagem.';
    }
  }
}
