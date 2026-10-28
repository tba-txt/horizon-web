import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FeedbackModalComponent } from '../../shared/components/feedback-modal/feedback-modal.component';
import { TicketComponent } from '../../shared/components/ticket/ticket.component';
import { UserService } from '../../core/user/services/user.service';
import { UserProfile, UserUpdateRequest } from '../../core/user/models/user.model';
import { ReservationService } from '../../core/reservations/services/reservation.service';
import { MyTripsResponse, ReservationResponse } from '../../core/reservations/models/reservation.model';
import { TargetType } from '../../core/feedback/models/feedback.model';
import { AuthService } from '../../core/auth/services/auth.service';
import { cpfValidator, birthDateValidator, formatCpf } from '../../shared/validators/custom-validators';
import { findLocalImage } from '../destinations/services/destinations.service';
import { SupportService } from '../../core/support/services/support.service';
import { SupportTicketResponse } from '../../core/support/models/support.model';

import { PlaneLoaderComponent } from '../../shared/components/plane-loader/plane-loader.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { BackToTopComponent } from '../../shared/components/back-to-top/back-to-top.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent, FeedbackModalComponent, TicketComponent, PlaneLoaderComponent, DatePickerComponent, BackToTopComponent, DatePipe],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  user = signal<UserProfile | null>(null);
  trips = signal<MyTripsResponse | null>(null);

  // Navegação inspirada no Figma
  activeView = signal<'dashboard' | 'personal-info' | 'trips' | 'payments' | 'privacy' | 'support'>('dashboard');
  isHorizonMenuOpen = signal<boolean>(true);
  isDadosMenuOpen = signal<boolean>(true);
  isEditingPersonalInfo = signal<boolean>(false);

  // Pickers interativos do Painel
  selectedConfirmedIndex = signal<number>(0);
  isConfirmedPickerOpen = signal<boolean>(false);
  selectedQuickReservationId = signal<number | null>(null);

  // Estado de Formas de Pagamento (carregado dinamicamente por usuário autenticado)
  savedCards = signal<Array<{ id: number; brand: string; last4: string; holder: string; expiry: string; isDefault: boolean }>>([]);
  selectedCardId = signal<number | null>(null);
  preferredPaymentMethod = signal<'CARD' | 'PIX'>('CARD');
  isAddCardModalOpen = signal<boolean>(false);
  newCardBrand = signal<string>('Mastercard');
  newCardNumber = signal<string>('');
  newCardHolder = signal<string>('');
  newCardExpiry = signal<string>('');

  activeSavedCard = computed(() => {
    const cards = this.savedCards();
    const found = cards.find(c => c.id === this.selectedCardId());
    return found || cards[0] || null;
  });


  // ==================== ATENDIMENTO & SUPORTE ====================
  private supportService = inject(SupportService);
  supportTickets = signal<SupportTicketResponse[]>([]);
  selectedSupportFilter = signal<'ALL' | 'EM_ATENDIMENTO' | 'RESOLVIDO'>('ALL');
  isSupportDropdownOpen = signal<boolean>(false);

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isSupportDropdownOpen()) {
      this.isSupportDropdownOpen.set(false);
    }
  }

  toggleSupportDropdown(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSupportDropdownOpen.update(v => !v);
  }

  selectSupportFilter(filter: 'ALL' | 'EM_ATENDIMENTO' | 'RESOLVIDO'): void {
    this.selectedSupportFilter.set(filter);
    this.isSupportDropdownOpen.set(false);
  }
  expandedTicketId = signal<number | null>(null);

  activeSupportTicketsCount = computed(() => {
    return this.supportTickets().filter(t => t.status === 'EM_ATENDIMENTO').length;
  });

  resolvedSupportTicketsCount = computed(() => {
    return this.supportTickets().filter(t => t.status === 'RESOLVIDO').length;
  });

  getSubjectIcon(subject?: string): string {
    const s = (subject || '').toLowerCase();
    if (s.includes('bagagem') || s.includes('mala') || s.includes('assento')) return 'bi-luggage-fill';
    if (s.includes('cancelamento') || s.includes('cancelar') || s.includes('remarca')) return 'bi-calendar-x-fill';
    if (s.includes('reembolso') || s.includes('pagamento') || s.includes('estorno') || s.includes('financeiro') || s.includes('cartão') || s.includes('pix')) return 'bi-credit-card-2-front-fill';
    if (s.includes('check-in') || s.includes('documento') || s.includes('embarque') || s.includes('cpf') || s.includes('passaporte')) return 'bi-person-badge-fill';
    if (s.includes('voo') || s.includes('reserva') || s.includes('viagem')) return 'bi-airplane-fill';
    return 'bi-headset';
  }

  downloadAttachment(ticket: SupportTicketResponse): void {
    if (!ticket.attachmentData) return;
    try {
      const link = document.createElement('a');
      link.href = ticket.attachmentData;
      link.download = ticket.attachmentName || `anexo-${ticket.ticketCode}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(ticket.attachmentData, '_blank');
    }
  }

  filteredSupportTickets = computed(() => {
    const list = this.supportTickets();
    const filter = this.selectedSupportFilter();
    if (filter === 'ALL') return list;
    return list.filter(t => t.status === filter);
  });

  loadSupportTickets(): void {
    const email = this.user()?.email;
    this.supportService.getMyTickets(email).subscribe({
      next: (data) => {
        if (data) this.supportTickets.set(data);
      },
      error: () => {}
    });
  }

  toggleExpandTicket(id: number): void {
    this.expandedTicketId.set(this.expandedTicketId() === id ? null : id);
  }

  setSupportFilter(filter: 'ALL' | 'EM_ATENDIMENTO' | 'RESOLVIDO'): void {
    this.selectedSupportFilter.set(filter);
  }

  resolveTicket(ticket: SupportTicketResponse): void {
    const applyResolved = () => {
      const updated = { ...ticket, status: 'RESOLVIDO' as const, updatedAt: new Date().toISOString() };
      this.supportTickets.update(list => list.map(t => t.id === ticket.id ? updated : t));
      if (this.selectedTicketForDetails()?.id === ticket.id) {
        this.selectedTicketForDetails.set(updated);
      }
      this.showSuccess(`Chamado ${ticket.ticketCode} marcado como resolvido!`);
    };
    this.supportService.resolveTicket(ticket.id).subscribe({
      next: () => applyResolved(),
      error: () => applyResolved()
    });
  }

  tripsFilter = signal<'all' | 'pending' | 'confirmed' | 'finished' | 'cancelled'>('all');

  isLoadingProfile = signal(true);
  isLoadingTrips = signal(true);
  isSavingProfile = signal(false);
  isUploadingImage = signal(false);
  isDeactivating = signal(false);
  isCancelling = signal<Record<number, boolean>>({});

  isDeactivateModalOpen = signal(false);
  selectedTripForDetails = signal<ReservationResponse | null>(null);
  selectedTicketForDetails = signal<SupportTicketResponse | null>(null);

  openTicketDetails(ticket: SupportTicketResponse): void {
    this.selectedTicketForDetails.set(ticket);
  }

  closeTicketDetails(): void {
    this.selectedTicketForDetails.set(null);
  }

  // Feedback Modal
  isFeedbackModalOpen = signal(false);
  feedbackReservationId = signal<number | null>(null);
  feedbackDestinationName = signal<string | null>(null);
  feedbackTargetType = signal<TargetType>('PLATFORM');

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  private toastTimeout: any = null;

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    socialName: [''],
    email: ['', [Validators.required, Validators.email]],
    cpf: [{ value: '', disabled: true }, [Validators.required, cpfValidator()]],
    birthDate: [{ value: '', disabled: true }, [Validators.required, birthDateValidator(18)]],
    profileImageUrl: ['']
  });

  formattedCpf = computed(() => {
    const raw = this.user()?.cpf;
    return raw ? formatCpf(raw) : '-';
  });

  pendingCount = computed(() => this.trips()?.pending?.length || 0);

  allTripsCount = computed(() => {
    const t = this.trips();
    if (!t) return 0;
    return (t.pending?.length || 0) + (t.confirmed?.length || 0) + (t.finished?.length || 0) + (t.cancelled?.length || 0);
  });

  nextConfirmedTrip = computed(() => {
    const confirmed = this.trips()?.confirmed;
    if (!confirmed || confirmed.length === 0) return null;
    return confirmed[0];
  });

  activeConfirmedTrip = computed(() => {
    const confirmed = this.trips()?.confirmed;
    if (!confirmed || confirmed.length === 0) return null;
    const idx = this.selectedConfirmedIndex();
    return confirmed[idx] || confirmed[0];
  });

  allReservationsList = computed<ReservationResponse[]>(() => {
    const t = this.trips();
    if (!t) return [];
    return [
      ...(t.pending || []),
      ...(t.confirmed || []),
      ...(t.finished || []),
      ...(t.cancelled || [])
    ];
  });

  selectedQuickReservation = computed<ReservationResponse | null>(() => {
    const list = this.allReservationsList();
    if (list.length === 0) return null;
    const id = this.selectedQuickReservationId();
    if (id !== null) {
      const found = list.find(r => r.reservationId === id);
      if (found) return found;
    }
    return list[0];
  });

  filteredReservations = computed<ReservationResponse[]>(() => {
    const t = this.trips();
    if (!t) return [];

    switch (this.tripsFilter()) {
      case 'pending': return t.pending || [];
      case 'confirmed': return t.confirmed || [];
      case 'finished': return t.finished || [];
      case 'cancelled': return t.cancelled || [];
      case 'all':
      default:
        return [
          ...(t.pending || []),
          ...(t.confirmed || []),
          ...(t.finished || []),
          ...(t.cancelled || [])
        ];
    }
  });

  viewingTicket = signal<string | null>(null);

  toggleConfirmedPicker(): void {
    this.isConfirmedPickerOpen.update(v => !v);
  }

  selectConfirmedTrip(index: number): void {
    this.selectedConfirmedIndex.set(index);
    this.isConfirmedPickerOpen.set(false);
  }

  onSelectQuickReservation(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const val = Number(selectEl.value);
    if (!isNaN(val)) {
      this.selectedQuickReservationId.set(val);
    }
  }

  selectSavedCard(id: number): void {
    this.selectedCardId.set(id);
  }

  loadSavedCardsForUser(): void {
    const user = this.user();
    const key = user?.id ? `horizon_saved_cards_u_${user.id}` : (user?.email ? `horizon_saved_cards_e_${user.email}` : null);
    if (key) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.savedCards.set(parsed);
            if (parsed.length > 0) {
              const def = parsed.find(c => c.isDefault) || parsed[0];
              this.selectedCardId.set(def.id);
            } else {
              this.selectedCardId.set(null);
            }
            return;
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar cartões do usuário:', e);
      }
    }
    this.savedCards.set([]);
    this.selectedCardId.set(null);
  }

  private persistSavedCards(cards: Array<{ id: number; brand: string; last4: string; holder: string; expiry: string; isDefault: boolean }>): void {
    const user = this.user();
    const key = user?.id ? `horizon_saved_cards_u_${user.id}` : (user?.email ? `horizon_saved_cards_e_${user.email}` : null);
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(cards));
      } catch (e) {
        console.warn('Erro ao persistir cartões no localStorage:', e);
      }
    }
  }

  setDefaultCard(id: number): void {
    this.savedCards.update(cards => cards.map(c => ({ ...c, isDefault: c.id === id })));
    this.selectedCardId.set(id);
    this.persistSavedCards(this.savedCards());
    this.showSuccess('Cartão principal atualizado!');
  }

  removeSavedCard(id: number): void {
    this.savedCards.update(cards => {
      const remaining = cards.filter(c => c.id !== id);
      if (remaining.length > 0 && !remaining.some(c => c.isDefault)) {
        remaining[0].isDefault = true;
      }
      return [...remaining];
    });
    const current = this.savedCards();
    if (current.length > 0) {
      this.selectedCardId.set(current[0].id);
    } else {
      this.selectedCardId.set(null);
    }
    this.persistSavedCards(current);
    this.showSuccess('Cartão removido com sucesso.');
  }

  setPreferredPaymentMethod(method: 'CARD' | 'PIX'): void {
    this.preferredPaymentMethod.set(method);
    this.showSuccess(method === 'PIX' ? 'PIX Instantâneo definido como preferência no checkout.' : 'Cartão de Crédito definido como preferência no checkout.');
  }

  openAddCardModal(): void {
    this.newCardBrand.set('Mastercard');
    this.newCardNumber.set('');
    this.newCardHolder.set(this.user()?.name?.toUpperCase() || '');
    this.newCardExpiry.set('');
    this.isAddCardModalOpen.set(true);
  }

  closeAddCardModal(): void {
    this.isAddCardModalOpen.set(false);
  }

  onNewCardBrandChange(event: Event): void {
    this.newCardBrand.set((event.target as HTMLSelectElement).value);
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = formatted;
    this.newCardNumber.set(formatted);
  }

  onCardHolderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newCardHolder.set(input.value.toUpperCase());
  }

  onCardExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    input.value = formatted;
    this.newCardExpiry.set(formatted);
  }

  saveNewCard(): void {
    const rawDigits = this.newCardNumber().replace(/\D/g, '');
    if (rawDigits.length < 13 || this.newCardExpiry().length < 5) {
      this.showError('Preencha os dígitos do cartão e a validade (MM/AA).');
      return;
    }
    const last4 = rawDigits.slice(-4);
    const newId = Date.now();
    this.savedCards.update(cards => {
      const updated = [
        ...cards,
        {
          id: newId,
          brand: this.newCardBrand(),
          last4,
          holder: this.newCardHolder() || this.user()?.name?.toUpperCase() || 'TITULAR',
          expiry: this.newCardExpiry(),
          isDefault: cards.length === 0
        }
      ];
      this.persistSavedCards(updated);
      return updated;
    });
    this.selectedCardId.set(newId);
    this.isAddCardModalOpen.set(false);
    this.showSuccess('Novo cartão adicionado com sucesso!');
  }

  getDestinationImage(destinationName?: string | null): string {
    if (destinationName) {
      const local = findLocalImage(destinationName, destinationName);
      if (local) return local;
    }
    return '/assets/Horizon 1.webp';
  }

  setActiveView(view: 'dashboard' | 'personal-info' | 'trips' | 'payments' | 'privacy' | 'support'): void {
    this.activeView.set(view);
    if (view === 'support') {
      this.loadSupportTickets();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleHorizonMenu(): void {
    this.isHorizonMenuOpen.update(v => !v);
  }

  toggleDadosMenu(): void {
    this.isDadosMenuOpen.update(v => !v);
  }

  startEditing(): void {
    this.isEditingPersonalInfo.set(true);
    setTimeout(() => {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }, 100);
  }

  cancelEditing(): void {
    this.isEditingPersonalInfo.set(false);
    this.resetProfileForm();
  }

  toggleTicketView(ticketNumber: string) {
    if (this.viewingTicket() === ticketNumber) {
      this.viewingTicket.set(null);
    } else {
      this.viewingTicket.set(ticketNumber);
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] || params['view'];
      if (tab === 'trips') {
        this.activeView.set('trips');
        if (params['filter']) {
          this.tripsFilter.set(params['filter'] as any);
        }
      } else if (tab === 'privacy') {
        this.activeView.set('privacy');
      } else if (tab === 'payments') {
        this.activeView.set('payments');
      } else if (tab === 'personal-info') {
        this.activeView.set('personal-info');
      } else if (tab === 'support') {
        this.activeView.set('support');
      } else if (tab === 'feedback') {
        this.openPlatformFeedback();
      }
    });
    this.loadProfile();
    this.loadTrips();
    this.loadSupportTickets();
  }

  showSuccess(msg: string) {
    this.errorMessage.set(null);
    this.successMessage.set(msg);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.successMessage() === msg) {
        this.successMessage.set(null);
      }
    }, 4500);
  }

  showError(msg: string) {
    this.successMessage.set(null);
    this.errorMessage.set(msg);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.errorMessage() === msg) {
        this.errorMessage.set(null);
      }
    }, 5500);
  }

  loadProfile(): void {
    this.isLoadingProfile.set(true);
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.user.set(profile);
        this.loadSupportTickets();
        this.loadSavedCardsForUser();
        this.profileForm.patchValue({
          name: profile.name,
          socialName: profile.socialName || '',
          email: profile.email,
          cpf: formatCpf(profile.cpf),
          birthDate: profile.birthDate,
          profileImageUrl: profile.profileImageUrl || ''
        });
        this.isLoadingProfile.set(false);
      },
      error: (err) => {
        this.isLoadingProfile.set(false);
        this.showError(err.message || 'Falha ao carregar perfil do usuário.');
      }
    });
  }

  loadTrips(): void {
    this.isLoadingTrips.set(true);
    this.reservationService.getMyTrips().subscribe({
      next: (tripsData) => {
        this.trips.set(tripsData);
        this.isLoadingTrips.set(false);
      },
      error: (err) => {
        this.isLoadingTrips.set(false);
        this.showError(err.message || 'Falha ao carregar suas viagens.');
      }
    });
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const val = this.profileForm.getRawValue();
    const originalUser = this.user();
    const finalBirthDate = originalUser?.birthDate || val.birthDate!;
    const finalCpf = (originalUser?.cpf || val.cpf || '').replace(/\D/g, '');

    // Bloqueio estrito para menores de 18 anos
    if (finalBirthDate) {
      const bDate = new Date(finalBirthDate + 'T00:00:00');
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
      if (bDate > minAgeDate) {
        this.showError('Não é permitido cadastrar ou manter data de nascimento para menores de 18 anos.');
        return;
      }
    }

    this.isSavingProfile.set(true);

    const req: UserUpdateRequest = {
      name: val.name!,
      socialName: val.socialName || undefined,
      email: val.email!,
      cpf: finalCpf,
      birthDate: finalBirthDate,
      profileImageUrl: val.profileImageUrl || undefined
    };

    this.userService.updateProfile(req).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.isSavingProfile.set(false);
        this.isEditingPersonalInfo.set(false);
        this.showSuccess('Perfil atualizado com sucesso!');
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.showError(err.message || 'Falha ao atualizar perfil.');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.isUploadingImage.set(true);

      this.userService.uploadProfilePicture(file).subscribe({
        next: (updated) => {
          this.user.set(updated);
          this.profileForm.patchValue({ profileImageUrl: updated.profileImageUrl });
          this.isUploadingImage.set(false);
          this.showSuccess('Foto de perfil atualizada com sucesso!');
        },
        error: (err) => {
          this.isUploadingImage.set(false);
          this.showError(err.message || 'Falha ao enviar imagem de perfil.');
        }
      });
    }
  }

  removeProfileImage() {
    this.profileForm.patchValue({ profileImageUrl: '' });
    this.onSaveProfile();
  }

  resetProfileForm(): void {
    const profile = this.user();
    if (profile) {
      this.profileForm.patchValue({
        name: profile.name,
        socialName: profile.socialName || '',
        email: profile.email,
        cpf: formatCpf(profile.cpf),
        birthDate: profile.birthDate,
        profileImageUrl: profile.profileImageUrl || ''
      });
    }
  }

  onCpfInput(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = formatCpf(input.value);
    this.profileForm.get('cpf')?.setValue(input.value, { emitEvent: false });
  }

  reservationIdToCancel = signal<number | null>(null);

  cancelReservation(reservationId: number): void {
    this.reservationIdToCancel.set(reservationId);
  }

  closeCancelReservationModal(): void {
    this.reservationIdToCancel.set(null);
  }

  confirmCancelReservation(): void {
    const reservationId = this.reservationIdToCancel();
    if (!reservationId) return;

    this.isCancelling.update(map => ({ ...map, [reservationId]: true }));
    this.reservationService.cancelReservation(reservationId).subscribe({
      next: () => {
        this.isCancelling.update(map => ({ ...map, [reservationId]: false }));
        this.reservationIdToCancel.set(null);
        this.showSuccess('Reserva cancelada com sucesso e assentos liberados.');
        this.loadTrips();
      },
      error: (err) => {
        this.isCancelling.update(map => ({ ...map, [reservationId]: false }));
        this.reservationIdToCancel.set(null);
        this.showError(err.message || 'Falha ao cancelar reserva.');
      }
    });
  }

  downloadTicket(ticketNumber: string, passengerName?: string, flightDate?: string): void {
    const pName = passengerName || this.selectedTripForDetails()?.passengers?.[0]?.name || this.user()?.name || 'Passageiro';
    const fDate = flightDate || this.selectedTripForDetails()?.outboundFlight?.flightDate || this.selectedTripForDetails()?.departureDate || '';
    const fileName = this.buildTicketPdfFileName(pName, fDate);

    this.reservationService.downloadTicketPdf(ticketNumber).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.showError('Falha ao baixar o bilhete em PDF.');
      }
    });
  }

  private buildTicketPdfFileName(passengerName?: string, dateStr?: string): string {
    let cleanName = (passengerName || 'Passageiro').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
    if (!cleanName) cleanName = 'Passageiro';

    let cleanDate = '';
    if (dateStr) {
      const raw = dateStr.substring(0, 10).replace(/\//g, '-');
      const parts = raw.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        cleanDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        cleanDate = raw;
      }
    }
    if (!cleanDate) {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      cleanDate = `${d}-${m}-${y}`;
    }

    return `Passagem_Horizon_${cleanName}_${cleanDate}.pdf`;
  }

  openTripDetails(trip: ReservationResponse): void {
    this.selectedTripForDetails.set(trip);
    if ((!trip.tickets || trip.tickets.length === 0) && (trip.status === 'CONFIRMADA' || trip.status === 'CONCLUIDA')) {
      this.reservationService.getTicketsByReservation(trip.reservationId).subscribe({
        next: (tickets) => {
          if (tickets && tickets.length > 0 && this.selectedTripForDetails()?.reservationId === trip.reservationId) {
            this.selectedTripForDetails.set({ ...trip, tickets });
          }
        },
        error: () => {}
      });
    }
  }

  closeTripDetails(): void {
    this.selectedTripForDetails.set(null);
    this.viewingTicket.set(null);
  }

  openPlatformFeedback(): void {
    this.feedbackTargetType.set('PLATFORM');
    this.feedbackReservationId.set(null);
    this.feedbackDestinationName.set(null);
    this.isFeedbackModalOpen.set(true);
  }

  canEvaluateTrip(trip: ReservationResponse): boolean {
    if (trip.status === 'CONCLUIDA') return true;
    if (trip.status !== 'CONFIRMADA') return false;

    const flightToCheck = (trip.tripType === 'ROUND_TRIP' || trip.returnFlight)
      ? trip.returnFlight
      : trip.outboundFlight;

    if (!flightToCheck?.flightDate) return false;

    const timePart = (flightToCheck.arrivalTime || flightToCheck.departureTime || '23:59:59').slice(0, 8);
    const flightEnd = new Date(`${flightToCheck.flightDate}T${timePart.length === 5 ? timePart + ':00' : timePart}`);
    return !isNaN(flightEnd.getTime()) && new Date() >= flightEnd;
  }

  openTripFeedback(trip: ReservationResponse): void {
    if (!this.canEvaluateTrip(trip)) {
      this.showError('A avaliação só estará disponível após a conclusão da viagem.');
      return;
    }
    this.feedbackTargetType.set('TRIP');
    this.feedbackReservationId.set(trip.reservationId);
    this.feedbackDestinationName.set(trip.destinationName || null);
    this.isFeedbackModalOpen.set(true);
  }

  closeFeedbackModal(): void {
    this.isFeedbackModalOpen.set(false);
  }

  onFeedbackSubmitted(): void {
    this.showSuccess('Obrigado pelo seu feedback!');
  }

  openDeactivateModal(): void {
    this.isDeactivateModalOpen.set(true);
  }

  closeDeactivateModal(): void {
    this.isDeactivateModalOpen.set(false);
  }

  onConfirmDeactivate(): void {
    this.isDeactivating.set(true);
    this.userService.deactivateAccount().subscribe({
      next: () => {
        this.isDeactivating.set(false);
        this.isDeactivateModalOpen.set(false);
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isDeactivating.set(false);
        this.showError(err.message || 'Falha ao desativar conta.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    const name = this.user()?.name || '';
    if (!name) return 'H';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMADA': return 'bg-success';
      case 'PENDENTE': return 'bg-warning text-dark';
      case 'CONCLUIDA': return 'bg-info text-dark';
      case 'CANCELADA': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMADA': return 'Confirmada';
      case 'PENDENTE': return 'Aguardando Pagamento';
      case 'CONCLUIDA': return 'Viagem Concluída';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  }

  formatCurrency(value?: number | null): string {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  formatDateTime(isoDate?: string | null): string {
    if (!isoDate) return '-';
    try {
      return new Date(isoDate).toLocaleString('pt-BR');
    } catch {
      return isoDate;
    }
  }
}
