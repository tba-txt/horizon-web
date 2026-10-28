import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { animate, stagger, scroll, inView } from 'motion';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationCardComponent } from '../components/destination-card/destination-card.component';
import { DestinationDetailModalComponent } from '../components/destination-detail-modal/destination-detail-modal.component';
import { BackToTopComponent } from '../../../shared/components/back-to-top/back-to-top.component';
import { DestinationsService, findLocalImage } from '../services/destinations.service';
import { FlightsService } from '../../flights/services/flights.service';
import { FeedService } from '../../feed/services/feed.service';
import { Destination } from '../models/destination.model';
import { Flight } from '../../flights/models/flight.model';
import { DestinationWeather } from '../models/weather.model';
import { Post } from '../../feed/models/feed.model';

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
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, DestinationDetailModalComponent, DestinationCardComponent, BackToTopComponent],
  templateUrl: './destination-list.component.html',
  styleUrls: ['./destination-list.component.scss']
})
export class DestinationListComponent implements OnInit, AfterViewInit, OnDestroy {
  private destinationsService = inject(DestinationsService);
  private flightsService = inject(FlightsService);
  private feedService = inject(FeedService);
  private router = inject(Router);

  feedPosts = signal<Post[]>([]);
  isLoadingFeed = signal<boolean>(true);
  activeFeedImageIndex = signal<Record<number, number>>({});
  isDraggingFeedPhoto: Record<number, boolean> = {};
  private feedDragStartX: Record<number, number> = {};
  private feedScrollLeftPos: Record<number, number> = {};

  // --- Floating Quiz Widget State ---
  isQuizWiggling = signal(false);
  isQuizExpanded = signal(false);
  isDraggingQuiz = signal(false);
  dragOffsetQuiz = signal<number | null>(null);
  quizSubtleNotice = signal<string | null>(null);
  private dragStartX = 0;
  private hasMovedDuringDrag = false;

  private quizWiggleIntervalId?: any;
  private quizNoticeIntervalId?: any;
  private quizWiggleTimeoutId?: any;
  private quizNoticeTimeoutId?: any;

  destinations = signal<Destination[]>([]);
  commonDestinations = signal<Destination[]>([]);
  ecoDestinations = signal<Destination[]>([]);
  activeScrollSection = signal<'common' | 'eco'>('common');
  isStickyNavVisible = signal(false);
  flightTrailPathD1 = signal<string>('');
  flightTrailPathD2 = signal<string>('');
  planeTransformStyle = signal<string>('translate3d(-100px, -100px, 0)');
  isPlaneInEco = signal<boolean>(false);

  // Efeito de palavras rotativas no título
  rotatingWords = ['viagem?', 'aventura?', 'descoberta?', 'experiência?'];
  currentRotatingWordIndex = signal(0);
  currentRotatingWord = computed(() => this.rotatingWords[this.currentRotatingWordIndex()]);
  isWordFlipping = signal(false);
  private wordRotationIntervalId?: any;

  // --- Prévia Interativa Real do Quiz Horizon ---
  readonly quizStepNames = ['Estilo', 'Clima', 'Experiência', 'Ritmo', 'Atmosfera', 'Orçamento'];
  quizPreviewIndex = signal(0);
  quizPreviewPassport = signal(true);

  readonly quizPreviewCards = [
    {
      label: 'Ecoturismo',
      image: 'assets/ecoturismo.webp',
      stepIndex: 0,
      stepName: 'Estilo',
      questionTitle: 'Qual é o seu estilo de viagem?',
      optionBadge: 'Opção 1 de 6',
      archetype: 'Explorador da Natureza',
      isEco: true,
      cardImg: 'assets/horizon-verde.webp',
      heartTitle: 'Ecoturismo e Natureza Viva',
      heartDesc: 'Identificamos que seu perfil busca contato genuíno com biomas preservados, cachoeiras e trilhas longe do turismo de massa.',
      radarValues: { praia: 0.65, natureza: 0.96, aventura: 0.88, cidade: 0.28, cultura: 0.62, relaxamento: 0.78 },
      affinities: [
        { label: 'Ecoturismo e Natureza', pct: 96, color: '#65A30D' },
        { label: 'Aventura e Trilhas', pct: 88, color: '#65A30D' },
        { label: 'Desconexão e Descanso', pct: 78, color: '#5BA4D8' }
      ]
    },
    {
      label: 'Sol e Calor',
      image: 'assets/sol.webp',
      stepIndex: 1,
      stepName: 'Clima',
      questionTitle: 'Qual clima te faz mais feliz?',
      optionBadge: 'Opção 2 de 6',
      archetype: 'Amante do Litoral',
      isEco: false,
      cardImg: 'assets/horizon45.webp',
      heartTitle: 'Sol, Brisa e Águas Cristalinas',
      heartDesc: 'Sua energia recarrega em praias paradisíacas, piscinas naturais e destinos ensolarados à beira-mar.',
      radarValues: { praia: 0.98, natureza: 0.80, aventura: 0.64, cidade: 0.45, cultura: 0.58, relaxamento: 0.92 },
      affinities: [
        { label: 'Sol e Litoral', pct: 98, color: '#5BA4D8' },
        { label: 'Descanso e Brisa', pct: 92, color: '#5BA4D8' },
        { label: 'Natureza Marinha', pct: 80, color: '#65A30D' }
      ]
    },
    {
      label: 'Natureza e Vida Selvagem',
      image: 'assets/pantanal.webp',
      stepIndex: 2,
      stepName: 'Experiência',
      questionTitle: 'O que você procura viver nessa viagem?',
      optionBadge: 'Opção 3 de 6',
      archetype: 'Observador da Vida Selvagem',
      isEco: true,
      cardImg: 'assets/horizon-verde.webp',
      heartTitle: 'Santuários e Vida Selvagem',
      heartDesc: 'Você vibra com reservas ambientais, observação de fauna nativa e imersão em ecossistemas únicos.',
      radarValues: { praia: 0.54, natureza: 0.98, aventura: 0.90, cidade: 0.22, cultura: 0.60, relaxamento: 0.74 },
      affinities: [
        { label: 'Natureza e Fauna', pct: 98, color: '#65A30D' },
        { label: 'Expedições e Aventura', pct: 90, color: '#65A30D' },
        { label: 'Paisagens Intocadas', pct: 74, color: '#5BA4D8' }
      ]
    },
    {
      label: 'Cultura e História',
      image: 'assets/machu-picchu.webp',
      stepIndex: 2,
      stepName: 'Experiência',
      questionTitle: 'O que você procura viver nessa viagem?',
      optionBadge: 'Opção 4 de 6',
      archetype: 'Viajante Cultural',
      isEco: false,
      cardImg: 'assets/horizon45.webp',
      heartTitle: 'Cultura, História e Patrimônio',
      heartDesc: 'Seu coração bate mais forte diante de ruínas ancestrais, arquitetura histórica, museus e gastronomia local.',
      radarValues: { praia: 0.42, natureza: 0.72, aventura: 0.76, cidade: 0.84, cultura: 0.98, relaxamento: 0.64 },
      affinities: [
        { label: 'Cultura e História', pct: 98, color: '#5BA4D8' },
        { label: 'Cidades e Arquitetura', pct: 84, color: '#5BA4D8' },
        { label: 'Trilhas Históricas', pct: 76, color: '#65A30D' }
      ]
    },
    {
      label: 'Aventura',
      image: 'assets/chapada-diamantina.webp',
      stepIndex: 3,
      stepName: 'Ritmo',
      questionTitle: 'Qual é o ritmo ideal dos seus dias?',
      optionBadge: 'Opção 5 de 6',
      archetype: 'Buscador de Aventura',
      isEco: true,
      cardImg: 'assets/horizon-verde.webp',
      heartTitle: 'Aventura e Paisagens Épicas',
      heartDesc: 'Dias intensos explorando cânions, serras tabulares, mirantes e expedições de tirar o fôlego.',
      radarValues: { praia: 0.58, natureza: 0.94, aventura: 0.98, cidade: 0.30, cultura: 0.66, relaxamento: 0.52 },
      affinities: [
        { label: 'Aventura e Montanha', pct: 98, color: '#65A30D' },
        { label: 'Ecoturismo e Natureza', pct: 94, color: '#65A30D' },
        { label: 'Cultura Regional', pct: 66, color: '#5BA4D8' }
      ]
    },
    {
      label: 'Desconexão e Descanso',
      image: 'assets/maldivas.webp',
      stepIndex: 4,
      stepName: 'Atmosfera',
      questionTitle: 'Qual atmosfera combina com seu momento?',
      optionBadge: 'Opção 6 de 6',
      archetype: 'Mente Zen e Descanso',
      isEco: false,
      cardImg: 'assets/horizon45.webp',
      heartTitle: 'Desconexão e Refúgio Absoluto',
      heartDesc: 'O seu momento pede paz absoluta, águas calmas, conforto exclusivo e dias sem pressa.',
      radarValues: { praia: 0.95, natureza: 0.76, aventura: 0.38, cidade: 0.35, cultura: 0.56, relaxamento: 0.98 },
      affinities: [
        { label: 'Descanso e Spa', pct: 98, color: '#5BA4D8' },
        { label: 'Sol e Litoral', pct: 95, color: '#5BA4D8' },
        { label: 'Natureza Preservada', pct: 76, color: '#65A30D' }
      ]
    }
  ];

