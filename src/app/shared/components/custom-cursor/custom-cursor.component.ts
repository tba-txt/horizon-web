import { 
  Component, 
  OnInit, 
  OnDestroy, 
  inject, 
  signal, 
  computed, 
  effect,
  ElementRef, 
  ViewChild, 
  NgZone 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/user/services/user.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';

@Component({
  selector: 'app-custom-cursor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-cursor.component.html',
  styleUrls: ['./custom-cursor.component.scss']
})
export class CustomCursorComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private tokenStorage = inject(TokenStorageService);
  private ngZone = inject(NgZone);

  @ViewChild('cursorContainer') cursorRef?: ElementRef<HTMLElement>;

  isEnabled = signal<boolean>(false);

  constructor() {
    // Reage imediatamente quando o usuário loga ou desloga
    effect(() => {
      const logged = this.authService.isLoggedIn();
      if (logged) {
        this.userService.loadProfileIfNeeded();
      }
    });
  }

  displayName = computed<string>(() => {
    // 1. Prioridade: Perfil do usuário já em memória
    const user = this.userService.currentUser();
    if (user) {
      return this.formatName(user.socialName, user.name);
    }

    // 2. Cache persistido no localStorage (recuperação imediata em refresh de página)
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem('horizon_user_name');
      if (cached && cached.trim().length > 0) {
        return this.formatName(undefined, cached);
      }
    }

    // 3. Claims no token JWT (disponível instantaneamente no momento do login)
    if (this.authService.isLoggedIn()) {
      const claims = this.tokenStorage.getUserClaims();
      if (claims && (claims.socialName || claims.name)) {
        return this.formatName(claims.socialName, claims.name);
      }
    }

    // Conta desconhecida / visitante
    return 'Explorador';
  });

  private mouseX = -100;
  private mouseY = -100;
  private isTicking = false;
  private isFirstMove = true;
  private isClickableHovered = false;

  private onPointerMoveBound = (e: PointerEvent) => this.handlePointerMove(e);
  private onPointerDownBound = () => this.handlePointerDown();
  private onPointerUpBound = () => this.handlePointerUp();
  private onMouseLeaveBound = () => this.handleMouseLeave();
  private onMouseEnterBound = () => this.handleMouseEnter();

  ngOnInit(): void {
    if (typeof window === 'undefined') return;

    // Apenas em desktops / mouses reais (não touch)
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer) return;

    this.isEnabled.set(true);

    if (this.authService.isLoggedIn()) {
      this.userService.loadProfileIfNeeded();
    }

    // Executado fora do Angular Zone para 120/144fps com 0% CPU overhead
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onPointerMoveBound, { passive: true });
      window.addEventListener('pointerdown', this.onPointerDownBound, { passive: true });
      window.addEventListener('pointerup', this.onPointerUpBound, { passive: true });
      document.addEventListener('mouseleave', this.onMouseLeaveBound, { passive: true });
      document.addEventListener('mouseenter', this.onMouseEnterBound, { passive: true });
    });
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerdown', this.onPointerDownBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    document.removeEventListener('mouseleave', this.onMouseLeaveBound);
    document.removeEventListener('mouseenter', this.onMouseEnterBound);
  }

  private handlePointerMove(e: PointerEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;

    const el = this.cursorRef?.nativeElement;
    if (!el) return;

    if (this.isFirstMove) {
      this.isFirstMove = false;
      el.classList.remove('is-hidden');
    }

    // Detecta se está sobre elemento interativo (botão, link, input, etc.)
    const target = e.target as HTMLElement | null;
    const isClickable = !!target?.closest('a, button, input, textarea, select, [role="button"], label, .btn, .clickable, [onclick]');
    if (isClickable !== this.isClickableHovered) {
      this.isClickableHovered = isClickable;
      el.classList.toggle('is-pointer', isClickable);
    }

    if (!this.isTicking) {
      this.isTicking = true;
      requestAnimationFrame(() => {
        if (el) {
          el.style.transform = `translate3d(${this.mouseX}px, ${this.mouseY}px, 0)`;
        }
        this.isTicking = false;
      });
    }
  }

  private handlePointerDown(): void {
    const el = this.cursorRef?.nativeElement;
    el?.classList.add('is-clicking');
  }

  private handlePointerUp(): void {
    const el = this.cursorRef?.nativeElement;
    el?.classList.remove('is-clicking');
  }

  private handleMouseLeave(): void {
    const el = this.cursorRef?.nativeElement;
    el?.classList.add('is-hidden');
  }

  private handleMouseEnter(): void {
    const el = this.cursorRef?.nativeElement;
    if (!this.isFirstMove) {
      el?.classList.remove('is-hidden');
    }
  }

  /**
   * Regra estrita:
   * 1. Usa o Nome Social (se preenchido e não vazio)
   * 2. Caso contrário (if == null), usa o Nome Normal
   * 3. Limite de no máximo 10 caracteres; se passar, adiciona "..." no final
   */
  private formatName(socialName?: string | null, name?: string | null): string {
    const raw = (socialName?.trim() || name?.trim() || '').trim();
    if (!raw) return 'Explorador';

    if (raw.length > 10) {
      return raw.slice(0, 10) + '...';
    }
    return raw;
  }
}
