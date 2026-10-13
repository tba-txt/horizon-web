import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { FlightsService } from '../services/flights.service';
import { DestinationsService } from '../../destinations/services/destinations.service';
import { Flight, FlightSearchParams, FlightSeatClass, SelectedFlightBooking } from '../models/flight.model';
import { Destination } from '../../destinations/models/destination.model';
import { ReservationService } from '../../../core/reservations/services/reservation.service';
import { CheckoutDraft, TripType, SeatClass } from '../../../core/reservations/models/reservation.model';

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isAvailable: boolean;
  isSelected: boolean;
}

import { PlaneLoaderComponent } from '../../../shared/components/plane-loader/plane-loader.component';

@Component({
  selector: 'app-flight-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent, PlaneLoaderComponent, DatePipe],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/viagem.webp" 
        alt="Consulta de Voos Hero" 
        class="w-100 hero-image"
        (error)="handleHeroError($event)"
      />
    </header>

    <main class="container py-5">
      
      <!-- Header da Pagina -->
      <div class="mb-4">
        <h1 class="h2 fw-bold text-dark mb-1">Consulta de Voos</h1>
      </div>

      <!-- Card do Filtro / Busca -->
      <div class="card border shadow-sm rounded-4 p-4 mb-5 bg-white search-card-container">
        <form (ngSubmit)="onSearch()" class="row g-3 align-items-end">
          
          <!-- Origem -->
          <div class="col-12 col-md-2">
            <label class="form-label small fw-semibold text-secondary">
              Origem
            </label>
            <input 
              type="text" 
              class="form-control bg-light"
              value="São Paulo (SAO)"
              disabled
            />
          </div>

          <!-- Destino -->
          <div class="col-12 col-md-2">
            <label for="destinationSelect" class="form-label small fw-semibold text-secondary">
              Destino *
            </label>
            <div class="destination-picker">
              <button id="destinationSelect" type="button" class="destination-picker-trigger" [class.destination-picker-open]="isDestinationDropdownOpen()" (click)="toggleDestinationDropdown($event)" [attr.aria-expanded]="isDestinationDropdownOpen()" aria-haspopup="listbox">
                <span [class.text-muted]="!selectedDestination()">{{ selectedDestinationLabel() }}</span>
                <span class="destination-picker-caret" aria-hidden="true"></span>
              </button>
              @if (isDestinationDropdownOpen()) {
                <div class="destination-picker-menu" role="listbox" aria-label="Selecione um destino" (click)="$event.stopPropagation()">
                  <div class="destination-group-label destination-group-label-common">Itinerário Comum</div>
                  <div class="destination-group-options">
                    @for (dest of commonDestinations(); track dest.id) {
                      <button type="button" role="option" class="destination-option" [attr.aria-selected]="selectedDestinationId() === dest.id" [class.destination-option-selected]="selectedDestinationId() === dest.id" (click)="selectDestination(dest, $event)">{{ formatDestinationOption(dest) }}</button>
                    }
                  </div>
                  <div class="destination-group-label destination-group-label-eco">Ecoturismo</div>
                  <div class="destination-group-options">
                    @for (dest of ecotourismDestinations(); track dest.id) {
                      <button type="button" role="option" class="destination-option" [attr.aria-selected]="selectedDestinationId() === dest.id" [class.destination-option-selected]="selectedDestinationId() === dest.id" (click)="selectDestination(dest, $event)">{{ formatDestinationOption(dest) }}</button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Data de Ida -->
          <div class="col-12 col-sm-6 col-md-2 position-relative calendar-popover-container">
            <label class="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center mb-1">
              <span>Data de Ida *</span>
              @if (isLoadingFlightDates()) {
                <span class="spinner-border spinner-border-sm text-primary" role="status" style="width: 12px; height: 12px;"></span>
              }
            </label>
            <button 
              type="button" 
              class="form-control text-start d-flex justify-content-between align-items-center bg-white shadow-none"
              [class.border-primary]="isOutboundCalendarOpen()"
              [class.bg-light]="!selectedDestinationId() || isLoadingFlightDates()"
              [disabled]="!selectedDestinationId() || isLoadingFlightDates()"
              (click)="toggleOutboundCalendar($event)"
              style="height: 38px;"
            >
              <span class="small text-truncate" [class.text-dark]="startDate()" [class.text-muted]="!startDate()">
                @if (!selectedDestinationId()) {
                  <span class="text-secondary opacity-75">1º Escolha o destino</span>
                } @else if (isLoadingFlightDates()) {
                  <span>Buscando datas...</span>
                } @else if (startDate()) {
                  <span class="fw-semibold text-dark">{{ formatDisplayDate(startDate()) }}</span>
                } @else {
                  <span>Selecione a data</span>
                }
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary flex-shrink-0 ms-1">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>

            <!-- Popover Ida -->
            @if (isOutboundCalendarOpen()) {
              <div class="calendar-dropdown" (click)="$event.stopPropagation()">
                
                <!-- Popover Header -->
                <div class="calendar-header">
                  <button 
                    type="button" 
                    class="calendar-nav-btn" 
                    [disabled]="!canPrevMonth('outbound')"
                    (click)="prevMonth('outbound', $event)"
                    title="Mês anterior"
                  >
                    ‹
                  </button>
                  <span class="calendar-title text-capitalize">
                    {{ getMonthYearLabel(calendarMonth()) }}
                  </span>
                  <button 
                    type="button" 
                    class="calendar-nav-btn" 
                    (click)="nextMonth('outbound', $event)"
                    title="Próximo mês"
                  >
                    ›
                  </button>
                </div>

                <!-- Legenda -->
                <div class="calendar-legend">
                  <span class="d-flex align-items-center gap-1">
                    <span class="legend-dot" style="background-color: #198754;"></span>
                    <span class="text-success fw-semibold">Disponível</span>
                  </span>
                  <span class="d-flex align-items-center gap-1">
                    <span class="legend-dot" style="background-color: #dc3545;"></span>
                    <span class="text-danger fw-semibold">Indisponível</span>
                  </span>
                </div>

                <!-- Dias da Semana -->
                <div class="calendar-weekdays">
                  <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                </div>

                <!-- Grade de Dias -->
                <div class="calendar-grid">
                  @for (day of calendarDaysOutbound(); track $index) {
                    @if (day) {
                      <button 
                        type="button"
                        class="calendar-day-cell"
                        [class.calendar-day-available]="day.isAvailable"
                        [class.calendar-day-unavailable]="!day.isAvailable"
                        [class.calendar-day-selected]="day.isSelected"
                        [disabled]="!day.isAvailable"
                        (click)="selectOutboundDate(day, $event)"
                        [title]="day.isAvailable ? 'Voo de ida disponível (' + day.dateStr + ')' : 'Sem voo de ida nesta data'"
                      >
                        <span>{{ day.dayNumber }}</span>
                        @if (day.isAvailable) {
                          <span class="flight-dot"></span>
                        }
                      </button>
                    } @else {
                      <div class="calendar-day-cell calendar-day-empty"></div>
                    }
                  }
                </div>

                <!-- Footer do Popover -->
                <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                  <span class="text-muted" style="font-size: 0.7rem;">Datas verdes têm voos</span>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-secondary py-0 px-2" 
                    style="font-size: 0.72rem;"
                    (click)="closeCalendars($event)"
                  >
                    Fechar
                  </button>
                </div>

              </div>
            }
          </div>

          <!-- Data de Volta -->
          <div class="col-12 col-sm-6 col-md-2 position-relative calendar-popover-container">
            <label class="form-label small fw-semibold text-secondary d-flex justify-content-between align-items-center mb-1">
              <span>Data de Volta</span>
              @if (endDate()) {
                <span 
                  class="text-danger small" 
                  style="cursor: pointer; font-size: 0.72rem;"
                  (click)="clearReturnDate($event)"
                  title="Remover volta (Somente ida)"
                >
                  ✕ Limpar
                </span>
              }
            </label>
            <button 
              type="button" 
              class="form-control text-start d-flex justify-content-between align-items-center bg-white shadow-none"
              [class.border-primary]="isReturnCalendarOpen()"
              [class.bg-light]="!startDate()"
              [disabled]="!startDate()"
              (click)="toggleReturnCalendar($event)"
              style="height: 38px;"
            >
              <span class="small text-truncate" [class.text-dark]="endDate()" [class.text-muted]="!endDate()">
                @if (!startDate()) {
                  <span class="text-secondary opacity-75">2º Escolha a ida</span>
                } @else if (endDate()) {
                  <span class="fw-semibold text-dark">{{ formatDisplayDate(endDate()) }}</span>
                } @else {
                  <span>Opcional (Somente ida)</span>
                }
              </span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary flex-shrink-0 ms-1">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </button>

            <!-- Popover Volta -->
            @if (isReturnCalendarOpen()) {
              <div class="calendar-dropdown" (click)="$event.stopPropagation()">
                
                <!-- Popover Header -->
                <div class="calendar-header">
                  <button 
                    type="button" 
                    class="calendar-nav-btn" 
                    [disabled]="!canPrevMonth('return')"
                    (click)="prevMonth('return', $event)"
                    title="Mês anterior"
                  >
                    ‹
                  </button>
                  <span class="calendar-title text-capitalize">
                    {{ getMonthYearLabel(returnCalendarMonth()) }}
                  </span>
                  <button 
                    type="button" 
                    class="calendar-nav-btn" 
                    (click)="nextMonth('return', $event)"
                    title="Próximo mês"
                  >
                    ›
                  </button>
                </div>

                <!-- Legenda -->
                <div class="calendar-legend">
                  <span class="d-flex align-items-center gap-1">
                    <span class="legend-dot" style="background-color: #198754;"></span>
                    <span class="text-success fw-semibold">Disponível</span>
                  </span>
                  <span class="d-flex align-items-center gap-1">
                    <span class="legend-dot" style="background-color: #dc3545;"></span>
                    <span class="text-danger fw-semibold">Indisponível</span>
                  </span>
                </div>

                <!-- Dias da Semana -->
                <div class="calendar-weekdays">
                  <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
                </div>

                <!-- Grade de Dias -->
                <div class="calendar-grid">
                  @for (day of calendarDaysReturn(); track $index) {
                    @if (day) {
                      <button 
                        type="button"
                        class="calendar-day-cell"
                        [class.calendar-day-available]="day.isAvailable"
                        [class.calendar-day-unavailable]="!day.isAvailable"
                        [class.calendar-day-selected]="day.isSelected"
                        [disabled]="!day.isAvailable"
                        (click)="selectReturnDate(day, $event)"
                        [title]="day.isAvailable ? 'Voo de retorno disponível (' + day.dateStr + ')' : 'Sem voo de retorno nesta data'"
                      >
                        <span>{{ day.dayNumber }}</span>
                        @if (day.isAvailable) {
                          <span class="flight-dot"></span>
                        }
                      </button>
                    } @else {
                      <div class="calendar-day-cell calendar-day-empty"></div>
                    }
                  }
                </div>

                <!-- Footer do Popover -->
                <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top">
                  <button 
                    type="button" 
                    class="btn btn-link btn-sm text-danger text-decoration-none p-0" 
                    style="font-size: 0.72rem;"
                    (click)="clearReturnDate($event)"
                  >
                    Somente ida (Sem volta)
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-sm btn-outline-secondary py-0 px-2" 
                    style="font-size: 0.72rem;"
                    (click)="closeCalendars($event)"
                  >
                    Fechar
                  </button>
                </div>

              </div>
            }
          </div>

          <!-- Passageiros -->
          <div class="col-12 col-sm-6 col-md-2">
            <label for="passengers" class="form-label small fw-semibold text-secondary">
              Passageiros
            </label>
            <select 
              id="passengers" 
              class="form-select"
              [ngModel]="passengers()" 
              (ngModelChange)="passengers.set($event)"
              name="passengers"
            >
              <option [ngValue]="1">1 adulto</option>
              <option [ngValue]="2">2 adultos</option>
              <option [ngValue]="3">3 adultos</option>
              <option [ngValue]="4">4 adultos</option>
              <option [ngValue]="5">5 adultos</option>
            </select>
          </div>

          <!-- Botão de Busca -->
          <div class="col-12 col-md-2">
            <button 
              type="submit" 
              [disabled]="!isValidToSearch() || isLoading()"
              class="btn text-white w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
              style="background-color: #4895CC;"
            >
              @if (isLoading()) {
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              } @else {
                <span>Buscar</span>
              }
            </button>
          </div>

        </form>
      </div>

      <!-- Resumo dos Voos Selecionados -->
      @if (selectedOutbound() || selectedReturn()) {
        <div class="card border-0 bg-light rounded-4 p-4 mb-5 shadow-sm">
          <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <h5 class="fw-bold text-dark mb-0">Resumo da Seleção</h5>
            <button class="btn btn-outline-danger btn-sm px-3" (click)="clearSelection()">
              Limpar Seleção
            </button>
          </div>
          
          <div class="row g-3 mb-3">
            @if (selectedOutbound()) {
              <div class="col-12 col-md-6">
                <div class="p-3 bg-white border rounded-3 h-100">
                  <div class="text-uppercase small fw-bold mb-2" style="color: #4895CC;">Voo de Ida</div>
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <div class="fw-bold fs-5 text-dark mb-1">
                        {{ selectedOutbound()!.flight.originAirportCode }} ➔ {{ selectedOutbound()!.flight.destinationAirportCode }}
                      </div>
                      <div class="text-secondary small">
                        {{ selectedOutbound()!.flight.flightDate | date:'dd/MM/yyyy' }} às {{ selectedOutbound()!.flight.departureTime }}
                      </div>
                      <div class="text-secondary small">
                        Voo {{ selectedOutbound()!.flight.flightNumber }}
                      </div>
                    </div>
                    <div class="text-end">
                      <div class="fw-semibold small mb-1" style="color: #4895CC;">
                        Classe {{ getClassName(selectedOutbound()!.seatClass) }}
                      </div>
                      <div class="fw-bold text-dark">
                        {{ formatPrice(selectedOutbound()!.price) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (selectedReturn()) {
              <div class="col-12 col-md-6">
                <div class="p-3 bg-white border rounded-3 h-100">
                  <div class="text-uppercase small fw-bold mb-2" style="color: #4895CC;">Voo de Volta</div>
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <div class="fw-bold fs-5 text-dark mb-1">
                        {{ selectedReturn()!.flight.originAirportCode }} ➔ {{ selectedReturn()!.flight.destinationAirportCode }}
                      </div>
                      <div class="text-secondary small">
                        {{ selectedReturn()!.flight.flightDate | date:'dd/MM/yyyy' }} às {{ selectedReturn()!.flight.departureTime }}
                      </div>
                      <div class="text-secondary small">
                        Voo {{ selectedReturn()!.flight.flightNumber }}
                      </div>
                    </div>
                    <div class="text-end">
                      <div class="fw-semibold small mb-1" style="color: #4895CC;">
                        Classe {{ getClassName(selectedReturn()!.seatClass) }}
                      </div>
                      <div class="fw-bold text-dark">
                        {{ formatPrice(selectedReturn()!.price) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="d-flex justify-content-between align-items-center pt-3 border-top mt-3">
            <div>
              <span class="text-secondary small d-block">{{ selectionTotalLabel() }}</span>
              <span class="fs-4 fw-bold text-dark">{{ formatTotalPrice() }}</span>
            </div>
            <button class="btn btn-primary px-4 py-2 fw-semibold" (click)="proceedToCheckout()">
              Prosseguir para Reserva
            </button>
          </div>
        </div>
      }

      <!-- Estado: Loading -->
      @if (isLoading()) {
        <div class="py-5">
          <app-plane-loader></app-plane-loader>
        </div>
      }

      <!-- Estado: Erro -->
      @else if (errorMessage()) {
        <div class="alert alert-danger p-4 rounded-3 text-center" role="alert">
          <p class="mb-3">{{ errorMessage() }}</p>
          <button class="btn btn-outline-danger px-4" (click)="onSearch()">
            Tentar novamente
          </button>
        </div>
      }

      <!-- Estado: Não pesquisou ainda -->
      @else if (!hasSearched()) {
        <div class="text-center py-5 bg-light rounded-4 border">
          <h4 class="fw-bold text-secondary mb-1">Selecione um destino e data de ida para pesquisar</h4>
        </div>
      }

      <!-- Estado: Lista Vazia -->
      @else if (outboundFlights().length === 0 && returnFlights().length === 0) {
        <div class="text-center py-5 bg-light rounded-4 border">
          <h4 class="fw-bold text-secondary mb-2">Nenhum voo disponível para os critérios selecionados</h4>
          <p class="text-muted mb-0">Tente selecionar outro período ou outro destino.</p>
        </div>
      }

      <!-- Estado: Voos Encontrados -->
      @else {
        
        <!-- SEÇÃO: VOOS DE IDA -->
        <section class="mb-5">
          <h3 class="h5 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <span>Voos de Ida</span>
            <span class="text-secondary fs-6 ms-1">({{ outboundFlights().length }})</span>
          </h3>

          @if (outboundFlights().length === 0) {
            <div class="p-3 bg-light rounded-3 text-muted small">
              Nenhum voo de ida encontrado na data selecionada.
            </div>
          } @else {
            <div class="d-flex flex-column gap-3">
              @for (flight of outboundFlights(); track flight.id) {
                <div 
                  class="card border shadow-sm rounded-4 p-4 flight-card bg-white"
                  [class.flight-selected]="isFlightSelected(flight.id, 'outbound')"
                >
                  <div class="row align-items-center g-3">
                    
                    <div class="col-12 col-md-3">
                      <div class="text-secondary fw-bold small mb-1">
                        {{ flight.flightNumber }}
                      </div>
                      <div class="d-flex align-items-center gap-2 mt-1">
                        <span class="fs-5 fw-bold text-dark">{{ flight.originAirportCode }}</span>
                        <span class="text-muted">➔</span>
                        <span class="fs-5 fw-bold text-primary">{{ flight.destinationAirportCode }}</span>
                      </div>
                    </div>

                    <div class="col-12 col-sm-6 col-md-2">
                      <span class="text-muted small d-block">Data e Horário</span>
                      <span class="fw-bold text-dark d-block">
                        {{ flight.flightDate | date:'dd/MM/yyyy' }}
                      </span>
                      <span class="small text-secondary">
                        {{ flight.departureTime }} ➔ {{ flight.arrivalTime }}
                      </span>
                    </div>

                    <div class="col-12 col-sm-6 col-md-2">
                      <span class="text-muted small d-block">Disponibilidade</span>
                      @if (flight.availableSeats > 0) {
                        <div class="text-success fw-bold small">
                          {{ flight.availableSeats }} assentos
                        </div>
                      } @else {
                        <div class="text-danger fw-bold small">Esgotado</div>
                      }
                      <span class="text-muted small d-block mt-1">Total: {{ flight.totalSeats }}</span>
                    </div>

                    <div class="col-12 col-md-5">
                      <span class="text-muted small d-block mb-2">Selecione a classe · preço por trecho e passageiro:</span>
                      <div class="d-flex flex-column gap-1">
                        
                        <!-- Básico -->
                        <button 
                          type="button"
                          class="btn btn-sm d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border"
                          [class.btn-primary]="isClassSelected(flight.id, 'BASIC', 'outbound')"
                          [class.text-white]="isClassSelected(flight.id, 'BASIC', 'outbound')"
                          [class.btn-light]="!isClassSelected(flight.id, 'BASIC', 'outbound')"
                          [disabled]="flight.availableSeats <= 0"
                          (click)="selectFlight(flight, 'BASIC', 'outbound')"
                        >
                          <span class="d-flex align-items-center gap-1">
                            <span class="fw-semibold">Básico</span>
                            @if (isClassSelected(flight.id, 'BASIC', 'outbound')) {
                              <span class="text-white fw-bold ms-1 small">✓ Selecionada</span>
                            }
                          </span>
                          <span class="fw-bold">{{ formatPrice(flight.pricePerPerson) }}</span>
                        </button>

                        <!-- Executivo -->
                        @if (flight.priceExecutive) {
                          <button 
                            type="button"
                            class="btn btn-sm d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border"
                            [class.btn-primary]="isClassSelected(flight.id, 'EXECUTIVE', 'outbound')"
                            [class.text-white]="isClassSelected(flight.id, 'EXECUTIVE', 'outbound')"
                            [class.btn-light]="!isClassSelected(flight.id, 'EXECUTIVE', 'outbound')"
                            [disabled]="flight.availableSeats <= 0"
                            (click)="selectFlight(flight, 'EXECUTIVE', 'outbound')"
                          >
                            <span class="d-flex align-items-center gap-1">
                              <span class="fw-semibold">Executivo</span>
                              @if (isClassSelected(flight.id, 'EXECUTIVE', 'outbound')) {
                                <span class="text-white fw-bold ms-1 small">✓ Selecionada</span>
                              }
                            </span>
                            <span class="fw-bold">{{ formatPrice(flight.priceExecutive) }}</span>
                          </button>
                        }

                        <!-- Premium -->
                        @if (flight.pricePremium) {
                          <button 
                            type="button"
                            class="btn btn-sm d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border"
                            [class.btn-primary]="isClassSelected(flight.id, 'PREMIUM', 'outbound')"
                            [class.text-white]="isClassSelected(flight.id, 'PREMIUM', 'outbound')"
                            [class.btn-light]="!isClassSelected(flight.id, 'PREMIUM', 'outbound')"
                            [disabled]="flight.availableSeats <= 0"
                            (click)="selectFlight(flight, 'PREMIUM', 'outbound')"
                          >
                            <span class="d-flex align-items-center gap-1">
                              <span class="fw-semibold">Premium</span>
                              @if (isClassSelected(flight.id, 'PREMIUM', 'outbound')) {
                                <span class="text-white fw-bold ms-1 small">✓ Selecionada</span>
                              }
                            </span>
                            <span class="fw-bold">{{ formatPrice(flight.pricePremium) }}</span>
                          </button>
                        }

                      </div>
                    </div>

                  </div>
                </div>
              }
            </div>
          }
        </section>

        <!-- SEÇÃO: VOOS DE VOLTA (APENAS SE DATA DE VOLTA FOR SELECIONADA) -->
        @if (endDate()) {
          <section class="mt-4">
            <h3 class="h5 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <span>Voos de Volta</span>
              <span class="text-secondary fs-6 ms-1">({{ returnFlights().length }})</span>
            </h3>

          @if (returnFlights().length === 0) {
            <div class="p-3 bg-light rounded-3 text-muted small">
              Nenhum voo de retorno programado para este destino no período.
            </div>
          } @else {
            <div class="d-flex flex-column gap-3">
              @for (flight of returnFlights(); track flight.id) {
                <div 
                  class="card border shadow-sm rounded-4 p-4 flight-card bg-white"
                  [class.flight-selected]="isFlightSelected(flight.id, 'return')"
                >
                  <div class="row align-items-center g-3">
                    
                    <div class="col-12 col-md-3">
                      <div class="text-secondary fw-bold small mb-1">
                        {{ flight.flightNumber }}
                      </div>
                      <div class="d-flex align-items-center gap-2 mt-1">
                        <span class="fs-5 fw-bold text-dark">{{ flight.originAirportCode }}</span>
                        <span class="text-muted">➔</span>
                        <span class="fs-5 fw-bold text-primary">{{ flight.destinationAirportCode }}</span>
                      </div>
                    </div>

                    <div class="col-12 col-sm-6 col-md-2">
                      <span class="text-muted small d-block">Data e Horário</span>
                      <span class="fw-bold text-dark d-block">
                        {{ flight.flightDate | date:'dd/MM/yyyy' }}
                      </span>
                      <span class="small text-secondary">
                        {{ flight.departureTime }} ➔ {{ flight.arrivalTime }}
                      </span>
                    </div>

                    <div class="col-12 col-sm-6 col-md-2">
                      <span class="text-muted small d-block">Disponibilidade</span>
                      @if (flight.availableSeats > 0) {
                        <div class="text-success fw-bold small">
                          {{ flight.availableSeats }} assentos
                        </div>
                      } @else {
                        <div class="text-danger fw-bold small">Esgotado</div>
                      }
                      <span class="text-muted small d-block mt-1">Total: {{ flight.totalSeats }}</span>
                    </div>

                    <div class="col-12 col-md-5">
                      <span class="text-muted small d-block mb-2">Selecione a classe · preço por trecho e passageiro:</span>
                      <div class="d-flex flex-column gap-1">
                        
                        <!-- Básico -->
                        <button 
                          type="button"
                          class="btn btn-sm d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border"
                          [class.btn-primary]="isClassSelected(flight.id, 'BASIC', 'return')"
                          [class.text-white]="isClassSelected(flight.id, 'BASIC', 'return')"
                          [class.btn-light]="!isClassSelected(flight.id, 'BASIC', 'return')"
                          [disabled]="flight.availableSeats <= 0"
                          (click)="selectFlight(flight, 'BASIC', 'return')"
                        >
                          <span class="d-flex align-items-center gap-1">
                            <span class="fw-semibold">Básico</span>
                            @if (isClassSelected(flight.id, 'BASIC', 'return')) {
                              <span class="text-white fw-bold ms-1 small">✓ Selecionada</span>
                            }
                          </span>
                          <span class="fw-bold">{{ formatPrice(flight.pricePerPerson) }}</span>
                        </button>

                        <!-- Executivo -->
                        @if (flight.priceExecutive) {
                          <button 
                            type="button"
                            class="btn btn-sm d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border"
                            [class.btn-primary]="isClassSelected(flight.id, 'EXECUTIVE', 'return')"
                            [class.text-white]="isClassSelected(flight.id, 'EXECUTIVE', 'return')"
                            [class.btn-light]="!isClassSelected(flight.id, 'EXECUTIVE', 'return')"
                            [disabled]="flight.availableSeats <= 0"
                            (click)="selectFlight(flight, 'EXECUTIVE', 'return')"
                          >
                            <span class="d-flex align-items-center gap-1">
                              <span class="fw-semibold">Executivo</span>
                              @if (isClassSelected(flight.id, 'EXECUTIVE', 'return')) {
                                <span class="text-white fw-bold ms-1 small">✓ Selecionada</span>
                              }
                            </span>
                            <span class="fw-bold">{{ formatPrice(flight.priceExecutive) }}</span>
                          </button>
                        }

                        <!-- Premium -->
                        @if (flight.pricePremium) {
                          <button 
                            type="button"
                            class="btn btn-sm d-flex justify-content-between align-items-center px-3 py-2 rounded-3 border"
                            [class.btn-primary]="isClassSelected(flight.id, 'PREMIUM', 'return')"
                            [class.text-white]="isClassSelected(flight.id, 'PREMIUM', 'return')"
                            [class.btn-light]="!isClassSelected(flight.id, 'PREMIUM', 'return')"
                            [disabled]="flight.availableSeats <= 0"
                            (click)="selectFlight(flight, 'PREMIUM', 'return')"
                          >
                            <span class="d-flex align-items-center gap-1">
                              <span class="fw-semibold">Premium</span>
                              @if (isClassSelected(flight.id, 'PREMIUM', 'return')) {
                                <span class="text-white fw-bold ms-1 small">✓ Selecionada</span>
                              }
                            </span>
                            <span class="fw-bold">{{ formatPrice(flight.pricePremium) }}</span>
                          </button>
                        }

                      </div>
                    </div>

                  </div>
                </div>
              }
            </div>
          }
        </section>
      }

    }

    </main>

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
    .flight-card {
      border-color: #e2e8f0;
      transition: all 0.2s ease-in-out;
    }

    .flight-card:hover {
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06) !important;
    }

    .flight-selected {
      border-color: #198754 !important;
      background-color: #f0fdf4 !important;
    }

    /* Stacking Context para o Card de Filtro e Popover */
    .search-card-container {
      position: relative;
      z-index: 50;
    }

    /* Custom Calendar Popover */
    .calendar-popover-container {
      position: relative;
      z-index: 60;
    }

    .calendar-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      width: 315px;
      max-width: calc(100vw - 32px);
      background: #ffffff;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 14px 35px rgba(15, 23, 42, 0.22);
      padding: 1rem;
      z-index: 1050;
      animation: calendarFadeIn 0.16s ease-out;
    }

    @keyframes calendarFadeIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.65rem;
    }

    .calendar-title {
      font-weight: 700;
      font-size: 0.92rem;
      color: #1e293b;
    }

    .calendar-nav-btn {
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #475569;
      font-size: 1.1rem;
      line-height: 1;
      cursor: pointer;
      transition: all 0.15s ease;
      padding: 0;
    }

    .calendar-nav-btn:hover:not(:disabled) {
      background: #4895CC;
      color: #ffffff;
      border-color: #4895CC;
    }

    .calendar-nav-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .calendar-legend {
      display: flex;
      justify-content: center;
      gap: 1.2rem;
      font-size: 0.72rem;
      padding-bottom: 0.45rem;
      margin-bottom: 0.55rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .legend-dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      text-align: center;
      font-size: 0.72rem;
      font-weight: 700;
      color: #94a3b8;
      margin-bottom: 0.4rem;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .calendar-day-cell {
      aspect-ratio: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 0.8rem;
      border: 1px solid transparent;
      padding: 0;
      background: transparent;
      transition: all 0.15s ease;
      user-select: none;
      line-height: 1;
    }

    /* Green available day */
    .calendar-day-available {
      background-color: #d1e7dd;
      color: #0f5132;
      border-color: #a3cfbb;
      font-weight: 700;
      cursor: pointer;
    }

    .calendar-day-available:hover {
      background-color: #198754 !important;
      color: #ffffff !important;
      border-color: #198754 !important;
      transform: scale(1.08);
      box-shadow: 0 3px 8px rgba(25, 135, 84, 0.35);
      z-index: 2;
    }

    .calendar-day-available.calendar-day-selected {
      background-color: #198754 !important;
      color: #ffffff !important;
      border-color: #198754 !important;
      box-shadow: 0 4px 12px rgba(25, 135, 84, 0.45);
    }

    /* Red unavailable day */
    .calendar-day-unavailable {
      background-color: #f8d7da;
      color: #842029;
      border-color: #f5c2c7;
      opacity: 0.65;
      cursor: not-allowed;
      font-size: 0.76rem;
    }

    .calendar-day-empty {
      visibility: hidden;
      pointer-events: none;
    }

    .flight-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: #0f5132;
      margin-top: 2px;
    }

    .calendar-day-available:hover .flight-dot,
    .calendar-day-selected .flight-dot {
      background-color: #ffffff;
    }

    .destination-picker { position: relative; }
    .destination-picker-trigger { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 38px; padding: 0.375rem 0.75rem; border: 1px solid #ced4da; border-radius: 0.75rem; background: #ffffff; color: #212529; font-size: 0.95rem; text-align: left; transition: border-color 0.2s ease, box-shadow 0.2s ease; }
    .destination-picker-trigger:hover, .destination-picker-open { border-color: #4895CC; }
    .destination-picker-trigger:focus-visible { outline: 0; border-color: #4895CC; box-shadow: 0 0 0 0.2rem rgba(72, 149, 204, 0.2); }
    .destination-picker-caret { width: 0.5rem; height: 0.5rem; margin-left: 0.75rem; border-right: 2px solid #475569; border-bottom: 2px solid #475569; transform: rotate(45deg) translateY(-2px); transition: transform 0.2s ease; }
    .destination-picker-open .destination-picker-caret { transform: rotate(225deg) translateY(-2px); }
    .destination-picker-menu { position: absolute; z-index: 1060; bottom: calc(100% + 0.5rem); left: 0; width: min(21rem, calc(100vw - 2rem)); max-height: 22rem; overflow-y: auto; border: 1px solid #dbe7f0; border-radius: 0.875rem; background: #ffffff; box-shadow: 0 14px 32px rgba(11, 37, 69, 0.16); padding: 0.375rem; }
    .destination-group-label { margin: 0.25rem 0.25rem 0.375rem; padding: 0.55rem 0.75rem; border-radius: 0.55rem; color: #ffffff; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.01em; }
    .destination-group-label-common { background: #4895CC; }
    .destination-group-label-eco { background: #63B921; }
    .destination-group-options + .destination-group-label { margin-top: 0.25rem; border-top: 1px solid #e2e8f0; }
    .destination-option { display: block; width: 100%; border: 0; border-radius: 0.5rem; background: transparent; color: #1e293b; padding: 0.5rem 0.75rem; font-size: 0.9rem; text-align: left; }
    .destination-option:hover, .destination-option:focus-visible { background: #edf6fc; color: #0B2545; outline: 0; }
    .destination-option-selected { background: #4895CC; color: #ffffff; font-weight: 600; }
    .destination-option-selected:hover, .destination-option-selected:focus-visible { background: #357fad; color: #ffffff; }
  `]
})
export class FlightSearchComponent implements OnInit {
  private flightsService = inject(FlightsService);
  private destinationsService = inject(DestinationsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reservationService = inject(ReservationService);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=800&auto=format&fit=crop';

  handleHeroError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  destinations = signal<Destination[]>([]);
  commonDestinations = computed(() =>
    this.destinations().filter(dest => (dest.tourismType || '').trim().toUpperCase() === 'COMUM')
  );
  ecotourismDestinations = computed(() =>
    this.destinations().filter(dest => (dest.tourismType || '').trim().toUpperCase() === 'ECOTURISMO')
  );
  allFlights = signal<Flight[]>([]);
  destinationFlights = signal<Flight[]>([]);
  isLoadingFlightDates = signal<boolean>(false);
  
  selectedDestinationId = signal<number | null>(null);
  isDestinationDropdownOpen = signal(false);
  selectedDestination = computed(() => this.destinations().find(dest => dest.id === this.selectedDestinationId()) ?? null);
  selectedDestinationLabel = computed(() => {
    const destination = this.selectedDestination();
    return destination ? this.formatDestinationOption(destination) : 'Selecione';
  });

  formatDestinationOption(dest: Destination): string {
    const name = (dest.name || '').trim();
    const country = (dest.country || '').trim();
    if (!country || country.toLowerCase() === name.toLowerCase()) {
      return name;
    }
    return `${name} (${country})`;
  }
  startDate = signal<string>('');
  endDate = signal<string>('');
  passengers = signal<number>(1);

  // Estados dos calendários interativos (Ida e Volta)
  isOutboundCalendarOpen = signal<boolean>(false);
  isReturnCalendarOpen = signal<boolean>(false);
  calendarMonth = signal<Date>(new Date());
  returnCalendarMonth = signal<Date>(new Date());
  
  isLoading = signal(false);
  hasSearched = signal(false);
  errorMessage = signal<string | null>(null);

  selectedOutbound = signal<SelectedFlightBooking | null>(null);
  selectedReturn = signal<SelectedFlightBooking | null>(null);
  preferredSeatClass = signal<FlightSeatClass>('BASIC');

  selectedOutboundFlight = computed(() => this.selectedOutbound()?.flight ?? null);
  selectedReturnFlight = computed(() => this.selectedReturn()?.flight ?? null);

  // Restrição de data: Primeira data permitida = Hoje + 3 dias
  minDepartureDate: string = this.calculateMinDate(3);
  minReturnDate = computed(() => {
    return this.startDate() || this.minDepartureDate;
  });

  // Conjunto de datas disponíveis para IDA (voos saindo de SP com vagas)
  availableOutboundDates = computed(() => {
    const dates = new Set<string>();
    for (const f of this.destinationFlights()) {
      if (f.destinationAirportCode !== 'GRU' && f.availableSeats > 0) {
        const dStr = f.flightDate.substring(0, 10);
        if (dStr >= this.minDepartureDate) {
          dates.add(dStr);
        }
      }
    }
    return dates;
  });

  // Conjunto de datas disponíveis para VOLTA (voos retornando a SP com vagas e >= data de ida)
  availableReturnDates = computed(() => {
    const dates = new Set<string>();
    const start = this.startDate();
    for (const f of this.destinationFlights()) {
      if (f.destinationAirportCode === 'GRU' && f.availableSeats > 0) {
        const dStr = f.flightDate.substring(0, 10);
        if (!start || dStr >= start) {
          dates.add(dStr);
        }
      }
    }
    return dates;
  });

  // Dias gerados para o grid do mês de IDA
  calendarDaysOutbound = computed(() => {
    return this.getCalendarDays(this.calendarMonth(), 'outbound');
  });

  // Dias gerados para o grid do mês de VOLTA
  calendarDaysReturn = computed(() => {
    return this.getCalendarDays(this.returnCalendarMonth(), 'return');
  });

  // Separação de voos de Ida e Volta baseado no código do aeroporto e datas
  outboundFlights = computed(() => {
    const start = this.startDate();
    return this.allFlights().filter(f => {
      if (f.destinationAirportCode === 'GRU') return false;
      if (start) {
        return f.flightDate.substring(0, 10) === start;
      }
      return true;
    });
  });

  returnFlights = computed(() => {
    const end = this.endDate();
    if (!end) {
      return [];
    }
    return this.allFlights().filter(f => {
      if (f.destinationAirportCode !== 'GRU') return false;
      return f.flightDate.substring(0, 10) === end;
    });
  });

  ngOnInit(): void {
    this.loadDestinations();

    this.route.queryParams.subscribe(params => {
      let shouldSearch = false;
      if (params['seatClass']) {
        const sc = String(params['seatClass']).toUpperCase();
        if (sc === 'BASIC' || sc === 'EXECUTIVE' || sc === 'PREMIUM') {
          this.preferredSeatClass.set(sc as FlightSeatClass);
        }
      }
      if (params['passengers']) {
        const p = Number(params['passengers']);
        if (!isNaN(p)) {
          this.passengers.set(p);
        }
      }
      if (params['destinationId']) {
        const dId = Number(params['destinationId']);
        if (!isNaN(dId)) {
          this.selectedDestinationId.set(dId);
          this.loadDestinationFlights(dId, () => {
            if (params['startDate']) {
              this.startDate.set(params['startDate']);
              shouldSearch = true;
            }
            if (params['endDate']) {
              this.endDate.set(params['endDate']);
            } else {
              this.endDate.set('');
            }
            if (shouldSearch) {
              this.onSearch();
            }
          });
        }
      }
    });
  }

  calculateMinDate(daysAhead: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onDestinationChange(destId: number | null): void {
    this.selectedDestinationId.set(destId);
    this.startDate.set('');
    this.endDate.set('');
    this.selectedOutbound.set(null);
    this.selectedReturn.set(null);
    this.allFlights.set([]);
    this.hasSearched.set(false);
    this.errorMessage.set(null);
    this.isOutboundCalendarOpen.set(false);
    this.isReturnCalendarOpen.set(false);

    if (destId) {
      this.loadDestinationFlights(destId);
    } else {
      this.destinationFlights.set([]);
    }
  }

  toggleDestinationDropdown(event: Event): void {
    event.stopPropagation();
    this.isDestinationDropdownOpen.update(isOpen => !isOpen);
  }

  selectDestination(destination: Destination, event: Event): void {
    event.stopPropagation();
    this.isDestinationDropdownOpen.set(false);
    this.onDestinationChange(destination.id);
  }
  loadDestinationFlights(destId: number, callback?: () => void): void {
    this.isLoadingFlightDates.set(true);
    this.flightsService.searchFlights({ destinationId: destId }).subscribe({
      next: (flights) => {
        this.destinationFlights.set(flights || []);
        this.isLoadingFlightDates.set(false);

        const outbounds = (flights || []).filter(f => f.destinationAirportCode !== 'GRU' && f.availableSeats > 0);
        if (outbounds.length > 0) {
          const sorted = [...outbounds].sort((a, b) => a.flightDate.localeCompare(b.flightDate));
          const firstDateStr = sorted[0].flightDate.substring(0, 10);
          const [y, m, d] = firstDateStr.split('-').map(Number);
          const targetMonth = new Date(y, m - 1, 1);
          this.calendarMonth.set(targetMonth);
          this.returnCalendarMonth.set(targetMonth);
        }

        if (callback) callback();
      },
      error: (err) => {
        console.error('Erro ao carregar voos do destino:', err);
        this.destinationFlights.set([]);
        this.isLoadingFlightDates.set(false);
        if (callback) callback();
      }
    });
  }

  getCalendarDays(monthDate: Date, type: 'outbound' | 'return'): (CalendarDay | null)[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const grid: (CalendarDay | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }

    const availableSet = type === 'outbound' ? this.availableOutboundDates() : this.availableReturnDates();
    const selectedDate = type === 'outbound' ? this.startDate() : this.endDate();

    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(year, month, d);
      const dateStr = this.formatDateToIso(dayDate);

      let isBeforeMin = false;
      if (type === 'outbound') {
        isBeforeMin = dateStr < this.minDepartureDate;
      } else {
        isBeforeMin = !this.startDate() || dateStr < this.startDate();
      }

      const hasFlight = availableSet.has(dateStr);
      const isAvailable = !isBeforeMin && hasFlight;
      const isSelected = dateStr === selectedDate;

      grid.push({
        date: dayDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isAvailable,
        isSelected
      });
    }

    return grid;
  }

  formatDateToIso(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  getMonthYearLabel(date: Date): string {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  toggleOutboundCalendar(event: Event): void {
    event.stopPropagation();
    if (!this.selectedDestinationId() || this.isLoadingFlightDates()) return;
    this.isReturnCalendarOpen.set(false);
    this.isOutboundCalendarOpen.update(v => !v);
  }

  toggleReturnCalendar(event: Event): void {
    event.stopPropagation();
    if (!this.startDate()) return;
    this.isOutboundCalendarOpen.set(false);
    this.isReturnCalendarOpen.update(v => !v);
  }

  selectOutboundDate(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isAvailable) return;
    this.startDate.set(day.dateStr);
    this.isOutboundCalendarOpen.set(false);

    if (this.endDate() && this.endDate() < day.dateStr) {
      this.endDate.set('');
      this.selectedReturn.set(null);
    }

    const [y, m, d] = day.dateStr.split('-').map(Number);
    this.returnCalendarMonth.set(new Date(y, m - 1, 1));
  }

  selectReturnDate(day: CalendarDay, event: Event): void {
    event.stopPropagation();
    if (!day.isAvailable) return;
    if (this.endDate() !== day.dateStr) {
      this.selectedReturn.set(null);
    }
    this.endDate.set(day.dateStr);
    this.isReturnCalendarOpen.set(false);
  }

  clearReturnDate(event: Event): void {
    event.stopPropagation();
    this.endDate.set('');
    this.selectedReturn.set(null);
    this.isReturnCalendarOpen.set(false);
  }

  closeCalendars(event: Event): void {
    event.stopPropagation();
    this.isOutboundCalendarOpen.set(false);
    this.isReturnCalendarOpen.set(false);
  }

  prevMonth(type: 'outbound' | 'return', event: Event): void {
    event.stopPropagation();
    const sig = type === 'outbound' ? this.calendarMonth : this.returnCalendarMonth;
    const curr = sig();
    const prev = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
    const now = new Date();
    const minMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (prev >= minMonth) {
      sig.set(prev);
    }
  }

  nextMonth(type: 'outbound' | 'return', event: Event): void {
    event.stopPropagation();
    const sig = type === 'outbound' ? this.calendarMonth : this.returnCalendarMonth;
    const curr = sig();
    const next = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
    const maxMonth = new Date(curr.getFullYear() + 2, curr.getMonth(), 1);
    if (next <= maxMonth) {
      sig.set(next);
    }
  }

  canPrevMonth(type: 'outbound' | 'return'): boolean {
    const curr = type === 'outbound' ? this.calendarMonth() : this.returnCalendarMonth();
    const now = new Date();
    return curr.getFullYear() > now.getFullYear() ||
           (curr.getFullYear() === now.getFullYear() && curr.getMonth() > now.getMonth());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.calendar-popover-container')) {
      this.isOutboundCalendarOpen.set(false);
      this.isReturnCalendarOpen.set(false);
    }
    if (!target.closest('.destination-picker')) {
      this.isDestinationDropdownOpen.set(false);
    }
  }

  loadDestinations(): void {
    this.destinationsService.getDestinations().subscribe({
      next: (data) => this.destinations.set(data || []),
      error: (err) => console.error('Erro ao buscar destinos', err)
    });
  }

  isValidToSearch(): boolean {
    if (!this.selectedDestinationId() || !this.startDate()) return false;
    if (this.startDate() < this.minDepartureDate) return false;
    return true;
  }

  onSearch(): void {
    if (!this.isValidToSearch()) return;

    const destId = this.selectedDestinationId();
    if (!destId) return;

    if (!this.endDate()) {
      this.selectedReturn.set(null);
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.hasSearched.set(true);

    const searchParams: FlightSearchParams = {
      destinationId: destId,
      startDate: this.startDate(),
      endDate: this.endDate() || undefined
    };

    this.flightsService.searchFlights(searchParams).subscribe({
      next: (data) => {
        this.allFlights.set(data || []);
        this.autoSelectFlightsByPreferredClass();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao buscar voos.');
      }
    });
  }

  private resolveAvailableSeatClass(flight: Flight, desired: FlightSeatClass): FlightSeatClass {
    if (desired === 'EXECUTIVE' && flight.priceExecutive) return 'EXECUTIVE';
    if (desired === 'PREMIUM' && flight.pricePremium) return 'PREMIUM';
    return 'BASIC';
  }

  private autoSelectFlightsByPreferredClass(): void {
    const targetClass: FlightSeatClass = this.preferredSeatClass() || 'BASIC';

    const outbounds = this.outboundFlights().filter(f => f.availableSeats > 0);
    if (outbounds.length > 0) {
      const firstOutbound = outbounds[0];
      const outClass = this.resolveAvailableSeatClass(firstOutbound, targetClass);
      this.selectFlight(firstOutbound, outClass, 'outbound');
    } else {
      this.selectedOutbound.set(null);
    }

    if (this.endDate()) {
      const returns = this.returnFlights().filter(f => f.availableSeats > 0);
      if (returns.length > 0) {
        const firstReturn = returns[0];
        const retClass = this.resolveAvailableSeatClass(firstReturn, targetClass);
        this.selectFlight(firstReturn, retClass, 'return');
      } else {
        this.selectedReturn.set(null);
      }
    } else {
      this.selectedReturn.set(null);
    }
  }

  getClassName(seatClass: FlightSeatClass): string {
    switch (seatClass) {
      case 'BASIC': return 'Básico';
      case 'EXECUTIVE': return 'Executivo';
      case 'PREMIUM': return 'Premium';
    }
  }

  getClassPrice(flight: Flight, seatClass: FlightSeatClass): number {
    switch (seatClass) {
      case 'BASIC': return flight.pricePerPerson;
      case 'EXECUTIVE': return flight.priceExecutive ?? flight.pricePerPerson;
      case 'PREMIUM': return flight.pricePremium ?? flight.pricePerPerson;
    }
  }

  selectFlight(flight: Flight, seatClass: FlightSeatClass, leg: 'outbound' | 'return'): void {
    this.preferredSeatClass.set(seatClass);
    const booking: SelectedFlightBooking = {
      flight,
      seatClass,
      price: this.getClassPrice(flight, seatClass)
    };
    if (leg === 'outbound') {
      this.selectedOutbound.set(booking);
    } else {
      this.selectedReturn.set(booking);
    }
  }

  isFlightSelected(flightId: number, leg: 'outbound' | 'return'): boolean {
    const current = leg === 'outbound' ? this.selectedOutbound() : this.selectedReturn();
    return current?.flight.id === flightId;
  }

  isClassSelected(flightId: number, seatClass: FlightSeatClass, leg: 'outbound' | 'return'): boolean {
    const current = leg === 'outbound' ? this.selectedOutbound() : this.selectedReturn();
    return current?.flight.id === flightId && current.seatClass === seatClass;
  }

  clearSelection(): void {
    this.selectedOutbound.set(null);
    this.selectedReturn.set(null);
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }

  formatTotalPrice(): string {
    let total = 0;
    if (this.selectedOutbound()) {
      total += this.selectedOutbound()!.price;
    }
    if (this.selectedReturn()) {
      total += this.selectedReturn()!.price;
    }
    return this.formatPrice(total);
  }

  selectionTotalLabel(): string {
    if (!this.endDate()) return 'Total da viagem por passageiro';
    if (this.selectedOutbound() && this.selectedReturn()) return 'Total ida e volta por passageiro';
    return 'Subtotal dos trechos selecionados por passageiro';
  }

  proceedToCheckout(): void {
    if (!this.selectedOutbound()) return;
    const outbound = this.selectedOutbound()!;
    const returnSel = this.selectedReturn();

    const destId = Number(this.selectedDestinationId() || outbound.flight.destinationId);
    const dest = this.destinations().find(d => Number(d.id) === destId);
    const destName = dest ? `${dest.name}, ${dest.country}` : (outbound.flight.destinationAirportCode ? `Destino (${outbound.flight.destinationAirportCode})` : 'Destino Selecionado');
    const tripType: TripType = returnSel ? 'ROUND_TRIP' : 'ONE_WAY';
    const pricePerPax = outbound.price + (returnSel?.price || 0);
    const paxCount = this.passengers() || 1;
    const estimatedTotal = pricePerPax * paxCount;

    const draft: CheckoutDraft = {
      destinationId: destId,
      destinationName: destName,
      tripType: tripType,
      passengersCount: paxCount,
      outboundFlight: {
        id: outbound.flight.id,
        flightNumber: outbound.flight.flightNumber,
        originAirportCode: outbound.flight.originAirportCode,
        destinationAirportCode: outbound.flight.destinationAirportCode,
        flightDate: outbound.flight.flightDate,
        departureTime: outbound.flight.departureTime,
        arrivalTime: outbound.flight.arrivalTime,
        seatClass: outbound.seatClass as SeatClass,
        price: outbound.price
      },
      returnFlight: returnSel ? {
        id: returnSel.flight.id,
        flightNumber: returnSel.flight.flightNumber,
        originAirportCode: returnSel.flight.originAirportCode,
        destinationAirportCode: returnSel.flight.destinationAirportCode,
        flightDate: returnSel.flight.flightDate,
        departureTime: returnSel.flight.departureTime,
        arrivalTime: returnSel.flight.arrivalTime,
        seatClass: returnSel.seatClass as SeatClass,
        price: returnSel.price
      } : null,
      totalPricePerPassenger: pricePerPax,
      estimatedTotal: estimatedTotal
    };

    this.reservationService.setCheckoutDraft(draft);
    this.router.navigate(['/checkout']);
  }
}
