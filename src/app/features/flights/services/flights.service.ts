import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flight, FlightSearchParams } from '../models/flight.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FlightsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/flights`;

  searchFlights(params: FlightSearchParams): Observable<Flight[]> {
    let httpParams = new HttpParams().set('destinationId', params.destinationId.toString());

    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }

    return this.http.get<Flight[]>(this.apiUrl, { params: httpParams });
  }
}
