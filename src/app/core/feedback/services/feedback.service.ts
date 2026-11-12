import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TokenStorageService } from '../../auth/services/token-storage.service';
import { FeedbackRequest, FeedbackHistoryItem, TargetType } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private http = inject(HttpClient);
  private tokenStorage = inject(TokenStorageService);
  private readonly baseUrl = `${environment.apiUrl}/feedbacks`;

  private getUserSuffix(): string {
    return this.tokenStorage.getUserId() || 'guest';
  }

  private getSubmittedFeedbacksKey(): string {
    return `horizon_submitted_feedbacks_${this.getUserSuffix()}`;
  }

  private getQuizCsatKey(): string {
    return `horizon_quiz_csat_submitted_${this.getUserSuffix()}`;
  }

  private getCheckoutCsatKey(reservationId: number): string {
    return `horizon_checkout_csat_${this.getUserSuffix()}_${reservationId}`;
  }

  sendFeedback(request: FeedbackRequest): Observable<void> {
    return this.http.post<void>(this.baseUrl, request).pipe(
      tap(() => this.recordSubmittedFeedback(request))
    );
  }

  hasSubmittedQuizCsat(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.getQuizCsatKey()) === 'true';
  }

  markQuizCsatSubmitted(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.getQuizCsatKey(), 'true');
  }

  hasSubmittedCheckoutCsat(reservationId?: number | null): boolean {
    if (typeof localStorage === 'undefined' || !reservationId) return false;
    return localStorage.getItem(this.getCheckoutCsatKey(reservationId)) === 'true';
  }

  markCheckoutCsatSubmitted(reservationId?: number | null): void {
    if (typeof localStorage === 'undefined' || !reservationId) return;
    localStorage.setItem(this.getCheckoutCsatKey(reservationId), 'true');
  }

  hasSubmittedFeedback(targetType: TargetType, reservationId?: number | null): boolean {
    const list = this.getSubmittedFeedbacks();
    if (targetType === 'TRIP' && reservationId) {
      return list.some(item => item.targetType === 'TRIP' && item.reservationId === reservationId);
    }
    return false;
  }

  getSubmittedFeedbacks(): FeedbackHistoryItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.getSubmittedFeedbacksKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private recordSubmittedFeedback(request: FeedbackRequest): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const list = this.getSubmittedFeedbacks();
      const item: FeedbackHistoryItem = {
        ...request,
        submittedAt: new Date().toISOString()
      };
      list.push(item);
      localStorage.setItem(this.getSubmittedFeedbacksKey(), JSON.stringify(list));
    } catch (e) {
      console.error('Falha ao salvar histórico local de feedback', e);
    }
  }
}
