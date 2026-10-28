import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { QuizService } from '../services/quiz.service';
import { Quiz, SubmitQuizRequest, AnswerOption } from '../models/quiz.model';
import { AuthService } from '../../../core/auth/services/auth.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { TravelerIdentityService } from '../../recommendations/services/traveler-identity.service';
import { TravelerIdentityState } from '../../recommendations/models/traveler-identity.model';
import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';
import { BackToTopComponent } from '../../../shared/components/back-to-top/back-to-top.component';
import { FeedbackModalComponent } from '../../../shared/components/feedback-modal/feedback-modal.component';

interface OptionVisual {
  image: string;
  icon: string;
  subtitle: string;
  tag: string;
}

interface BudgetTier {
  id: string;
  name: string;
  value: number;
  subtitle: string;
  icon: string;
  badge: string;
}

@Component({
  selector: 'app-quiz-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, PlaneLoaderComponent, BackToTopComponent, FeedbackModalComponent],
  templateUrl: './quiz-flow.component.html',
  styleUrl: './quiz-flow.component.scss'
})
export class QuizFlowComponent implements OnInit {
  private quizService = inject(QuizService);
  private tokenStorage = inject(TokenStorageService);
  private identityService = inject(TravelerIdentityService);
  private authService = inject(AuthService);
  private router = inject(Router);

  showGuestAuthModal = signal(false);
  quiz = signal<Quiz | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  submitErrorMessage = signal<string | null>(null);
  isSubmitted = signal(false);
  identityData = signal<TravelerIdentityState | null>(null);
  isCsatModalOpen = signal(false);
  hasSubmittedQuizCsat = signal(false);

  // Navegação Wizard
  currentStep = signal(0);
  selectedAnswers = signal<Record<number, number | number[]>>({});

  // Orçamento e Passaporte
  budget = signal<number | null>(15000);
  budgetError = signal<string | null>(null);
  hasPassport = signal<boolean>(true);

  // Múltiplas Experiências e Ritmo
  experienceCardIndex = signal<number>(0);
  selectedExperienceIds = signal<number[]>([]);
  completedMultiSteps = signal<Set<number>>(new Set());

  // Visualização do Perfil / DNA
  profileViewMode = signal<'bars' | 'compass'>('bars');
  isMobileDnaSheetOpen = signal<boolean>(false);

  // Overlays Indicativos / Telas Pretas Explicativas
  hideAllInstructionOverlays = signal<boolean>(false);
  dismissedOverlaySteps = signal<Set<number>>(new Set());
  dontShowInstructionsAgain = signal<boolean>(false);

  // Swipe State
  showSwipeTutorial = signal<boolean>(true);
  topCardIndex = signal<number>(0);
  isDragging = signal<boolean>(false);
  dragStartX = signal<number>(0);
  dragCurrentX = signal<number>(0);
  isCardTransitioning = signal(false);

  get dragDeltaX() {
    return this.isDragging() ? this.dragCurrentX() - this.dragStartX() : 0;
  }

  isExperienceStep = computed(() => {
    const questions = this.quiz()?.questions || [];
    const step = this.currentStep();
    if (step >= questions.length) return false;
    const q = questions[step];
    if (!q) return false;
    const text = q.text.toLowerCase();
    return text.includes('experiência') || text.includes('procura') || text.includes('ritmo') || step === 2 || step === 3;
  });

  currentExperienceCard = computed(() => {
    const questions = this.quiz()?.questions || [];
    if (!this.isExperienceStep()) return null;
    const q = questions[this.currentStep()];
    if (!q || !q.answers) return null;
    const idx = this.experienceCardIndex();
    return q.answers[idx] || null;
  });

  currentStepSelectedIds = computed(() => {
    const questions = this.quiz()?.questions || [];
    const step = this.currentStep();
    if (step >= questions.length) return [];
    const q = questions[step];
    if (!q) return [];
    const val = this.selectedAnswers()[q.id];
    return Array.isArray(val) ? val : [];
  });

  currentStepTitle = computed(() => {
    const step = this.currentStep();
    const qList = this.quiz()?.questions || [];
    if (step >= qList.length) return 'Orçamento e Passaporte';
    const q = qList[step];
    if (!q) return 'Pergunta';
    const text = q.text.toLowerCase();
    if (text.includes('estilo')) return 'Estilo';
    if (text.includes('clima')) return 'Clima';
    if (text.includes('experiência') || text.includes('procura')) return 'Experiência';
    if (text.includes('ritmo')) return 'Ritmo';
    if (text.includes('atmosfera')) return 'Atmosfera';
    return q.text;
  });

  shouldShowStepOverlay = computed(() => {
    if (this.hideAllInstructionOverlays()) return false;
    if (this.isLoading() || this.errorMessage() || this.isSubmitted()) return false;
    const step = this.currentStep();
    if (step === 0) return false;
    if (step === 2) {
      return !this.dismissedOverlaySteps().has(step);
    }
    return false;
  });

