import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FeedbackRequest, FeedbackHistoryItem, TargetType } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/feedbacks`;
  private readonly storageKey = 'horizon_submitted_feedbacks';

  sendFeedback(request: FeedbackRequest): Observable<void> {
    return this.http.post<void>(this.baseUrl, request).pipe(
      tap(() => this.recordSubmittedFeedback(request))
    );
  }

  hasSubmittedFeedback(targetType: TargetType, reservationId?: number | null): boolean {
    const list = this.getSubmittedFeedbacks();
    if (targetType === 'TRIP' && reservationId) {
      return list.some(item => item.targetType === 'TRIP' && item.reservationId === reservationId);
    }
    return false;
  }

  getSubmittedFeedbacks(): FeedbackHistoryItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private recordSubmittedFeedback(request: FeedbackRequest): void {
    try {
      const list = this.getSubmittedFeedbacks();
      const item: FeedbackHistoryItem = {
        ...request,
        submittedAt: new Date().toISOString()
      };
      list.push(item);
      localStorage.setItem(this.storageKey, JSON.stringify(list));
    } catch (e) {
      console.error('Falha ao salvar histórico local de feedback', e);
    }
  }
}
