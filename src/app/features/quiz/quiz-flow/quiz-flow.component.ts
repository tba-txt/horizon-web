import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { QuizService } from '../services/quiz.service';
import { Quiz, SubmitQuizRequest } from '../models/quiz.model';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { TravelerIdentityService } from '../../recommendations/services/traveler-identity.service';
import { TravelerIdentityState } from '../../recommendations/models/traveler-identity.model';

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

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';

@Component({
  selector: 'app-quiz-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, PlaneLoaderComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/quiz.webp" 
        alt="Quiz Hero" 
        class="w-100 hero-image"
        fetchpriority="high"
        (error)="handleHeroError($event)"
      />
    </header>

    <main class="container-fluid px-lg-4 py-5 mx-auto" style="max-width: 1400px;">
      <div class="row g-4 g-lg-5 justify-content-center">
        
        <!-- COLUNA LATERAL ESQUERDA: CARD DE PROGRESSO FIGMA -->
        <div class="col-12 col-lg-3 d-none d-lg-block">
          <div class="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden d-flex flex-column" style="min-height: 770px;">
            <!-- Topo Azul: Progresso & Stepper Horizontal -->
            <div class="p-4 text-white d-flex flex-column justify-content-between" style="background-color: #5BA4D8; min-height: 180px; height: 180px;">
              <div>
                <span class="badge rounded-2 px-3 py-2 fw-bold bg-white text-primary shadow-sm" style="font-size: 0.8rem;">
                  Progresso
                </span>
              </div>

              <!-- Horizontal Stepper (Estilo Figma) -->
              <div class="position-relative my-2 px-1">
                <!-- Linha Conectora Branca de Fundo -->
                <div class="position-absolute start-0 end-0" style="top: 50%; height: 3px; background: rgba(255, 255, 255, 0.45); transform: translateY(-50%); z-index: 1;"></div>
                
                <!-- Barra de Progresso Ativa Branca -->
                <div class="position-absolute start-0" 
                     style="top: 50%; height: 3px; background: #ffffff; transform: translateY(-50%); z-index: 2; transition: width 0.3s ease;"
                     [style.width.%]="(currentStep() / 3) * 100">
                </div>

                <!-- 4 Nós com Rótulos Alternados (Acima / Abaixo) -->
                <div class="d-flex justify-content-between align-items-center position-relative" style="z-index: 3; min-height: 64px;">
                  
                  <!-- 1: Estilo (Rótulo Abaixo) -->
                  <div class="d-flex flex-column align-items-center cursor-pointer" (click)="goToStep(0)" style="width: 48px;">
                    <div style="height: 18px;"></div>
                    <div class="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                         [style.background]="currentStep() >= 0 ? '#ffffff' : '#4895CC'"
                         [style.border]="currentStep() >= 0 ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.7)'"
                         style="width: 18px; height: 18px; transition: all 0.25s;">
                      @if (currentStep() > 0 || isStepDone(0)) {
                        <div class="rounded-circle" style="width: 8px; height: 8px; background-color: #4895CC;"></div>
                      }
                    </div>
                    <span class="small fw-bold text-white mt-1 text-center" style="font-size: 11px; line-height: 1.1;">Estilo</span>
                  </div>

                  <!-- 2: Clima (Rótulo Acima) -->
                  <div class="d-flex flex-column align-items-center cursor-pointer" (click)="goToStep(1)" style="width: 48px;">
                    <span class="small fw-bold text-white mb-1 text-center" style="font-size: 11px; line-height: 1.1;">Clima</span>
                    <div class="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                         [style.background]="currentStep() >= 1 ? '#ffffff' : '#4895CC'"
                         [style.border]="currentStep() >= 1 ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.7)'"
                         style="width: 18px; height: 18px; transition: all 0.25s;">
                      @if (currentStep() > 1 || isStepDone(1)) {
                        <div class="rounded-circle" style="width: 8px; height: 8px; background-color: #4895CC;"></div>
                      }
                    </div>
                    <div style="height: 18px;"></div>
                  </div>

                  <!-- 3: Experiência (Rótulo Abaixo) -->
                  <div class="d-flex flex-column align-items-center cursor-pointer" (click)="goToStep(2)" style="width: 58px;">
                    <div style="height: 18px;"></div>
                    <div class="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                         [style.background]="currentStep() >= 2 ? '#ffffff' : '#4895CC'"
                         [style.border]="currentStep() >= 2 ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.7)'"
                         style="width: 18px; height: 18px; transition: all 0.25s;">
                      @if (currentStep() > 2 || isStepDone(2)) {
                        <div class="rounded-circle" style="width: 8px; height: 8px; background-color: #4895CC;"></div>
                      }
                    </div>
                    <span class="small fw-bold text-white mt-1 text-center" style="font-size: 11px; line-height: 1.1;">Experiência</span>
                  </div>

                  <!-- 4: Orçamento (Rótulo Acima) -->
                  <div class="d-flex flex-column align-items-center cursor-pointer" (click)="goToStep(3)" style="width: 58px;">
                    <span class="small fw-bold text-white mb-1 text-center" style="font-size: 11px; line-height: 1.1;">Orçamento</span>
                    <div class="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                         [style.background]="currentStep() >= 3 ? '#ffffff' : '#4895CC'"
                         [style.border]="currentStep() >= 3 ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.7)'"
                         style="width: 18px; height: 18px; transition: all 0.25s;">
                      @if (currentStep() === 3 || isStepDone(3)) {
                        <div class="rounded-circle" style="width: 8px; height: 8px; background-color: #4895CC;"></div>
                      }
                    </div>
                    <div style="height: 18px;"></div>
                  </div>

                </div>
              </div>
            </div>

            <!-- Imagem Horizon do Figma na parte inferior do card -->
            <div class="flex-grow-1 overflow-hidden position-relative" style="min-height: 590px;">
              <img 
                src="assets/horizon-fgm1.webp" 
                alt="Horizon Travel" 
                class="w-100 h-100 object-fit-cover d-block" 
                loading="lazy"
              />
            </div>
          </div>
        </div>

        <!-- COLUNA PRINCIPAL: WIZARD INTERATIVO -->
        <div class="col-12 col-lg-6">

          <!-- Estado: Loading -->
          @if (isLoading()) {
            <div class="card border-0 shadow-sm rounded-4 p-5 bg-white text-center">
              <div class="py-4">
                <app-plane-loader></app-plane-loader>
              </div>
            </div>
          }

          <!-- Estado: Erro -->
          @else if (errorMessage()) {
            <div class="alert alert-danger p-4 rounded-4 shadow-sm text-center" role="alert">
              <div class="display-6 mb-2">⚠️</div>
              <h5 class="fw-bold mb-2">Ops! Ocorreu um problema ao carregar o quiz.</h5>
              <p class="mb-3 small text-danger-emphasis">{{ errorMessage() }}</p>
              <button class="btn btn-outline-danger btn-sm px-4 rounded-2 fw-semibold" (click)="loadQuiz()">
                Tentar novamente
              </button>
            </div>
          }

          <!-- Estado: Sucesso após Submissão (Design de Identidade de /recommendations Compacto) -->
          @else if (isSubmitted()) {
            <div 
              class="card bg-white question-wizard-card position-relative overflow-hidden p-4 p-md-5 d-flex flex-column justify-content-between"
              [style.border]="isEcoQuizChoice() ? '3px solid #65A30D' : '3px solid #5BA4D8'"
              style="min-height: 770px; border-radius: 32px !important;"
            >
              
              <!-- Topo: Perfil do Usuário + Cartão Horizon (Igual a /recommendations) -->
              <div class="d-flex justify-content-between align-items-center gap-3">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
                       style="width: 60px; height: 60px; background-color: #f8fafc; border: 2px solid #e2e8f0;">
                    @if (identityData()?.profileImageUrl) {
                      <img [src]="identityData()!.profileImageUrl" alt="Foto de perfil" class="w-100 h-100 object-fit-cover rounded-circle" />
                    } @else {
                      <img src="assets/default-avatar.webp" alt="Foto de perfil padrão" class="w-100 h-100 object-fit-cover rounded-circle" />
                    }
                  </div>
                  <div>
                    <span class="text-uppercase fw-bold d-block mb-1"
                          [style.color]="isEcoQuizChoice() ? '#65A30D' : '#5BA4D8'"
                          style="font-size: 0.75rem; letter-spacing: 0.08em;">
                      PERFIL
                    </span>
                    <h3 class="h5 fw-bold text-dark mb-0">
                      {{ identityData()?.socialName || identityData()?.userName || 'Viajante' }}
                    </h3>
                    <span class="text-secondary small">DNA do viajante</span>
                  </div>
                </div>

                <!-- Miniatura do Cartão Horizon (Verde para Eco, Azul para Comum) -->
                <div class="rounded-3 overflow-hidden shadow-sm flex-shrink-0" style="width: 84px; height: 112px;">
                  @if (isEcoQuizChoice()) {
                    <img src="assets/horizon-verde.webp" alt="Horizon Ecoturismo" class="w-100 h-100 object-fit-cover d-block" />
                  } @else {
                    <img src="assets/horizon45.webp" alt="Horizon Viagem" class="w-100 h-100 object-fit-cover d-block" />
                  }
                </div>
              </div>

              <!-- Meio: Afinidades Mapeadas -->
              <div class="my-3">
                <span class="text-uppercase fw-bold d-block mb-3"
                      [style.color]="isEcoQuizChoice() ? '#65A30D' : '#5BA4D8'"
                      style="font-size: 0.78rem; letter-spacing: 0.08em;">
                  AFINIDADES
                </span>

                <div class="d-flex flex-column gap-3">
                  @for (aff of displayAffinities(); track aff.label) {
                    <div>
                      <div class="d-flex justify-content-between align-items-end mb-1">
                        <span class="fw-bold text-dark small">{{ aff.label }}</span>
                        <span class="fw-bold text-dark small">{{ aff.pct }}</span>
                      </div>
                      <div class="progress overflow-hidden" style="height: 8px; border-radius: 6px; background-color: #e2e8f0;">
                        <div 
                          class="progress-bar" 
                          role="progressbar" 
                          [style.width.%]="aff.pct"
                          [style.background-color]="isEcoQuizChoice() ? '#65A30D' : '#5BA4D8'"
                          style="border-radius: 6px; transition: width 1s ease;"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Como o Horizon te Vê (Idêntico a /recommendations) -->
              <div class="my-2">
                <span class="text-uppercase fw-bold d-block mb-2"
                      [style.color]="isEcoQuizChoice() ? '#65A30D' : '#5BA4D8'"
                      style="font-size: 0.8rem; letter-spacing: 0.08em;">
                  COMO O HORIZON TE VÊ
                </span>

                <h2 class="fw-bold text-dark mb-2" style="font-size: 1.75rem; line-height: 1.25; letter-spacing: -0.5px;">
                  O seu coração pede por 
                  <span [style.color]="isEcoQuizChoice() ? '#65A30D' : '#5BA4D8'">
                    {{ displayAffinities()[0]?.label || 'Novas Experiências' }}
                  </span>
                </h2>

                <p class="text-secondary mb-0" style="font-size: 0.98rem; line-height: 1.6;">
                  Você busca experiências marcadas por 
                  <strong class="text-dark">{{ (displayAffinities()[0]?.label || 'viagens personalizadas') | lowercase }}</strong>@if (displayAffinities()[1]) { e <strong class="text-dark">{{ displayAffinities()[1].label | lowercase }}</strong>}. O algoritmo entende você como um viajante que procura destinos focados nestas características.
                </p>
              </div>

              <!-- Botões de Ação -->
              <div class="d-flex flex-column align-items-center gap-2 w-100 pt-2">
                <a 
                  routerLink="/recommendations" 
                  class="btn w-100 py-3 rounded-2 fw-bold shadow-sm fs-6 border-0 text-white d-flex align-items-center justify-content-center text-decoration-none"
                  [style.background-color]="isEcoQuizChoice() ? '#65A30D' : '#5BA4D8'"
                  style="max-width: 340px;"
                >
                  Ver Destinos Compatíveis
                </a>
                <button 
                  type="button" 
                  class="btn btn-link text-muted text-decoration-none py-1 fw-semibold small"
                  (click)="resetQuiz()"
                >
                  Refazer Quiz
                </button>
              </div>

            </div>
          }

          <!-- Estado: Wizard de Perguntas & Orçamento -->
          @else if (quiz() && quiz()!.questions && quiz()!.questions.length > 0) {
            
            <!-- PASSO ATUAL: PERGUNTA DINÂMICA -->
            @if (currentStep() < quiz()!.questions.length) {
              @let currentQuestion = quiz()!.questions[currentStep()];

              <div class="card border-0 shadow-sm rounded-4 bg-white question-wizard-card position-relative overflow-hidden p-0 d-flex flex-column" style="min-height: 770px;">
                
                <!-- Tutorial Overlay (Apenas no início) -->
                @if (showSwipeTutorial() && currentStep() === 0) {
                  <div class="position-absolute top-0 start-0 w-100 h-100 z-3 d-flex flex-column text-white" style="background: rgba(35, 35, 35, 0.96); border-radius: inherit; backdrop-filter: blur(4px);">
                    <div class="position-relative w-100 h-100">
                      <!-- Linha divisória vertical central -->
                      <div class="position-absolute top-0 bottom-0 start-50 border-start border-secondary opacity-50"></div>
                      
                      <div class="row h-100 m-0">
                        <!-- Lado Esquerdo -->
                        <div class="col-6 d-flex flex-column align-items-center justify-content-center p-3 text-center">
                          <p class="fw-bold fs-6 mb-4 px-2" style="max-width: 250px;">Arraste para a esquerda caso não concorde com essa opção.</p>
                          <div class="position-relative" style="width: 140px; height: 180px;">
                            <div class="bg-secondary rounded-4 position-absolute top-0 start-0 w-100 h-100" style="opacity: 0.3;"></div>
                            <img src="https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=400&q=80" alt="Exemplo Discordar" class="position-absolute top-0 start-0 rounded-4 shadow-lg object-fit-cover w-100 h-100" style="transform: rotate(-12deg) translateX(-15px) translateY(-5px); border: 2px solid rgba(255,255,255,0.1);" />
                          </div>
                        </div>

                        <!-- Lado Direito -->
                        <div class="col-6 d-flex flex-column align-items-center justify-content-center p-3 text-center">
                          <div class="position-relative mb-4" style="width: 140px; height: 180px;">
                            <div class="bg-secondary rounded-4 position-absolute top-0 start-0 w-100 h-100" style="opacity: 0.3;"></div>
                            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" alt="Exemplo Selecionar" class="position-absolute top-0 start-0 rounded-4 shadow-lg object-fit-cover w-100 h-100" style="transform: rotate(12deg) translateX(15px) translateY(5px); border: 2px solid rgba(255,255,255,0.1);" />
                          </div>
                          <p class="fw-bold fs-6 px-2" style="max-width: 250px;">Arraste para a direita para selecionar.</p>
                        </div>
                      </div>
                      
                      <!-- Botão Começar centralizado na base -->
                      <div class="position-absolute bottom-0 start-50 translate-middle-x mb-4 pb-2 z-3">
                        <button class="btn btn-light rounded-2 px-5 py-3 fw-bold fs-5 text-dark" style="box-shadow: 0 4px 15px rgba(0,0,0,0.5);" (click)="showSwipeTutorial.set(false)">Começar</button>
                      </div>
                    </div>
                  </div>
                }

                <!-- Sessão da Pergunta pintada de azul com texto em branco -->
                <div class="p-4 text-white d-flex flex-column justify-content-between" style="background-color: #5BA4D8; min-height: 180px; height: 180px;">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="badge rounded-2 px-3 py-2 fw-bold bg-white text-primary">
                      @if (selectedAnswers()[currentQuestion.id]) {
                        ✓ Escolha Selecionada
                      } @else {
                        Pergunta {{ currentStep() + 1 }} de {{ quiz()!.questions.length }}
                      }
                    </span>
                  </div>

                  <h2 class="h4 fw-bold text-white mb-2">
                    {{ currentQuestion.text }}
                  </h2>
                  <p class="text-white text-opacity-75 small mb-0">
                    Selecione apenas uma única opção
                  </p>
                </div>

                <div class="p-4 p-md-5 pt-4 d-flex flex-column justify-content-between flex-grow-1" style="min-height: 590px;">
                  <!-- Container do Swipe (Tinder Cards) -->
                  <div class="position-relative mx-auto mt-4 mb-5 user-select-none" style="width: 260px; height: 380px;">
                    @for (answer of currentQuestion.answers; track answer.id; let i = $index) {
                      @if (i >= topCardIndex() && i < topCardIndex() + 3) {
                        <div 
                          class="position-absolute w-100 h-100 rounded-4 shadow-lg bg-light"
                          [style.z-index]="currentQuestion.answers.length - i"
                          [style.transform]="getCardTransform(i - topCardIndex())"
                          [style.opacity]="getCardOpacity(i - topCardIndex())"
                          [style.transition]="isDragging() && i === topCardIndex() ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease'"
                          [style.cursor]="i === topCardIndex() ? 'grab' : 'auto'"
                          (mousedown)="startDrag($event, i)"
                          (touchstart)="startDrag($event, i)"
                        >
                           <img [src]="getOptionVisual(answer.text).image" class="w-100 h-100 object-fit-cover rounded-4" style="pointer-events: none;" />
                           
                           <!-- Etiqueta flutuante retangular -->
                           <div class="position-absolute bg-light text-dark shadow-sm px-4 py-2 rounded-2"
                                style="top: 30px; right: -25px; background: rgba(240, 240, 240, 0.95) !important;">
                             <span class="fw-bold fs-6" style="letter-spacing: -0.02em;">{{ answer.text }}</span>
                           </div>

                           <!-- Overlay Dinâmico Swipe -->
                           @if (isDragging() && i === topCardIndex()) {
                             <div class="position-absolute top-50 start-50 translate-middle w-100 h-100 pointer-events-none d-flex align-items-center justify-content-center" style="border-radius: inherit;">
                               @if (dragDeltaX > 60) {
                                 <div class="position-absolute bg-success w-100 h-100 rounded-4" style="opacity: 0.15;"></div>
                                 <i class="bi bi-check-circle-fill text-success position-relative z-3 shadow-sm bg-white rounded-circle" style="font-size: 5rem;"></i>
                               }
                               @if (dragDeltaX < -60) {
                                 <div class="position-absolute bg-danger w-100 h-100 rounded-4" style="opacity: 0.15;"></div>
                                 <i class="bi bi-x-circle-fill text-danger position-relative z-3 shadow-sm bg-white rounded-circle" style="font-size: 5rem;"></i>
                               }
                             </div>
                           }
                        </div>
                      }
                    }
                  </div>
                  
                  <div class="text-center text-muted small mt-2 fw-medium">
                    Opção {{ topCardIndex() + 1 }} de {{ currentQuestion.answers.length }}
                  </div>
                </div>

              </div>
            }

            <!-- PASSO FINAL: ORÇAMENTO & INVESTIMENTO (ESTILO FIGMA) -->
            @else {
              <div class="card border-0 shadow-sm rounded-4 bg-white question-wizard-card position-relative overflow-hidden p-0 d-flex flex-column" style="min-height: 770px;">
                
                <!-- Topo Azul: Meu Orçamento (*Por pessoa) -->
                <div class="p-4 text-white text-center d-flex flex-column justify-content-center align-items-center" style="background-color: #5BA4D8; min-height: 180px; height: 180px;">
                  <span class="text-white text-opacity-75 small mb-1" style="font-size: 0.85rem; letter-spacing: 0.02em;">*Por pessoa</span>
                  <h2 class="h3 fw-bold text-white mb-2">Meu orçamento</h2>
                  <div class="display-6 fw-bold text-white">
                    {{ formatCurrency(budget()) }}
                  </div>
                </div>

                <!-- Corpo Branco: Input, Finalizar Quiz e Voltar -->
                <div class="p-4 p-md-5 bg-white text-center d-flex flex-column align-items-center justify-content-center flex-grow-1" style="min-height: 590px;">
                  
                  <div class="mb-4 w-100">
                    <div class="d-flex align-items-center rounded-3 border border-2 shadow-sm mx-auto position-relative bg-white px-4 py-2" style="max-width: 320px; border-color: #e2e8f0 !important;">
                      <span class="text-secondary fw-bold fs-4 me-3">R$</span>
                      <input 
                        type="text" 
                        class="border-0 text-dark fw-bold shadow-none fs-4 flex-grow-1 bg-transparent p-0" 
                        style="outline: none !important; box-shadow: none !important; border: none !important;"
                        [value]="budget()"
                        (input)="onBudgetInput($event)"
                        (blur)="onBudgetBlur($event)"
                        placeholder="Ex: 15000"
                      />
                    </div>
                    @if (budgetError()) {
                      <div class="text-danger small mt-2 fw-semibold animate__animated animate__fadeIn">{{ budgetError() }}</div>
                    }
                  </div>

                  <div class="d-flex flex-column align-items-center gap-2 w-100 mt-2">
                    <button 
                      type="button" 
                      [disabled]="!isBudgetValid() || isSubmitting()"
                      (click)="onSubmit()"
                      class="btn w-100 py-3 rounded-2 fw-bold shadow-sm fs-5 border-0 text-white d-flex align-items-center justify-content-center"
                      style="background-color: #5BA4D8; max-width: 320px; transition: transform 0.2s;"
                    >
                      @if (isSubmitting()) {
                        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Finalizando...
                      } @else {
                        Finalizar Quiz
                      }
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-link text-muted text-decoration-none py-2 fw-semibold"
                      (click)="prevStep()"
                    >
                      Voltar
                    </button>
                  </div>

                </div>

              </div>
            }
          }

        </div>

        <!-- COLUNA LATERAL DIREITA -->
        <div class="col-12 col-lg-3 d-none d-lg-block">
          <aside>
             <div class="rounded-4 overflow-hidden shadow-sm">
               <img src="assets/Group14.png" alt="Horizon Travel" class="w-100 d-block" loading="lazy">
             </div>
          </aside>
        </div>

      </div>
    </main>

    <!-- Footer -->
    <app-footer></app-footer>
  `,
  styles: [`

    .question-wizard-card {
      min-height: 770px;
      height: 770px;
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 991.98px) {
      .question-wizard-card {
        height: auto;
        min-height: 770px;
      }
    }
    .text-primary { color: #4895CC !important; }
    .bg-primary { background-color: #4895CC !important; }
    .btn-primary { background-color: #4895CC !important; border-color: #4895CC !important; color: white !important; }
    .progress-bar { background-color: #4895CC !important; }
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

    

    .backdrop-blur {
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .progress-track {
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
    }

    .progress-bar-glow {
      background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.8);
      transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* Stepper Pills */
    .stepper-pill {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.7);
      transition: all 0.25s ease;
    }

    .stepper-pill:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #fff;
    }

    .stepper-pill-active {
      background: #38bdf8 !important;
      border-color: #38bdf8 !important;
      color: #07192f !important;
      box-shadow: 0 0 14px rgba(56, 189, 248, 0.5);
    }

    .stepper-pill-done {
      background: rgba(16, 185, 129, 0.2) !important;
      border-color: rgba(16, 185, 129, 0.4) !important;
      color: #6ee7b7 !important;
    }

    .stepper-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    /* Cards Visuais de Perguntas */
    /* Cards Estilo Swiss Chalet (Referência Fiel da Imagem) */
    .swiss-chalet-card {
      width: 100%;
      max-width: 300px;
      height: 450px; /* Altura significativamente maior que a largura */
      border-radius: 32px;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      position: relative;
      overflow: hidden;
      background: #111;
      /* CLIPPING RIGOROSO 100% BLINDADO CONTRA VAZAMENTO: CLIP-PATH + MASK-IMAGE */
      clip-path: inset(0 round 32px);
      -webkit-mask-image: -webkit-radial-gradient(white, black);
      mask-image: radial-gradient(white, black);
      isolation: isolate;
      transform: translateZ(0);
      transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.35s ease, border-color 0.25s ease;
    }

    .swiss-chalet-card:hover {
      transform: translateY(-8px);
    }

    /* Borda Azul para os de CIMA (Linha 1) */
    .card-border-blue {
      border: 3px solid #0284c7 !important;
      box-shadow: 0 10px 28px rgba(2, 132, 199, 0.25);
    }
    .card-border-blue:hover {
      border-color: #38bdf8 !important;
      box-shadow: 0 16px 36px rgba(56, 189, 248, 0.45);
    }
    .swiss-chalet-card.is-selected.card-border-blue {
      border-color: #38bdf8 !important;
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.65) !important;
      transform: translateY(-5px);
    }

    /* Borda Verde para os de BAIXO (Linha 2) */
    .card-border-green {
      border: 3px solid #10b981 !important;
      box-shadow: 0 10px 28px rgba(16, 185, 129, 0.25);
    }
    .card-border-green:hover {
      border-color: #34d399 !important;
      box-shadow: 0 16px 36px rgba(52, 211, 153, 0.45);
    }
    .swiss-chalet-card.is-selected.card-border-green {
      border-color: #34d399 !important;
      box-shadow: 0 0 35px rgba(52, 211, 153, 0.65) !important;
      transform: translateY(-5px);
    }

    /* A imagem de fundo preenche o CARD INTEIRO sem nenhum vazamento */
    .swiss-full-bg-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 29px; /* Corta perfeitamente no raio interno da borda */
      transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    .swiss-chalet-card:hover .swiss-full-bg-img {
      transform: scale(1.06);
    }

    /* Camada de Frosted Glass / Blur:
       Diminuída significativamente para começar bem mais em baixo (apenas 36% da base),
       deixando os 64% superiores totalmente livres, nítidos e claros! */
    .swiss-glass-blur-layer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 38%;
      border-radius: 0 0 29px 29px;
      backdrop-filter: blur(24px) saturate(135%) brightness(0.72);
      -webkit-backdrop-filter: blur(24px) saturate(135%) brightness(0.72);
      background: linear-gradient(
        180deg, 
        rgba(0, 0, 0, 0.05) 0%, 
        rgba(0, 0, 0, 0.25) 30%, 
        rgba(0, 0, 0, 0.62) 100%
      );
      mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 100%);
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 100%);
      pointer-events: none;
      z-index: 1;
    }

    .swiss-card-content {
      padding: 16px 20px 22px 20px;
      margin-top: auto;
      z-index: 2;
    }

    .swiss-card-title {
      font-size: 1.45rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
      line-height: 1.25;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
    }

    .swiss-card-btn {
      width: 100%;
      background: #ffffff;
      color: #111827;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 14px 20px;
      border-radius: 9999px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }

    .swiss-chalet-card:hover .swiss-card-btn {
      background: #f8fafc;
      transform: scale(1.02);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }

    .swiss-card-btn.btn-selected {
      background: #38bdf8 !important;
      color: #07192f !important;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.6) !important;
    }

    .card-border-green .swiss-card-btn.btn-selected {
      background: #10b981 !important;
      color: #ffffff !important;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.6) !important;
    }

    .swiss-selected-glow {
      position: absolute;
      inset: -2px;
      border: 2px solid #38bdf8;
      border-radius: 32px;
      pointer-events: none;
      box-shadow: inset 0 0 22px rgba(56, 189, 248, 0.35);
      z-index: 4;
    }

    .card-border-green .swiss-selected-glow {
      border-color: #34d399 !important;
      box-shadow: inset 0 0 22px rgba(52, 211, 153, 0.35) !important;
    }

    /* Orçamento Tiers */
    .budget-tier-card {
      background: #f8fafc;
      border-color: #e2e8f0 !important;
      transition: all 0.2s ease;
    }

    .budget-tier-card:hover {
      background: #f0f9ff;
      border-color: #7dd3fc !important;
      transform: translateY(-2px);
    }

    .budget-tier-card.budget-tier-active {
      background: #eff6ff !important;
      border-color: #0284c7 !important;
      box-shadow: 0 4px 16px rgba(2, 132, 199, 0.2) !important;
    }

    .budget-display-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-color: #bae6fd !important;
    }

    .budget-gradient-text {
      background: linear-gradient(90deg, #0369a1 0%, #0284c7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .custom-slider {
      accent-color: #0284c7;
      height: 8px;
    }

    /* Archetype Hero */
    .archetype-hero {
      background: linear-gradient(135deg, #07192f 0%, #0b2545 50%, #0369a1 100%);
    }

    .sparkle-circle {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      border: 2px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.3);
    }

    .letter-spacing {
      letter-spacing: 0.08em;
    }

    /* Radar scan animation */
    .radar-scan-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 2px solid rgba(56, 189, 248, 0.4);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(56, 189, 248, 0.25);
    }

    .radar-icon {
      font-size: 40px;
      animation: floatIcon 3s ease-in-out infinite;
    }

    @keyframes floatIcon {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .radar-sweep {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent 70%, rgba(56, 189, 248, 0.6) 100%);
      animation: spinRadar 2s linear infinite;
    }

    @keyframes spinRadar {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .pulse-btn {
      transition: all 0.25s ease;
    }

    .pulse-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(2, 132, 199, 0.4) !important;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    :host .card,
    :host .card:hover {
      transform: none !important;
      box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
    }
  `]
})
export class QuizFlowComponent implements OnInit {
  private quizService = inject(QuizService);
  private tokenStorage = inject(TokenStorageService);
  private identityService = inject(TravelerIdentityService);

  quiz = signal<Quiz | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  submitErrorMessage = signal<string | null>(null);
  isSubmitted = signal(false);
  identityData = signal<TravelerIdentityState | null>(null);

  // Navegação Wizard
  currentStep = signal(0);
  selectedAnswers = signal<Record<number, number>>({});

  budget = signal<number | null>(15000);
  budgetError = signal<string | null>(null);

  onBudgetInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Aggressively remove anything that is not a digit (including -, +, letters)
    let cleaned = input.value.replace(/\D/g, '');
    
    if (cleaned === '') {
      this.budgetError.set("Digite um valor válido.");
      this.budget.set(0);
      input.value = ''; // Force UI sync
      return;
    }

    let num = parseInt(cleaned, 10);
    
    // Aggressive immediate validation
    if (num > 30000) {
      this.budgetError.set("O limite máximo permitido é R$ 30.000");
      num = 30000;
    } else if (num < 1000) {
      this.budgetError.set("O valor mínimo é R$ 1.000");
    } else {
      this.budgetError.set(null);
    }
    
    this.budget.set(num);
    input.value = num.toString(); // Force UI sync exactly to valid number
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


  // Mapeamento de Tiers de Orçamento
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
  // Swipe State
  showSwipeTutorial = signal<boolean>(true);
  topCardIndex = signal<number>(0);
  isDragging = signal<boolean>(false);
  dragStartX = signal<number>(0);
  dragCurrentX = signal<number>(0);

  get dragDeltaX() {
    return this.isDragging() ? this.dragCurrentX() - this.dragStartX() : 0;
  }

  visualMap: Record<string, OptionVisual> = {
    'ecoturismo': {
      image: 'assets/eco.webp',
      icon: '🌿',
      subtitle: 'Florestas, trilhas, cachoeiras e conexão pura com a natureza.',
      tag: 'Biofilia e Aventura'
    },
    'viagem tradicional': {
      image: 'assets/urban.webp',
      icon: '🏙️',
      subtitle: 'Grandes metrópoles, compras, museus cosmopolitas e arquitetura.',
      tag: 'Cosmopolita e Urbano'
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
      image: 'assets/sawan.webp',
      icon: '🦁',
      subtitle: 'Safáris, observação de animais e santuários ecológicos.',
      tag: 'Vida Selvagem'
    },
    'vida selvagem': {
      image: 'assets/sawan.webp',
      icon: '🦁',
      subtitle: 'Safáris, observação de animais e santuários ecológicos.',
      tag: 'Vida Selvagem'
    },
    'cultura e história': {
      image: 'assets/h.webp',
      icon: '🏛️',
      subtitle: 'Ruínas ancestrais, cidades históricas, castelos e tradições.',
      tag: 'Patrimônio Histórico'
    },
    'cultura': {
      image: 'assets/h.webp',
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
      image: 'assets/ad.webp',
      icon: '🧗',
      subtitle: 'Trilhas íngremes, montanhismo e adrenalina em paisagens épicas.',
      tag: 'Adrenalina Pura'
    }
  };

  // Computeds de Progresso
  totalSteps = computed(() => {
    const qCount = this.quiz()?.questions?.length || 0;
    return qCount > 0 ? qCount + 1 : 0; // perguntas + passo do orçamento
  });

  stepList = computed(() => {
    const questions = this.quiz()?.questions || [];
    const list = questions.map((q, idx) => ({
      index: idx,
      label: `P${idx + 1}: ${this.getShortLabel(q.text)}`
    }));
    if (questions.length > 0) {
      list.push({ index: questions.length, label: 'Orçamento' });
    }
    return list;
  });

  progressPercentage = computed(() => {
    const total = this.totalSteps();
    if (total === 0) return 0;
    const answeredCount = Object.keys(this.selectedAnswers()).length + (this.isBudgetValid() && this.currentStep() === total - 1 ? 1 : 0);
    return Math.min(100, Math.round(((this.currentStep() + 1) / total) * 100));
  });

  // Cálculo Dinâmico do Arquétipo do Viajante
  liveArchetype = computed(() => {
    const answers = this.selectedAnswers();
    const qList = this.quiz()?.questions || [];
    
    const chosenTexts: string[] = [];
    for (const q of qList) {
      const chosenAnsId = answers[q.id];
      if (chosenAnsId) {
        const ansObj = q.answers.find(a => a.id === chosenAnsId);
        if (ansObj) {
          chosenTexts.push(ansObj.text.toLowerCase());
        }
      }
    }

    const isEco = chosenTexts.some(t => t.includes('eco') || t.includes('natureza'));
    const isTrad = chosenTexts.some(t => t.includes('tradicional') || t.includes('urbana'));
    const isSnow = chosenTexts.some(t => t.includes('neve') || t.includes('frio'));
    const isSun = chosenTexts.some(t => t.includes('sol') || t.includes('calor'));
    const isHistory = chosenTexts.some(t => t.includes('história') || t.includes('cultura'));
    const isAdventure = chosenTexts.some(t => t.includes('aventura'));
    const isGourmet = chosenTexts.some(t => t.includes('gastronomia'));

    if (isEco && isSnow) {
      return {
        title: 'O Nômade dos Picos e Geleiras',
        icon: '🏔️',
        tagline: 'Seu coração bate forte por montanhas nevadas e silêncio monumental.',
        description: 'Você encontra paz em paisagens intocadas pelo homem, ar puro das altitudes e o desafio revigorante de climas frios.',
        topAffinities: [
          { label: 'Ecoturismo e Natureza', pct: 95, color: '#10b981' },
          { label: 'Neve e Clima Frio', pct: 92, color: '#38bdf8' },
          { label: 'Aventura Selvagem', pct: 86, color: '#6366f1' }
        ]
      };
    } else if (isEco && isAdventure) {
      return {
        title: 'O Desbravador da Biosfera',
        icon: '🌿',
        tagline: 'Expedições reais, adrenalina pura e respeito à vida selvagem.',
        description: 'Você não viaja apenas para passear: viaja para se fundir com os biomas mais ricos do planeta e viver histórias inesquecíveis.',
        topAffinities: [
          { label: 'Ecoturismo Intenso', pct: 98, color: '#10b981' },
          { label: 'Aventura e Desafios', pct: 92, color: '#f59e0b' },
          { label: 'Vida Selvagem', pct: 88, color: '#06b6d4' }
        ]
      };
    } else if (isEco && isSun) {
      return {
        title: 'O Guardião das Águas Tropicais',
        icon: '🌊',
        tagline: 'Piscinas naturais, recifes de corais e brisa litorânea pura.',
        description: 'Sua viagem perfeita combina biodiversidade marinha, muito sol e a preservação dos mais belos santuários litorâneos.',
        topAffinities: [
          { label: 'Ecoturismo e Praias', pct: 95, color: '#10b981' },
          { label: 'Sol e Calor Radiante', pct: 90, color: '#f59e0b' },
          { label: 'Relaxamento e Natureza', pct: 85, color: '#06b6d4' }
        ]
      };
    } else if (isTrad && isHistory) {
      return {
        title: 'O Cronista das Grandes Civilizações',
        icon: '🏛️',
        tagline: 'Ruínas milenares, museus e segredos guardados na arquitetura.',
        description: 'Você viaja no espaço e no tempo: ruas de paralelepípedo, bibliotecas antigas e castelos são seus templos sagrados.',
        topAffinities: [
          { label: 'Cultura e História', pct: 96, color: '#8b5cf6' },
          { label: 'Turismo Urbano', pct: 88, color: '#38bdf8' },
          { label: 'Arquitetura Clássica', pct: 85, color: '#ec4899' }
        ]
      };
    } else if (isTrad && isGourmet) {
      return {
        title: 'O Bon Vivant Cosmopolita',
        icon: '🍷',
        tagline: 'Alta gastronomia, vinhos premiados e a pulsação das metrópoles.',
        description: 'Para você, cada viagem é um banquete sensorial: mesas concorridas, luzes de neon e as esquinas mais elegantes do mundo.',
        topAffinities: [
          { label: 'Alta Gastronomia', pct: 96, color: '#ef4444' },
          { label: 'Vida Urbana e Noite', pct: 90, color: '#38bdf8' },
          { label: 'Cultura Cosmopolita', pct: 85, color: '#8b5cf6' }
        ]
      };
    } else if (isSun) {
      return {
        title: 'O Explorador do Verão Eterno',
        icon: '☀️',
        tagline: 'Onde o sol brilhar e o mar for azul, é para lá que você vai.',
        description: 'Energia solar, pores do sol inesquecíveis e momentos de puro descanso com a melhor infraestrutura do mundo.',
        topAffinities: [
          { label: 'Calor e Sol', pct: 98, color: '#f59e0b' },
          { label: 'Praias e Resorts', pct: 90, color: '#06b6d4' },
          { label: 'Relaxamento Total', pct: 85, color: '#10b981' }
        ]
      };
    } else {
      return {
        title: 'O Curador de Horizontes',
        icon: '🧭',
        tagline: 'Mente aberta, olhar curioso e flexibilidade para o extraordinário.',
        description: 'Você não tem amarras: busca tanto a serenidade da natureza quanto a energia vibrante dos centros urbanos.',
        topAffinities: [
          { label: 'Versatilidade Global', pct: 90, color: '#38bdf8' },
          { label: 'Experiências Novas', pct: 88, color: '#10b981' },
          { label: 'Descoberta Autêntica', pct: 85, color: '#8b5cf6' }
        ]
      };
    }
  });

  realUserAffinities = computed(() => {
    const qList = this.quiz()?.questions || [];
    const answers = this.selectedAnswers();
    const list: { label: string; pct: number }[] = [];

    const percentages = [95, 90, 85, 80, 75];
    let pIdx = 0;

    for (const q of qList) {
      const aId = answers[q.id];
      if (aId !== undefined) {
        const ans = q.answers?.find(a => a.id === aId);
        if (ans) {
          list.push({
            label: ans.text,
            pct: percentages[pIdx % percentages.length]
          });
          pIdx++;
        }
      }
    }

    return list;
  });

  ngOnInit(): void {
    this.loadQuiz();
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

  
  startDrag(event: MouseEvent | TouchEvent, idx: number): void {
    if (this.isDragging() || idx !== this.topCardIndex()) return;
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

    const SWIPE_THRESHOLD = 90;
    
    if (delta > SWIPE_THRESHOLD) {
      this.handleSwipeRight();
    } else if (delta < -SWIPE_THRESHOLD) {
      this.handleSwipeLeft();
    } else {
      this.dragStartX.set(0);
      this.dragCurrentX.set(0);
    }
  };

  handleSwipeLeft() {
    const currentQ = this.quiz()!.questions[this.currentStep()];
    let nextIndex = this.topCardIndex() + 1;
    if (nextIndex >= currentQ.answers.length) {
      nextIndex = 0; // loop
    }
    this.topCardIndex.set(nextIndex);
  }

  handleSwipeRight() {
    const currentQ = this.quiz()!.questions[this.currentStep()];
    const selectedAnswerId = currentQ.answers[this.topCardIndex()].id;
    
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
    
    const translateY = indexOffset * 12;
    const scale = Math.max(0, 1 - (indexOffset * 0.04));
    return `translate3d(0, ${translateY}px, 0) scale(${scale})`;
  }

  getCardOpacity(indexOffset: number): number {
    return indexOffset < 3 && indexOffset >= 0 ? 1 - (indexOffset * 0.1) : 0;
  }


  selectAnswer(questionId: number, answerId: number): void {
    const current = { ...this.selectedAnswers() };
    current[questionId] = answerId;
    this.selectedAnswers.set(current);

    // Auto-advance suave após 400ms se não for o último passo
    const totalQ = this.quiz()?.questions?.length || 0;
    if (this.currentStep() < totalQ) {
      setTimeout(() => {
        if (this.currentStep() < totalQ) {
          this.currentStep.set(this.currentStep() + 1);
      this.topCardIndex.set(0);
        }
      }, 420);
    }
  }

  goToStep(stepIndex: number): void {
    const total = this.totalSteps();
    if (stepIndex >= 0 && stepIndex < total) {
      this.currentStep.set(stepIndex);
      this.topCardIndex.set(0);
    }
  }

  nextStep(): void {
    const total = this.totalSteps();
    if (this.currentStep() < total - 1) {
      this.currentStep.set(this.currentStep() + 1);
      this.topCardIndex.set(0);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
      this.topCardIndex.set(0);
    }
  }

  isStepDone(stepIndex: number): boolean {
    const questions = this.quiz()?.questions || [];
    if (stepIndex < questions.length) {
      const q = questions[stepIndex];
      return this.selectedAnswers()[q.id] !== undefined;
    }
    return this.isBudgetValid();
  }

  getStepTitle(stepIndex: number): string {
    const questions = this.quiz()?.questions || [];
    if (stepIndex < questions.length) {
      return questions[stepIndex].text;
    }
    return 'Orçamento Planejado';
  }

  private getShortLabel(questionText: string): string {
    const lower = questionText.toLowerCase();
    if (lower.includes('estilo')) return 'Estilo';
    if (lower.includes('clima')) return 'Clima';
    if (lower.includes('experiência') || lower.includes('procura')) return 'Experiência';
    return 'Pergunta';
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

  hasAnyAnswer(): boolean {
    return Object.keys(this.selectedAnswers()).length > 0;
  }

  getAnswerById(question: any, answerId?: number): any {
    if (!answerId || !question || !question.answers) return null;
    return question.answers.find((a: any) => a.id === answerId);
  }

  isBudgetValid(): boolean {
    const b = this.budget();
    return b !== null && b !== undefined && b >= 1000 && b <= 30000;
  }

  isFormValid(): boolean {
    const currentQuiz = this.quiz();
    if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) {
      return false;
    }

    const answers = this.selectedAnswers();
    const allAnswered = currentQuiz.questions.every(q => {
      if (q.required === false) return true;
      return answers[q.id] !== undefined;
    });

    return allAnswered && this.isBudgetValid();
  }

  onSubmit(): void {
    if (!this.isFormValid()) return;

    this.isSubmitting.set(true);
    this.submitErrorMessage.set(null);

    const answersMap: Record<string, number> = {};
    Object.entries(this.selectedAnswers()).forEach(([qId, aId]) => {
      answersMap[qId] = aId;
    });

    const payload: SubmitQuizRequest = {
      answers: answersMap,
      budgetPerPerson: this.budget()!
    };

    const quizId = this.quiz()?.id || null;

    this.quizService.submitQuiz(quizId, payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
        const uid = this.tokenStorage.getUserId();
        if (uid) {
          localStorage.setItem(`quizCompleted_${uid}`, 'true');
        }
        this.identityService.getTravelerIdentity().subscribe({
          next: (state) => {
            this.identityData.set(state);
          },
          error: () => {}
        });
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.submitErrorMessage.set(error.message || 'Erro ao salvar as respostas do quiz.');
      }
    });
  }

  isEcoQuizChoice = computed(() => {
    const affinities = this.realUserAffinities();
    return affinities.some(a => a.label.toLowerCase().includes('eco'));
  });

  displayAffinities = computed(() => {
    const idState = this.identityData();
    if (idState && idState.topDimensions && idState.topDimensions.length > 0) {
      return idState.topDimensions.slice(0, 4).map(d => ({
        label: d.label,
        pct: d.percentage
      }));
    }
    return this.realUserAffinities();
  });

  resetQuiz(): void {
    this.isSubmitted.set(false);
    this.identityData.set(null);
    this.selectedAnswers.set({});
    this.budget.set(15000);
    this.currentStep.set(0);
    this.showSwipeTutorial.set(true);
    this.submitErrorMessage.set(null);
    this.loadQuiz();
  }

  setBudgetPreset(amount: number): void {
    this.budget.set(amount);
  }

  formatCurrency(value?: number | null): string {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  }

  readonly placeholderHero = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
  
  handleHeroError(event: any): void {
    event.target.src = this.placeholderHero;
  }
}
// trigger reload
// trigger reload 2
// trigger reload 3
// trigger reload 4
// trigger reload 5
// trigger reload 6
// trigger reload 7
// trigger reload 8
// trigger reload 9
// trigger reload 10
// trigger reload 11
// trigger reload 12
// trigger reload 13
// trigger reload 14
// trigger reload 15
// trigger reload 16
// trigger reload 17
// trigger reload 18
// trigger reload 19