  currentStepOverlayData = computed(() => {
    const step = this.currentStep();
    const qList = this.quiz()?.questions || [];
    const totalQ = qList.length;

    if (step >= totalQ) {
      return {
        badge: 'Planejamento e passaporte',
        title: 'Investimento e documentos',
        description: 'Defina o investimento por pessoa e ative a chave de passaporte se você possui documento válido para viagens internacionais.',
        buttonText: 'Definir orçamento',
        icon: 'bi-cash-coin',
        isMulti: false
      };
    }

    const q = qList[step];
    const text = q ? q.text.toLowerCase() : '';
    const isMulti = text.includes('experiência') || text.includes('procura') || text.includes('ritmo') || step === 2 || step === 3;

    if (isMulti) {
      return {
        badge: 'Múltipla escolha',
        title: 'Você pode escolher várias opções',
        description: 'Avalie cada cartão com calma: arraste para a direita se combina com você, ou para a esquerda para passar.',
        buttonText: 'Entendi, vamos lá',
        icon: 'bi-stack',
        isMulti: true
      };
    } else {
      return {
        badge: 'Escolha única',
        title: 'Selecione sua preferência principal',
        description: 'Nesta etapa, escolha apenas 1 opção principal. Você pode navegar entre os cartões pelas setas e confirmar a sua favorita.',
        buttonText: 'Começar escolha',
        icon: 'bi-hand-index-thumb',
        isMulti: false
      };
    }
  });

