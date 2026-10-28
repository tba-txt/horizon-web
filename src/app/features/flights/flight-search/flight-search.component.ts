import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FlightsService } from '../services/flights.service';
import { DestinationsService, findLocalImage } from '../../destinations/services/destinations.service';
import { Flight, FlightSearchParams, FlightSeatClass, SelectedFlightBooking } from '../models/flight.model';
import { Destination } from '../../destinations/models/destination.model';
import { ReservationService } from '../../../core/reservations/services/reservation.service';
import { CheckoutDraft, TripType, SeatClass } from '../../../core/reservations/models/reservation.model';

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isAvailable: boolean;
  isSelected: boolean;
}

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';
import { BackToTopComponent } from '../../../shared/components/back-to-top/back-to-top.component';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, PlaneLoaderComponent, DatePipe, BackToTopComponent],
  templateUrl: './flight-search.component.html',
  styleUrls: ['./flight-search.component.scss']
})
export class FlightSearchComponent implements OnInit {
  private flightsService = inject(FlightsService);
  private destinationsService = inject(DestinationsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop';

  handleHeroError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  destinations = signal<Destination[]>([]);
  commonDestinations = computed(() =>
    this.destinations().filter(dest => (dest.tourismType || '').trim().toUpperCase() === 'COMUM')
  );
  ecotourismDestinations = computed(() =>
    this.destinations().filter(dest => (dest.tourismType || '').trim().toUpperCase() === 'ECOTURISMO')
  );
  allFlights = signal<Flight[]>([]);
  destinationFlights = signal<Flight[]>([]);
  isLoadingFlightDates = signal<boolean>(false);
  
  selectedDestinationId = signal<number | null>(null);
  isDestinationDropdownOpen = signal(false);
  selectedDestination = computed(() => this.destinations().find(dest => dest.id === this.selectedDestinationId()) ?? null);
  isSelectedDestinationEco = computed(() => (this.selectedDestination()?.tourismType || '').trim().toUpperCase() === 'ECOTURISMO');

  getSelectedDestinationImage(): string {
    const dest = this.selectedDestination();
    if (dest) {
      const localImg = findLocalImage(dest.name, dest.city);
      if (localImg) return localImg;
      if (dest.imageUrl) return dest.imageUrl;
    }
    return this.placeholderImage;
  }

  formatAllPassengersTotal(): string {
    let totalPerPax = 0;
    if (this.selectedOutbound()) {
      totalPerPax += this.selectedOutbound()!.price;
    }
    if (this.selectedReturn()) {
      totalPerPax += this.selectedReturn()!.price;
    }
    const pax = this.passengers() || 1;
    return this.formatPrice(totalPerPax * pax);
  }

  selectedDestinationLabel = computed(() => {
    const destination = this.selectedDestination();
    return destination ? this.formatDestinationOption(destination) : 'Selecione';
  });

  formatDestinationOption(dest: Destination): string {
    const name = (dest.name || '').trim();
    const country = (dest.country || '').trim();
    if (!country || country.toLowerCase() === name.toLowerCase()) {
      return name;
    }
    return `${name} (${country})`;
  }
  startDate = signal<string>('');
  endDate = signal<string>('');
  passengers = signal<number>(1);

  // Estados dos calendários interativos (Ida e Volta)
  isOutboundCalendarOpen = signal<boolean>(false);
  isReturnCalendarOpen = signal<boolean>(false);
  calendarMonth = signal<Date>(new Date());
  returnCalendarMonth = signal<Date>(new Date());
  
  isLoading = signal(false);
  hasSearched = signal(false);
  errorMessage = signal<string | null>(null);

  selectedOutbound = signal<SelectedFlightBooking | null>(null);
  selectedReturn = signal<SelectedFlightBooking | null>(null);
  preferredSeatClass = signal<FlightSeatClass>('BASIC');

  // Modal com detalhes sobre o que cada classe oferece (Básico, Executivo, Premium)
  isClassInfoModalOpen = signal<boolean>(false);
  activeClassModalTab = signal<FlightSeatClass>('BASIC');

  selectedOutboundFlight = computed(() => this.selectedOutbound()?.flight ?? null);
  selectedReturnFlight = computed(() => this.selectedReturn()?.flight ?? null);

  // Restrição de data: Primeira data permitida = Hoje + 3 dias
  minDepartureDate: string = this.calculateMinDate(3);

  // Identifica se o destino pertence à América do Sul
  isDestinationSouthAmerica = computed(() => {
    const dest = this.selectedDestination();
    if (!dest) return false;
    const country = (dest.country || '').trim().toLowerCase();
    return country.includes('brasil') || country.includes('argentina') ||
           country.includes('chile') || country.includes('peru') ||
           country.includes('colômbia') || country.includes('colombia') ||
           country.includes('equador') || country.includes('uruguai') ||
           country.includes('paraguai') || country.includes('bolívia') ||
           country.includes('bolivia');
  });

  // Dias mínimos de permanência antes do voo de retorno:
  // América do Sul: mínimo 1 dia de estadia (ida 21, volta pode ser 22).
  // Internacional fora da América do Sul: mínimo 3 dias (ex: Japão, Europa, EUA).
  minDaysBetweenFlights = computed(() => {
    return this.isDestinationSouthAmerica() ? 1 : 3;
  });

  minReturnDate = computed(() => {
    const start = this.startDate();
    if (!start) return this.minDepartureDate;
    const [y, m, d] = start.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + this.minDaysBetweenFlights());
    return this.formatDateToIso(dateObj);
  });

