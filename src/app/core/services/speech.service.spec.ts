import { TestBed } from '@angular/core/testing';
import { SpeechService } from './speech.service';

describe('SpeechService', () => {
  let service: SpeechService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpeechService]
    });
    service = TestBed.inject(SpeechService);
  });

  it('deve ser instanciado corretamente', () => {
    expect(service).toBeTruthy();
    expect(typeof service.speaking).toBe('function');
  });

  it('deve configurar taxa e voz sem erros', () => {
    expect(() => {
      service.configure(1.2, 'Microsoft Maria - Portuguese (Brazil)');
    }).not.toThrow();
  });

  it('deve chamar stop() e redefinir o estado speaking', () => {
    service.stop();
    expect(service.speaking()).toBe(false);
  });

  it('deve ignorar speak() com texto vazio ou apenas espacos', () => {
    service.speak('   ');
    expect(service.speaking()).toBe(false);
  });
});
