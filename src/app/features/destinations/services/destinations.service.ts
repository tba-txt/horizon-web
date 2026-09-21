import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Destination } from '../models/destination.model';
import { DestinationWeather } from '../models/weather.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DestinationsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/destinations`;

  getDestinations(): Observable<Destination[]> {
    return this.http.get<Destination[]>(this.apiUrl);
  }

  getDestinationById(id: number): Observable<Destination> {
    return this.http.get<Destination>(`${this.apiUrl}/${id}`);
  }

  getDestinationWeather(id: number): Observable<DestinationWeather> {
    return this.http.get<DestinationWeather>(`${this.apiUrl}/${id}/weather`);
  }
}
