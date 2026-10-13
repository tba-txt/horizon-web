import { Component, OnInit, inject, signal, computed, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { animate, stagger } from 'motion';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationCardComponent } from '../components/destination-card/destination-card.component';
import { DestinationDetailModalComponent } from '../components/destination-detail-modal/destination-detail-modal.component';
import { DestinationsService, findLocalImage } from '../services/destinations.service';
import { FlightsService } from '../../flights/services/flights.service';
import { Destination } from '../models/destination.model';
import { Flight } from '../../flights/models/flight.model';
import { DestinationWeather } from '../models/weather.model';

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isAvailable: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-destination-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, DestinationDetailModalComponent, DestinationCardComponent],
  templateUrl: './destination-list.component.html',
  styleUrls: ['./destination-list.component.scss']
})
export class DestinationListComponent implements OnInit, AfterViewInit {
  private destinationsService = inject(DestinationsService);
  private flightsService = inject(FlightsService);
  private router = inject(Router);

  destinations = signal<Destination[]>([]);
  commonDestinations = signal<Destination[]>([]);
  ecoDestinations = signal<Destination[]>([]);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  selectedDestination = signal<Destination | null>(null);
  weather = signal<DestinationWeather | null>(null);
  isLoadingWeather = signal(false);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';

  searchType = signal<'IDA' | 'IDA_VOLTA'>('IDA');
  searchClass = signal<string>('Básico');
  searchOrigin = signal<string>('SAO');
  searchDestinationId = signal<number | null>(null);
  searchStartDate = signal<string>('');
  searchEndDate = signal<string>('');
  searchPassengers = signal<number>(1);
  minDate = signal<string>(this.calculateMinDate(3));

  // --- Search Mode ---
  activeSearchMode = signal<'COMMON' | 'ECO'>('COMMON');
  primaryColor = computed(() => this.activeSearchMode() === 'ECO' ? '#63B921' : '#4895CC');
  secondaryColor = computed(() => this.activeSearchMode() === 'ECO' ? '#74C33A' : '#5BA4D8');
  currentModeDestinations = computed(() => this.activeSearchMode() === 'ECO' ? this.ecoDestinations() : this.commonDestinations());

  setSearchMode(mode: 'COMMON' | 'ECO') {
    if (this.activeSearchMode() === mode) return;
    this.activeSearchMode.set(mode);
    this.searchDestinationId.set(null);
    this.searchStartDate.set('');
    this.searchEndDate.set('');
    this.isDestinationDropdownOpen.set(false);
  }
  // -------------------

  // Estados do Calendário Interativo de Voos
  destinationFlights = signal<Flight[]>([]);
  isLoadingFlightDates = signal<boolean>(false);
  isOutboundCalendarOpen = signal<boolean>(false);
  isReturnCalendarOpen = signal<boolean>(false);
  calendarMonth = signal<Date>(new Date());
  returnCalendarMonth = signal<Date>(new Date());
  minDepartureDate: string = this.calculateMinDate(3);

  // Datas disponíveis para IDA (voos saindo de SP com vagas)
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

