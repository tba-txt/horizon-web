import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaymentMethod } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/payments`;

  confirmPayment(reservationId: number, method: PaymentMethod): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${reservationId}/confirm?method=${method}`, {});
  }
}
