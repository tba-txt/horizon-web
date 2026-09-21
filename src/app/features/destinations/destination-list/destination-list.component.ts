import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { DestinationsService } from '../services/destinations.service';
import { Destination } from '../models/destination.model';
import { DestinationWeather } from '../models/weather.model';

@Component({
  selector: 'app-destination-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero Section -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/Horizon 1.webp" 
        alt="Horizon Travel Hero" 
        class="w-100 hero-image"
        (error)="handleHeroError($event)"
      />
      
      <!-- Quiz CTA Overlay -->
      <div class="quiz-cta-overlay position-absolute d-none d-md-block" style="right: 8%; bottom: 12%; z-index: 10;">
        <div class="p-4 rounded-4 shadow" style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); max-width: 320px;">
          <h3 class="fw-bold text-white mb-3" style="text-shadow: 0 2px 8px rgba(0,0,0,0.4); font-size: 1.4rem; line-height: 1.4;">
            Não sabe para onde ir? Faça nosso Quiz
          </h3>
          <button class="btn w-100 text-white fw-bold py-2 rounded-pill shadow" style="background: #ff4d85; transition: transform 0.2s; letter-spacing: 0.5px;" routerLink="/quiz" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
            CLIQUE AQUI
          </button>
        </div>
      </div>
    </header>

    <!-- Flight Search Overlapping Box -->
    <div class="container flight-search-overlay" style="margin-top: -60px; position: relative; z-index: 20;">
      <div class="bg-white rounded-4 shadow-lg p-4 mx-auto border" style="max-width: 1200px;">
        
        <!-- Top controls -->
        <div class="d-flex align-items-center gap-3 mb-3 flex-wrap">
          <div class="dropdown position-relative">
            <button class="btn btn-primary btn-sm px-3 py-2 rounded-2 fw-semibold" type="button" 
                    style="background-color: #4895CC; border: none;"
                    (click)="toggleDropdown('type', $event)">
              {{ searchType() === 'IDA' ? 'Ida' : 'Ida e Volta' }} ▼
            </button>
            @if (isTypeDropdownOpen()) {
              <ul class="dropdown-menu show shadow position-absolute mt-1" style="z-index: 1050; top: 100%; left: 0;">
                <li><a class="dropdown-item cursor-pointer" (click)="selectType('IDA', $event)">Ida</a></li>
                <li><a class="dropdown-item cursor-pointer" (click)="selectType('IDA_VOLTA', $event)">Ida e Volta</a></li>
              </ul>
            }
          </div>

          <div class="dropdown position-relative">
            <button class="btn btn-primary btn-sm px-3 py-2 rounded-2 fw-semibold" type="button" 
                    style="background-color: #4895CC; border: none;"
                    (click)="toggleDropdown('class', $event)">
              Classe <span class="text-warning">{{ searchClass() }}</span> ▼
            </button>
            @if (isClassDropdownOpen()) {
              <ul class="dropdown-menu show shadow position-absolute mt-1" style="z-index: 1050; top: 100%; left: 0;">
                <li><a class="dropdown-item cursor-pointer" (click)="selectClass('Premium', $event)">Premium</a></li>
                <li><a class="dropdown-item cursor-pointer" (click)="selectClass('Executivo', $event)">Executivo</a></li>
                <li><a class="dropdown-item cursor-pointer" (click)="selectClass('Básico', $event)">Básico</a></li>
              </ul>
            }
          </div>

          <span class="fs-5 fw-bold ms-auto" style="color: #4895CC;">Viagem comum</span>
        </div>

        <!-- Grid of inputs -->
        <div class="row g-2 mb-3">
          <!-- A partir de -->
          <div class="col-12 col-md-6">
            <div class="p-2 px-3 rounded-2 cursor-pointer position-relative dropdown-wrapper" 
                 style="background-color: #5BA4D8;" 
                 (click)="toggleDropdown('origin', $event)">
              <div class="small text-white-50 mb-1" style="font-size: 0.8rem;">A partir de</div>
              <div class="text-white fw-bold d-flex justify-content-between align-items-center">
                <span>{{ getOriginLabel() }}</span>
                <span class="fs-6 opacity-50">▼</span>
              </div>
              
              @if (isOriginDropdownOpen()) {
                <ul class="dropdown-menu show w-100 shadow mt-2 position-absolute" style="z-index: 1050; top: 100%; left: 0;">
                  <li><a class="dropdown-item cursor-pointer" (click)="selectOrigin('SAO', $event)">São Paulo (SAO)</a></li>
                </ul>
              }
            </div>
          </div>
          <!-- Para -->
          <div class="col-12 col-md-6">
            <div class="p-2 px-3 rounded-2 cursor-pointer position-relative dropdown-wrapper" 
                 style="background-color: #5BA4D8;" 
                 (click)="toggleDropdown('dest', $event)">
              <div class="small text-white-50 mb-1" style="font-size: 0.8rem;">Para</div>
              <div class="text-white fw-bold d-flex justify-content-between align-items-center">
                <span>{{ getDestinationLabel() || 'Selecione o destino' }}</span>
                <span class="fs-6 opacity-50">▼</span>
              </div>
              
              @if (isDestinationDropdownOpen()) {
                <ul class="dropdown-menu show w-100 shadow mt-2 position-absolute" style="z-index: 1050; top: 100%; left: 0; max-height: 250px; overflow-y: auto;">
                  @for(dest of destinations(); track dest.id) {
                    <li><a class="dropdown-item cursor-pointer" (click)="selectDestination(dest.id, $event)">{{ dest.name }} ({{ dest.city }})</a></li>
                  }
                </ul>
              }
            </div>
          </div>
          <!-- Datas -->
          <div class="col-12 col-md-6">
            <div class="p-2 px-3 rounded-2 d-flex gap-2" style="background-color: #5BA4D8;">
              <label class="flex-grow-1 cursor-pointer mb-0">
                <div class="small text-white-50 mb-1" style="font-size: 0.8rem;">Ida</div>
                <input type="date" class="form-control bg-transparent border-0 text-white fw-bold shadow-none p-0 custom-date cursor-pointer"
                       [ngModel]="searchStartDate()" (ngModelChange)="searchStartDate.set($event)"
                       [min]="minDate()">
              </label>
              @if (searchType() === 'IDA_VOLTA') {
                <label class="border-start border-white-50 ps-3 flex-grow-1 cursor-pointer mb-0">
                  <div class="small text-white-50 mb-1" style="font-size: 0.8rem;">Volta</div>
                  <input type="date" class="form-control bg-transparent border-0 text-white fw-bold shadow-none p-0 custom-date cursor-pointer"
                         [ngModel]="searchEndDate()" (ngModelChange)="searchEndDate.set($event)"
                         [min]="searchStartDate() || minDate()">
                </label>
              }
            </div>
          </div>
          <!-- Passageiros -->
          <div class="col-12 col-md-6">
            <div class="p-2 px-3 rounded-2 cursor-pointer position-relative dropdown-wrapper" 
                 style="background-color: #5BA4D8;" 
                 (click)="toggleDropdown('passengers', $event)">
              <div class="small text-white-50 mb-1" style="font-size: 0.8rem;">Passageiros</div>
              <div class="text-white fw-bold d-flex justify-content-between align-items-center">
                <span>{{ searchPassengers() }} adulto{{ searchPassengers() > 1 ? 's' : '' }}</span>
                <span class="fs-6 opacity-50">▼</span>
              </div>
              
              @if (isPassengersDropdownOpen()) {
                <ul class="dropdown-menu show w-100 shadow mt-2 position-absolute" style="z-index: 1050; top: 100%; left: 0;">
                  <li><a class="dropdown-item cursor-pointer" (click)="selectPassengers(1, $event)">1 adulto</a></li>
                  <li><a class="dropdown-item cursor-pointer" (click)="selectPassengers(2, $event)">2 adultos</a></li>
                  <li><a class="dropdown-item cursor-pointer" (click)="selectPassengers(3, $event)">3 adultos</a></li>
                  <li><a class="dropdown-item cursor-pointer" (click)="selectPassengers(4, $event)">4 adultos</a></li>
                  <li><a class="dropdown-item cursor-pointer" (click)="selectPassengers(5, $event)">5 adultos</a></li>
                </ul>
              }
            </div>
          </div>
        </div>

        <!-- Botão Buscar Voos -->
        <div class="text-end mt-2">
          <button class="btn px-4 py-2 rounded-2 fw-bold text-white shadow-sm" style="background-color: #4895CC;" (click)="submitSearch()">Buscar Voos</button>
        </div>
      </div>
    </div>

    <main class="container py-5" style="margin-top: 70px;">
      
      <!-- Estado: Loading Geral -->
      @if (isLoading()) {
        <div class="d-flex flex-column align-items-center justify-content-center py-5">
          <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
            <span class="visually-hidden">Carregando destinos...</span>
          </div>
          <p class="text-muted fw-medium">Buscando destinos disponíveis...</p>
        </div>
      }

      <!-- Estado: Erro Geral -->
      @else if (errorMessage()) {
        <div class="alert alert-danger d-flex flex-column align-items-center justify-content-center p-4 my-4 rounded-3 text-center" role="alert">
          <h5 class="fw-bold mb-2">Ops! Não foi possível carregar os destinos.</h5>
          <p class="mb-3 small text-danger-emphasis">{{ errorMessage() }}</p>
          <button class="btn btn-outline-danger btn-sm px-4" (click)="loadDestinations()">
            Tentar novamente
          </button>
        </div>
      }

      <!-- Estado: Sucesso -->
      @else {
        
        <!-- SEÇÃO 1: DESTINOS COMUNS -->
        <section class="mb-5">
          <div class="mb-4">
            <h2 class="h3 fw-bold text-dark mb-0">Destinos Comuns</h2>
          </div>

          <div class="row row-cols-1 row-cols-md-2 g-4">
            @for (dest of commonDestinations(); track dest.id) {
              <div class="col">
                <div class="card h-100 border rounded-3 overflow-hidden destination-card shadow-sm" style="border-color: #5BA4D8 !important; border-width: 2px !important; background-color: #f4f7f9;">
                  
                  <div class="position-relative cursor-pointer" style="height: 220px;" (click)="openDetailModal(dest)">
                    <img 
                      [src]="dest.imageUrl || placeholderImage" 
                      [alt]="dest.name" 
                      class="w-100 h-100 object-fit-cover"
                      loading="lazy"
                      (error)="handleImageError($event)"
                    />
                    
                    <!-- Horizon Tag (Top Left) -->
                    <div class="position-absolute top-0 start-0 p-2 pointer-events-none">
                      <img src="assets/LogoH.png" alt="Horizon" style="height: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); pointer-events: none;">
                    </div>

                    <!-- Botão Info (Bottom Right overlapping) -->
                    <button class="btn position-absolute rounded-3 p-1 d-flex align-items-center justify-content-center shadow-sm"
                            style="bottom: -16px; right: 15px; width: 32px; height: 32px; background-color: #5BA4D8; border: 2px solid white; z-index: 5;"
                            (click)="openDetailModal(dest); $event.stopPropagation()">
                      <img src="assets/info-icon.png" alt="Info" class="w-100 h-100 object-fit-contain">
                    </button>
                  </div>

                  <!-- Card Body -->
                  <div class="card-body p-4 pt-3 d-flex flex-column" (click)="openDetailModal(dest)">
                    <h3 class="h5 mb-1 cursor-pointer" style="color: #5BA4D8;">
                      <span class="fw-bold">{{ dest.name }}</span> 
                      <span class="fw-normal">({{ dest.country }})</span>
                    </h3>
                    <p class="mb-0 fw-semibold mt-1" style="color: #63B921; font-size: 0.95rem;">
                      Voo de ida e volta a partir de {{ formatPrice(dest.basePrice) }}
                    </p>
                  </div>

                </div>
              </div>
            }
          </div>

          <!-- Botão Explorar todas as ofertas (Comum) -->
          <div class="mt-4 text-center">
            <a routerLink="/destinations/common" class="btn text-white fw-bold px-4 py-2 rounded-3 shadow-sm text-decoration-none d-inline-block" style="background-color: #4895CC;">
              Explorar todas as ofertas
            </a>
          </div>
        </section>

        <!-- SEÇÃO 2: ECOTURISMO -->
        <section class="mt-5 pt-4">
          <div class="mb-4">
            <h2 class="h3 fw-bold text-dark mb-0">Eco<span style="color: #63B921;">turismo</span></h2>
          </div>

          <div class="row row-cols-1 row-cols-md-2 g-4">
            @for (dest of ecoDestinations(); track dest.id) {
              <div class="col">
                <div class="card h-100 border rounded-3 overflow-hidden destination-card shadow-sm" style="border-color: #63B921 !important; border-width: 2px !important; background-color: #f4f7f9;">
                  
                  <div class="position-relative cursor-pointer" style="height: 220px;" (click)="openDetailModal(dest)">
                    <img 
                      [src]="dest.imageUrl || placeholderImage" 
                      [alt]="dest.name" 
                      class="w-100 h-100 object-fit-cover"
                      loading="lazy"
                      (error)="handleImageError($event)"
                    />
                    
                    <!-- Horizon Tag (Top Left) -->
                    <div class="position-absolute top-0 start-0 p-2 pointer-events-none">
                      <img src="assets/LogoH.png" alt="Horizon" style="height: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); pointer-events: none;">
                    </div>

                    <!-- Botão Info (Bottom Right overlapping) - VERDE -->
                    <button class="btn position-absolute rounded-3 p-1 d-flex align-items-center justify-content-center shadow-sm"
                            style="bottom: -16px; right: 15px; width: 32px; height: 32px; background-color: #63B921; border: 2px solid white; z-index: 5;"
                            (click)="openDetailModal(dest); $event.stopPropagation()">
                      <img src="assets/info-icon.png" alt="Info" class="w-100 h-100 object-fit-contain">
                    </button>
                  </div>

                  <!-- Card Body -->
                  <div class="card-body p-4 pt-3 d-flex flex-column" (click)="openDetailModal(dest)">
                    <h3 class="h5 mb-1 cursor-pointer" style="color: #63B921;">
                      <span class="fw-bold">{{ dest.name }}</span> 
                      <span class="fw-normal">({{ dest.country }})</span>
                    </h3>
                    <p class="mb-0 fw-semibold mt-1" style="color: #63B921; font-size: 0.95rem;">
                      Voo de ida e volta a partir de {{ formatPrice(dest.basePrice) }}
                    </p>
                  </div>

                </div>
              </div>
            }
          </div>

          <!-- Botão Explorar todas as ofertas (Ecoturismo) -->
          <div class="mt-4 text-center">
            <a routerLink="/destinations/ecotourism" class="btn text-white fw-bold px-4 py-2 rounded-3 shadow-sm text-decoration-none d-inline-block" style="background-color: #63B921;">
              Explorar todas as ofertas
            </a>
          </div>
        </section>

      }

    </main>

    <!-- Footer -->
    <app-footer></app-footer>

    <!-- MODAL DE DETALHES DO DESTINO -->
    @if (selectedDestination()) {
      <div class="modal fade show d-block modal-backdrop-custom" tabindex="-1" role="dialog" aria-modal="true" style="background-color: rgba(0,0,0,0.7);" (click)="closeModal()">
        <div class="modal-dialog modal-lg modal-dialog-scrollable" role="document" style="max-width: 850px;" (click)="$event.stopPropagation()">
          <div class="modal-content border-0 shadow-lg overflow-hidden" style="background-color: #eef2f6; border-radius: 0;">
            
            <!-- Close Button -->
            <button type="button" class="btn-close position-absolute top-0 end-0 m-4" style="z-index: 1055; filter: invert(1); opacity: 0.9;" (click)="closeModal()" aria-label="Close"></button>

            <!-- Modal Body -->
            <div class="modal-body p-0">
              
              <!-- Hero Image Area -->
              <div class="position-relative w-100" style="height: 320px;">
                <img [src]="selectedDestination()!.imageUrl || placeholderImage" class="w-100 h-100 object-fit-cover" alt="Destination Image">
                
                <!-- Gradient Overlay -->
                <div class="position-absolute bottom-0 start-0 w-100 p-4 pb-3" style="background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);">
                  <h2 class="text-white fw-bold mb-2" style="font-size: 3rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">{{ selectedDestination()!.name }}</h2>
                </div>
              </div>

              <!-- Content Area -->
              <div class="p-4 p-md-5">
                <h3 class="fw-bold mb-4 fs-5 text-dark">{{ selectedDestination()!.country }}</h3>
                
                <div class="row g-5">
                  <!-- Weather Chart -->
                  <div class="col-12 col-md-6">
                    <div class="card border rounded-3 h-100 p-4 shadow-sm bg-white d-flex flex-column justify-content-between" style="border-color: #dee2e6 !important;">
                      <div class="d-flex justify-content-between align-items-end gap-3" style="min-height: 200px;">
                        
                        <!-- Bar 1 (Mock) -->
                        <div class="d-flex flex-column align-items-center flex-grow-1">
                          <div class="w-100 rounded-top-2 d-flex flex-column justify-content-end pb-2 align-items-center transition-all" [style.background-color]="isEcoDestination() ? '#63B921' : '#5BA4D8'" [style.height.px]="getBarHeight(getMockTemp(-2))">
                            <span class="text-white fw-bold" style="font-size: 0.8rem;">Em 3 dias</span>
                          </div>
                          <div class="bg-white w-100 border border-top-0 text-center py-2 rounded-bottom-2">
                            <i class="bi fs-5 text-secondary d-block" [class.bi-snow]="isPolarDestination()" [class.bi-cloud-fill]="!isPolarDestination()"></i>
                            <span class="fw-bold small d-block mt-1">{{ getMockTemp(-2) }}°C</span>
                            <span class="text-dark fw-medium d-block mt-1" style="font-size: 0.65rem;">
                              <i class="bi" [class.bi-snow]="isPolarDestination()" [class.bi-droplet-fill]="!isPolarDestination()"></i> {{ getMockHumidity(-4) }}%
                            </span>
                          </div>
                        </div>

                        <!-- Bar 2 (Mock) -->
                        <div class="d-flex flex-column align-items-center flex-grow-1">
                          <div class="w-100 rounded-top-2 d-flex flex-column justify-content-end pb-2 align-items-center transition-all" [style.background-color]="isEcoDestination() ? '#63B921' : '#5BA4D8'" [style.height.px]="getBarHeight(getMockTemp(-1))">
                            <span class="text-white fw-bold" style="font-size: 0.8rem;">Em 2 dias</span>
                          </div>
                          <div class="bg-white w-100 border border-top-0 text-center py-2 rounded-bottom-2">
                            <i class="bi fs-5 text-secondary d-block" [class.bi-cloud-snow-fill]="isPolarDestination()" [class.bi-cloud-sun-fill]="!isPolarDestination()"></i>
                            <span class="fw-bold small d-block mt-1">{{ getMockTemp(-1) }}°C</span>
                            <span class="text-dark fw-medium d-block mt-1" style="font-size: 0.65rem;">
                              <i class="bi" [class.bi-snow]="isPolarDestination()" [class.bi-droplet-fill]="!isPolarDestination()"></i> {{ getMockHumidity(8) }}%
                            </span>
                          </div>
                        </div>

                        <!-- Bar 3 (Mock) -->
                        <div class="d-flex flex-column align-items-center flex-grow-1">
                          <div class="w-100 rounded-top-2 d-flex flex-column justify-content-end pb-2 align-items-center transition-all" [style.background-color]="isEcoDestination() ? '#63B921' : '#5BA4D8'" [style.height.px]="getBarHeight(getMockTemp(+1))">
                            <span class="text-white fw-bold" style="font-size: 0.8rem;">Amanhã</span>
                          </div>
                          <div class="bg-white w-100 border border-top-0 text-center py-2 rounded-bottom-2">
                            <i class="bi fs-5 text-secondary d-block" [class.bi-snow2]="isPolarDestination()" [class.bi-cloud-fill]="!isPolarDestination()"></i>
                            <span class="fw-bold small d-block mt-1">{{ getMockTemp(+1) }}°C</span>
                            <span class="text-dark fw-medium d-block mt-1" style="font-size: 0.65rem;">
                              <i class="bi" [class.bi-snow]="isPolarDestination()" [class.bi-droplet-fill]="!isPolarDestination()"></i> {{ getMockHumidity(-6) }}%
                            </span>
                          </div>
                        </div>

                        <!-- Bar 4 (Real API Data) -->
                        <div class="d-flex flex-column align-items-center flex-grow-1">
                          <div class="w-100 rounded-top-2 d-flex flex-column justify-content-end pb-2 align-items-center transition-all" [style.background-color]="isEcoDestination() ? '#63B921' : '#5BA4D8'" [style.height.px]="getBarHeight(getRealTemp())">
                            <span class="text-white fw-bold" style="font-size: 0.8rem;">Hoje</span>
                          </div>
                          <div class="bg-white w-100 border border-top-0 text-center py-2 rounded-bottom-2">
                            <i class="bi fs-5 text-secondary d-block" [class.bi-snow]="isPolarDestination()" [class.bi-cloud-sun-fill]="!isPolarDestination()"></i>
                            <span class="fw-bold small d-block mt-1">{{ getRealTemp() }}°C</span>
                            <span class="text-dark fw-medium d-block mt-1" style="font-size: 0.65rem;">
                              <i class="bi" [class.bi-snow]="isPolarDestination()" [class.bi-droplet-fill]="!isPolarDestination()"></i> {{ getRealHumidity() }}%
                            </span>
                          </div>
                        </div>

                      </div>

                      <!-- Open-Meteo Extra Features Strip -->
                      <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center small text-muted">
                        <div>
                          <i class="bi bi-thermometer-half me-1 text-secondary"></i>
                          <span>Sensação: <strong class="text-dark">{{ getApparentTemp() }}°C</strong></span>
                        </div>
                        <div>
                          <i class="bi bi-wind me-1 text-secondary"></i>
                          <span>Vento: <strong class="text-dark">{{ getWindSpeed() }} km/h</strong></span>
                        </div>
                        <div>
                          <span class="fw-medium text-secondary">{{ getWeatherConditionLabel() }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="col-12 col-md-6">
                    <h3 class="fw-bold mb-3 fs-3 text-dark">{{ selectedDestination()!.name }}</h3>
                    <p class="text-dark fw-medium" style="line-height: 1.5; font-size: 0.95rem;">
                      {{ selectedDestination()!.description || 'Descubra este incrível destino com a Horizon. Paisagens deslumbrantes, cultura rica e uma experiência inesquecível aguardam por você nesta viagem especial.' }}
                    </p>
                  </div>
                </div>

                <!-- Gallery Placeholder -->
                <div class="mt-5">
                  <h3 class="fw-bold mb-4 fs-3 text-dark">Confira algumas fotos da cidade</h3>
                  <div class="row g-3">
                    <div class="col-12 col-md-4">
                      <div class="wireframe-box w-100" style="height: 350px;"></div>
                    </div>
                    <div class="col-12 col-md-8">
                      <div class="row g-3 h-100">
                        <div class="col-6" style="height: 167px;">
                          <div class="wireframe-box w-100 h-100"></div>
                        </div>
                        <div class="col-6" style="height: 167px;">
                          <div class="wireframe-box w-100 h-100"></div>
                        </div>
                        <div class="col-12" style="height: 167px;">
                          <div class="row g-3 h-100">
                            <div class="col-4"><div class="wireframe-box w-100 h-100"></div></div>
                            <div class="col-4"><div class="wireframe-box w-100 h-100"></div></div>
                            <div class="col-4"><div class="wireframe-box w-100 h-100"></div></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Sticky Footer -->
            <div class="modal-footer bg-white border-top-0 shadow p-3 px-md-4 d-flex justify-content-between align-items-center flex-nowrap z-3 position-relative">
              <div>
                <h4 class="fw-bold mb-0 fs-6 text-dark">São Paulo (SAO) - {{ selectedDestination()!.name }}</h4>
              </div>
              
              <div class="d-flex align-items-center gap-4">
                <div class="text-end d-none d-sm-block">
                  <span class="fw-bold d-block lh-1 text-dark" style="font-size: 0.8rem;">Por</span>
                  <span class="fw-bold fs-5 mt-1 d-block" style="color: #63B921;">{{ formatPrice(selectedDestination()!.basePrice) }}</span>
                </div>
                <button class="btn border-0 text-white fw-bold px-4 py-2" style="background-color: #ff5c8d; border-radius: 4px; font-size: 1rem; letter-spacing: 0.5px;" (click)="navigateToFlights(selectedDestination()!.id)">
                  RESERVAR AGORA
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    }

    <!-- TOAST NOTIFICATION -->
    @if (toastMessage()) {
      <div class="position-fixed top-0 end-0 p-4" style="z-index: 9999;">
        <div class="toast show align-items-center text-white border-0 shadow-lg px-3 py-2 rounded-3 d-flex"
             [style.background-color]="toastType() === 'error' ? '#dc3545' : (toastType() === 'warning' ? '#ff9800' : '#2e7d32')"
             role="alert" style="min-width: 320px; animation: slideInRight 0.3s ease-out;">
          <div class="d-flex align-items-center w-100">
            <i class="bi fs-5 me-2" [class.bi-exclamation-triangle-fill]="toastType() === 'warning'" [class.bi-x-circle-fill]="toastType() === 'error'" [class.bi-check-circle-fill]="toastType() === 'success'"></i>
            <div class="toast-body p-0 flex-grow-1 fw-medium">
              {{ toastMessage() }}
            </div>
            <button type="button" class="btn-close btn-close-white ms-2" (click)="dismissToast()" aria-label="Close"></button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .hero-container {
      width: 100%;
      background: #0b2545;
    }

    .hero-image {
      width: 100%;
      height: auto;
      display: block;
    }

    .border-common {
      border-color: #4895CC !important;
    }

    .border-eco {
      border-color: #63B921 !important;
    }

    .badge-common {
      background-color: #4895CC;
    }

    .badge-eco {
      background-color: #63B921;
    }

    .text-common {
      color: #4895CC;
    }

    .text-eco {
      color: #63B921;
    }

    .btn-common {
      background-color: #4895CC;
      border-color: #4895CC;
    }

    .btn-common:hover {
      background-color: #3879a8;
      border-color: #3879a8;
    }

    .btn-outline-common {
      color: #4895CC;
      border-color: #4895CC;
    }

    .btn-outline-common:hover {
      background-color: #4895CC;
      color: #fff;
    }

    .btn-eco {
      background-color: #63B921;
      border-color: #63B921;
    }

    .btn-eco:hover {
      background-color: #529d1a;
      border-color: #529d1a;
    }

    .btn-outline-eco {
      color: #63B921;
      border-color: #63B921;
    }

    .btn-outline-eco:hover {
      background-color: #63B921;
      color: #fff;
    }

    .destination-card {
      border-color: #e2e8f0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .destination-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08) !important;
    }

    .card-img-container {
      height: 220px;
      background: #f1f5f9;
    }

    .object-fit-cover {
      object-fit: cover;
    }

    .custom-select, .custom-date {
      color: white !important;
      outline: none !important;
      box-shadow: none !important;
      background-image: none !important; /* Remove Bootstrap select arrow if we want it completely clean, but let's keep default arrow just white */
    }
    .custom-select option {
      color: #333 !important;
    }
    .custom-date::-webkit-calendar-picker-indicator {
      filter: invert(1);
      cursor: pointer;
    }

    .modal-backdrop-custom {
      background-color: rgba(0, 0, 0, 0.55);
    }

    .modal-img-wrapper {
      height: 320px;
      background: #f1f5f9;
    }
  `]
})
export class DestinationListComponent implements OnInit {
  private destinationsService = inject(DestinationsService);
  private router = inject(Router);

  destinations = signal<Destination[]>([]);
  commonDestinations = signal<Destination[]>([]);
  ecoDestinations = signal<Destination[]>([]);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  selectedDestination = signal<Destination | null>(null);
  weather = signal<DestinationWeather | null>(null);
  isLoadingWeather = signal(false);

  readonly placeholderImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop';

  searchType = signal<'IDA' | 'IDA_VOLTA'>('IDA');
  searchClass = signal<string>('Premium');
  searchOrigin = signal<string>('SAO');
  searchDestinationId = signal<number | null>(null);
  searchStartDate = signal<string>('');
  searchEndDate = signal<string>('');
  searchPassengers = signal<number>(1);
  minDate = signal<string>(this.calculateMinDate(3));

  // Dropdown states
  isTypeDropdownOpen = signal(false);
  isClassDropdownOpen = signal(false);
  isOriginDropdownOpen = signal(false);
  isDestinationDropdownOpen = signal(false);
  isPassengersDropdownOpen = signal(false);

  @HostListener('document:click')
  onDocumentClick() {
    this.closeAllDropdowns();
  }

  closeAllDropdowns() {
    this.isTypeDropdownOpen.set(false);
    this.isClassDropdownOpen.set(false);
    this.isOriginDropdownOpen.set(false);
    this.isDestinationDropdownOpen.set(false);
    this.isPassengersDropdownOpen.set(false);
  }

  toggleDropdown(dropdown: 'type' | 'class' | 'origin' | 'dest' | 'passengers', event: Event) {
    event.stopPropagation();
    let currentState = false;
    switch (dropdown) {
      case 'type': currentState = this.isTypeDropdownOpen(); break;
      case 'class': currentState = this.isClassDropdownOpen(); break;
      case 'origin': currentState = this.isOriginDropdownOpen(); break;
      case 'dest': currentState = this.isDestinationDropdownOpen(); break;
      case 'passengers': currentState = this.isPassengersDropdownOpen(); break;
    }
    this.closeAllDropdowns();
    
    switch (dropdown) {
      case 'type': this.isTypeDropdownOpen.set(!currentState); break;
      case 'class': this.isClassDropdownOpen.set(!currentState); break;
      case 'origin': this.isOriginDropdownOpen.set(!currentState); break;
      case 'dest': this.isDestinationDropdownOpen.set(!currentState); break;
      case 'passengers': this.isPassengersDropdownOpen.set(!currentState); break;
    }
  }

  selectType(type: 'IDA' | 'IDA_VOLTA', event: Event) {
    event.stopPropagation();
    this.searchType.set(type);
    this.isTypeDropdownOpen.set(false);
  }

  selectClass(className: string, event: Event) {
    event.stopPropagation();
    this.searchClass.set(className);
    this.isClassDropdownOpen.set(false);
  }

  selectOrigin(origin: string, event: Event) {
    event.stopPropagation();
    this.searchOrigin.set(origin);
    this.isOriginDropdownOpen.set(false);
  }

  selectDestination(destId: number, event: Event) {
    event.stopPropagation();
    this.searchDestinationId.set(destId);
    this.isDestinationDropdownOpen.set(false);
  }

  selectPassengers(count: number, event: Event) {
    event.stopPropagation();
    this.searchPassengers.set(count);
    this.isPassengersDropdownOpen.set(false);
  }

  getOriginLabel(): string {
    const o = this.searchOrigin();
    if (o === 'SAO') return 'São Paulo (SAO)';
    return o;
  }

  getDestinationLabel(): string {
    const id = this.searchDestinationId();
    if (!id) return '';
    const dest = this.destinations().find(d => d.id === id);
    return dest ? `${dest.name} (${dest.city})` : '';
  }

  ngOnInit(): void {
    this.loadDestinations();
  }

  toastMessage = signal<string | null>(null);
  toastType = signal<'warning' | 'error' | 'success'>('warning');
  private toastTimeout: any;

  showToast(message: string, type: 'warning' | 'error' | 'success' = 'warning'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  dismissToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastMessage.set(null);
  }

  isPolarDestination(): boolean {
    const name = (this.selectedDestination()?.name || '').toLowerCase();
    const city = (this.selectedDestination()?.city || '').toLowerCase();
    const country = (this.selectedDestination()?.country || '').toLowerCase();
    return name.includes('antártida') || name.includes('antarctica') || city.includes('antártida') || country.includes('antártida');
  }

  getRealTemp(): number {
    const isPolar = this.isPolarDestination();
    const fMax = this.weather()?.forecast?.maxTemperature;
    if (fMax !== undefined && fMax !== null) {
      return Math.round(fMax);
    }
    const hMax = this.weather()?.historicalContext?.maxTemperature;
    if (hMax !== undefined && hMax !== null) {
      return Math.round(hMax);
    }
    return isPolar ? -18 : 25;
  }

  getMockTemp(offset: number): number {
    return this.getRealTemp() + offset;
  }

  getBarHeight(temp: number): number {
    const t1 = this.getMockTemp(-2);
    const t2 = this.getMockTemp(-1);
    const t3 = this.getMockTemp(+1);
    const t4 = this.getRealTemp();
    const min = Math.min(t1, t2, t3, t4);
    const max = Math.max(t1, t2, t3, t4);

    if (max === min) {
      return 100;
    }

    const ratio = (temp - min) / (max - min);
    return Math.round(70 + ratio * 70);
  }

  getApparentTemp(): number {
    const app = this.weather()?.forecast?.apparentTemperature;
    if (app !== undefined && app !== null) {
      return Math.round(app);
    }
    return this.isPolarDestination() ? -28 : (this.getRealTemp() + 2);
  }

  getWindSpeed(): number {
    const wind = this.weather()?.forecast?.windSpeedKmH;
    if (wind !== undefined && wind !== null) {
      return Math.round(wind);
    }
    return this.isPolarDestination() ? 48 : 14;
  }

  getWeatherConditionLabel(): string {
    if (this.isPolarDestination()) {
      return 'Vento Polar & Neve';
    }
    return this.weather()?.forecast?.weatherDescription || this.weather()?.forecast?.description || 'Céu Limpo';
  }

  isEcoDestination(): boolean {
    return (this.selectedDestination()?.tourismType || '').toUpperCase() === 'ECOTURISMO';
  }

  getRealHumidity(): number {
    if (this.isPolarDestination()) {
      return 85;
    }
    if (this.weather() && this.weather()!.forecast) {
      return this.weather()!.forecast!.precipitationProbabilityPercent ?? 16;
    }
    if (this.weather() && this.weather()!.historicalContext) {
      return this.weather()!.historicalContext!.rainyDaysCount ? 24 : 12;
    }
    return 16;
  }

  getMockHumidity(offset: number): number {
    const val = this.getRealHumidity() + offset;
    return Math.max(5, Math.min(95, val));
  }

  calculateMinDate(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  submitSearch(): void {
    if (!this.searchDestinationId() || !this.searchStartDate()) {
      this.showToast('Por favor, selecione o destino e a data de ida.', 'warning');
      return;
    }
    
    const queryParams: any = {
      destinationId: this.searchDestinationId(),
      startDate: this.searchStartDate(),
      passengers: this.searchPassengers()
    };
    
    if (this.searchType() === 'IDA_VOLTA' && this.searchEndDate()) {
      queryParams.endDate = this.searchEndDate();
    }
    
    this.router.navigate(['/flights'], { queryParams });
  }

  loadDestinations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.destinationsService.getDestinations().subscribe({
      next: (data) => {
        const list = data || [];
        this.destinations.set(list);

        // Separação em Comum (#4895CC) e Ecoturismo (#63B921)
        const common = list.filter(d => (d.tourismType || '').toUpperCase() === 'COMUM').slice(0, 4);
        const eco = list.filter(d => (d.tourismType || '').toUpperCase() === 'ECOTURISMO').slice(0, 4);

        this.commonDestinations.set(common.length > 0 ? common : list.slice(0, 4));
        this.ecoDestinations.set(eco.length > 0 ? eco : list.slice(4, 8));

        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Falha ao buscar destinos.');
      }
    });
  }

  openDetailModal(dest: Destination): void {
    this.selectedDestination.set(dest);
    this.weather.set(null);
    this.isLoadingWeather.set(true);

    this.destinationsService.getDestinationWeather(dest.id).subscribe({
      next: (w) => {
        this.weather.set(w);
        this.isLoadingWeather.set(false);
      },
      error: (err) => {
        console.warn('Erro ao carregar clima para destino', err);
        this.isLoadingWeather.set(false);
      }
    });
  }

  closeModal(): void {
    this.selectedDestination.set(null);
    this.weather.set(null);
  }

  navigateToFlights(destinationId: number): void {
    this.closeModal();
    this.router.navigate(['/flights'], { queryParams: { destinationId } });
  }

  handleImageError(event: any): void {
    event.target.src = this.placeholderImage;
  }

  handleHeroError(event: any): void {
    event.target.style.display = 'none';
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  }
}
