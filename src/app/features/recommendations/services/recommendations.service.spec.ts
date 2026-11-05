import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecommendationsService } from './recommendations.service';
import { Recommendation } from '../models/recommendation.model';
import { environment } from '../../../../environments/environment';

describe('RecommendationsService', () => {
  let service: RecommendationsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecommendationsService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RecommendationsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('deve buscar recomendacoes com o parametro limit padrao 10', () => {
    const mockRecommendations: Recommendation[] = [
      {
        destinationId: 1,
        destinationName: 'Fernando de Noronha',
        country: 'Brasil',
        city: 'Fernando de Noronha',
        score: 0.95,
        explanation: 'Excelente combinação de natureza e ecoturismo.'
      }
    ];

    service.getRecommendations().subscribe((recs) => {
      expect(recs.length).toBe(1);
      expect(recs[0].destinationName).toBe('Fernando de Noronha');
      expect(recs[0].score).toBe(0.95);
    });

    const req = httpTesting.expectOne((request) => 
      request.url === `${environment.apiUrl}/recommendations` && request.params.get('limit') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockRecommendations);
  });

  it('deve buscar recomendacoes com limite customizado', () => {
    service.getRecommendations(5).subscribe();

    const req = httpTesting.expectOne((request) => 
      request.url === `${environment.apiUrl}/recommendations` && request.params.get('limit') === '5'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
