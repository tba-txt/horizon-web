import { Component, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { animate, stagger } from 'motion';
import { AuthLayoutComponent } from '../../../shared/layouts/auth-layout/auth-layout.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { strictEmailValidator } from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent],
  template: `
    <app-auth-layout imagePosition="left" imageSrc="assets/Group20.png">
      
      <!-- Container absoluto para a imagem de fundo (trilha do avião) e monumentos - NÃO MODIFICAR -->
      <div class="position-absolute w-100 h-100 top-0 start-0 pointer-events-none" style="z-index: 0; overflow: hidden;">
        <!-- Trilha do Avião -->
        <img src="assets/Group10.png" alt="" class="airplane-trail position-absolute" />
        
        <!-- Monumentos no rodapé -->
        <div class="landmarks-container position-absolute bottom-0 w-100 d-flex justify-content-between px-4">
          <img src="assets/colosseum.png" alt="" class="landmark-icon" />
          <img src="assets/eiffel-tower.png" alt="" class="landmark-icon" />
          <img src="assets/taj-mahal.png" alt="" class="landmark-icon" />
        </div>
      </div>

      <div class="auth-glass-wrapper position-relative w-100 d-flex justify-content-center align-items-center" style="z-index: 1; min-height: 100%;">
        
        <!-- Card com Efeito Glassmorphism Real (translúcido, com textura e reflexo) -->
        <div class="glass-card p-3 p-md-4 w-100">

          <!-- Header / Branding -->
          <div class="text-center mb-3 login-anim-item pt-2">
            <div class="globe-scene mb-3 mx-auto">
              <!-- Globo Imagem -->
              <img src="assets/globo.webp" alt="Globo" class="globe-svg" style="object-fit: contain;" />
              <!-- Container da Órbita e Avião -->
              <div class="globe-plane-container">
                <svg class="globe-plane" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21,16 L21,14 L13,9 L13,3.5 C13,2.67 12.33,2 11.5,2 C10.67,2 10,2.67 10,3.5 L10,9 L2,14 L2,16 L10,13.5 L10,19 L8,20.5 L8,22 L11.5,21 L15,22 L15,20.5 L13,19 L13,13.5 L21,16 Z"/>
                </svg>
              </div>
            </div>
            <h2 class="h4 fw-bold mb-0 text-dark" style="letter-spacing: -0.3px;">
              Bem-vindo ao <span style="color: #4A90E2;">Horizon</span>
            </h2>
          </div>

          <!-- Alerta de Erro -->
          @if (errorMessage()) {
            <div class="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2 px-3 rounded-3 border-0 shadow-sm" role="alert" style="background: rgba(254, 242, 242, 0.9); color: #991b1b; backdrop-filter: blur(8px);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              <span class="small fw-medium">{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
            <!-- Email com Ícone de Envelope -->
            <div class="mb-2 login-anim-item">
              <label for="email" class="form-label small fw-bold text-dark mb-1">Endereço de e-mail</label>
              <div class="custom-glass-input-group">
                <span class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zM16 11.801V4.697l-5.803 3.546L16 11.801z"/>
                  </svg>
                </span>
                <input 
                  id="email" 
                  type="email" 
                  formControlName="email"
                  class="form-control form-control-glass"
                  [class.is-invalid]="isFieldInvalid('email')"
                  placeholder="nome@exemplo.com"
                  autocomplete="email"
                />
              </div>
              @if (isFieldInvalid('email')) {
                <div class="text-danger small mt-1 ms-1 fw-medium">
                  {{ loginForm.get('email')?.errors?.['message'] || 'O email é obrigatório.' }}
                </div>
              }
            </div>

            <!-- Senha com Ícone de Cadeado e Botão de Revelar -->
            <div class="mb-2 login-anim-item">
              <label for="password" class="form-label small fw-bold text-dark mb-1">Senha</label>
              <div class="custom-glass-input-group">
                <span class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                  </svg>
                </span>
                <input 
                  id="password" 
                  [type]="showPassword() ? 'text' : 'password'" 
                  formControlName="password"
                  class="form-control form-control-glass pe-5"
                  [class.is-invalid]="isFieldInvalid('password')"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button 
                  type="button" 
                  class="btn-toggle-eye" 
                  (click)="togglePasswordVisibility()" 
                  [attr.aria-label]="showPassword() ? 'Ocultar senha' : 'Ver senha'"
                >
                  @if (showPassword()) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z"/>
                      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829"/>
                      <path d="M3.35 5.47q-.27.24-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z"/>
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                    </svg>
                  }
                </button>
              </div>
              @if (isFieldInvalid('password')) {
                <div class="text-danger small mt-1 ms-1 fw-medium">
                  A senha é obrigatória.
                </div>
              }
            </div>

            <!-- Opções: Lembrar login + Esqueci a senha -->
            <div class="d-flex justify-content-between align-items-center mb-3 login-anim-item px-1 mt-2">
              <div class="form-check form-switch d-flex align-items-center gap-2 mb-0 p-0">
                <input class="form-check-input custom-switch m-0" type="checkbox" role="switch" id="rememberMe">
                <label class="form-check-label small fw-medium" for="rememberMe" style="cursor: pointer; color: #4A90E2;">
                  Lembrar login?
                </label>
              </div>
              <a routerLink="/forgot-password" class="small text-decoration-none fw-semibold hover-link" style="color: #4A90E2;">
                Esqueci a senha
              </a>
            </div>

            <!-- Botão Entrar com Animação de Decolagem (Uiverse.io vinodjangid07) -->
            <div class="login-anim-item mb-2">
              <button 
                type="submit" 
                [disabled]="loginForm.invalid || isLoading()"
                class="CartBtn w-100 fw-bold shadow-sm"
                [class.is-takeoff]="isLoading()"
              >
                <!-- Container do Aviãozinho (SVG vinodjangid07) -->
                <span class="IconContainer" aria-hidden="true">
                  <svg viewBox="0 0 13 13" width="19px" height="19px" class="plane-svg">
                    <path
                      fill="white"
                      d="M1.55989957,5.41666667 L5.51582215,5.41666667 L4.47015462,0.108333333 L4.47015462,0.108333333 C4.47015462,0.0634601974 4.49708054,0.0249592654 4.5354546,0.00851337035 L4.57707145,0 L5.36229752,0 C5.43359776,0 5.50087375,0.028779451 5.55026392,0.0782711996 L5.59317877,0.134368264 L7.13659662,2.81558333 L8.29565964,2.81666667 C8.53185377,2.81666667 8.72332694,3.01067661 8.72332694,3.25 C8.72332694,3.48932339 8.53185377,3.68333333 8.29565964,3.68333333 L7.63589819,3.68225 L8.63450135,5.41666667 L11.9308317,5.41666667 C12.5213171,5.41666667 13,5.90169152 13,6.5 C13,7.09830848 12.5213171,7.58333333 11.9308317,7.58333333 L8.63450135,7.58333333 L7.63589819,9.31666667 L8.29565964,9.31666667 C8.53185377,9.31666667 8.72332694,9.51067661 8.72332694,9.75 C8.72332694,9.98932339 8.53185377,10.1833333 8.29565964,10.1833333 L7.13659662,10.1833333 L5.59317877,12.8656317 C5.55725264,12.9280353 5.49882018,12.9724157 5.43174295,12.9907056 L5.36229752,13 L4.57707145,13 L4.55610333,12.9978962 C4.51267695,12.9890959 4.48069792,12.9547924 4.47230803,12.9134397 L4.47223088,12.8704208 L5.51582215,7.58333333 L1.55989957,7.58333333 L0.891288881,8.55114605 C0.853775374,8.60544678 0.798421006,8.64327676 0.73629202,8.65879796 L0.672314689,8.66666667 L0.106844414,8.66666667 L0.0715243949,8.66058466 L0.0715243949,8.66058466 C0.0297243066,8.6457608 0.00275502199,8.60729104 0,8.5651586 L0.00593007386,8.52254537 L0.580855011,6.85813984 C0.64492547,6.67265611 0.6577034,6.47392717 0.619193545,6.28316421 L0.580694768,6.14191703 L0.00601851064,4.48064746 C0.00203480725,4.4691314 0,4.45701613 0,4.44481314 C0,4.39994001 0.0269259152,4.36143908 0.0652999725,4.34499318 L0.106916826,4.33647981 L0.672546853,4.33647981 C0.737865848,4.33647981 0.80011301,4.36066329 0.848265401,4.40322477 L0.89131128,4.45169723 L1.55989957,5.41666667 Z"
                    ></path>
                  </svg>
                </span>

                <span class="btn-text-wrapper">
                  <span class="btn-text">
                    @if (isLoading()) {
                      Decolando...
                    } @else {
                      Entrar
                    }
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" class="btn-chevron ms-1">
                    <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </span>

                <!-- Rastro de fumaça sutil quando decola -->
                <span class="jet-stream" aria-hidden="true"></span>
              </button>
            </div>

            <!-- Separador "ou" -->
            <div class="d-flex align-items-center gap-3 my-2 login-anim-item">
              <hr class="flex-grow-1 border-secondary-subtle opacity-50 m-0">
              <span class="small fw-medium text-muted">ou</span>
              <hr class="flex-grow-1 border-secondary-subtle opacity-50 m-0">
            </div>

            <!-- Link de Cadastro -->
            <div class="text-center login-anim-item">
              <span class="text-muted small">Ainda não tem uma conta? </span>
              <a routerLink="/register" class="small fw-bold text-decoration-none hover-link" style="color: #4A90E2;">
                Criar Conta
              </a>
            </div>
          </form>

        </div>
      </div>
    </app-auth-layout>
  `,
  styles: [`
    /* =========================================================
       CONTROLE DE TAMANHO E POSIÇÃO DOS ÍCONES E FUNDO (MANTIDOS)
       ========================================================= */
    .pointer-events-none {
      pointer-events: none;
    }
    
    /* Trilha do Avião */
    .airplane-trail {
      bottom: clamp(-40px, -3vh, -10px);
      right: clamp(10px, 2vw, 35px);
      height: clamp(55%, 72vh, 80%);
      max-width: 90%;
      object-fit: contain;
      opacity: 0.95;
      transform: translateY(35px);
      transition: all 0.3s ease;
    }

    /* Container dos 3 monumentos no rodapé */
    .landmarks-container {
      z-index: 0;
      bottom: -2px !important;                /* <-- MOVI OS ÍCONES PARA BAIXO AQUI */
      transform: translateY(8px);             /* <-- AJUSTE FINO PARA DESCER MAIS UM POUCO */
      padding-left: clamp(1.5rem, 3vw, 3rem);
      padding-right: clamp(1.5rem, 3vw, 3rem);
      padding-bottom: 0;
    }

    /* Monumentos (Coliseu, Torre Eiffel, Taj Mahal) */
    .landmark-icon {
      height: clamp(55px, 7.5vw, 105px);
      object-fit: contain;
      opacity: 0.92;
      transition: height 0.3s ease;
    }

    /* =========================================================
       CARD COM GLASSMORPHISM REAL (TEXTURA, REFLEXO E TRANSLUCIDEZ)
       ========================================================= */
    .auth-glass-wrapper {
      padding: 1rem;
    }

    .glass-card {
      max-width: 360px;
      /* Camada de vidro ultra translúcida (revela o fundo com desfoque e refração) */
      background: linear-gradient(
        135deg, 
        rgba(255, 255, 255, 0.28) 0%, 
        rgba(255, 255, 255, 0.08) 100%
      );
      backdrop-filter: blur(18px) saturate(230%) contrast(100%);
      -webkit-backdrop-filter: blur(36px) saturate(210%) contrast(106%);
      border: 1.5px solid rgba(255, 255, 255, 0.65);
      border-radius: clamp(16px, 3vw, 22px);
      /* Sombra macia + bisel / chanfro de luz brilhante nas bordas internas do vidro */
      box-shadow: 
        0 30px 60px -12px rgba(11, 37, 69, 0.15),
        0 12px 28px -6px rgba(74, 144, 226, 0.08),
        inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95),
        inset 0 -1.5px 1px 0 rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
    }

    /* Brilho reflexivo sutil no topo do vidro (Specular Sheen) */
    .glass-card::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.28) 0%,
        rgba(255, 255, 255, 0.04) 40%,
        transparent 100%
      );
      pointer-events: none;
      z-index: 0;
    }

/* =========================================================
   ANIMAÇÃO DO GLOBO E AVIÃO 2D (LOGIN)
   ========================================================= */

.globe-scene {
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.globe-svg {
  width: 76px;
  height: 76px;
  opacity: 0.95;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
}

.globe-plane-container {
  position: absolute;
  width: 110px;
  height: 110px;
  top: 50%; left: 50%;
  margin-top: -55px;
  margin-left: -55px;
  border-radius: 50%;
  animation: orbit2D 2.5s linear infinite; /* Mais rápido */
}

/* Rastro (Trail) do Avião */
.globe-plane-container::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.9);
  border-left-color: rgba(255, 255, 255, 0.15);
  transform: rotate(-45deg);
  opacity: 0.8;
  pointer-events: none;
}

.globe-plane {
  position: absolute;
  top: -12px;
  left: calc(50% - 12px);
  width: 24px;
  height: 24px;
  color: #ffffff;
  transform: rotate(90deg);
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
  z-index: 2;
}

@keyframes orbit2D {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
    /* =========================================================
       INPUTS COM MAIS SOMBREAMENTO E CONTRASTE
       ========================================================= */
    .custom-glass-input-group {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      color: #4A90E2;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 2;
    }

    .form-control-glass {
      width: 100%;
      background: rgba(255, 255, 255, 0.72);      /* <-- Menos transparente, fundo sólido suave muito visível */
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1.5px solid rgba(74, 144, 226, 0.32); /* <-- Borda azul suave bem definida */
      border-radius: 12px;
      padding: 0.6rem 0.8rem 0.6rem 2.25rem;
      font-size: 0.85rem;
      color: #1e293b;
      /* Sombreamento refinado nos campos para dar profundidade e destaque */
      box-shadow: 
        0 4px 16px -2px rgba(11, 37, 69, 0.08),
        0 2px 6px 0 rgba(74, 144, 226, 0.04),
        inset 0 1.5px 2px rgba(255, 255, 255, 0.9);
      transition: all 0.25s ease;
      outline: none;
      position: relative;
      z-index: 1;
    }

    .form-control-glass::placeholder {
      color: #94a3b8;
    }

    .form-control-glass:focus {
      background: #ffffff;
      border-color: #4A90E2;
      box-shadow: 
        0 8px 24px -4px rgba(74, 144, 226, 0.25),
        0 0 0 4px rgba(74, 144, 226, 0.18),
        inset 0 1px 2px rgba(255, 255, 255, 0.9);
    }

    .form-control-glass.is-invalid {
      border-color: #ef4444;
      background: rgba(254, 242, 242, 0.8);
    }

    /* Botão de Revelar Senha */
    .btn-toggle-eye {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.2s ease, transform 0.15s ease;
      z-index: 2;
    }

    .btn-toggle-eye:hover {
      color: #4A90E2;
      transform: scale(1.1);
    }

    /* Switch Customizado */
    .custom-switch {
      width: 34px !important;
      height: 18px !important;
      background-color: #cbd5e1;
      border-color: #cbd5e1;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e") !important;
      cursor: pointer;
    }
    
    .custom-switch:checked {
      background-color: #4A90E2;
      border-color: #4A90E2;
    }

    .custom-switch:focus {
      box-shadow: none;
    }

    /* =========================================================
       BOTÃO HORIZON TAKEOFF (Base: vinodjangid07 Uiverse.io)
       ========================================================= */
    .CartBtn {
      width: 100%;
      height: 44px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: linear-gradient(135deg, #4A90E2 0%, #2b6cb0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
      overflow: hidden;
      box-shadow: 0 10px 24px rgba(74, 144, 226, 0.35);
      position: relative;
      color: white;
    }

    .IconContainer {
      position: absolute;
      left: -40px;
      width: 28px;
      height: 28px;
      background-color: transparent;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
      z-index: 3;
      transition: all 0.75s cubic-bezier(0.22, 1, 0.36, 1);
      opacity: 0;
      pointer-events: none;
    }

    .plane-svg {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
      transition: transform 0.6s ease;
      width: 16px;
      height: 16px;
    }

    .btn-text-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: all 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .btn-text {
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .btn-chevron {
      color: rgba(255, 255, 255, 0.85);
      transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease;
    }

    /* --- ESTADO HOVER (Entrada suave do avião vindo da esquerda) --- */
    .CartBtn:hover:not(:disabled) {
      background: linear-gradient(135deg, #357ABD 0%, #1d5088 100%);
      box-shadow: 0 12px 28px rgba(74, 144, 226, 0.45);
      transform: translateY(-2px);
    }

    .CartBtn:hover:not(:disabled) .IconContainer {
      left: calc(50% - 68px);
      opacity: 1;
      transform: rotate(-6deg);
    }

    .CartBtn:hover:not(:disabled) .btn-text-wrapper {
      transform: translateX(14px);
    }

    .CartBtn:hover:not(:disabled) .btn-chevron {
      transform: translateX(4px);
    }

    /* --- ESTADO ACTIVE (Pressionado) --- */
    .CartBtn:active:not(:disabled) {
      transform: translateY(0) scale(0.98);
      transition-duration: 0.2s;
    }

    /* --- ESTADO TAKEOFF / DECOLAGEM (Quando clica em Entrar / isLoading) --- */
    .CartBtn.is-takeoff {
      background: linear-gradient(135deg, #2b6cb0 0%, #153e75 100%);
      cursor: wait;
    }

    .CartBtn.is-takeoff .IconContainer {
      opacity: 1;
      animation: airplaneFlyAway 2.2s cubic-bezier(0.35, 0, 0.25, 1) forwards;
    }

    .CartBtn.is-takeoff .btn-text-wrapper {
      transform: translateX(0);
    }

    .CartBtn.is-takeoff .btn-chevron {
      opacity: 0;
      transform: translateX(30px);
    }

    .CartBtn.is-takeoff .jet-stream {
      position: absolute;
      top: 50%;
      left: 10%;
      height: 2px;
      width: 70%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.7), transparent);
      animation: jetStreamAnim 2.2s ease-out forwards;
      z-index: 1;
    }

    @keyframes airplaneFlyAway {
      0% {
        left: calc(50% - 68px);
        transform: translateY(0) rotate(-6deg) scale(1);
        opacity: 1;
      }
      20% {
        /* Preparação e leve recuo na pista */
        left: calc(50% - 76px);
        transform: translateY(2px) rotate(0deg) scale(0.96);
        opacity: 1;
      }
      50% {
        /* Aceleração firme pelo corpo do botão */
        left: calc(50% + 15px);
        transform: translateY(-4px) rotate(-12deg) scale(1.08);
        opacity: 1;
      }
      75% {
        /* Começo da inclinação de subida */
        left: calc(50% + 75px);
        transform: translateY(-16px) rotate(-18deg) scale(1.18);
        opacity: 1;
      }
      100% {
        /* Decolagem graciosa saindo pelo canto superior direito */
        left: 110%;
        transform: translateY(-42px) rotate(-24deg) scale(1.28);
        opacity: 0;
      }
    }

    @keyframes jetStreamAnim {
      0% {
        opacity: 0;
        transform: scaleX(0);
        transform-origin: left;
      }
      30% {
        opacity: 0.4;
      }
      60% {
        opacity: 0.85;
        transform: scaleX(1);
      }
      100% {
        opacity: 0;
        transform: scaleX(1.5) translateX(50px);
      }
    }

    .CartBtn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      box-shadow: none;
    }

    .hover-link {
      transition: all 0.2s ease;
    }

    .hover-link:hover {
      color: #2b6cb0 !important;
      text-decoration: underline !important;
    }

    .login-anim-item {
      opacity: 1;
    }

    /* =========================================================
       RESPONSIVIDADE ESPECÍFICA
       ========================================================= */
    @media (max-width: 991.98px) {
      .airplane-trail {
        opacity: 0.65;
        height: 60%;
        transform: translateY(20px);
      }
    }

    @media (max-width: 575.98px) {
      .glass-card {
        padding: 1.5rem !important;
      }
      .airplane-trail {
        opacity: 0.45;
        height: 50%;
        right: 0;
        transform: translateY(10px);
      }
      .landmark-icon {
        height: 50px;
      }
      .landmarks-container {
        padding-bottom: 0.5rem;
      }
    }

    @media (max-height: 720px) {
      .glass-card {
        padding: 1.25rem 2rem !important;
      }
      .landmark-icon {
        height: 55px;
      }
    }
  `]
})
export class LoginComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, strictEmailValidator()]],
    password: ['', [Validators.required]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  ngAfterViewInit(): void {
    setTimeout(() => {
      const items = document.querySelectorAll('.login-anim-item');
      if (items.length > 0) {
        animate(
          items,
          { opacity: [0, 1], y: [14, 0] },
          { delay: stagger(0.06), duration: 0.4, ease: 'easeOut' }
        );
      }
    }, 40);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/destinations']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'E-mail ou senha incorretos.');
      }
    });
  }
}
