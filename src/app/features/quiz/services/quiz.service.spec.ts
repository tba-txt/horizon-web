import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { QuizService } from './quiz.service';
import { Quiz, SubmitQuizRequest } from '../models/quiz.model';
import { environment } from '../../../../environments/environment';

describe('QuizService', () => {
  let service: QuizService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        QuizService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(QuizService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('deve buscar o quiz ativo via GET', () => {
    const mockQuiz: Quiz = {
      id: 1,
      title: 'Quiz de Preferencias',
      version: 1,
      questions: []
    };

    service.getActiveQuiz().subscribe((quiz) => {
      expect(quiz).toEqual(mockQuiz);
      expect(quiz.id).toBe(1);
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/quizzes/active`);
    expect(req.request.method).toBe('GET');
    req.flush(mockQuiz);
  });

  it('deve submeter o quiz com ID especifico via POST', () => {
    const payload: SubmitQuizRequest = {
      answers: { '10': 25 },
      budgetPerPerson: 8000,
      hasPassport: true
    };

    service.submitQuiz(1, payload).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/quizzes/1/submit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });

  it('deve submeter o quiz sem ID na rota padrao /submit', () => {
    const payload: SubmitQuizRequest = {
      answers: { '10': 25 },
      budgetPerPerson: 5000,
      hasPassport: false
    };

    service.submitQuiz(null, payload).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/quizzes/submit`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(null);
  });
});