  dismissCurrentStepOverlay(): void {
    if (this.dontShowInstructionsAgain()) {
      this.hideAllInstructionOverlays.set(true);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('horizon_quiz_hide_instructions', 'true');
      }
    }
    this.dismissedOverlaySteps.update(set => new Set(set).add(this.currentStep()));
  }

  toggleDontShowAgain(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dontShowInstructionsAgain.set(input.checked);
  }

  // Tiers de Orçamento
  readonly budgetTiers: BudgetTier[] = [
    {
      id: 'eco',
      name: 'Mochileiro Autêntico',
      value: 5000,
      subtitle: 'Roteiros enxutos, hostels premiados e experiências locais',
      icon: '🎒',
      badge: 'Econômico'
    },
    {
      id: 'comfort',
      name: 'Viajante Conforto',
      value: 15000,
      subtitle: 'Hotéis 3-4 estrelas, voos diretos e gastronomia rica',
      icon: '✈️',
      badge: 'Mais Escolhido'
    },
    {
      id: 'premium',
      name: 'Experiência Premium',
      value: 50000,
      subtitle: 'Resorts 5 estrelas, passeios privativos e alta gastronomia',
      icon: '🌟',
      badge: 'Sofisticação'
    },
    {
      id: 'luxury',
      name: 'Horizon Exclusive',
      value: 200000,
      subtitle: 'Primeira classe, ilhas e vilas privativas com concierge',
      icon: '👑',
      badge: 'Ultra Luxo'
    }
  ];

  // Visual das Opções
  visualMap: Record<string, OptionVisual> = {
    'ecoturismo': {
      image: 'assets/ecoturismo.webp',
      icon: '🌿',
      subtitle: 'Florestas, trilhas, cachoeiras e conexão pura com a natureza.',
      tag: 'Biofilia e Aventura'
    },
    'viagem tradicional': {
      image: 'assets/urban.webp',
      icon: '🏙️',
      subtitle: 'Grandes metrópoles, compras, museus e arquitetura mundial.',
      tag: 'Urbano e Metrópoles'
    },
    'sol e calor': {
      image: 'assets/sol.webp',
      icon: '☀️',
      subtitle: 'Praias paradisíacas, piscinas naturais e clima tropical radiante.',
      tag: 'Verão Tropical'
    },
    'sol': {
      image: 'assets/sol.webp',
      icon: '☀️',
      subtitle: 'Praias paradisíacas, piscinas naturais e clima tropical radiante.',
      tag: 'Verão Tropical'
    },
    'neve e frio': {
      image: 'assets/cold.webp',
      icon: '❄️',
      subtitle: 'Picos nevados, estações de esqui, chalés e aconchego alpino.',
      tag: 'Inverno Alpino'
    },
    'neve': {
      image: 'assets/cold.webp',
      icon: '❄️',
      subtitle: 'Picos nevados, estações de esqui, chalés e aconchego alpino.',
      tag: 'Inverno Alpino'
    },
    'clima ameno e fresco': {
      image: 'assets/ameno.webp',
      icon: '🍂',
      subtitle: 'Névoa suave, bosques outonais e caminhadas confortáveis.',
      tag: 'Ameno e Equilibrado'
    },
    'ameno': {
      image: 'assets/ameno.webp',
      icon: '🍂',
      subtitle: 'Névoa suave, bosques outonais e caminhadas confortáveis.',
      tag: 'Ameno e Equilibrado'
    },
    'qualquer clima': {
      image: 'assets/random.webp',
      icon: '🌍',
      subtitle: 'Espírito livre: para quem viaja pela experiência e cultura.',
      tag: 'Aberto ao Mundo'
    },
    'qualquer': {
      image: 'assets/random.webp',
      icon: '🌍',
      subtitle: 'Espírito livre: para quem viaja pela experiência e cultura.',
      tag: 'Aberto ao Mundo'
    },
    'natureza e vida selvagem': {
      image: 'assets/pantanal.webp',
      icon: '🦁',
      subtitle: 'Safáris, observação de animais e santuários ecológicos.',
      tag: 'Vida Selvagem'
    },
    'vida selvagem': {
      image: 'assets/pantanal.webp',
      icon: '🦁',
      subtitle: 'Safáris, observação de animais e santuários ecológicos.',
      tag: 'Vida Selvagem'
    },
    'cultura e história': {
      image: 'assets/machu-picchu.webp',
      icon: '🏛️',
      subtitle: 'Ruínas ancestrais, cidades históricas, castelos e tradições.',
      tag: 'Patrimônio Histórico'
    },
    'cultura': {
      image: 'assets/machu-picchu.webp',
      icon: '🏛️',
      subtitle: 'Ruínas ancestrais, cidades históricas, castelos e tradições.',
      tag: 'Patrimônio Histórico'
    },
    'gastronomia e vida urbana': {
      image: 'assets/food.webp',
      icon: '🍷',
      subtitle: 'Bistrôs conceituados, mercados locais e alta gastronomia.',
      tag: 'Alta Gastronomia'
    },
    'gastronomia': {
      image: 'assets/food.webp',
      icon: '🍷',
      subtitle: 'Bistrôs conceituados, mercados locais e alta gastronomia.',
      tag: 'Alta Gastronomia'
    },
    'aventura': {
      image: 'assets/chapada-diamantina.webp',
      icon: '🧗',
      subtitle: 'Trilhas íngremes, montanhismo e adrenalina em paisagens épicas.',
      tag: 'Adrenalina Pura'
    },
    'desconexão e descanso': {
      image: 'assets/maldivas.webp',
      icon: '🏖️',
      subtitle: 'Paz absoluta, praias calmas, resorts e momentos de descanso pleno.',
      tag: 'Descanso e Praia'
    },
    'desconexão': {
      image: 'assets/maldivas.webp',
      icon: '🏖️',
      subtitle: 'Paz absoluta, praias calmas, resorts e momentos de descanso pleno.',
      tag: 'Descanso e Praia'
    },
    'explorador de atrações': {
      image: 'assets/roma.webp',
      icon: '🏛️',
      subtitle: 'Explorar cada esquina, monumentos históricos, museus e bairros icônicos.',
      tag: 'História e Cidade'
    },
    'explorador': {
      image: 'assets/roma.webp',
      icon: '🏛️',
      subtitle: 'Explorar cada esquina, monumentos históricos, museus e bairros icônicos.',
      tag: 'História e Cidade'
    },
    'vida noturna e agito': {
      image: 'assets/las-vegas.webp',
      icon: '🌃',
      subtitle: 'Bares vibrantes, rooftops, eventos culturais e a energia da noite.',
      tag: 'Noite e Agito Urbano'
    },
    'vida noturna': {
      image: 'assets/las-vegas.webp',
      icon: '🌃',
      subtitle: 'Bares vibrantes, rooftops, eventos culturais e a energia da noite.',
      tag: 'Noite e Agito Urbano'
    },
    'mergulho e vida marinha': {
      image: 'assets/noronha.webp',
      icon: '🤿',
      subtitle: 'Mergulho em águas cristalinas, corais protegidos e vida marinha pura.',
      tag: 'Mergulho e Mar'
    },
    'mergulho': {
      image: 'assets/noronha.webp',
      icon: '🤿',
      subtitle: 'Mergulho em águas cristalinas, corais protegidos e vida marinha pura.',
      tag: 'Mergulho e Mar'
    },
    'romântica a dois': {
      image: 'assets/paris.webp',
      icon: '✨',
      subtitle: 'Cenários inesquecíveis, jantares à luz de velas e clima romântico.',
      tag: 'Romance e Charme'
    },
    'romântica': {
      image: 'assets/paris.webp',
      icon: '✨',
      subtitle: 'Cenários inesquecíveis, jantares à luz de velas e clima romântico.',
      tag: 'Romance e Charme'
    },
    'exclusiva e sofisticada': {
      image: 'assets/dubai.webp',
      icon: '👑',
      subtitle: 'Hospitalidade de alto nível, conforto extremo e experiências exclusivas.',
      tag: 'Luxo e Conforto'
    },
    'exclusiva': {
      image: 'assets/dubai.webp',
      icon: '👑',
      subtitle: 'Hospitalidade de alto nível, conforto extremo e experiências exclusivas.',
      tag: 'Luxo e Conforto'
    },
    'natureza autêntica': {
      image: 'assets/amazonia.webp',
      icon: '🌿',
      subtitle: 'Imersão profunda na floresta, fauna nativa e ecossistemas intocados.',
      tag: 'Ecoturismo Raiz'
    },
    'grandes metrópoles': {
      image: 'assets/nova-york.webp',
      icon: '🏙️',
      subtitle: 'Arranha-céus imponentes, compras, gastronomia global e vida moderna.',
      tag: 'Grandes Metrópoles'
    }
  };

  // Computeds de Progresso
  totalSteps = computed(() => {
    const qCount = this.quiz()?.questions?.length || 0;
    return qCount > 0 ? qCount + 1 : 0;
  });

  progressPercentage = computed(() => {
    const total = this.totalSteps();
    if (total === 0) return 0;
    return Math.min(100, Math.round(((this.currentStep() + 1) / total) * 100));
  });

  // ========================================================
  // DNA DO VIAJANTE EM TEMPO REAL ("Seu perfil até aqui")
  // ========================================================
  hoveredRadarKey = signal<string | null>(null);

  readonly radarAxes = [
    { label: 'Praia', angle: -Math.PI / 2, key: 'praia', textX: 150, textY: 34, pctY: 46, anchor: 'middle', lineX: 150, lineY: 55 },
    { label: 'Natureza', angle: -Math.PI / 6, key: 'natureza', textX: 228, textY: 88, pctY: 100, anchor: 'start', lineX: 215, lineY: 92.5 },
    { label: 'Aventura', angle: Math.PI / 6, key: 'aventura', textX: 228, textY: 172, pctY: 184, anchor: 'start', lineX: 215, lineY: 167.5 },
    { label: 'Cidades', angle: Math.PI / 2, key: 'cidade', textX: 150, textY: 226, pctY: 238, anchor: 'middle', lineX: 150, lineY: 205 },
    { label: 'Cultura', angle: (5 * Math.PI) / 6, key: 'cultura', textX: 72, textY: 172, pctY: 184, anchor: 'end', lineX: 85, lineY: 167.5 },
    { label: 'Descanso', angle: (-5 * Math.PI) / 6, key: 'relaxamento', textX: 72, textY: 88, pctY: 100, anchor: 'end', lineX: 85, lineY: 92.5 }
  ];

  dnaProfileValues = computed(() => {
    const answers = this.selectedAnswers();
    const qList = this.quiz()?.questions || [];
    const b = this.budget() || 15000;
    const step = this.currentStep();
    const topIdx = this.topCardIndex();

    let natureza = 0.50;
    let cultura = 0.50;
    let praia = 0.50;
    let aventura = 0.50;
    let cidade = 0.50;
    let relaxamento = 0.50;
    let frio = 0.50;

    // Helper para obter textos das respostas de cada pergunta
    const getAnswerTexts = (qIdx: number): { texts: string[]; isPreview: boolean } => {
      const q = qList[qIdx];
      if (!q) return { texts: [], isPreview: false };
      const val = answers[q.id];
      if (Array.isArray(val) && val.length > 0) {
        return {
          texts: q.answers.filter(a => val.includes(a.id)).map(a => a.text.toLowerCase()),
          isPreview: false
        };
      }
      if (typeof val === 'number') {
        const found = q.answers.find(a => a.id === val);
        return { texts: found ? [found.text.toLowerCase()] : [], isPreview: false };
      }
      if (step === qIdx && q.answers && q.answers.length > 0) {
        const topCard = q.answers[topIdx % q.answers.length];
        return { texts: topCard ? [topCard.text.toLowerCase()] : [], isPreview: true };
      }
      return { texts: [], isPreview: false };
    };

    // Q0 - Estilo (Ecoturismo vs Viagem Tradicional)
    const { texts: q0Texts, isPreview: q0Prev } = getAnswerTexts(0);
    for (const t of q0Texts) {
      if (t.includes('eco')) {
        natureza = q0Prev ? 0.78 : 0.92;
        aventura = Math.max(aventura, q0Prev ? 0.65 : 0.72);
        cidade = q0Prev ? 0.35 : 0.25;
      } else if (t.includes('tradicional')) {
        cidade = q0Prev ? 0.74 : 0.84;
        cultura = Math.max(cultura, q0Prev ? 0.68 : 0.75);
        natureza = q0Prev ? 0.35 : 0.25;
      }
    }

    // Q1 - Clima (Sol, Neve, Ameno, Qualquer)
    const { texts: q1Texts, isPreview: q1Prev } = getAnswerTexts(1);
    for (const t of q1Texts) {
      if (t.includes('sol') || t.includes('calor')) {
        praia = q1Prev ? 0.82 : 0.94;
        relaxamento = Math.max(relaxamento, 0.65);
      } else if (t.includes('neve') || t.includes('frio')) {
        frio = q1Prev ? 0.85 : 0.95;
        relaxamento = Math.max(relaxamento, 0.65);
      } else if (t.includes('ameno')) {
        relaxamento = Math.max(relaxamento, 0.75);
      }
    }

    // Q2 - Experiências (Natureza, Cultura, Gastronomia, Aventura)
    const { texts: q2Texts } = getAnswerTexts(2);
    for (const t of q2Texts) {
      if (t.includes('natureza') || t.includes('selvagem')) {
        natureza = 0.98;
        aventura = Math.max(aventura, 0.78);
      }
      if (t.includes('cultura') || t.includes('história')) {
        cultura = 0.98;
      }
      if (t.includes('gastronomia') || t.includes('urbana')) {
        cidade = 0.98;
        cultura = Math.max(cultura, 0.85);
      }
      if (t.includes('aventura')) {
        aventura = 0.98;
      }
    }

    // Q3 - Ritmo (Desconexão, Explorador, Vida Noturna, Mergulho)
    const { texts: q3Texts } = getAnswerTexts(3);
    for (const t of q3Texts) {
      if (t.includes('desconexão') || t.includes('descanso')) {
        relaxamento = 0.98;
        praia = Math.max(praia, 0.75);
      }
      if (t.includes('explorador')) {
        cultura = Math.max(cultura, 0.92);
        cidade = Math.max(cidade, 0.75);
      }
      if (t.includes('vida noturna') || t.includes('agito')) {
        cidade = Math.max(cidade, 0.92);
      }
      if (t.includes('mergulho')) {
        natureza = Math.max(natureza, 0.92);
        aventura = Math.max(aventura, 0.88);
        praia = Math.max(praia, 0.85);
      }
    }

    // Q4 - Atmosfera (Romântica, Exclusiva, Natureza Autêntica, Grandes Metrópoles)
    const { texts: q4Texts, isPreview: q4Prev } = getAnswerTexts(4);
    for (const t of q4Texts) {
      if (t.includes('romântica')) {
        relaxamento = Math.max(relaxamento, q4Prev ? 0.78 : 0.88);
        cultura = Math.max(cultura, 0.70);
      } else if (t.includes('exclusiva')) {
        relaxamento = Math.max(relaxamento, 0.85);
      } else if (t.includes('autêntica') || t.includes('natureza')) {
        natureza = Math.max(natureza, q4Prev ? 0.88 : 0.98);
        aventura = Math.max(aventura, 0.80);
      } else if (t.includes('metrópoles')) {
        cidade = Math.max(cidade, q4Prev ? 0.88 : 0.98);
      }
    }

    // Orçamento -> Escala logarítmica proporcional contínua
    const clampedBudget = Math.max(1000, Math.min(200000, b));
    const minLog = Math.log(1000);
    const maxLog = Math.log(200000);
    const ratio = (Math.log(clampedBudget) - minLog) / (maxLog - minLog);
    const orcamento = 0.25 + 0.70 * ratio;

    return { natureza, cultura, praia, aventura, cidade, relaxamento, frio, orcamento, calma: relaxamento };
  });

  // Alias para compatibilidade
  radarProfileValues = this.dnaProfileValues;

  // Arquétipo Dominante em Tempo Real
  dominantArchetype = computed(() => {
    const vals = this.dnaProfileValues();
    const list = [
      { name: 'Explorador da Natureza', key: 'natureza', val: vals.natureza, icon: 'bi-tree-fill' },
      { name: 'Viajante Cultural', key: 'cultura', val: vals.cultura, icon: 'bi-bank' },
      { name: 'Amante do Litoral', key: 'praia', val: vals.praia, icon: 'bi-sun-fill' },
      { name: 'Buscador de Aventura', key: 'aventura', val: vals.aventura, icon: 'bi-compass' },
      { name: 'Urbano e Metrópoles', key: 'cidade', val: vals.cidade, icon: 'bi-buildings-fill' },
      { name: 'Mente Zen e Descanso', key: 'relaxamento', val: vals.relaxamento, icon: 'bi-cup-hot-fill' }
    ];
    list.sort((a, b) => b.val - a.val);
    return list[0];
  });

  // Medidores DNA de Afinidade (Opção A)
  dnaTraitBars = computed(() => {
    const vals = this.dnaProfileValues();
    return [
      { label: 'Natureza', key: 'natureza', icon: 'bi-tree-fill', pct: Math.round(vals.natureza * 100) },
      { label: 'Cultura', key: 'cultura', icon: 'bi-bank', pct: Math.round(vals.cultura * 100) },
      { label: 'Praia e Sol', key: 'praia', icon: 'bi-sun-fill', pct: Math.round(vals.praia * 100) },
      { label: 'Aventura', key: 'aventura', icon: 'bi-compass', pct: Math.round(vals.aventura * 100) },
      { label: 'Grandes Cidades', key: 'cidade', icon: 'bi-buildings-fill', pct: Math.round(vals.cidade * 100) },
      { label: 'Descanso e Spa', key: 'relaxamento', icon: 'bi-cup-hot-fill', pct: Math.round(vals.relaxamento * 100) }
    ];
  });

  // Geometria da Bússola Polar Minimalista (Opção B)
  radarPolygonPoints = computed(() => {
    const vals = this.dnaProfileValues();
    const cx = 150;
    const cy = 130;
    const r = 75;

    return this.radarAxes.map(axis => {
      const val = (vals as any)[axis.key] || 0.5;
      const x = cx + r * val * Math.cos(axis.angle);
      const y = cy + r * val * Math.sin(axis.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });

  radarInnerPolygonPoints = computed(() => {
    const vals = this.dnaProfileValues();
    const cx = 150;
    const cy = 130;
    const r = 75;

    return this.radarAxes.map(axis => {
      const val = ((vals as any)[axis.key] || 0.5) * 0.55;
      const x = cx + r * val * Math.cos(axis.angle);
      const y = cy + r * val * Math.sin(axis.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  });

  radarAxisPercent(key: string): number {
    const vals = this.dnaProfileValues() as Record<string, number>;
    const val = vals[key] ?? 0.5;
    return Math.round(val * 100);
  }

  radarVertexDots = computed(() => {
    const vals = this.dnaProfileValues();
    const cx = 150;
    const cy = 130;
    const r = 75;

    return this.radarAxes.map(axis => {
      const val = (vals as any)[axis.key] || 0.5;
      return {
        key: axis.key,
        label: axis.label,
        val,
        pct: Math.round(val * 100),
        isHigh: val >= 0.70,
        x: cx + r * val * Math.cos(axis.angle),
        y: cy + r * val * Math.sin(axis.angle)
      };
    });
  });

  // Afinidades do Perfil Final
  displayAffinities = computed(() => {
    const vals = this.dnaProfileValues();
    const list = [
      { label: 'Ecoturismo e Natureza', pct: Math.round(vals.natureza * 100) },
      { label: 'Cultura e História', pct: Math.round(vals.cultura * 100) },
      { label: 'Sol e Litoral', pct: Math.round(vals.praia * 100) },
      { label: 'Aventura e Montanha', pct: Math.round(vals.aventura * 100) },
      { label: 'Grandes Cidades', pct: Math.round(vals.cidade * 100) },
      { label: 'Descanso e Spa', pct: Math.round(vals.relaxamento * 100) }
    ];
    return list.sort((a, b) => b.pct - a.pct).slice(0, 3);
  });

  isEcoQuizChoice(): boolean {
    const affinities = this.displayAffinities();
    const vals = this.dnaProfileValues();

    // 1. Se a principal afinidade exibida no título for Ecoturismo/Natureza ou Aventura/Montanha
    if (affinities.length > 0) {
      const topLabel = affinities[0].label.toLowerCase();
      if (topLabel.includes('eco') || topLabel.includes('natureza') || topLabel.includes('aventura') || topLabel.includes('montanha')) {
        return true;
      }
    }

    // 3. Se escolheu explicitamente Ecoturismo na pergunta de Estilo
    const qList = this.quiz()?.questions || [];
    const estiloQ = qList.find(q => q.text.toLowerCase().includes('estilo')) || qList[0];
    if (estiloQ) {
      const aVal = this.selectedAnswers()[estiloQ.id];
      const aId = typeof aVal === 'number' ? aVal : (Array.isArray(aVal) ? aVal[0] : null);
      if (aId) {
        const ans = estiloQ.answers.find(a => a.id === aId);
        if (ans && ans.text.toLowerCase().includes('eco')) {
          return vals.cidade < 0.90 || vals.natureza >= vals.cidade;
        }
      }
    }

    return false;
  }

  ngOnInit(): void {
    if (typeof localStorage !== 'undefined') {
      const hideFlag = localStorage.getItem('horizon_quiz_hide_instructions');
      if (hideFlag === 'true') {
        this.hideAllInstructionOverlays.set(true);
        this.dontShowInstructionsAgain.set(true);
      }
    }
    this.loadQuiz();
    this.checkPendingQuizSubmission();
  }

  private checkPendingQuizSubmission(): void {
    if (typeof localStorage !== 'undefined' && this.authService.isAuthenticated()) {
      const pendingRaw = localStorage.getItem('pending_quiz_submission');
      if (pendingRaw) {
        try {
          const { quizId, payload } = JSON.parse(pendingRaw);
          if (payload) {
            this.isSubmitting.set(true);
            this.quizService.submitQuiz(quizId, payload).subscribe({
              next: () => {
                localStorage.removeItem('pending_quiz_submission');
                this.isSubmitting.set(false);
                this.isSubmitted.set(true);
                const uid = this.tokenStorage.getUserId();
                if (uid) {
                  localStorage.setItem(`quizCompleted_${uid}`, 'true');
                }
                this.identityService.getTravelerIdentity().subscribe({
                  next: (state) => this.identityData.set(state),
                  error: () => {}
                });
              },
              error: () => {
                this.isSubmitting.set(false);
              }
            });
          }
        } catch {
          localStorage.removeItem('pending_quiz_submission');
        }
      }
    }
  }

  loadQuiz(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.quizService.getActiveQuiz().subscribe({
      next: (data) => {
        this.quiz.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao buscar o quiz ativo.');
      }
    });
  }

  // ========================================================
  // DRAG E SWIPE LOGIC
  // ========================================================
  startDrag(event: MouseEvent | TouchEvent, idx: number): void {
    if (this.isDragging()) return;
    this.isDragging.set(true);
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.dragStartX.set(clientX);
    this.dragCurrentX.set(clientX);
    
    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('touchmove', this.onDragMove, { passive: false });
    document.addEventListener('mouseup', this.onDragEnd);
    document.addEventListener('touchend', this.onDragEnd);
  }

  onDragMove = (event: MouseEvent | TouchEvent) => {
    if (!this.isDragging()) return;
    if (event instanceof TouchEvent && event.cancelable) {
      event.preventDefault();
    }
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.dragCurrentX.set(clientX);
  };

  onDragEnd = () => {
    if (!this.isDragging()) return;
    const delta = this.dragDeltaX;
    this.isDragging.set(false);
    
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('touchmove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);
    document.removeEventListener('touchend', this.onDragEnd);

    const SWIPE_THRESHOLD = 75;
    
    if (this.isExperienceStep()) {
      if (delta > SWIPE_THRESHOLD) {
        this.handleExperienceChoice(true);
      } else if (delta < -SWIPE_THRESHOLD) {
        this.handleExperienceChoice(false);
      }
    } else {
      if (delta > SWIPE_THRESHOLD) {
        this.handleSwipeRight();
      } else if (delta < -SWIPE_THRESHOLD) {
        this.handleSwipeLeft();
      }
    }

    this.dragStartX.set(0);
    this.dragCurrentX.set(0);
  };

  handleExperienceChoice(chosen: boolean): void {
    const questions = this.quiz()?.questions || [];
    const q = questions[this.currentStep()];
    if (!q) return;

    const currentCard = this.currentExperienceCard();
    if (currentCard) {
      const currentList: number[] = Array.isArray(this.selectedAnswers()[q.id]) 
        ? [...(this.selectedAnswers()[q.id] as number[])] 
        : [];
      if (chosen) {
        if (!currentList.includes(currentCard.id)) {
          currentList.push(currentCard.id);
        }
      } else {
        const idx = currentList.indexOf(currentCard.id);
        if (idx > -1) {
          currentList.splice(idx, 1);
        }
      }
      this.selectedAnswers.update(prev => ({ ...prev, [q.id]: currentList }));
    }

    const nextIdx = this.experienceCardIndex() + 1;
    if (nextIdx < q.answers.length) {
      this.experienceCardIndex.set(nextIdx);
    } else {
      // Concluiu todos os cards desta pergunta múltipla
      this.completedMultiSteps.update(set => new Set(set).add(q.id));
      
      // Avança para o próximo passo do quiz
      setTimeout(() => {
        this.currentStep.set(this.currentStep() + 1);
        this.topCardIndex.set(0);
        this.experienceCardIndex.set(0);
      }, 350);
    }
  }

  goToExperienceCard(idx: number): void {
    const questions = this.quiz()?.questions || [];
    const q = questions[this.currentStep()];
    if (!q || idx < 0 || idx >= q.answers.length) return;
    this.experienceCardIndex.set(idx);
  }

  goToPrevExperienceCard(): void {
    if (this.experienceCardIndex() > 0) {
      this.experienceCardIndex.set(this.experienceCardIndex() - 1);
    }
  }

  goToNextExperienceCard(): void {
    const questions = this.quiz()?.questions || [];
    const q = questions[this.currentStep()];
    if (q && this.experienceCardIndex() < q.answers.length - 1) {
      this.experienceCardIndex.set(this.experienceCardIndex() + 1);
    }
  }

  goToPrevCard(): void {
    const questions = this.quiz()?.questions || [];
    const q = questions[this.currentStep()];
    if (!q || !q.answers || q.answers.length <= 1) return;
    const len = q.answers.length;
    const prevIndex = (this.topCardIndex() - 1 + len) % len;
    this.goToCard(prevIndex);
  }

  goToNextCard(): void {
    const questions = this.quiz()?.questions || [];
    const q = questions[this.currentStep()];
    if (!q || !q.answers || q.answers.length <= 1) return;
    const len = q.answers.length;
    const nextIndex = (this.topCardIndex() + 1) % len;
    this.goToCard(nextIndex);
  }

  handleSwipeLeft(): void {
    const currentQ = this.quiz()!.questions[this.currentStep()];
    let nextIndex = this.topCardIndex() + 1;
    if (nextIndex >= currentQ.answers.length) {
      nextIndex = 0;
    }
    this.goToCard(nextIndex);
  }

  handleSwipeRight(): void {
    const currentQ = this.quiz()!.questions[this.currentStep()];
    const safeIndex = this.topCardIndex() % currentQ.answers.length;
    const selectedAnswerId = currentQ.answers[safeIndex].id;
    
    const current = { ...this.selectedAnswers() };
    current[currentQ.id] = selectedAnswerId;
    this.selectedAnswers.set(current);
    
    // Auto-advance
    this.topCardIndex.set(0);
    const totalQ = this.quiz()?.questions?.length || 0;
    if (this.currentStep() < totalQ) {
       setTimeout(() => {
           if (this.currentStep() < totalQ) {
             this.currentStep.set(this.currentStep() + 1);
             this.topCardIndex.set(0);
           }
       }, 300);
    }
  }

  getCardTransform(indexOffset: number): string {
    if (indexOffset === 0 && this.isDragging()) {
      const deltaX = this.dragDeltaX;
      const rotate = deltaX * 0.04;
      return `translate3d(${deltaX}px, 0, 0) rotate(${rotate}deg)`;
    }
    if (indexOffset < 0) return 'scale(0)';
    
    // Efeito Baralho (Cartas saltadas / abertas em leque)
    if (indexOffset === 1) {
      return 'translate3d(18px, -4px, 0) rotate(4deg) scale(0.96)';
    }
    if (indexOffset === 2) {
      return 'translate3d(-18px, -8px, 0) rotate(-4.5deg) scale(0.92)';
    }
    if (indexOffset === 3) {
      return 'translate3d(28px, -12px, 0) rotate(7.5deg) scale(0.88)';
    }
    return 'translate3d(0, 0, 0) scale(1)';
  }

  getCardOpacity(indexOffset: number): number {
    if (indexOffset === 0) return 1;
    if (indexOffset === 1) return 0.88;
    if (indexOffset === 2) return 0.72;
    return 0;
  }

  goToCard(index: number): void {
    const currentQ = this.quiz()?.questions?.[this.currentStep()];
    if (!currentQ || !currentQ.answers || index < 0 || index >= currentQ.answers.length) return;
    if (this.topCardIndex() === index) return;

    this.isCardTransitioning.set(true);
    this.topCardIndex.set(index);
    this.dragStartX.set(0);
    this.dragCurrentX.set(0);
    setTimeout(() => {
      this.isCardTransitioning.set(false);
    }, 320);
  }

  getVisibleStackCards(answers: AnswerOption[]): { answer: AnswerOption; index: number; offset: number }[] {
    if (!answers || answers.length === 0) return [];
    const count = Math.min(answers.length, 3);
    const top = this.topCardIndex();
    const result: { answer: AnswerOption; index: number; offset: number }[] = [];
    for (let offset = 0; offset < count; offset++) {
      const idx = (top + offset) % answers.length;
      result.push({
        answer: answers[idx],
        index: idx,
        offset: offset
      });
    }
    return result;
  }

  getRemainingExperienceCards(answers: AnswerOption[]): { answer: AnswerOption; index: number; offset: number }[] {
    if (!answers || answers.length === 0) return [];
    const currentIdx = this.experienceCardIndex();
    const remaining = answers.slice(currentIdx);
    const count = Math.min(remaining.length, 3);
    const result: { answer: AnswerOption; index: number; offset: number }[] = [];
    for (let offset = 0; offset < count; offset++) {
      result.push({
        answer: remaining[offset],
        index: currentIdx + offset,
        offset: offset
      });
    }
    return result;
  }

  goToStep(stepIndex: number): void {
    const total = this.totalSteps();
    if (stepIndex >= 0 && stepIndex < total) {
      this.currentStep.set(stepIndex);
      this.topCardIndex.set(0);
      this.experienceCardIndex.set(0);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
      this.topCardIndex.set(0);
      this.experienceCardIndex.set(0);
    }
  }

  isStepDone(stepIndex: number): boolean {
    const questions = this.quiz()?.questions || [];
    if (stepIndex < questions.length) {
      const q = questions[stepIndex];
      const ans = this.selectedAnswers()[q.id];
      if (Array.isArray(ans)) {
        return ans.length > 0 || this.completedMultiSteps().has(q.id);
      }
      return ans !== undefined;
    }
    return this.isBudgetValid();
  }

  getOptionVisual(answerText: string): OptionVisual {
    const normalized = answerText.toLowerCase().trim();
    if (this.visualMap[normalized]) {
      return this.visualMap[normalized];
    }
    for (const [key, val] of Object.entries(this.visualMap)) {
      if (normalized.includes(key)) {
        return val;
      }
    }
    return {
      image: 'assets/eco.webp',
      icon: '✈️',
      subtitle: 'Uma jornada única personalizada ao seu perfil de exploração.',
      tag: 'Experiência Horizon'
    };
  }

  isBudgetValid(): boolean {
    const b = this.budget();
    return b !== null && b !== undefined && b >= 1000 && b <= 200000;
  }

  isFormValid(): boolean {
    const currentQuiz = this.quiz();
    if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
      return false;
    }

    const answers = this.selectedAnswers();
    const allAnswered = currentQuiz.questions.every(q => {
      if (q.required === false) return true;
      const ans = answers[q.id];
      if (Array.isArray(ans)) return ans.length > 0;
      return ans !== undefined;
    });

    return allAnswered && this.isBudgetValid();
  }

  onBudgetInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let cleaned = input.value.replace(/\D/g, '');
    
    if (cleaned === '') {
      this.budgetError.set("Digite um valor válido.");
      this.budget.set(0);
      input.value = '';
      return;
    }

    let num = parseInt(cleaned, 10);
    if (num > 200000) {
      this.budgetError.set("O limite máximo permitido é R$ 200.000");
      num = 200000;
    } else if (num < 1000) {
      this.budgetError.set("O valor mínimo é R$ 1.000");
    } else {
      this.budgetError.set(null);
    }
    
    this.budget.set(num);
    input.value = num.toString();
  }

  onBudgetBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    let num = this.budget() || 0;
    
    if (num < 1000) {
      this.budget.set(1000);
      this.budgetError.set("Corrigido para o mínimo de R$ 1.000");
      input.value = "1000";
    }
  }

  setBudgetPreset(amount: number): void {
    this.budget.set(amount);
    this.budgetError.set(null);
  }

  togglePassport(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.hasPassport.set(checkbox.checked);
  }

  togglePassportDirect(): void {
    this.hasPassport.update(v => !v);
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    const answersMap: Record<string, number | number[]> = {};
    Object.entries(this.selectedAnswers()).forEach(([qId, val]) => {
      answersMap[qId] = val;
    });

    const payload: SubmitQuizRequest = {
      answers: answersMap,
      budgetPerPerson: this.budget()!,
      hasPassport: this.hasPassport()
    };

    const quizId = this.quiz()?.id || null;

    if (!this.authService.isAuthenticated()) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pending_quiz_submission', JSON.stringify({ quizId, payload }));
      }
      this.showGuestAuthModal.set(true);
      return;
    }

    this.isSubmitting.set(true);
    this.submitErrorMessage.set(null);

    this.quizService.submitQuiz(quizId, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
        const uid = this.tokenStorage.getUserId();
        if (uid) {
          localStorage.setItem(`quizCompleted_${uid}`, 'true');
        }
        this.identityService.getTravelerIdentity().subscribe({
          next: (state) => this.identityData.set(state),
          error: () => {}
        });
        setTimeout(() => {
          this.isCsatModalOpen.set(true);
        }, 1200);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.submitErrorMessage.set(err.message || 'Falha ao salvar respostas do quiz.');
      }
    });
  }

  resetQuiz(): void {
    this.selectedAnswers.set({});
    this.selectedExperienceIds.set([]);
    this.experienceCardIndex.set(0);
    this.topCardIndex.set(0);
    this.currentStep.set(0);
    this.isSubmitted.set(false);
    this.budget.set(15000);
    this.hasPassport.set(true);
  }

  formatCurrency(value: number | null): string {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  goToLoginAfterQuiz(): void {
    this.showGuestAuthModal.set(false);
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/quiz' } });
  }

  goToRegisterAfterQuiz(): void {
    this.showGuestAuthModal.set(false);
    this.router.navigate(['/register'], { queryParams: { returnUrl: '/quiz' } });
  }

  handleHeroError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/trivia-bg.webp';
    }
  }

  onQuizCsatSubmitted(): void {
    this.hasSubmittedQuizCsat.set(true);
  }
}