  // Datas disponíveis para VOLTA (voos retornando a SP com vagas e >= data de ida)
  availableReturnDates = computed(() => {
    const dates = new Set<string>();
    const start = this.searchStartDate();
    for (const f of this.destinationFlights()) {
      if (f.destinationAirportCode === 'GRU' && f.availableSeats > 0) {
        const dStr = f.flightDate.substring(0, 10);
        if (!start || dStr >= start) {
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

  // Dropdown states
  isTypeDropdownOpen = signal(false);
  isClassDropdownOpen = signal(false);
  isOriginDropdownOpen = signal(false);
  isDestinationDropdownOpen = signal(false);
  isPassengersDropdownOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event?: MouseEvent) {
    if (event) {
      const target = event.target as HTMLElement;
      if (!target.closest('.calendar-popover-container')) {
        this.isOutboundCalendarOpen.set(false);
        this.isReturnCalendarOpen.set(false);
      }
    }
    this.closeAllDropdowns();
  }

  closeAllDropdowns() {
    this.isTypeDropdownOpen.set(false);
    this.isClassDropdownOpen.set(false);
    this.isOriginDropdownOpen.set(false);
    this.isDestinationDropdownOpen.set(false);
    this.isPassengersDropdownOpen.set(false);
  }

  toggleDropdown(dropdown: 'type' | 'class' | 'origin' | 'dest' | 'passengers', event: Event) {
    event.stopPropagation();
    let currentState = false;
    switch (dropdown) {
      case 'type': currentState = this.isTypeDropdownOpen(); break;
      case 'class': currentState = this.isClassDropdownOpen(); break;
      case 'origin': currentState = this.isOriginDropdownOpen(); break;
      case 'dest': currentState = this.isDestinationDropdownOpen(); break;
      case 'passengers': currentState = this.isPassengersDropdownOpen(); break;
    }
    this.closeAllDropdowns();
    
    switch (dropdown) {
      case 'type': this.isTypeDropdownOpen.set(!currentState); break;
      case 'class': this.isClassDropdownOpen.set(!currentState); break;
      case 'origin': this.isOriginDropdownOpen.set(!currentState); break;
      case 'dest': 
        this.isDestinationDropdownOpen.set(!currentState); 
        if (!currentState) {
          setTimeout(() => {
            const dropdownEl = document.querySelector('.custom-dest-dropdown');
            if (dropdownEl) {
              animate(dropdownEl, { opacity: [0, 1], y: [-15, 0], scale: [0.96, 1] }, { duration: 0.3, ease: [0.16, 1, 0.3, 1] });
            }
            const items = document.querySelectorAll('.dest-item');
            if (items.length > 0) {
              // Ensure initial state for staggering
              items.forEach(el => { (el as HTMLElement).style.opacity = '0'; });
              animate(items, { opacity: [0, 1], x: [-10, 0] }, { duration: 0.3, delay: stagger(0.04), ease: 'easeOut' });
            }
          }, 0);
        }
        break;
      case 'passengers': this.isPassengersDropdownOpen.set(!currentState); break;
    }
  }

  selectType(type: 'IDA' | 'IDA_VOLTA', event: Event) {
    event.stopPropagation();
    this.searchType.set(type);
    this.isTypeDropdownOpen.set(false);
  }

  selectClass(className: string, event: Event) {
    event.stopPropagation();
    this.searchClass.set(className);
    this.isClassDropdownOpen.set(false);
  }

  selectOrigin(origin: string, event: Event) {
    event.stopPropagation();
    this.searchOrigin.set(origin);
    this.isOriginDropdownOpen.set(false);
  }

  selectDestination(destId: number, event: Event) {
    event.stopPropagation();
    this.searchDestinationId.set(destId);
    this.searchStartDate.set('');
    this.searchEndDate.set('');
    this.isDestinationDropdownOpen.set(false);
    this.isOutboundCalendarOpen.set(false);
    this.isReturnCalendarOpen.set(false);
    this.loadDestinationFlights(destId);
  }

  selectPassengers(count: number, event: Event) {
    event.stopPropagation();
    this.searchPassengers.set(count);
    this.isPassengersDropdownOpen.set(false);
  }

  getOriginLabel(): string {
    const o = this.searchOrigin();
    if (o === 'SAO') return 'São Paulo (SAO)';
    return o;
  }

  getDestinationLabel(): string {
    const id = this.searchDestinationId();
    if (!id) return '';
    const dest = this.destinations().find(d => d.id === id);
    if (!dest) return '';
    const name = (dest.name || '').trim();
    const country = (dest.country || '').trim();
    return (!country || country.toLowerCase() === name.toLowerCase()) ? name : `${name} (${country})`;
  }

  ngOnInit(): void {
    this.loadDestinations();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // Animação de entrada do card de busca
      const searchBox = document.querySelector('.flight-search-overlay');
      if (searchBox) {
        animate(searchBox, { opacity: [0, 1], y: [25, 0] }, { duration: 0.45, ease: 'easeOut' });
      }

      // Animação em cascata dos cards de destinos
      const cards = document.querySelectorAll('app-destination-card');
      if (cards.length > 0) {
        animate(
          cards,
          { opacity: [0, 1], y: [20, 0] },
          { delay: stagger(0.05), duration: 0.4, ease: 'easeOut' }
        );
      }
    }, 60);
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
    const selectedDate = type === 'outbound' ? this.searchStartDate() : this.searchEndDate();

    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      const dateStr = this.formatDateToIso(dayDate);

      let isBeforeMin = false;
      if (type === 'outbound') {
        isBeforeMin = dateStr < this.minDepartureDate;
      } else {
        isBeforeMin = !this.searchStartDate() || dateStr < this.searchStartDate();
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

  getMonthYearLabel(date: Date): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  toggleOutboundCalendar(event: Event): void {
    event.stopPropagation();
    if (!this.searchDestinationId() || this.isLoadingFlightDates()) {
      if (!this.searchDestinationId()) {
        this.showToast('Por favor, selecione primeiro o destino desejado.', 'warning');
      }
      return;
    }
    this.closeAllDropdowns();
    this.isReturnCalendarOpen.set(false);
    this.isOutboundCalendarOpen.update(v => !v);
  }

  toggleReturnCalendar(event: Event): void {
    event.stopPropagation();
    if (!this.searchStartDate()) {
      this.showToast('Por favor, selecione primeiro a data de ida.', 'warning');
      return;
    }
    this.closeAllDropdowns();
    this.isOutboundCalendarOpen.set(false);
    this.isReturnCalendarOpen.update(v => !v);
  }

  selectOutboundDate(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isAvailable) return;
    this.searchStartDate.set(day.dateStr);
    this.isOutboundCalendarOpen.set(false);

    if (this.searchEndDate() && this.searchEndDate() < day.dateStr) {
      this.searchEndDate.set('');
    }

    const [y, m, d] = day.dateStr.split('-').map(Number);
    this.returnCalendarMonth.set(new Date(y, m - 1, 1));
  }

  selectReturnDate(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isAvailable) return;
    this.searchEndDate.set(day.dateStr);
    this.isReturnCalendarOpen.set(false);
  }

  clearReturnDate(event: Event): void {
    event.stopPropagation();
    this.searchEndDate.set('');
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

  toastMessage = signal<string | null>(null);
  toastType = signal<'warning' | 'error' | 'success'>('warning');
  private toastTimeout: any;

  showToast(message: string, type: 'warning' | 'error' | 'success' = 'warning'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  dismissToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(null);
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

  isEcoDestination(): boolean {
    return (this.selectedDestination()?.tourismType || '').toUpperCase() === 'ECOTURISMO';
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

  calculateMinDate(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  submitSearch(): void {
    if (!this.searchDestinationId() || !this.searchStartDate()) {
      this.showToast('Por favor, selecione o destino e a data de ida.', 'warning');
      return;
    }
    
    const classMap: Record<string, string> = {
      'Básico': 'BASIC',
      'Executivo': 'EXECUTIVE',
      'Premium': 'PREMIUM'
    };

    const queryParams: any = {
      destinationId: this.searchDestinationId(),
      startDate: this.searchStartDate(),
      passengers: this.searchPassengers(),
      seatClass: classMap[this.searchClass()] || 'BASIC',
      type: this.searchType()
    };
    
    if (this.searchType() === 'IDA_VOLTA' && this.searchEndDate()) {
      queryParams.endDate = this.searchEndDate();
    }
    
    this.router.navigate(['/flights'], { queryParams });
  }

  loadDestinations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.destinationsService.getDestinations(true).subscribe({
      next: (data) => {
        const list = data || [];
        this.destinations.set(list);

        // Separação em Comum (#4895CC) e Ecoturismo (#63B921)
        const common = list.filter(d => (d.tourismType || '').toUpperCase() === 'COMUM');
        const eco = list.filter(d => (d.tourismType || '').toUpperCase() === 'ECOTURISMO');

        const norm = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

        const findDest = (arr: Destination[], target: string) => {
          const tNorm = norm(target);
          return arr.find(d => norm(d.name) === tNorm || norm(d.city) === tNorm);
        };

        const commonOrder = [
          'Rio de Janeiro', 'Dubai', 'Paris',
          'Istambul', 'Bangkok', 'Sydney',
          'Atenas', 'Madri', 'Toronto'
        ];

        const ecoOrder = [
          'Machu Picchu', 'Banff', 'Fernando de Noronha',
          'Bonito', 'Chapada Diamantina', 'Patagônia',
          'Yellowstone', 'Costa Rica', 'Reykjavík'
        ];

        const sortedCommon: Destination[] = [];
        for (const name of commonOrder) {
          const found = findDest(common, name);
          if (found && !sortedCommon.some(item => item.id === found.id)) {
            sortedCommon.push(found);
          }
        }
        for (const d of common) {
          if (sortedCommon.length >= 9) break;
          if (!sortedCommon.some(item => item.id === d.id)) {
            sortedCommon.push(d);
          }
        }

        const sortedEco: Destination[] = [];
        for (const name of ecoOrder) {
          const found = findDest(eco, name);
          if (found && !sortedEco.some(item => item.id === found.id)) {
            sortedEco.push(found);
          }
        }
        for (const d of eco) {
          if (sortedEco.length >= 9) break;
          if (!sortedEco.some(item => item.id === d.id)) {
            sortedEco.push(d);
          }
        }

        this.commonDestinations.set(sortedCommon.slice(0, 9));
        this.ecoDestinations.set(sortedEco.slice(0, 9));

        this.isLoading.set(false);

        setTimeout(() => {
          const cards = document.querySelectorAll('app-destination-card');
          if (cards.length > 0) {
            animate(
              cards,
              { opacity: [0, 1], y: [20, 0] },
              { delay: stagger(0.05), duration: 0.4, ease: 'easeOut' }
            );
          }
        }, 50);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao buscar destinos.');
      }
    });
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

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedDestination()) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.selectedDestination.set(null);
    this.weather.set(null);
  }

  navigateToFlights(destinationId: number): void {
    this.closeModal();
    this.router.navigate(['/flights'], { queryParams: { destinationId } });
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  handleHeroError(event: any): void {
    event.target.style.display = 'none';
  }

  
  onEmbark(dest: Destination): void {
    this.router.navigate(['/flights'], { queryParams: { origin: 'SAO', destinationId: dest.id } });
  }

  getMappedDestination(dest: Destination): Destination {
    const localImg = findLocalImage(dest.name, dest.city);
    if (localImg) {
      return { ...dest, imageUrl: localImg };
    }
    return dest;
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }
}
