import { Component, OnInit, Output, EventEmitter, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TravelerIdentityService } from '../../services/traveler-identity.service';
import { TravelerIdentityState } from '../../models/traveler-identity.model';

@Component({
  selector: 'app-traveler-identity',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './traveler-identity.component.html',
  styleUrls: ['./traveler-identity.component.scss']
})
export class TravelerIdentityComponent implements OnInit {
  private identityService = inject(TravelerIdentityService);

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.showResetConfirm() && !this.isResetting()) {
      this.cancelReset();
    }
  }

  @Output() algorithmReset = new EventEmitter<void>();

  identity = signal<TravelerIdentityState | null>(null);
  isLoading = signal(true);
  isProcessing = signal(true); // Fake delay for algorithmic impact

  showResetConfirm = signal(false);
  isResetting = signal(false);
  resetSuccess = signal(false);

  // Computa o tema: Ecoturismo (verde) vs Viagem Comum (azul Horizon #5BA4D8)
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

  loadIdentity(processingDelayMs = 2500): void {
    this.isLoading.set(true);
    this.isProcessing.set(true);
    this.identityService.getTravelerIdentity().subscribe({
      next: (state) => {
        this.identity.set(state);
        this.isLoading.set(false);
        setTimeout(() => {
          this.isProcessing.set(false);
        }, processingDelayMs);
      },
      error: () => {
        this.isLoading.set(false);
        this.isProcessing.set(false);
      }
    });
  }

  openResetConfirm(): void {
    this.showResetConfirm.set(true);
  }

  cancelReset(): void {
    if (this.isResetting()) return;
    this.showResetConfirm.set(false);
  }

  confirmResetAlgorithm(): void {
    if (this.isResetting()) return;
    this.isResetting.set(true);

    this.identityService.resetAlgorithm().subscribe({
      next: () => {
        this.isResetting.set(false);
        this.showResetConfirm.set(false);
        this.resetSuccess.set(true);

        // Notifica a página pai para recarregar os cards de recomendação com o algoritmo zerado
        this.algorithmReset.emit();

        // Recarrega o DNA do viajante com animação rápida de recalibragem
        this.loadIdentity(1100);

        setTimeout(() => {
          this.resetSuccess.set(false);
        }, 6000);
      },
      error: () => {
        this.isResetting.set(false);
        this.showResetConfirm.set(false);
      }
    });
  }

  formatCurrency(value?: number | null): string {
    if (value === undefined || value === null) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  }
}

