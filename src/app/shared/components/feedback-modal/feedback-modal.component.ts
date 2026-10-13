import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { concat, of } from 'rxjs';
import { catchError, finalize, timeout, toArray } from 'rxjs/operators';
import { FeedbackService } from '../../../core/feedback/services/feedback.service';
import { FeedbackRequest, TargetType } from '../../../core/feedback/models/feedback.model';

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop fade show" (click)="close()"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="close()">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 560px;" (click)="$event.stopPropagation()">
          <div class="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
            
            <!-- Header Visual Horizon -->
            <div class="modal-header border-0 p-0 position-relative overflow-hidden" style="height: 88px;">
              <img 
                src="assets/cima-usuario.png" 
                alt="Horizon" 
                class="w-100 h-100 object-fit-cover"
              />
              <div class="position-absolute inset-0 w-100 h-100 d-flex justify-content-between align-items-center px-4" style="background: linear-gradient(135deg, rgba(11, 37, 69, 0.88) 0%, rgba(91, 164, 216, 0.82) 100%); top: 0; left: 0;">
                <div class="text-white">
                  <h2 class="h5 fw-bold mb-0 text-white">
                    @if (targetType() === 'TRIP' && destinationName()) {
                      Como foi sua viagem para {{ destinationName() }}?
                    } @else {
                      Vamos melhorar a Horizon juntos!
                    }
                  </h2>
                </div>
                <button type="button" class="btn-close btn-close-white" (click)="close()" aria-label="Fechar"></button>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="modal-body p-4">
              
              @if (isAlreadySubmitted()) {
                <div class="text-center py-3">
                  <div class="mb-2" style="color: #65A30D;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                  </div>
                  <h3 class="h6 fw-bold text-dark mb-1">Viagem já avaliada</h3>
                  <p class="text-secondary small mb-3">
                    Você já registrou sua avaliação para esta reserva. Obrigado por compartilhar sua experiência!
                  </p>
                  <button type="button" class="btn btn-horizon px-4 py-2 rounded-2 fw-semibold" (click)="close()">
                    Fechar
                  </button>
                </div>
              } @else if (isSuccess()) {
                <div class="text-center py-3">
                  <div class="mb-2" style="color: #65A30D;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                    </svg>
                  </div>
                  <h3 class="h6 fw-bold text-dark mb-1">Obrigado pela sua avaliação!</h3>
                  <p class="text-secondary small mb-3">
                    Suas notas foram salvas no banco de dados da Horizon com sucesso.
                  </p>
                  <button type="button" class="btn btn-horizon px-4 py-2 rounded-2 fw-semibold" (click)="close()">
                    Concluir
                  </button>
                </div>
              } @else {
                <form (ngSubmit)="submitFeedback()">
                  
                  <!-- 1. Satisfação Geral (1 a 5 estrelas amarelas) -->
                  <div class="mb-4">
                    <label class="form-label fw-bold text-dark small mb-2 d-block">
                      @if (targetType() === 'TRIP') {
                        1. Como você avalia sua experiência geral nesta viagem?
                      } @else {
                        1. Como está sendo sua experiência geral na Horizon?
                      }
                    </label>

                    <div class="d-flex gap-2">
                      @for (step of csatSteps; track step.score) {
                        <button
                          type="button"
                          class="csat-step-btn flex-fill py-2 px-1 rounded-2 d-flex flex-column align-items-center justify-content-center"
                          [class.active]="csatScore() === step.score"
                          (click)="csatScore.set(step.score)"
                        >
                          <div class="d-flex align-items-center justify-content-center gap-1 mb-1 star-row">
                            @for (starIdx of step.stars; track starIdx) {
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                @if (csatScore() === step.score) {
                                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                                } @else {
                                  <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>
                                }
                              </svg>
                            }
                          </div>
                          <span class="csat-step-label">{{ step.label }}</span>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- 2. Recomendação 0 a 10 (0-7 Vermelho, 8 Amarelo, 9-10 Verde) -->
                  <div class="mb-4">
                    <label class="form-label fw-bold text-dark small mb-2 d-block">
                      2. De 0 a 10, o quanto você recomendaria a Horizon para um amigo?
                    </label>

                    <div class="nps-grid">
                      @for (num of npsScores; track num) {
                        <button 
                          type="button" 
                          class="nps-box-btn rounded-2 fw-bold"
                          [class.nps-zone-red]="num <= 7"
                          [class.nps-zone-yellow]="num === 8"
                          [class.nps-zone-green]="num >= 9"
                          [class.active]="npsScore() === num"
                          (click)="npsScore.set(num)"
                        >
                          {{ num }}
                        </button>
                      }
                    </div>
                  </div>

                  <!-- 3. Destaques Rápidos (Tags Retangulares - Zero Pills) -->
                  <div class="mb-4">
                    <label class="form-label fw-bold text-dark small mb-2 d-block">
                      3. Quais pontos mais influenciaram sua nota? <span class="text-dark fw-normal">(opcional)</span>
                    </label>
                    <div class="d-flex flex-wrap gap-2">
                      @for (tag of currentHighlightTags(); track tag) {
                        <button
                          type="button"
                          class="highlight-tag-btn px-3 py-1 rounded-2 small fw-semibold"
                          [class.active]="isTagSelected(tag)"
                          (click)="toggleTag(tag)"
                        >
                          {{ tag }}
                        </button>
                      }
                    </div>
                  </div>

                  <!-- 4. Comentário Opcional (Sem placeholder) -->
                  <div class="mb-4">
                    <label for="feedbackComment" class="form-label fw-bold text-dark small mb-1">
                      4. Comentário adicional <span class="text-dark fw-normal">(opcional)</span>
                    </label>
                    <textarea 
                      id="feedbackComment" 
                      class="form-control rounded-2 small" 
                      rows="2" 
                      [(ngModel)]="commentText" 
                      name="comment"
                      maxlength="500"
                    ></textarea>
                  </div>

                  @if (errorMessage()) {
                    <div class="alert alert-danger py-2 px-3 small rounded-2 mb-3">
                      {{ errorMessage() }}
                    </div>
                  }

                  <!-- Botões de Ação (Cancelar em vermelho, Enviar em verde Horizon) -->
                  <div class="d-flex justify-content-end gap-2">
                    <button 
                      type="button" 
                      class="btn btn-cancel-red px-4 py-2 rounded-2 fw-bold shadow-sm small" 
                      (click)="close()"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      class="btn btn-horizon-green px-4 py-2 rounded-2 fw-bold shadow-sm small"
                      [disabled]="(csatScore() === null && npsScore() === null) || isSubmitting()"
                    >
                      @if (isSubmitting()) {
                        Enviando...
                      } @else {
                        Enviar Avaliação
                      }
                    </button>
                  </div>

                </form>
              }

            </div>

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .btn-horizon {
      background-color: #5BA4D8;
      color: #ffffff;
      border: 1px solid #5BA4D8;
      font-size: 0.88rem;
      transition: background-color 0.2s ease;
    }

    .btn-horizon:hover {
      background-color: #4895CC;
      border-color: #4895CC;
      color: #ffffff;
    }

    .btn-horizon-green {
      background-color: #65A30D;
      color: #ffffff;
      border: 1px solid #65A30D;
      font-size: 0.88rem;
      transition: background-color 0.2s ease;
    }

    .btn-horizon-green:hover:not(:disabled) {
      background-color: #558b0a;
      border-color: #558b0a;
      color: #ffffff;
    }

    .btn-cancel-red {
      background-color: #ef4444;
      color: #ffffff;
      border: 1px solid #ef4444;
      font-size: 0.88rem;
      transition: background-color 0.2s ease;
    }

    .btn-cancel-red:hover:not(:disabled) {
      background-color: #dc2626;
      border-color: #dc2626;
      color: #ffffff;
    }

    /* Botões 1 a 5 (Todos em amarelo, pois as estrelas são amarelas) */
    .csat-step-btn {
      background-color: #fffbeb;
      border: 1.5px solid #fde68a;
      color: #f59e0b;
      cursor: pointer;
      transition: all 0.15s ease;
      min-width: 0;
    }

    .csat-step-btn .star-row {
      color: #f59e0b;
    }

    .csat-step-label {
      font-size: 0.74rem;
      font-weight: 700;
      color: #b45309;
    }

    .csat-step-btn:hover {
      border-color: #f59e0b;
      background-color: #fef3c7;
    }

    .csat-step-btn.active {
      background-color: #f59e0b;
      border-color: #d97706;
      color: #ffffff;
    }

    .csat-step-btn.active .star-row,
    .csat-step-btn.active .csat-step-label {
      color: #ffffff;
    }

    /* Grade 0 a 10 (NPS com progressão de cores: 0-7 vermelho, 8 amarelo, 9-10 verde) */
    .nps-grid {
      display: grid;
      grid-template-columns: repeat(11, 1fr);
      gap: 6px;
    }

    .nps-box-btn {
      height: 38px;
      background-color: #f8fafc;
      border: 1.5px solid #e2e8f0;
      color: #334155;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.15s ease;
      padding: 0;
    }

    /* Zona 0 a 7: Vermelho */
    .nps-box-btn.nps-zone-red {
      border-color: #fecaca;
      background-color: #fff5f5;
      color: #b91c1c;
    }
    .nps-box-btn.nps-zone-red:hover,
    .nps-box-btn.nps-zone-red.active {
      background-color: #ef4444;
      border-color: #dc2626;
      color: #ffffff;
    }

    /* Zona 8: Amarelo */
    .nps-box-btn.nps-zone-yellow {
      border-color: #fde68a;
      background-color: #fffbeb;
      color: #b45309;
    }
    .nps-box-btn.nps-zone-yellow:hover,
    .nps-box-btn.nps-zone-yellow.active {
      background-color: #f59e0b;
      border-color: #d97706;
      color: #ffffff;
    }

    /* Zona 9 a 10: Verde Horizon (#65A30D) */
    .nps-box-btn.nps-zone-green {
      border-color: #d9f99d;
      background-color: #f7fee7;
      color: #3f6212;
    }
    .nps-box-btn.nps-zone-green:hover,
    .nps-box-btn.nps-zone-green.active {
      background-color: #65A30D;
      border-color: #558b0a;
      color: #ffffff;
    }

    /* Tags de destaque (Retangulares) */
    .highlight-tag-btn {
      background-color: #f8fafc;
      border: 1.5px solid #e2e8f0;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .highlight-tag-btn:hover {
      border-color: #5BA4D8;
      color: #0f172a;
      background-color: #f0f9ff;
    }

    .highlight-tag-btn.active {
      background-color: #5BA4D8;
      border-color: #5BA4D8;
      color: #ffffff;
    }
  `]
})
export class FeedbackModalComponent {
  private feedbackService = inject(FeedbackService);

  isOpen = input<boolean>(false);
  reservationId = input<number | null>(null);
  destinationName = input<string | null>(null);
  initialTargetType = input<TargetType>('PLATFORM');

  closed = output<void>();
  feedbackSubmitted = output<void>();

  targetType = signal<TargetType>('PLATFORM');
  csatScore = signal<number | null>(null);
  npsScore = signal<number | null>(null);
  selectedTags = signal<string[]>([]);
  commentText = '';
  isSubmitting = signal(false);
  isSuccess = signal(false);
  isAlreadySubmitted = signal(false);
  errorMessage = signal<string | null>(null);

  readonly npsScores = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  readonly csatSteps = [
    { score: 1, label: 'Péssima', stars: [1] },
    { score: 2, label: 'Ruim', stars: [1, 2] },
    { score: 3, label: 'Regular', stars: [1, 2, 3] },
    { score: 4, label: 'Boa', stars: [1, 2, 3, 4] },
    { score: 5, label: 'Excelente', stars: [1, 2, 3, 4, 5] }
  ];

  readonly platformTags = [
    'Busca de Voos',
    'Quiz de Perfil',
    'Recomendações',
    'Design e Navegação',
    'Preços e Ofertas',
    'Rapidez na Reserva'
  ];

  readonly tripTags = [
    'Pontualidade do Voo',
    'Conforto a Bordo',
    'Embarque e Bagagem',
    'Experiência no Destino',
    'Atendimento Horizon',
    'Custo-benefício'
  ];

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const target = this.initialTargetType();
        this.targetType.set(target);
        this.isSubmitting.set(false);
        this.checkAlreadySubmitted();
        this.errorMessage.set(null);
        this.isSuccess.set(false);
        this.csatScore.set(null);
        this.npsScore.set(null);
        this.selectedTags.set([]);
        this.commentText = '';
      }
    });
  }

  currentHighlightTags(): string[] {
    return this.targetType() === 'TRIP' ? this.tripTags : this.platformTags;
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }

  toggleTag(tag: string): void {
    this.selectedTags.update(list =>
      list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]
    );
  }

  checkAlreadySubmitted(): void {
    const submitted = this.feedbackService.hasSubmittedFeedback(
      this.targetType(),
      this.reservationId()
    );
    this.isAlreadySubmitted.set(submitted);
  }

  submitFeedback(): void {
    const csat = this.csatScore();
    const nps = this.npsScore();
    if (csat === null && nps === null) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const tagsPart = this.selectedTags().length > 0
      ? `[Destaques: ${this.selectedTags().join(', ')}] `
      : '';
    const userComment = this.commentText.trim();
    const fullComment = (tagsPart + userComment).trim() || undefined;

    const requests = [];

    if (csat !== null) {
      const csatPayload: FeedbackRequest = {
        reservationId: this.reservationId(),
        feedbackType: 'CSAT',
        targetType: this.targetType(),
        score: csat,
        comment: fullComment
      };
      requests.push(
        this.feedbackService.sendFeedback(csatPayload).pipe(
          timeout(5000),
          catchError(() => of(null))
        )
      );
    }

    if (nps !== null) {
      const npsPayload: FeedbackRequest = {
        reservationId: this.reservationId(),
        feedbackType: 'NPS',
        targetType: this.targetType(),
        score: nps,
        comment: fullComment
      };
      requests.push(
        this.feedbackService.sendFeedback(npsPayload).pipe(
          timeout(5000),
          catchError(() => of(null))
        )
      );
    }

    concat(...requests)
      .pipe(
        toArray(),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: () => {
          this.isSuccess.set(true);
          this.feedbackSubmitted.emit();
        },
        error: () => {
          this.isSuccess.set(true);
          this.feedbackSubmitted.emit();
        }
      });
  }

  close(): void {
    this.isSubmitting.set(false);
    this.closed.emit();
  }
}
