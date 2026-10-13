import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { TicketComponent } from '../../shared/components/ticket/ticket.component';
import { ReservationService } from '../../core/reservations/services/reservation.service';
import { PaymentService } from '../../core/reservations/services/payment.service';
import { TokenStorageService } from '../../core/auth/services/token-storage.service';
import { findLocalImage } from '../destinations/services/destinations.service';
import { 
  CheckoutDraft, 
  ReservationResponse, 
  PaymentMethod, 
  ReservationRequest, 
  PassengerRequest 
} from '../../core/reservations/models/reservation.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, TicketComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/paymentt.webp" 
        alt="Horizon Checkout" 
        class="w-100 hero-image"
        fetchpriority="high"
      />
    </header>

    <div class="checkout-page-bg py-4 py-lg-5">
    <main class="container">
      
      <!-- Stepper Minimalista Horizon -->
      <nav class="checkout-stepper mb-4">
        <div class="stepper-bar">
          <!-- Etapa 1 -->
          <div class="stepper-step" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1">
            <div class="step-badge">
              @if (currentStep() > 1) {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              } @else {
                <span>1</span>
              }
            </div>
            <span class="step-title">Passageiros</span>
          </div>

          <!-- Etapa 2 -->
          <div class="stepper-step" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2">
            <div class="step-badge">
              @if (currentStep() > 2) {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              } @else {
                <span>2</span>
              }
            </div>
            <span class="step-title">Pagamento</span>
          </div>

          <!-- Etapa 3 -->
          <div class="stepper-step" [class.active]="currentStep() === 3">
            <div class="step-badge">
              <span>3</span>
            </div>
            <span class="step-title">Confirmação</span>
          </div>
        </div>
      </nav>

      <!-- Alertas de Feedback Globais -->
      @if (errorMessage()) {
        <div class="alert alert-danger d-flex align-items-center gap-3 rounded-2 mb-4 border-0 shadow-sm" role="alert">
          <div class="flex-grow-1 small">
            <strong>Atenção:</strong> {{ errorMessage() }}
          </div>
          <button type="button" class="btn-close" (click)="errorMessage.set(null)" aria-label="Fechar"></button>
        </div>
      }
      @if (successMessage()) {
        <div class="alert alert-success d-flex align-items-center gap-3 rounded-2 mb-4 border-0 shadow-sm" role="alert">
          <div class="flex-grow-1 small">
            <strong>Sucesso:</strong> {{ successMessage() }}
          </div>
          <button type="button" class="btn-close" (click)="successMessage.set(null)" aria-label="Fechar"></button>
        </div>
      }

      <!-- Loading State Global -->
      @if (isLoading()) {
        <div class="text-center py-5">
          <div class="spinner"><div></div><div></div><div></div><div></div><div></div></div>
          <p class="text-muted fw-medium mt-3">{{ loadingMessage() }}</p>
        </div>
      }

      <!-- ESTADO: Nenhuma seleção ativa e nenhuma reserva carregada -->
      @else if (!draft() && !currentReservation() && !isCancelled()) {
        <div class="card border-0 rounded-4 p-5 text-center bg-white my-4 shadow-sm">
          <h2 class="h4 fw-bold mb-2" style="color: #5BA4D8;">Nenhum voo selecionado para checkout</h2>
          <p class="text-secondary small mb-4 col-md-6 mx-auto">
            Para iniciar o processo de reserva e pagamento, selecione os voos na consulta de voos.
          </p>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            <a routerLink="/flights" class="btn btn-horizon-blue px-4 py-2 rounded-2 fw-bold shadow-sm">
              Ir para Consulta de Voos
            </a>
            <a routerLink="/profile" class="btn btn-light border px-4 py-2 rounded-2 fw-semibold text-secondary">
              Ver Minhas Reservas
            </a>
          </div>
        </div>
      }

      <!-- ESTADO: Reserva CANCELADA -->
      @else if (isCancelled() || currentReservation()?.status === 'CANCELADA') {
        <div class="card border-0 rounded-4 p-5 text-center bg-white my-4 shadow-sm">
          <h2 class="h3 fw-bold text-danger mb-2">Reserva Cancelada</h2>
          <p class="text-secondary mb-4 col-md-6 mx-auto small">
            Esta reserva foi cancelada com sucesso e os assentos foram liberados. Nenhuma cobrança será efetuada.
          </p>
          <div class="d-flex justify-content-center gap-3 flex-wrap">
            <a routerLink="/flights" class="btn btn-horizon-blue px-4 py-2 rounded-2 fw-bold shadow-sm">
              Buscar Outros Voos
            </a>
            <a routerLink="/profile" class="btn btn-light border px-4 py-2 rounded-2 fw-semibold text-secondary">
              Voltar ao Meu Perfil
            </a>
          </div>
        </div>
      }

      <!-- ESTADO: Reserva CONFIRMADA com Sucesso e Bilhetes Emitidos -->
      @else if (currentReservation()?.status === 'CONFIRMADA' || currentReservation()?.status === 'CONCLUIDA') {
        <div class="card border-0 rounded-4 p-4 p-md-5 text-center bg-white my-4 shadow-sm">
          
          <div class="d-inline-flex align-items-center justify-content-center mx-auto mb-3 rounded-circle" style="width: 56px; height: 56px; background: rgba(101, 163, 13, 0.12); color: #65A30D;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h2 class="h4 fw-bold mb-2" style="color: #5BA4D8;">Pagamento Confirmado com Sucesso!</h2>
          <p class="text-secondary mb-4 col-md-7 mx-auto small">
            Sua viagem para <strong class="text-dark">{{ currentReservation()!.destinationName }}</strong> está confirmada e seus cartões de embarque já foram emitidos.
          </p>

          <!-- Bilhetes Emitidos com Cartão de Embarque 3D igual ao /profile -->
          @if (currentReservation()?.tickets && currentReservation()!.tickets!.length > 0) {
            <div class="d-flex justify-content-center flex-wrap gap-4 my-4">
              @for (ticket of currentReservation()!.tickets; track ticket.id) {
                <div class="ticket-3d-wrapper">
                  <app-ticket 
                    [passengerName]="ticket.passengerName"
                    [ticketNumber]="ticket.ticketNumber"
                    [origin]="currentReservation()!.outboundFlight?.originAirportCode || 'GRU'"
                    [destination]="currentReservation()!.outboundFlight?.destinationAirportCode || 'DEST'"
                    [flightNumber]="currentReservation()!.outboundFlight?.flightNumber || 'HZ-402'"
                    [departureTime]="currentReservation()!.outboundFlight?.departureTime || '08:30'"
                    [arrivalTime]="currentReservation()!.outboundFlight?.arrivalTime || '17:45'"
                    [gate]="'B08'"
                    [date]="(currentReservation()!.outboundFlight?.flightDate | date:'dd/MM/yyyy') || ''">
                  </app-ticket>
                </div>
              }
            </div>
          }

          <div class="d-flex justify-content-center gap-3 flex-wrap pt-2">
            <a routerLink="/profile" class="btn btn-horizon-blue px-4 py-2 rounded-2 fw-bold shadow-sm">
              Acessar meu perfil
            </a>
            @if (currentReservation()?.tickets && currentReservation()!.tickets!.length > 0) {
              <button 
                type="button" 
                class="btn btn-horizon-outline px-4 py-2 rounded-2 fw-bold"
                (click)="downloadAllTickets()"
              >
                Baixar passagem em PDF
              </button>
            }
          </div>
        </div>
      }

      <!-- FLUXO NORMAL DE COMPRA (ETAPA 1 E ETAPA 2) -->
      @else {
        <div class="row g-4">
          
          <!-- Coluna Esquerda: Formulário de Passageiros OU Seleção de Pagamento -->
          <div class="col-12 col-lg-7">
            
            <!-- ETAPA 1: Cadastro dos Passageiros -->
            @if (draft() && !currentReservation()) {
              <div class="card border-0 rounded-4 p-4 bg-white mb-4 shadow-sm">
                
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <h2 class="h5 fw-bold mb-0" style="color: #5BA4D8;">Passageiros</h2>
                </div>

                <form [formGroup]="passengersForm" (ngSubmit)="onCreateReservationFromDraft()">
                  
                  <div formArrayName="passengers" class="d-flex flex-column gap-3">
                    @for (ctrl of passengersArray.controls; track $index) {
                      <div [formGroupName]="$index" class="passenger-accordion-item rounded-3 border overflow-hidden">
                        
                        <!-- Cabeçalho Dropdown do Passageiro -->
                        <button 
                          type="button" 
                          class="passenger-accordion-header w-100 d-flex justify-content-between align-items-center px-3 py-3 border-0 text-start"
                          [class.active-header]="expandedPassengerIndex() === $index"
                          (click)="togglePassenger($index)"
                        >
                          <div class="d-flex align-items-center gap-2">
                            <span class="fw-bold" [style.color]="expandedPassengerIndex() === $index ? '#5BA4D8' : '#1e293b'">
                              Passageiro {{ $index + 1 }}
                            </span>
                            @if (expandedPassengerIndex() !== $index && ctrl.get('name')?.value) {
                              <span class="text-secondary small">• {{ ctrl.get('name')?.value }}</span>
                            }
                          </div>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" [attr.stroke]="expandedPassengerIndex() === $index ? '#5BA4D8' : '#64748b'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            @if (expandedPassengerIndex() === $index) {
                              <polyline points="18 15 12 9 6 15"></polyline>
                            } @else {
                              <polyline points="6 9 12 15 18 9"></polyline>
                            }
                          </svg>
                        </button>

                        <!-- Corpo Expansível do Passageiro -->
                        @if (expandedPassengerIndex() === $index) {
                          <div class="p-3 bg-white">
                            <div class="row g-3">
                              <div class="col-12 col-sm-8">
                                <label class="form-label small fw-semibold text-secondary mb-1">Nome Completo</label>
                                <input 
                                  type="text" 
                                  formControlName="name"
                                  class="form-control rounded-2 horizon-input"
                                  placeholder="Ex: Carlos Eduardo da Silva"
                                  (keydown)="preventNonAlpha($event)"
                                  (input)="onNameInput($event, $index)"
                                  (paste)="onNamePaste($event, $index)"
                                />
                                @if (ctrl.get('name')?.invalid && ctrl.get('name')?.touched) {
                                  @if (ctrl.get('name')?.errors?.['pattern']) {
                                    <div class="text-danger small mt-1">Apenas letras são permitidas.</div>
                                  } @else if (ctrl.get('name')?.errors?.['minlength']) {
                                    <div class="text-danger small mt-1">Mínimo de 3 caracteres.</div>
                                  } @else {
                                    <div class="text-danger small mt-1">Informe o nome completo.</div>
                                  }
                                }
                              </div>

                              <div class="col-12 col-sm-4">
                                <label class="form-label small fw-semibold text-secondary mb-1">Idade</label>
                                <input 
                                  type="text" 
                                  inputmode="numeric"
                                  formControlName="age"
                                  maxlength="3"
                                  class="form-control rounded-2 horizon-input"
                                  placeholder="Ex: 28"
                                  (keydown)="preventNonNumeric($event)"
                                  (input)="onAgeInput($event, $index)"
                                  (paste)="onAgePaste($event, $index)"
                                />
                                @if (ctrl.get('age')?.invalid && ctrl.get('age')?.touched) {
                                  <div class="text-danger small mt-1">Idade entre 1 e 120.</div>
                                }
                                @if (ctrl.get('age')?.valid && ctrl.get('age')?.value < 18 && passengersArray.length === 1) {
                                  <div class="text-danger small mt-1">
                                    Menores de 18 anos não viajam desacompanhados.
                                  </div>
                                }
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Alerta se todas as pessoas forem menores de idade -->
                  @if (passengersMinorError()) {
                    <div class="alert alert-danger d-flex align-items-center gap-2 rounded-2 mt-3 mb-0 small" role="alert">
                      <div>{{ passengersMinorError() }}</div>
                    </div>
                  }

                  <div class="d-flex justify-content-between align-items-center mt-4 pt-2">
                    <a routerLink="/flights" class="btn btn-light border px-3 py-2 rounded-2 fw-semibold text-secondary small">
                      ← Voltar
                    </a>
                    <button 
                      type="submit" 
                      class="btn btn-horizon-blue px-4 py-2 fw-bold rounded-2 shadow-sm d-flex align-items-center gap-2"
                      [disabled]="passengersForm.invalid || !!passengersMinorError() || isProcessing()"
                    >
                      @if (isProcessing()) {
                        <div class="spinner"><div></div><div></div><div></div><div></div><div></div></div>
                        <span>Gerando Reserva...</span>
                      } @else {
                        <span>Avançar para Pagamento →</span>
                      }
                    </button>
                  </div>
                </form>

              </div>
            }

            <!-- ETAPA 2: Reserva Gerada no Backend (Status PENDENTE) -> Seleção do Pagamento -->
            @else if (currentReservation()?.status === 'PENDENTE') {
              <div class="card border-0 rounded-4 p-4 bg-white mb-4 shadow-sm">
                
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
                  <h2 class="h5 fw-bold mb-0" style="color: #5BA4D8;">Forma de Pagamento</h2>
                  <span class="text-secondary small">
                    Garantida até <strong class="text-dark">{{ formatDateTime(currentReservation()!.paymentDeadline) }}</strong>
                  </span>
                </div>

                <!-- Seletor de Métodos de Pagamento: PIX vs CARTÃO -->
                <div class="row g-3 mb-4">
                  <div class="col-12 col-sm-6">
                    <div 
                      class="payment-option-card p-3 rounded-3 border cursor-pointer"
                      [class.selected]="selectedMethod() === 'PIX'"
                      (click)="selectedMethod.set('PIX')"
                    >
                      <div class="d-flex align-items-center gap-3">
                        <div class="payment-radio" [class.checked]="selectedMethod() === 'PIX'">
                          <div class="radio-inner"></div>
                        </div>
                        <span class="fw-bold text-dark small">PIX</span>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-sm-6">
                    <div 
                      class="payment-option-card p-3 rounded-3 border cursor-pointer"
                      [class.selected]="selectedMethod() === 'CARD'"
                      (click)="selectedMethod.set('CARD')"
                    >
                      <div class="d-flex align-items-center gap-3">
                        <div class="payment-radio" [class.checked]="selectedMethod() === 'CARD'">
                          <div class="radio-inner"></div>
                        </div>
                        <span class="fw-bold text-dark small">Cartão de Crédito</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Detalhes do Método Selecionado: PIX -->
                @if (selectedMethod() === 'PIX') {
                  <div class="p-4 rounded-3 bg-light text-center mb-4">
                    <!-- QR Code SVG Realista -->
                    <div class="bg-white p-3 rounded-3 d-inline-block shadow-sm mb-3">
                      <svg width="136" height="136" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" class="d-block">
                        <path fill="#0b2545" d="M1 1h7v7H1V1zm1 1v5h5V2H2zm1 1h3v3H3V3zm18-2h7v7h-7V1zm1 1v5h5V2h-5zm1 1h3v3h-3V3zM1 21h7v7H1v-7zm1 1v5h5v-5H2zm1 1h3v3H3v-3zM10 1h2v2h-2V1zm3 0h1v3h-1V1zm2 1h2v2h-2V2zm3-1h2v1h-2V1zm-8 3h2v2h-2V4zm4 1h3v2h-3V5zm4-2h1v3h-1V3zM10 7h1v2h-1V7zm2 0h2v1h-2V7zm3 1h2v2h-2V8zm3-1h2v2h-2V7zM1 10h2v2H1v-2zm3 0h3v1H4v-1zm4 0h2v3H8v-3zm3 1h2v2h-2v-2zm3-1h1v2h-1v-2zm2 1h3v1h-3v-1zm4-1h2v2h-2v-2zm3 1h2v1h-2v-1zm3-1h2v2h-2v-2zM1 13h1v3H1v-3zm2 1h2v2H3v-2zm3-1h2v1H6v-1zm4 2h3v2h-3v-2zm4-1h2v3h-2v-3zm3 0h2v1h-2v-1zm3 1h3v2h-3v-2zm4-1h2v2h-2v-2zm3 1h1v3h-1v-3zM2 17h3v2H2v-2zm4 0h2v2H6v-2zm3 1h2v2H9v-2zm3-1h2v1h-2v-1zm3 1h3v2h-3v-2zm4 0h1v2h-1v-2zm2-1h2v3h-2v-3zm3 1h3v1h-3v-1zM9 21h2v2H9v-2zm3 0h3v1h-3v-1zm4 1h2v2h-2v-2zm3-1h2v2h-2v-2zm3 1h3v2h-3v-2zm4-1h2v3h-2v-3zM10 24h2v3h-2v-3zm3 1h2v2h-2v-2zm3-1h1v3h-1v-3zm2 2h3v2h-3v-2zm4-1h2v3h-2v-3zm3 1h3v2h-3v-2z"/>
                      </svg>
                    </div>

                    <p class="text-secondary small mb-3">
                      Escaneie o QR Code ou copie a chave Pix abaixo:
                    </p>

                    <!-- Código Copia e Cola com Botão de Copiar -->
                    <div class="input-group max-w-500 mx-auto">
                      <input 
                        type="text" 
                        class="form-control font-monospace small bg-white horizon-input" 
                        [value]="pixCode" 
                        readonly 
                      />
                      <button 
                        class="btn px-3 fw-semibold text-white" 
                        [style.background-color]="isPixCopied() ? '#65A30D' : '#5BA4D8'"
                        [style.border-color]="isPixCopied() ? '#65A30D' : '#5BA4D8'"
                        type="button"
                        (click)="copyPixCode()"
                      >
                        @if (isPixCopied()) {
                          <span>✓ Copiado</span>
                        } @else {
                          <span>Copiar Chave</span>
                        }
                      </button>
                    </div>
                  </div>
                }

                <!-- Detalhes do Método Selecionado: CARTÃO -->
                @if (selectedMethod() === 'CARD') {
                  <div class="p-4 rounded-3 bg-light mb-4">
                    
                    <!-- Preview Virtual do Cartão -->
                    <div class="virtual-card p-4 rounded-3 text-white shadow-sm mb-4 mx-auto position-relative overflow-hidden">
                      <div class="d-flex justify-content-between align-items-center mb-4">
                        <span class="fs-6 fw-bold tracking-wider">HORIZON</span>
                      </div>
                      <div class="fs-5 font-monospace mb-4 tracking-widest">
                        {{ formatCardNumberPreview(cardNumber) }}
                      </div>
                      <div class="d-flex justify-content-between align-items-end">
                        <div>
                          <small class="text-white-50 d-block font-size-10">TITULAR</small>
                          <span class="fw-semibold small text-uppercase">{{ cardHolderName || 'SEU NOME AQUI' }}</span>
                        </div>
                        <div class="text-end">
                          <small class="text-white-50 d-block font-size-10">VALIDADE</small>
                          <span class="fw-semibold small">{{ cardExpiry || 'MM/AA' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Campos do Cartão -->
                    <div class="row g-3">
                      <div class="col-12">
                        <label class="form-label small fw-semibold text-secondary mb-1">Nome Impresso no Cartão *</label>
                        <input 
                          type="text" 
                          class="form-control rounded-2 text-uppercase horizon-input" 
                          [(ngModel)]="cardHolderName" 
                          (keydown)="preventNonAlpha($event)"
                          (input)="onCardHolderInput($event)"
                          (paste)="onCardHolderPaste($event)"
                          placeholder="Ex: CARLOS E SILVA" 
                        />
                      </div>
                      <div class="col-12 col-sm-8">
                        <label class="form-label small fw-semibold text-secondary mb-1">Número do Cartão *</label>
                        <input 
                          type="text" 
                          inputmode="numeric"
                          class="form-control rounded-2 font-monospace horizon-input" 
                          [(ngModel)]="cardNumber" 
                          maxlength="19" 
                          (keydown)="preventNonNumeric($event)"
                          (input)="onCardNumberInput($event)"
                          (paste)="onCardNumberPaste($event)"
                          placeholder="0000 0000 0000 0000" 
                        />
                      </div>
                      <div class="col-6 col-sm-2">
                        <label class="form-label small fw-semibold text-secondary mb-1">Validade *</label>
                        <input 
                          type="text" 
                          inputmode="numeric"
                          class="form-control rounded-2 font-monospace horizon-input" 
                          [(ngModel)]="cardExpiry" 
                          maxlength="5" 
                          (keydown)="preventNonNumeric($event)"
                          (input)="onCardExpiryInput($event)"
                          (paste)="onCardExpiryPaste($event)"
                          placeholder="MM/AA" 
                        />
                      </div>
                      <div class="col-6 col-sm-2">
                        <label class="form-label small fw-semibold text-secondary mb-1">CVV *</label>
                        <input 
                          type="password" 
                          inputmode="numeric"
                          class="form-control rounded-2 font-monospace horizon-input" 
                          [(ngModel)]="cardCvv" 
                          maxlength="4" 
                          (keydown)="preventNonNumeric($event)"
                          (input)="onCardCvvInput($event)"
                          (paste)="onCardCvvPaste($event)"
                          placeholder="123" 
                        />
                      </div>
                      <div class="col-12">
                        <label class="form-label small fw-semibold text-secondary mb-1">Parcelamento</label>
                        <select class="form-select rounded-2 horizon-input" [(ngModel)]="installments">
                          <option value="1">1x de {{ formatCurrency(getTotalPrice()) }} sem juros</option>
                          <option value="2">2x de {{ formatCurrency(getTotalPrice() / 2) }} sem juros</option>
                          <option value="3">3x de {{ formatCurrency(getTotalPrice() / 3) }} sem juros</option>
                          <option value="6">6x de {{ formatCurrency(getTotalPrice() / 6) }} sem juros</option>
                          <option value="12">12x de {{ formatCurrency(getTotalPrice() / 12) }} sem juros</option>
                        </select>
                      </div>
                    </div>

                  </div>
                }

                <!-- Os 3 Estados: Pagar Agora, Pagar Depois, Cancelar -->
                <div class="d-flex flex-column gap-3">
                  
                  <!-- 1. Pagar Agora -->
                  <button 
                    type="button" 
                    class="btn btn-horizon-blue py-3 fw-bold rounded-2 shadow-sm d-flex align-items-center justify-content-center gap-2 fs-6"
                    [disabled]="isProcessing()"
                    (click)="onConfirmPaymentNow()"
                  >
                    @if (isProcessing()) {
                      <div class="spinner"><div></div><div></div><div></div><div></div><div></div></div>
                      <span>Processando Pagamento...</span>
                    } @else {
                      <span>Pagar com {{ selectedMethod() === 'PIX' ? 'PIX' : 'Cartão' }} • {{ formatCurrency(getTotalPrice()) }}</span>
                    }
                  </button>

                  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-1">
                    <!-- 2. Pagar Depois -->
                    <button 
                      type="button" 
                      class="btn btn-link text-secondary p-0 text-decoration-none small fw-semibold"
                      [disabled]="isProcessing()"
                      (click)="onPayLater()"
                    >
                      Pagar depois
                    </button>

                    <!-- 3. Cancelar Reserva -->
                    <button 
                      type="button" 
                      class="btn btn-link text-danger p-0 text-decoration-none small fw-semibold"
                      [disabled]="isProcessing()"
                      (click)="onCancelReservation()"
                    >
                      Cancelar reserva
                    </button>
                  </div>

                </div>

              </div>
            }

          </div>

          <!-- Coluna Direita: Resumo da Viagem Clean com Imagem do Destino -->
          <div class="col-12 col-lg-5">
            <aside class="card border-0 rounded-4 overflow-hidden bg-white sticky-top shadow-sm" style="top: 90px; z-index: 10;">
              
              <!-- Topo com Foto Real do Destino -->
              <div class="summary-dest-banner position-relative">
                <img 
                  [src]="getDestinationImageUrl()" 
                  [alt]="getDestinationName()" 
                  class="w-100 h-100 object-fit-cover d-block"
                  (error)="onDestinationImgError($event)"
                />
                <div class="summary-dest-overlay d-flex flex-column justify-content-end p-3">
                  <h3 class="h5 fw-bold text-white mb-0 summary-dest-title">{{ getDestinationName() }}</h3>
                </div>
              </div>

              <div class="p-4">
                <!-- Rota Compacta + Botão Modal de Detalhes -->
                <div class="mb-3">
                  @if (getOutboundFlight(); as out) {
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="d-flex align-items-center gap-2">
                        <span class="fw-bold text-dark fs-6">{{ out.originAirportCode }}</span>
                        <span style="color: #5BA4D8;" class="fw-bold">➔</span>
                        <span class="fw-bold text-dark fs-6">{{ out.destinationAirportCode }}</span>
                      </div>
                      <span class="text-secondary small fw-medium">{{ out.flightDate | date:'dd/MM/yyyy' }}</span>
                    </div>
                  }

                  @if (getReturnFlight(); as ret) {
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <div class="d-flex align-items-center gap-2">
                        <span class="fw-bold text-dark fs-6">{{ ret.originAirportCode }}</span>
                        <span style="color: #5BA4D8;" class="fw-bold">➔</span>
                        <span class="fw-bold text-dark fs-6">{{ ret.destinationAirportCode }}</span>
                      </div>
                      <span class="text-secondary small fw-medium">{{ ret.flightDate | date:'dd/MM/yyyy' }}</span>
                    </div>
                  }

                  <button 
                    type="button" 
                    class="btn btn-link p-0 text-decoration-none small fw-semibold d-inline-flex align-items-center gap-1 mt-1"
                    style="color: #5BA4D8;"
                    (click)="isFlightDetailsModalOpen.set(true)"
                  >
                    Ver detalhes do voo e bagagem
                  </button>
                </div>

                <!-- Dropdown Retrátil de Cupom de Desconto -->
                <div class="mb-3">
                  @if (appliedCouponCode()) {
                    <div class="d-flex align-items-center justify-content-between p-2 px-3 rounded-2" style="background: rgba(101, 163, 13, 0.1); border: 1px solid rgba(101, 163, 13, 0.3);">
                      <div>
                        <span class="fw-bold d-block small font-monospace" style="color: #65A30D;">{{ appliedCouponCode() }}</span>
                        <span class="text-secondary" style="font-size: 0.75rem;">10% OFF aplicado</span>
                      </div>
                      <button type="button" class="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-semibold" (click)="removeCoupon()">
                        Remover
                      </button>
                    </div>
                  } @else {
                    <button 
                      type="button" 
                      class="w-100 bg-transparent border-0 p-0 d-flex justify-content-between align-items-center text-start"
                      (click)="isCouponDropdownOpen.set(!isCouponDropdownOpen())"
                    >
                      <span class="small fw-semibold text-secondary">Possui cupom de desconto?</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        @if (isCouponDropdownOpen()) {
                          <polyline points="18 15 12 9 6 15"></polyline>
                        } @else {
                          <polyline points="6 9 12 15 18 9"></polyline>
                        }
                      </svg>
                    </button>

                    @if (isCouponDropdownOpen()) {
                      <div class="mt-2 pt-1">
                        <div class="input-group input-group-sm">
                          <input 
                            type="text" 
                            class="form-control text-uppercase font-monospace horizon-input" 
                            placeholder="Ex: HORIZON10-U..." 
                            [value]="couponInput()"
                            (keydown)="preventCouponInvalidKey($event)"
                            (input)="onCouponInput($event)"
                            (paste)="onCouponPaste($event)"
                            (keydown.enter)="applyCoupon()"
                          >
                          <button class="btn btn-horizon-blue fw-semibold px-3" type="button" (click)="applyCoupon()">
                            Aplicar
                          </button>
                        </div>
                        @if (couponError()) {
                          <div class="text-danger small mt-1" style="font-size: 0.78rem;">
                            {{ couponError() }}
                          </div>
                        }
                        @if (couponSuccess()) {
                          <div class="small mt-1 fw-semibold" style="font-size: 0.78rem; color: #65A30D;">
                            {{ couponSuccess() }}
                          </div>
                        }
                      </div>
                    }
                  }
                </div>

                <!-- Valores -->
                <div>
                  <div class="d-flex justify-content-between text-secondary small mb-2">
                    <span>Passageiros ({{ getPassengersCount() }}x)</span>
                    <span class="fw-semibold text-dark">{{ formatCurrency(getRawTotalPrice()) }}</span>
                  </div>
                  @if (appliedDiscountPercent() > 0) {
                    <div class="d-flex justify-content-between small mb-2" style="color: #65A30D;">
                      <span>Desconto Cupom (10%)</span>
                      <span class="fw-bold">- {{ formatCurrency(getDiscountAmount()) }}</span>
                    </div>
                  }
                  <div class="d-flex justify-content-between align-items-center pt-1 mt-2">
                    <span class="fw-bold text-dark">Valor Total</span>
                    <span class="fs-4 fw-bold" style="color: #65A30D;">{{ formatCurrency(getTotalPrice()) }}</span>
                  </div>
                </div>
              </div>

            </aside>
          </div>

        </div>
      }

      <!-- MODAL: Detalhes do Voo e Bagagem -->
      @if (isFlightDetailsModalOpen()) {
        <div class="modal-backdrop fade show" (click)="isFlightDetailsModalOpen.set(false)"></div>
        <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="isFlightDetailsModalOpen.set(false)">
          <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div class="modal-header border-0 px-4 py-3 text-white" style="background-color: #5BA4D8;">
                <h4 class="h6 fw-bold mb-0 text-white">Detalhes do Voo e Bagagem</h4>
                <button type="button" class="btn-close btn-close-white" (click)="isFlightDetailsModalOpen.set(false)" aria-label="Fechar"></button>
              </div>
              <div class="modal-body p-4">
                @if (getOutboundFlight(); as out) {
                  <div class="p-3 rounded-3 bg-light border mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="fw-bold small" style="color: #5BA4D8;">VOO DE IDA • {{ out.flightNumber }}</span>
                      <span class="small fw-semibold text-secondary">Classe {{ out.seatClass || 'Básica' }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center my-2">
                      <div>
                        <div class="fs-5 fw-bold text-dark">{{ out.originAirportCode }}</div>
                        <div class="small text-secondary">{{ out.departureTime }}</div>
                      </div>
                      <div class="text-center text-secondary small">➔</div>
                      <div class="text-end">
                        <div class="fs-5 fw-bold text-dark">{{ out.destinationAirportCode }}</div>
                        <div class="small text-secondary">{{ out.arrivalTime }}</div>
                      </div>
                    </div>
                    <div class="text-secondary small mt-2">
                      Data: <strong>{{ out.flightDate | date:'dd/MM/yyyy' }}</strong>
                    </div>
                  </div>
                }

                @if (getReturnFlight(); as ret) {
                  <div class="p-3 rounded-3 bg-light border mb-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="fw-bold small" style="color: #5BA4D8;">VOO DE VOLTA • {{ ret.flightNumber }}</span>
                      <span class="small fw-semibold text-secondary">Classe {{ ret.seatClass || 'Básica' }}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center my-2">
                      <div>
                        <div class="fs-5 fw-bold text-dark">{{ ret.originAirportCode }}</div>
                        <div class="small text-secondary">{{ ret.departureTime }}</div>
                      </div>
                      <div class="text-center text-secondary small">➔</div>
                      <div class="text-end">
                        <div class="fs-5 fw-bold text-dark">{{ ret.destinationAirportCode }}</div>
                        <div class="small text-secondary">{{ ret.arrivalTime }}</div>
                      </div>
                    </div>
                    <div class="text-secondary small mt-2">
                      Data: <strong>{{ ret.flightDate | date:'dd/MM/yyyy' }}</strong>
                    </div>
                  </div>
                }

                <div class="p-3 rounded-3 bg-light border">
                  <div class="fw-bold text-dark small mb-2" style="color: #65A30D !important;">
                    Bagagem e Taxas Inclusas
                  </div>
                  <div class="text-secondary small">
                    • 1 item pessoal (bolsa ou mochila)<br>
                    • 1 bagagem de mão até 10kg<br>
                    • Taxas de embarque inclusas na tarifa
                  </div>
                </div>
              </div>
              <div class="modal-footer border-0 px-4 pt-0 pb-4">
                <button type="button" class="btn btn-horizon-blue w-100 py-2 rounded-2 fw-bold" (click)="isFlightDetailsModalOpen.set(false)">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      }

    </main>
    </div>

    <!-- Footer -->
    <app-footer></app-footer>
  `,
  styles: [`
    .hero-container {
      width: 100%;
      background: #0b2545;
      height: 320px;
      max-height: 320px;
      overflow: hidden;
    }

    .hero-image {
      width: 100%;
      height: 320px;
      max-height: 320px;
      object-fit: cover;
      object-position: center;
      display: block;
    }

    @media (max-width: 768px) {
      .hero-container {
        max-height: 240px;
      }
      .hero-image {
        height: 240px;
      }
    }

    .checkout-page-bg {
      background-color: #eaf2f8;
      min-height: calc(100vh - 320px);
    }

    .btn-horizon-blue {
      background-color: #5BA4D8;
      color: #ffffff;
      border: 1px solid #5BA4D8;
      transition: all 0.2s ease;
    }

    .btn-horizon-blue:hover:not(:disabled) {
      background-color: #4895CC;
      border-color: #4895CC;
      color: #ffffff;
    }

    .btn-horizon-blue:disabled {
      background-color: #93c5fd;
      border-color: #93c5fd;
      color: #ffffff;
      opacity: 0.7;
    }

    .btn-horizon-outline {
      background-color: transparent;
      color: #5BA4D8;
      border: 1px solid #5BA4D8;
      transition: all 0.2s ease;
    }

    .btn-horizon-outline:hover:not(:disabled) {
      background-color: #5BA4D8;
      color: #ffffff;
      border-color: #5BA4D8;
    }

    .horizon-input:focus {
      border-color: #5BA4D8;
      box-shadow: 0 0 0 0.2rem rgba(91, 164, 216, 0.2);
    }

    .passenger-accordion-item {
      border-color: #dbeafe !important;
      transition: border-color 0.2s ease;
    }

    .passenger-accordion-header {
      background: #f8fafc;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .passenger-accordion-header:hover {
      background: #f0f7fd;
    }

    .passenger-accordion-header.active-header {
      background: #f0f7fd;
    }

    .summary-dest-banner {
      height: 170px;
      width: 100%;
      overflow: hidden;
      background: #0b2545;
    }

    .summary-dest-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(11, 37, 69, 0.75) 0%, rgba(11, 37, 69, 0.15) 60%, transparent 100%);
    }

    .summary-dest-title {
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
      letter-spacing: -0.2px;
    }

    .checkout-stepper {
      background: #ffffff;
      border: 1px solid #dbeafe;
      border-radius: 12px;
      padding: 12px 24px;
      box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
    }

    .stepper-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .stepper-step {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
      color: #64748b;
    }

    .stepper-step.active {
      color: #5BA4D8;
      font-weight: 700;
    }

    .stepper-step.completed {
      color: #65A30D;
      font-weight: 600;
    }

    .step-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.82rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .stepper-step.active .step-badge {
      background: #5BA4D8;
      color: #ffffff;
    }

    .stepper-step.completed .step-badge {
      background: #65A30D;
      color: #ffffff;
    }

    .step-title {
      font-weight: 600;
      font-size: 0.92rem;
      line-height: 1.2;
    }

    @media (max-width: 768px) {
      .checkout-stepper {
        padding: 8px 12px;
      }
      .stepper-step {
        padding: 6px 8px;
      }
    }

    .policy-notice {
      border-left: 3px solid #5BA4D8 !important;
    }

    .passenger-index {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      background: #5BA4D8;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .passenger-card {
      transition: all 0.2s ease;
    }

    .passenger-card:hover {
      border-color: #cbd5e1 !important;
    }

    .payment-option-card {
      background: #ffffff;
      transition: all 0.2s ease;
    }

    .payment-option-card:hover {
      border-color: #5BA4D8 !important;
      background: #f8fafc;
    }

    .payment-option-card.selected {
      border-color: #5BA4D8 !important;
      background: #f0f7ff;
    }

    .payment-radio {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .payment-radio.checked {
      border-color: #5BA4D8;
    }

    .radio-inner {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: transparent;
      transition: all 0.2s ease;
    }

    .payment-radio.checked .radio-inner {
      background: #5BA4D8;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    .virtual-card {
      width: 100%;
      max-width: 360px;
      min-height: 190px;
      background: linear-gradient(135deg, #0b2545 0%, #1e3a5f 50%, #5BA4D8 100%);
      border: 1px solid rgba(255,255,255,0.15);
    }

    .font-size-10 {
      font-size: 10px;
    }

    .tracking-widest {
      letter-spacing: 3px;
    }

    .tracking-wider {
      letter-spacing: 1.5px;
    }

    .max-w-500 {
      max-width: 500px;
    }

    .flight-itinerary-card {
      transition: all 0.2s ease;
    }

    .flight-route-line {
      min-width: 70px;
    }

    .route-line {
      height: 1.5px;
      background: #cbd5e1;
      width: 100%;
      margin: 4px 0;
    }

    .route-plane {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #64748b;
      font-size: 0.7rem;
      background: #f8f9fa;
      padding: 0 4px;
    }

    .boarding-pass-card {
      border-left: 4px solid #5BA4D8 !important;
    }

    .ticket-3d-wrapper {
      perspective: 1000px;
      display: flex;
      justify-content: center;
      padding: 0.25rem 0;
    }
  `]
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);
  private paymentService = inject(PaymentService);
  private tokenStorage = inject(TokenStorageService);

  draft = signal<CheckoutDraft | null>(null);
  currentReservation = signal<ReservationResponse | null>(null);
  selectedMethod = signal<PaymentMethod>('PIX');

  // Estados de UI Clean (Dropdowns / Modal)
  expandedPassengerIndex = signal<number>(0);
  isCouponDropdownOpen = signal<boolean>(false);
  isFlightDetailsModalOpen = signal<boolean>(false);

  // Cupom de Desconto das Missões
  couponInput = signal('');
  appliedDiscountPercent = signal(0);
  appliedCouponCode = signal<string | null>(null);
  couponError = signal<string | null>(null);
  couponSuccess = signal<string | null>(null);

  isLoading = signal(true);
  isProcessing = signal(false);
  isCancelled = signal(false);
  loadingMessage = signal('Carregando informações da reserva...');
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // PIX Code
  readonly pixCode = '00020126580014br.gov.bcb.pix0136horizon-travel-payments-pix-key520400005303986540500.005802BR5925HORIZON VIAGENS LTDA6009SAO PAULO62070503***6304E2D1';
  isPixCopied = signal(false);

  // Cartão Form Fields
  cardHolderName = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  installments = '1';

  passengersMinorError = signal<string | null>(null);

  passengersForm = this.fb.group({
    passengers: this.fb.array<PassengerRequest>([])
  });

  currentStep = computed(() => {
    if (this.currentReservation()?.status === 'CONFIRMADA' || this.currentReservation()?.status === 'CONCLUIDA') {
      return 3;
    }
    if (this.currentReservation()?.status === 'PENDENTE') {
      return 2;
    }
    return 1;
  });

  currentStepPercentage = computed(() => {
    const s = this.currentStep();
    if (s === 1) return '0%';
    if (s === 2) return '50%';
    return '100%';
  });

  get passengersArray(): FormArray {
    return this.passengersForm.get('passengers') as FormArray;
  }

  ngOnInit(): void {
    const uid = this.tokenStorage.getUserId();
    if (uid && typeof localStorage !== 'undefined') {
      const savedCoupon = localStorage.getItem(`horizonCoupon_${uid}`);
      if (savedCoupon) {
        try {
          const parsed = JSON.parse(savedCoupon);
          if (parsed?.used) {
            this.couponInput.set('');
          } else if (parsed?.unlocked && parsed?.code) {
            this.couponInput.set(parsed.code);
          }
        } catch {}
      }
    }

    this.route.queryParams.subscribe(params => {
      const resId = params['reservationId'];
      if (resId) {
        this.loadExistingReservation(Number(resId));
      } else {
        this.loadDraftFromService();
      }
    });
  }

  private loadDraftFromService(): void {
    const draft = this.reservationService.checkoutDraft();
    if (draft) {
      if (!draft.destinationId && (draft.outboundFlight as any)?.destinationId) {
        draft.destinationId = Number((draft.outboundFlight as any).destinationId);
      }
      if (!draft.tripType) {
        draft.tripType = draft.returnFlight ? 'ROUND_TRIP' : 'ONE_WAY';
      }
      if (!draft.estimatedTotal && (draft as any).totalPrice) {
        draft.estimatedTotal = Number((draft as any).totalPrice);
      }
      this.draft.set(draft);
      this.initPassengersForm(draft.passengersCount || 1);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(false);
    }
  }

  private loadExistingReservation(id: number): void {
    this.isLoading.set(true);
    this.loadingMessage.set('Buscando dados da reserva...');
    
    this.reservationService.getReservationById(id).subscribe({
      next: (res) => {
        this.currentReservation.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Não foi possível carregar a reserva solicitada.');
      }
    });
  }

  private initPassengersForm(count: number): void {
    this.passengersArray.clear();
    for (let i = 0; i < count; i++) {
      this.passengersArray.push(
        this.fb.group({
          name: ['', [
            Validators.required, 
            Validators.minLength(3), 
            Validators.maxLength(100),
            Validators.pattern(/^[a-zA-ZÀ-ÖØ-öø-ÿ]+(?:\s+[a-zA-ZÀ-ÖØ-öø-ÿ]+)*$/)
          ]],
          age: [null, [
            Validators.required, 
            Validators.min(1), 
            Validators.max(120), 
            Validators.pattern(/^\d+$/)
          ]]
        })
      );
    }

    // Monitora alterações para validar a regra de menores desacompanhados em tempo real
    this.passengersForm.valueChanges.subscribe(() => {
      this.validateMinorsRule();
    });
  }

  preventNonAlpha(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    // Permite estritamente apenas letras (com acentos) e espaço. Bloqueia qualquer número ou caractere especial
    if (!/^[\p{L}\s]$/u.test(event.key)) {
      event.preventDefault();
    }
  }

  onNameInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    // Remove qualquer caractere que não seja letra ou espaço (elimina números e caracteres especiais)
    let clean = input.value.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    if (input.value !== clean) {
      input.value = clean;
    }
    const ctrl = this.passengersArray.at(index).get('name');
    if (ctrl && ctrl.value !== clean) {
      ctrl.setValue(clean, { emitEvent: true });
    }
  }

  onNamePaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = text.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const current = input.value;
    const updated = (current.slice(0, start) + clean + current.slice(end)).replace(/\s{2,}/g, ' ');
    input.value = updated;
    const ctrl = this.passengersArray.at(index).get('name');
    if (ctrl) {
      ctrl.setValue(updated, { emitEvent: true });
      ctrl.markAsDirty();
    }
  }

  preventNonNumeric(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    // Bloqueia qualquer caractere que não seja dígito (0 a 9)
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onAgeInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    if (input.value !== value) {
      input.value = value;
    }
    
    // Atualiza o form control garantindo que é um número (ou null se vazio)
    const ctrl = this.passengersArray.at(index).get('age');
    if (ctrl) {
      ctrl.setValue(value ? parseInt(value, 10) : null, { emitEvent: true });
    }
  }

  onAgePaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 3);
    const input = event.target as HTMLInputElement;
    input.value = digits;
    const ctrl = this.passengersArray.at(index).get('age');
    if (ctrl) {
      ctrl.setValue(digits ? parseInt(digits, 10) : null, { emitEvent: true });
      ctrl.markAsDirty();
    }
  }

  onCardHolderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ').toUpperCase();
    input.value = clean;
    this.cardHolderName = clean;
  }

  onCardHolderPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = text.replace(/[^\p{L}\s]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ').toUpperCase();
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.cardHolderName = clean;
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = formatted;
    this.cardNumber = formatted;
  }

  onCardNumberPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    const input = event.target as HTMLInputElement;
    input.value = formatted;
    this.cardNumber = formatted;
  }

  onCardExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      digits = digits.slice(0, 2) + '/' + digits.slice(2);
    }
    input.value = digits;
    this.cardExpiry = digits;
  }

  onCardExpiryPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    let digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      digits = digits.slice(0, 2) + '/' + digits.slice(2);
    }
    const input = event.target as HTMLInputElement;
    input.value = digits;
    this.cardExpiry = digits;
  }

  onCardCvvInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = digits;
    this.cardCvv = digits;
  }

  onCardCvvPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 4);
    const input = event.target as HTMLInputElement;
    input.value = digits;
    this.cardCvv = digits;
  }

  preventCouponInvalidKey(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End', 'Enter'];
    if (allowedKeys.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^[a-zA-Z0-9-]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onCouponInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const clean = input.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    input.value = clean;
    this.couponInput.set(clean);
  }

  onCouponPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    const clean = text.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    const input = event.target as HTMLInputElement;
    input.value = clean;
    this.couponInput.set(clean);
  }

  validateMinorsRule(): void {
    const values = this.passengersArray?.value || [];
    if (!values.length) {
      this.passengersMinorError.set(null);
      return;
    }

    const validAges = values
      .map((v: any) => (v.age !== null && v.age !== '' && !isNaN(Number(v.age))) ? Number(v.age) : null)
      .filter((a: any) => a !== null) as number[];

    // 1 Passageiro apenas: Não pode ser menor de 18
    if (values.length === 1) {
      if (validAges.length === 1 && validAges[0] < 18) {
        this.passengersMinorError.set('Menores de 18 anos não podem viajar desacompanhados de um adulto responsável.');
        return;
      }
    } else {
      // 2 ou mais passageiros: Se todas as idades foram preenchidas, ao menos 1 deve ser >= 18
      if (validAges.length === values.length) {
        const hasAdult = validAges.some(age => age >= 18);
        if (!hasAdult) {
          this.passengersMinorError.set('A reserva deve conter ao menos um adulto responsável (maior de 18 anos) para acompanhar os menores.');
          return;
        }
      }
    }

    this.passengersMinorError.set(null);
  }

  onCreateReservationFromDraft(): void {
    if (this.passengersForm.invalid) {
      this.passengersForm.markAllAsTouched();
      const firstInvalid = this.passengersArray.controls.findIndex(c => c.invalid);
      if (firstInvalid !== -1) {
        this.expandedPassengerIndex.set(firstInvalid);
      }
      return;
    }

    const draft = this.draft();
    if (!draft) return;

    const passengers: PassengerRequest[] = this.passengersArray.value.map((p: any) => ({
      name: p.name.trim(),
      age: Number(p.age)
    }));

    // Validação estrita de menor desacompanhado
    if (passengers.length === 1 && passengers[0].age < 18) {
      this.errorMessage.set('Menores de 18 anos não podem viajar desacompanhados de um adulto responsável.');
      return;
    }

    const hasAdult = passengers.some(p => p.age >= 18);
    if (!hasAdult) {
      this.errorMessage.set('A reserva deve conter ao menos um adulto responsável (maior de 18 anos) para acompanhar os menores de idade.');
      return;
    }

    const destinationId = draft.destinationId || (draft.outboundFlight as any)?.destinationId;
    if (!destinationId) {
      this.errorMessage.set('Identificador do destino não encontrado. Por favor, volte e selecione o voo novamente.');
      return;
    }

    const tripType = draft.tripType || (draft.returnFlight ? 'ROUND_TRIP' : 'ONE_WAY');

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    const request: ReservationRequest = {
      destinationId: Number(destinationId),
      tripType: tripType,
      outboundFlightId: Number(draft.outboundFlight.id),
      returnFlightId: draft.returnFlight ? Number(draft.returnFlight.id) : null,
      passengers: passengers
    };

    this.reservationService.createReservation(request).subscribe({
      next: (created) => {
        this.currentReservation.set(created);
        this.reservationService.clearCheckoutDraft();
        this.draft.set(null);
        this.isProcessing.set(false);
        this.successMessage.set(null);
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(err.message || 'Erro ao gerar reserva no backend.');
      }
    });
  }

  onConfirmPaymentNow(): void {
    const res = this.currentReservation();
    if (!res) return;

    this.isProcessing.set(true);
    this.errorMessage.set(null);

    this.paymentService.confirmPayment(res.reservationId, this.selectedMethod()).subscribe({
      next: () => {
        const uid = this.tokenStorage.getUserId();
        if (this.appliedCouponCode() && uid && typeof localStorage !== 'undefined') {
          const savedCoupon = localStorage.getItem(`horizonCoupon_${uid}`);
          if (savedCoupon) {
            try {
              const parsed = JSON.parse(savedCoupon);
              parsed.used = true;
              parsed.usedAt = Date.now();
              parsed.usedReservationId = res.reservationId;
              localStorage.setItem(`horizonCoupon_${uid}`, JSON.stringify(parsed));
            } catch {}
          }
        }
        this.reservationService.getReservationById(res.reservationId).subscribe({
          next: (updated) => {
            this.currentReservation.set(updated);
            this.isProcessing.set(false);
            this.successMessage.set(null);
          },
          error: () => {
            this.isProcessing.set(false);
            this.router.navigate(['/profile']);
          }
        });
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(err.message || 'Falha ao confirmar pagamento com o backend.');
      }
    });
  }

  copyPixCode(): void {
    navigator.clipboard.writeText(this.pixCode).then(() => {
      this.isPixCopied.set(true);
      setTimeout(() => this.isPixCopied.set(false), 3000);
    });
  }

  formatCardNumberPreview(num: string): string {
    if (!num) return '•••• •••• •••• 4242';
    const cleaned = num.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : num;
  }

  onPayLater(): void {
    alert('Sua reserva permanece guardada como PENDENTE. Você poderá pagá-la a qualquer momento na sua Área do Usuário.');
    this.router.navigate(['/profile'], { queryParams: { tab: 'trips' } });
  }

  onCancelReservation(): void {
    const res = this.currentReservation();
    if (!res) return;

    if (!confirm('Deseja realmente cancelar esta reserva e liberar os assentos?')) return;

    this.isProcessing.set(true);
    this.reservationService.cancelReservation(res.reservationId).subscribe({
      next: () => {
        this.isProcessing.set(false);
        this.isCancelled.set(true);
      },
      error: (err) => {
        this.isProcessing.set(false);
        this.errorMessage.set(err.message || 'Falha ao cancelar reserva.');
      }
    });
  }

  downloadTicket(ticketNumber: string): void {
    this.reservationService.downloadTicketPdf(ticketNumber).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bilhete_${ticketNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage.set('Falha ao baixar o bilhete em PDF.');
      }
    });
  }

  downloadAllTickets(): void {
    const tickets = this.currentReservation()?.tickets;
    if (!tickets || tickets.length === 0) return;
    tickets.forEach((t) => this.downloadTicket(t.ticketNumber));
  }

  togglePassenger(index: number): void {
    this.expandedPassengerIndex.set(this.expandedPassengerIndex() === index ? -1 : index);
  }

  getDestinationName(): string {
    return this.currentReservation()?.destinationName || 
      this.draft()?.destinationName || 
      (this.draft()?.outboundFlight?.destinationAirportCode ? `Destino (${this.draft()?.outboundFlight?.destinationAirportCode})` : 'Destino Selecionado');
  }

  getDestinationImageUrl(): string {
    const raw = this.getDestinationName();
    const cityOnly = raw.split(/[,\(]/)[0].trim();
    return findLocalImage(cityOnly, raw) || 'assets/paymentt.webp';
  }

  onDestinationImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/paymentt.webp';
  }

  getOutboundFlight(): any {
    return this.currentReservation()?.outboundFlight || this.draft()?.outboundFlight;
  }

  getReturnFlight(): any {
    return this.currentReservation()?.returnFlight || this.draft()?.returnFlight;
  }

  getPassengersCount(): number {
    return this.currentReservation()?.passengers?.length || this.draft()?.passengersCount || 1;
  }

  getTripType(): string {
    return this.currentReservation()?.tripType || this.draft()?.tripType || (this.draft()?.returnFlight ? 'ROUND_TRIP' : 'ONE_WAY');
  }

  getRawTotalPrice(): number {
    return this.currentReservation()?.totalAmount || 
      this.draft()?.estimatedTotal || 
      (this.draft() as any)?.totalPrice || 
      0;
  }

  getDiscountAmount(): number {
    if (!this.appliedDiscountPercent()) return 0;
    return (this.getRawTotalPrice() * this.appliedDiscountPercent()) / 100;
  }

  getTotalPrice(): number {
    return Math.max(0, this.getRawTotalPrice() - this.getDiscountAmount());
  }

  applyCoupon(): void {
    this.couponError.set(null);
    this.couponSuccess.set(null);
    const code = this.couponInput().trim().toUpperCase();
    if (!code) {
      this.couponError.set('Informe um código de cupom.');
      return;
    }

    const uid = this.tokenStorage.getUserId();
    if (!uid) {
      this.couponError.set('Faça login para utilizar o seu cupom.');
      return;
    }

    const expectedCode = `HORIZON10-U${uid}`;
    if (code !== expectedCode) {
      if (code.startsWith('HORIZON10-U')) {
        this.couponError.set('Este cupom pertence a outro usuário e não pode ser utilizado nesta conta.');
      } else {
        this.couponError.set('Cupom inválido. Cumpra as missões no Feed para liberar seu cupom de 10% OFF.');
      }
      return;
    }

    // Verificar se o cupom foi liberado pelas missões do Feed
    if (typeof localStorage !== 'undefined') {
      const savedCoupon = localStorage.getItem(`horizonCoupon_${uid}`);
      if (!savedCoupon) {
        this.couponError.set('Cupom ainda não desbloqueado! Complete as 3 missões no Feed para ativá-lo.');
        return;
      }
      try {
        const parsed = JSON.parse(savedCoupon);
        if (parsed.used) {
          this.couponError.set('Este cupom já foi utilizado em outra viagem. Cada viajante pode usá-lo apenas uma única vez.');
          return;
        }
        if (!parsed.unlocked) {
          this.couponError.set('Você ainda não completou todas as missões para liberar este cupom.');
          return;
        }
      } catch {
        this.couponError.set('Erro ao validar cupom.');
        return;
      }
    }

    this.appliedDiscountPercent.set(10);
    this.appliedCouponCode.set(code);
    this.couponSuccess.set('Cupom de 10% OFF aplicado com sucesso!');
  }

  removeCoupon(): void {
    this.appliedDiscountPercent.set(0);
    this.appliedCouponCode.set(null);
    this.couponSuccess.set(null);
    this.couponError.set(null);
  }

  formatCurrency(value?: number | null): string {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  formatDateTime(isoDate?: string | null): string {
    if (!isoDate) return '-';
    try {
      return new Date(isoDate).toLocaleString('pt-BR');
    } catch {
      return isoDate;
    }
  }
}

