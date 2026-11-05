import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FeedService } from './feed.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { Post } from '../models/feed.model';
import { environment } from '../../../../environments/environment';

describe('FeedService', () => {
  let service: FeedService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        FeedService,
        TokenStorageService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(FeedService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('deve buscar posts e armazenar em cache para chamadas subsequentes', () => {
    const mockPosts: Post[] = [
      { id: 1, title: 'Praias Paradisíacas' },
      { id: 2, title: 'Montanhas e Trilhas' }
    ];

    service.getPosts().subscribe((posts) => {
      expect(posts.length).toBe(2);
      expect(posts[0].id).toBe(1);
    });

    const req1 = httpTesting.expectOne(`${environment.apiUrl}/posts`);
    expect(req1.request.method).toBe('GET');
    req1.flush(mockPosts);

    service.getPosts().subscribe((posts) => {
      expect(posts.length).toBe(2);
    });

    httpTesting.expectNone(`${environment.apiUrl}/posts`);
  });

  it('deve forcar nova requisicao quando forceRefresh=true', () => {
    const mockPosts: Post[] = [{ id: 1, title: 'Post 1' }];

    service.getPosts().subscribe();
    const req1 = httpTesting.expectOne(`${environment.apiUrl}/posts`);
    req1.flush(mockPosts);

    service.getPosts(true).subscribe();
    const req2 = httpTesting.expectOne(`${environment.apiUrl}/posts`);
    req2.flush(mockPosts);
  });

  it('deve enviar interacao de LIKE para o backend', () => {
    service.interact(42, 'LIKE').subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/interactions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      postId: 42,
      interactionType: 'LIKE'
    });
    req.flush(null);
  });

  it('deve enviar interacao de VOTE com optionId para enquete', () => {
    service.interact(55, 'VOTE', 3).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/interactions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      postId: 55,
      interactionType: 'VOTE',
      optionId: 3
    });
    req.flush(null);
  });
});
