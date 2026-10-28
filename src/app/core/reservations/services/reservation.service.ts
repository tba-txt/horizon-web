import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  ReservationRequest, 
  ReservationResponse, 
  MyTripsResponse, 
  TicketResponse,
  CheckoutDraft
} from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/reservations`;
  private readonly ticketsUrl = `${environment.apiUrl}/tickets`;

  // Estado compartilhado em memória para rascunho de reserva vindo da busca de voos
  private checkoutDraftSignal = signal<CheckoutDraft | null>(this.loadDraftFromSession());

  public readonly checkoutDraft = this.checkoutDraftSignal.asReadonly();

  setCheckoutDraft(draft: CheckoutDraft | null): void {
    this.checkoutDraftSignal.set(draft);
    if (draft) {
      sessionStorage.setItem('horizon_checkout_draft', JSON.stringify(draft));
      try {
        localStorage.setItem('horizon_checkout_draft', JSON.stringify(draft));
      } catch {}
    } else {
      sessionStorage.removeItem('horizon_checkout_draft');
      try {
        localStorage.removeItem('horizon_checkout_draft');
      } catch {}
    }
  }

  clearCheckoutDraft(): void {
    this.setCheckoutDraft(null);
  }

  private loadDraftFromSession(): CheckoutDraft | null {
    try {
      const saved = sessionStorage.getItem('horizon_checkout_draft') || localStorage.getItem('horizon_checkout_draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  createReservation(request: ReservationRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${this.baseUrl}/checkout`, request);
  }

  getReservationById(id: number): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.baseUrl}/${id}`);
  }

  getMyTrips(): Observable<MyTripsResponse> {
    return this.http.get<MyTripsResponse>(`${this.baseUrl}/my`);
  }

  cancelReservation(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/cancel`, {});
  }

  getTicketsByReservation(reservationId: number): Observable<TicketResponse[]> {
    return this.http.get<TicketResponse[]>(`${this.ticketsUrl}/reservation/${reservationId}`);
  }

  downloadTicketPdf(ticketNumber: string, seatClass?: string): Observable<Blob> {
    const params: Record<string, string> = {};
    if (seatClass) {
      params['seatClass'] = seatClass;
    }
    return this.http.get(`${this.ticketsUrl}/${ticketNumber}/download`, {
      params,
      responseType: 'blob'
    });
  }
}