  // Conjunto de datas disponíveis para IDA (voos saindo de SP com vagas)
  availableOutboundDates = computed(() => {
    const dates = new Set<string>();
    for (const f of this.destinationFlights()) {
      if (f.destinationAirportCode !== 'GRU' && f.availableSeats > 0) {
        const dStr = f.flightDate.substring(0, 10);
        if (dStr >= this.minDepartureDate) {
          dates.add(dStr);
        }
      }
    }
    return dates;
  });

  // Conjunto de datas disponíveis para VOLTA (voos retornando a SP com vagas e >= minReturnDate)
  availableReturnDates = computed(() => {
    const dates = new Set<string>();
    const minReturn = this.minReturnDate();
    for (const f of this.destinationFlights()) {
      if (f.destinationAirportCode === 'GRU' && f.availableSeats > 0) {
        const dStr = f.flightDate.substring(0, 10);
        if (dStr >= minReturn) {
          dates.add(dStr);
        }
      }
    }
    return dates;
  });

  // Dias gerados para o grid do mês de IDA
  calendarDaysOutbound = computed(() => {
    return this.getCalendarDays(this.calendarMonth(), 'outbound');
  });

  // Dias gerados para o grid do mês de VOLTA
  calendarDaysReturn = computed(() => {
    return this.getCalendarDays(this.returnCalendarMonth(), 'return');
  });

  // Separação de voos de Ida e Volta baseado no código do aeroporto e datas
  outboundFlights = computed(() => {
    const start = this.startDate();
    return this.allFlights().filter(f => {
      if (f.destinationAirportCode === 'GRU') return false;
      if (start) {
        return f.flightDate.substring(0, 10) === start;
      }
      return true;
    });
  });

  returnFlights = computed(() => {
    const end = this.endDate();
    if (!end) {
      return [];
    }
    return this.allFlights().filter(f => {
      if (f.destinationAirportCode !== 'GRU') return false;
      return f.flightDate.substring(0, 10) === end;
    });
  });

  ngOnInit(): void {
    this.loadDestinations();

    this.route.queryParams.subscribe(params => {
      let shouldSearch = false;
      if (params['seatClass']) {
        const sc = String(params['seatClass']).toUpperCase();
        if (sc === 'BASIC' || sc === 'EXECUTIVE' || sc === 'PREMIUM') {
          this.preferredSeatClass.set(sc as FlightSeatClass);
        }
      }
      if (params['passengers']) {
        const p = Number(params['passengers']);
        if (!isNaN(p)) {
          this.passengers.set(p);
        }
      }
      if (params['destinationId']) {
        const dId = Number(params['destinationId']);
        if (!isNaN(dId)) {
          this.selectedDestinationId.set(dId);
          this.loadDestinationFlights(dId, () => {
            if (params['startDate']) {
              this.startDate.set(params['startDate']);
              shouldSearch = true;
            }
            if (params['endDate']) {
              this.endDate.set(params['endDate']);
            } else {
              this.endDate.set('');
            }
            if (shouldSearch) {
              this.onSearch();
            }
          });
        }
      }
    });
  }

