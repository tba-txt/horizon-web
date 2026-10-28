import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { animate, stagger } from 'motion';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FeedService } from '../services/feed.service';
import { Post } from '../models/feed.model';
import { AuthService } from '../../../core/auth/services/auth.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';
import { BackToTopComponent } from '../../../shared/components/back-to-top/back-to-top.component';

@Component({
  selector: 'app-feed-main',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, PlaneLoaderComponent, BackToTopComponent],
  templateUrl: './feed-main.component.html',
  styleUrls: ['./feed-main.component.scss']
})
export class FeedMainComponent implements OnInit, OnDestroy {
  private feedService = inject(FeedService);
  private tokenStorage = inject(TokenStorageService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  showGuestAuthModal = signal(false);

  // ==================== MISSÕES DE GAMIFICAÇÃO & CUPOM ====================
  isMissionsOpen = signal<boolean>(false);
  isWiggling = signal<boolean>(false);
  // Balão sutil de lembrete das missões (aparece a cada 5 minutos)
  subtleNotice = signal<string | null>(null);

  private wiggleIntervalId?: any;
  private noticeIntervalId?: any;
  private noticeTimeoutId?: any;
  private wiggleTimeoutId?: any;

  quizMissionCompleted = signal<boolean>(false);
  interactedPostIds = signal<number[]>([]);
  articleRead = signal<boolean>(false);
  couponCopied = signal<boolean>(false);
  couponUsed = signal<boolean>(false);
  showBackToTop = signal<boolean>(false);

  interactionsCount = computed(() => {
    return Math.min(10, this.interactedPostIds().length);
  });

  missionsCompletedCount = computed(() => {
    let count = 0;
    if (this.quizMissionCompleted()) count++;
    if (this.interactionsCount() >= 10) count++;
    if (this.articleRead()) count++;
    return count;
  });

  allMissionsCompleted = computed(() => {
    return this.missionsCompletedCount() === 3;
  });

  couponCode = computed(() => {
    const uid = this.tokenStorage.getUserId() || 'USER';
    return `HORIZON10-U${uid}`;
  });

  private getInteractionsStorageKey(): string {
    const uid = this.tokenStorage.getUserId();
    return uid ? `interactedPosts_${uid}` : 'interactedPosts_guest';
  }

  private loadStoredInteractions(): number[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const key = this.getInteractionsStorageKey();
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  recordInteraction(postId: number): void {
    const current = this.interactedPostIds();
    if (!current.includes(postId)) {
      const updated = [...current, postId];
      this.interactedPostIds.set(updated);
      if (typeof localStorage !== 'undefined') {
        const key = this.getInteractionsStorageKey();
        localStorage.setItem(key, JSON.stringify(updated));
      }
      this.syncCouponIfEligible();
    }
  }

  removeInteraction(postId: number): void {
    const current = this.interactedPostIds();
    if (current.includes(postId)) {
      const updated = current.filter(id => id !== postId);
      this.interactedPostIds.set(updated);
      if (typeof localStorage !== 'undefined') {
        const key = this.getInteractionsStorageKey();
        localStorage.setItem(key, JSON.stringify(updated));
      }
    }
  }

  private syncCouponIfEligible(): void {
    const uid = this.tokenStorage.getUserId();
    if (!uid || typeof localStorage === 'undefined') return;

    const existing = localStorage.getItem(`horizonCoupon_${uid}`);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed?.used) {
          this.couponUsed.set(true);
          return; // Já consumido em uma viagem anterior, não reativa
        }
      } catch {}
    }

