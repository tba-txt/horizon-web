import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FeedService } from '../services/feed.service';
import { Post } from '../models/feed.model';

@Component({
  selector: 'app-feed-main',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/feed.webp" 
        alt="Feed Hero" 
        class="w-100 hero-image"
        (error)="handleHeroError($event)"
      />
    </header>

    <main class="container py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-10 col-lg-7">
          
          <div class="mb-4 text-center">
            <h1 class="h3 fw-bold text-dark mb-0">Feed</h1>
          </div>

          <!-- Estado: Loading -->
          @if (isLoading()) {
            <div class="d-flex flex-column align-items-center justify-content-center py-5">
              <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Carregando feed...</span>
              </div>
              <p class="text-muted fw-medium">Buscando publicações...</p>
            </div>
          }

          <!-- Estado: Erro -->
          @else if (errorMessage()) {
            <div class="alert alert-danger d-flex flex-column align-items-center justify-content-center p-4 my-4 rounded-3 text-center" role="alert">
              <h5 class="fw-bold mb-2">Não foi possível carregar o feed.</h5>
              <p class="mb-3 small text-danger-emphasis">{{ errorMessage() }}</p>
              <button class="btn btn-outline-danger btn-sm px-4" (click)="loadPosts()">
                Tentar novamente
              </button>
            </div>
          }

          <!-- Estado: Lista Vazia -->
          @else if (posts().length === 0) {
            <div class="text-center py-5 bg-light rounded-4 border">
              <h4 class="fw-bold text-secondary mb-2">Nenhum post publicado ainda</h4>
              <p class="text-muted mb-0">Volte mais tarde para novas inspirações de viagem.</p>
            </div>
          }

          <!-- Estado: Lista de Posts -->
          @else {
            <div class="d-flex flex-column gap-4">
              @for (post of posts(); track post.id) {
                <article class="card border shadow-sm rounded-4 overflow-hidden post-card bg-white">
                  
                  <!-- Imagem do Post -->
                  @if (post.imageUrl) {
                    <div class="position-relative post-image-wrapper">
                      <img 
                        [src]="getOptimizedImageUrl(post.imageUrl)" 
                        [alt]="post.title" 
                        class="w-100 h-100 object-fit-cover"
                        loading="lazy"
                        (error)="handleImageError($event)"
                      />
                    </div>
                  }

                  <!-- Conteúdo do Post -->
                  <div class="card-body p-4">
                    <h2 class="h5 fw-bold text-dark mb-2">{{ post.title }}</h2>

                    @if (post.caption) {
                      <p class="text-secondary mb-3">
                        {{ post.caption }}
                      </p>
                    }

                    <!-- Ações de Interação (Like / Dislike) -->
                    <div class="d-flex align-items-center gap-2 pt-2 border-top">
                      <!-- Botão LIKE -->
                      <button 
                        type="button"
                        class="btn btn-interaction d-flex align-items-center gap-2 rounded-pill px-3 py-2"
                        [class.btn-liked]="post.userInteraction === 'LIKE'"
                        [disabled]="interactingPosts()[post.id]"
                        (click)="toggleInteraction(post, 'LIKE')"
                      >
                        <span>👍</span>
                        <span class="fw-semibold small">Gostei</span>
                        @if (post.likesCount !== undefined && post.likesCount !== null) {
                          <span class="badge rounded-pill bg-light text-dark ms-1">
                            {{ post.likesCount }}
                          </span>
                        }
                      </button>

                      <!-- Botão DISLIKE -->
                      <button 
                        type="button"
                        class="btn btn-interaction d-flex align-items-center gap-2 rounded-pill px-3 py-2"
                        [class.btn-disliked]="post.userInteraction === 'DISLIKE'"
                        [disabled]="interactingPosts()[post.id]"
                        (click)="toggleInteraction(post, 'DISLIKE')"
                      >
                        <span>👎</span>
                        <span class="fw-semibold small">Não Gostei</span>
                        @if (post.dislikesCount !== undefined && post.dislikesCount !== null) {
                          <span class="badge rounded-pill bg-light text-dark ms-1">
                            {{ post.dislikesCount }}
                          </span>
                        }
                      </button>
                    </div>

                  </div>

                </article>
              }
            </div>
          }

        </div>
      </div>
    </main>

    <!-- Footer -->
    <app-footer></app-footer>
  `,
  styles: [`
    .hero-container {
      width: 100%;
      background: #0b2545;
      max-height: 480px;
    }

    .hero-image {
      width: 100%;
      height: 480px;
      object-fit: cover;
      display: block;
    }

    .post-card {
      border-color: #e2e8f0;
      transition: box-shadow 0.2s ease;
    }

    .post-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06) !important;
    }

    .post-image-wrapper {
      max-height: 440px;
      min-height: 280px;
      background: #f8fafc;
      overflow: hidden;
    }

    .object-fit-cover {
      object-fit: cover;
    }

    .btn-interaction {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      color: #334155;
      transition: all 0.2s ease;
    }

    .btn-interaction:hover:not(:disabled) {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .btn-liked {
      background: #e0f2fe !important;
      border-color: #0284c7 !important;
      color: #0369a1 !important;
    }

    .btn-liked .badge {
      background: #0284c7 !important;
      color: #fff !important;
    }

    .btn-disliked {
      background: #fee2e2 !important;
      border-color: #ef4444 !important;
      color: #b91c1c !important;
    }

    .btn-disliked .badge {
      background: #ef4444 !important;
      color: #fff !important;
    }
  `]
})
export class FeedMainComponent implements OnInit {
  private feedService = inject(FeedService);

  posts = signal<Post[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  interactingPosts = signal<Record<number, boolean>>({});

  readonly placeholderImage = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop';
  readonly placeholderHero = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop';

  handleHeroError(event: any): void {
    event.target.src = this.placeholderHero;
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.feedService.getPosts().subscribe({
      next: (data) => {
        this.posts.set(data || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao buscar publicações do feed.');
      }
    });
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  getOptimizedImageUrl(url?: string): string {
    if (!url) return this.placeholderImage;
    if (url.includes('images.unsplash.com') && !url.includes('w=')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}auto=format&fit=crop&w=800&q=80`;
    }
    return url;
  }

  toggleInteraction(post: Post, type: 'LIKE' | 'DISLIKE'): void {
    const postId = post.id;
    const currentInteraction = post.userInteraction ?? null;
    const prevLikes = post.likesCount ?? 0;
    const prevDislikes = post.dislikesCount ?? 0;

    this.interactingPosts.update(map => ({ ...map, [postId]: true }));

    // Se já está ativo esse tipo, o segundo clique remove a interação (toggle off)
    if (currentInteraction === type) {
      const updatedLikes = type === 'LIKE' ? Math.max(0, prevLikes - 1) : prevLikes;
      const updatedDislikes = type === 'DISLIKE' ? Math.max(0, prevDislikes - 1) : prevDislikes;

      this.updatePostState(postId, null, updatedLikes, updatedDislikes);

      this.feedService.interact(postId, type).subscribe({
        next: () => {
          this.interactingPosts.update(map => ({ ...map, [postId]: false }));
        },
        error: (err) => {
          console.error('Falha ao remover interação', err);
          this.updatePostState(postId, currentInteraction, prevLikes, prevDislikes);
          this.interactingPosts.update(map => ({ ...map, [postId]: false }));
        }
      });
      return;
    }

    // Caso seja ativação ou troca (LIKE <-> DISLIKE)
    let updatedLikes = prevLikes;
    let updatedDislikes = prevDislikes;

    if (currentInteraction === 'LIKE') {
      updatedLikes = Math.max(0, updatedLikes - 1);
    } else if (currentInteraction === 'DISLIKE') {
      updatedDislikes = Math.max(0, updatedDislikes - 1);
    }

    if (type === 'LIKE') {
      updatedLikes += 1;
    } else {
      updatedDislikes += 1;
    }

    this.updatePostState(postId, type, updatedLikes, updatedDislikes);

    this.feedService.interact(postId, type).subscribe({
      next: () => {
        this.interactingPosts.update(map => ({ ...map, [postId]: false }));
      },
      error: (err) => {
        console.error('Falha ao registrar interação', err);
        this.updatePostState(postId, currentInteraction, prevLikes, prevDislikes);
        this.interactingPosts.update(map => ({ ...map, [postId]: false }));
      }
    });
  }

  private updatePostState(postId: number, interaction: 'LIKE' | 'DISLIKE' | null, likes: number, dislikes: number): void {
    const updated = this.posts().map(p => {
      if (p.id === postId) {
        return {
          ...p,
          userInteraction: interaction,
          likesCount: likes,
          dislikesCount: dislikes
        };
      }
      return p;
    });
    this.posts.set(updated);
  }
}