  calculateMinDate(daysAhead: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDestinationChange(destId: number | null): void {
    this.selectedDestinationId.set(destId);
    this.startDate.set('');
    this.endDate.set('');
    this.selectedOutbound.set(null);
    this.selectedReturn.set(null);
    this.allFlights.set([]);
    this.hasSearched.set(false);
    this.errorMessage.set(null);
    this.isOutboundCalendarOpen.set(false);
    this.isReturnCalendarOpen.set(false);

    if (destId) {
      this.loadDestinationFlights(destId);
    } else {
      this.destinationFlights.set([]);
    }
  }

  toggleDestinationDropdown(event: Event): void {
    event.stopPropagation();
    this.isDestinationDropdownOpen.update(isOpen => !isOpen);
  }

  selectDestination(destination: Destination, event: Event): void {
    event.stopPropagation();
    this.isDestinationDropdownOpen.set(false);
    this.onDestinationChange(destination.id);
  }
  loadDestinationFlights(destId: number, callback?: () => void): void {
    this.isLoadingFlightDates.set(true);
    this.flightsService.searchFlights({ destinationId: destId }).subscribe({
      next: (flights) => {
        this.destinationFlights.set(flights || []);
        this.isLoadingFlightDates.set(false);

        const outbounds = (flights || []).filter(f => f.destinationAirportCode !== 'GRU' && f.availableSeats > 0);
        if (outbounds.length > 0) {
          const sorted = [...outbounds].sort((a, b) => a.flightDate.localeCompare(b.flightDate));
          const firstDateStr = sorted[0].flightDate.substring(0, 10);
          const [y, m, d] = firstDateStr.split('-').map(Number);
          const targetMonth = new Date(y, m - 1, 1);
          this.calendarMonth.set(targetMonth);
          this.returnCalendarMonth.set(targetMonth);
        }

        if (callback) callback();
      },
      error: (err) => {
        console.error('Erro ao carregar voos do destino:', err);
        this.destinationFlights.set([]);
        this.isLoadingFlightDates.set(false);
        if (callback) callback();
      }
    });
  }

  getCalendarDays(monthDate: Date, type: 'outbound' | 'return'): (CalendarDay | null)[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const grid: (CalendarDay | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }

    const availableSet = type === 'outbound' ? this.availableOutboundDates() : this.availableReturnDates();
    const selectedDate = type === 'outbound' ? this.startDate() : this.endDate();

    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      const dateStr = this.formatDateToIso(dayDate);

      let isBeforeMin = false;
      if (type === 'outbound') {
        isBeforeMin = dateStr < this.minDepartureDate;
      } else {
        isBeforeMin = !this.startDate() || dateStr < this.minReturnDate();
      }

      const hasFlight = availableSet.has(dateStr);
      const isAvailable = !isBeforeMin && hasFlight;
      const isSelected = dateStr === selectedDate;

      grid.push({
        date: dayDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isAvailable,
        isSelected
      });
    }

    return grid;
  }

  formatDateToIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  formatTime(time?: string): string {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return time;
  }

  getFlightDuration(dep?: string, arr?: string, durationMinutes?: number): string {
    if (durationMinutes !== undefined && durationMinutes !== null && durationMinutes > 0) {
      const h = Math.floor(durationMinutes / 60);
      const m = durationMinutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    if (!dep || !arr) return '';
    const [dh, dm] = dep.split(':').map(Number);
    const [ah, am] = arr.split(':').map(Number);
    if (isNaN(dh) || isNaN(ah)) return '';
    let diffMinutes = (ah * 60 + (am || 0)) - (dh * 60 + (dm || 0));
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    const h = Math.floor(diffMinutes / 60);
    const m = diffMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  getMonthYearLabel(date: Date): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  toggleOutboundCalendar(event: Event): void {
    event.stopPropagation();
    if (!this.selectedDestinationId() || this.isLoadingFlightDates()) return;
    this.isReturnCalendarOpen.set(false);
    this.isOutboundCalendarOpen.update(v => !v);
  }

  toggleReturnCalendar(event: Event): void {
    event.stopPropagation();
    if (!this.startDate()) return;
    this.isOutboundCalendarOpen.set(false);
    this.isReturnCalendarOpen.update(v => !v);
  }

  selectOutboundDate(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isAvailable) return;
    this.startDate.set(day.dateStr);
    this.isOutboundCalendarOpen.set(false);

    if (this.endDate() && this.endDate() < this.minReturnDate()) {
      this.endDate.set('');
      this.selectedReturn.set(null);
    }

    const [y, m, d] = day.dateStr.split('-').map(Number);
    this.returnCalendarMonth.set(new Date(y, m - 1, 1));
  }

  selectReturnDate(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isAvailable) return;
    if (this.endDate() !== day.dateStr) {
      this.selectedReturn.set(null);
    }
    this.endDate.set(day.dateStr);
    this.isReturnCalendarOpen.set(false);
  }