  readonly quizRadarAxes = [
    { label: 'Praia', angle: -Math.PI / 2, key: 'praia', textX: 150, textY: 34, pctY: 46, anchor: 'middle', lineX: 150, lineY: 55 },
    { label: 'Natureza', angle: -Math.PI / 6, key: 'natureza', textX: 228, textY: 88, pctY: 100, anchor: 'start', lineX: 215, lineY: 92.5 },
    { label: 'Aventura', angle: Math.PI / 6, key: 'aventura', textX: 228, textY: 172, pctY: 184, anchor: 'start', lineX: 215, lineY: 167.5 },
    { label: 'Cidades', angle: Math.PI / 2, key: 'cidade', textX: 150, textY: 226, pctY: 238, anchor: 'middle', lineX: 150, lineY: 205 },
    { label: 'Cultura', angle: (5 * Math.PI) / 6, key: 'cultura', textX: 72, textY: 172, pctY: 184, anchor: 'end', lineX: 85, lineY: 167.5 },
    { label: 'Descanso', angle: (-5 * Math.PI) / 6, key: 'relaxamento', textX: 72, textY: 88, pctY: 100, anchor: 'end', lineX: 85, lineY: 92.5 }
  ];

  currentQuizPreview = computed(() => this.quizPreviewCards[this.quizPreviewIndex()]);

  visibleQuizPreviewStack = computed(() => {
    const cards = this.quizPreviewCards;
    const top = this.quizPreviewIndex();
    return [0, 1, 2].map(offset => {
      const idx = (top + offset) % cards.length;
      return { card: cards[idx], index: idx, offset };
    });
  });

