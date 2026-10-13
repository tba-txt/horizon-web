import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, of, tap } from 'rxjs';
import { Destination } from '../models/destination.model';
import { DestinationWeather } from '../models/weather.model';
import { environment } from '../../../../environments/environment';

export const LOCAL_DESTINATION_IMAGES: Record<string, string> = {
  // Comuns
  'Rio de Janeiro': 'assets/rio.webp',
  'Paris': 'assets/paris.webp',
  'Bangkok': 'assets/bangkok.webp',
  'Bogotá': 'assets/bogota.webp',
  'Bogota': 'assets/bogota.webp',
  'Dubai': 'assets/dubai.webp',
  'Istambul': 'assets/istambul.webp',
  'Madri': 'assets/madri.webp',
  'Madrid': 'assets/madri.webp',
  'Sydney': 'assets/sydney.webp',
  'Toronto': 'assets/toronto.webp',
  'Atenas': 'assets/atenas.webp',
  'Athens': 'assets/atenas.webp',
  'Roma': 'assets/roma.webp',
  'Rome': 'assets/roma.webp',
  'Lisboa': 'assets/lisboa.webp',
  'Lisbon': 'assets/lisboa.webp',
  'Amsterdã': 'assets/amsterda.webp',
  'Amsterda': 'assets/amsterda.webp',
  'Amsterdam': 'assets/amsterda.webp',
  'Barcelona': 'assets/barcelona.webp',
  'Veneza': 'assets/veneza.webp',
  'Venice': 'assets/veneza.webp',
  'Florença': 'assets/florenca.webp',
  'Florenca': 'assets/florenca.webp',
  'Florence': 'assets/florenca.webp',
  'Gramado': 'assets/gramado.webp',
  'Quioto': 'assets/quioto.webp',
  'Kyoto': 'assets/quioto.webp',
  'Londres': 'assets/londres.webp',
  'London': 'assets/londres.webp',
  'Praga': 'assets/praga.webp',
  'Prague': 'assets/praga.webp',
  'Nova York': 'assets/nova-york.webp',
  'New York': 'assets/nova-york.webp',
  'Tóquio': 'assets/toquio.webp',
  'Toquio': 'assets/toquio.webp',
  'Tokyo': 'assets/toquio.webp',
  'Las Vegas': 'assets/las-vegas.webp',
  'Vegas': 'assets/las-vegas.webp',
  'Seul': 'assets/seul.webp',
  'Seoul': 'assets/seul.webp',
  'Cancún': 'assets/cancun.webp',
  'Cancun': 'assets/cancun.webp',
  'Maldivas': 'assets/maldivas.webp',
  'Maldives': 'assets/maldivas.webp',
  'Punta Cana': 'assets/punta-cana.webp',
  'Santorini': 'assets/santorini.webp',

  // Ecoturismo
  'Banff': 'assets/banff.webp',
  'Bonito': 'assets/bonito.webp',
  'Chapada Diamantina': 'assets/chapada-diamantina.webp',
  'Costa Rica': 'assets/costa-rica.webp',
  'Fernando de Noronha': 'assets/noronha.webp',
  'Noronha': 'assets/noronha.webp',
  'Machu Picchu': 'assets/machu-picchu.webp',
  'Picchu': 'assets/machu-picchu.webp',
  'Patagônia': 'assets/patagonia.webp',
  'Patagonia': 'assets/patagonia.webp',
  'Reykjavík': 'assets/reykjavik.webp',
  'Reykjavik': 'assets/reykjavik.webp',
  'Yellowstone': 'assets/yellowstone.webp',
  'Foz do Iguaçu': 'assets/foz-do-iguacu.webp',
  'Foz do Iguacu': 'assets/foz-do-iguacu.webp',
  'Pantanal': 'assets/pantanal.webp',
  'Amazônia': 'assets/amazonia.webp',
  'Amazonia': 'assets/amazonia.webp',
  'Galápagos': 'assets/galapagos.webp',
  'Galapagos': 'assets/galapagos.webp',
  'Alpes Suíços': 'assets/alpes-suicos.webp',
  'Alpes Suicos': 'assets/alpes-suicos.webp',
  'Antártida': 'assets/antartida.webp',
  'Antartida': 'assets/antartida.webp',
  'Antarctica': 'assets/antartida.webp',
  'Bariloche': 'assets/bariloche.webp',
  'Serengeti': 'assets/serengeti.webp',
  'Parque Nacional Kruger': 'assets/kruger.webp',
  'Kruger': 'assets/kruger.webp',
  'Grande Barreira de Corais': 'assets/grande-barreira-de-corais.webp',
  'Queensland': 'assets/grande-barreira-de-corais.webp',
  'Atacama': 'assets/atacama.webp',
  'Jalapão': 'assets/jalapao.webp',
  'Jalapao': 'assets/jalapao.webp'
};

export function findLocalImage(name?: string, city?: string): string | undefined {
  if (!name && !city) return undefined;
  if (name && LOCAL_DESTINATION_IMAGES[name]) return LOCAL_DESTINATION_IMAGES[name];
  if (city && LOCAL_DESTINATION_IMAGES[city]) return LOCAL_DESTINATION_IMAGES[city];
  
  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const nameNorm = name ? norm(name) : '';
  const cityNorm = city ? norm(city) : '';

  for (const [key, val] of Object.entries(LOCAL_DESTINATION_IMAGES)) {
    const keyNorm = norm(key);
    if ((nameNorm && keyNorm === nameNorm) || (cityNorm && keyNorm === cityNorm)) {
      return val;
    }
  }
  return undefined;
}

@Injectable({
  providedIn: 'root'
})
export class DestinationsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/destinations`;

  private cachedDestinations$?: Observable<Destination[]>;

  getDestinations(forceRefresh = false): Observable<Destination[]> {
    if (!this.cachedDestinations$ || forceRefresh) {
      this.cachedDestinations$ = this.http.get<Destination[]>(this.apiUrl).pipe(
        map(destinations => (destinations || []).map(dest => {
          const localImg = findLocalImage(dest.name, dest.city);
          return localImg ? { ...dest, imageUrl: localImg } : dest;
        })),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.cachedDestinations$;
  }

  getDestinationById(id: number): Observable<Destination> {
    return this.http.get<Destination>(`${this.apiUrl}/${id}`).pipe(
      map(dest => {
        const localImg = findLocalImage(dest.name, dest.city);
        return localImg ? { ...dest, imageUrl: localImg } : dest;
      })
    );
  }

  private weatherCache = new Map<number, DestinationWeather>();

  getDestinationWeather(id: number): Observable<DestinationWeather> {
    if (this.weatherCache.has(id)) {
      return of(this.weatherCache.get(id)!);
    }
    return this.http.get<DestinationWeather>(`${this.apiUrl}/${id}/weather`).pipe(
      tap(w => this.weatherCache.set(id, w))
    );
  }

  clearCache(): void {
    this.cachedDestinations$ = undefined;
    this.weatherCache.clear();
  }
}
