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
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss']
})
export class FeedbackModalComponent {
  private feedbackService = inject(FeedbackService);

  isOpen = input<boolean>(false);
  reservationId = input<number | null>(null);
  destinationName = input<string | null>(null);
  initialTargetType = input<TargetType>('PLATFORM');
  mode = input<'NPS' | 'CSAT' | 'ALL'>('NPS');
  taskContext = input<'PLATFORM' | 'QUIZ' | 'CHECKOUT' | 'TRIP'>('PLATFORM');

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

  readonly quizTags = [
    'Perguntas Claras',
    'Interface Rápida',
    'Resultado Preciso',
    'Facilidade de Uso',
    'Design do Quiz'
  ];

  readonly checkoutTags = [
    'Rapidez no Pagamento',
    'Seleção de Assentos',
    'Emissão dos Bilhetes',
    'Clareza nos Preços',
    'Facilidade na Reserva'
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
    if (this.mode() === 'CSAT') {
      if (this.taskContext() === 'QUIZ') return this.quizTags;
      if (this.taskContext() === 'CHECKOUT') return this.checkoutTags;
      if (this.targetType() === 'TRIP') return this.tripTags;
      return this.platformTags;
    }
    return this.targetType() === 'TRIP' ? this.tripTags : this.platformTags;
  }

  getTagsQuestionNumber(): number {
    return this.mode() === 'ALL' ? 3 : 2;
  }

  getCommentQuestionNumber(): number {
    return this.mode() === 'ALL' ? 4 : 3;
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags().includes(tag);
  }

  toggleTag(tag: string): void {
    this.selectedTags.update(list =>
      list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]
    );
  }

  isSubmitDisabled(): boolean {
    if (this.isSubmitting()) return true;
    if (this.mode() === 'NPS') return this.npsScore() === null;
    if (this.mode() === 'CSAT') return this.csatScore() === null;
    return this.csatScore() === null && this.npsScore() === null;
  }

  checkAlreadySubmitted(): void {
    if (this.mode() === 'CSAT' && this.taskContext() === 'QUIZ') {
      const submitted = localStorage.getItem('horizon_quiz_csat_submitted') === 'true';
      this.isAlreadySubmitted.set(submitted);
      return;
    }
    if (this.mode() === 'CSAT' && this.taskContext() === 'CHECKOUT' && this.reservationId()) {
      const submitted = localStorage.getItem('horizon_checkout_csat_' + this.reservationId()) === 'true';
      if (submitted) {
        this.isAlreadySubmitted.set(true);
        return;
      }
    }
    const submitted = this.feedbackService.hasSubmittedFeedback(
      this.targetType(),
      this.reservationId()
    );
    this.isAlreadySubmitted.set(submitted);
  }

  submitFeedback(): void {
    const isNpsMode = this.mode() === 'NPS';
    const isCsatMode = this.mode() === 'CSAT';

    const csat = this.csatScore();
    const nps = this.npsScore();

    if (isNpsMode && nps === null) return;
    if (isCsatMode && csat === null) return;
    if (!isNpsMode && !isCsatMode && csat === null && nps === null) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const tagsPart = this.selectedTags().length > 0
      ? `[Destaques: ${this.selectedTags().join(', ')}] `
      : '';
    const userComment = this.commentText.trim();
    const fullComment = (tagsPart + userComment).trim() || undefined;

    const requests = [];

    if ((isCsatMode || this.mode() === 'ALL') && csat !== null) {
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

    if ((isNpsMode || this.mode() === 'ALL') && nps !== null) {
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
          this.recordCompletion();
          this.isSuccess.set(true);
          this.feedbackSubmitted.emit();
        },
        error: () => {
          this.recordCompletion();
          this.isSuccess.set(true);
          this.feedbackSubmitted.emit();
        }
      });
  }

  private recordCompletion(): void {
    if (this.mode() === 'CSAT' && this.taskContext() === 'QUIZ') {
      localStorage.setItem('horizon_quiz_csat_submitted', 'true');
    }
    if (this.mode() === 'CSAT' && this.taskContext() === 'CHECKOUT' && this.reservationId()) {
      localStorage.setItem('horizon_checkout_csat_' + this.reservationId(), 'true');
    }
  }

  close(): void {
    this.isSubmitting.set(false);
    this.closed.emit();
  }
}
