import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TravelerIdentityService } from '../../services/traveler-identity.service';
import { TravelerIdentityState } from '../../models/traveler-identity.model';

@Component({
  selector: 'app-traveler-identity',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe],
  templateUrl: './traveler-identity.component.html',
  styleUrls: ['./traveler-identity.component.scss']
})
export class TravelerIdentityComponent implements OnInit {
  private identityService = inject(TravelerIdentityService);

  identity = signal<TravelerIdentityState | null>(null);
  isLoading = signal(true);
  isProcessing = signal(true); // Fake delay for algorithmic impact

  // Computa o tema: Ecoturismo (verde) vs Viagem Comum (azul Horizon #4895CC)
  isEcoTheme = computed(() => {
    const data = this.identity();
    if (!data) return false;

    // 1. Se o arquétipo for de Ecoturismo / Natureza
    const archId = data.archetype?.id;
    if (archId === 'eco-explorer' || archId === 'active-adventure') {
      return true;
    }

    // 2. Se a dimensão principal for explicitamente ligada a Ecoturismo
    if (data.topDimensions && data.topDimensions.length > 0) {
      const topName = (data.topDimensions[0].name || '').toUpperCase();
      if (topName === 'ECOTURISMO' || topName === 'NATUREZA' || topName === 'VIDA_SELVAGEM') {
        return true;
      }
    }

    // Caso contrário (Cultura & Gastronomia, Urbano, Praia, Inverno, etc.) -> Viagem Comum (Azul Horizon)
    return false;
  });

  ngOnInit(): void {
    this.loadIdentity();
  }

  loadIdentity(): void {
    this.isLoading.set(true);
    this.isProcessing.set(true);
    this.identityService.getTravelerIdentity().subscribe({
      next: (state) => {
        this.identity.set(state);
        this.isLoading.set(false);
        // Cria uma tensão artificial de "cálculo de algoritmo" por 2.5s
        setTimeout(() => {
          this.isProcessing.set(false);
        }, 2500);
      },
      error: () => {
        this.isLoading.set(false);
        this.isProcessing.set(false);
      }
    });
  }

  formatCurrency(value?: number | null): string {
    if (value === undefined || value === null) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  }
}