    if (this.allMissionsCompleted()) {
      localStorage.setItem(`horizonCoupon_${uid}`, JSON.stringify({
        code: this.couponCode(),
        userId: uid,
        discountPercent: 10,
        unlocked: true,
        unlockedAt: Date.now(),
        used: false
      }));
    }
  }

  checkQuizCompletion(): void {
    const uid = this.tokenStorage.getUserId();
    if (!uid) return;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(`quizCompleted_${uid}`) === 'true') {
      this.quizMissionCompleted.set(true);
      this.syncCouponIfEligible();
      return;
    }
    this.http.get<any>(`${environment.apiUrl}/profiles/explicit`).subscribe({
      next: (res) => {
        if (res?.hasProfile) {
          this.quizMissionCompleted.set(true);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`quizCompleted_${uid}`, 'true');
          }
          this.syncCouponIfEligible();
        }
      },
      error: () => {}
    });
  }

  copyCoupon(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.couponCode()).then(() => {
        this.couponCopied.set(true);
        setTimeout(() => this.couponCopied.set(false), 2500);
      });
    }
  }

  visibleCount = signal<number>(15);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (typeof window !== 'undefined') {
      this.showBackToTop.set(window.scrollY > 400);

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 700;
      if (scrollPosition >= threshold && this.visibleCount() < this.filteredPosts().length) {
        this.loadMorePosts();
      }
    }
  }

  loadMorePosts(): void {
    const total = this.filteredPosts().length;
    if (this.visibleCount() < total) {
      this.visibleCount.update(current => Math.min(current + 15, total));
    }
  }

  scrollToTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private getThisOrThatStorageKey(): string {
    const uid = this.tokenStorage.getUserId();
    return uid ? `thisOrThatSelection_${uid}` : 'thisOrThatSelection_guest';
  }

  private loadStoredSelections(): Record<number, number> {
    if (typeof localStorage === 'undefined') return {};
    localStorage.removeItem('thisOrThatSelection');
    try {
      const key = this.getThisOrThatStorageKey();
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  categories = [
    { id: 'ALL', label: 'Tudo', icon: 'bi-compass' },
    { id: 'ARTICLE', label: 'Posts', icon: 'bi-journal-richtext' },
    { id: 'THIS_OR_THAT', label: 'Isso ou Aquilo', icon: 'bi-arrows-collapse' },
    { id: 'TRIVIA', label: 'Trivias', icon: 'bi-patch-question' },
    { id: 'ECO', label: 'Ecoturismo', icon: 'bi-tree' },
    { id: 'CULTURE', label: 'Cultura & História', icon: 'bi-bank' }
  ];

  selectedCategory = signal<string>('ALL');
  sortBy = signal<'recent' | 'popular'>('recent');
  searchQuery = signal('');
  shareNotice = signal<string | null>(null);
  private shareTimeoutId?: any;

  thisOrThatSelection = signal<Record<number, number>>({});
  triviaSelection = signal<Record<number, number>>({});
  communityVotes = signal<Record<number, Record<number, number>>>({});

  private loadStoredCommunityVotes(): Record<number, Record<number, number>> {
    if (typeof localStorage === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('horizon_this_or_that_community_votes') || '{}');
    } catch {
      return {};
    }
  }

  private getUserInteractionsStorageKey(): string {
    const uid = this.tokenStorage.getUserId();
    return uid ? `userInteractions_${uid}` : 'userInteractions_guest';
  }

  private loadStoredUserInteractions(): Record<number, 'LIKE' | 'DISLIKE'> {
    if (typeof localStorage === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(this.getUserInteractionsStorageKey()) || '{}');
    } catch {
      return {};
    }
  }

  posts = signal<Post[]>([]);
  isLoading = signal(true);
  
  selectedArticle = signal<Post | null>(null);
  activeImageIndex = signal<Record<number, number>>({});

  isDragging: Record<number, boolean> = {};
  private startX: Record<number, number> = {};
  private scrollLeftPos: Record<number, number> = {};

  filteredPosts = computed(() => {
    let list = [...this.posts()];
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    
    if (query) {
      list = list.filter(p => 
        p.title?.toLowerCase().includes(query) || 
        p.caption?.toLowerCase().includes(query) ||
        p.triviaData?.question?.toLowerCase().includes(query) ||
        p.thisOrThatOptions?.some(o => o.label.toLowerCase().includes(query))
      );
    }

    if (cat !== 'ALL') {
      if (cat === 'ARTICLE') {
        list = list.filter(p => p.postType === 'ARTICLE' || (!p.postType && !!p.caption));
      } else if (cat === 'THIS_OR_THAT') {
        list = list.filter(p => p.postType === 'THIS_OR_THAT');
      } else if (cat === 'TRIVIA') {
        list = list.filter(p => p.postType === 'TRIVIA');
      } else if (cat === 'ECO') {
        list = list.filter(p => 
          p.title?.toLowerCase().includes('patagônia') ||
          p.title?.toLowerCase().includes('amazônia') ||
          p.title?.toLowerCase().includes('bonito') ||
          p.title?.toLowerCase().includes('lençóis') ||
          p.title?.toLowerCase().includes('iguaçu') ||
          p.title?.toLowerCase().includes('jalapão') ||
          p.title?.toLowerCase().includes('galápagos') ||
          p.title?.toLowerCase().includes('pantanal') ||
          p.title?.toLowerCase().includes('banff') ||
          p.attributes?.some(a => a.attributeName?.toUpperCase().includes('ECO'))
        );
      } else if (cat === 'CULTURE') {
        list = list.filter(p => 
          p.title?.toLowerCase().includes('incas') ||
          p.title?.toLowerCase().includes('toscana') ||
          p.title?.toLowerCase().includes('paraty') ||
          p.title?.toLowerCase().includes('xingó') ||
          p.title?.toLowerCase().includes('gramado') ||
          p.title?.toLowerCase().includes('tromsø') ||
          p.title?.toLowerCase().includes('trancoso') ||
          p.attributes?.some(a => a.attributeName?.toUpperCase().includes('CULT'))
        );
      }
    }

    if (this.sortBy() === 'popular') {
      list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    return list;
  });

  setCategory(catId: string): void {
    this.selectedCategory.set(catId);
    this.visibleCount.set(15);
    this.triggerFeedAnimation();
  }

  sharePost(post: Post, event: Event): void {
    event.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const shareUrl = `${window.location.origin}/feed#post-${post.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.shareNotice.set('Link da matéria copiado para compartilhar!');
        if (this.shareTimeoutId) clearTimeout(this.shareTimeoutId);
        this.shareTimeoutId = setTimeout(() => this.shareNotice.set(null), 3500);
      });
    }
  }

  getPostLocation(post: Post): string {
    return 'Destinos Horizon';
  }

  getPostReadTime(post: Post): string {
    const len = (post.caption || '').length;
    const mins = Math.max(2, Math.ceil(len / 450));
    return `${mins} min de leitura`;
  }

  getPostTags(post: Post): string[] {
    if (post.attributes && post.attributes.length > 0) {
      return post.attributes.slice(0, 2).map(a => '#' + a.attributeName.toLowerCase());
    }
    const t = (post.title || '').toLowerCase();
    if (t.includes('incas') || t.includes('machu')) return ['#História', '#Arqueologia'];
    if (t.includes('lençóis') || t.includes('jalapão')) return ['#Ecoturismo', '#Dunas'];
    if (t.includes('iguaçu') || t.includes('bonito')) return ['#Ecoturismo', '#Águas'];
    if (t.includes('patagônia') || t.includes('tromsø') || t.includes('banff')) return ['#Frio', '#Montanha'];
    if (t.includes('amazônica') || t.includes('pantanal') || t.includes('galápagos')) return ['#VidaSelvagem', '#Natureza'];
    if (t.includes('gramado') || t.includes('toscana')) return ['#Gastronomia', '#Charme'];
    if (t.includes('paraty') || t.includes('trancoso')) return ['#Histórico', '#Praia'];
    if (t.includes('dolomitas')) return ['#Trekking', '#Alpes'];
    return ['#Viagem', '#Exploração'];
  }

  handleLogoError(event: any): void {
    if (event?.target) {
      event.target.style.display = 'none';
    }
  }

  displayedPosts = computed(() => {
    return this.filteredPosts().slice(0, this.visibleCount());
  });

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedArticle()) {
      this.closeArticleReader();
    } else if (this.isMissionsOpen()) {
      this.isMissionsOpen.set(false);
    }
  }

  private getTriviaStorageKey(): string {
    const uid = this.tokenStorage.getUserId();
    return uid ? `triviaSelection_${uid}` : 'triviaSelection_guest';
  }

  private loadStoredTriviaSelections(): Record<number, number> {
    if (typeof localStorage === 'undefined') return {};
    try {
      const key = this.getTriviaStorageKey();
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  ngOnInit(): void {
    const userSelections = this.loadStoredSelections();
    this.thisOrThatSelection.set(userSelections);
    this.triviaSelection.set(this.loadStoredTriviaSelections());
    this.interactedPostIds.set(this.loadStoredInteractions());

    const commVotes = this.loadStoredCommunityVotes();
    for (const [pIdStr, optId] of Object.entries(userSelections)) {
      const pId = Number(pIdStr);
      if (!commVotes[pId]) {
        commVotes[pId] = { 1: 0, 2: 0 };
      }
      if (!commVotes[pId][optId] || commVotes[pId][optId] === 0) {
        commVotes[pId][optId] = 1;
      }
    }
    this.communityVotes.set(commVotes);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('horizon_this_or_that_community_votes', JSON.stringify(commVotes));
    }

    const uid = this.tokenStorage.getUserId();
    if (uid && typeof localStorage !== 'undefined') {
      if (localStorage.getItem(`articleRead_${uid}`) === 'true') {
        this.articleRead.set(true);
      }
      const existing = localStorage.getItem(`horizonCoupon_${uid}`);
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed?.used) {
            this.couponUsed.set(true);
          }
        } catch {}
      }
    }

    this.checkQuizCompletion();
    this.syncCouponIfEligible();
    this.startMissionsTimers();
    this.loadPosts();
  }

  private startMissionsTimers(): void {
    if (typeof window === 'undefined') return;

    // Tremor inicial sutil após 2.5s para demonstrar ao usuário
    setTimeout(() => {
      if (!this.allMissionsCompleted()) {
        this.isWiggling.set(true);
        setTimeout(() => this.isWiggling.set(false), 1500);
      }
    }, 2500);

    // A cada 30 segundos, treme por 1.5s enquanto não completou todas as missões
    this.wiggleIntervalId = setInterval(() => {
      if (!this.allMissionsCompleted()) {
        this.isWiggling.set(true);
        if (this.wiggleTimeoutId) clearTimeout(this.wiggleTimeoutId);
        this.wiggleTimeoutId = setTimeout(() => {
          this.isWiggling.set(false);
        }, 1500);
      }
    }, 30000);

    // Balão sutil de lembrete das missões: aparece a cada 5 minutos (300.000 ms) e recolhe após 8 segundos
    this.noticeIntervalId = setInterval(() => {
      if (!this.allMissionsCompleted() && !this.isMissionsOpen()) {
        this.subtleNotice.set('Clique aqui pra ganhar 10% OFF ✨');
        if (this.noticeTimeoutId) clearTimeout(this.noticeTimeoutId);
        this.noticeTimeoutId = setTimeout(() => {
          this.subtleNotice.set(null);
        }, 8000);
      }
    }, 300000);
  }

  ngOnDestroy(): void {
    if (this.wiggleIntervalId) clearInterval(this.wiggleIntervalId);
    if (this.noticeIntervalId) clearInterval(this.noticeIntervalId);
    if (this.wiggleTimeoutId) clearTimeout(this.wiggleTimeoutId);
    if (this.noticeTimeoutId) clearTimeout(this.noticeTimeoutId);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.sortBy.set('recent');
    this.selectedCategory.set('ALL');
    this.visibleCount.set(15);
    this.triggerFeedAnimation();
  }

  private triggerFeedAnimation() {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    setTimeout(() => {
      const cards = document.querySelectorAll('.post-card');
      if (cards.length > 0) {
        animate(cards, { opacity: [0, 1], y: [20, 0] }, { delay: stagger(0.06), duration: 0.35, ease: 'easeOut' });
      }
    }, 50);
  }

  // ==================== 10 "ISSO OU AQUILO" ====================
  private readonly curatedThisOrThat: Post[] = [
    {
      id: 90001,
      title: 'Isso ou Aquilo: Escolha sua Vibe',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Desbravar a Patagônia Selvagem', image: '/assets/feed/id01-eco.webp', votes: 0 },
        { id: 2, label: 'Viver as Luzes de Tóquio à Noite', image: '/assets/feed/id01-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90002,
      title: 'Isso ou Aquilo: Refúgio dos Sonhos',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Mergulho nas Águas de Noronha', image: '/assets/feed/id02-eco.webp', votes: 0 },
        { id: 2, label: 'Chalé com Lareira na Serra Gaúcha', image: '/assets/feed/id02-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90003,
      title: 'Isso ou Aquilo: Adrenalina e Ritmo',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Expedição pelos Lençóis Maranhenses', image: '/assets/feed/id03-eco.webp', votes: 0 },
        { id: 2, label: 'Fim de Semana em Nova York', image: '/assets/feed/id03-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90004,
      title: 'Isso ou Aquilo: Desconexão ou Cultura',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Trilha na Floresta Amazônica', image: '/assets/feed/id04-eco.webp', votes: 0 },
        { id: 2, label: 'Tour Histórico e Gastronômico em Roma', image: '/assets/feed/id04-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90005,
      title: 'Isso ou Aquilo: Noite Estrelada ou Cidade Luz',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Acampar sob as Estrelas no Atacama', image: '/assets/feed/id05-eco.webp', votes: 0 },
        { id: 2, label: 'Jantar Romântico com Luzes de Paris', image: '/assets/feed/id05-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90006,
      title: 'Isso ou Aquilo: Planeta Selvagem ou Oásis Futurista',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Safári Selvagem no Serengeti', image: '/assets/feed/id06-eco.webp', votes: 0 },
        { id: 2, label: 'Arranha-Céus e Luxo em Dubai', image: '/assets/feed/id06-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90007,
      title: 'Isso ou Aquilo: Águas Cristalinas',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Flutuação nas Nascentes de Bonito', image: '/assets/feed/id07-eco.webp', votes: 0 },
        { id: 2, label: 'Praias e Festas em Cancún', image: '/assets/feed/id07-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90008,
      title: 'Isso ou Aquilo: Desafios e Cidades',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Trilhas na Chapada Diamantina', image: '/assets/feed/id08-eco.webp', votes: 0 },
        { id: 2, label: 'Museus e Pubs Históricos em Londres', image: '/assets/feed/id08-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90009,
      title: 'Isso ou Aquilo: Frio Extremo ou Calor Litorâneo',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Geleiras e Fiordes em Reykjavík', image: '/assets/feed/id09-eco.webp', votes: 0 },
        { id: 2, label: 'Calçadão e Pôr do Sol no Rio de Janeiro', image: '/assets/feed/id09-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 90010,
      title: 'Isso ou Aquilo: Natureza Pura ou Grandes Espetáculos',
      caption: '',
      postType: 'THIS_OR_THAT',
      thisOrThatOptions: [
        { id: 1, label: 'Vida Selvagem e Safári no Pantanal', image: '/assets/feed/id10-eco.webp', votes: 0 },
        { id: 2, label: 'Cassinos e Espetáculos em Las Vegas', image: '/assets/feed/id10-city.webp', votes: 0 }
      ],
      likesCount: 0,
      dislikesCount: 0
    }
  ];

  // ==================== 5 "PARADA OBRIGATÓRIA HORIZON" ====================
  private readonly curatedTrivias: Post[] = [
    {
      id: 95001,
      title: 'Parada Obrigatória Horizon',
      caption: 'Teste seus conhecimentos sobre o mundo!',
      postType: 'TRIVIA',
      triviaData: {
        question: 'Qual é o parque nacional mais antigo do mundo, famoso por seus gêiseres e fontes termais?',
        options: ['Parque Nacional de Banff', 'Parque Nacional de Yellowstone', 'Parque Nacional Torres del Paine'],
        correctIndex: 1,
        explanation: 'Yellowstone foi fundado em 1872 nos Estados Unidos e abriga mais da metade dos gêiseres ativos do planeta, incluindo o famoso Old Faithful e fontes hidrotermais multicoloridas.'
      },
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 95002,
      title: 'Parada Obrigatória Horizon',
      caption: 'Descubra curiosidades fascinantes de viagem!',
      postType: 'TRIVIA',
      triviaData: {
        question: 'Em qual país fica a lendária cidade de Petra, esculpida diretamente em paredões de rocha avermelhada?',
        options: ['Jordânia', 'Egito', 'Turquia'],
        correctIndex: 0,
        explanation: 'Petra fica no sudoeste da Jordânia e floresceu como capital do antigo Reino Nabateu há mais de 2.000 anos, esculpida em desfiladeiros de arenito rosa.'
      },
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 95003,
      title: 'Parada Obrigatória Horizon',
      caption: 'Tesouros do Ecoturismo Brasileiro',
      postType: 'TRIVIA',
      triviaData: {
        question: 'Qual destino brasileiro abriga o maior arquipélago fluvial do mundo (Anavilhanas), com mais de 400 ilhas?',
        options: ['Pantanal (MS)', 'Rio Negro / Manaus (AM)', 'Jalapão (TO)'],
        correctIndex: 1,
        explanation: 'O Parque Nacional de Anavilhanas fica no Rio Negro, no Amazonas, formando um labirinto fluvial com centenas de ilhas cuja paisagem muda drasticamente entre as cheias e secas.'
      },
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 95004,
      title: 'Parada Obrigatória Horizon',
      caption: 'Curiosidades dos Andes',
      postType: 'TRIVIA',
      triviaData: {
        question: 'Qual é o maior deserto de sal do planeta, situado a mais de 3.600 metros de altitude?',
        options: ['Salar de Uyuni (Bolívia)', 'Deserto do Atacama (Chile)', 'Death Valley (EUA)'],
        correctIndex: 0,
        explanation: 'O Salar de Uyuni cobre mais de 10.000 km² a 3.600 metros de altitude na Bolívia e se transforma no maior espelho natural do planeta quando coberto por uma fina lâmina d\'água de chuva.'
      },
      likesCount: 0,
      dislikesCount: 0
    },
    {
      id: 95005,
      title: 'Parada Obrigatória Horizon',
      caption: 'Maravilhas dos Oceanos',
      postType: 'TRIVIA',
      triviaData: {
        question: 'Qual dessas formações marinhas é tão colossal que pode ser observada nitidamente do espaço sideral?',
        options: ['Grande Barreira de Corais (Austrália)', 'Fossa das Marianas (Pacífico)', 'Atol das Rocas (Brasil)'],
        correctIndex: 0,
        explanation: 'A Grande Barreira de Corais se estende por mais de 2.300 km no litoral nordeste da Austrália, sendo o maior organismo vivo da Terra composto por bilhões de pólipos de coral.'
      },
      likesCount: 0,
      dislikesCount: 0
    }
  ];

    // ==================== 25 ARTIGOS EDITORIAIS ====================
  private readonly curatedArticles: Post[] = [
    {
      id: 101,
      title: 'Pequenos gigantes do gelo',
      caption: 'Desembarcar na Península Antártica desafia qualquer escala humana de proporção. O silêncio absoluto só é rompido pelo som cavernoso do gelo que estala à distância e pelo bater ritmado das asas dos cormorões.\n\nNas colônias de pinguins-gentoo e pinguins-de-adélia, a rotina é frenética e comovente: centenas de indivíduos transitam pelas chamadas \'rodovias de pinguins\' cavadas na neve compacta, revezando-se entre a caça voraz de krill nas águas glaciais e o cuidado meticuloso com seus ninhos de seixos.\n\nEstar ali nos ensina sobre resiliência ecológica e respeito absoluto aos limites da natureza. Não há pressa que resista ao vento gelado do Estreito de Gerlache e à visão de um colosso de gelo milenar esculpido em tons de azul elétrico.',
      imageUrl: '/assets/feed/id101-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 102,
      title: 'O encanto das águas cristalinas de Noronha',
      caption: 'Há poucos lugares no globo onde a comunhão entre terra e oceano seja tão intacta quanto em Fernando de Noronha. Do alto da escadaria cravada na fenda rochosa que dá acesso à Baía do Sancho, o tom esmeralda do mar parece quase surreal sob a luz do meio-dia.\n\nAo mergulhar com snorkel na Baía dos Porcos ou no Sueste, você não precisa procurar pela vida: são as tartarugas-verdes, raias-chita e cardumes multicoloridos que cruzam seu caminho com naturalidade desarmante. Ao longe, o Morro do Pico vigia o arquipélago como um farol milenar de origem vulcânica.\n\nA verdadeira magia de Noronha mora no ritmo do arquipélago: acordar antes da alvorada para contemplar os golfinhos-rotadores na Baía dos Golfinhos e terminar a tarde assistindo ao pôr do sol no Mirante do Boldró, com os pés na areia e a sensação rara de desaceleração profunda.',
      imageUrl: '/assets/feed/id102-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 103,
      title: 'Segredos da Chapada Diamantina: O lendário Vale do Pati',
      caption: 'Cruzar o Vale do Pati a pé é considerado por muitos viajantes experientes a travessia mais fascinante e transformadora do Brasil. São dias inteiros de caminhada desconectado de redes telefônicas e cercado pelas imponentes serras tabulares do Parque Nacional da Chapada Diamantina.\n\nO trajeto revela paisagens arrebatadoras: o abismo vertiginoso do Mirante do Cachoeirão, com suas múltiplas quedas d\'água após as chuvas, as águas de cor conhaque do Rio Preto e a vastidão silenciosa dos Gerais dos Vieira.\n\nMas o que realmente marca a memória são as noites nas casas dos nativos patizeiros, como a Dona Raquel ou o Seu Wilson. À luz de velas, com refeições caseiras feitas no fogão a lenha e causos contados sob um céu apinhado de estrelas, descobre-se que a simplicidade do sertão baiano é a forma mais refinada de riqueza.',
      imageUrl: '/assets/feed/id103-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 104,
      title: 'Sob o céu mais limpo do planeta no Deserto do Atacama',
      caption: 'A mais de 2.400 metros de altitude, onde o ar é rarefeito e a umidade praticamente inexiste, o Deserto do Atacama ostenta uma das janelas mais límpidas para o cosmos em nosso planeta. Quando a noite cai em San Pedro de Atacama e as luzes da vila se apagam, o firmamento ganha contornos tridimensionais.\n\nOs braços espirais da Via Láctea, as Nuvens de Magalhães e constelações indígenas ancestrais brilham com uma nitidez que hipnotiza astrônomos e viajantes. De dia, a paisagem é igualmente surreal: salares que abrigam bandos de flamingos andinos, lagoas altiplânicas de azul hipnótico a 4.000 metros e os gêiseres de El Tatio fumegando sob o gelo da manhã.\n\nO Atacama exige hidratação constante e passo cadenciado, recompensando cada esforço com a impressão inesquecível de caminhar em outro planeta sem sair da América do Sul.',
      imageUrl: '/assets/feed/id104-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 105,
      title: 'Cores, aromas e histórias nos labirintos de Marrakech',
      caption: 'Entrar na medina murada de Marrakech é atravessar uma fronteira sensorial absoluta. Os souks são labirintos vivos de ruelas cobertas por esteiras de junco, onde a luz do sol filtra em feixes dourados sobre barris de açafrão, cominho, gengibre e pilhas de tâmaras frescas.\n\nEntre artesãos moldando luminárias de latão martelado e mestres tecelões trabalhando a lã tingida nos históricos curtumes, o tempo parece obedecer a códigos medievais. Nos pátios secretos dos riads, fontes de água murmuram cercadas por mosaicos zellij e laranjeiras aromáticas, oferecendo refúgios de frescor inestimáveis.\n\nAo entardecer, todos os caminhos convergem para a lendária praça Jemaa el-Fna: encantadores de serpentes, músicos gnawa e dezenas de bancas de comida fumegantes de tagines e espetos temperados criam o maior teatro a céu aberto do norte da África.',
      imageUrl: '/assets/feed/id105-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 106,
      title: 'Amanhecer em Kyoto: Jardins zen e bambuzais milenares',
      caption: 'Se Tóquio representa o pulso elétrico do amanhã, Kyoto é o guardião sereno da alma milenar japonesa. O segredo para vivenciar sua atmosfera mais genuína é madrugar: caminhar pela floresta de bambu de Arashiyama antes das sete da manhã é ouvir apenas o estalar oco dos colmos gigantes oscilando com a brisa matinal.\n\nNos templos históricos como Ryoan-ji e Tenryu-ji, os jardins secos de pedra (karesansui) convidam à introspecção e ensinam sobre a estética do ma — o espaço vazio que dá sentido a todas as coisas. Cada rocha cuidadosamente posicionada sobre o cascalho ancinhado conta uma narrativa cósmica.\n\nCruzar as vielas de paralelepípedo de Gion ao crepúsculo, com lanternas de papel iluminando fachadas de cedro escuro e pontes de madeira sobre o canal Shirakawa, transforma a viagem em uma imersão poética na cultura da contemplação.',
      imageUrl: '/assets/feed/id106-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 107,
      title: 'Lagoas de água doce entre o mar de dunas dos Lençóis',
      caption: 'Imagine um deserto imenso de areia alvíssima cortado por centenas de lagoas cristalinas de água doce, formadas exclusivamente pelas chuvas do primeiro semestre. Os Lençóis Maranhenses compõem um ecossistema único no planeta, onde a dinâmica dos ventos redesenha o relevo diariamente.\n\nNadar nas águas mornas da Lagoa Bonita ou da Lagoa Azul após subir as dunas a pé é uma das sensações de alívio e deslumbramento mais marcantes do Nordeste brasileiro. A transição entre o verde-esmeralda da água e o branco puro do quartzo cria um contraste visual desconcertante.\n\nPara os mais aventureiros, a travessia a pé pelo Parque Nacional até o oásis de Queimada dos Britos oferece um mergulho na vida dos moradores locais que vivem em harmonia com as marés de areia, pescando traíras que hibernam sob a lama e celebrando noites de luar inesquecíveis.',
      imageUrl: '/assets/feed/id107-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 108,
      title: 'A força estrondosa das Cataratas do Iguaçu',
      caption: 'Nenhuma fotografia consegue antecipar o impacto físico de se aproximar da Garganta do Diabo. O rugido de mais de 270 quedas d\'água despejando milhões de litros por segundo vibra no peito antes mesmo de o viajante avistar o abismo encoberto por uma névoa permanente de arco-íris.\n\nCaminhar pelas passarelas que avançam sobre o Rio Iguaçu, cercado pela exuberância da Mata Atlântica e por centenas de borboletas de asas iridescentes, é uma lição de imponência natural. A água salpica no rosto e renova as energias em questão de segundos.\n\nTanto pelo lado brasileiro, com sua vista panorâmica cinematográfica, quanto pelo lado argentino, com passarelas que colocam você na beira exata do abismo d\'água, Foz do Iguaçu permanece como um dos maiores espetáculos geológicos que a Terra tem a oferecer.',
      imageUrl: '/assets/feed/id108-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 109,
      title: 'Expedição pelo Jalapão: Onde a terra brota água pura',
      caption: 'O Jalapão, no coração do cerrado tocantinense, é terra de contrastes dramáticos: chapadões de arenito avermelhado, veredas de buritis reluzentes e estradas de terra batida que desafiam até mesmo os veículos 4x4 mais preparados.\n\nA recompensa máxima da viagem mora nos famosos fervedouros, como o do Ceiça e o Bela Vista. Nessas nascentes subterrâneas de água termal azul-turquesa, o fenômeno da ressurgência cria uma pressão que impede qualquer pessoa de afundar, proporcionando uma sensação deliciosa e quase infantil de flutuação absoluta.\n\nSubir as dunas douradas no fim da tarde para ver o pôr do sol iluminar a Serra do Espírito Santo é o momento culminante da expedição, quando a terra parece pegar fogo em tons de ocre, dourado e lilás.',
      imageUrl: '/assets/feed/id109-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 110,
      title: 'Glaciares milenares e ventos bravos da Patagônia',
      caption: 'Nas franjas do Campo de Gelo Sul, a Patagônia austral impõe seu temperamento indomável. Diante do colossal glaciar Perito Moreno, em El Calafate, os viajantes permanecem em silêncio absoluto esperando o espetáculo dos desprendimentos: blocos de gelo do tamanho de edifícios despencam nas águas do Lago Argentino com um estrondo que ecoa como um trovão pelos vales.\n\nMais ao norte, nos arredores de El Chaltén, a capital nacional do trekking, trilhas batidas pelo vento patagônico levam à base do Monte Fitz Roy e da Laguna de los Tres, onde agulhas de granito furam as nuvens com uma dramaticidade quase mítica.\n\nViajar pela Patagônia exige roupas técnicas em camadas e disposição para encarar as quatro estações em um único dia. Mas a recompensa de saborear um cordeiro patagônico na brasa e uma taça de vinho Malbec após horas de caminhada no vento gelado não tem preço.',
      imageUrl: '/assets/feed/id110-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 111,
      title: 'O silêncio vivo da Floresta Amazônica ao entardecer',
      caption: 'A Floresta Amazônica não dorme: ela apenas troca de turno. Quando o sol desce no horizonte sobre o espelho negro do Rio Urubu e a névoa começa a subir das copas das samaúmas, os pássaros diurnos silenciam para dar lugar ao coro orquestrado de sapos, insetos e o sopro misterioso dos botos-cor-de-rosa emergindo para respirar.\n\nNavegar em canoas silenciosas pelos igapós inundados permite avistar preguiças camufladas nas folhas altas, macacos-de-cheiro saltando entre galhos e orquídeas selvagens que exalam perfumes adocicados no ar úmido.\n\nFicar hospedado em um hotel de selva sustentável e subir a uma torre de observação acima do dossel florestal no alvorecer é compreender a imensidão orgânica que regula o clima de todo o nosso continente. É uma experiência de humildade profunda diante da força biológica da Terra.',
      imageUrl: '/assets/feed/id111-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 112,
      title: 'Neblina de serra, fondues e araucárias em Gramado',
      caption: 'A Serra Gaúcha possui um charme outonal que desacelera os ponteiros do relógio. Em Gramado, o aroma de chocolate artesanal flutua no ar fresco das manhãs, enquanto a neblina rasteira abraça os pinheiros de araucária ao redor do bucólico Lago Negro.\n\nA arquitetura enxaimel, herdada dos imigrantes europeus, emoldura cafeterias aconchegantes e empórios onde queijos coloniais, salames curados e vinhos de altitude convidam a pausas sem hora para terminar.\n\nNas noites frias de inverno, nada se compara a reunir amigos ou a pessoa amada ao redor de uma tradicional sequência de fondue na lareira. É o refúgio perfeito para quem busca sofisticação sem ostentação, conforto acolhedor e a tranquilidade revigorante do clima montanhês.',
      imageUrl: '/assets/feed/id112-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 113,
      title: 'Flutuação surreal nos rios transparentes de Bonito',
      caption: 'A transparência inacreditável dos rios de Bonito, no Mato Grosso do Sul, não é fruto de mágica, mas de pura geologia: a água da chuva é filtrada pelo solo calcário, que decanta todas as impurezas e transforma os leitos fluviais em verdadeiros aquários naturais gigantescos.\n\nAo colocar a máscara e o snorkel no Rio Sucuri ou no Recanto Ecológico Rio da Prata, você simplesmente deixa a correnteza suave te guiar sem bater pernas. Dourados reluzentes, piraputangas curiosas e plantas aquáticas de verde brilhante passam a centímetros do seu rosto em perfeita harmonia.\n\nO modelo de turismo de Bonito é referência mundial: cada atrativo possui limite rigoroso de visitantes diários e controle ambiental por voucher digital, garantindo que o ecossistema permaneça intocado para as próximas gerações.',
      imageUrl: '/assets/feed/id113-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 114,
      title: 'Cânions e águas verdes do Rio São Francisco em Xingó',
      caption: 'No sertão sergipano e alagoano, o majestoso Rio São Francisco esculpe um dos cenários mais surpreendentes do Brasil profundo: os Cânions de Xingó. Paredões de arenito avermelhado erguem-se a mais de cinquenta metros de altura, contrastando com o verde-esmeralda intenso das águas plácidas represadas.\n\nO passeio de catamarã pelo leito do rio leva até a Gruta do Talhado, uma fenda estreita onde apenas pequenos botes de madeira conseguem navegar. Ali dentro, o silêncio é sagrado e a temperatura cai bruscamente sob a sombra dos gigantes de rocha.\n\nAlém da beleza cenográfica monumental, a região respira história e cultura nordestina: das lembranças do cangaço de Lampião e Maria Bonita à gastronomia sertaneja farta, com peixes de água doce grelhados, queijo coalho e pirão de mocotó.',
      imageUrl: '/assets/feed/id114-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 115,
      title: 'Trilhas sagradas no Vale Sagrado dos Incas',
      caption: 'Caminhar pelas cidades e fortalezas do Vale Sagrado dos Incas, como Pisac, Ollantaytambo e Moray, é mergulhar em uma civilização cuja engenharia agrícola e conhecimento astronômico dialogavam perfeitamente com as montanhas sagradas (Apus).\n\nAo chegar a Machu Picchu, seja de trem panorâmico margeando o agitado Rio Urubamba ou pela clássica Trilha Inca a pé, a sensação de reverência é instantânea. As ruínas de pedra finamente talhada parecem brotar das encostas verdejantes como uma extensão natural da serra.\n\nSubir as escadarias íngremes de Huayna Picchu sob a névoa matinal e observar a cidadela se revelando lá embaixo é um rito de passagem para qualquer amante da história e da espiritualidade andina.',
      imageUrl: '/assets/feed/id115-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 116,
      title: 'Colinas douradas e vinhedos seculares na Toscana',
      caption: 'As colinas do Val d\'Orcia representam a quintessência da paisagem campestre italiana. Estradas sinuosas ladeadas por ciprestes pontiagudos cortam campos dourados de trigo e vinhedos perfeitamente alinhados que produzem alguns dos vinhos mais reverenciados do mundo, como o Brunello di Montalcino e o Chianti Classico.\n\nVilarejos medievais encarapitados no alto dos morros, como Pienza, Montepulciano e San Gimignano, convidam a caminhar sem destino por vielas de pedra, descobrindo adegas subterrâneas, queijarias que maturam pecorino artesanal e pequenas trattorias com massas frescas ao molho de javali.\n\nA Toscana não é uma viagem para se fazer correndo de ponto turístico em ponto turístico; é um convite aberto para desacelerar o passo, abrir um bom vinho e contemplar o pôr do sol tingindo as colinas de terracota.',
      imageUrl: '/assets/feed/id116-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 117,
      title: 'O santuário de evolução e vida marinha em Galápagos',
      caption: 'Localizado a mil quilômetros da costa do Equador, o arquipélago vulcânico de Galápagos opera sob regras próprias da natureza. Como os animais nunca aprenderam a temer a presença humana por predadores terrestres, o visitante vivencia encontros comoventes de proximidade e respeito.\n\nNas praias de areia escura, leões-marinhos brincalhões cochilam lado a lado com iguanas marinhas pré-históricas que espirram sal das narinas após mergulharem em busca de algas. Nos planaltos úmidos de Santa Cruz, tartarugas gigantes com mais de um século de vida pastam vagarosamente entre as samambaias.\n\nMergulhar nas águas de Kicker Rock ou Los Túneles revela tubarões-de-galápagos, tartarugas-marinhas e os ágeis pinguins-de-galápagos voando sob a água. É o museu vivo da teoria de Darwin em sua manifestação mais pura.',
      imageUrl: '/assets/feed/id117-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 118,
      title: 'O ritmo da vida selvagem no coração do Pantanal',
      caption: 'Maior planície alagável contínua do mundo, o Pantanal é a meca absoluta da observação de fauna na América do Sul. Ao percorrer a Rodovia Transpantaneira ou navegar pelos meandros dos rios Cuiabá e Piquiri em Porto Jofre, a densidade animal impressiona até os biólogos mais calejados.\n\nBandos de tuiuiús pousam em ninhos gigantescos no topo dos manduviers, enquanto capivaras e jacarés-do-pantanal dividem barrancos sob a vigilância atenta de lontras brincalhonas. Mas o ápice incontestável de qualquer expedição é o encontro com a onça-pintada: avistar o maior felino das Américas caçando silenciosamente na beira d\'água é uma imagem que fica gravada na retina para sempre.\n\nO Pantanal exige guias experientes e paciência, retribuindo cada instante de vigília com espetáculos diários de sobrevivência e beleza bruta.',
      imageUrl: '/assets/feed/id118-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 119,
      title: 'Aurora Boreal: As luzes do norte dançando em Tromsø',
      caption: 'Situada bem acima do Círculo Polar Ártico, na Noruega, a cidade de Tromsø é a capital mundial da caçada à Aurora Boreal. Durante a longa noite polar de inverno, quando o sol nem chega a nascer no horizonte, a atmosfera ártica ganha uma tonalidade azulada de mistério e fascínio.\n\nAguardar em meio à neve espessa, ao redor de uma fogueira estalando e saboreando chá quente de frutas silvestres, até que a primeira fita esverdeada comece a serpentear pelo céu estrelado é uma das esperas mais emocionantes da vida.\n\nDe repente, o firmamento explode em cortinas dançantes de verde, violeta e magenta em questão de segundos. A força geomagnética do vento solar interagindo com a atmosfera é pura poesia cósmica em movimento sobre fiordes congelados.',
      imageUrl: '/assets/feed/id119-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 120,
      title: 'Praias rústicas e falésias da Costa do Descobrimento',
      caption: 'O trecho litorâneo do sul da Bahia que abriga Trancoso, Caraíva e Arraial d\'Ajuda é um manifesto à vida desacelerada e à comunhão com a natureza litorânea. Em Caraíva, onde não entram carros e as ruas continuam sendo de areia fofa, o tempo passa no compasso do encontro entre o rio de águas calmas e o mar aberto.\n\nCaminhar até a Praia do Espelho na maré baixa revela falésias monumentais em tons de ocre e branco debruçadas sobre piscinas naturais de cor turquesa límpida, onde corais formam refúgios de vida submarina.\n\nNo Quadrado de Trancoso, o gramado histórico diante da igrejinha de São João Batista ganha vida ao anoitecer com mesas à luz de velas sob amendoeiras frondosas, combinando o tempero inconfundível da moqueca baiana com uma hospitalidade calorosa e autêntica.',
      imageUrl: '/assets/feed/id120-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 121,
      title: 'A imponência vertical das Dolomitas no norte da Itália',
      caption: 'Erguendo-se dramaticamente no norte da Itália, as Dolomitas formam uma das cordilheiras mais impressionantes do continente europeu. Suas paredes verticais de rocha calcária possuem uma composição mineral única que produz o fenômeno da Enrosadira: ao nascer e ao pôr do sol, as montanhas brilham em tons incandescentes de rosa e dourado.\n\nTrilhas lendárias como o circuito ao redor das Três Cimes de Lavaredo ou a passagem pelo refúgio de montanha em Seceda revelam platôs verdes pontilhados por chalés de madeira e rebanhos de vacas alpinas pastando em paz.\n\nA cultura da região mistura com elegância influências austríacas e italianas, refletidas em pratos substanciais como canederli servidos com manteiga de sálvia e apfelstrudel quentinho após dias intensos de trekking e ar puro.',
      imageUrl: '/assets/feed/id121-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 122,
      title: 'Caminhos coloniais de pedra e casarios em Paraty',
      caption: 'Caminhar pelas ruas de pedras \'pé-de-moleque\' do Centro Histórico de Paraty é fazer uma viagem no tempo diretamente para o século XVIII. Os casarões coloniais de paredes caiadas de branco, com portas e janelas pintadas em cores vibrantes, contam histórias da rota do ouro e do café da Estrada Real.\n\nNas luas cheias, a maré sobe e invade delicadamente as ruas mais próximas ao cais, transformando a vila em um espelho d\'água cinematográfico que reflete as fachadas históricas e as montanhas cobertas pela Mata Atlântica ao fundo.\n\nPasseios de traineira ou escuna pelas águas calmas da Baía de Paraty levam a praias secretas como a do Sono e ilhas isoladas de mar calmo e transparente, perfeitas para nadar entre peixes e desfrutar do frescor da serra que encontra o mar.',
      imageUrl: '/assets/feed/id122-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 123,
      title: 'Lagos turquesa e picos nevados no Parque de Banff',
      caption: 'O Parque Nacional de Banff, nas Montanhas Rochosas de Alberta, parece ter sido desenhado por um pintor apaixonado pela natureza selvagem. O icônico Lake Louise, alimentado pelo derretimento do Glaciar Victoria, exibe um tom azul-turquesa leitoso tão intenso que parece retocado por filtros digitais.\n\nSubir pelas trilhas que levam ao Lake Agnes Tea House oferece vistas panorâmicas de florestas densas de coníferas e vales glaciares profundos, com paradas para degustar chás fumegantes em cabanas de madeira construídas no início do século passado.\n\nA vida selvagem no parque é abundante e protegida com rigor exemplar: é comum avistar alces pastando em campos abertos, bodes-das-rochosas escalando encostas íngremes e, com sorte e distância respeitosa, ursos-grizzly forrageando frutas silvestres no verão.',
      imageUrl: '/assets/feed/id123-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 124,
      title: 'Aromas da cozinha mineira e serras de Monte Verde',
      caption: 'Encravada no alto da Serra da Mantiqueira, a charmosa vila de Monte Verde combina o melhor da hospitalidade mineira com o clima europeu de montanha. A mais de 1.500 metros de altitude, o ar é perfumado pelo aroma de pinheiros e pelo aroma tentador de pão de queijo quentinho saindo do forno.\n\nAs trilhas da região, como a subida à Pedra Redonda e ao Chapéu do Bispo, oferecem caminhadas acessíveis que terminam em mirantes espetaculares de 360 graus sobre o mar de morros que divide Minas Gerais e São Paulo.\n\nÀ noite, o centrinho iluminado convida a passear sem pressa entre ateliês de cerâmica, empórios de queijo da canastra curado, cachaças artesanais e restaurantes que servem trutas frescas grelhadas acompanhadas de vinhos locais.',
      imageUrl: '/assets/feed/id124-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 125,
      title: 'O espetáculo do céu ao amanhecer na Capadócia',
      caption: 'Poucas experiências de viagem no mundo conseguem rivalizar com a poesia visual de acordar antes do sol nascer na Capadócia. No vale de Göreme, o horizonte lentamente se preenche com mais de uma centena de balões de ar quente inflando em uníssono, subindo suavemente ao céu enquanto os primeiros raios solares douram as formações rochosas esculpidas pela erosão e pela cinza vulcânica milenar.\n\nLá de cima, a sensação é de flutuar em silêncio sobre chaminés de fadas, mosteiros escavados na rocha e cidades subterrâneas como Derinkuyu, onde civilizações antigas encontraram refúgio contra invasões.\n\nFicar hospedado em um autêntico hotel-caverna esculpido na encosta da montanha e tomar café da manhã no terraço observando o balé multicolorido dos balões no céu é um daqueles momentos que justificam qualquer viagem.',
      imageUrl: '/assets/feed/id125-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    }
  ];

  // ==================== INTERLEAVING 40 ITEMS ====================
  private clonePost(post: Post): Post {
    const hasLocalArticleGallery =
      post.id === 8 ||
      (post.id >= 17 && post.id <= 20) ||
      (post.id >= 101 && post.id <= 125);

    const galleryImages = hasLocalArticleGallery
      ? [1, 2, 3].map(index => `/assets/feed/id${post.id}-${index}.webp`)
      : (post.imageUrl ? [post.imageUrl] : []);

    return {
      ...post,
      galleryImages,
      thisOrThatOptions: post.thisOrThatOptions
        ? post.thisOrThatOptions.map(opt => ({ ...opt }))
        : undefined,
      triviaData: post.triviaData
        ? { ...post.triviaData, options: [...post.triviaData.options] }
        : undefined
    };
  }

  private buildFeed(backendPosts: Post[]): Post[] {
    const backendItems: Post[] = backendPosts.map(rawPost => {
      const post = this.clonePost(rawPost);
      post.postType = (post.postType === 'THIS_OR_THAT' || post.postType === 'TRIVIA'
        ? post.postType
        : 'ARTICLE') as Post['postType'];

      // Garante que todos os 10 duelos "Isso ou Aquilo" usem as imagens WebP locais definitivas
      if (post.postType === 'THIS_OR_THAT') {
        const matchedCurated = this.curatedThisOrThat.find(
          c => c.title?.trim().toLowerCase() === post.title?.trim().toLowerCase()
        );
        if (matchedCurated?.thisOrThatOptions && post.thisOrThatOptions?.length === 2) {
          post.thisOrThatOptions[0].image = matchedCurated.thisOrThatOptions[0].image;
          post.thisOrThatOptions[1].image = matchedCurated.thisOrThatOptions[1].image;
        } else if (matchedCurated?.thisOrThatOptions && (!post.thisOrThatOptions || post.thisOrThatOptions.length < 2)) {
          post.thisOrThatOptions = matchedCurated.thisOrThatOptions.map(opt => ({ ...opt }));
        }
      }

      return post;
    });

    const backendIds = new Set(backendItems.map(p => p.id));

    const articles = backendItems.filter(post => post.postType === 'ARTICLE');
    const thisOrThat = backendItems.filter(post => post.postType === 'THIS_OR_THAT');
    const trivias = backendItems.filter(post => post.postType === 'TRIVIA');

    const hasEquivalentItem = (items: Post[], candidate: Post): boolean => items.some(item =>
      item.id === candidate.id ||
      item.title?.trim().toLowerCase() === candidate.title?.trim().toLowerCase()
    );

    for (const curated of this.curatedArticles) {
      if (!hasEquivalentItem(articles, curated)) articles.push(this.clonePost(curated));
    }

    for (const curated of this.curatedThisOrThat) {
      if (thisOrThat.length >= 10) break;
      if (!hasEquivalentItem(thisOrThat, curated)) thisOrThat.push(this.clonePost(curated));
    }

    for (const curated of this.curatedTrivias) {
      if (trivias.length >= 5) break;
      if (!hasEquivalentItem(trivias, curated)) trivias.push(this.clonePost(curated));
    }

    const finalArticles = this.shufflePosts(articles);
    const finalThisOrThat = thisOrThat.slice(0, 10);
    const finalTrivias = trivias.slice(0, 5);

    // Cadência rítmica misturando Artigos, Isso-ou-Aquilo e Trivias
    const mixedFeed: Post[] = [];
    let aIdx = 0;
    let iIdx = 0;
    let tIdx = 0;

    for (let round = 0; round < 5; round++) {
      if (aIdx < finalArticles.length) mixedFeed.push(finalArticles[aIdx++]);
      if (aIdx < finalArticles.length) mixedFeed.push(finalArticles[aIdx++]);
      if (iIdx < finalThisOrThat.length) mixedFeed.push(finalThisOrThat[iIdx++]);
      if (aIdx < finalArticles.length) mixedFeed.push(finalArticles[aIdx++]);
      if (aIdx < finalArticles.length) mixedFeed.push(finalArticles[aIdx++]);
      if (iIdx < finalThisOrThat.length) mixedFeed.push(finalThisOrThat[iIdx++]);
      if (aIdx < finalArticles.length) mixedFeed.push(finalArticles[aIdx++]);
      if (tIdx < finalTrivias.length) mixedFeed.push(finalTrivias[tIdx++]);
    }
    while (aIdx < finalArticles.length) {
      mixedFeed.push(finalArticles[aIdx++]);
    }

    const isAuth = this.authService.isAuthenticated();
    const userInteractions = isAuth ? this.loadStoredUserInteractions() : {};
    const currentSelections = isAuth ? { ...this.thisOrThatSelection() } : {};
    const currentTrivias = isAuth ? this.triviaSelection() : {};
    const validInteractedIds = new Set<number>();

    for (const p of mixedFeed) {
      const isFromBackend = backendIds.has(p.id);

      if (p.postType === 'THIS_OR_THAT') {
        if (!isAuth) {
          p.userInteraction = null;
          p.userOptionId = null;
          continue;
        }
        if (isFromBackend) {
          if (p.userInteraction === 'VOTE' && p.userOptionId) {
            currentSelections[p.id] = p.userOptionId;
            validInteractedIds.add(p.id);
          } else {
            delete currentSelections[p.id];
            p.userInteraction = null;
            p.userOptionId = null;
          }
        } else if (currentSelections[p.id] !== undefined) {
          validInteractedIds.add(p.id);
        }
        continue;
      }

      if (p.postType === 'TRIVIA') {
        if (isAuth && currentTrivias[p.id] !== undefined) {
          validInteractedIds.add(p.id);
        }
        continue;
      }

      if (!isAuth) {
        p.userInteraction = null;
        continue;
      }

      const backendInt = (p.userInteraction === 'LIKE' || p.userInteraction === 'DISLIKE')
        ? p.userInteraction
        : null;
      const localInt = userInteractions[p.id] || null;

      // Se o post veio do backend (PostgreSQL), o banco é a fonte única da verdade para curtidas do usuário
      const effectiveInt = isFromBackend ? backendInt : (backendInt || localInt || null);

      p.userInteraction = effectiveInt;
      p.likesCount = p.likesCount ?? 0;
      p.dislikesCount = p.dislikesCount ?? 0;

      if (effectiveInt) {
        userInteractions[p.id] = effectiveInt;
        validInteractedIds.add(p.id);
      } else {
        delete userInteractions[p.id];
      }
    }

    this.thisOrThatSelection.set(currentSelections);
    this.interactedPostIds.set(Array.from(validInteractedIds));

    if (typeof localStorage !== 'undefined' && isAuth) {
      localStorage.setItem(this.getThisOrThatStorageKey(), JSON.stringify(currentSelections));
      localStorage.setItem(this.getUserInteractionsStorageKey(), JSON.stringify(userInteractions));
      localStorage.setItem(this.getInteractionsStorageKey(), JSON.stringify(Array.from(validInteractedIds)));
    }
    this.syncCouponIfEligible();

    return mixedFeed;
  }

  private shufflePosts(posts: Post[]): Post[] {
    const shuffled = [...posts];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.feedService.getPosts().subscribe({
      next: (data) => {
        const mixed = this.buildFeed(data || []);
        this.posts.set(mixed);
        this.isLoading.set(false);
        this.triggerFeedAnimation();
        this.checkInitialPostNavigation(mixed);
      },
      error: () => {
        const mixed = this.buildFeed([]);
        this.posts.set(mixed);
        this.isLoading.set(false);
        this.triggerFeedAnimation();
        this.checkInitialPostNavigation(mixed);
      }
    });
  }

  private checkInitialPostNavigation(posts: Post[]): void {
    const rawId = this.route.snapshot.queryParams['post'] || this.route.snapshot.fragment?.replace('post-', '');
    const postId = Number(rawId);
    if (postId) {
      const found = posts.find(p => p.id === postId);
      if (found) {
        setTimeout(() => {
          this.openArticleReader(found);
          const el = document.getElementById(`post-${postId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 350);
      }
    }
  }

  selectThisOrThat(postId: number, optionId: number): void {
    if (!this.authService.isAuthenticated()) {
      this.showGuestAuthModal.set(true);
      return;
    }

    if (!this.thisOrThatSelection()[postId]) {
      this.thisOrThatSelection.update(s => ({ ...s, [postId]: optionId }));
      this.recordInteraction(postId);
      if (typeof localStorage !== 'undefined') {
        const key = this.getThisOrThatStorageKey();
        localStorage.setItem(key, JSON.stringify(this.thisOrThatSelection()));
      }

      // Atualiza o contador de votos diretamente nas opções do post
      const updatedPosts = this.posts().map(p => {
        if (p.id === postId && p.thisOrThatOptions) {
          return {
            ...p,
            userInteraction: 'VOTE' as const,
            userOptionId: optionId,
            thisOrThatOptions: p.thisOrThatOptions.map(o =>
              o.id === optionId ? { ...o, votes: (o.votes || 0) + 1 } : o
            )
          };
        }
        return p;
      });
      this.posts.set(updatedPosts);

      const currentComm = { ...this.communityVotes() };
      const postVotes = { ...(currentComm[postId] || {}) };
      postVotes[optionId] = (postVotes[optionId] || 0) + 1;
      currentComm[postId] = postVotes;
      this.communityVotes.set(currentComm);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('horizon_this_or_that_community_votes', JSON.stringify(currentComm));
      }

      this.feedService.clearCache();
      this.feedService.interact(postId, 'VOTE', optionId).subscribe({
        next: () => console.log('Voto registrado:', optionId),
        error: () => { /* Ignora 404 para mock posts */ }
      });
    }
  }

  resetThisOrThat(postId: number): void {
    const currentSelection = this.thisOrThatSelection()[postId];
    if (currentSelection) {
      // Remove da seleção local
      const newSelection = { ...this.thisOrThatSelection() };
      delete newSelection[postId];
      this.thisOrThatSelection.set(newSelection);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getThisOrThatStorageKey(), JSON.stringify(newSelection));
      }

      // Decrementa o contador de votos diretamente nas opções do post
      const updatedPosts = this.posts().map(p => {
        if (p.id === postId && p.thisOrThatOptions) {
          return {
            ...p,
            userInteraction: null,
            userOptionId: null,
            thisOrThatOptions: p.thisOrThatOptions.map(o =>
              o.id === currentSelection ? { ...o, votes: Math.max(0, (o.votes || 0) - 1) } : o
            )
          };
        }
        return p;
      });
      this.posts.set(updatedPosts);

      // Remove voto da comunidade local
      const currentComm = { ...this.communityVotes() };
      if (currentComm[postId] && currentComm[postId][currentSelection] > 0) {
        currentComm[postId][currentSelection] -= 1;
        this.communityVotes.set(currentComm);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('horizon_this_or_that_community_votes', JSON.stringify(currentComm));
        }
      }
      this.removeInteraction(postId);
      this.feedService.clearCache();
      this.feedService.interact(postId, 'VOTE', currentSelection).subscribe({ error: () => {} });
    }
  }

  getVoteCount(post: Post, opt: any): number {
    if (opt?.votes !== undefined && opt?.votes !== null) {
      return opt.votes;
    }
    const postVotes = this.communityVotes()[post.id];
    if (postVotes && postVotes[opt.id] !== undefined) {
      return postVotes[opt.id];
    }
    return 0;
  }

  getVotePercentage(post: Post, opt: any): number {
    if (!post.thisOrThatOptions || post.thisOrThatOptions.length === 0) return 0;
    let total = 0;
    for (const o of post.thisOrThatOptions) {
      total += this.getVoteCount(post, o);
    }
    if (total === 0) return 0;
    const myVotes = this.getVoteCount(post, opt);
    return Math.round((myVotes / total) * 100);
  }

  selectTrivia(postId: number, optionIndex: number): void {
    if (!this.authService.isAuthenticated()) {
      this.showGuestAuthModal.set(true);
      return;
    }

    if (this.triviaSelection()[postId] === undefined) {
      this.triviaSelection.update(s => ({ ...s, [postId]: optionIndex }));
      this.recordInteraction(postId);
      if (typeof localStorage !== 'undefined') {
        const key = this.getTriviaStorageKey();
        localStorage.setItem(key, JSON.stringify(this.triviaSelection()));
      }
    }
  }

  getPostPreview(caption?: string): string {
    if (!caption) return '';
    const maxLen = 260;
    if (caption.length <= maxLen) return caption;
    return caption.substring(0, maxLen).trim() + '...';
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
      return [1, 2, 3].map(index => `/assets/feed/id${post.id}-${index}.webp`);
    }

    return post.imageUrl ? [post.imageUrl] : [];
  }

  getActiveImage(post: Post): string {
    const list = this.getPostImages(post);
    const idx = (this.activeImageIndex()[post.id] ?? 0) % list.length;
    return list[idx];
  }

  // ==================== CAROUSEL DRAG & SWIPE ====================

  onMouseDown(event: MouseEvent, postId: number, trackEl: HTMLElement): void {
    this.isDragging[postId] = true;
    this.startX[postId] = event.pageX - trackEl.offsetLeft;
    this.scrollLeftPos[postId] = trackEl.scrollLeft;
  }

  onMouseMove(event: MouseEvent, postId: number, trackEl: HTMLElement): void {
    if (!this.isDragging[postId]) return;
    event.preventDefault();
    const x = event.pageX - trackEl.offsetLeft;
    const walk = (x - this.startX[postId]) * 1.5;
    trackEl.scrollLeft = this.scrollLeftPos[postId] - walk;
  }

  onMouseUp(postId: number, trackEl: HTMLElement): void {
    if (this.isDragging[postId]) {
      this.isDragging[postId] = false;
      const slideWidth = trackEl.clientWidth;
      if (slideWidth > 0) {
        const targetIndex = Math.round(trackEl.scrollLeft / slideWidth);
        trackEl.scrollTo({ left: targetIndex * slideWidth, behavior: 'smooth' });
        this.activeImageIndex.update(m => ({ ...m, [postId]: targetIndex }));
      }
    }
  }

  onCarouselScroll(postId: number, trackEl: HTMLElement): void {
    if (this.isDragging[postId]) return;
    const slideWidth = trackEl.clientWidth;
    if (slideWidth > 0) {
      const idx = Math.round(trackEl.scrollLeft / slideWidth);
      if (this.activeImageIndex()[postId] !== idx) {
        this.activeImageIndex.update(m => ({ ...m, [postId]: idx }));
      }
    }
  }

  scrollCarousel(post: Post, direction: number, event: Event, trackEl: HTMLElement): void {
    event.stopPropagation();
    const total = this.getPostImages(post).length;
    const current = this.activeImageIndex()[post.id] ?? 0;
    let nextIdx = current + direction;
    if (nextIdx < 0) nextIdx = total - 1;
    if (nextIdx >= total) nextIdx = 0;

    trackEl.scrollTo({ left: nextIdx * trackEl.clientWidth, behavior: 'smooth' });
    this.activeImageIndex.update(m => ({ ...m, [post.id]: nextIdx }));
  }

  goToSlide(post: Post, index: number, event: Event, trackEl: HTMLElement): void {
    event.stopPropagation();
    trackEl.scrollTo({ left: index * trackEl.clientWidth, behavior: 'smooth' });
    this.activeImageIndex.update(m => ({ ...m, [post.id]: index }));
  }

  nextImage(post: Post, event: Event): void {
    event.stopPropagation();
    const total = this.getPostImages(post).length;
    const current = this.activeImageIndex()[post.id] ?? 0;
    this.activeImageIndex.update(m => ({ ...m, [post.id]: (current + 1) % total }));
  }

  prevImage(post: Post, event: Event): void {
    event.stopPropagation();
    const total = this.getPostImages(post).length;
    const current = this.activeImageIndex()[post.id] ?? 0;
    this.activeImageIndex.update(m => ({ ...m, [post.id]: (current - 1 + total) % total }));
  }

  // ==================== INTERACTION & MODAL ====================

  openArticleReader(post: Post): void {
    this.selectedArticle.set(post);
    this.articleRead.set(true);
    const uid = this.tokenStorage.getUserId();
    if (uid && typeof localStorage !== 'undefined') {
      localStorage.setItem(`articleRead_${uid}`, 'true');
    }
    this.syncCouponIfEligible();
    setTimeout(() => {
      const backdrop = document.querySelector('.modal-article-backdrop');
      const dialog = document.querySelector('.modal-article-dialog');
      if (backdrop) animate(backdrop, { opacity: [0, 0.65] }, { duration: 0.3 });
      if (dialog) animate(dialog, { opacity: [0, 1], scale: [0.95, 1] }, { duration: 0.4, ease: 'easeOut' });
    }, 10);
  }

  closeArticleReader(): void {
    const backdrop = document.querySelector('.modal-article-backdrop');
    const dialog = document.querySelector('.modal-article-dialog');
    if (dialog && backdrop) {
      animate(dialog, { opacity: [1, 0], scale: [1, 0.95] }, { duration: 0.2 });
      animate(backdrop, { opacity: [0.65, 0] }, { duration: 0.2 }).finished.then(() => {
        this.selectedArticle.set(null);
      });
    } else {
      this.selectedArticle.set(null);
    }
  }

  toggleInteraction(post: Post, type: 'LIKE' | 'DISLIKE', event?: Event): void {
    if (!this.authService.isAuthenticated()) {
      this.showGuestAuthModal.set(true);
      return;
    }

    if (event) {
      const btn = event.currentTarget as HTMLElement;
      if (btn) animate(btn, { scale: [1, 1.2, 0.9, 1] }, { duration: 0.4, ease: 'easeOut' });
    }

    const postId = post.id;
    const currentInteraction = post.userInteraction ?? null;
    let updatedLikes = post.likesCount ?? 0;
    let updatedDislikes = post.dislikesCount ?? 0;

    if (currentInteraction === type) {
      if (type === 'LIKE') updatedLikes = Math.max(0, updatedLikes - 1);
      if (type === 'DISLIKE') updatedDislikes = Math.max(0, updatedDislikes - 1);
      this.removeInteraction(postId);
      this.updatePostState(postId, null, updatedLikes, updatedDislikes);
      this.feedService.clearCache();
      this.feedService.interact(postId, type).subscribe({
        error: () => { /* Ignora 404 para mock posts */ }
      });
      return;
    }

    if (currentInteraction === 'LIKE') updatedLikes = Math.max(0, updatedLikes - 1);
    if (currentInteraction === 'DISLIKE') updatedDislikes = Math.max(0, updatedDislikes - 1);

    if (type === 'LIKE') {
      updatedLikes++;
    }
    if (type === 'DISLIKE') {
      updatedDislikes++;
    }

    this.recordInteraction(postId);
    this.updatePostState(postId, type, updatedLikes, updatedDislikes);
    this.feedService.clearCache();
    this.feedService.interact(postId, type).subscribe({
      error: () => { /* Ignora 404 para mock posts */ }
    });
  }

  private updatePostState(postId: number, interaction: 'LIKE' | 'DISLIKE' | null, likes: number, dislikes: number): void {
    const updated = this.posts().map(p => {
      if (p.id === postId) {
        return { ...p, userInteraction: interaction, likesCount: likes, dislikesCount: dislikes };
      }
      return p;
    });
    this.posts.set(updated);

    if (this.selectedArticle()?.id === postId) {
      this.selectedArticle.update(curr => curr ? { ...curr, userInteraction: interaction, likesCount: likes, dislikesCount: dislikes } : null);
    }

    if (typeof localStorage !== 'undefined') {
      const stored = this.loadStoredUserInteractions();
      if (interaction) {
        stored[postId] = interaction;
      } else {
        delete stored[postId];
      }
      localStorage.setItem(this.getUserInteractionsStorageKey(), JSON.stringify(stored));
    }
  }

  handleImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80&fm=webp';
  }
}












