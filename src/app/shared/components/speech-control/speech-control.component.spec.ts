import { TestBed } from '@angular/core/testing';
import { SpeechControlComponent } from './speech-control.component';
import { AccessibilityService } from '../../../core/services/accessibility.service';
import { ThemeService } from '../../../core/services/theme.service';
import { SpeechService } from '../../../core/services/speech.service';

describe('SpeechControlComponent', () => {
  let fixture: any;
  let component: SpeechControlComponent;
  let themeService: ThemeService;
  let a11yService: AccessibilityService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SpeechControlComponent],
      providers: [AccessibilityService, ThemeService, SpeechService]
    }).compileComponents();

    fixture = TestBed.createComponent(SpeechControlComponent);
    component = fixture.componentInstance;
    themeService = TestBed.inject(ThemeService);
    a11yService = TestBed.inject(AccessibilityService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve criar o componente speech-control', () => {
    expect(component).toBeTruthy();
  });

  it('deve alternar alto contraste ao chamar toggleContrast()', () => {
    const initialContrast = a11yService.settings().highContrast;
    component.toggleContrast();
    expect(a11yService.settings().highContrast).toBe(!initialContrast);
  });

  it('deve renderizar os botoes de controle de tema e acessibilidade', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.toggle-btn');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });
});
