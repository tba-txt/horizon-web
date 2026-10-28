import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationsService } from '../services/destinations.service';
import { Destination } from '../models/destination.model';

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';

@Component({
  selector: 'app-destination-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, PlaneLoaderComponent],
  templateUrl: './destination-detail.component.html',
  styleUrls: ['./destination-detail.component.scss']
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
