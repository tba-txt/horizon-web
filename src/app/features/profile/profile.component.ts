import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { FeedbackModalComponent } from '../../shared/components/feedback-modal/feedback-modal.component';
import { TicketComponent } from '../../shared/components/ticket/ticket.component';
import { UserService } from '../../core/user/services/user.service';
import { UserProfile, UserUpdateRequest } from '../../core/user/models/user.model';
import { ReservationService } from '../../core/reservations/services/reservation.service';
import { MyTripsResponse, ReservationResponse } from '../../core/reservations/models/reservation.model';
import { TargetType } from '../../core/feedback/models/feedback.model';
import { AuthService } from '../../core/auth/services/auth.service';
import { cpfValidator, birthDateValidator, formatCpf } from '../../shared/validators/custom-validators';
import { findLocalImage } from '../destinations/services/destinations.service';

import { PlaneLoaderComponent } from '../../shared/components/plane-loader/plane-loader.component';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent, FeedbackModalComponent, TicketComponent, PlaneLoaderComponent, DatePickerComponent, DatePipe],
  template: `
    <app-navbar></app-navbar>

    <!-- Top Hero Banner (cima-usuario.png - igual nas outras páginas) -->
    <header class="hero-container position-relative overflow-hidden">
      <img 
        src="assets/cima-usuario.png" 
        alt="Horizon Usuário" 
        class="w-100 hero-image"
        fetchpriority="high"
      />
    </header>

    <!-- Floating Toast Notifications (Clean & Modern) -->
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @if (successMessage()) {
        <div class="custom-toast toast-success shadow-lg">
          <div class="toast-icon-box text-white" style="background-color: #65A30D;">
            <i class="bi bi-check-lg fs-5"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold text-dark small">Sucesso</div>
            <div class="text-secondary small">{{ successMessage() }}</div>
          </div>
          <button type="button" class="btn-close btn-sm ms-2" (click)="successMessage.set(null)" aria-label="Fechar"></button>
        </div>
      }
      @if (errorMessage()) {
        <div class="custom-toast toast-error shadow-lg">
          <div class="toast-icon-box bg-danger text-white">
            <i class="bi bi-exclamation-triangle-fill fs-5"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold text-danger small">Atenção</div>
            <div class="text-secondary small">{{ errorMessage() }}</div>
          </div>
          <button type="button" class="btn-close btn-sm ms-2" (click)="errorMessage.set(null)" aria-label="Fechar"></button>
        </div>
      }
    </div>

    <!-- Container Principal do Usuário (Fundo Suave Inspirado no Figma) -->
    <div class="user-layout-bg py-4 py-md-5">
      <div class="container-fluid px-3 px-xl-5">
        <div class="row g-4">
          
          <!-- ============================================== -->
          <!-- BARRA LATERAL ESQUERDA (FIGMA SPEC) -->
          <!-- ============================================== -->
          <aside class="col-12 col-md-4 col-lg-3">
            <div class="sidebar-card shadow-sm p-4">
              
              <!-- Topo: Avatar e Nome do Usuário -->
              <div class="text-center pb-2 mb-3">
                <div class="avatar-wrapper mx-auto mb-3">
                  <div class="avatar-circle">
                    @if (user()?.profileImageUrl) {
                      <img [src]="user()!.profileImageUrl!" [alt]="user()!.name" />
                    } @else {
                      <img src="assets/default-avatar.webp" [alt]="user()?.name || 'Usuário'" />
                    }
                    @if (isUploadingImage()) {
                      <div class="avatar-loading-overlay">
                        <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                      </div>
                    }
                  </div>
                  <!-- Botão de Upload de Foto com ícone Horizon -->
                  <button 
                    type="button" 
                    class="avatar-camera-btn" 
                    (click)="heroFileInput.click()" 
                    [disabled]="isUploadingImage()"
                    title="Alterar foto de perfil"
                  >
                    <img src="assets/avatar-badge.webp?v=2" alt="Alterar foto" class="avatar-badge-icon" />
                  </button>
                  <input #heroFileInput type="file" class="d-none" accept="image/*" (change)="onFileSelected($event)" />
                </div>

                <h2 class="sidebar-user-name mb-1">
                  {{ user()?.name?.toUpperCase() || 'GABRIEL SANTANA' }}
                </h2>
                @if (user()?.socialName) {
                  <span class="social-name-tag px-3 py-1 fw-semibold d-inline-block">
                    {{ user()?.socialName }}
                  </span>
                }
              </div>

              <!-- Menu 1: Horizon -->
              <div class="menu-section mb-3">
                <button 
                  type="button" 
                  class="menu-group-btn d-flex justify-content-between align-items-center w-100"
                  (click)="toggleHorizonMenu()"
                >
                  <span class="fw-bold">Horizon</span>
                  <i class="bi" [class.bi-chevron-down]="!isHorizonMenuOpen()" [class.bi-chevron-up]="isHorizonMenuOpen()"></i>
                </button>

                @if (isHorizonMenuOpen()) {
                  <div class="menu-items-list mt-2 d-flex flex-column gap-1">
                    <button 
                      type="button" 
                      class="menu-item-link text-start" 
                      [class.active]="activeView() === 'dashboard'"
                      (click)="setActiveView('dashboard')"
                    >
                      Painel Geral
                    </button>

                    <button 
                      type="button" 
                      class="menu-item-link text-start d-flex justify-content-between align-items-center" 
                      [class.active]="activeView() === 'trips'"
                      (click)="setActiveView('trips')"
                    >
                      <span>Minhas Reservas</span>
                      @if (pendingCount() > 0) {
                        <span class="horizon-tag-blue px-2 py-0 small">{{ pendingCount() }}</span>
                      }
                    </button>

                    <a routerLink="/destinations" class="menu-item-link">
                      Conheça mais sobre nós
                    </a>

                    <a routerLink="/quiz" class="menu-item-link">
                      Quiz
                    </a>

                    <a routerLink="/recommendations" class="menu-item-link">
                      Recomendações
                    </a>
                  </div>
                }
              </div>

              <!-- Menu 2: Dados e preferências -->
              <div class="menu-section pt-2 mb-3">
                <button 
                  type="button" 
                  class="menu-group-btn d-flex justify-content-between align-items-center w-100"
                  (click)="toggleDadosMenu()"
                >
                  <span class="fw-bold">Dados e preferências</span>
                  <i class="bi" [class.bi-chevron-down]="!isDadosMenuOpen()" [class.bi-chevron-up]="isDadosMenuOpen()"></i>
                </button>

                @if (isDadosMenuOpen()) {
                  <div class="menu-items-list mt-2 d-flex flex-column gap-1">
                    <button 
                      type="button" 
                      class="menu-item-link text-start" 
                      [class.active]="activeView() === 'personal-info'"
                      (click)="setActiveView('personal-info')"
                    >
                      Informações Pessoais
                    </button>

                    <button 
                      type="button" 
                      class="menu-item-link text-start" 
                      [class.active]="activeView() === 'payments'"
                      (click)="setActiveView('payments')"
                    >
                      Formas de Pagamento
                    </button>

                    <button 
                      type="button" 
                      class="menu-item-link text-start" 
                      [class.active]="activeView() === 'privacy'"
                      (click)="setActiveView('privacy')"
                    >
                      Política de Privacidade
                    </button>

                    <button 
                      type="button" 
                      class="menu-item-link text-start text-danger" 
                      (click)="openDeactivateModal()"
                    >
                      Excluir Conta
                    </button>
                  </div>
                }
              </div>

              <!-- Ações Rápidas no Rodapé da Sidebar -->
              <div class="pt-2 d-flex flex-column gap-2">
                <button 
                  type="button" 
                  class="sidebar-btn-evaluate w-100 fw-semibold"
                  (click)="openPlatformFeedback()"
                >
                  Avaliar Plataforma
                </button>

                <button 
                  type="button" 
                  class="sidebar-btn-logout w-100 fw-semibold"
                  (click)="logout()"
                >
                  Sair da Conta
                </button>
              </div>

            </div>
          </aside>

          <!-- ============================================== -->
          <!-- ÁREA DE CONTEÚDO PRINCIPAL (DIREITA) -->
          <!-- ============================================== -->
          <main class="col-12 col-md-8 col-lg-9" [class.dashboard-main-col]="activeView() === 'dashboard'">
            
            <!-- -------------------------------------------- -->
            <!-- VIEW 1: PAINEL GERAL (FIGMA SCREEN 1) -->
            <!-- -------------------------------------------- -->
            @if (activeView() === 'dashboard') {
              <div class="view-container dashboard-top">
                
                <h1 class="view-header-title mb-4">Painel</h1>

                <!-- BANNER DO MEIO (meio-usuarios.png) -->
                <img 
                  src="assets/meio-usuarios.png" 
                  alt="Horizon Painel" 
                  class="dashboard-main-banner mb-2 d-block" 
                />

              </div>
            }

            <!-- -------------------------------------------- -->
            <!-- VIEW 2: INFORMAÇÕES PESSOAIS (FIGMA SCREEN 2) -->
            <!-- -------------------------------------------- -->
            @if (activeView() === 'personal-info') {
              <div class="view-container">
                
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h1 class="view-header-title mb-0">Informações Pessoais</h1>
                  <button 
                    type="button" 
                    class="btn btn-outline-secondary btn-sm px-3 rounded-2"
                    (click)="setActiveView('dashboard')"
                  >
                    Voltar ao Painel
                  </button>
                </div>

                <!-- CARD TABELA DE DADOS PESSOAIS (REPRODUÇÃO FIEL AO FIGMA SCREEN 2) -->
                <div class="figma-white-card p-4 p-md-5 mb-4 shadow-sm">
                  
                  <!-- Bloco 1: Suas informações pessoais -->
                  <h4 class="figma-table-subtitle mb-3">Suas informações pessoais</h4>

                  <div class="info-rows-container mb-4">
                    <!-- Nome -->
                    <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                      <span class="info-item-label">Nome</span>
                      <span class="info-item-value text-uppercase">{{ user()?.name || '-' }}</span>
                      <button type="button" class="btn btn-figma-mini-edit" (click)="startEditing()">Editar</button>
                    </div>

                    <!-- Nome Social (se houver) -->
                    @if (user()?.socialName) {
                      <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                        <span class="info-item-label">Nome Social</span>
                        <span class="info-item-value">{{ user()?.socialName }}</span>
                        <button type="button" class="btn btn-figma-mini-edit" (click)="startEditing()">Editar</button>
                      </div>
                    }

                    <!-- Endereço de e-mail -->
                    <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                      <span class="info-item-label">Endereço de e-mail</span>
                      <span class="info-item-value">{{ user()?.email || '-' }}</span>
                      <button type="button" class="btn btn-figma-mini-edit" (click)="startEditing()">Editar</button>
                    </div>

                    <!-- Data de Nascimento (sem botão de editar) -->
                    <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                      <span class="info-item-label">Data de Nascimento</span>
                      <span class="info-item-value">{{ (user()?.birthDate | date:'dd/MM/yyyy') || '-' }}</span>
                    </div>

                    <!-- CPF (sem botão de editar) -->
                    <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                      <span class="info-item-label">CPF</span>
                      <span class="info-item-value font-monospace">{{ formattedCpf() }}</span>
                    </div>
                  </div>

                  <!-- Bloco 2: Seus dados de contato -->
                  <h4 class="figma-table-subtitle mb-3">Seus dados de contato</h4>

                  <div class="info-rows-container mb-4">
                    <!-- Endereço de e-mail -->
                    <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                      <span class="info-item-label">Endereço de e-mail</span>
                      <span class="info-item-value">{{ user()?.email || '-' }}</span>
                      <button type="button" class="btn btn-figma-mini-edit" (click)="startEditing()">Editar</button>
                    </div>

                    <!-- Telefone -->
                    <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                      <span class="info-item-label">Telefone</span>
                      <span class="info-item-value">(11) 98765-4321</span>
                      <button type="button" class="btn btn-figma-mini-edit" (click)="startEditing()">Editar</button>
                    </div>

                    <!-- Endereço / Região -->
                    <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                      <span class="info-item-label">País de Residência</span>
                      <span class="info-item-value">Brasil</span>
                      <button type="button" class="btn btn-figma-mini-edit" (click)="startEditing()">Editar</button>
                    </div>

                    <!-- Orçamento cadastrado -->
                    @if (user()?.budgetPerPerson) {
                      <div class="info-item-row py-3 d-flex justify-content-between align-items-center">
                        <span class="info-item-label">Orçamento por Pessoa</span>
                        <span class="info-item-value fw-bold text-horizon">{{ formatCurrency(user()?.budgetPerPerson) }}</span>
                        <button type="button" class="btn btn-figma-mini-edit" (click)="startEditing()">Editar</button>
                      </div>
                    }
                  </div>

                  <!-- Botão de Ação -->
                  @if (!isEditingPersonalInfo()) {
                    <div class="d-flex justify-content-end">
                      <button type="button" class="btn btn-figma-blue px-4 py-2 rounded-3 fw-semibold shadow-sm" (click)="startEditing()">
                        <i class="bi bi-pencil-square me-1"></i> Abrir Formulário de Edição
                      </button>
                    </div>
                  }

                </div>

                <!-- FORMULÁRIO COMPLETO COM UPLOAD DE FOTO (SE ATIVO) -->
                @if (isEditingPersonalInfo()) {
                  <div class="figma-white-card p-4 p-md-5 mb-4 shadow-sm border-primary">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h3 class="h5 fw-bold text-dark mb-0">Atualizar Dados</h3>
                      </div>
                      <button type="button" class="btn-close" (click)="cancelEditing()" aria-label="Fechar"></button>
                    </div>

                    <!-- Upload de Foto de Perfil no Formulário -->
                    <div class="d-flex align-items-center gap-4 p-3 rounded-4 bg-light border mb-4">
                      <div class="avatar-form-preview shadow-sm">
                        @if (user()?.profileImageUrl) {
                          <img [src]="user()!.profileImageUrl!" [alt]="user()!.name" />
                        } @else {
                          <img src="assets/default-avatar.webp" [alt]="user()?.name || 'Usuário'" />
                        }
                      </div>
                      <div class="flex-grow-1">
                        <strong class="d-block text-dark small mb-2">Foto de Perfil</strong>
                        <div class="d-flex gap-2 flex-wrap">
                          <input type="file" #formFileInput class="d-none" accept="image/*" (change)="onFileSelected($event)" />
                          <button 
                            type="button" 
                            class="btn btn-horizon btn-sm rounded-2 px-3 shadow-sm" 
                            (click)="formFileInput.click()" 
                            [disabled]="isUploadingImage()"
                          >
                            @if (isUploadingImage()) {
                              <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Enviando...
                            } @else {
                              <i class="bi bi-camera me-1"></i> Escolher Nova Foto
                            }
                          </button>
                          @if (user()?.profileImageUrl) {
                            <button type="button" class="btn btn-outline-danger btn-sm rounded-2 px-3" (click)="removeProfileImage()">
                              Remover Foto
                            </button>
                          }
                        </div>
                      </div>
                    </div>

                    <form [formGroup]="profileForm" (ngSubmit)="onSaveProfile()">
                      <div class="row g-3">
                        <div class="col-12 col-md-6">
                          <label class="form-label small fw-semibold text-secondary">Nome Completo</label>
                          <input type="text" formControlName="name" class="form-control rounded-3" />
                          @if (profileForm.get('name')?.invalid && profileForm.get('name')?.touched) {
                            <div class="text-danger small mt-1">Nome completo é obrigatório (mínimo 3 letras).</div>
                          }
                        </div>

                        <div class="col-12 col-md-6">
                          <label class="form-label small fw-semibold text-secondary">Nome Social</label>
                          <input type="text" formControlName="socialName" class="form-control rounded-3" placeholder="Como prefere ser chamado(a)" />
                        </div>

                        <div class="col-12 col-md-6">
                          <label class="form-label small fw-semibold text-secondary">E-mail</label>
                          <input type="email" formControlName="email" class="form-control rounded-3" />
                          @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
                            <div class="text-danger small mt-1">Informe um e-mail válido.</div>
                          }
                        </div>

                        <div class="col-12 col-md-6">
                          <label class="form-label small fw-semibold text-secondary">CPF</label>
                          <div class="position-relative">
                            <input 
                              type="text" 
                              formControlName="cpf" 
                              class="form-control rounded-3 font-monospace input-prohibited" 
                              readonly 
                            />
                            <span class="prohibited-lock-icon" title="Campo bloqueado para edição">
                              <i class="bi bi-lock-fill"></i>
                            </span>
                          </div>
                        </div>

                        <div class="col-12 col-md-6">
                          <label class="form-label small fw-semibold text-secondary">Data de Nascimento</label>
                          <app-date-picker
                            inputId="profileBirthDate"
                            formControlName="birthDate"
                          />
                        </div>
                      </div>

                      <div class="d-flex justify-content-end gap-2 mt-4 pt-3">
                        <button type="button" class="btn btn-light px-4 rounded-2" (click)="cancelEditing()">
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          class="btn btn-figma-blue px-4 rounded-2 fw-bold shadow-sm"
                          [disabled]="profileForm.invalid || isSavingProfile()"
                        >
                          @if (isSavingProfile()) {
                            <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Salvando...
                          } @else {
                            Salvar Alterações
                          }
                        </button>
                      </div>
                    </form>
                  </div>
                }

                <!-- POLÍTICA DE PRIVACIDADE NO RODAPÉ (FIGMA SCREEN 2) -->
                <div class="figma-white-card p-4 shadow-sm">
                  <h3 class="figma-box-title mb-2">Política de Privacidade</h3>
                  <p class="text-secondary small mb-4">
                    Seus dados pessoais e informações de pagamento são protegidos por criptografia de ponta a ponta e estão em total conformidade com a LGPD.
                  </p>
                  <div class="d-flex justify-content-end">
                    <button 
                      type="button" 
                      class="btn btn-figma-blue px-4 py-2 rounded-3 fw-semibold shadow-sm"
                      (click)="setActiveView('privacy')"
                    >
                      Ler política de privacidade
                    </button>
                  </div>
                </div>

              </div>
            }

            <!-- -------------------------------------------- -->
            <!-- VIEW 3: MINHAS VIAGENS E RESERVAS -->
            <!-- -------------------------------------------- -->
            @if (activeView() === 'trips') {
              <div class="view-container">
                
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h1 class="view-header-title mb-0">Minhas Reservas</h1>
                  <a routerLink="/flights" class="btn btn-horizon btn-sm px-4 py-2 rounded-2 fw-bold shadow-sm">
                    Buscar Novos Voos
                  </a>
                </div>

                <!-- FILTRO DE STATUS DAS RESERVAS (PADRONIZADO HORIZON) -->
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <div class="d-flex flex-wrap gap-2 p-1 bg-white rounded-3 shadow-sm">
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-2 px-3 py-2 fw-semibold border-0"
                      [class.btn-horizon]="tripsFilter() === 'all'"
                      [class.btn-light]="tripsFilter() !== 'all'"
                      (click)="tripsFilter.set('all')"
                    >
                      Todas ({{ allTripsCount() }})
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-2 px-3 py-2 fw-semibold border-0"
                      [class.btn-horizon]="tripsFilter() === 'pending'"
                      [class.btn-light]="tripsFilter() !== 'pending'"
                      (click)="tripsFilter.set('pending')"
                    >
                      Pendentes ({{ trips()?.pending?.length || 0 }})
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-2 px-3 py-2 fw-semibold border-0"
                      [class.btn-horizon]="tripsFilter() === 'confirmed'"
                      [class.btn-light]="tripsFilter() !== 'confirmed'"
                      (click)="tripsFilter.set('confirmed')"
                    >
                      Confirmadas ({{ trips()?.confirmed?.length || 0 }})
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-2 px-3 py-2 fw-semibold border-0"
                      [class.btn-horizon]="tripsFilter() === 'finished'"
                      [class.btn-light]="tripsFilter() !== 'finished'"
                      (click)="tripsFilter.set('finished')"
                    >
                      Concluídas ({{ trips()?.finished?.length || 0 }})
                    </button>
                    <button 
                      type="button" 
                      class="btn btn-sm rounded-2 px-3 py-2 fw-semibold border-0"
                      [class.btn-horizon]="tripsFilter() === 'cancelled'"
                      [class.btn-light]="tripsFilter() !== 'cancelled'"
                      (click)="tripsFilter.set('cancelled')"
                    >
                      Canceladas ({{ trips()?.cancelled?.length || 0 }})
                    </button>
                  </div>
                </div>

                <!-- LOADING -->
                @if (isLoadingTrips()) {
                  <div class="py-5">
                    <app-plane-loader></app-plane-loader>
                  </div>
                }

                <!-- LISTA VAZIA -->
                @else if (filteredReservations().length === 0) {
                  <div class="figma-white-card p-5 text-center shadow-sm">
                    <h3 class="h5 fw-bold mb-2" style="color: #5BA4D8;">Nenhuma viagem encontrada neste filtro</h3>
                    <p class="text-secondary small mb-4 col-md-6 mx-auto">
                      Você ainda não possui reservas nesta categoria.
                    </p>
                    <div class="d-flex justify-content-center gap-2">
                      <a routerLink="/flights" class="btn btn-horizon px-4 py-2 rounded-2 fw-bold shadow-sm">
                        Buscar Voos
                      </a>
                    </div>
                  </div>
                }

                <!-- CARDS DE RESERVAS COMPACTOS COM FOTO DO DESTINO -->
                @else {
                  <div class="d-flex flex-column gap-3">
                    @for (res of filteredReservations(); track res.reservationId) {
                      <article class="figma-white-card overflow-hidden shadow-sm trip-clean-card p-0">
                        <div class="row g-0 align-items-stretch">
                          
                          <!-- Esquerda: Foto Real do Destino -->
                          <div class="col-12 col-md-3">
                            <div class="trip-card-img-wrap h-100 position-relative overflow-hidden" (click)="openTripDetails(res)">
                              <img 
                                [src]="getDestinationImage(res.destinationName)" 
                                [alt]="res.destinationName || 'Destino'" 
                                class="w-100 h-100 object-fit-cover d-block"
                              />
                            </div>
                          </div>

                          <!-- Centro: Destino e Rotas Enxutas (Datas e Tipo no Modal) -->
                          <div class="col-12 col-md-5 p-3 p-md-4 d-flex flex-column justify-content-center">
                            <h3 class="h5 fw-bold text-dark mb-2">
                              {{ res.destinationName || 'Destino Horizon' }}
                            </h3>

                            @if (res.outboundFlight; as out) {
                              <div class="d-flex align-items-center gap-2 small mb-1">
                                <span class="fw-bold" style="color: #5BA4D8;">Ida:</span>
                                <span class="fw-semibold text-dark">{{ out.originAirportCode }} ➔ {{ out.destinationAirportCode }}</span>
                              </div>
                            }

                            @if (res.returnFlight; as ret) {
                              <div class="d-flex align-items-center gap-2 small mb-1">
                                <span class="fw-bold" style="color: #65A30D;">Volta:</span>
                                <span class="fw-semibold text-dark">{{ ret.originAirportCode }} ➔ {{ ret.destinationAirportCode }}</span>
                              </div>
                            }

                            <div class="mt-2">
                              <button 
                                type="button" 
                                class="btn btn-horizon btn-sm rounded-2 px-3 py-1 fw-semibold shadow-sm"
                                (click)="openTripDetails(res)"
                              >
                                Ver detalhes da viagem
                              </button>
                            </div>
                          </div>

                          <!-- Direita: Status, Valor Total e Pagar Agora x Cancelar -->
                          <div class="col-12 col-md-4 p-3 p-md-4 d-flex flex-column justify-content-between align-items-md-end bg-light bg-opacity-50">
                            <div class="text-md-end mb-3 mb-md-0">
                              <span class="small fw-bold d-block mb-1"
                                [style.color]="res.status === 'CONFIRMADA' || res.status === 'CONCLUIDA' ? '#65A30D' : (res.status === 'PENDENTE' ? '#5BA4D8' : '#94a3b8')">
                                {{ getStatusLabel(res.status) }}
                              </span>
                              <span class="fw-bold text-dark fs-5">{{ formatCurrency(res.totalAmount) }}</span>
                            </div>

                            <div class="d-flex align-items-center gap-2 flex-wrap justify-content-md-end w-100">
                              @if (res.status === 'PENDENTE') {
                                <a [routerLink]="['/checkout', res.reservationId]" class="btn btn-horizon btn-sm rounded-2 px-3 py-2 fw-bold shadow-sm">
                                  Pagar Agora
                                </a>
                                <button 
                                  type="button" 
                                  class="btn btn-link btn-sm text-danger text-decoration-none fw-semibold px-2"
                                  (click)="cancelReservation(res.reservationId)"
                                  [disabled]="isCancelling()[res.reservationId]"
                                >
                                  Cancelar
                                </button>
                              } @else if (canEvaluateTrip(res)) {
                                <button 
                                  type="button" 
                                  class="btn btn-horizon-green btn-sm rounded-2 px-3 py-2 fw-bold shadow-sm"
                                  (click)="openTripFeedback(res)"
                                >
                                  Avaliar
                                </button>
                              }
                            </div>
                          </div>

                        </div>
                      </article>
                    }
                  </div>
                }

              </div>
            }

            <!-- -------------------------------------------- -->
            <!-- VIEW 4: FORMAS DE PAGAMENTO -->
            <!-- -------------------------------------------- -->
            @if (activeView() === 'payments') {
              <div class="view-container">
                
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h1 class="view-header-title mb-0">Formas de Pagamento</h1>
                  <button 
                    type="button" 
                    class="btn btn-horizon btn-sm px-3 py-2 rounded-2 fw-semibold shadow-sm"
                    (click)="openAddCardModal()"
                  >
                    Novo Cartão
                  </button>
                </div>

                <!-- CARTEIRA SIMPLES E ENXUTA -->
                <div class="figma-white-card p-4 mb-4 shadow-sm">
                  <h3 class="figma-box-title mb-4">Meus Cartões</h3>

                  <div class="row g-4 align-items-center">
                    
                    <!-- Cartão de Crédito Visual Horizon -->
                    <div class="col-12 col-lg-6">
                      @if (activeSavedCard(); as currentCard) {
                        <div class="horizon-credit-card p-4 text-white position-relative overflow-hidden shadow">
                          
                          <!-- Marca d'água de Fundo: Avião Horizon -->
                          <svg class="horizon-card-watermark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M21,16 L21,14 L13,9 L13,3.5 C13,2.67 12.33,2 11.5,2 C10.67,2 10,2.67 10,3.5 L10,9 L2,14 L2,16 L10,13.5 L10,19 L8,20.5 L8,22 L11.5,21 L15,22 L15,20.5 L13,19 L13,13.5 L21,16 Z"/>
                          </svg>

                          <div class="d-flex justify-content-between align-items-start position-relative z-1 mb-4">
                            <div class="card-chip"></div>
                            <span class="fw-bold fs-5 tracking-wide">{{ currentCard.brand }}</span>
                          </div>

                          <div class="card-number-display font-monospace position-relative z-1 my-3">
                            •••• &nbsp;•••• &nbsp;•••• &nbsp;{{ currentCard.last4 }}
                          </div>

                          <div class="d-flex justify-content-between align-items-end position-relative z-1 mt-4">
                            <div>
                              <span class="d-block text-white-50" style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.8px;">Titular</span>
                              <strong class="text-uppercase" style="font-size: 0.92rem; letter-spacing: 0.5px;">
                                {{ currentCard.holder || user()?.name || 'GABRIEL SANTANA' }}
                              </strong>
                            </div>
                            <div class="text-end">
                              <span class="d-block text-white-50" style="font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.8px;">Validade</span>
                              <strong class="font-monospace" style="font-size: 0.92rem;">{{ currentCard.expiry }}</strong>
                            </div>
                          </div>

                        </div>
                      }
                    </div>

                    <!-- Lista Simples de Cartões Salvos -->
                    <div class="col-12 col-lg-6">
                      <div class="d-flex flex-column gap-2">
                        @for (card of savedCards(); track card.id) {
                          <div 
                            class="payment-card-selector p-3 rounded-3 d-flex justify-content-between align-items-center"
                            [class.active]="selectedCardId() === card.id"
                            (click)="selectSavedCard(card.id)"
                          >
                            <div>
                              <div class="d-flex align-items-center gap-2">
                                <strong class="text-dark small">{{ card.brand }} •••• {{ card.last4 }}</strong>
                                @if (card.isDefault) {
                                  <span class="horizon-tag-green px-2 py-0" style="font-size: 0.68rem; font-weight: 700;">Padrão</span>
                                }
                              </div>
                              <span class="text-secondary" style="font-size: 0.78rem;">Validade {{ card.expiry }}</span>
                            </div>

                            <div class="d-flex align-items-center gap-2" (click)="$event.stopPropagation()">
                              @if (!card.isDefault) {
                                <button 
                                  type="button" 
                                  class="btn btn-outline-horizon btn-sm rounded-2 px-2 py-1"
                                  style="font-size: 0.75rem;"
                                  (click)="setDefaultCard(card.id)"
                                >
                                  Tornar Padrão
                                </button>
                              }
                              @if (savedCards().length > 1) {
                                <button 
                                  type="button" 
                                  class="btn btn-outline-danger btn-sm rounded-2 px-2 py-1"
                                  style="font-size: 0.75rem;"
                                  (click)="removeSavedCard(card.id)"
                                >
                                  Remover
                                </button>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            }

            <!-- -------------------------------------------- -->
            <!-- VIEW 5: POLÍTICA DE PRIVACIDADE -->
            <!-- -------------------------------------------- -->
            @if (activeView() === 'privacy') {
              <div class="view-container">
                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h1 class="view-header-title mb-0">Política de Privacidade</h1>
                  <button type="button" class="btn btn-outline-secondary btn-sm px-3 rounded-2" (click)="setActiveView('dashboard')">
                    Voltar ao Painel
                  </button>
                </div>

                <div class="figma-white-card p-4 p-md-5 mb-4 shadow-sm">
                  <h3 class="figma-box-title mb-3">Compromisso de Privacidade Horizon</h3>
                  <p class="text-secondary lh-lg mb-3">
                    No Horizon, sua confiança é o alicerce de todas as jornadas que planejamos. Coletamos e processamos exclusivamente as informações estritamente necessárias para a prestação dos serviços de reserva, bilhetagem aérea, personalização por inteligência artificial e cumprimento de obrigações legais da aviação civil (ANAC).
                  </p>
                  
                  <h4 class="figma-table-subtitle mt-4 mb-2">1. Dados Pessoais Coletados</h4>
                  <p class="text-secondary small lh-base mb-3">
                    Nome completo, nome social, CPF, data de nascimento e e-mail para emissão legal dos bilhetes aéreos e identificação nos aeroportos.
                  </p>

                  <h4 class="figma-table-subtitle mt-4 mb-2">2. Direitos do Titular (LGPD)</h4>
                  <p class="text-secondary small lh-base mb-3">
                    Você tem total direito de consultar, retificar, limitar ou solicitar a exclusão de seus dados a qualquer momento diretamente através da seção de "Excluir Conta" ou editando suas preferências no painel.
                  </p>

                  <h4 class="figma-table-subtitle mt-4 mb-2">3. Segurança da Informação</h4>
                  <p class="text-secondary small lh-base mb-4">
                    Seus dados são protegidos por mecanismos robustos de segurança, incluindo firewalls avançados, certificados SSL/TLS modernos e controle restrito de privilégios.
                  </p>

                  <div class="d-flex justify-content-end">
                    <button type="button" class="btn btn-figma-blue px-4 py-2 rounded-3 fw-semibold shadow-sm" (click)="setActiveView('dashboard')">
                      Entendido, Voltar ao Painel
                    </button>
                  </div>
                </div>
              </div>
            }

          </main>

          <!-- ============================================== -->
          <!-- ÁREA LARGURA TOTAL DO PAINEL (OCUPA A ESQUERDA ABAIXO DA SIDEBAR) -->
          <!-- ============================================== -->
          @if (activeView() === 'dashboard') {
            <div class="col-12">

              <!-- BLOCO DO MEIO ÚNICO E ENXUTO: IMAGEM GRANDE DO DESTINO + BILHETE 3D -->
              @if (activeConfirmedTrip(); as currentTrip) {
                <div class="next-trip-showcase-card mb-4 p-4 shadow-sm">
                  
                  <!-- Barra Superior Enxuta com Picker Dropdown e Ações -->
                  <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                    <div class="d-flex align-items-center gap-3 flex-wrap">
                      <span class="horizon-tag-green px-3 py-1 fw-bold">
                        <i class="bi bi-check-circle-fill me-1"></i> Embarque Confirmado
                      </span>

                      <!-- Picker para alternar viagens sem poluir a tela -->
                      <div class="position-relative">
                        <button 
                          type="button" 
                          class="trip-picker-btn d-flex align-items-center gap-2 px-3 py-1"
                          (click)="toggleConfirmedPicker()"
                        >
                          <i class="bi bi-geo-alt-fill text-horizon"></i>
                          <span class="fw-bold text-dark">{{ currentTrip.destinationName }}</span>
                          @if ((trips()?.confirmed?.length || 0) > 1) {
                            <i class="bi bi-chevron-down small text-horizon ms-1"></i>
                          }
                        </button>

                        @if (isConfirmedPickerOpen() && (trips()?.confirmed?.length || 0) > 1) {
                          <div class="trip-picker-dropdown shadow-lg p-2">
                            <div class="small fw-bold text-secondary px-2 py-1">Escolher embarque:</div>
                            @for (cTrip of trips()!.confirmed; track cTrip.reservationId; let idx = $index) {
                              <button 
                                type="button" 
                                class="trip-picker-item w-100 text-start px-3 py-2 d-flex justify-content-between align-items-center"
                                [class.active]="selectedConfirmedIndex() === idx"
                                (click)="selectConfirmedTrip(idx)"
                              >
                                <span>
                                  <strong class="d-block">{{ cTrip.destinationName }}</strong>
                                  <small class="opacity-75">{{ cTrip.outboundFlight?.flightDate | date:'dd/MM/yyyy' }}</small>
                                </span>
                                @if (selectedConfirmedIndex() === idx) {
                                  <i class="bi bi-check2 fw-bold"></i>
                                }
                              </button>
                            }
                          </div>
                        }
                      </div>
                    </div>

                    <div class="d-flex gap-2 flex-wrap">
                      @if (currentTrip.tickets && currentTrip.tickets.length > 0) {
                        <button 
                          type="button" 
                          class="btn btn-outline-horizon btn-sm rounded-2 px-3 py-2 fw-semibold"
                          (click)="downloadTicket(currentTrip.tickets[0].ticketNumber)"
                        >
                          <i class="bi bi-download me-1"></i> Baixar PDF
                        </button>
                      }
                      <button 
                        type="button" 
                        class="btn btn-horizon btn-sm rounded-2 px-3 py-2 fw-semibold shadow-sm"
                        (click)="openTripDetails(currentTrip)"
                      >
                        Detalhes do Voo
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-outline-horizon btn-sm rounded-2 px-3 py-2 fw-semibold"
                        (click)="setActiveView('trips')"
                      >
                        Ver Reservas
                      </button>
                    </div>
                  </div>

                  <!-- Corpo Visual: Imagem do Destino (-184px no desktop) + Bilhete 3D (Direita) -->
                  <div class="row align-items-center g-4 showcase-body-row">
                    
                    <!-- Imagem do Destino -->
                    <div class="col-12 col-lg-8 showcase-img-col">
                      <div class="trip-visual-banner position-relative overflow-hidden rounded-3 shadow-sm" (click)="openTripDetails(currentTrip)">
                        <img 
                          [src]="getDestinationImage(currentTrip.destinationName)" 
                          [alt]="currentTrip.destinationName" 
                          class="w-100 h-100 object-fit-cover"
                        />
                        <div class="trip-visual-overlay p-4 d-flex flex-column justify-content-end">
                          <div class="text-white">
                            <h3 class="h3 fw-bold mb-1 text-white">{{ currentTrip.destinationName }}</h3>
                            <div class="d-flex align-items-center gap-2 small fw-semibold text-white">
                              <span>
                                {{ currentTrip.outboundFlight?.originAirportCode || 'GRU' }} ➔ {{ currentTrip.outboundFlight?.destinationAirportCode || 'DEST' }}
                              </span>
                              <span>•</span>
                              <span>{{ (currentTrip.outboundFlight?.flightDate | date:'dd/MM/yyyy') || 'Confirmado' }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Bilhete 3D (Sem Assento) -->
                    <div class="col-12 col-lg-4 showcase-ticket-col text-center">
                      <div class="ticket-3d-wrapper">
                        <app-ticket 
                          [passengerName]="(currentTrip.tickets && currentTrip.tickets[0]?.passengerName) || user()?.name || 'Passageiro'"
                          [ticketNumber]="(currentTrip.tickets && currentTrip.tickets[0]?.ticketNumber) || ('HZ-' + currentTrip.reservationId)"
                          [origin]="currentTrip.outboundFlight?.originAirportCode || 'GRU'"
                          [destination]="currentTrip.outboundFlight?.destinationAirportCode || 'GIG'"
                          [flightNumber]="currentTrip.outboundFlight?.flightNumber || 'HZ-402'"
                          [departureTime]="currentTrip.outboundFlight?.departureTime || '08:30'"
                          [arrivalTime]="currentTrip.outboundFlight?.arrivalTime || '17:45'"
                          [gate]="'B08'"
                          [date]="(currentTrip.outboundFlight?.flightDate | date:'dd/MM/yyyy') || ''">
                        </app-ticket>
                      </div>
                    </div>

                  </div>

                </div>
              }

              <!-- CARD 2 (FIGMA SPEC): RESUMO DO USUÁRIO -->
              <div class="figma-white-card p-4 p-md-4 mb-4 shadow-sm">
                <h2 class="figma-profile-name mb-3">
                  {{ user()?.name?.toUpperCase() || 'GABRIEL SANTANA' }}
                </h2>

                <div class="d-flex flex-column gap-2 mb-4">
                  <div class="d-flex align-items-center gap-2 text-secondary small">
                    <i class="bi bi-phone text-horizon fs-5"></i>
                    <span>(11) 98765-4321</span>
                  </div>
                  <div class="d-flex align-items-center gap-2 text-secondary small">
                    <i class="bi bi-envelope text-horizon fs-5"></i>
                    <span>{{ user()?.email }}</span>
                  </div>
                </div>

                <div class="d-flex justify-content-end">
                  <button 
                    type="button" 
                    class="btn btn-figma-blue px-4 py-2 rounded-3 fw-semibold shadow-sm"
                    (click)="setActiveView('personal-info')"
                  >
                    Editar minhas informações
                  </button>
                </div>
              </div>

              <!-- CARD 3 (FIGMA SPEC): POLÍTICA DE PRIVACIDADE -->
              <div class="figma-white-card p-4 mb-4 shadow-sm">
                <h3 class="figma-box-title mb-2">Política de Privacidade</h3>
                <p class="text-secondary small mb-4">
                  Seus dados pessoais e informações de pagamento são protegidos com criptografia de ponta a ponta e estão em total conformidade com a Lei Geral de Proteção de Dados (LGPD).
                </p>
                <div class="d-flex justify-content-end">
                  <button 
                    type="button" 
                    class="btn btn-figma-blue px-4 py-2 rounded-3 fw-semibold shadow-sm"
                    (click)="setActiveView('privacy')"
                  >
                    Ler política de privacidade
                  </button>
                </div>
              </div>

            </div>
          }

        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL 1: DETALHES DA VIAGEM & BILHETES (COMPACTO E LIMPO) -->
    <!-- ============================================== -->
    @if (selectedTripForDetails(); as trip) {
      <div class="modal-backdrop fade show" (click)="closeTripDetails()"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="closeTripDetails()">
        <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
            
            <!-- Header com Imagem do Destino -->
            <div class="modal-header border-0 p-0 position-relative overflow-hidden" style="height: 125px;">
              <img 
                [src]="getDestinationImage(trip.destinationName)" 
                [alt]="trip.destinationName" 
                class="w-100 h-100 object-fit-cover"
              />
              <div class="position-absolute inset-0 w-100 h-100 d-flex justify-content-between align-items-end p-4" style="background: linear-gradient(to top, rgba(11, 37, 69, 0.85), rgba(11, 37, 69, 0.2)); top: 0; left: 0;">
                <div class="text-white">
                  <h3 class="h4 fw-bold mb-0 text-white">{{ trip.destinationName }}</h3>
                  <span class="small text-white opacity-75">
                    {{ trip.returnFlight ? 'Ida e Volta' : 'Somente Ida' }} • Classe {{ trip.outboundFlight?.seatClass || 'Econômica' }}
                  </span>
                </div>
                <button type="button" class="btn-close btn-close-white mb-auto" (click)="closeTripDetails()" aria-label="Fechar"></button>
              </div>
            </div>

            <div class="modal-body p-4">
              
              <!-- Bloco Unificado de Voos (Ida e Volta) -->
              <div class="p-3 rounded-3 bg-light mb-3">
                @if (trip.outboundFlight; as out) {
                  <div class="d-flex justify-content-between align-items-center" [class.mb-3]="!!trip.returnFlight">
                    <div>
                      <span class="small fw-bold d-block" style="color: #5BA4D8; font-size: 0.75rem;">IDA • VOO {{ out.flightNumber }}</span>
                      <strong class="text-dark fs-6">{{ out.originAirportCode }} ➔ {{ out.destinationAirportCode }}</strong>
                    </div>
                    <div class="text-end">
                      <strong class="text-dark small d-block">{{ out.flightDate | date:'dd/MM/yyyy' }}</strong>
                      <span class="text-secondary small">{{ (out.departureTime || '').slice(0, 5) }} às {{ (out.arrivalTime || '').slice(0, 5) }}</span>
                    </div>
                  </div>
                }

                @if (trip.returnFlight; as ret) {
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <span class="small fw-bold d-block" style="color: #65A30D; font-size: 0.75rem;">VOLTA • VOO {{ ret.flightNumber }}</span>
                      <strong class="text-dark fs-6">{{ ret.originAirportCode }} ➔ {{ ret.destinationAirportCode }}</strong>
                    </div>
                    <div class="text-end">
                      <strong class="text-dark small d-block">{{ ret.flightDate | date:'dd/MM/yyyy' }}</strong>
                      <span class="text-secondary small">{{ (ret.departureTime || '').slice(0, 5) }} às {{ (ret.arrivalTime || '').slice(0, 5) }}</span>
                    </div>
                  </div>
                }

                <div class="mt-3 text-secondary" style="font-size: 0.78rem;">
                  Portão B08 • Terminal 3 • Bagagem de mão 10kg inclusa
                </div>
              </div>

              <!-- Passageiros e Download de PDF -->
              <div class="d-flex flex-column gap-2 mb-3">
                @if ((trip.status === 'CONFIRMADA' || trip.status === 'CONCLUIDA') && trip.tickets && trip.tickets.length > 0) {
                  @for (t of trip.tickets; track t.id) {
                    <div class="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                      <div>
                        <strong class="text-dark d-block small">{{ t.passengerName }}</strong>
                        <span class="font-monospace small fw-semibold" style="color: #5BA4D8; font-size: 0.8rem;">{{ t.ticketNumber }}</span>
                      </div>
                      <button 
                        type="button" 
                        class="btn btn-horizon btn-sm rounded-2 px-3 py-2 fw-bold shadow-sm" 
                        (click)="downloadTicket(t.ticketNumber)"
                      >
                        Baixar PDF
                      </button>
                    </div>
                  }
                } @else if (trip.passengers && trip.passengers.length > 0) {
                  @for (p of trip.passengers; track $index) {
                    <div class="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                      <div>
                        <strong class="text-dark d-block small">{{ p.name }}</strong>
                        <span class="text-secondary small" style="font-size: 0.78rem;">
                          @if (trip.status === 'PENDENTE') {
                            Bilhete liberado após pagamento
                          } @else if (trip.status === 'CANCELADA') {
                            Reserva cancelada
                          } @else {
                            Comprovante e Cartão de Embarque
                          }
                        </span>
                      </div>
                      @if (trip.status === 'CONFIRMADA' || trip.status === 'CONCLUIDA') {
                        <button 
                          type="button" 
                          class="btn btn-horizon btn-sm rounded-2 px-3 py-2 fw-bold shadow-sm" 
                          (click)="downloadTicket('RES-' + trip.reservationId)"
                        >
                          Baixar PDF
                        </button>
                      } @else if (trip.status === 'PENDENTE') {
                        <span class="small fw-bold" style="color: #5BA4D8;">Aguardando pagamento</span>
                      } @else {
                        <span class="small fw-semibold text-secondary">Indisponível</span>
                      }
                    </div>
                  }
                } @else {
                  <div class="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light">
                    <div>
                      <strong class="text-dark d-block small">Passagem da Viagem</strong>
                      <span class="text-secondary small" style="font-size: 0.78rem;">
                        @if (trip.status === 'PENDENTE') {
                          Bilhete liberado após pagamento
                        } @else if (trip.status === 'CANCELADA') {
                          Reserva cancelada
                        } @else {
                          Cartão de Embarque em PDF
                        }
                      </span>
                    </div>
                    @if (trip.status === 'CONFIRMADA' || trip.status === 'CONCLUIDA') {
                      <button 
                        type="button" 
                        class="btn btn-horizon btn-sm rounded-2 px-3 py-2 fw-bold shadow-sm" 
                        (click)="downloadTicket('RES-' + trip.reservationId)"
                      >
                        Baixar PDF
                      </button>
                    } @else if (trip.status === 'PENDENTE') {
                      <span class="small fw-bold" style="color: #5BA4D8;">Aguardando pagamento</span>
                    } @else {
                      <span class="small fw-semibold text-secondary">Indisponível</span>
                    }
                  </div>
                }
              </div>

              <div class="d-flex justify-content-between align-items-center pt-2">
                <button type="button" class="btn btn-light rounded-2 px-4 fw-semibold text-secondary" (click)="closeTripDetails()">
                  Fechar
                </button>
                @if (trip.status === 'PENDENTE') {
                  <a [routerLink]="['/checkout', trip.reservationId]" class="btn btn-horizon rounded-2 px-4 fw-bold shadow-sm" (click)="closeTripDetails()">
                    Pagar Agora
                  </a>
                } @else if (canEvaluateTrip(trip)) {
                  <button type="button" class="btn btn-horizon-green rounded-2 px-4 fw-bold shadow-sm" (click)="openTripFeedback(trip)">
                    Avaliar Viagem
                  </button>
                }
              </div>

            </div>

          </div>
        </div>
      </div>
    }

    <!-- ============================================== -->
    <!-- MODAL 2: CONFIRMAÇÃO DE DESATIVAÇÃO -->
    <!-- ============================================== -->
    @if (isDeactivateModalOpen()) {
      <div class="modal-backdrop fade show" (click)="closeDeactivateModal()"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="closeDeactivateModal()">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;" (click)="$event.stopPropagation()">
          <div class="modal-content border-0 shadow-lg rounded-3 p-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h2 class="h6 fw-bold text-dark mb-0">Desativar conta?</h2>
              <button type="button" class="btn-close small" (click)="closeDeactivateModal()" aria-label="Fechar"></button>
            </div>
            <p class="text-secondary small mb-4">
              Seu acesso à Horizon será encerrado. Caso tenha viagens futuras, salve seus bilhetes antes de continuar.
            </p>
            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-light btn-sm px-3 py-2 rounded-2 fw-semibold text-secondary" (click)="closeDeactivateModal()">
                Cancelar
              </button>
              <button 
                type="button" 
                class="btn btn-danger btn-sm px-3 py-2 rounded-2 fw-semibold"
                [disabled]="isDeactivating()"
                (click)="onConfirmDeactivate()"
              >
                @if (isDeactivating()) {
                  <span class="spinner-border spinner-border-sm me-1" role="status"></span> Desativando...
                } @else {
                  Desativar conta
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- ============================================== -->
    <!-- MODAL: CONFIRMAÇÃO DE CANCELAMENTO DE RESERVA -->
    <!-- ============================================== -->
    @if (reservationIdToCancel(); as cancelResId) {
      <div class="modal-backdrop fade show" (click)="closeCancelReservationModal()"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true" (click)="closeCancelReservationModal()">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px;" (click)="$event.stopPropagation()">
          <div class="modal-content border-0 shadow-lg rounded-3 p-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h2 class="h6 fw-bold text-dark mb-0">Cancelar reserva?</h2>
              <button type="button" class="btn-close small" (click)="closeCancelReservationModal()" aria-label="Fechar"></button>
            </div>
            <p class="text-secondary small mb-4">
              Deseja realmente cancelar esta reserva e liberar os assentos selecionados?
            </p>
            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-light btn-sm px-3 py-2 rounded-2 fw-semibold text-secondary" (click)="closeCancelReservationModal()">
                Voltar
              </button>
              <button 
                type="button" 
                class="btn btn-danger btn-sm px-3 py-2 rounded-2 fw-semibold"
                [disabled]="isCancelling()[cancelResId]"
                (click)="confirmCancelReservation()"
              >
                @if (isCancelling()[cancelResId]) {
                  <span class="spinner-border spinner-border-sm me-1" role="status"></span> Cancelando...
                } @else {
                  Cancelar reserva
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 3: FEEDBACK / NPS / CSAT -->
    <app-feedback-modal 
      [isOpen]="isFeedbackModalOpen()"
      [reservationId]="feedbackReservationId()"
      [destinationName]="feedbackDestinationName()"
      [initialTargetType]="feedbackTargetType()"
      (closed)="closeFeedbackModal()"
      (feedbackSubmitted)="onFeedbackSubmitted()"
    ></app-feedback-modal>

    <!-- ============================================== -->
    <!-- MODAL 4: ADICIONAR NOVO CARTÃO -->
    <!-- ============================================== -->
    @if (isAddCardModalOpen()) {
      <div class="modal-backdrop fade show" (click)="closeAddCardModal()"></div>
      <div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg rounded-3 overflow-hidden">
            <div class="modal-header border-0 px-4 py-3 text-white" style="background-color: #5BA4D8;">
              <h2 class="h6 fw-bold mb-0"><i class="bi bi-credit-card-2-front me-2"></i>Adicionar Cartão</h2>
              <button type="button" class="btn-close btn-close-white" (click)="closeAddCardModal()" aria-label="Fechar"></button>
            </div>
            <div class="modal-body p-4">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label small fw-semibold text-secondary">Bandeira</label>
                  <select class="form-select horizon-select" [value]="newCardBrand()" (change)="onNewCardBrandChange($event)">
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                    <option value="Elo">Elo</option>
                    <option value="Amex">American Express</option>
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label small fw-semibold text-secondary">Número do Cartão</label>
                  <input 
                    type="text" 
                    class="form-control rounded-2 font-monospace" 
                    placeholder="0000 0000 0000 0000" 
                    maxlength="19"
                    [value]="newCardNumber()"
                    (input)="onCardNumberInput($event)"
                  />
                </div>

                <div class="col-12 col-sm-7">
                  <label class="form-label small fw-semibold text-secondary">Nome no Cartão</label>
                  <input 
                    type="text" 
                    class="form-control rounded-2 text-uppercase" 
                    placeholder="GABRIEL SANTANA"
                    [value]="newCardHolder()"
                    (input)="onCardHolderInput($event)"
                  />
                </div>

                <div class="col-12 col-sm-5">
                  <label class="form-label small fw-semibold text-secondary">Validade (MM/AA)</label>
                  <input 
                    type="text" 
                    class="form-control rounded-2 font-monospace" 
                    placeholder="08/29" 
                    maxlength="5"
                    [value]="newCardExpiry()"
                    (input)="onCardExpiryInput($event)"
                  />
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4 pt-2">
                <button type="button" class="btn btn-light px-4 rounded-2 fw-semibold" (click)="closeAddCardModal()">
                  Cancelar
                </button>
                <button type="button" class="btn btn-horizon-green px-4 rounded-2 fw-bold shadow-sm" (click)="saveNewCard()">
                  Salvar Cartão
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Rodapé -->
    <app-footer></app-footer>
  `,
  styles: [`
    /* ========================================================
       HORIZON USER PANEL - CORES PADRÃO (#5BA4D8 e #65A30D)
       ======================================================== */
    .user-layout-bg {
      background-color: #eaf2f8;
      min-height: calc(100vh - 70px);
    }

    .text-horizon {
      color: #5BA4D8 !important;
    }

    .btn-horizon {
      background-color: #5BA4D8;
      color: #ffffff;
      border: 1px solid #5BA4D8;
      transition: all 0.2s ease;
    }

    .btn-horizon:hover {
      background-color: #4895CC;
      border-color: #4895CC;
      color: #ffffff;
    }

    .btn-horizon-green {
      background-color: #65A30D;
      color: #ffffff;
      border: 1px solid #65A30D;
      transition: all 0.2s ease;
    }

    .btn-horizon-green:hover {
      background-color: #558b0a;
      border-color: #558b0a;
      color: #ffffff;
    }

    .btn-outline-horizon {
      color: #5BA4D8;
      border: 1.5px solid #5BA4D8;
      background: transparent;
      transition: all 0.2s ease;
    }

    .btn-outline-horizon:hover {
      background-color: #5BA4D8;
      color: #ffffff;
    }

    /* Tags Retangulares Padrão Horizon (Zero Pills) */
    .horizon-tag-blue {
      background-color: #5BA4D8;
      color: #ffffff;
      border-radius: 6px;
      display: inline-block;
    }

    .horizon-tag-green {
      background-color: #65A30D;
      color: #ffffff;
      border-radius: 6px;
      display: inline-block;
    }

    /* Botão Azul Oficial do Figma */
    .btn-figma-blue {
      background-color: #5BA4D8;
      color: #ffffff;
      border: none;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .btn-figma-blue:hover {
      background-color: #4895CC;
      color: #ffffff;
      transform: translateY(-1px);
    }

    .btn-figma-mini-edit {
      background-color: #5BA4D8;
      color: #ffffff;
      border: none;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.25rem 0.85rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .btn-figma-mini-edit:hover {
      background-color: #4895CC;
      color: #ffffff;
    }

    /* ========================================================
       SIDEBAR ESQUERDA (FIGMA SPEC)
       ======================================================== */
    .sidebar-card {
      background: #ffffff;
      border: 1px solid #dbeafe;
      border-radius: 16px;
      position: relative;
    }

    .sidebar-user-name {
      color: #5BA4D8;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    .social-name-tag {
      background-color: #5BA4D8 !important;
      color: #ffffff !important;
      font-size: 0.82rem;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(91, 164, 216, 0.25);
    }

    .menu-group-btn {
      background-color: #5BA4D8;
      border: none;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      color: #ffffff;
      font-size: 0.95rem;
      cursor: pointer;
      text-align: left;
      transition: background-color 0.2s ease;
    }

    .menu-group-btn:hover {
      background-color: #4895CC;
      color: #ffffff;
    }

    .menu-item-link {
      background: transparent;
      border: none;
      color: #475569;
      font-size: 0.9rem;
      font-weight: 500;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .menu-item-link:hover {
      background: #f0f7fd;
      color: #0f172a;
    }

    .menu-item-link.active {
      background: #e1effa;
      color: #5BA4D8;
      font-weight: 700;
    }

    .sidebar-btn-evaluate {
      background-color: #5BA4D8;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.55rem 0.85rem;
      font-size: 0.88rem;
      transition: background-color 0.2s ease, transform 0.15s ease;
    }

    .sidebar-btn-evaluate:hover {
      background-color: #4895CC;
      color: #ffffff;
    }

    .sidebar-btn-logout {
      background-color: #fef2f2;
      color: #dc2626;
      border: none;
      border-radius: 8px;
      padding: 0.55rem 0.85rem;
      font-size: 0.88rem;
      transition: background-color 0.2s ease;
    }

    .sidebar-btn-logout:hover {
      background-color: #fee2e2;
      color: #b91c1c;
    }

    /* Avatar Elements */
    .avatar-wrapper {
      position: relative;
      width: 84px;
      height: 84px;
    }

    .avatar-circle {
      width: 84px;
      height: 84px;
      border-radius: 50%;
      background: #f0f7fd;
      color: #5BA4D8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(91, 164, 216, 0.2);
      border: 3px solid #ffffff;
      overflow: hidden;
      position: relative;
    }

    .avatar-circle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-loading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-camera-btn {
      position: absolute;
      bottom: 0;
      right: -2px;
      width: 24px;
      height: 24px;
      background: transparent;
      border: none;
      box-shadow: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: transform 0.2s ease;
    }

    .avatar-camera-btn:hover {
      transform: scale(1.12);
    }

    .avatar-badge-icon {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .avatar-form-preview {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: #f0f7fd;
      color: #5BA4D8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.7rem;
      font-weight: 700;
      border: 3px solid #e2e8f0;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar-form-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* ========================================================
       ÁREA DE CONTEÚDO PRINCIPAL (FIGMA SPEC)
       ======================================================== */
    .view-header-title {
      color: #5BA4D8;
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.3px;
    }

    /* Hero Section do Topo (cima-usuario.png - idêntico às outras páginas) */
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

    /* Banner do Meio do Painel */
    .dashboard-main-banner {
      width: calc(100% * 1171 / 1107) !important;
      max-width: none !important;
      margin-left: calc(-100% * 32 / 1107) !important;
      margin-right: calc(-100% * 32 / 1107) !important;
      height: auto;
      border-radius: 0 !important;
      box-shadow: none !important;
      border: none !important;
      display: block;
      /* Corta a margem com sombra que vem embutida no próprio PNG (32px de cada lado em 1171px) */
      clip-path: inset(0 calc(100% * 32 / 1171) round 12px);
    }

    /* Imagem do Painel alinhada à altura da barra lateral esquerda (desktop) */
    @media (min-width: 768px) {
      .dashboard-main-col {
        display: flex;
        flex-direction: column;
      }

      .dashboard-main-col > .dashboard-top {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .dashboard-top .dashboard-main-banner {
        flex: 1 1 0;
        height: 0;
        min-height: 0;
        object-fit: cover;
        object-position: center;
        margin-bottom: 0 !important;
      }
    }

    /* Card de Destaque da Próxima Viagem (Visual + Bilhete 3D) */
    .next-trip-showcase-card {
      background: #ffffff;
      border: 1.5px solid #5BA4D8;
      border-radius: 16px;
      transition: all 0.2s ease;
    }

    .trip-picker-btn {
      background: #f0f7fd;
      border: 1.5px solid #5BA4D8;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .trip-picker-btn:hover {
      background: #e1effa;
    }

    .trip-picker-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 260px;
      background: #ffffff;
      border: 1.5px solid #5BA4D8;
      border-radius: 10px;
      z-index: 50;
    }

    .trip-picker-item {
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #1e293b;
      transition: all 0.15s ease;
    }

    .trip-picker-item:hover {
      background: #f0f7fd;
    }

    .trip-picker-item.active {
      background: #5BA4D8;
      color: #ffffff;
    }

    .trip-visual-banner {
      height: 320px;
      cursor: pointer;
      border: 1.5px solid #5BA4D8;
    }

    @media (min-width: 992px) {
      .showcase-img-col {
        flex: 0 0 calc(66.666667% - 184px) !important;
        width: calc(66.666667% - 184px) !important;
        max-width: calc(66.666667% - 184px) !important;
      }

      .showcase-ticket-col {
        flex: 1 1 0 !important;
        width: auto !important;
        max-width: none !important;
      }
    }

    .trip-visual-banner img {
      transition: transform 0.35s ease;
    }

    .trip-visual-banner:hover img {
      transform: scale(1.04);
    }

    .trip-visual-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(11, 37, 69, 0.85) 0%, rgba(11, 37, 69, 0.18) 60%, rgba(11, 37, 69, 0.35) 100%);
    }

    .ticket-3d-wrapper {
      perspective: 1000px;
      display: flex;
      justify-content: center;
      padding: 0.25rem 0;
    }

    .horizon-select {
      border: 1.5px solid #5BA4D8;
      border-radius: 8px;
      font-weight: 600;
      color: #1e293b;
      box-shadow: none !important;
    }

    .horizon-select:focus {
      border-color: #65A30D;
    }

    .quick-res-preview {
      border-color: #dbeafe !important;
    }

    .quick-res-thumb {
      width: 88px;
      height: 76px;
      flex-shrink: 0;
    }

    .discover-visual-card {
      height: 136px;
      border: 1.5px solid #5BA4D8;
    }

    .discover-visual-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(11, 37, 69, 0.82) 0%, rgba(11, 37, 69, 0.1) 100%);
    }

    .spec-label {
      display: block;
      font-size: 0.72rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }

    .spec-value {
      display: block;
      font-size: 0.95rem;
      color: #0f172a;
      font-weight: 700;
    }

    /* Cards Brancos do Figma */
    .figma-white-card {
      background: #ffffff;
      border: 1px solid #dbeafe;
      border-radius: 16px;
    }

    .trip-clean-card {
      transition: all 0.2s ease;
    }

    .trip-clean-card:hover {
      border-color: #5BA4D8;
      box-shadow: 0 6px 18px rgba(91, 164, 216, 0.1) !important;
    }

    .trip-card-img-wrap {
      height: 155px;
      min-height: 150px;
      cursor: pointer;
      background: #0b2545;
    }

    .trip-card-img-wrap img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }

    @media (min-width: 768px) {
      .trip-card-img-wrap {
        height: 100%;
      }
    }

    .trip-card-img-wrap:hover img {
      transform: scale(1.04);
    }

    .figma-box-title {
      color: #5BA4D8;
      font-size: 1.15rem;
      font-weight: 700;
    }

    .figma-profile-name {
      color: #5BA4D8;
      font-size: 1.3rem;
      font-weight: 700;
      letter-spacing: -0.2px;
    }

    .figma-table-subtitle {
      color: #5BA4D8;
      font-size: 1.05rem;
      font-weight: 700;
    }

    /* Linhas da Tabela de Informações Pessoais */
    .info-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .info-item-label {
      color: #475569;
      font-size: 0.9rem;
      font-weight: 600;
      min-width: 140px;
    }

    .info-item-value {
      color: #0f172a;
      font-size: 0.95rem;
      flex-grow: 1;
    }

    @media (max-width: 576px) {
      .info-item-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.4rem;
      }
      .info-item-row .btn-figma-mini-edit {
        align-self: flex-end;
      }
    }

    /* Modal Hero */
    .modal-hero-header {
      background: #5BA4D8;
    }

    .next-trip-banner {
      background: #5BA4D8;
    }

    /* Toast Notifications */
    .toast-container {
      position: fixed;
      top: 5rem;
      right: 1.5rem;
      z-index: 2050;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      pointer-events: none;
    }

    .custom-toast {
      pointer-events: auto;
      background: #ffffff;
      border-radius: 10px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
      padding: 0.9rem 1.2rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      border: 1px solid #e2e8f0;
      animation: slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .toast-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .custom-toast.toast-success {
      border-left: 5px solid #65A30D;
    }

    .custom-toast.toast-error {
      border-left: 5px solid #ef4444;
    }

    @keyframes slideInToast {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .input-prohibited,
    .input-prohibited:disabled,
    .input-prohibited[readonly] {
      background-color: #f1f5f9 !important;
      border-color: #cbd5e1 !important;
      color: #64748b !important;
      cursor: not-allowed !important;
      padding-right: 2.25rem;
      box-shadow: none !important;
    }

    .prohibited-lock-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 0.85rem;
      pointer-events: none;
    }

    /* ========================================================
       FORMAS DE PAGAMENTO (VISUAL CARD + SELETORES HORIZON)
       ======================================================== */
    .horizon-credit-card {
      background-color: #5BA4D8;
      border-radius: 16px;
      min-height: 205px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .horizon-credit-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(91, 164, 216, 0.32) !important;
    }

    .horizon-card-watermark {
      position: absolute;
      right: -18px;
      bottom: -22px;
      width: 175px;
      height: 175px;
      color: rgba(255, 255, 255, 0.14);
      transform: rotate(-28deg);
      pointer-events: none;
    }

    .card-chip {
      width: 42px;
      height: 30px;
      border-radius: 6px;
      background: linear-gradient(135deg, #fde047 0%, #eab308 100%);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    .card-number-display {
      font-size: 1.25rem;
      letter-spacing: 2px;
      font-weight: 700;
      color: #ffffff;
    }

    .payment-card-selector {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .payment-card-selector:hover {
      background: #f0f7fd;
      border-color: #5BA4D8;
    }

    .payment-card-selector.active {
      background: #f0f7fd;
      border-color: #5BA4D8;
      box-shadow: 0 4px 12px rgba(91, 164, 216, 0.14);
    }

    .payment-icon-box {
      width: 40px;
      height: 40px;
      background: #e1effa;
      color: #5BA4D8;
    }

    .method-choice-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .method-choice-card:hover {
      background: #ffffff;
      border-color: #5BA4D8;
    }

    .method-choice-card.selected-blue {
      background: #f0f7fd;
      border-color: #5BA4D8;
      box-shadow: 0 4px 12px rgba(91, 164, 216, 0.14);
    }

    .method-choice-card.selected-green {
      background: #f4fce8;
      border-color: #65A30D;
      box-shadow: 0 4px 12px rgba(101, 163, 13, 0.14);
    }

    .method-badge-blue {
      width: 46px;
      height: 46px;
      background: #5BA4D8;
      color: #ffffff;
      flex-shrink: 0;
    }

    .method-badge-green {
      width: 46px;
      height: 46px;
      background: #65A30D;
      color: #ffffff;
      flex-shrink: 0;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private router = inject(Router);

  user = signal<UserProfile | null>(null);
  trips = signal<MyTripsResponse | null>(null);

  // Navegação inspirada no Figma
  activeView = signal<'dashboard' | 'personal-info' | 'trips' | 'payments' | 'privacy'>('dashboard');
  isHorizonMenuOpen = signal<boolean>(true);
  isDadosMenuOpen = signal<boolean>(true);
  isEditingPersonalInfo = signal<boolean>(false);

  // Pickers interativos do Painel
  selectedConfirmedIndex = signal<number>(0);
  isConfirmedPickerOpen = signal<boolean>(false);
  selectedQuickReservationId = signal<number | null>(null);

  // Estado de Formas de Pagamento
  savedCards = signal<Array<{ id: number; brand: string; last4: string; holder: string; expiry: string; isDefault: boolean }>>([
    { id: 1, brand: 'Mastercard', last4: '4829', holder: '', expiry: '08/29', isDefault: true },
    { id: 2, brand: 'Visa', last4: '9104', holder: '', expiry: '11/28', isDefault: false }
  ]);
  selectedCardId = signal<number>(1);
  preferredPaymentMethod = signal<'CARD' | 'PIX'>('CARD');
  isAddCardModalOpen = signal<boolean>(false);
  newCardBrand = signal<string>('Mastercard');
  newCardNumber = signal<string>('');
  newCardHolder = signal<string>('');
  newCardExpiry = signal<string>('');

  activeSavedCard = computed(() => {
    const cards = this.savedCards();
    const found = cards.find(c => c.id === this.selectedCardId());
    return found || cards[0] || null;
  });

  tripsFilter = signal<'all' | 'pending' | 'confirmed' | 'finished' | 'cancelled'>('all');

  isLoadingProfile = signal(true);
  isLoadingTrips = signal(true);
  isSavingProfile = signal(false);
  isUploadingImage = signal(false);
  isDeactivating = signal(false);
  isCancelling = signal<Record<number, boolean>>({});

  isDeactivateModalOpen = signal(false);
  selectedTripForDetails = signal<ReservationResponse | null>(null);

  // Feedback Modal
  isFeedbackModalOpen = signal(false);
  feedbackReservationId = signal<number | null>(null);
  feedbackDestinationName = signal<string | null>(null);
  feedbackTargetType = signal<TargetType>('PLATFORM');

  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  private toastTimeout: any = null;

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    socialName: [''],
    email: ['', [Validators.required, Validators.email]],
    cpf: [{ value: '', disabled: true }, [Validators.required, cpfValidator()]],
    birthDate: [{ value: '', disabled: true }, [Validators.required, birthDateValidator(18)]],
    profileImageUrl: ['']
  });

  formattedCpf = computed(() => {
    const raw = this.user()?.cpf;
    return raw ? formatCpf(raw) : '-';
  });

  pendingCount = computed(() => this.trips()?.pending?.length || 0);

  allTripsCount = computed(() => {
    const t = this.trips();
    if (!t) return 0;
    return (t.pending?.length || 0) + (t.confirmed?.length || 0) + (t.finished?.length || 0) + (t.cancelled?.length || 0);
  });

  nextConfirmedTrip = computed(() => {
    const confirmed = this.trips()?.confirmed;
    if (!confirmed || confirmed.length === 0) return null;
    return confirmed[0];
  });

  activeConfirmedTrip = computed(() => {
    const confirmed = this.trips()?.confirmed;
    if (!confirmed || confirmed.length === 0) return null;
    const idx = this.selectedConfirmedIndex();
    return confirmed[idx] || confirmed[0];
  });

  allReservationsList = computed<ReservationResponse[]>(() => {
    const t = this.trips();
    if (!t) return [];
    return [
      ...(t.pending || []),
      ...(t.confirmed || []),
      ...(t.finished || []),
      ...(t.cancelled || [])
    ];
  });

  selectedQuickReservation = computed<ReservationResponse | null>(() => {
    const list = this.allReservationsList();
    if (list.length === 0) return null;
    const id = this.selectedQuickReservationId();
    if (id !== null) {
      const found = list.find(r => r.reservationId === id);
      if (found) return found;
    }
    return list[0];
  });

  filteredReservations = computed<ReservationResponse[]>(() => {
    const t = this.trips();
    if (!t) return [];

    switch (this.tripsFilter()) {
      case 'pending': return t.pending || [];
      case 'confirmed': return t.confirmed || [];
      case 'finished': return t.finished || [];
      case 'cancelled': return t.cancelled || [];
      case 'all':
      default:
        return [
          ...(t.pending || []),
          ...(t.confirmed || []),
          ...(t.finished || []),
          ...(t.cancelled || [])
        ];
    }
  });

  viewingTicket = signal<string | null>(null);

  toggleConfirmedPicker(): void {
    this.isConfirmedPickerOpen.update(v => !v);
  }

  selectConfirmedTrip(index: number): void {
    this.selectedConfirmedIndex.set(index);
    this.isConfirmedPickerOpen.set(false);
  }

  onSelectQuickReservation(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const val = Number(selectEl.value);
    if (!isNaN(val)) {
      this.selectedQuickReservationId.set(val);
    }
  }

  selectSavedCard(id: number): void {
    this.selectedCardId.set(id);
  }

  setDefaultCard(id: number): void {
    this.savedCards.update(cards => cards.map(c => ({ ...c, isDefault: c.id === id })));
    this.selectedCardId.set(id);
    this.showSuccess('Cartão principal atualizado!');
  }

  removeSavedCard(id: number): void {
    this.savedCards.update(cards => {
      const remaining = cards.filter(c => c.id !== id);
      if (remaining.length > 0 && !remaining.some(c => c.isDefault)) {
        remaining[0].isDefault = true;
      }
      return [...remaining];
    });
    const current = this.savedCards();
    if (current.length > 0) {
      this.selectedCardId.set(current[0].id);
    }
    this.showSuccess('Cartão removido com sucesso.');
  }

  setPreferredPaymentMethod(method: 'CARD' | 'PIX'): void {
    this.preferredPaymentMethod.set(method);
    this.showSuccess(method === 'PIX' ? 'PIX Instantâneo definido como preferência no checkout.' : 'Cartão de Crédito definido como preferência no checkout.');
  }

  openAddCardModal(): void {
    this.newCardBrand.set('Mastercard');
    this.newCardNumber.set('');
    this.newCardHolder.set(this.user()?.name?.toUpperCase() || '');
    this.newCardExpiry.set('');
    this.isAddCardModalOpen.set(true);
  }

  closeAddCardModal(): void {
    this.isAddCardModalOpen.set(false);
  }

  onNewCardBrandChange(event: Event): void {
    this.newCardBrand.set((event.target as HTMLSelectElement).value);
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    input.value = formatted;
    this.newCardNumber.set(formatted);
  }

  onCardHolderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newCardHolder.set(input.value.toUpperCase());
  }

  onCardExpiryInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    input.value = formatted;
    this.newCardExpiry.set(formatted);
  }

  saveNewCard(): void {
    const rawDigits = this.newCardNumber().replace(/\D/g, '');
    if (rawDigits.length < 13 || this.newCardExpiry().length < 5) {
      this.showError('Preencha os dígitos do cartão e a validade (MM/AA).');
      return;
    }
    const last4 = rawDigits.slice(-4);
    const newId = Date.now();
    this.savedCards.update(cards => [
      ...cards,
      {
        id: newId,
        brand: this.newCardBrand(),
        last4,
        holder: this.newCardHolder() || this.user()?.name?.toUpperCase() || 'TITULAR',
        expiry: this.newCardExpiry(),
        isDefault: cards.length === 0
      }
    ]);
    this.selectedCardId.set(newId);
    this.isAddCardModalOpen.set(false);
    this.showSuccess('Novo cartão adicionado com sucesso!');
  }

  getDestinationImage(destinationName?: string | null): string {
    if (destinationName) {
      const local = findLocalImage(destinationName, destinationName);
      if (local) return local;
    }
    return 'assets/Horizon 1.webp';
  }

  setActiveView(view: 'dashboard' | 'personal-info' | 'trips' | 'payments' | 'privacy'): void {
    this.activeView.set(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleHorizonMenu(): void {
    this.isHorizonMenuOpen.update(v => !v);
  }

  toggleDadosMenu(): void {
    this.isDadosMenuOpen.update(v => !v);
  }

  startEditing(): void {
    this.isEditingPersonalInfo.set(true);
    setTimeout(() => {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }, 100);
  }

  cancelEditing(): void {
    this.isEditingPersonalInfo.set(false);
    this.resetProfileForm();
  }

  toggleTicketView(ticketNumber: string) {
    if (this.viewingTicket() === ticketNumber) {
      this.viewingTicket.set(null);
    } else {
      this.viewingTicket.set(ticketNumber);
    }
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadTrips();
  }

  showSuccess(msg: string) {
    this.errorMessage.set(null);
    this.successMessage.set(msg);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.successMessage() === msg) {
        this.successMessage.set(null);
      }
    }, 4500);
  }

  showError(msg: string) {
    this.successMessage.set(null);
    this.errorMessage.set(msg);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      if (this.errorMessage() === msg) {
        this.errorMessage.set(null);
      }
    }, 5500);
  }

  loadProfile(): void {
    this.isLoadingProfile.set(true);
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.user.set(profile);
        this.profileForm.patchValue({
          name: profile.name,
          socialName: profile.socialName || '',
          email: profile.email,
          cpf: formatCpf(profile.cpf),
          birthDate: profile.birthDate,
          profileImageUrl: profile.profileImageUrl || ''
        });
        this.isLoadingProfile.set(false);
      },
      error: (err) => {
        this.isLoadingProfile.set(false);
        this.showError(err.message || 'Falha ao carregar perfil do usuário.');
      }
    });
  }

  loadTrips(): void {
    this.isLoadingTrips.set(true);
    this.reservationService.getMyTrips().subscribe({
      next: (tripsData) => {
        this.trips.set(tripsData);
        this.isLoadingTrips.set(false);
      },
      error: (err) => {
        this.isLoadingTrips.set(false);
        this.showError(err.message || 'Falha ao carregar suas viagens.');
      }
    });
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const val = this.profileForm.getRawValue();
    const originalUser = this.user();
    const finalBirthDate = originalUser?.birthDate || val.birthDate!;
    const finalCpf = (originalUser?.cpf || val.cpf || '').replace(/\D/g, '');

    // Bloqueio estrito para menores de 18 anos
    if (finalBirthDate) {
      const bDate = new Date(finalBirthDate + 'T00:00:00');
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
      if (bDate > minAgeDate) {
        this.showError('Não é permitido cadastrar ou manter data de nascimento para menores de 18 anos.');
        return;
      }
    }

    this.isSavingProfile.set(true);

    const req: UserUpdateRequest = {
      name: val.name!,
      socialName: val.socialName || undefined,
      email: val.email!,
      cpf: finalCpf,
      birthDate: finalBirthDate,
      profileImageUrl: val.profileImageUrl || undefined
    };

    this.userService.updateProfile(req).subscribe({
      next: (updated) => {
        this.user.set(updated);
        this.isSavingProfile.set(false);
        this.isEditingPersonalInfo.set(false);
        this.showSuccess('Perfil atualizado com sucesso!');
      },
      error: (err) => {
        this.isSavingProfile.set(false);
        this.showError(err.message || 'Falha ao atualizar perfil.');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.isUploadingImage.set(true);

      this.userService.uploadProfilePicture(file).subscribe({
        next: (updated) => {
          this.user.set(updated);
          this.profileForm.patchValue({ profileImageUrl: updated.profileImageUrl });
          this.isUploadingImage.set(false);
          this.showSuccess('Foto de perfil atualizada com sucesso!');
        },
        error: (err) => {
          this.isUploadingImage.set(false);
          this.showError(err.message || 'Falha ao enviar imagem de perfil.');
        }
      });
    }
  }

  removeProfileImage() {
    this.profileForm.patchValue({ profileImageUrl: '' });
    this.onSaveProfile();
  }

  resetProfileForm(): void {
    const profile = this.user();
    if (profile) {
      this.profileForm.patchValue({
        name: profile.name,
        socialName: profile.socialName || '',
        email: profile.email,
        cpf: formatCpf(profile.cpf),
        birthDate: profile.birthDate,
        profileImageUrl: profile.profileImageUrl || ''
      });
    }
  }

  onCpfInput(event: any): void {
    const input = event.target as HTMLInputElement;
    input.value = formatCpf(input.value);
    this.profileForm.get('cpf')?.setValue(input.value, { emitEvent: false });
  }

  reservationIdToCancel = signal<number | null>(null);

  cancelReservation(reservationId: number): void {
    this.reservationIdToCancel.set(reservationId);
  }

  closeCancelReservationModal(): void {
    this.reservationIdToCancel.set(null);
  }

  confirmCancelReservation(): void {
    const reservationId = this.reservationIdToCancel();
    if (!reservationId) return;

    this.isCancelling.update(map => ({ ...map, [reservationId]: true }));
    this.reservationService.cancelReservation(reservationId).subscribe({
      next: () => {
        this.isCancelling.update(map => ({ ...map, [reservationId]: false }));
        this.reservationIdToCancel.set(null);
        this.showSuccess('Reserva cancelada com sucesso e assentos liberados.');
        this.loadTrips();
      },
      error: (err) => {
        this.isCancelling.update(map => ({ ...map, [reservationId]: false }));
        this.reservationIdToCancel.set(null);
        this.showError(err.message || 'Falha ao cancelar reserva.');
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
        this.showError('Falha ao baixar o bilhete em PDF.');
      }
    });
  }

  openTripDetails(trip: ReservationResponse): void {
    this.selectedTripForDetails.set(trip);
    if ((!trip.tickets || trip.tickets.length === 0) && (trip.status === 'CONFIRMADA' || trip.status === 'CONCLUIDA')) {
      this.reservationService.getTicketsByReservation(trip.reservationId).subscribe({
        next: (tickets) => {
          if (tickets && tickets.length > 0 && this.selectedTripForDetails()?.reservationId === trip.reservationId) {
            this.selectedTripForDetails.set({ ...trip, tickets });
          }
        },
        error: () => {}
      });
    }
  }

  closeTripDetails(): void {
    this.selectedTripForDetails.set(null);
    this.viewingTicket.set(null);
  }

  openPlatformFeedback(): void {
    this.feedbackTargetType.set('PLATFORM');
    this.feedbackReservationId.set(null);
    this.feedbackDestinationName.set(null);
    this.isFeedbackModalOpen.set(true);
  }

  canEvaluateTrip(trip: ReservationResponse): boolean {
    if (trip.status === 'CONCLUIDA') return true;
    if (trip.status !== 'CONFIRMADA') return false;

    const flightToCheck = (trip.tripType === 'ROUND_TRIP' || trip.returnFlight)
      ? trip.returnFlight
      : trip.outboundFlight;

    if (!flightToCheck?.flightDate) return false;

    const timePart = (flightToCheck.arrivalTime || flightToCheck.departureTime || '23:59:59').slice(0, 8);
    const flightEnd = new Date(`${flightToCheck.flightDate}T${timePart.length === 5 ? timePart + ':00' : timePart}`);
    return !isNaN(flightEnd.getTime()) && new Date() >= flightEnd;
  }

  openTripFeedback(trip: ReservationResponse): void {
    if (!this.canEvaluateTrip(trip)) {
      this.showError('A avaliação só estará disponível após a conclusão da viagem.');
      return;
    }
    this.feedbackTargetType.set('TRIP');
    this.feedbackReservationId.set(trip.reservationId);
    this.feedbackDestinationName.set(trip.destinationName || null);
    this.isFeedbackModalOpen.set(true);
  }

  closeFeedbackModal(): void {
    this.isFeedbackModalOpen.set(false);
  }

  onFeedbackSubmitted(): void {
    this.showSuccess('Obrigado pelo seu feedback!');
  }

  openDeactivateModal(): void {
    this.isDeactivateModalOpen.set(true);
  }

  closeDeactivateModal(): void {
    this.isDeactivateModalOpen.set(false);
  }

  onConfirmDeactivate(): void {
    this.isDeactivating.set(true);
    this.userService.deactivateAccount().subscribe({
      next: () => {
        this.isDeactivating.set(false);
        this.isDeactivateModalOpen.set(false);
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isDeactivating.set(false);
        this.showError(err.message || 'Falha ao desativar conta.');
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    const name = this.user()?.name || '';
    if (!name) return 'H';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'CONFIRMADA': return 'bg-success';
      case 'PENDENTE': return 'bg-warning text-dark';
      case 'CONCLUIDA': return 'bg-info text-dark';
      case 'CANCELADA': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CONFIRMADA': return 'Confirmada';
      case 'PENDENTE': return 'Aguardando Pagamento';
      case 'CONCLUIDA': return 'Viagem Concluída';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
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
