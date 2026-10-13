import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';

@Directive({
  selector: '[appCard3d]',
  standalone: true
})
export class Card3dDirective {
  @Input() maxRotation: number = 14;
  @Input() cardSelector: string = '.card-3d-body';

  private el = inject(ElementRef);
  private isHovered = false;

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.isHovered = true;
    this.el.nativeElement.classList.add('is-3d-hovered');
    const body = this.getBody();
    if (body) {
      body.style.transition = 'transform 0.1s ease-out';
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.isHovered) return;
    const container = this.el.nativeElement as HTMLElement;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotY = (x / (rect.width / 2)) * this.maxRotation;
    const rotX = -(y / (rect.height / 2)) * this.maxRotation;

    const body = this.getBody();
    if (body) {
      body.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isHovered = false;
    this.el.nativeElement.classList.remove('is-3d-hovered');
    const body = this.getBody();
    if (body) {
      body.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      body.style.transform = 'rotateX(0deg) rotateY(0deg)';
    }
  }

  private getBody(): HTMLElement | null {
    if (this.cardSelector) {
      return this.el.nativeElement.querySelector(this.cardSelector) || this.el.nativeElement;
    }
    return this.el.nativeElement;
  }
}
