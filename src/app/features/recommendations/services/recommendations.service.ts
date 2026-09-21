import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recommendation } from '../models/recommendation.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecommendationsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recommendations`;

  getRecommendations(limit = 10): Observable<Recommendation[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Recommendation[]>(this.apiUrl, { params });
  }
}
