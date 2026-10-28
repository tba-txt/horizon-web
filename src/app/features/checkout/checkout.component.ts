import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { TicketComponent } from '../../shared/components/ticket/ticket.component';
import { BackToTopComponent } from '../../shared/components/back-to-top/back-to-top.component';
import { FeedbackModalComponent } from '../../shared/components/feedback-modal/feedback-modal.component';
import { ReservationService } from '../../core/reservations/services/reservation.service';
import { PaymentService } from '../../core/reservations/services/payment.service';
import { TokenStorageService } from '../../core/auth/services/token-storage.service';
import { findLocalImage } from '../destinations/services/destinations.service';
import { 
  CheckoutDraft, 
  ReservationResponse, 
  PaymentMethod, 
  ReservationRequest, 
  PassengerRequest,
  TicketResponse
} from '../../core/reservations/models/reservation.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, TicketComponent, BackToTopComponent, FeedbackModalComponent],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);
  private paymentService = inject(PaymentService);
  private tokenStorage = inject(TokenStorageService);

  draft = signal<CheckoutDraft | null>(null);
  currentReservation = signal<ReservationResponse | null>(null);
  selectedMethod = signal<PaymentMethod>('PIX');

  // Estados de UI Clean (Dropdowns / Modal)
  expandedPassengerIndex = signal<number>(0);
  isCouponDropdownOpen = signal<boolean>(false);
  isFlightDetailsModalOpen = signal<boolean>(false);
  isPayLaterModalOpen = signal<boolean>(false);
  isCancelConfirmModalOpen = signal<boolean>(false);
  isCsatModalOpen = signal<boolean>(false);
  hasSubmittedCheckoutCsat = signal<boolean>(false);

  // Cupom de Desconto das Missões
  couponInput = signal('');
  appliedDiscountPercent = signal(0);
  appliedCouponCode = signal<string | null>(null);
  couponError = signal<string | null>(null);
  couponSuccess = signal<string | null>(null);

  isLoading = signal(true);
  isProcessing = signal(false);
  isCancelled = signal(false);
  loadingMessage = signal('Carregando informações da reserva...');
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // PIX Code
  readonly pixCode = '00020126580014br.gov.bcb.pix0136horizon-travel-payments-pix-key520400005303986540500.005802BR5925HORIZON VIAGENS LTDA6009SAO PAULO62070503***6304E2D1';
  isPixCopied = signal(false);

  // Cartão Form Fields
  cardHolderName = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  installments = '1';

  passengersMinorError = signal<string | null>(null);

  passengersForm = this.fb.group({
    passengers: this.fb.array<PassengerRequest>([])
  });

  currentStep = computed(() => {
    if (this.currentReservation()?.status === 'CONFIRMADA' || this.currentReservation()?.status === 'CONCLUIDA') {
      return 3;
    }
    if (this.currentReservation()?.status === 'PENDENTE') {
      return 2;
    }
    return 1;
  });

  currentStepPercentage = computed(() => {
    const s = this.currentStep();
    if (s === 1) return '0%';
    if (s === 2) return '50%';
    return '100%';
  });

  travelDocumentationInfo = computed<{
    type: 'DOMESTIC' | 'MERCOSUL' | 'INTERNATIONAL';
    title: string;
    description: string;
    badge: string;
  }>(() => {
    const destName = (
      this.currentReservation()?.destinationName || 
      this.draft()?.destinationName || 
      ''
    ).toLowerCase().trim();

    if (!destName) {
      return {
        type: 'DOMESTIC',
        title: 'Voo Nacional',
        description: 'Embarque disponível com documento oficial com foto (RG, CNH ou Passaporte).',
        badge: 'Nacional'
      };
    }

    // 1. Destinos nacionais (Brasil)
    const isDomestic = destName.includes('brasil') || 
      destName.includes('brazil') || 
      destName.includes('rio de janeiro') || 
      destName.includes('gramado') || 
      destName.includes('bonito') || 
      destName.includes('chapada diamantina') || 
      destName.includes('noronha') || 
      destName.includes('foz do iguaçu') || 
      destName.includes('foz do iguacu') || 
      destName.includes('pantanal') || 
      destName.includes('amazônia') || 
      destName.includes('amazonia') || 
      destName.includes('jalapão') || 
      destName.includes('jalapao') ||
      destName.includes('são paulo') ||
      destName.includes('sao paulo');

    if (isDomestic) {
      return {
        type: 'DOMESTIC',
        title: 'Voo Nacional',
        description: 'Embarque disponível com documento oficial com foto (RG, CNH ou Passaporte).',
        badge: 'Nacional'
      };
    }

    // 2. Destinos do Mercosul ou com acordo de livre circulação com o Brasil
    const isMercosul = destName.includes('argentina') || 
      destName.includes('buenos aires') || 
      destName.includes('bariloche') || 
      destName.includes('patagônia') || 
      destName.includes('patagonia') || 
      destName.includes('uruguai') || 
      destName.includes('montevidéu') || 
      destName.includes('montevideo') || 
      destName.includes('paraguai') || 
      destName.includes('assunção') || 
      destName.includes('assuncao') || 
      destName.includes('bolívia') || 
      destName.includes('bolivia') || 
      destName.includes('chile') || 
      destName.includes('santiago') || 
      destName.includes('atacama') || 
      destName.includes('colômbia') || 
      destName.includes('colombia') || 
      destName.includes('bogotá') || 
      destName.includes('bogota') || 
      destName.includes('equador') || 
      destName.includes('galápagos') || 
      destName.includes('galapagos') || 
      destName.includes('peru') || 
      destName.includes('machu picchu') || 
      destName.includes('venezuela');

    if (isMercosul) {
      return {
        type: 'MERCOSUL',
        title: 'Documentação para o Mercosul',
        description: 'Para este destino, brasileiros podem viajar apresentando RG original em bom estado (emitido há menos de 10 anos) ou Passaporte válido.',
        badge: 'Acordo Mercosul (RG ou Passaporte)'
      };
    }

    // 3. Destinos Internacionais fora do Mercosul
    return {
      type: 'INTERNATIONAL',
      title: 'Documentação para voo internacional',
      description: 'Este destino exige Passaporte válido (com vigência mínima de 6 meses no retorno) e eventuais vistos para os passageiros. Certifique-se de que a documentação está em dia.',
      badge: 'Exige Passaporte Válido'
    };
  });

  get passengersArray(): FormArray {
    return this.passengersForm.get('passengers') as FormArray;
  }

  ngOnInit(): void {
    const uid = this.tokenStorage.getUserId();
    if (uid && typeof localStorage !== 'undefined') {
      const savedCoupon = localStorage.getItem(`horizonCoupon_${uid}`);
      if (savedCoupon) {
        try {
          const parsed = JSON.parse(savedCoupon);
          if (parsed?.used) {
            this.couponInput.set('');
          } else if (parsed?.unlocked && parsed?.code) {
            this.couponInput.set(parsed.code);
          }
        } catch {}
      }
    }

    // Suporte tanto para rota parametrizada (/checkout/:id) quanto query params (?reservationId=...)
    const routeId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('reservationId');
    if (routeId) {
      this.loadExistingReservation(Number(routeId));
    } else {
      this.route.queryParams.subscribe(params => {
        const resId = params['reservationId'];
        if (resId) {
          this.loadExistingReservation(Number(resId));
        } else {
          this.loadDraftFromService();
        }
      });
    }
  }

  private loadDraftFromService(): void {
    const draft = this.reservationService.checkoutDraft();
    if (draft) {
      if (!draft.destinationId && (draft.outboundFlight as any)?.destinationId) {
        draft.destinationId = Number((draft.outboundFlight as any).destinationId);
      }
      if (!draft.tripType) {
        draft.tripType = draft.returnFlight ? 'ROUND_TRIP' : 'ONE_WAY';
      }
      if (!draft.estimatedTotal && (draft as any).totalPrice) {
        draft.estimatedTotal = Number((draft as any).totalPrice);
      }
      this.draft.set(draft);
      this.initPassengersForm(draft.passengersCount || 1);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(false);
    }
  }

  private loadExistingReservation(id: number): void {
    this.isLoading.set(true);
    this.loadingMessage.set('Buscando dados da reserva...');
    
    this.reservationService.getReservationById(id).subscribe({
      next: (res) => {
        this.currentReservation.set(res);
        const alreadySubmitted = typeof localStorage !== 'undefined' && localStorage.getItem('horizon_checkout_csat_' + res.reservationId) === 'true';
        if (typeof localStorage !== 'undefined') {
          this.hasSubmittedCheckoutCsat.set(alreadySubmitted);
        }
        this.isLoading.set(false);
        if ((res.status === 'CONFIRMADA' || res.status === 'CONCLUIDA') && !alreadySubmitted) {
          setTimeout(() => {
            this.isCsatModalOpen.set(true);
          }, 500);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Não foi possível carregar a reserva solicitada.');
      }
    });
  }

  onCheckoutCsatSubmitted(): void {
    this.hasSubmittedCheckoutCsat.set(true);
    this.isCsatModalOpen.set(false);
    const resId = this.currentReservation()?.reservationId;
    if (resId && typeof localStorage !== 'undefined') {
      localStorage.setItem(`horizon_checkout_csat_${resId}`, 'true');
    }
  }

  private initPassengersForm(count: number): void {
    this.passengersArray.clear();
    for (let i = 0; i < count; i++) {
      this.passengersArray.push(
        this.fb.group({
          name: ['', [
            Validators.required, 
            Validators.minLength(3), 
            Validators.maxLength(100),
            Validators.pattern(/^[a-zA-ZÀ-ÖØ-öø-ÿ]+(?:\s+[a-zA-ZÀ-ÖØ-öø-ÿ]+)*$/)
          ]],
          age: [null, [
            Validators.required, 
            Validators.min(1), 
            Validators.max(120), 
            Validators.pattern(/^\d+$/)
          ]]
        })
      );
    }

    // Monitora alterações para validar a regra de menores desacompanhados em tempo real
    this.passengersForm.valueChanges.subscribe(() => {
      this.validateMinorsRule();
    });
  }

  preventNonAlpha(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    // Permite estritamente apenas letras (com acentos) e espaço. Bloqueia qualquer número ou caractere especial
    if (!/^[\p{L}\s]$/u.test(event.key)) {
      event.preventDefault();
    }
  }

  onNameInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    // Remove qualquer caractere que não seja letra ou espaço (elimina números e caracteres especiais)
    let clean = input.value.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (input.value !== clean) {
      input.value = clean;
    }
    const ctrl = this.passengersArray.at(index).get('name');
    if (ctrl && ctrl.value !== clean) {
      ctrl.setValue(clean, { emitEvent: true });
    }
  }

  onNamePaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = text.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const current = input.value;
    const updated = (current.slice(0, start) + clean + current.slice(end)).replace(/\s{2,}/g, ' ');
    input.value = updated;
    const ctrl = this.passengersArray.at(index).get('name');
    if (ctrl) {
      ctrl.setValue(updated, { emitEvent: true });
      ctrl.markAsDirty();
    }
  }

  preventNonNumeric(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    // Bloqueia qualquer caractere que não seja dígito (0 a 9)
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onAgeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    if (input.value !== value) {
      input.value = value;
    }
    
    // Atualiza o form control garantindo que é um número (ou null se vazio)
    const ctrl = this.passengersArray.at(index).get('age');
    if (ctrl) {
      ctrl.setValue(value ? parseInt(value, 10) : null, { emitEvent: true });
    }
  }

  onAgePaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 3);
    const input = event.target as HTMLInputElement;
    input.value = digits;
    const ctrl = this.passengersArray.at(index).get('age');
    if (ctrl) {
      ctrl.setValue(digits ? parseInt(digits, 10) : null, { emitEvent: true });
      ctrl.markAsDirty();
    }
  }

  onCardHolderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ').toUpperCase();
    input.value = clean;
    this.cardHolderName = clean;
  }

  onCardHolderPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = text.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ').toUpperCase();
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.cardHolderName = clean;
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = formatted;
    this.cardNumber = formatted;
  }

  onCardNumberPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    const input = event.target as HTMLInputElement;
    input.value = formatted;
    this.cardNumber = formatted;
  }

  onCardExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      digits = digits.slice(0, 2) + '/' + digits.slice(2);
    }
    input.value = digits;
    this.cardExpiry = digits;
  }

  onCardExpiryPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    let digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      digits = digits.slice(0, 2) + '/' + digits.slice(2);
    }
    const input = event.target as HTMLInputElement;
    input.value = digits;
    this.cardExpiry = digits;
  }

  onCardCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = digits;
    this.cardCvv = digits;
  }

  onCardCvvPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 4);
    const input = event.target as HTMLInputElement;
    input.value = digits;
    this.cardCvv = digits;
  }

  preventCouponInvalidKey(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End', 'Enter'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^[a-zA-Z0-9-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onCouponInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    input.value = clean;
    this.couponInput.set(clean);
  }

  onCouponPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = text.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.couponInput.set(clean);
  }

  validateMinorsRule(): void {
    const values = this.passengersArray?.value || [];
    if (!values.length) {
      this.passengersMinorError.set(null);
      return;
    }

    const validAges = values
      .map((v: any) => (v.age !== null && v.age !== '' && !isNaN(Number(v.age))) ? Number(v.age) : null)
      .filter((a: any) => a !== null) as number[];

    // 1 Passageiro apenas: Não pode ser menor de 18
    if (values.length === 1) {
      if (validAges.length === 1 && validAges[0] < 18) {
        this.passengersMinorError.set('Menores de 18 anos não podem viajar desacompanhados de um adulto responsável.');
        return;
      }
    } else {
      // 2 ou mais passageiros: Se todas as idades foram preenchidas, ao menos 1 deve ser >= 18
      if (validAges.length === values.length) {
        const hasAdult = validAges.some(age => age >= 18);
        if (!hasAdult) {
          this.passengersMinorError.set('A reserva deve conter ao menos um adulto responsável (maior de 18 anos) para acompanhar os menores.');
          return;
        }
      }
    }

    this.passengersMinorError.set(null);
  }

  onCreateReservationFromDraft(): void {
    if (this.passengersForm.invalid) {
      this.passengersForm.markAllAsTouched();
      const firstInvalid = this.passengersArray.controls.findIndex(c => c.invalid);
      if (firstInvalid !== -1) {
        this.expandedPassengerIndex.set(firstInvalid);
      }
      return;
    }

    const draft = this.draft();
    if (!draft) return;

    const passengers: PassengerRequest[] = this.passengersArray.value.map((p: any) => ({
      name: p.name.trim(),
      age: Number(p.age)
    }));

    // Validação estrita de menor desacompanhado
    if (passengers.length === 1 && passengers[0].age < 18) {
      this.errorMessage.set('Menores de 18 anos não podem viajar desacompanhados de um adulto responsável.');
      return;
    }

    const hasAdult = passengers.some(p => p.age >= 18);
    if (!hasAdult) {
      this.errorMessage.set('A reserva deve conter ao menos um adulto responsável (maior de 18 anos) para acompanhar os menores de idade.');
      return;
    }

    const destinationId = draft.destinationId || (draft.outboundFlight as any)?.destinationId;
    if (!destinationId) {
      this.errorMessage.set('Identificador do destino não encontrado. Por favor, volte e selecione o voo novamente.');
      return;
    }

    const tripType = draft.tripType || (draft.returnFlight ? 'ROUND_TRIP' : 'ONE_WAY');

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    const request: any = {
      destinationId: Number(destinationId),
      tripType: tripType,
      outboundFlightId: Number(draft.outboundFlight.id),
      outboundSeatClass: draft.outboundFlight.seatClass || 'BASIC',
      returnFlightId: draft.returnFlight ? Number(draft.returnFlight.id) : null,
      returnSeatClass: draft.returnFlight ? (draft.returnFlight.seatClass || 'BASIC') : null,
      seatClass: draft.outboundFlight.seatClass || 'BASIC',
      passengers: passengers
    };

    this.reservationService.createReservation(request).subscribe({
      next: (created) => {
        if (created.outboundFlight && draft.outboundFlight?.seatClass) {
          (created.outboundFlight as any).seatClass = draft.outboundFlight.seatClass;
        }
        if (created.returnFlight && draft.returnFlight?.seatClass) {
          (created.returnFlight as any).seatClass = draft.returnFlight.seatClass;
        }
        if (draft.estimatedTotal && created.totalAmount < draft.estimatedTotal && draft.outboundFlight?.seatClass !== 'BASIC') {
          created.totalAmount = draft.estimatedTotal;
        }
        this.currentReservation.set(created);
        this.reservationService.clearCheckoutDraft();
        this.draft.set(null);
        this.isProcessing.set(false);
        this.successMessage.set(null);
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(err.message || 'Erro ao gerar reserva no backend.');
      }
    });
  }

  onConfirmPaymentNow(): void {
    const res = this.currentReservation();
    if (!res) return;

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    this.paymentService.confirmPayment(res.reservationId, this.selectedMethod()).subscribe({
      next: () => {
        const uid = this.tokenStorage.getUserId();
        if (this.appliedCouponCode() && uid && typeof localStorage !== 'undefined') {
          const savedCoupon = localStorage.getItem(`horizonCoupon_${uid}`);
          if (savedCoupon) {
            try {
              const parsed = JSON.parse(savedCoupon);
              parsed.used = true;
              parsed.usedAt = Date.now();
              parsed.usedReservationId = res.reservationId;
              localStorage.setItem(`horizonCoupon_${uid}`, JSON.stringify(parsed));
            } catch {}
          }
        }
        const previousOutboundClass = (res.outboundFlight as any)?.seatClass;
        const previousReturnClass = (res.returnFlight as any)?.seatClass;
        this.reservationService.getReservationById(res.reservationId).subscribe({
          next: (updated) => {
            if (updated.outboundFlight && previousOutboundClass && !(updated.outboundFlight as any).seatClass) {
              (updated.outboundFlight as any).seatClass = previousOutboundClass;
            }
            if (updated.returnFlight && previousReturnClass && !(updated.returnFlight as any).seatClass) {
              (updated.returnFlight as any).seatClass = previousReturnClass;
            }
            this.currentReservation.set(updated);
            const alreadySubmitted = typeof localStorage !== 'undefined' && localStorage.getItem('horizon_checkout_csat_' + (updated.reservationId || res.reservationId)) === 'true';
            if (typeof localStorage !== 'undefined') {
              this.hasSubmittedCheckoutCsat.set(alreadySubmitted);
            }
            this.isProcessing.set(false);
            this.successMessage.set(null);
            if (!alreadySubmitted) {
              setTimeout(() => {
                this.isCsatModalOpen.set(true);
              }, 400);
            }
          },
          error: () => {
            this.isProcessing.set(false);
            this.router.navigate(['/profile']);
          }
        });
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(err.message || 'Falha ao confirmar pagamento com o backend.');
      }
    });
  }

  copyPixCode(): void {
    navigator.clipboard.writeText(this.pixCode).then(() => {
      this.isPixCopied.set(true);
      setTimeout(() => this.isPixCopied.set(false), 3000);
    });
  }

  formatCardNumberPreview(num: string): string {
    if (!num) return '•••• •••• •••• 4242';
    const cleaned = num.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : num;
  }

  onPayLater(): void {
    this.isPayLaterModalOpen.set(true);
  }

  goToMyTrips(): void {
    this.isPayLaterModalOpen.set(false);
    this.router.navigate(['/profile'], { queryParams: { tab: 'trips', filter: 'pending' } });
  }

  onCancelReservation(): void {
    const res = this.currentReservation();
    if (!res) return;
    this.isCancelConfirmModalOpen.set(true);
  }

  confirmCancelReservation(): void {
    const res = this.currentReservation();
    if (!res) return;

    this.isProcessing.set(true);
    this.reservationService.cancelReservation(res.reservationId).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.isCancelConfirmModalOpen.set(false);
        this.isCancelled.set(true);
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.isCancelConfirmModalOpen.set(false);
        this.errorMessage.set(err.message || 'Falha ao cancelar reserva.');
      }
    });
  }

  downloadTicket(ticketOrNumber: TicketResponse | string): void {
    const ticketObj = typeof ticketOrNumber === 'object'
      ? ticketOrNumber
      : this.currentReservation()?.tickets?.find(t => t.ticketNumber === ticketOrNumber);
    const ticketNumber = typeof ticketOrNumber === 'string' ? ticketOrNumber : ticketOrNumber.ticketNumber;

    const passengerName = ticketObj?.passengerName || this.currentReservation()?.passengers?.[0]?.name || 'Passageiro';
    const flightDate = this.currentReservation()?.outboundFlight?.flightDate || this.currentReservation()?.departureDate || '';
    const fileName = this.buildTicketPdfFileName(passengerName, flightDate);

    const chosenClass = (this.currentReservation()?.outboundFlight as any)?.seatClass;
    this.reservationService.downloadTicketPdf(ticketNumber, chosenClass).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage.set('Falha ao baixar o bilhete em PDF.');
      }
    });
  }

  downloadAllTickets(): void {
    const tickets = this.currentReservation()?.tickets;
    if (!tickets || tickets.length === 0) return;
    tickets.forEach((t) => this.downloadTicket(t));
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

  togglePassenger(index: number): void {
    this.expandedPassengerIndex.set(this.expandedPassengerIndex() === index ? -1 : index);
  }

  getDestinationName(): string {
    return this.currentReservation()?.destinationName || 
      this.draft()?.destinationName || 
      (this.draft()?.outboundFlight?.destinationAirportCode ? `Destino (${this.draft()?.outboundFlight?.destinationAirportCode})` : 'Destino Selecionado');
  }

  getDestinationImageUrl(): string {
    const raw = this.getDestinationName();
    const cityOnly = raw.split(/[,\(]/)[0].trim();
    return findLocalImage(cityOnly, raw) || 'assets/paymentt.webp';
  }

  onDestinationImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/paymentt.webp';
  }

  getOutboundFlight(): any {
    return this.currentReservation()?.outboundFlight || this.draft()?.outboundFlight;
  }

  getReturnFlight(): any {
    return this.currentReservation()?.returnFlight || this.draft()?.returnFlight;
  }

  getPassengersCount(): number {
    return this.currentReservation()?.passengers?.length || this.draft()?.passengersCount || 1;
  }

  getTripType(): string {
    return this.currentReservation()?.tripType || this.draft()?.tripType || (this.draft()?.returnFlight ? 'ROUND_TRIP' : 'ONE_WAY');
  }

  getRawTotalPrice(): number {
    return this.currentReservation()?.totalAmount || 
      this.draft()?.estimatedTotal || 
      (this.draft() as any)?.totalPrice || 
      0;
  }

  getDiscountAmount(): number {
    if (!this.appliedDiscountPercent()) return 0;
    return (this.getRawTotalPrice() * this.appliedDiscountPercent()) / 100;
  }

  getTotalPrice(): number {
    return Math.max(0, this.getRawTotalPrice() - this.getDiscountAmount());
  }

  applyCoupon(): void {
    this.couponError.set(null);
    this.couponSuccess.set(null);
    const code = this.couponInput().trim().toUpperCase();
    if (!code) {
      this.couponError.set('Informe um código de cupom.');
      return;
    }

    const uid = this.tokenStorage.getUserId();
    if (!uid) {
      this.couponError.set('Faça login para utilizar o seu cupom.');
      return;
    }

    const expectedCode = `HORIZON10-U${uid}`;
    if (code !== expectedCode) {
      if (code.startsWith('HORIZON10-U')) {
        this.couponError.set('Este cupom pertence a outro usuário e não pode ser utilizado nesta conta.');
      } else {
        this.couponError.set('Cupom inválido. Cumpra as missões no Feed para liberar seu cupom de 10% OFF.');
      }
      return;
    }

    // Verificar se o cupom foi liberado pelas missões do Feed
    if (typeof localStorage !== 'undefined') {
      const savedCoupon = localStorage.getItem(`horizonCoupon_${uid}`);
      if (!savedCoupon) {
        this.couponError.set('Cupom ainda não desbloqueado! Complete as 3 missões no Feed para ativá-lo.');
        return;
      }
      try {
        const parsed = JSON.parse(savedCoupon);
        if (parsed.used) {
          this.couponError.set('Este cupom já foi utilizado em outra viagem. Cada viajante pode usá-lo apenas uma única vez.');
          return;
        }
        if (!parsed.unlocked) {
          this.couponError.set('Você ainda não completou todas as missões para liberar este cupom.');
          return;
        }
      } catch {
        this.couponError.set('Erro ao validar cupom.');
        return;
      }
    }

    this.appliedDiscountPercent.set(10);
    this.appliedCouponCode.set(code);
    this.couponSuccess.set('Cupom de 10% OFF aplicado com sucesso!');
  }

  removeCoupon(): void {
    this.appliedDiscountPercent.set(0);
    this.appliedCouponCode.set(null);
    this.couponSuccess.set(null);
    this.couponError.set(null);
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

