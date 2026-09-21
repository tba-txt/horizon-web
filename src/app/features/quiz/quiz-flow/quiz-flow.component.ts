import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { QuizService } from '../services/quiz.service';
import { Quiz, SubmitQuizRequest } from '../models/quiz.model';

@Component({
  selector: 'app-quiz-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/quiz.webp" 
        alt="Quiz Hero" 
        class="w-100 hero-image"
        (error)="handleHeroError($event)"
      />
    </header>

    <main class="container py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-9 col-lg-7">
          
          <!-- Header do Quiz -->
          <div class="mb-4">
            <h1 class="h3 fw-bold text-dark mb-1">
              Responda nosso Quiz
            </h1>
          </div>

          <!-- Estado: Loading -->
          @if (isLoading()) {
            <div class="d-flex flex-column align-items-center justify-content-center py-5">
              <div class="spinner-border text-primary mb-3" style="width: 2.5rem; height: 2.5rem;" role="status">
                <span class="visually-hidden">Carregando quiz...</span>
              </div>
              <p class="text-muted small">Carregando perguntas...</p>
            </div>
          }

          <!-- Estado: Erro -->
          @else if (errorMessage()) {
            <div class="alert alert-danger p-4 rounded-3 text-center" role="alert">
              <p class="mb-3 small">{{ errorMessage() }}</p>
              <button class="btn btn-outline-danger btn-sm px-4" (click)="loadQuiz()">
                Tentar novamente
              </button>
            </div>
          }

          <!-- Estado: Sucesso após submissão -->
          @else if (isSubmitted()) {
            <div class="card border rounded-3 text-center p-5 bg-white">
              <h2 class="h4 fw-bold text-dark mb-2">Perfil Atualizado com Sucesso</h2>
              <p class="text-muted small mb-4">
                Suas preferências e orçamento foram registrados pelo algoritmo de recomendação.
              </p>

              <div class="d-flex justify-content-center gap-3 flex-wrap">
                <a routerLink="/feed" class="btn btn-primary px-4 py-2 rounded-3 fw-semibold btn-sm">
                  Ir para o Feed →
                </a>
                <a routerLink="/recommendations" class="btn btn-outline-secondary px-4 py-2 rounded-3 fw-semibold btn-sm">
                  Ver Recomendações
                </a>
                <button class="btn btn-outline-secondary px-4 py-2 rounded-3 fw-semibold btn-sm" (click)="resetQuiz()">
                  Refazer Quiz
                </button>
              </div>
            </div>
          }

          <!-- Estado: Formulário do Quiz -->
          @else if (quiz() && quiz()!.questions && quiz()!.questions.length > 0) {
            <form (ngSubmit)="onSubmit()" novalidate>
              
              <!-- Lista de Perguntas Dinâmicas -->
              @for (question of quiz()!.questions; track question.id; let qIdx = $index) {
                <div class="card border rounded-3 p-4 mb-4 bg-white">
                  <h2 class="h6 fw-bold text-dark mb-3">
                    {{ qIdx + 1 }}. {{ question.text }}
                  </h2>

                  <div class="d-flex flex-column gap-2">
                    @for (answer of question.answers; track answer.id) {
                      <label 
                        class="quiz-option-label d-flex align-items-center p-3 rounded-2 border"
                        [class.selected]="selectedAnswers()[question.id] === answer.id"
                      >
                        <input 
                          type="radio" 
                          [name]="'question_' + question.id" 
                          [value]="answer.id" 
                          [checked]="selectedAnswers()[question.id] === answer.id"
                          (change)="selectAnswer(question.id, answer.id)"
                          class="form-check-input me-3 mt-0"
                        />
                        <span class="small text-dark">{{ answer.text }}</span>
                      </label>
                    }
                  </div>
                </div>
              }

              <!-- Seção de Orçamento -->
              <div class="card border rounded-3 p-4 mb-4 bg-white">
                <h2 class="h6 fw-bold text-dark mb-1">
                  Orçamento planejado por pessoa
                </h2>
                <p class="text-muted small mb-3">
                  Informe o valor entre R$ 1.000,00 e R$ 200.000,00.
                </p>

                <div class="col-12 col-sm-6">
                  <div class="input-group">
                    <span class="input-group-text bg-light text-secondary small">R$</span>
                    <input 
                      type="number" 
                      class="form-control" 
                      [class.is-invalid]="!isBudgetValid()"
                      [ngModel]="budget()" 
                      (ngModelChange)="budget.set($event)"
                      name="budgetPerPerson" 
                      min="1000" 
                      max="200000" 
                      step="100"
                      placeholder="5000"
                      required
                    />
                  </div>
                  @if (!isBudgetValid()) {
                    <div class="text-danger small mt-1">
                      O orçamento deve estar entre R$ 1.000 e R$ 200.000.
                    </div>
                  }
                </div>
              </div>

              <!-- Mensagem de Erro -->
              @if (submitErrorMessage()) {
                <div class="alert alert-danger py-2 px-3 mb-4 small" role="alert">
                  {{ submitErrorMessage() }}
                </div>
              }

              <!-- Botão de Envio -->
              <div class="pt-2">
                <button 
                  type="submit" 
                  [disabled]="!isFormValid() || isSubmitting()"
                  class="btn btn-primary px-4 py-2 rounded-3 fw-semibold w-100"
                >
                  @if (isSubmitting()) {
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                    <span>Salvando perfil...</span>
                  } @else {
                    <span>Salvar Respostas e Atualizar Perfil</span>
                  }
                </button>
              </div>

            </form>
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

    .quiz-option-label {
      cursor: pointer;
      background: #ffffff;
      border-color: #e2e8f0 !important;
      transition: all 0.15s ease-in-out;
    }

    .quiz-option-label:hover {
      background: #f8fafc;
      border-color: #cbd5e1 !important;
    }

    .quiz-option-label.selected {
      background: #f0f7ff;
      border-color: #0d6efd !important;
    }
  `]
})
export class QuizFlowComponent implements OnInit {
  private quizService = inject(QuizService);

  quiz = signal<Quiz | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  submitErrorMessage = signal<string | null>(null);
  isSubmitted = signal(false);

  selectedAnswers = signal<Record<number, number>>({});
  budget = signal<number | null>(5000);

  readonly placeholderHero = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';

  handleHeroError(event: any): void {
    event.target.src = this.placeholderHero;
  }

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

  selectAnswer(questionId: number, answerId: number): void {
    const current = { ...this.selectedAnswers() };
    current[questionId] = answerId;
    this.selectedAnswers.set(current);
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
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.submitErrorMessage.set(error.message || 'Erro ao salvar as respostas do quiz.');
      }
    });
  }

  resetQuiz(): void {
    this.isSubmitted.set(false);
    this.selectedAnswers.set({});
    this.budget.set(5000);
    this.submitErrorMessage.set(null);
    this.loadQuiz();
  }
}