  clearReturnDate(event: Event): void {
    event.stopPropagation();
    this.endDate.set('');
    this.selectedReturn.set(null);
    this.isReturnCalendarOpen.set(false);
  }

  closeCalendars(event: Event): void {
    event.stopPropagation();
    this.isOutboundCalendarOpen.set(false);
    this.isReturnCalendarOpen.set(false);
  }

  prevMonth(type: 'outbound' | 'return', event: Event): void {
    event.stopPropagation();
    const sig = type === 'outbound' ? this.calendarMonth : this.returnCalendarMonth;
    const curr = sig();
    const prev = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
    const now = new Date();
    const minMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (prev >= minMonth) {
      sig.set(prev);
    }
  }

  nextMonth(type: 'outbound' | 'return', event: Event): void {
    event.stopPropagation();
    const sig = type === 'outbound' ? this.calendarMonth : this.returnCalendarMonth;
    const curr = sig();
    const next = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
    const maxMonth = new Date(curr.getFullYear() + 2, curr.getMonth(), 1);
    if (next <= maxMonth) {
      sig.set(next);
    }
  }

  canPrevMonth(type: 'outbound' | 'return'): boolean {
    const curr = type === 'outbound' ? this.calendarMonth() : this.returnCalendarMonth();
    const now = new Date();
    return curr.getFullYear() > now.getFullYear() ||
           (curr.getFullYear() === now.getFullYear() && curr.getMonth() > now.getMonth());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.calendar-popover-container')) {
      this.isOutboundCalendarOpen.set(false);
      this.isReturnCalendarOpen.set(false);
    }
    if (!target.closest('.destination-picker')) {
      this.isDestinationDropdownOpen.set(false);
    }
  }

  loadDestinations(): void {
    this.destinationsService.getDestinations().subscribe({
      next: (data) => this.destinations.set(data || []),
      error: (err) => console.error('Erro ao buscar destinos', err)
    });
  }

  isValidToSearch(): boolean {
    if (!this.selectedDestinationId() || !this.startDate()) return false;
    if (this.startDate() < this.minDepartureDate) return false;
    return true;
  }

  onSearch(): void {
    if (!this.isValidToSearch()) return;

    const destId = this.selectedDestinationId();
    if (!destId) return;

    if (!this.endDate()) {
      this.selectedReturn.set(null);
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.hasSearched.set(true);

    const searchParams: FlightSearchParams = {
      destinationId: destId,
      startDate: this.startDate(),
      endDate: this.endDate() || undefined
    };

    this.flightsService.searchFlights(searchParams).subscribe({
      next: (data) => {
        this.allFlights.set(data || []);
        this.autoSelectFlightsByPreferredClass();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao buscar voos.');
      }
    });
  }

  private resolveAvailableSeatClass(flight: Flight, desired: FlightSeatClass): FlightSeatClass {
    if (desired === 'EXECUTIVE' && flight.priceExecutive) return 'EXECUTIVE';
    if (desired === 'PREMIUM' && flight.pricePremium) return 'PREMIUM';
    return 'BASIC';
  }

  private autoSelectFlightsByPreferredClass(): void {
    const targetClass: FlightSeatClass = this.preferredSeatClass() || 'BASIC';

    const outbounds = this.outboundFlights().filter(f => f.availableSeats > 0);
    if (outbounds.length > 0) {
      const firstOutbound = outbounds[0];
      const outClass = this.resolveAvailableSeatClass(firstOutbound, targetClass);
      this.selectFlight(firstOutbound, outClass, 'outbound');
    } else {
      this.selectedOutbound.set(null);
    }

    if (this.endDate()) {
      const returns = this.returnFlights().filter(f => f.availableSeats > 0);
      if (returns.length > 0) {
        const firstReturn = returns[0];
        const retClass = this.resolveAvailableSeatClass(firstReturn, targetClass);
        this.selectFlight(firstReturn, retClass, 'return');
      } else {
        this.selectedReturn.set(null);
      }
    } else {
      this.selectedReturn.set(null);
    }
  }

  getClassName(seatClass: FlightSeatClass): string {
    switch (seatClass) {
      case 'BASIC': return 'Básico';
      case 'EXECUTIVE': return 'Executivo';
      case 'PREMIUM': return 'Premium';
    }
  }

  getClassPrice(flight: Flight, seatClass: FlightSeatClass): number {
    switch (seatClass) {
      case 'BASIC': return flight.pricePerPerson;
      case 'EXECUTIVE': return flight.priceExecutive ?? flight.pricePerPerson;
      case 'PREMIUM': return flight.pricePremium ?? flight.pricePerPerson;
    }
  }

  selectFlight(flight: Flight, seatClass: FlightSeatClass, leg: 'outbound' | 'return'): void {
    this.preferredSeatClass.set(seatClass);
    const booking: SelectedFlightBooking = {
      flight,
      seatClass,
      price: this.getClassPrice(flight, seatClass)
    };
    if (leg === 'outbound') {
      this.selectedOutbound.set(booking);
    } else {
      this.selectedReturn.set(booking);
    }
  }

  isFlightSelected(flightId: number, leg: 'outbound' | 'return'): boolean {
    const current = leg === 'outbound' ? this.selectedOutbound() : this.selectedReturn();
    return current?.flight.id === flightId;
  }

  isClassSelected(flightId: number, seatClass: FlightSeatClass, leg: 'outbound' | 'return'): boolean {
    const current = leg === 'outbound' ? this.selectedOutbound() : this.selectedReturn();
    return current?.flight.id === flightId && current.seatClass === seatClass;
  }

  clearSelection(): void {
    this.selectedOutbound.set(null);
    this.selectedReturn.set(null);
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }

  formatTotalPrice(): string {
    let total = 0;
    if (this.selectedOutbound()) {
      total += this.selectedOutbound()!.price;
    }
    if (this.selectedReturn()) {
      total += this.selectedReturn()!.price;
    }
    return this.formatPrice(total);
  }

  selectionTotalLabel(): string {
    if (!this.endDate()) return 'Total da viagem por passageiro';
    if (this.selectedOutbound() && this.selectedReturn()) return 'Total ida e volta por passageiro';
    return 'Subtotal dos trechos selecionados por passageiro';
  }

  proceedToCheckout(): void {
    if (!this.selectedOutbound()) return;
    const outbound = this.selectedOutbound()!;
    const returnSel = this.selectedReturn();

    const destId = Number(this.selectedDestinationId() || outbound.flight.destinationId);
    const dest = this.destinations().find(d => Number(d.id) === destId);
    const destName = dest ? `${dest.name}, ${dest.country}` : (outbound.flight.destinationAirportCode ? `Destino (${outbound.flight.destinationAirportCode})` : 'Destino Selecionado');
    const tripType: TripType = returnSel ? 'ROUND_TRIP' : 'ONE_WAY';
    const pricePerPax = outbound.price + (returnSel?.price || 0);
    const paxCount = this.passengers() || 1;
    const estimatedTotal = pricePerPax * paxCount;

    const draft: CheckoutDraft = {
      destinationId: destId,
      destinationName: destName,
      tripType: tripType,
      passengersCount: paxCount,
      outboundFlight: {
        id: outbound.flight.id,
        flightNumber: outbound.flight.flightNumber,
        originAirportCode: outbound.flight.originAirportCode,
        destinationAirportCode: outbound.flight.destinationAirportCode,
        flightDate: outbound.flight.flightDate,
        departureTime: outbound.flight.departureTime,
        arrivalTime: outbound.flight.arrivalTime,
        seatClass: outbound.seatClass as SeatClass,
        price: outbound.price
      },
      returnFlight: returnSel ? {
        id: returnSel.flight.id,
        flightNumber: returnSel.flight.flightNumber,
        originAirportCode: returnSel.flight.originAirportCode,
        destinationAirportCode: returnSel.flight.destinationAirportCode,
        flightDate: returnSel.flight.flightDate,
        departureTime: returnSel.flight.departureTime,
        arrivalTime: returnSel.flight.arrivalTime,
        seatClass: returnSel.seatClass as SeatClass,
        price: returnSel.price
      } : null,
      totalPricePerPassenger: pricePerPax,
      estimatedTotal: estimatedTotal
    };

    this.reservationService.setCheckoutDraft(draft);
    this.router.navigate(['/checkout']);
  }

  openClassInfoModal(initialClass: FlightSeatClass = 'BASIC'): void {
    this.activeClassModalTab.set(initialClass);
    this.isClassInfoModalOpen.set(true);
  }

  closeClassInfoModal(): void {
    this.isClassInfoModalOpen.set(false);
  }

  setActiveClassModalTab(seatClass: FlightSeatClass): void {
    this.activeClassModalTab.set(seatClass);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isClassInfoModalOpen()) {
      this.closeClassInfoModal();
    }
  }
}
