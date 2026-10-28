import { Component, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentLang = signal<string>('pt');
  langNotice = signal<string | null>(null);
  private noticeTimer?: any;

  languages = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'zh', label: '中文' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'ar', label: 'العربية' },
    { code: 'ru', label: 'Русский' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ja', label: '日本語' },
    { code: 'it', label: 'Italiano' }
  ];

  selectLanguage(lang: { code: string; label: string }): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);

    if (lang.code === 'pt') {
      this.currentLang.set('pt');
      this.langNotice.set(null);
      return;
    }

    this.currentLang.set(lang.code);
    this.langNotice.set(`Idioma ${lang.label} selecionado. Os outros idiomas ainda serão implementados. O conteúdo principal segue em Português.`);

    this.noticeTimer = setTimeout(() => {
      this.langNotice.set(null);
    }, 5000);
  }
}
