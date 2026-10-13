import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plane-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="plane-loader-wrapper d-flex align-items-center justify-content-center py-4">
      <div class="plane-loader-scene position-relative" [style.width.px]="size" [style.height.px]="size">
        <!-- Container da Órbita e Avião 360 (Idêntico ao Login, em Azul Horizon, Sem Globo) -->
        <div class="globe-plane-container">
          <svg class="globe-plane" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21,16 L21,14 L13,9 L13,3.5 C13,2.67 12.33,2 11.5,2 C10.67,2 10,2.67 10,3.5 L10,9 L2,14 L2,16 L10,13.5 L10,19 L8,20.5 L8,22 L11.5,21 L15,22 L15,20.5 L13,19 L13,13.5 L21,16 Z"/>
          </svg>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .plane-loader-wrapper {
      user-select: none;
    }

    .plane-loader-scene {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .globe-plane-container {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      border-radius: 50%;
      animation: orbit2D 1.1s linear infinite;
    }

    /* Rastro (Trail) do Avião idêntico ao Login, na cor Azul Horizon (#5BA4D8) */
    .globe-plane-container::after {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      border: 2.5px solid transparent;
      border-top-color: #5BA4D8;
      border-left-color: rgba(91, 164, 216, 0.18);
      transform: rotate(-45deg);
      opacity: 0.95;
      pointer-events: none;
    }

    .globe-plane {
      position: absolute;
      top: -15px;
      left: calc(50% - 15px);
      width: 30px;
      height: 30px;
      color: #5BA4D8;
      transform: rotate(90deg);
      filter: drop-shadow(0 2px 5px rgba(91, 164, 216, 0.35));
      z-index: 2;
    }

    @keyframes orbit2D {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class PlaneLoaderComponent {
  @Input() size: number = 130;
}
