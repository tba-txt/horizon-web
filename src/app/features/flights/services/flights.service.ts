import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

    return this.http.get<Flight[]>(this.apiUrl, { params: httpParams }).pipe(
      map(flights =>
        (flights || [])
          .filter(f => !/^HZ\d+[DR]\d{2}$/.test((f.flightNumber || '').trim()))
          .sort((a, b) => {
            const dateCmp = (a.flightDate || '').localeCompare(b.flightDate || '');
            if (dateCmp !== 0) return dateCmp;
            return (a.departureTime || '').localeCompare(b.departureTime || '');
          })
      )
    );
  }
}