  quizRadarPolygonPoints = computed(() => {
    const vals = this.currentQuizPreview().radarValues as Record<string, number>;
    const cx = 150;
    const cy = 130;
    const r = 75;
    return this.quizRadarAxes.map(axis => {
      const val = vals[axis.key] || 0.5;
      const x = cx + r * val * Math.cos(axis.angle);
      const y = cy + r * val * Math.sin(axis.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });

  quizRadarInnerPolygonPoints = computed(() => {
    const vals = this.currentQuizPreview().radarValues as Record<string, number>;
    const cx = 150;
    const cy = 130;
    const r = 75;
    return this.quizRadarAxes.map(axis => {
      const val = (vals[axis.key] || 0.5) * 0.55;
      const x = cx + r * val * Math.cos(axis.angle);
      const y = cy + r * val * Math.sin(axis.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });

  quizRadarVertexDots = computed(() => {
    const vals = this.currentQuizPreview().radarValues as Record<string, number>;
    const cx = 150;
    const cy = 130;
    const r = 75;
    return this.quizRadarAxes.map(axis => {
      const val = vals[axis.key] || 0.5;
      return {
        key: axis.key,
        pct: Math.round(val * 100),
        isHigh: val >= 0.75,
        x: cx + r * val * Math.cos(axis.angle),
        y: cy + r * val * Math.sin(axis.angle)
      };
    });
  });

  quizRadarAxisPct(key: string): number {
    const vals = this.currentQuizPreview().radarValues as Record<string, number>;
    return Math.round((vals[key] ?? 0.5) * 100);
  }

  nextQuizPreviewCard(event?: Event): void {
    if (event) event.stopPropagation();
    this.quizPreviewIndex.update(idx => (idx + 1) % this.quizPreviewCards.length);
  }

  prevQuizPreviewCard(event?: Event): void {
    if (event) event.stopPropagation();
    this.quizPreviewIndex.update(idx => (idx - 1 + this.quizPreviewCards.length) % this.quizPreviewCards.length);
  }

  selectQuizPreviewCard(index: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.quizPreviewIndex.set(index);
  }

  selectQuizPreviewByStep(stepIndex: number): void {
    const foundIdx = this.quizPreviewCards.findIndex(c => c.stepIndex === stepIndex);
    if (foundIdx !== -1) {
      this.quizPreviewIndex.set(foundIdx);
    }
  }

  toggleQuizPreviewPassport(event?: Event): void {
    if (event) event.stopPropagation();
    this.quizPreviewPassport.update(v => !v);
  }

  // --- Mecânica de Swipe Interativo nos Cards Grandes do Quiz ---
  cardDragOffset = signal<number>(0);
  isCardDragging = signal<boolean>(false);
  isCardAnimatingOut = signal<'left' | 'right' | null>(null);
  private cardDragStartX = 0;

  swipeFeedback = computed<'like' | 'pass' | null>(() => {
    const offset = this.cardDragOffset();
    if (offset > 45) return 'like';
    if (offset < -45) return 'pass';
    return null;
  });

  onCardSwipeDragStart(event: MouseEvent | TouchEvent): void {
    if (this.isCardAnimatingOut()) return;
    this.isCardDragging.set(true);
    this.cardDragStartX = 'touches' in event ? event.touches[0].clientX : event.clientX;

    if (!('touches' in event)) {
      document.addEventListener('mousemove', this.onGlobalSwipeMouseMove);
      document.addEventListener('mouseup', this.onGlobalSwipeMouseUp);
    }
  }

  onCardSwipeDragMove(event: MouseEvent | TouchEvent): void {
    if (!this.isCardDragging()) return;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const delta = clientX - this.cardDragStartX;
    const clamped = Math.max(-240, Math.min(240, delta));
    this.cardDragOffset.set(clamped);
  }

  private onGlobalSwipeMouseMove = (e: MouseEvent) => {
    this.onCardSwipeDragMove(e);
  };

  private onGlobalSwipeMouseUp = () => {
    this.onCardSwipeDragEnd();
  };

  onCardSwipeDragEnd(): void {
    if (!this.isCardDragging()) return;
    this.isCardDragging.set(false);

    document.removeEventListener('mousemove', this.onGlobalSwipeMouseMove);
    document.removeEventListener('mouseup', this.onGlobalSwipeMouseUp);

    const delta = this.cardDragOffset();
    const SWIPE_THRESHOLD = 70;

    if (delta > SWIPE_THRESHOLD) {
      this.performSwipe('right');
    } else if (delta < -SWIPE_THRESHOLD) {
      this.performSwipe('left');
    } else {
      this.cardDragOffset.set(0);
    }
  }

  performSwipe(direction: 'left' | 'right', event?: Event): void {
    if (event) event.stopPropagation();
    if (this.isCardAnimatingOut()) return;

    this.isCardAnimatingOut.set(direction);
    this.cardDragOffset.set(direction === 'right' ? 340 : -340);

    setTimeout(() => {
      this.quizPreviewIndex.update(idx => (idx + 1) % this.quizPreviewCards.length);
      this.cardDragOffset.set(0);
      this.isCardAnimatingOut.set(null);
    }, 280);
  }

  /**
   * =========================================================================
   * CONTROLE DE FLUIDEZ DO VOO (LERP - Linear Interpolation)
   * =========================================================================
   * Onde você ajusta a suavidade da descida do avião e da linha:
   * 
   * - 0.04 a 0.06 -> Super suave / inercial: o avião desliza macio, com efeito
   *                  de flutuação amortecida como um avião de verdade no ar.
   * - 0.08        -> (PADRÃO RECOMENDADO): Perfeita harmonia entre resposta ao
   *                  scroll do mouse e fluidez orgânica contínua sem travadas.
   * - 0.12 a 0.20 -> Resposta mais rápida e imediata aos movimentos de rolagem.
   */
  readonly FLIGHT_FLUIDITY = 0.20;

  private pathElement1?: SVGPathElement;
  private pathElement2?: SVGPathElement;
  private len1 = 0;
  private len2 = 0;
  private totalPathLength = 0;
  private ecoSectionStartY = 0;
  private flightExitY = 1800;
  private flightWrapY = 1960;
  private targetProgress = 0;
  private currentProgress = 0;
  private animFrameId?: number;
  private isFlightLoopRunning = false;
  private flightMaxY = 0;

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
  primaryColor = computed(() => this.activeSearchMode() === 'ECO' ? '#65A30D' : '#5BA4D8');
  secondaryColor = computed(() => this.activeSearchMode() === 'ECO' ? '#74C33A' : '#4895CC');
  currentModeDestinations = computed(() => {
    const targetType = this.activeSearchMode() === 'ECO' ? 'ECOTURISMO' : 'COMUM';
    return this.destinations().filter(d => (d.tourismType || '').trim().toUpperCase() === targetType);
  });

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
      if (!target.closest('.floating-quiz-container')) {
        this.isQuizExpanded.set(false);
      }
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
    this.startQuizTimers();
    this.startWordRotation();
    this.loadDestinations();
    this.loadFeedPosts();
  }

  private startWordRotation(): void {
    if (typeof window === 'undefined') return;
    this.wordRotationIntervalId = setInterval(() => {
      this.isWordFlipping.set(true);
      setTimeout(() => {
        this.currentRotatingWordIndex.update(idx => (idx + 1) % this.rotatingWords.length);
        this.isWordFlipping.set(false);
      }, 300);
    }, 2800);
  }

  private startQuizTimers(): void {
    if (typeof window === 'undefined') return;

    // Tremor sutil inicial aos 2.5s para demonstrar
    setTimeout(() => {
      this.isQuizWiggling.set(true);
      setTimeout(() => this.isQuizWiggling.set(false), 1500);
    }, 2500);

    // Tremer a cada 30 segundos
    this.quizWiggleIntervalId = setInterval(() => {
      this.isQuizWiggling.set(true);
      if (this.quizWiggleTimeoutId) clearTimeout(this.quizWiggleTimeoutId);
      this.quizWiggleTimeoutId = setTimeout(() => {
        this.isQuizWiggling.set(false);
      }, 1500);
    }, 30000);

    // Mensagem da Horizon a cada 3 minutos (apenas se o botão estiver fechado)
    const noticeText = 'Vamos descobrir juntos o seu próximo destino';

    this.quizNoticeIntervalId = setInterval(() => {
      if (!this.isQuizExpanded()) {
        this.quizSubtleNotice.set(noticeText);
        if (this.quizNoticeTimeoutId) clearTimeout(this.quizNoticeTimeoutId);
        this.quizNoticeTimeoutId = setTimeout(() => {
          this.quizSubtleNotice.set(null);
        }, 5000);
      }
    }, 180000);
  }

  onQuizDragStart(e: MouseEvent | TouchEvent): void {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    this.dragStartX = clientX;
    this.isDraggingQuiz.set(true);
    this.hasMovedDuringDrag = false;
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onWindowDragMove(e: MouseEvent | TouchEvent): void {
    if (!this.isDraggingQuiz()) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - this.dragStartX;
    if (Math.abs(deltaX) > 4) {
      this.hasMovedDuringDrag = true;
    }
    const baseOffset = this.isQuizExpanded() ? 0 : -108;
    const newOffset = Math.min(0, Math.max(-108, baseOffset + deltaX));
    this.dragOffsetQuiz.set(newOffset);
  }

  @HostListener('window:mouseup', ['$event'])
  @HostListener('window:touchend', ['$event'])
  onWindowDragEnd(e: MouseEvent | TouchEvent): void {
    if (!this.isDraggingQuiz()) return;
    this.isDraggingQuiz.set(false);
    const offset = this.dragOffsetQuiz();
    this.dragOffsetQuiz.set(null);

    if (this.hasMovedDuringDrag && offset !== null) {
      if (offset > -54) {
        this.isQuizExpanded.set(true);
        this.quizSubtleNotice.set(null);
      } else {
        this.isQuizExpanded.set(false);
      }
    }
  }

  onQuizClick(e: MouseEvent): void {
    if (this.hasMovedDuringDrag) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!this.isQuizExpanded()) {
      e.preventDefault();
      e.stopPropagation();
      this.isQuizExpanded.set(true);
      this.quizSubtleNotice.set(null);
      return;
    }
    // Segundo clique com a aba aberta: redireciona para o quiz
    this.router.navigate(['/quiz']);
  }

  ngOnDestroy(): void {
    if (this.wordRotationIntervalId) clearInterval(this.wordRotationIntervalId);
    if (this.quizWiggleIntervalId) clearInterval(this.quizWiggleIntervalId);
    if (this.quizNoticeIntervalId) clearInterval(this.quizNoticeIntervalId);
    if (this.quizWiggleTimeoutId) clearTimeout(this.quizWiggleTimeoutId);
    if (this.quizNoticeTimeoutId) clearTimeout(this.quizNoticeTimeoutId);
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window === 'undefined') return;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    this.isStickyNavVisible.set(scrollY > 420);

    const ecoElem = document.getElementById('section-eco');
    if (ecoElem) {
      const rect = ecoElem.getBoundingClientRect();
      if (rect.top <= 250) {
        this.activeScrollSection.set('eco');
      } else {
        this.activeScrollSection.set('common');
      }
    } else {
      this.activeScrollSection.set('common');
    }

    this.updateFlightTargetProgress();
    this.ensureFlightLoop();
    this.checkScrollReveal();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateFlightTrailGeometry();
  }

  scrollToSection(id: string): void {
    if (typeof window === 'undefined') return;
    const elem = document.getElementById(id);
    if (elem) {
      const yOffset = -90;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      if (id === 'section-eco') {
        this.activeScrollSection.set('eco');
      } else {
        this.activeScrollSection.set('common');
      }
    }
  }

  updateFlightTargetProgress(): void {
    if (typeof window === 'undefined') return;
    const mainElem = document.querySelector('main.main-content') as HTMLElement;
    if (!mainElem) return;

    const rect = mainElem.getBoundingClientRect();
    const windowH = window.innerHeight;

    // Ponto onde o usuário está olhando na tela em relação ao container main
    const viewportInMain = -rect.top + windowH * 0.40;
    const startY = 35;
    const exitY = this.flightExitY > 0 ? this.flightExitY : 1800;
    const wrapY = this.flightWrapY > 0 ? this.flightWrapY : (exitY + 160);
    const maxY = this.flightMaxY > 0 ? this.flightMaxY : (rect.height + 15);

    if (viewportInMain <= exitY) {
      // 0 a 0.5: Trajeto 1 (Topo até saída na esquerda em Machu Picchu)
      const p1 = Math.max(0, Math.min(1, (viewportInMain - startY) / Math.max(1, exitY - startY)));
      this.targetProgress = p1 * 0.5;
    } else if (viewportInMain < wrapY) {
      // Transição da volta ao mundo (avião fora da tela após saída pela esquerda)
      this.targetProgress = 0.5;
    } else {
      // 0.5 a 1.0: Trajeto 2 (Reaparecimento na direita até o footer)
      const p2 = Math.max(0, Math.min(1, (viewportInMain - wrapY) / Math.max(1, maxY - wrapY)));
      this.targetProgress = 0.5 + p2 * 0.5;
    }
  }

  private ensureFlightLoop(): void {
    if (this.isFlightLoopRunning || typeof window === 'undefined') return;
    this.isFlightLoopRunning = true;

    const loop = () => {
      const diff = this.targetProgress - this.currentProgress;
      // LERP: interpolação contínua (FLIGHT_FLUIDITY) a 60/120 FPS via requestAnimationFrame
      if (Math.abs(diff) > 0.0001) {
        this.currentProgress += diff * this.FLIGHT_FLUIDITY;
        this.renderFlightPlane(this.currentProgress);
        this.animFrameId = requestAnimationFrame(loop);
      } else {
        this.currentProgress = this.targetProgress;
        this.renderFlightPlane(this.currentProgress);
        this.isFlightLoopRunning = false;
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  renderFlightPlane(progress: number): void {
    if (typeof window === 'undefined') return;

    // Garante que os elementos SVG e seus comprimentos estão medidos e com strokeDasharray ativo
    if (!this.pathElement1 || this.len1 <= 0) {
      this.pathElement1 = document.querySelector('.flight-path-1') as SVGPathElement;
      if (this.pathElement1) {
        this.len1 = this.pathElement1.getTotalLength() || 0;
        if (this.len1 > 0) {
          this.pathElement1.style.strokeDasharray = `${this.len1} ${this.len1}`;
        }
      }
    }
    if (!this.pathElement2 || this.len2 <= 0) {
      this.pathElement2 = document.querySelector('.flight-path-2') as SVGPathElement;
      if (this.pathElement2) {
        this.len2 = this.pathElement2.getTotalLength() || 0;
        if (this.len2 > 0) {
          this.pathElement2.style.strokeDasharray = `${this.len2} ${this.len2}`;
        }
      }
    }

    this.totalPathLength = this.len1 + this.len2;
    if (this.len1 <= 0) return;

    const clamped = Math.max(0, Math.min(1, progress));

    if (clamped <= 0.5) {
      // -------------------------------------------------------------------
      // TRAJETO 1: Topo até a saída pela esquerda (antes do wrap)
      // -------------------------------------------------------------------
      const prog1 = clamped / 0.5;
      const currentDist = prog1 * this.len1;

      if (this.pathElement1 && this.len1 > 0) {
        this.pathElement1.style.strokeDasharray = `${this.len1} ${this.len1}`;
        this.pathElement1.style.strokeDashoffset = `${Math.max(0, this.len1 - currentDist)}`;
      }

      // O Trajeto 2 permanece 100% oculto (somente o traçado pontilhado fantasma fica visível)
      if (this.pathElement2 && this.len2 > 0) {
        this.pathElement2.style.strokeDasharray = `${this.len2} ${this.len2}`;
        this.pathElement2.style.strokeDashoffset = `${this.len2}`;
      }

      if (this.pathElement1 && this.len1 > 0) {
        const p = this.pathElement1.getPointAtLength(currentDist);
        const pNext = this.pathElement1.getPointAtLength(Math.min(this.len1, currentDist + 3));
        const pPrev = this.pathElement1.getPointAtLength(Math.max(0, currentDist - 3));

        const dx = pNext.x - pPrev.x;
        const dy = pNext.y - pPrev.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Atualiza a cor do avião: azul em Comum, verde ao entrar na seção de Ecoturismo
        const isEco = this.ecoSectionStartY > 0 && p.y >= (this.ecoSectionStartY - 60);
        this.isPlaneInEco.set(isEco);

        if (clamped <= 0.002) {
          this.planeTransformStyle.set(`translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${angle.toFixed(1)}deg) scale(0)`);
        } else if (this.len2 === 0 && clamped >= 0.985) {
          const fade = Math.max(0, (1 - clamped) / 0.015);
          this.planeTransformStyle.set(`translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${angle.toFixed(1)}deg) scale(${fade.toFixed(2)})`);
        } else {
          this.planeTransformStyle.set(`translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${angle.toFixed(1)}deg) scale(1)`);
        }
      }
    } else {
      // -------------------------------------------------------------------
      // TRAJETO 2: Reaparece na direita e desce suavemente até o footer
      // -------------------------------------------------------------------
      this.isPlaneInEco.set(true);

      // Trajeto 1 já concluído pelo avião: 100% desenhado
      if (this.pathElement1 && this.len1 > 0) {
        this.pathElement1.style.strokeDashoffset = '0';
      }

      const prog2 = (clamped - 0.5) / 0.5;
      const dist2 = prog2 * this.len2;

      if (this.pathElement2 && this.len2 > 0) {
        this.pathElement2.style.strokeDasharray = `${this.len2} ${this.len2}`;
        this.pathElement2.style.strokeDashoffset = `${Math.max(0, this.len2 - dist2)}`;

        const p = this.pathElement2.getPointAtLength(dist2);
        const pNext = this.pathElement2.getPointAtLength(Math.min(this.len2, dist2 + 3));
        const pPrev = this.pathElement2.getPointAtLength(Math.max(0, dist2 - 3));

        const dx = pNext.x - pPrev.x;
        const dy = pNext.y - pPrev.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // Ao se aproximar da seção azul (últimos 4% do trajeto), o avião desaparece suavemente (fade out)
        if (clamped >= 0.96) {
          const fade = Math.max(0, (1 - clamped) / 0.04);
          this.planeTransformStyle.set(`translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${angle.toFixed(1)}deg) scale(${fade.toFixed(2)})`);
        } else {
          this.planeTransformStyle.set(`translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%) rotate(${angle.toFixed(1)}deg) scale(1)`);
        }
      }
    }
  }

  updateFlightTrailGeometry(): void {
    if (typeof window === 'undefined') return;
    const mainElem = document.querySelector('main.main-content') as HTMLElement;
    if (!mainElem) return;

    const w = window.innerWidth || document.documentElement.clientWidth;
    const h = mainElem.offsetHeight;
    if (w <= 0 || h <= 0) return;

    const isMobile = w < 768;

    // Alturas verticais reais dos botões de catálogo
    const mainTop = mainElem.getBoundingClientRect().top + window.pageYOffset;
    const btnCommon = document.querySelector('.btn-explore-common') as HTMLElement;
    const btnEco = document.querySelector('.btn-explore-eco') as HTMLElement;

    const btnCommonY = btnCommon 
      ? (btnCommon.getBoundingClientRect().top + window.pageYOffset - mainTop + btnCommon.offsetHeight / 2) 
      : h * 0.44;

    const btnEcoY = btnEco 
      ? (btnEco.getBoundingClientRect().top + window.pageYOffset - mainTop + btnEco.offsetHeight / 2) 
      : h * 0.95;

    // Busca o track container para alinhar milimetricamente as coordenadas do SVG
    const trackElem = document.querySelector('.flight-scroll-track-container') as HTMLElement;
    const trackRect = trackElem ? trackElem.getBoundingClientRect() : { left: 0, top: 0 };

    // Busca os cards de Ecoturismo (Machu Picchu é o 1º, Banff é o 2º, e o 4º card é o logo abaixo de Machu Picchu)
    const ecoCards = document.querySelectorAll('#section-eco app-destination-card');
    const machuElem = ecoCards[0] as HTMLElement;
    const banffElem = ecoCards[1] as HTMLElement;
    const cardBelowElem = ecoCards[3] as HTMLElement;

    // Função auxiliar para obter as coordenadas reais e absolutas de repouso,
    // descontando qualquer translateY ativo da animação de scroll-reveal
    const getCardRect = (el: HTMLElement) => {
      const card = (el.querySelector('.dest-card-wrapper') || el) as HTMLElement;
      const rect = card.getBoundingClientRect();
      
      let transformY = 0;
      const style = window.getComputedStyle(el);
      const matrix = style.transform || (style as any).webkitTransform;
      if (matrix && matrix !== 'none') {
        const parts = matrix.split('(')[1]?.split(')')[0]?.split(',');
        if (parts && parts.length === 6) {
          transformY = parseFloat(parts[5]) || 0;
        }
      }
      
      return {
        left: rect.left - trackRect.left,
        right: rect.right - trackRect.left,
        top: rect.top - trackRect.top - transformY,
        bottom: rect.bottom - trackRect.top - transformY
      };
    };

    // gapX é o centro milimétrico do vão entre Machu Picchu e Banff
    let gapX = w * 0.50; // Fallback: centro da tela
    let ecoTopY = btnCommonY + 360;
    let ecoBottomY = ecoTopY + 360;
    let exitY = ecoBottomY + 23;

    if (machuElem && banffElem) {
      const machu = getCardRect(machuElem);
      const banff = getCardRect(banffElem);
      
      // Meio EXATO e absoluto do vão branco entre Machu Picchu e Banff:
      gapX = (machu.right + banff.left) / 2;
      ecoTopY = machu.top;
      ecoBottomY = machu.bottom;

      // Vão vertical real entre a 1ª fileira (Machu Picchu) e a 2ª fileira de cards
      let rowGap = 46;
      if (cardBelowElem) {
        const machuRaw = (machuElem.querySelector('.dest-card-wrapper') || machuElem) as HTMLElement;
        const belowRaw = (cardBelowElem.querySelector('.dest-card-wrapper') || cardBelowElem) as HTMLElement;
        const measuredGap = cardBelowElem.offsetTop - (machuElem.offsetTop + machuRaw.offsetHeight);
        if (measuredGap >= 20 && measuredGap <= 120) {
          rowGap = measuredGap;
        }
      }

      // Meio EXATO do vão branco entre Machu Picchu e o card de baixo:
      exitY = machu.bottom + (rowGap / 2);
    } else if (machuElem) {
      const machu = getCardRect(machuElem);
      gapX = machu.right + 10;
      ecoTopY = machu.top;
      ecoBottomY = machu.bottom;
      exitY = machu.bottom + 23;
    }

    this.ecoSectionStartY = ecoTopY;

    // 1. AJUSTE LATERAL DA DESCIDA RETA NO VÃO (X):
    // Centralizado com precisão milimétrica no vão entre Machu Picchu e Banff
    const gapShiftX = 0;
    const flightGapX = gapX + gapShiftX;

    // Altura em que o avião reaparece na direita (volta ao mundo):
    const wrapShiftY = 160;
    const wrapY = exitY + wrapShiftY;

    // Ponto onde a seção azul do feed ("Conheça mais sobre a Horizon") começa:
    // O trajeto e o avião encerram exatamente ao atingir essa seção
    const feedElem = document.querySelector('.feed-community-section') as HTMLElement;
    let feedTopY = h + 15;
    if (feedElem) {
      const feedRect = feedElem.getBoundingClientRect();
      feedTopY = feedRect.top - trackRect.top;
    }

    // Guarda posições para o sincronismo perfeito de tela
    this.flightExitY = exitY;
    this.flightWrapY = wrapY;
    this.flightMaxY = feedTopY;

    let d1 = '';
    let d2 = '';

    if (isMobile) {
      // Mobile: Curva suave, humana e não invasiva
      const pStart = { x: w * 0.82, y: 30 };
      const pBtn1 = { x: w * 0.50, y: btnCommonY };
      const pMid = { x: w * 0.32, y: (btnCommonY + btnEcoY) * 0.5 };
      const pBtn2 = { x: w * 0.50, y: btnEcoY };

      d1 = [
        `M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)}`,
        `C ${(w * 0.85).toFixed(1)} ${(btnCommonY * 0.45).toFixed(1)}, ${(w * 0.72).toFixed(1)} ${(btnCommonY * 0.80).toFixed(1)}, ${pBtn1.x.toFixed(1)} ${pBtn1.y.toFixed(1)}`,
        `C ${(w * 0.35).toFixed(1)} ${(btnCommonY + 45).toFixed(1)}, ${(w * 0.22).toFixed(1)} ${(pMid.y - 35).toFixed(1)}, ${pMid.x.toFixed(1)} ${pMid.y.toFixed(1)}`,
        `C ${(w * 0.25).toFixed(1)} ${(pMid.y + 40).toFixed(1)}, ${(w * 0.38).toFixed(1)} ${(btnEcoY - 35).toFixed(1)}, ${pBtn2.x.toFixed(1)} ${pBtn2.y.toFixed(1)}`
      ].join(' ');
      d2 = '';
    } else {
      // Desktop: Rota orgânica, elegante com curvas suaves e loop acrobático de 360°
      const startX = w * 0.86;
      const startY = 35;

      // ALTURA VERTICAL DO LOOP NA ÁREA BRANCA (SUBIDO PARA FICAR LIVRE ACIMA DO BADGE):
      const loopY = btnCommonY + 40;

      // ALTURA DO TRAÇADO ENTRE O LOOP E O CARD:
      const postLoopOffset = 18;
      const loopExitY = loopY + 40 + postLoopOffset; // = loopY + 58

      // -------------------------------------------------------------------
      // TRAJETO 1: Início superior, loop 360°, descida no vão branco e saída na esquerda
      // -------------------------------------------------------------------
      d1 = [
        // Ponto inicial elegante no lado direito
        `M ${startX.toFixed(1)} ${startY.toFixed(1)}`,

        // 1. Curva suave com leve ondulação descendo pelos Destinos Comuns
        `C ${(w * 0.95).toFixed(1)} ${(btnCommonY * 0.75).toFixed(1)}, ${(w * 0.81).toFixed(1)} ${(btnCommonY * 0.96).toFixed(1)}, ${(w * 0.865).toFixed(1)} ${(loopY - 60).toFixed(1)}`,

        // 2. Loop acrobático de 360° com entrada 100% suave (tangência colinear sem bico)
        `C ${(w * 0.890).toFixed(1)} ${(loopY - 13).toFixed(1)}, ${(w * 0.70).toFixed(1)} ${(loopY + 55).toFixed(1)}, ${(w * 0.65).toFixed(1)} ${(loopY + 15).toFixed(1)}`,
        `C ${(w * 0.60).toFixed(1)} ${(loopY - 45).toFixed(1)}, ${(w * 0.80).toFixed(1)} ${(loopY - 45).toFixed(1)}, ${(w * 0.76).toFixed(1)} ${loopExitY.toFixed(1)}`,

        // 3. Traçado equilibrado com folga de ambos os lados (longe do loop e longe do card)
        `C ${(w * 0.76).toFixed(1)} ${(loopExitY + 14).toFixed(1)}, ${(flightGapX + 30).toFixed(1)} ${(ecoTopY - 90).toFixed(1)}, ${flightGapX.toFixed(1)} ${(ecoTopY - 15).toFixed(1)}`,

        // 4. Desce em linha reta vertical (90º) dentro do vão entre Machu Picchu e Banff
        `L ${flightGapX.toFixed(1)} ${(exitY - 14).toFixed(1)}`,

        // 5. Curva suave de 90º virando para a esquerda (posicionada no vão livre)
        `C ${flightGapX.toFixed(1)} ${(exitY - 4).toFixed(1)}, ${(flightGapX - 10).toFixed(1)} ${exitY.toFixed(1)}, ${(flightGapX - 22).toFixed(1)} ${exitY.toFixed(1)}`,

        // 6. Linha reta para a esquerda até sair totalmente da tela
        `L -50 ${exitY.toFixed(1)}`
      ].join(' ');

      // -------------------------------------------------------------------
      // TRAJETO 2: Reaparece na direita e desce suave até a entrada da seção azul
      // -------------------------------------------------------------------
      const rightX = w * 0.89;
      const endY = feedTopY;
      const cp1Y = wrapY + (endY - wrapY) * 0.45;
      const cp2Y = endY - (endY - wrapY) * 0.25;

      d2 = [
        `M ${(w + 40).toFixed(1)} ${wrapY.toFixed(1)}`,
        `C ${(w * 0.92).toFixed(1)} ${cp1Y.toFixed(1)}, ${rightX.toFixed(1)} ${cp2Y.toFixed(1)}, ${rightX.toFixed(1)} ${endY.toFixed(1)}`
      ].join(' ');
    }

    this.flightTrailPathD1.set(d1);
    this.flightTrailPathD2.set(d2);

    const setupPathElements = () => {
      this.pathElement1 = document.querySelector('.flight-path-1') as SVGPathElement;
      this.pathElement2 = document.querySelector('.flight-path-2') as SVGPathElement;

      this.len1 = this.pathElement1 ? this.pathElement1.getTotalLength() || 0 : 0;
      this.len2 = this.pathElement2 ? this.pathElement2.getTotalLength() || 0 : 0;
      this.totalPathLength = this.len1 + this.len2;

      if (this.pathElement1 && this.len1 > 0) {
        this.pathElement1.style.strokeDasharray = `${this.len1} ${this.len1}`;
      }
      if (this.pathElement2 && this.len2 > 0) {
        this.pathElement2.style.strokeDasharray = `${this.len2} ${this.len2}`;
      }

      this.renderFlightPlane(this.currentProgress);
    };

    setTimeout(setupPathElements, 30);
    setTimeout(setupPathElements, 120);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      // 1. Inicializa a geometria e scroll da trilha de voo
      this.updateFlightTrailGeometry();

      // 2. Animação de entrada do card de busca
      const searchBox = document.querySelector('.flight-search-overlay');
      if (searchBox) {
        animate(searchBox, { opacity: [0, 1], y: [25, 0] }, { duration: 0.45, ease: 'easeOut' });
      }

      // 3. Animação dos cabeçalhos das seções ao entrarem em cena
      inView('.dest-section-header', (element) => {
        animate(element, { opacity: [0, 1], y: [20, 0] }, { duration: 0.5, ease: 'easeOut' });
      });

      // 4. Efeito Scroll Reveal ativado em todos os elementos e cards da página
      this.initScrollReveal();
    }, 80);

    setTimeout(() => {
      this.updateFlightTrailGeometry();
    }, 300);
  }

  initScrollReveal(): void {
    if (typeof window === 'undefined') return;
    this.checkScrollReveal();
  }

  checkScrollReveal(): void {
    if (typeof window === 'undefined') return;
    const windowH = window.innerHeight;
    const elements = document.querySelectorAll('.scroll-reveal:not(.is-revealed)');
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= windowH * 0.88 && rect.bottom >= 0) {
        el.classList.add('is-revealed');
      }
    });
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
          this.updateFlightTrailGeometry();
          this.initScrollReveal();
        }, 80);
        setTimeout(() => {
          this.updateFlightTrailGeometry();
        }, 300);
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

  loadFeedPosts(): void {
    this.isLoadingFeed.set(true);
    this.feedService.getPosts(true).subscribe({
      next: (data) => {
        const list = (data || []).filter(p => p.published !== false && p.postType !== 'TRIVIA' && p.postType !== 'THIS_OR_THAT');
        this.feedPosts.set(this.prepareSixPosts(list));
        this.isLoadingFeed.set(false);
      },
      error: () => {
        this.feedPosts.set(this.prepareSixPosts([]));
        this.isLoadingFeed.set(false);
      }
    });
  }

  private prepareSixPosts(backendList: Post[]): Post[] {
    const defaultArticles: Post[] = [
      {
        id: 102,
        title: 'O encanto das águas cristalinas de Noronha',
        caption: 'Mergulho na Baía dos Porcos e no Sancho com tartarugas marinhas e raias em um dos cenários mais preservados do planeta.',
        imageUrl: 'assets/feed/id102-1.webp',
        likesCount: 2418,
        dislikesCount: 24,
        postType: 'ARTICLE'
      },
      {
        id: 103,
        title: 'Segredos da Chapada: O lendário Vale do Pati',
        caption: 'Serras tabulares, quedas d\'água misteriosas e a hospitalidade inesquecível dos nativos sob um céu apinhado de estrelas.',
        imageUrl: 'assets/feed/id103-1.webp',
        likesCount: 1842,
        dislikesCount: 15,
        postType: 'ARTICLE'
      },
      {
        id: 105,
        title: 'Cores, aromas e histórias nos labirintos de Marrakech',
        caption: 'Mosaicos geométricos zellij, aromas adocicados de especiarias e a atmosfera fascinante da lendária praça Jemaa el-Fna.',
        imageUrl: 'assets/feed/id105-1.webp',
        likesCount: 3150,
        dislikesCount: 36,
        postType: 'ARTICLE'
      },
      {
        id: 107,
        title: 'Lagoas de água doce entre o mar de dunas dos Lençóis',
        caption: 'Um deserto imenso de areia alvíssima pontilhado por lagoas cristalinas de água doce sob o sol do Maranhão.',
        imageUrl: 'assets/feed/id107-1.webp',
        likesCount: 1980,
        dislikesCount: 18,
        postType: 'ARTICLE'
      },
      {
        id: 110,
        title: 'Glaciares milenares e ventos bravos da Patagônia',
        caption: 'Diante do colossal Perito Moreno, o estrondo do gelo caindo nas águas do Lago Argentino é pura poesia selvagem.',
        imageUrl: 'assets/feed/id110-1.webp',
        likesCount: 2740,
        dislikesCount: 29,
        postType: 'ARTICLE'
      },
      {
        id: 116,
        title: 'Colinas douradas e vinhedos seculares na Toscana',
        caption: 'Vilarejos medievais de pedra, estradinhas cercadas de ciprestes e pores do sol inesquecíveis que tingem os campos de terracota.',
        imageUrl: 'assets/feed/id116-1.webp',
        likesCount: 2210,
        dislikesCount: 12,
        postType: 'ARTICLE'
      }
    ];

    const result: Post[] = [];
    const usedIds = new Set<number>();

    for (const post of backendList) {
      if (result.length >= 6) break;
      result.push({
        ...post,
        likesCount: post.likesCount ?? 0,
        dislikesCount: post.dislikesCount ?? 0,
        imageUrl: post.imageUrl || `assets/feed/id${post.id}-1.webp`
      });
      usedIds.add(post.id);
    }

    if (result.length < 6) {
      for (const fallback of defaultArticles) {
        if (result.length >= 6) break;
        if (!usedIds.has(fallback.id)) {
          result.push(fallback);
          usedIds.add(fallback.id);
        }
      }
    }

    return result.slice(0, 6);
  }

  getPostLocation(post: Post): string {
    if (post.destinationId) {
      const dest = this.destinations().find(d => d.id === post.destinationId);
      if (dest) {
        return dest.city ? `${dest.city}, ${dest.country}` : dest.name;
      }
    }
    const text = ((post.title || '') + ' ' + (post.caption || '')).toLowerCase();
    if (text.includes('noronha')) return 'Fernando de Noronha, Brasil';
    if (text.includes('chapada') || text.includes('vale do pati')) return 'Chapada Diamantina, Brasil';
    if (text.includes('marrakech')) return 'Marrakech, Marrocos';
    if (text.includes('paris')) return 'Paris, França';
    if (text.includes('lençóis') || text.includes('lencois')) return 'Lençóis Maranhenses, Brasil';
    if (text.includes('patagônia') || text.includes('patagonia')) return 'Patagônia, Argentina';
    if (text.includes('toscana')) return 'Toscana, Itália';
    if (text.includes('galápagos') || text.includes('galapagos')) return 'Galápagos, Equador';
    if (text.includes('pantanal')) return 'Pantanal, Brasil';
    if (text.includes('amazônia') || text.includes('amazonia')) return 'Floresta Amazônica, Brasil';
    if (text.includes('kyoto') || text.includes('quioto')) return 'Quioto, Japão';
    if (text.includes('banff')) return 'Banff, Canadá';
    if (text.includes('atacama')) return 'Deserto do Atacama, Chile';
    if (text.includes('tromsø') || text.includes('tromso')) return 'Tromsø, Noruega';
    if (text.includes('capadócia') || text.includes('capadocia')) return 'Capadócia, Turquia';
    if (text.includes('bonito')) return 'Bonito, Brasil';
    if (text.includes('gramado')) return 'Gramado, Brasil';
    if (text.includes('paraty')) return 'Paraty, Brasil';
    if (text.includes('trancoso') || text.includes('caraíva')) return 'Trancoso, Brasil';
    if (text.includes('jalapão') || text.includes('jalapao')) return 'Jalapão, Brasil';
    if (text.includes('iguaçu') || text.includes('iguacu')) return 'Foz do Iguaçu, Brasil';
    if (text.includes('xingó') || text.includes('xingo')) return 'Cânions de Xingó, Brasil';
    if (text.includes('monte verde')) return 'Monte Verde, Brasil';
    if (text.includes('machu picchu') || text.includes('incas')) return 'Vale Sagrado, Peru';
    if (text.includes('dolomitas')) return 'Dolomitas, Itália';
    if (text.includes('antártica') || text.includes('antartica')) return 'Península Antártica';

    if (post.attributes && post.attributes.length > 0) {
      const attr = post.attributes[0].attributeName;
      return attr.charAt(0).toUpperCase() + attr.slice(1).toLowerCase();
    }
    return 'Comunidade Horizon';
  }

  getPostImages(post: Post): string[] {
    if (post.galleryImages && post.galleryImages.length > 0) {
      return post.galleryImages;
    }
    const hasLocalArticleGallery =
      post.id === 8 ||
      (post.id >= 17 && post.id <= 20) ||
      (post.id >= 101 && post.id <= 125);

    if (hasLocalArticleGallery) {
      return [1, 2, 3].map(index => `assets/feed/id${post.id}-${index}.webp`);
    }

    return post.imageUrl ? [post.imageUrl] : ['assets/Horizon 1.webp'];
  }

  onFeedMouseDown(event: MouseEvent, postId: number, trackEl: HTMLElement): void {
    this.isDraggingFeedPhoto[postId] = true;
    this.feedDragStartX[postId] = event.pageX - trackEl.offsetLeft;
    this.feedScrollLeftPos[postId] = trackEl.scrollLeft;
  }

  onFeedMouseMove(event: MouseEvent, postId: number, trackEl: HTMLElement): void {
    if (!this.isDraggingFeedPhoto[postId]) return;
    event.preventDefault();
    const x = event.pageX - trackEl.offsetLeft;
    const walk = (x - this.feedDragStartX[postId]) * 1.5;
    trackEl.scrollLeft = this.feedScrollLeftPos[postId] - walk;
  }

  onFeedMouseUp(postId: number, trackEl: HTMLElement): void {
    if (this.isDraggingFeedPhoto[postId]) {
      this.isDraggingFeedPhoto[postId] = false;
      const slideWidth = trackEl.clientWidth;
      if (slideWidth > 0) {
        const targetIndex = Math.round(trackEl.scrollLeft / slideWidth);
        trackEl.scrollTo({ left: targetIndex * slideWidth, behavior: 'smooth' });
        this.activeFeedImageIndex.update(m => ({ ...m, [postId]: targetIndex }));
      }
    }
  }

  onFeedScroll(postId: number, trackEl: HTMLElement): void {
    if (this.isDraggingFeedPhoto[postId]) return;
    const slideWidth = trackEl.clientWidth;
    if (slideWidth > 0) {
      const idx = Math.round(trackEl.scrollLeft / slideWidth);
      if ((this.activeFeedImageIndex()[postId] ?? 0) !== idx) {
        this.activeFeedImageIndex.update(m => ({ ...m, [postId]: idx }));
      }
    }
  }

  cycleFeedPhoto(postId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.activeFeedImageIndex.update(m => {
      const current = m[postId] ?? 0;
      return { ...m, [postId]: (current + 1) % 3 };
    });
  }

  selectFeedPhoto(postId: number, index: number, event: Event): void {
    event.stopPropagation();
    this.activeFeedImageIndex.update(m => ({ ...m, [postId]: index }));
  }

  getStackPosition(postId: number, imgIndex: number): number {
    const active = this.activeFeedImageIndex()[postId] ?? 0;
    return (imgIndex - active + 3) % 3;
  }

  goToFeedSlide(postId: number, index: number, event: Event, trackEl: HTMLElement): void {
    event.stopPropagation();
    trackEl.scrollTo({ left: index * trackEl.clientWidth, behavior: 'smooth' });
    this.activeFeedImageIndex.update(m => ({ ...m, [postId]: index }));
  }

  getPostImage(post: Post): string {
    if (post.imageUrl && !post.imageUrl.includes('placeholder')) {
      return post.imageUrl;
    }
    if (post.id) {
      return `assets/feed/id${post.id}-1.webp`;
    }
    return 'assets/Horizon 1.webp';
  }

  handleFeedImageError(event: any, post: Post): void {
    if (event?.target) {
      if (post.id && !event.target.src.includes(`id${post.id}-1.webp`)) {
        event.target.src = `assets/feed/id${post.id}-1.webp`;
      } else {
        event.target.src = 'assets/Horizon 1.webp';
      }
    }
  }

  getPostDate(post: Post): string {
    if (post.createdAt) {
      try {
        const d = new Date(post.createdAt);
        if (!isNaN(d.getTime())) {
          return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
        }
      } catch {}
    }
    return 'Comunidade Horizon';
  }

  getPostShortText(post: Post): string {
    const cap = post.caption || '';
    if (cap.length <= 110) return cap;
    return cap.slice(0, 105).trim() + '...';
  }
}
