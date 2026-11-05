import { TestBed } from '@angular/core/testing';
import { AccessibilitySettingsComponent } from './accessibility-settings.component';
import { AccessibilityService } from '../../core/services/accessibility.service';
import { ThemeService } from '../../core/services/theme.service';
import { SpeechService } from '../../core/services/speech.service';

describe('AccessibilitySettingsComponent', () => {
  let a11yService: AccessibilityService;
  let themeService: ThemeService;

  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.style.fontSize = '';

    await TestBed.configureTestingModule({
      imports: [AccessibilitySettingsComponent],
      providers: [AccessibilityService, ThemeService, SpeechService]
    }).compileComponents();

    a11yService = TestBed.inject(AccessibilityService);
    themeService = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve criar o componente de configuracoes de acessibilidade', () => {
    const fixture = TestBed.createComponent(AccessibilitySettingsComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('deve alternar o tema entre light e dark ao disparar theme.toggle()', () => {
    const fixture = TestBed.createComponent(AccessibilitySettingsComponent);
    fixture.detectChanges();

    const initialTheme = themeService.theme();
    themeService.toggle();
    expect(themeService.theme()).toBe(initialTheme === 'dark' ? 'light' : 'dark');
  });

  it('deve atualizar escala da fonte quando setSize for acionado', () => {
    const fixture = TestBed.createComponent(AccessibilitySettingsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.setSize(130);
    expect(a11yService.settings().fontScale).toBe(130);
    expect(document.documentElement.style.fontSize).toBe('130%');
  });
});
