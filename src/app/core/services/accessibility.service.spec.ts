import { TestBed } from '@angular/core/testing';
import { AccessibilityService, DEFAULT_A11Y } from './accessibility.service';
import { SpeechService } from './speech.service';

describe('AccessibilityService', () => {
  let service: AccessibilityService;
  let mockSpeechService: any;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';

    mockSpeechService = {
      configure: () => {},
      stop: () => {},
      speak: () => {}
    };

    TestBed.configureTestingModule({
      providers: [
        AccessibilityService,
        { provide: SpeechService, useValue: mockSpeechService }
      ]
    });

    service = TestBed.inject(AccessibilityService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';
  });

  it('deve inicializar com configuracoes padrao', () => {
    const current = service.settings();
    expect(current.fontScale).toBe(DEFAULT_A11Y.fontScale);
    expect(current.highContrast).toBe(false);
    expect(current.voiceEnabled).toBe(false);
  });

  it('deve atualizar alto contraste e aplicar classe no elemento raiz <html>', () => {
    service.update({ highContrast: true });

    expect(service.settings().highContrast).toBe(true);
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(true);

    const stored = JSON.parse(localStorage.getItem('horizon-a11y') || '{}');
    expect(stored.highContrast).toBe(true);
  });

  it('deve atualizar o fontScale e aplicar estilo inline no elemento raiz', () => {
    service.update({ fontScale: 130 });

    expect(service.settings().fontScale).toBe(130);
    expect(document.documentElement.style.fontSize).toBe('130%');
  });

  it('deve resetar todas as configuracoes para os valores padrao', () => {
    service.update({ fontScale: 150, highContrast: true, voiceEnabled: true });
    service.reset();

    expect(service.settings().fontScale).toBe(100);
    expect(service.settings().highContrast).toBe(false);
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(false);
    expect(document.documentElement.style.fontSize).toBe('');
  });
});
