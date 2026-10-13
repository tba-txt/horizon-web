import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { animate, stagger } from 'motion';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FeedService } from '../services/feed.service';
import { Post } from '../models/feed.model';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';

@Component({
  selector: 'app-feed-main',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, PlaneLoaderComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/feed.webp" 
        alt="Feed de Histórias e Crônicas de Viagem" 
        class="w-100 hero-image"
        fetchpriority="high"
        (error)="handleImageError($event)"
      />
    </header>

    <main class="container-fluid px-3 px-xl-5 py-4 py-lg-5" style="max-width: 1240px; margin-top: 0;">
      
      <!-- Layout em 2 Colunas: Centro (Feed Editorial) | Direita (Quiz CTA) -->
      <div class="row g-4 justify-content-center">

        <!-- ==================== COLUNA PRINCIPAL: FEED ==================== -->
        <div class="col-12 col-lg-8">
          
          <section class="mb-4">
            <h1 class="h2 fw-bold text-dark mb-3">Feed</h1>

            <div class="row g-3 align-items-center pt-2 pb-3 border-bottom">
              <div class="col-12 col-md-7">
                <div class="input-group">
                  <span class="input-group-text bg-white border-end-0 text-muted" aria-hidden="true">
                    <i class="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    class="form-control border-start-0 ps-0" 
                    placeholder="Buscar crônicas, dicas, experiências..."
                    [ngModel]="searchQuery()" 
                    (ngModelChange)="searchQuery.set($event)" 
                    aria-label="Buscar crônicas, dicas e experiências"
                  />
                  @if (searchQuery()) {
                    <button class="btn btn-outline-secondary border-start-0" type="button" (click)="searchQuery.set('')" aria-label="Limpar campo de busca">
                      <i class="bi bi-x-lg" aria-hidden="true"></i>
                    </button>
                  }
                </div>
              </div>

              <div class="col-12 col-md-5 d-flex justify-content-md-end align-items-center gap-2">
                <div class="btn-group btn-group-sm rounded-pill p-1 bg-light border" role="group" aria-label="Ordenar artigos">
                  <button 
                    type="button" 
                    class="btn rounded-pill px-3 fw-semibold"
                    [class.btn-primary]="sortBy() === 'recent'"
                    [class.btn-light]="sortBy() !== 'recent'"
                    [attr.aria-pressed]="sortBy() === 'recent'"
                    (click)="sortBy.set('recent')"
                  >
                    Recentes
                  </button>
                  <button 
                    type="button" 
                    class="btn rounded-pill px-3 fw-semibold"
                    [class.btn-primary]="sortBy() === 'popular'"
                    [class.btn-light]="sortBy() !== 'popular'"
                    [attr.aria-pressed]="sortBy() === 'popular'"
                    (click)="sortBy.set('popular')"
                  >
                    Populares
                  </button>
                </div>
              </div>
            </div>
          </section>

          @if (isLoading()) {
            <div class="d-flex align-items-center justify-content-center py-5" aria-live="polite">
              <app-plane-loader></app-plane-loader>
            </div>
          } @else if (filteredPosts().length === 0) {
            <div class="text-center py-5 bg-white rounded-4 border shadow-sm p-4" aria-live="polite">
              <i class="bi bi-journal-x fs-1 text-secondary mb-2 d-block" aria-hidden="true"></i>
              <h3 class="h5 fw-bold text-dark mb-1">Nenhum artigo encontrado</h3>
              <p class="text-muted small mb-3">Tente mudar os termos de busca.</p>
              <button class="btn btn-outline-primary btn-sm rounded-pill px-4 fw-semibold" (click)="clearFilters()">
                Limpar Busca
              </button>
            </div>
          } @else {
            <div class="d-flex flex-column gap-5 feed-container">
              @for (post of displayedPosts(); track post.id) {
                <article class="card border-0 shadow-sm rounded-4 overflow-hidden post-card bg-white mb-4">
                  
                  @if (post.postType === 'THIS_OR_THAT') {
                    <div class="card-body p-4 p-md-5 bg-white text-center">
                      <div class="mb-4">
                        <span class="badge rounded-3 px-3 py-2 mb-2" style="background-color: #5BA4D8; color: white; font-weight: 600; font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase;">
                          <i class="bi bi-arrows-collapse me-1"></i> Isso ou Aquilo
                        </span>
                        <h2 class="h4 fw-bold text-dark lh-sm mb-0" style="font-family: var(--font-heading);">Selecione apenas uma opção</h2>
                      </div>
                      
                      <div class="this-or-that-container position-relative">
                        <div class="row g-2 justify-content-center position-relative">
                          <!-- Botão Central VS -->
                          <div class="vs-badge position-absolute top-50 start-50 translate-middle bg-white text-dark fw-bold rounded-circle shadow-sm d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; font-size: 1.1rem; font-family: var(--font-heading); border: 4px solid #fff; z-index: 10; transition: opacity 0.5s ease; pointer-events: none;" [style.opacity]="thisOrThatSelection()[post.id] ? '0' : '1'">
                            VS
                          </div>
                          
                          @for (opt of post.thisOrThatOptions; track opt.id; let idx = $index) {
                            <div class="col-6">
                              <div 
                                class="this-or-that-card position-relative overflow-hidden"
                                [class.voted]="thisOrThatSelection()[post.id] === opt.id"
                                [class.dimmed]="thisOrThatSelection()[post.id] && thisOrThatSelection()[post.id] !== opt.id"
                                [class.rounded-start-4]="idx === 0"
                                [class.rounded-end-4]="idx === 1"
                                (click)="selectThisOrThat(post.id, opt.id)"
                                style="cursor: pointer; height: 320px; transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1); border: none !important;"
                              >
                                @if (opt.image) {
                                  <img [src]="opt.image" loading="lazy" decoding="async" class="w-100 h-100 object-fit-cover option-img" style="transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);" alt="Option" (error)="handleImageError($event)">
                                } @else {
                                  <div class="w-100 h-100 d-flex flex-column align-items-center justify-content-center" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);">
                                    <i class="bi bi-image text-white-50" style="font-size: 2.5rem; opacity: 0.35;"></i>
                                  </div>
                                }
                                
                                <!-- Gradiente Overlay -->
                                <div class="position-absolute inset-0 w-100 h-100" style="background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 50%, transparent 100%); transition: opacity 0.6s ease;"></div>
                                
                                <!-- Conteúdo (Texto e Votos) -->
                                <div class="position-absolute bottom-0 start-0 w-100 p-3 p-md-4 text-start z-2 d-flex flex-column justify-content-end">
                                  <h3 class="h5 text-white fw-bold mb-2 option-label" style="text-shadow: 0 2px 10px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.8); transition: transform 0.4s ease;">{{ opt.label }}</h3>
                                  
                                  <!-- Votação (Porcentagem + Quantidade de Votos com Sombra Preta) -->
                                  @if (thisOrThatSelection()[post.id]) {
                                    <div class="vote-stats-container mt-1 animate-fade-in">
                                      <div class="d-flex align-items-baseline gap-2 text-white flex-wrap">
                                        <span class="fw-black fs-3 lh-1 text-white" style="color: #ffffff; text-shadow: 0 2px 8px rgba(0, 0, 0, 0.95), 0 0 16px rgba(0, 0, 0, 0.9);">{{ getVotePercentage(post, opt) }}%</span>
                                        <span class="text-white fw-semibold" style="font-size: 0.85rem; text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95), 0 0 10px rgba(0, 0, 0, 0.9);">
                                          • {{ getVoteCount(post, opt) }} {{ getVoteCount(post, opt) === 1 ? 'voto' : 'votos' }}
                                        </span>
                                      </div>
                                    </div>
                                  }
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                        
                        <div class="d-flex justify-content-center" style="min-height: 40px; margin-top: 1rem; transition: opacity 0.6s ease;" [style.opacity]="thisOrThatSelection()[post.id] ? '1' : '0'">
                          @if (thisOrThatSelection()[post.id]) {
                            <button class="btn btn-sm text-white fw-semibold px-4 rounded-3 shadow-sm" style="background-color: #65A30D; border: none; font-size: 0.8rem;" (click)="resetThisOrThat(post.id)">
                              <i class="bi bi-arrow-counterclockwise me-1"></i> Refazer Escolha
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  } @else if (post.postType === 'TRIVIA') {
                    <div class="card-body p-4 p-md-5 text-center text-white trivia-card-body" style="background: linear-gradient(rgba(11, 37, 69, 0.45), rgba(11, 37, 69, 0.55)), url('assets/trivia-bg.webp') center/cover no-repeat;">
                      <div class="mb-4 text-center">
                        <h2 class="h4 fw-bold lh-sm mb-0 text-white" style="text-shadow: 0 2px 8px rgba(0,0,0,0.6);">Parada Obrigatória Horizon</h2>
                      </div>
                      
                      <div class="bg-white text-dark rounded-4 p-4 p-md-4 shadow-sm text-start">
                        <h3 class="h5 fw-bold mb-4 text-dark lh-base" style="font-size: 1.12rem; color: #0f172a !important;">
                          {{ post.triviaData?.question }}
                        </h3>
                        
                        <div class="d-flex flex-column gap-3">
                          @for (opt of post.triviaData?.options; track opt; let idx = $index) {
                            <button 
                              type="button"
                              class="trivia-option-card d-flex align-items-center justify-content-between"
                              [class.is-correct]="triviaSelection()[post.id] === idx && idx === post.triviaData!.correctIndex"
                              [class.is-wrong]="triviaSelection()[post.id] === idx && idx !== post.triviaData!.correctIndex"
                              [class.is-revealed-correct]="triviaSelection()[post.id] !== undefined && triviaSelection()[post.id] !== post.triviaData!.correctIndex && idx === post.triviaData!.correctIndex"
                              [class.is-dimmed]="triviaSelection()[post.id] !== undefined && triviaSelection()[post.id] !== idx && idx !== post.triviaData!.correctIndex"
                              [disabled]="triviaSelection()[post.id] !== undefined"
                              (click)="selectTrivia(post.id, idx)"
                            >
                              <div class="d-flex align-items-center gap-3">
                                <span class="trivia-radio-dot">
                                  @if (triviaSelection()[post.id] === idx && idx === post.triviaData!.correctIndex) {
                                    <i class="bi bi-check-lg text-success fw-bold" style="font-size: 0.85rem;"></i>
                                  } @else if (triviaSelection()[post.id] === idx && idx !== post.triviaData!.correctIndex) {
                                    <i class="bi bi-x-lg text-danger fw-bold" style="font-size: 0.85rem;"></i>
                                  } @else if (triviaSelection()[post.id] !== undefined && idx === post.triviaData!.correctIndex) {
                                    <i class="bi bi-check-lg text-success fw-bold" style="font-size: 0.85rem;"></i>
                                  }
                                </span>
                                <span>{{ opt }}</span>
                              </div>
                            </button>
                          }
                        </div>
                        
                        @if (triviaSelection()[post.id] !== undefined) {
                          <div class="mt-4 trivia-feedback-card shadow-sm">
                            @if (triviaSelection()[post.id] === post.triviaData!.correctIndex) {
                              <div class="d-flex align-items-center gap-2 mb-2 text-white fw-bold" style="font-size: 0.95rem;">
                                <span>Você acertou! A resposta correta é: <u class="text-white fw-semibold">{{ post.triviaData?.options[post.triviaData!.correctIndex] }}</u></span>
                              </div>
                              <p class="mb-0 text-white small lh-base" style="font-size: 0.88rem; color: rgba(255, 255, 255, 0.92) !important;">
                                {{ post.triviaData?.explanation }}
                              </p>
                            } @else {
                              <div class="d-flex align-items-center gap-2 mb-2 text-white fw-bold" style="font-size: 0.95rem;">
                                <span>Não foi dessa vez! A opção correta era: <u class="text-white fw-semibold">{{ post.triviaData?.options[post.triviaData!.correctIndex] }}</u></span>
                              </div>
                              <p class="mb-0 text-white small lh-base" style="font-size: 0.88rem; color: rgba(255, 255, 255, 0.92) !important;">
                                {{ post.triviaData?.explanation }}
                              </p>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="position-relative post-image-wrapper">
                    <div 
                      #trackRef
                      class="carousel-track"
                      [class.is-dragging]="isDragging[post.id]"
                      (mousedown)="onMouseDown($event, post.id, trackRef)"
                      (mousemove)="onMouseMove($event, post.id, trackRef)"
                      (mouseup)="onMouseUp(post.id, trackRef)"
                      (mouseleave)="onMouseUp(post.id, trackRef)"
                      (scroll)="onCarouselScroll(post.id, trackRef)"
                    >
                      @for (img of getPostImages(post); track $index) {
                        <div class="carousel-slide">
                          <img 
                            [src]="img" 
                            [alt]="post.title" 
                            class="w-100 h-100 object-fit-cover pointer-events-none"
                            loading="lazy"
                            decoding="async"
                            width="800"
                            height="450"
                            draggable="false"
                            (error)="handleImageError($event)"
                          />
                        </div>
                      }
                    </div>

                    @if (getPostImages(post).length > 1) {
                      <button 
                        type="button" 
                        class="btn carousel-control-btn carousel-prev" 
                        (click)="scrollCarousel(post, -1, $event, trackRef)"
                        aria-label="Imagem anterior"
                        title="Imagem anterior"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                      </button>
                      
                      <button 
                        type="button" 
                        class="btn carousel-control-btn carousel-next" 
                        (click)="scrollCarousel(post, 1, $event, trackRef)"
                        aria-label="Próxima imagem"
                        title="Próxima imagem"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                      </button>

                      <div class="carousel-indicators-custom" role="tablist" aria-label="Indicadores de fotos">
                        @for (img of getPostImages(post); track $index) {
                          <button 
                            type="button"
                            class="carousel-dot" 
                            role="tab"
                            [class.active]="(activeImageIndex()[post.id] ?? 0) === $index"
                            [attr.aria-label]="'Ir para imagem ' + ($index + 1) + ' de ' + getPostImages(post).length"
                            (click)="goToSlide(post, $index, $event, trackRef)"
                          ></button>
                        }
                      </div>
                    }
                  </div>

                  <div class="card-body p-4 p-md-5">
                    <h2 class="h4 fw-bold text-dark mb-3 lh-sm">{{ post.title }}</h2>

                    @if (post.caption) {
                      <p class="text-secondary mb-4 lh-base fs-6 post-preview-text">
                        {{ getPostPreview(post.caption) }}
                      </p>
                    }

                    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2">
                      <div class="like-unlike-radio">
  <div>
    <input
      [checked]="post.userInteraction === 'LIKE'"
      (click)="$event.preventDefault(); toggleInteraction(post, 'LIKE', $event)"
      [id]="'like-' + post.id"
      [name]="'feedback-' + post.id"
      class="custom-radio-fb"
      type="radio"
    />
    <label [for]="'like-' + post.id" class="feedback-label mb-0" [style.color]="post.userInteraction === 'LIKE' ? 'var(--active-color)' : 'var(--inactive-color)'">
      <svg class="icon" width="27" height="27" viewBox="0 0 27 27" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M0.7229 26.5H5.92292V10.9008H0.7229V26.5ZM26.6299 15.2618L24.372 23.7566C23.9989 25.3696 22.5621 26.5 20.9072 26.5H8.52293V10.9278L10.7573 2.87293C10.9669 1.50799 12.1418 0.5 13.524 0.5C15.0699 0.5 16.323 1.7527 16.323 3.29837V10.8998H23.1651C25.4519 10.9009 27.1453 13.0335 26.6299 15.2618Z" fill="currentColor"></path>
      </svg>
      <span class="d-flex align-items-center gap-1">Like <span class="badge rounded-pill bg-light text-dark border ms-1">{{ post.likesCount || 0 }}</span></span>
    </label>
  </div>
  <div>
    <input
      [checked]="post.userInteraction === 'DISLIKE'"
      (click)="$event.preventDefault(); toggleInteraction(post, 'DISLIKE', $event)"
      [name]="'feedback-' + post.id"
      [id]="'unlike-' + post.id"
      class="custom-radio-fb"
      type="radio"
    />
    <label [for]="'unlike-' + post.id" class="feedback-label mb-0" [style.color]="post.userInteraction === 'DISLIKE' ? '#dc2626' : 'var(--inactive-color)'">
      <svg class="icon" width="27" height="27" viewBox="0 0 27 27" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M26.7229 0.5L21.5229 0.5L21.5229 16.0992L26.7229 16.0992L26.7229 0.5ZM0.815853 11.7382L3.07376 3.24339C3.44687 1.63037 4.88372 0.500027 6.53861 0.500027L18.9229 0.500028L18.9229 16.0722L16.6885 24.1271C16.4789 25.492 15.304 26.5 13.9218 26.5C12.3759 26.5 11.1228 25.2473 11.1228 23.7016L11.1228 16.1002L4.28068 16.1002C1.99391 16.0991 0.300502 13.9664 0.815853 11.7382Z" fill="currentColor"></path>
      </svg>
      <span class="d-flex align-items-center gap-1">Unlike <span class="badge rounded-pill bg-light text-dark border ms-1">{{ post.dislikesCount || 0 }}</span></span>
    </label>
  </div>
</div>

                      <div>
                        <button 
                          type="button" 
                          class="btn btn-dark rounded-pill px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
                          (click)="openArticleReader(post)"
                          [attr.aria-label]="'Ler matéria completa: ' + post.title"
                        >
                          Ler Artigo <i class="bi bi-arrow-right" aria-hidden="true"></i>
                        </button>
                      </div>
                    </div>

                  </div>
                  }
                </article>
              }
            </div>
          }

        </div>

        <!-- ==================== COLUNA LATERAL: MISSÕES & RECOMPENSAS ==================== -->
        <aside class="col-12 col-lg-4 d-none d-lg-block">
          <div class="d-flex flex-column gap-4 sticky-sidebar sidebar-right">
            
            <div class="card border-0 rounded-4 text-white p-4 shadow-sm" style="background: #5BA4D8;">
              <div class="position-relative z-1">
                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">
                    <i class="bi bi-tag-fill me-1"></i> 10% OFF
                  </span>
                  <span class="small text-white fw-bold">
                    {{ missionsCompletedCount() }}/3 Concluídas
                  </span>
                </div>

                <h3 class="h5 fw-bold mb-1 text-white">Libere 10% de Desconto!</h3>
                <p class="small text-white mb-3" style="opacity: 0.95; line-height: 1.4;">
                  Cumpra as 3 tarefas de viajante abaixo e receba um cupom pessoal exclusivo para sua próxima reserva no checkout:
                </p>

                <!-- Barra de Progresso Geral das Missões -->
                <div class="progress mb-3" style="height: 7px; background: rgba(255, 255, 255, 0.25); border-radius: 999px;">
                  <div 
                    class="progress-bar bg-warning rounded-pill transition-all" 
                    role="progressbar" 
                    [style.width.%]="(missionsCompletedCount() / 3) * 100"
                    [attr.aria-valuenow]="missionsCompletedCount()" 
                    aria-valuemin="0" 
                    aria-valuemax="3"
                  ></div>
                </div>

                <!-- Lista de Tarefas -->
                <div class="d-flex flex-column gap-2 mb-3">
                  
                  <!-- Tarefa 1: Quiz Horizon -->
                  <div class="p-2 px-3 rounded-3 d-flex align-items-center justify-content-between transition-all shadow-sm"
                       [style.background]="quizMissionCompleted() ? '#f0fdf4' : '#ffffff'"
                       [style.border]="quizMissionCompleted() ? '1px solid #86efac' : '1px solid rgba(0, 0, 0, 0.06)'">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi fs-5" 
                         [class.bi-check-circle-fill]="quizMissionCompleted()" 
                         [class.text-success]="quizMissionCompleted()" 
                         [class.bi-circle]="!quizMissionCompleted()" 
                         [style.color]="!quizMissionCompleted() ? '#94a3b8' : null"></i>
                      <div>
                        <strong class="d-block small" [class.text-success]="quizMissionCompleted()" [class.text-dark]="!quizMissionCompleted()">
                          Faça o seu Quiz Horizon
                        </strong>
                        @if (!quizMissionCompleted()) {
                          <a routerLink="/quiz" class="fw-bold text-decoration-none" style="font-size: 0.75rem; color: #5BA4D8;">
                            Iniciar Quiz agora ›
                          </a>
                        } @else {
                          <span class="text-success small fw-semibold" style="font-size: 0.72rem;">Perfil de viajante ativo</span>
                        }
                      </div>
                    </div>
                    <span class="badge rounded-pill fw-bold" 
                          [class.bg-success]="quizMissionCompleted()" 
                          [class.text-white]="quizMissionCompleted()"
                          [class.bg-light]="!quizMissionCompleted()"
                          [class.text-secondary]="!quizMissionCompleted()"
                          [class.border]="!quizMissionCompleted()">
                      {{ quizMissionCompleted() ? '1/1' : '0/1' }}
                    </span>
                  </div>

                  <!-- Tarefa 2: Interagir com 10 posts -->
                  <div class="p-2 px-3 rounded-3 d-flex align-items-center justify-content-between transition-all shadow-sm"
                       [style.background]="interactionsCount() >= 10 ? '#f0fdf4' : '#ffffff'"
                       [style.border]="interactionsCount() >= 10 ? '1px solid #86efac' : '1px solid rgba(0, 0, 0, 0.06)'">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi fs-5" 
                         [class.bi-check-circle-fill]="interactionsCount() >= 10" 
                         [class.text-success]="interactionsCount() >= 10" 
                         [class.bi-circle]="interactionsCount() < 10" 
                         [style.color]="interactionsCount() < 10 ? '#94a3b8' : null"></i>
                      <div>
                        <strong class="d-block small" [class.text-success]="interactionsCount() >= 10" [class.text-dark]="interactionsCount() < 10">
                          Interaja com 10 conteúdos
                        </strong>
                        <span class="text-muted d-block" style="font-size: 0.72rem;">Likes, Isso ou Aquilo ou Trivias</span>
                      </div>
                    </div>
                    <span class="badge rounded-pill fw-bold" 
                          [class.bg-success]="interactionsCount() >= 10" 
                          [class.text-white]="interactionsCount() >= 10"
                          [class.bg-light]="interactionsCount() < 10"
                          [class.text-secondary]="interactionsCount() < 10"
                          [class.border]="interactionsCount() < 10">
                      {{ interactionsCount() }}/10
                    </span>
                  </div>

                  <!-- Tarefa 3: Ler 1 matéria completa -->
                  <div class="p-2 px-3 rounded-3 d-flex align-items-center justify-content-between transition-all shadow-sm"
                       [style.background]="articleRead() ? '#f0fdf4' : '#ffffff'"
                       [style.border]="articleRead() ? '1px solid #86efac' : '1px solid rgba(0, 0, 0, 0.06)'">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi fs-5" 
                         [class.bi-check-circle-fill]="articleRead()" 
                         [class.text-success]="articleRead()" 
                         [class.bi-circle]="!articleRead()" 
                         [style.color]="!articleRead() ? '#94a3b8' : null"></i>
                      <div>
                        <strong class="d-block small" [class.text-success]="articleRead()" [class.text-dark]="!articleRead()">
                          Leia 1 post completo
                        </strong>
                        <span class="text-muted d-block" style="font-size: 0.72rem;">Abra a matéria em um dos posts</span>
                      </div>
                    </div>
                    <span class="badge rounded-pill fw-bold" 
                          [class.bg-success]="articleRead()" 
                          [class.text-white]="articleRead()"
                          [class.bg-light]="!articleRead()"
                          [class.text-secondary]="!articleRead()"
                          [class.border]="!articleRead()">
                      {{ articleRead() ? '1/1' : '0/1' }}
                    </span>
                  </div>

                </div>

                <!-- ESTADO DE RECOMPENSA DESBLOQUEADA -->
                @if (allMissionsCompleted()) {
                  @if (couponUsed()) {
                    <div class="p-3 rounded-3 bg-white text-dark shadow-sm text-center animate-bounce-in">
                      <div class="d-flex align-items-center justify-content-center gap-1 text-secondary fw-bold small text-uppercase mb-1">
                        <i class="bi bi-check-circle-fill text-success fs-5"></i> Cupom Já Utilizado
                      </div>
                      <div class="d-flex align-items-center justify-content-center p-2 rounded-2 bg-light border my-2">
                        <span class="font-monospace text-muted text-decoration-line-through small">{{ couponCode() }}</span>
                      </div>
                      <small class="text-muted d-block" style="font-size: 0.72rem;">
                        Você já aproveitou este desconto de 10% OFF em uma de suas viagens. Benefício de uso único por viajante!
                      </small>
                    </div>
                  } @else {
                    <div class="p-3 rounded-3 bg-white text-dark shadow-sm text-center animate-bounce-in">
                      <div class="d-flex align-items-center justify-content-center gap-1 text-success fw-bold small text-uppercase mb-1">
                        <i class="bi bi-gift-fill text-warning fs-5"></i> Cupom Liberado!
                      </div>
                      <div class="d-flex align-items-center justify-content-between p-2 rounded-2 bg-light border border-dashed my-2">
                        <span class="font-monospace fw-bold fs-5 tracking-wider" style="color: #5BA4D8;">{{ couponCode() }}</span>
                        <button 
                          type="button" 
                          class="btn btn-sm rounded-pill px-3 fw-bold text-white" 
                          [class.btn-success]="couponCopied()"
                          [style.background]="!couponCopied() ? '#5BA4D8' : null"
                          [style.border-color]="!couponCopied() ? '#5BA4D8' : null"
                          (click)="copyCoupon()"
                        >
                          <i class="bi" [class.bi-check-lg]="couponCopied()" [class.bi-clipboard]="!couponCopied()"></i>
                          {{ couponCopied() ? 'Copiado!' : 'Copiar' }}
                        </button>
                      </div>
                      <small class="text-muted d-block" style="font-size: 0.72rem;">
                        Insira este cupom no checkout para abater 10% do total da sua viagem! (Válido para uso único)
                      </small>
                    </div>
                  }
                } @else {
                  <div class="text-center pt-2">
                    <small class="text-white fw-bold" style="font-size: 0.8rem;">
                      <i class="bi bi-lightning-charge-fill text-warning me-1"></i> Falta pouco para liberar seu cupom!
                    </small>
                  </div>
                }

              </div>
            </div>

          </div>
        </aside>

      </div>
    </main>

    <!-- MODAL DE LEITURA COMPLETA DO ARTIGO -->
    @if (selectedArticle(); as article) {
      <div class="modal-backdrop fade show modal-article-backdrop" (click)="closeArticleReader()"></div>
      <div class="modal fade show d-block modal-article-reader" tabindex="-1" role="dialog" aria-modal="true" (click)="closeArticleReader()">
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable modal-article-dialog" (click)="$event.stopPropagation()">
          <div class="modal-content modal-article-shell border-0 overflow-hidden">
            <div class="modal-header border-0 px-4 px-md-5 pt-4 pb-2">
              <div>
                <div class="article-reader-kicker">Matéria completa</div>
                <h2 class="article-reader-title mb-0">{{ article.title }}</h2>
              </div>
              <button type="button" class="btn-close ms-3" (click)="closeArticleReader()" aria-label="Fechar matéria"></button>
            </div>

            <div class="modal-body px-4 px-md-5 pt-3 pb-4">
              <div class="position-relative rounded-3 overflow-hidden mb-4 article-reader-media">
                <img 
                  [src]="getActiveImage(article)" 
                  [alt]="article.title" 
                  class="article-reader-image" 
                />

                @if (getPostImages(article).length > 1) {
                  <button 
                    type="button" 
                    class="btn carousel-control-btn carousel-prev" 
                    (click)="prevImage(article, $event)" 
                    aria-label="Imagem anterior"
                    title="Imagem anterior"
                  >
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/></svg>
                  </button>
                  <button 
                    type="button" 
                    class="btn carousel-control-btn carousel-next" 
                    (click)="nextImage(article, $event)" 
                    aria-label="Próxima imagem"
                    title="Próxima imagem"
                  >
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>
                  </button>
                }
              </div>

              @if (article.caption) {
                <div class="article-reader-copy px-0 py-2">
                  <p class="article-text-body">{{ article.caption }}</p>
                </div>
              }
            </div>

            <footer class="article-reader-footer px-4 px-md-5 py-3">
              <div class="article-reactions d-flex align-items-center gap-2" role="group" aria-label="Avaliar matéria">
                <button 
                  type="button" 
                  class="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill border article-modal-btn" 
                  [class.btn-liked]="article.userInteraction === 'LIKE'" 
                  (click)="toggleInteraction(article, 'LIKE', $event)" 
                  aria-label="Gostei da matéria"
                >
                  <svg class="icon" width="20" height="20" viewBox="0 0 27 27" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.7229 26.5H5.92292V10.9008H0.7229V26.5ZM26.6299 15.2618L24.372 23.7566C23.9989 25.3696 22.5621 26.5 20.9072 26.5H8.52293V10.9278L10.7573 2.87293C10.9669 1.50799 12.1418 0.5 13.524 0.5C15.0699 0.5 16.323 1.7527 16.323 3.29837V10.8998H23.1651C25.4519 10.9009 27.1453 13.0335 26.6299 15.2618Z" fill="currentColor"></path>
                  </svg>
                  <span class="fw-semibold">Like</span>
                  <span class="badge rounded-pill bg-white text-dark border ms-1">{{ article.likesCount || 0 }}</span>
                </button>

                <button 
                  type="button" 
                  class="btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill border article-modal-btn" 
                  [class.btn-disliked]="article.userInteraction === 'DISLIKE'" 
                  (click)="toggleInteraction(article, 'DISLIKE', $event)" 
                  aria-label="Não gostei da matéria"
                >
                  <svg class="icon" width="20" height="20" viewBox="0 0 27 27" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M26.7229 0.5L21.5229 0.5L21.5229 16.0992L26.7229 16.0992L26.7229 0.5ZM0.815853 11.7382L3.07376 3.24339C3.44687 1.63037 4.88372 0.500027 6.53861 0.500027L18.9229 0.500028L18.9229 16.0722L16.6885 24.1271C16.4789 25.492 15.304 26.5 13.9218 26.5C12.3759 26.5 11.1228 25.2473 11.1228 23.7016L11.1228 16.1002L4.28068 16.1002C1.99391 16.0991 0.300502 13.9664 0.815853 11.7382Z" fill="currentColor"></path>
                  </svg>
                  <span class="fw-semibold">Unlike</span>
                  <span class="badge rounded-pill bg-white text-dark border ms-1">{{ article.dislikesCount || 0 }}</span>
                </button>
              </div>

              <button type="button" class="article-return-button" (click)="closeArticleReader()">
                Voltar ao feed
              </button>
            </footer>
          </div>
        </div>
      </div>
    }

    <!-- BOTÃO FLUTUANTE: VOLTAR AO TOPO -->
    @if (showBackToTop()) {
      <button 
        type="button" 
        class="btn-back-to-top shadow-lg"
        (click)="scrollToTop()"
        aria-label="Voltar para o topo da página"
        title="Voltar ao topo"
      >
        <i class="bi bi-arrow-up-circle-fill fs-5"></i>
        <span>Voltar ao topo</span>
      </button>
    }

    <app-footer></app-footer>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-pop {
      animation: pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes pop {
      0% { transform: scale(0.5); opacity: 0; }
      70% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    
    .bg-success-subtle { background-color: #f0fdf4 !important; }
    .bg-danger-subtle { background-color: #fef2f2 !important; }
    .text-success-emphasis { color: #166534 !important; }
    .text-danger-emphasis { color: #991b1b !important; }

    :host {
      display: block;
      background-color: #f8fafc;
      min-height: 100vh;
    }

    .hero-container {
      width: 100%;
      background: #0b2545;
      height: 320px;
      max-height: 320px;
    }

    .hero-image {
      width: 100%;
      height: 320px;
      max-height: 320px;
      object-fit: cover;
      object-position: center;
      display: block;
    }

    .post-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .post-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(11, 37, 69, 0.08) !important;
    }

    /* THIS OR THAT COMPONENT */
    .this-or-that-card .option-img {
      transform: scale(1);
    }
    .this-or-that-card:not(.voted):not(.dimmed):hover .option-img {
      transform: none;
    }
    .this-or-that-card:not(.voted):not(.dimmed):hover .option-label {
      transform: translateY(-4px);
    }
    .this-or-that-card.voted .option-img {
      transform: none;
    }
    .this-or-that-card.dimmed .option-img {
      filter: grayscale(80%) brightness(0.6);
    }
    .this-or-that-card.dimmed .option-label {
      opacity: 0.6;
    }
    .vote-stats-container {
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .vote-stats-container.show {
      opacity: 1;
      transform: translateY(0);
    }
    .selection-check.show {
      opacity: 1 !important;
      transform: scale(1) !important;
    }

    .post-image-wrapper {
      position: relative;
      height: 480px;
      background: #f1f5f9;
      overflow: hidden;
    }

    .modal-article-backdrop { background: rgba(11, 37, 69, 0.68); }
    .modal-article-reader { padding: 16px 10px; }
    .modal-article-dialog { max-width: 820px; }
    .modal-article-shell { 
      border-radius: 16px; 
      background: #ffffff;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .article-reader-kicker {
      margin-bottom: 0.35rem;
      color: #0284c7;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .article-reader-title {
      color: #0f172a;
      font-size: clamp(1.35rem, 2.5vw, 1.85rem);
      font-weight: 800;
      line-height: 1.25;
    }
    .article-reader-media { 
      background: #0f172a; 
      border-radius: 12px;
    }
    .article-reader-image {
      display: block;
      width: 100%;
      height: auto;
      max-height: 480px;
      object-fit: cover;
      margin: 0 auto;
    }
    .article-reader-copy {
      padding: 0;
    }
    .article-text-body {
      margin: 0;
      color: #334155;
      font-size: 1.02rem;
      line-height: 1.85;
      white-space: pre-line;
      text-align: justify;
    }
    .article-reader-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
    }
    .article-reactions { 
      display: flex; 
      align-items: center; 
      gap: 0.75rem; 
    }
    .article-modal-btn {
      background: #ffffff;
      color: #475569;
      border-color: #e2e8f0 !important;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .article-modal-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    .article-modal-btn.btn-liked {
      background: #e0f2fe !important;
      border-color: #7dd3fc !important;
      color: #0284c7 !important;
    }
    .article-modal-btn.btn-disliked {
      background: #fee2e2 !important;
      border-color: #fca5a5 !important;
      color: #dc2626 !important;
    }
    .article-return-button {
      padding: 0.5rem 1.1rem;
      border: 1px solid #cbd5e1;
      border-radius: 50px;
      background: #ffffff;
      color: #475569;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .article-return-button:hover { 
      background: #0b2545; 
      color: #ffffff; 
      border-color: #0b2545;
      box-shadow: 0 4px 12px rgba(11, 37, 69, 0.2);
    }
    @media (max-width: 767.98px) {
      .modal-article-reader { padding: 8px; }
      .article-reader-image { max-height: 320px; }
      .article-reader-footer { align-items: flex-start; flex-direction: column; }
    }

    .carousel-track {
      display: flex;
      width: 100%;
      height: 100%;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      cursor: grab;
      user-select: none;
    }
    .carousel-track.is-dragging {
      scroll-snap-type: none !important;
      scroll-behavior: auto !important;
      cursor: grabbing;
    }
    .carousel-track::-webkit-scrollbar {
      display: none;
    }

    .carousel-slide {
      flex: 0 0 100%;
      width: 100%;
      height: 100%;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      position: relative;
    }
    
    .pointer-events-none {
      pointer-events: none;
    }

    .carousel-control-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      color: #0b2545;
      border: none;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      z-index: 15;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .carousel-control-btn:hover {
      background: #ffffff;
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    .carousel-prev { left: 20px; }
    .carousel-next { right: 20px; }

    .carousel-indicators-custom {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 15;
      background: rgba(0, 0, 0, 0.3);
      padding: 8px 12px;
      border-radius: 30px;
      backdrop-filter: blur(4px);
    }
    .carousel-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      padding: 0;
    }
    .carousel-dot:focus-visible {
      outline: 2px solid #ffffff !important;
      outline-offset: 2px;
    }
    .carousel-dot.active {
      width: 24px;
      border-radius: 12px;
      background: #ffffff;
    }


    .btn-interaction {
      background: #f1f5f9;
      color: #64748b;
      border: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-interaction:hover {
      background: #e2e8f0;
      transform: none;
    }
    .btn-liked {
      background: #e0f2fe !important;
      color: #0284c7 !important;
    }
    .btn-disliked {
      background: #fee2e2 !important;
      color: #dc2626 !important;
    }

    


    .sticky-sidebar {
      position: sticky;
      top: 100px;
    }

    .post-preview-text {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #64748b;
      line-height: 1.5;
    }

        .trivia-card-body {
      background-size: cover !important;
      background-position: center !important;
      background-repeat: no-repeat !important;
    }
    .trivia-option-card {
      background: #ffffff;
      color: #1e293b;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.95rem 1.15rem;
      font-weight: 550;
      font-size: 0.98rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      width: 100%;
      text-align: left;
    }
    .trivia-option-card:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #38bdf8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);
    }
    .trivia-option-card.is-correct {
      background: #ecfdf5 !important;
      border-color: #65A30D !important;
      color: #065f46 !important;
      font-weight: 600;
    }
    .trivia-option-card.is-wrong {
      background: #fef2f2 !important;
      border-color: #ef4444 !important;
      color: #991b1b !important;
      font-weight: 600;
    }
    .trivia-option-card.is-revealed-correct {
      background: #ecfdf5 !important;
      border: 1.5px solid #65A30D !important;
      color: #065f46 !important;
      font-weight: 600;
    }
    .trivia-option-card.is-dimmed {
      opacity: 0.45;
    }
    .trivia-radio-dot {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .trivia-feedback-card {
      background: #5BA4D8 !important;
      border: 1.5px solid #5BA4D8 !important;
      color: #ffffff !important;
      border-radius: 14px;
      padding: 1.15rem 1.3rem;
      animation: fadeIn 0.3s ease-out;
    }

    .btn-back-to-top {
      position: fixed;
      bottom: 30px;
      right: 30px;
      z-index: 1040;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #0b2545;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      padding: 10px 20px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(11, 37, 69, 0.35);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      animation: fadeInUp 0.3s ease-out;
    }
    .btn-back-to-top:hover {
      background: #0284c7;
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 15px 30px rgba(2, 132, 199, 0.4);
      color: #ffffff;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-bounce-in {
      animation: bounceIn 0.5s ease-out;
    }
    @keyframes bounceIn {
      0% { opacity: 0; transform: scale(0.9); }
      60% { opacity: 1; transform: scale(1.03); }
      100% { transform: scale(1); }
    }
  `]
})
export class FeedMainComponent implements OnInit {
  private feedService = inject(FeedService);
  private tokenStorage = inject(TokenStorageService);
  private http = inject(HttpClient);

  // ==================== MISSÕES DE GAMIFICAÇÃO & CUPOM ====================
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

  sortBy = signal<'recent' | 'popular'>('recent');
  searchQuery = signal('');
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
    
    if (query) {
      list = list.filter(p => 
        p.title?.toLowerCase().includes(query) || 
        p.caption?.toLowerCase().includes(query) ||
        p.triviaData?.question?.toLowerCase().includes(query) ||
        p.thisOrThatOptions?.some(o => o.label.toLowerCase().includes(query))
      );
    }

    if (this.sortBy() === 'popular') {
      list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    return list;
  });

  displayedPosts = computed(() => {
    return this.filteredPosts().slice(0, this.visibleCount());
  });

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedArticle()) {
      this.closeArticleReader();
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
    this.loadPosts();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.sortBy.set('recent');
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
        { id: 1, label: 'Desbravar a Patagônia Selvagem', image: 'assets/feed/id01-eco.webp', votes: 0 },
        { id: 2, label: 'Viver as Luzes de Tóquio à Noite', image: 'assets/feed/id01-city.webp', votes: 0 }
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
        { id: 1, label: 'Mergulho nas Águas de Noronha', image: 'assets/feed/id02-eco.webp', votes: 0 },
        { id: 2, label: 'Chalé com Lareira na Serra Gaúcha', image: 'assets/feed/id02-city.webp', votes: 0 }
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
        { id: 1, label: 'Expedição pelos Lençóis Maranhenses', image: 'assets/feed/id03-eco.webp', votes: 0 },
        { id: 2, label: 'Fim de Semana em Nova York', image: 'assets/feed/id03-city.webp', votes: 0 }
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
        { id: 1, label: 'Trilha na Floresta Amazônica', image: 'assets/feed/id04-eco.webp', votes: 0 },
        { id: 2, label: 'Tour Histórico e Gastronômico em Roma', image: 'assets/feed/id04-city.webp', votes: 0 }
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
        { id: 1, label: 'Acampar sob as Estrelas no Atacama', image: 'assets/feed/id05-eco.webp', votes: 0 },
        { id: 2, label: 'Jantar Romântico com Luzes de Paris', image: 'assets/feed/id05-city.webp', votes: 0 }
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
        { id: 1, label: 'Safári Selvagem no Serengeti', image: 'assets/feed/id06-eco.webp', votes: 0 },
        { id: 2, label: 'Arranha-Céus e Luxo em Dubai', image: 'assets/feed/id06-city.webp', votes: 0 }
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
        { id: 1, label: 'Flutuação nas Nascentes de Bonito', image: 'assets/feed/id07-eco.webp', votes: 0 },
        { id: 2, label: 'Praias e Festas em Cancún', image: 'assets/feed/id07-city.webp', votes: 0 }
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
        { id: 1, label: 'Trilhas na Chapada Diamantina', image: 'assets/feed/id08-eco.webp', votes: 0 },
        { id: 2, label: 'Museus e Pubs Históricos em Londres', image: 'assets/feed/id08-city.webp', votes: 0 }
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
        { id: 1, label: 'Geleiras e Fiordes em Reykjavík', image: 'assets/feed/id09-eco.webp', votes: 0 },
        { id: 2, label: 'Calçadão e Pôr do Sol no Rio de Janeiro', image: 'assets/feed/id09-city.webp', votes: 0 }
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
        { id: 1, label: 'Vida Selvagem e Safári no Pantanal', image: 'assets/feed/id10-eco.webp', votes: 0 },
        { id: 2, label: 'Cassinos e Espetáculos em Las Vegas', image: 'assets/feed/id10-city.webp', votes: 0 }
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
      imageUrl: 'assets/feed/id101-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 102,
      title: 'O encanto das águas cristalinas de Noronha',
      caption: 'Há poucos lugares no globo onde a comunhão entre terra e oceano seja tão intacta quanto em Fernando de Noronha. Do alto da escadaria cravada na fenda rochosa que dá acesso à Baía do Sancho, o tom esmeralda do mar parece quase surreal sob a luz do meio-dia.\n\nAo mergulhar com snorkel na Baía dos Porcos ou no Sueste, você não precisa procurar pela vida: são as tartarugas-verdes, raias-chita e cardumes multicoloridos que cruzam seu caminho com naturalidade desarmante. Ao longe, o Morro do Pico vigia o arquipélago como um farol milenar de origem vulcânica.\n\nA verdadeira magia de Noronha mora no ritmo do arquipélago: acordar antes da alvorada para contemplar os golfinhos-rotadores na Baía dos Golfinhos e terminar a tarde assistindo ao pôr do sol no Mirante do Boldró, com os pés na areia e a sensação rara de desaceleração profunda.',
      imageUrl: 'assets/feed/id102-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 103,
      title: 'Segredos da Chapada Diamantina: O lendário Vale do Pati',
      caption: 'Cruzar o Vale do Pati a pé é considerado por muitos viajantes experientes a travessia mais fascinante e transformadora do Brasil. São dias inteiros de caminhada desconectado de redes telefônicas e cercado pelas imponentes serras tabulares do Parque Nacional da Chapada Diamantina.\n\nO trajeto revela paisagens arrebatadoras: o abismo vertiginoso do Mirante do Cachoeirão, com suas múltiplas quedas d\'água após as chuvas, as águas de cor conhaque do Rio Preto e a vastidão silenciosa dos Gerais dos Vieira.\n\nMas o que realmente marca a memória são as noites nas casas dos nativos patizeiros, como a Dona Raquel ou o Seu Wilson. À luz de velas, com refeições caseiras feitas no fogão a lenha e causos contados sob um céu apinhado de estrelas, descobre-se que a simplicidade do sertão baiano é a forma mais refinada de riqueza.',
      imageUrl: 'assets/feed/id103-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 104,
      title: 'Sob o céu mais limpo do planeta no Deserto do Atacama',
      caption: 'A mais de 2.400 metros de altitude, onde o ar é rarefeito e a umidade praticamente inexiste, o Deserto do Atacama ostenta uma das janelas mais límpidas para o cosmos em nosso planeta. Quando a noite cai em San Pedro de Atacama e as luzes da vila se apagam, o firmamento ganha contornos tridimensionais.\n\nOs braços espirais da Via Láctea, as Nuvens de Magalhães e constelações indígenas ancestrais brilham com uma nitidez que hipnotiza astrônomos e viajantes. De dia, a paisagem é igualmente surreal: salares que abrigam bandos de flamingos andinos, lagoas altiplânicas de azul hipnótico a 4.000 metros e os gêiseres de El Tatio fumegando sob o gelo da manhã.\n\nO Atacama exige hidratação constante e passo cadenciado, recompensando cada esforço com a impressão inesquecível de caminhar em outro planeta sem sair da América do Sul.',
      imageUrl: 'assets/feed/id104-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 105,
      title: 'Cores, aromas e histórias nos labirintos de Marrakech',
      caption: 'Entrar na medina murada de Marrakech é atravessar uma fronteira sensorial absoluta. Os souks são labirintos vivos de ruelas cobertas por esteiras de junco, onde a luz do sol filtra em feixes dourados sobre barris de açafrão, cominho, gengibre e pilhas de tâmaras frescas.\n\nEntre artesãos moldando luminárias de latão martelado e mestres tecelões trabalhando a lã tingida nos históricos curtumes, o tempo parece obedecer a códigos medievais. Nos pátios secretos dos riads, fontes de água murmuram cercadas por mosaicos zellij e laranjeiras aromáticas, oferecendo refúgios de frescor inestimáveis.\n\nAo entardecer, todos os caminhos convergem para a lendária praça Jemaa el-Fna: encantadores de serpentes, músicos gnawa e dezenas de bancas de comida fumegantes de tagines e espetos temperados criam o maior teatro a céu aberto do norte da África.',
      imageUrl: 'assets/feed/id105-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 106,
      title: 'Amanhecer em Kyoto: Jardins zen e bambuzais milenares',
      caption: 'Se Tóquio representa o pulso elétrico do amanhã, Kyoto é o guardião sereno da alma milenar japonesa. O segredo para vivenciar sua atmosfera mais genuína é madrugar: caminhar pela floresta de bambu de Arashiyama antes das sete da manhã é ouvir apenas o estalar oco dos colmos gigantes oscilando com a brisa matinal.\n\nNos templos históricos como Ryoan-ji e Tenryu-ji, os jardins secos de pedra (karesansui) convidam à introspecção e ensinam sobre a estética do ma — o espaço vazio que dá sentido a todas as coisas. Cada rocha cuidadosamente posicionada sobre o cascalho ancinhado conta uma narrativa cósmica.\n\nCruzar as vielas de paralelepípedo de Gion ao crepúsculo, com lanternas de papel iluminando fachadas de cedro escuro e pontes de madeira sobre o canal Shirakawa, transforma a viagem em uma imersão poética na cultura da contemplação.',
      imageUrl: 'assets/feed/id106-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 107,
      title: 'Lagoas de água doce entre o mar de dunas dos Lençóis',
      caption: 'Imagine um deserto imenso de areia alvíssima cortado por centenas de lagoas cristalinas de água doce, formadas exclusivamente pelas chuvas do primeiro semestre. Os Lençóis Maranhenses compõem um ecossistema único no planeta, onde a dinâmica dos ventos redesenha o relevo diariamente.\n\nNadar nas águas mornas da Lagoa Bonita ou da Lagoa Azul após subir as dunas a pé é uma das sensações de alívio e deslumbramento mais marcantes do Nordeste brasileiro. A transição entre o verde-esmeralda da água e o branco puro do quartzo cria um contraste visual desconcertante.\n\nPara os mais aventureiros, a travessia a pé pelo Parque Nacional até o oásis de Queimada dos Britos oferece um mergulho na vida dos moradores locais que vivem em harmonia com as marés de areia, pescando traíras que hibernam sob a lama e celebrando noites de luar inesquecíveis.',
      imageUrl: 'assets/feed/id107-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 108,
      title: 'A força estrondosa das Cataratas do Iguaçu',
      caption: 'Nenhuma fotografia consegue antecipar o impacto físico de se aproximar da Garganta do Diabo. O rugido de mais de 270 quedas d\'água despejando milhões de litros por segundo vibra no peito antes mesmo de o viajante avistar o abismo encoberto por uma névoa permanente de arco-íris.\n\nCaminhar pelas passarelas que avançam sobre o Rio Iguaçu, cercado pela exuberância da Mata Atlântica e por centenas de borboletas de asas iridescentes, é uma lição de imponência natural. A água salpica no rosto e renova as energias em questão de segundos.\n\nTanto pelo lado brasileiro, com sua vista panorâmica cinematográfica, quanto pelo lado argentino, com passarelas que colocam você na beira exata do abismo d\'água, Foz do Iguaçu permanece como um dos maiores espetáculos geológicos que a Terra tem a oferecer.',
      imageUrl: 'assets/feed/id108-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 109,
      title: 'Expedição pelo Jalapão: Onde a terra brota água pura',
      caption: 'O Jalapão, no coração do cerrado tocantinense, é terra de contrastes dramáticos: chapadões de arenito avermelhado, veredas de buritis reluzentes e estradas de terra batida que desafiam até mesmo os veículos 4x4 mais preparados.\n\nA recompensa máxima da viagem mora nos famosos fervedouros, como o do Ceiça e o Bela Vista. Nessas nascentes subterrâneas de água termal azul-turquesa, o fenômeno da ressurgência cria uma pressão que impede qualquer pessoa de afundar, proporcionando uma sensação deliciosa e quase infantil de flutuação absoluta.\n\nSubir as dunas douradas no fim da tarde para ver o pôr do sol iluminar a Serra do Espírito Santo é o momento culminante da expedição, quando a terra parece pegar fogo em tons de ocre, dourado e lilás.',
      imageUrl: 'assets/feed/id109-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 110,
      title: 'Glaciares milenares e ventos bravos da Patagônia',
      caption: 'Nas franjas do Campo de Gelo Sul, a Patagônia austral impõe seu temperamento indomável. Diante do colossal glaciar Perito Moreno, em El Calafate, os viajantes permanecem em silêncio absoluto esperando o espetáculo dos desprendimentos: blocos de gelo do tamanho de edifícios despencam nas águas do Lago Argentino com um estrondo que ecoa como um trovão pelos vales.\n\nMais ao norte, nos arredores de El Chaltén, a capital nacional do trekking, trilhas batidas pelo vento patagônico levam à base do Monte Fitz Roy e da Laguna de los Tres, onde agulhas de granito furam as nuvens com uma dramaticidade quase mítica.\n\nViajar pela Patagônia exige roupas técnicas em camadas e disposição para encarar as quatro estações em um único dia. Mas a recompensa de saborear um cordeiro patagônico na brasa e uma taça de vinho Malbec após horas de caminhada no vento gelado não tem preço.',
      imageUrl: 'assets/feed/id110-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 111,
      title: 'O silêncio vivo da Floresta Amazônica ao entardecer',
      caption: 'A Floresta Amazônica não dorme: ela apenas troca de turno. Quando o sol desce no horizonte sobre o espelho negro do Rio Urubu e a névoa começa a subir das copas das samaúmas, os pássaros diurnos silenciam para dar lugar ao coro orquestrado de sapos, insetos e o sopro misterioso dos botos-cor-de-rosa emergindo para respirar.\n\nNavegar em canoas silenciosas pelos igapós inundados permite avistar preguiças camufladas nas folhas altas, macacos-de-cheiro saltando entre galhos e orquídeas selvagens que exalam perfumes adocicados no ar úmido.\n\nFicar hospedado em um hotel de selva sustentável e subir a uma torre de observação acima do dossel florestal no alvorecer é compreender a imensidão orgânica que regula o clima de todo o nosso continente. É uma experiência de humildade profunda diante da força biológica da Terra.',
      imageUrl: 'assets/feed/id111-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 112,
      title: 'Neblina de serra, fondues e araucárias em Gramado',
      caption: 'A Serra Gaúcha possui um charme outonal que desacelera os ponteiros do relógio. Em Gramado, o aroma de chocolate artesanal flutua no ar fresco das manhãs, enquanto a neblina rasteira abraça os pinheiros de araucária ao redor do bucólico Lago Negro.\n\nA arquitetura enxaimel, herdada dos imigrantes europeus, emoldura cafeterias aconchegantes e empórios onde queijos coloniais, salames curados e vinhos de altitude convidam a pausas sem hora para terminar.\n\nNas noites frias de inverno, nada se compara a reunir amigos ou a pessoa amada ao redor de uma tradicional sequência de fondue na lareira. É o refúgio perfeito para quem busca sofisticação sem ostentação, conforto acolhedor e a tranquilidade revigorante do clima montanhês.',
      imageUrl: 'assets/feed/id112-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 113,
      title: 'Flutuação surreal nos rios transparentes de Bonito',
      caption: 'A transparência inacreditável dos rios de Bonito, no Mato Grosso do Sul, não é fruto de mágica, mas de pura geologia: a água da chuva é filtrada pelo solo calcário, que decanta todas as impurezas e transforma os leitos fluviais em verdadeiros aquários naturais gigantescos.\n\nAo colocar a máscara e o snorkel no Rio Sucuri ou no Recanto Ecológico Rio da Prata, você simplesmente deixa a correnteza suave te guiar sem bater pernas. Dourados reluzentes, piraputangas curiosas e plantas aquáticas de verde brilhante passam a centímetros do seu rosto em perfeita harmonia.\n\nO modelo de turismo de Bonito é referência mundial: cada atrativo possui limite rigoroso de visitantes diários e controle ambiental por voucher digital, garantindo que o ecossistema permaneça intocado para as próximas gerações.',
      imageUrl: 'assets/feed/id113-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 114,
      title: 'Cânions e águas verdes do Rio São Francisco em Xingó',
      caption: 'No sertão sergipano e alagoano, o majestoso Rio São Francisco esculpe um dos cenários mais surpreendentes do Brasil profundo: os Cânions de Xingó. Paredões de arenito avermelhado erguem-se a mais de cinquenta metros de altura, contrastando com o verde-esmeralda intenso das águas plácidas represadas.\n\nO passeio de catamarã pelo leito do rio leva até a Gruta do Talhado, uma fenda estreita onde apenas pequenos botes de madeira conseguem navegar. Ali dentro, o silêncio é sagrado e a temperatura cai bruscamente sob a sombra dos gigantes de rocha.\n\nAlém da beleza cenográfica monumental, a região respira história e cultura nordestina: das lembranças do cangaço de Lampião e Maria Bonita à gastronomia sertaneja farta, com peixes de água doce grelhados, queijo coalho e pirão de mocotó.',
      imageUrl: 'assets/feed/id114-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 115,
      title: 'Trilhas sagradas no Vale Sagrado dos Incas',
      caption: 'Caminhar pelas cidades e fortalezas do Vale Sagrado dos Incas, como Pisac, Ollantaytambo e Moray, é mergulhar em uma civilização cuja engenharia agrícola e conhecimento astronômico dialogavam perfeitamente com as montanhas sagradas (Apus).\n\nAo chegar a Machu Picchu, seja de trem panorâmico margeando o agitado Rio Urubamba ou pela clássica Trilha Inca a pé, a sensação de reverência é instantânea. As ruínas de pedra finamente talhada parecem brotar das encostas verdejantes como uma extensão natural da serra.\n\nSubir as escadarias íngremes de Huayna Picchu sob a névoa matinal e observar a cidadela se revelando lá embaixo é um rito de passagem para qualquer amante da história e da espiritualidade andina.',
      imageUrl: 'assets/feed/id115-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 116,
      title: 'Colinas douradas e vinhedos seculares na Toscana',
      caption: 'As colinas do Val d\'Orcia representam a quintessência da paisagem campestre italiana. Estradas sinuosas ladeadas por ciprestes pontiagudos cortam campos dourados de trigo e vinhedos perfeitamente alinhados que produzem alguns dos vinhos mais reverenciados do mundo, como o Brunello di Montalcino e o Chianti Classico.\n\nVilarejos medievais encarapitados no alto dos morros, como Pienza, Montepulciano e San Gimignano, convidam a caminhar sem destino por vielas de pedra, descobrindo adegas subterrâneas, queijarias que maturam pecorino artesanal e pequenas trattorias com massas frescas ao molho de javali.\n\nA Toscana não é uma viagem para se fazer correndo de ponto turístico em ponto turístico; é um convite aberto para desacelerar o passo, abrir um bom vinho e contemplar o pôr do sol tingindo as colinas de terracota.',
      imageUrl: 'assets/feed/id116-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 117,
      title: 'O santuário de evolução e vida marinha em Galápagos',
      caption: 'Localizado a mil quilômetros da costa do Equador, o arquipélago vulcânico de Galápagos opera sob regras próprias da natureza. Como os animais nunca aprenderam a temer a presença humana por predadores terrestres, o visitante vivencia encontros comoventes de proximidade e respeito.\n\nNas praias de areia escura, leões-marinhos brincalhões cochilam lado a lado com iguanas marinhas pré-históricas que espirram sal das narinas após mergulharem em busca de algas. Nos planaltos úmidos de Santa Cruz, tartarugas gigantes com mais de um século de vida pastam vagarosamente entre as samambaias.\n\nMergulhar nas águas de Kicker Rock ou Los Túneles revela tubarões-de-galápagos, tartarugas-marinhas e os ágeis pinguins-de-galápagos voando sob a água. É o museu vivo da teoria de Darwin em sua manifestação mais pura.',
      imageUrl: 'assets/feed/id117-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 118,
      title: 'O ritmo da vida selvagem no coração do Pantanal',
      caption: 'Maior planície alagável contínua do mundo, o Pantanal é a meca absoluta da observação de fauna na América do Sul. Ao percorrer a Rodovia Transpantaneira ou navegar pelos meandros dos rios Cuiabá e Piquiri em Porto Jofre, a densidade animal impressiona até os biólogos mais calejados.\n\nBandos de tuiuiús pousam em ninhos gigantescos no topo dos manduviers, enquanto capivaras e jacarés-do-pantanal dividem barrancos sob a vigilância atenta de lontras brincalhonas. Mas o ápice incontestável de qualquer expedição é o encontro com a onça-pintada: avistar o maior felino das Américas caçando silenciosamente na beira d\'água é uma imagem que fica gravada na retina para sempre.\n\nO Pantanal exige guias experientes e paciência, retribuindo cada instante de vigília com espetáculos diários de sobrevivência e beleza bruta.',
      imageUrl: 'assets/feed/id118-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 119,
      title: 'Aurora Boreal: As luzes do norte dançando em Tromsø',
      caption: 'Situada bem acima do Círculo Polar Ártico, na Noruega, a cidade de Tromsø é a capital mundial da caçada à Aurora Boreal. Durante a longa noite polar de inverno, quando o sol nem chega a nascer no horizonte, a atmosfera ártica ganha uma tonalidade azulada de mistério e fascínio.\n\nAguardar em meio à neve espessa, ao redor de uma fogueira estalando e saboreando chá quente de frutas silvestres, até que a primeira fita esverdeada comece a serpentear pelo céu estrelado é uma das esperas mais emocionantes da vida.\n\nDe repente, o firmamento explode em cortinas dançantes de verde, violeta e magenta em questão de segundos. A força geomagnética do vento solar interagindo com a atmosfera é pura poesia cósmica em movimento sobre fiordes congelados.',
      imageUrl: 'assets/feed/id119-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 120,
      title: 'Praias rústicas e falésias da Costa do Descobrimento',
      caption: 'O trecho litorâneo do sul da Bahia que abriga Trancoso, Caraíva e Arraial d\'Ajuda é um manifesto à vida desacelerada e à comunhão com a natureza litorânea. Em Caraíva, onde não entram carros e as ruas continuam sendo de areia fofa, o tempo passa no compasso do encontro entre o rio de águas calmas e o mar aberto.\n\nCaminhar até a Praia do Espelho na maré baixa revela falésias monumentais em tons de ocre e branco debruçadas sobre piscinas naturais de cor turquesa límpida, onde corais formam refúgios de vida submarina.\n\nNo Quadrado de Trancoso, o gramado histórico diante da igrejinha de São João Batista ganha vida ao anoitecer com mesas à luz de velas sob amendoeiras frondosas, combinando o tempero inconfundível da moqueca baiana com uma hospitalidade calorosa e autêntica.',
      imageUrl: 'assets/feed/id120-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 121,
      title: 'A imponência vertical das Dolomitas no norte da Itália',
      caption: 'Erguendo-se dramaticamente no norte da Itália, as Dolomitas formam uma das cordilheiras mais impressionantes do continente europeu. Suas paredes verticais de rocha calcária possuem uma composição mineral única que produz o fenômeno da Enrosadira: ao nascer e ao pôr do sol, as montanhas brilham em tons incandescentes de rosa e dourado.\n\nTrilhas lendárias como o circuito ao redor das Três Cimes de Lavaredo ou a passagem pelo refúgio de montanha em Seceda revelam platôs verdes pontilhados por chalés de madeira e rebanhos de vacas alpinas pastando em paz.\n\nA cultura da região mistura com elegância influências austríacas e italianas, refletidas em pratos substanciais como canederli servidos com manteiga de sálvia e apfelstrudel quentinho após dias intensos de trekking e ar puro.',
      imageUrl: 'assets/feed/id121-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 122,
      title: 'Caminhos coloniais de pedra e casarios em Paraty',
      caption: 'Caminhar pelas ruas de pedras \'pé-de-moleque\' do Centro Histórico de Paraty é fazer uma viagem no tempo diretamente para o século XVIII. Os casarões coloniais de paredes caiadas de branco, com portas e janelas pintadas em cores vibrantes, contam histórias da rota do ouro e do café da Estrada Real.\n\nNas luas cheias, a maré sobe e invade delicadamente as ruas mais próximas ao cais, transformando a vila em um espelho d\'água cinematográfico que reflete as fachadas históricas e as montanhas cobertas pela Mata Atlântica ao fundo.\n\nPasseios de traineira ou escuna pelas águas calmas da Baía de Paraty levam a praias secretas como a do Sono e ilhas isoladas de mar calmo e transparente, perfeitas para nadar entre peixes e desfrutar do frescor da serra que encontra o mar.',
      imageUrl: 'assets/feed/id122-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 123,
      title: 'Lagos turquesa e picos nevados no Parque de Banff',
      caption: 'O Parque Nacional de Banff, nas Montanhas Rochosas de Alberta, parece ter sido desenhado por um pintor apaixonado pela natureza selvagem. O icônico Lake Louise, alimentado pelo derretimento do Glaciar Victoria, exibe um tom azul-turquesa leitoso tão intenso que parece retocado por filtros digitais.\n\nSubir pelas trilhas que levam ao Lake Agnes Tea House oferece vistas panorâmicas de florestas densas de coníferas e vales glaciares profundos, com paradas para degustar chás fumegantes em cabanas de madeira construídas no início do século passado.\n\nA vida selvagem no parque é abundante e protegida com rigor exemplar: é comum avistar alces pastando em campos abertos, bodes-das-rochosas escalando encostas íngremes e, com sorte e distância respeitosa, ursos-grizzly forrageando frutas silvestres no verão.',
      imageUrl: 'assets/feed/id123-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 124,
      title: 'Aromas da cozinha mineira e serras de Monte Verde',
      caption: 'Encravada no alto da Serra da Mantiqueira, a charmosa vila de Monte Verde combina o melhor da hospitalidade mineira com o clima europeu de montanha. A mais de 1.500 metros de altitude, o ar é perfumado pelo aroma de pinheiros e pelo aroma tentador de pão de queijo quentinho saindo do forno.\n\nAs trilhas da região, como a subida à Pedra Redonda e ao Chapéu do Bispo, oferecem caminhadas acessíveis que terminam em mirantes espetaculares de 360 graus sobre o mar de morros que divide Minas Gerais e São Paulo.\n\nÀ noite, o centrinho iluminado convida a passear sem pressa entre ateliês de cerâmica, empórios de queijo da canastra curado, cachaças artesanais e restaurantes que servem trutas frescas grelhadas acompanhadas de vinhos locais.',
      imageUrl: 'assets/feed/id124-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    },
    {
      id: 125,
      title: 'O espetáculo do céu ao amanhecer na Capadócia',
      caption: 'Poucas experiências de viagem no mundo conseguem rivalizar com a poesia visual de acordar antes do sol nascer na Capadócia. No vale de Göreme, o horizonte lentamente se preenche com mais de uma centena de balões de ar quente inflando em uníssono, subindo suavemente ao céu enquanto os primeiros raios solares douram as formações rochosas esculpidas pela erosão e pela cinza vulcânica milenar.\n\nLá de cima, a sensação é de flutuar em silêncio sobre chaminés de fadas, mosteiros escavados na rocha e cidades subterrâneas como Derinkuyu, onde civilizações antigas encontraram refúgio contra invasões.\n\nFicar hospedado em um autêntico hotel-caverna esculpido na encosta da montanha e tomar café da manhã no terraço observando o balé multicolorido dos balões no céu é um daqueles momentos que justificam qualquer viagem.',
      imageUrl: 'assets/feed/id125-1.webp',
      likesCount: 0,
      dislikesCount: 0,
      postType: 'ARTICLE'
    }
  ];

  // ==================== INTERLEAVING 40 ITEMS ====================
  // 25 Posts + 10 Isso ou Aquilo + 5 Trivias = 40 itens misturados
  private clonePost(post: Post): Post {
    return {
      ...post,
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

    const userInteractions = this.loadStoredUserInteractions();
    const currentSelections = { ...this.thisOrThatSelection() };
    const currentTrivias = this.triviaSelection();
    let selectionsChanged = false;

    for (const p of mixedFeed) {
      const isFromBackend = backendIds.has(p.id);

      if (p.postType === 'THIS_OR_THAT') {
        if (p.userInteraction === 'VOTE' && p.userOptionId) {
          currentSelections[p.id] = p.userOptionId;
          selectionsChanged = true;
          this.recordInteraction(p.id);
        } else if (currentSelections[p.id] !== undefined) {
          this.recordInteraction(p.id);
          if (isFromBackend && p.userInteraction !== 'VOTE') {
            this.feedService.interact(p.id, 'VOTE', currentSelections[p.id]).subscribe({ error: () => {} });
          }
        }
        continue;
      }

      if (p.postType === 'TRIVIA') {
        if (currentTrivias[p.id] !== undefined) {
          this.recordInteraction(p.id);
        }
        continue;
      }

      const backendInt = (p.userInteraction === 'LIKE' || p.userInteraction === 'DISLIKE')
        ? p.userInteraction
        : null;
      const localInt = userInteractions[p.id] || null;
      const effectiveInt = backendInt || localInt || null;

      let dbLikes = p.likesCount ?? 0;
      let dbDislikes = p.dislikesCount ?? 0;

      // Se o usuário já havia clicado em Like/Dislike e ficou salvo apenas localmente (ex: antes do seed dos posts 101-125),
      // sincroniza automaticamente com o backend e soma no contador real do post
      if (!backendInt && localInt) {
        if (localInt === 'LIKE') dbLikes += 1;
        if (localInt === 'DISLIKE') dbDislikes += 1;
        this.feedService.interact(p.id, localInt).subscribe({ error: () => {} });
      }

      p.userInteraction = effectiveInt;
      p.likesCount = dbLikes;
      p.dislikesCount = dbDislikes;

      if (effectiveInt) {
        userInteractions[p.id] = effectiveInt;
        this.recordInteraction(p.id);
      }
    }

    if (selectionsChanged) {
      this.thisOrThatSelection.set(currentSelections);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.getThisOrThatStorageKey(), JSON.stringify(currentSelections));
      }
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.getUserInteractionsStorageKey(), JSON.stringify(userInteractions));
    }

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
      },
      error: () => {
        const mixed = this.buildFeed([]);
        this.posts.set(mixed);
        this.isLoading.set(false);
        this.triggerFeedAnimation();
      }
    });
  }

  selectThisOrThat(postId: number, optionId: number): void {
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
    const hasLocalArticleGallery =
      post.id === 8 ||
      (post.id >= 17 && post.id <= 20) ||
      (post.id >= 101 && post.id <= 125);

    if (hasLocalArticleGallery) {
      return [1, 2, 3].map(index => `assets/feed/id${post.id}-${index}.webp`);
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












