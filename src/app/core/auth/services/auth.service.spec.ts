import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';
import { LoginRequest, LoginResponse } from '../models/auth.models';
import { environment } from '../../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let tokenStorage: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        TokenStorageService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('deve inicializar com estado de autenticacao false quando nao houver token', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('deve efetuar login com sucesso, persistir token e atualizar isLoggedIn para true', () => {
    const credentials: LoginRequest = { email: 'usuario@horizon.com', password: 'Password123!' };
    const mockResponse: LoginResponse = { token: 'mock-jwt-token-123' };

    service.login(credentials, true).subscribe((response) => {
      expect(response.token).toBe('mock-jwt-token-123');
      expect(service.isLoggedIn()).toBe(true);
      expect(localStorage.getItem('horizon_auth_token')).toBe('mock-jwt-token-123');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockResponse);
  });

  it('deve persistir na sessionStorage quando rememberMe for false', () => {
    const credentials: LoginRequest = { email: 'usuario@horizon.com', password: 'Password123!' };
    const mockResponse: LoginResponse = { token: 'mock-session-token' };

    service.login(credentials, false).subscribe(() => {
      expect(sessionStorage.getItem('horizon_auth_token')).toBe('mock-session-token');
      expect(localStorage.getItem('horizon_auth_token')).toBeNull();
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(mockResponse);
  });

  it('deve efetuar logout limpando o armazenamento e alterando isLoggedIn para false', () => {
    localStorage.setItem('horizon_auth_token', 'token-ativo');
    service.isLoggedIn.set(true);

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('horizon_auth_token')).toBeNull();
    expect(sessionStorage.getItem('horizon_auth_token')).toBeNull();
  });

  it('deve enviar requisicao de recuperacao de senha corretamente', () => {
    const forgotData = { email: 'recupera@horizon.com' };

    service.forgotPassword(forgotData).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/auth/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(forgotData);
    req.flush(null);
  });
});
