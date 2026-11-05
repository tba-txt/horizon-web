import { 
  Component, 
  OnInit, 
  OnDestroy, 
  inject, 
  signal, 
  computed, 
  ElementRef, 
  ViewChild, 
  NgZone 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/user/services/user.service';
import { AuthService } from '../../../core/auth/services/auth.service';

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
  private ngZone = inject(NgZone);

  @ViewChild('cursorContainer') cursorRef?: ElementRef<HTMLElement>;

  isEnabled = signal<boolean>(false);

  displayName = computed<string>(() => {
    const user = this.userService.currentUser();
    if (user) {
      if (user.socialName && user.socialName.trim().length > 0) {
        return this.formatName(user.socialName);
      }
      if (user.name && user.name.trim().length > 0) {
        return this.formatName(user.name);
      }
    }

    if (typeof localStorage !== 'undefined') {
      const cachedName = localStorage.getItem('horizon_user_name');
      if (cachedName && cachedName.trim().length > 0) {
        return this.formatName(cachedName);
      }
    }

    if (this.authService.isLoggedIn()) {
      return 'Viajante';
    }

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

  private formatName(name: string): string {
    const clean = name.trim();
    if (!clean) return 'Explorador';
    const first = clean.split(' ')[0];
    if (first.length > 15) {
      return first.slice(0, 14) + '…';
    }
    return first;
  }
}
