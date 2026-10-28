import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { BackToTopComponent } from '../../shared/components/back-to-top/back-to-top.component';
import { SupportService } from '../../core/support/services/support.service';
import { FaqCategoryCard, FaqItem, SupportSubjectOption, SupportTicketRequest, SupportTicketResponse } from '../../core/support/models/support.model';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserService } from '../../core/user/services/user.service';

export interface AttachedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  base64?: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NavbarComponent, FooterComponent, BackToTopComponent],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent implements OnInit {
  private supportService = inject(SupportService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  // Estados da Busca e Conteúdos Populares (Hero + Seção 1)
  searchQuery = signal<string>('');
  expandedFaqIds = signal<number[]>([]);

  // Estados da Seção "Escolha o assunto" (Grid 3 colunas)
  activeTabGroup = signal<'todos' | 'viagem' | 'conta'>('todos');
  expandedCategoryIds = signal<string[]>([]);
  showAllCategories = signal<boolean>(false);

  // Dados de FAQ e Categorias
  faqList = signal<FaqItem[]>([]);
  categoryCards = signal<FaqCategoryCard[]>([]);

  // Estados do Formulário de Atendimento
  subjectOptions: SupportSubjectOption[] = [];
  selectedSubject = signal<string>('');
  isSubjectDropdownOpen = signal<boolean>(false);
  userName = signal<string>('');
  userEmail = signal<string>('');
  description = signal<string>('');

  // Anexo (Múltiplos)
  attachments = signal<AttachedFileItem[]>([]);
  readonly maxTotalSizeBytes = 5 * 1024 * 1024;
  totalAttachmentSize = computed<number>(() => this.attachments().reduce((sum, item) => sum + item.size, 0));


  attachmentError = signal<string | null>(null);

  // Estados de Envio e Modal
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successTicket = signal<SupportTicketResponse | null>(null);
  isSuccessModalOpen = signal<boolean>(false);

  // Usuário Autenticado
  isLoggedIn = computed(() => this.authService.isAuthenticated());

  // SLA do assunto selecionado
  currentSubjectSla = computed<SupportSubjectOption | null>(() => {
    const subj = this.selectedSubject();
    if (!subj) return null;
    return this.subjectOptions.find(o => o.label === subj) || null;
  });

  // Conteúdos populares (Top 5) exibidos abaixo do Hero quando não há busca ativa
  popularFaqs = computed<FaqItem[]>(() => {
    return this.faqList().filter(item => item.isPopular).slice(0, 5);
  });

  // Resultados da busca por palavra-chave no Hero
  searchResults = computed<FaqItem[]>(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];
    return this.faqList().filter(item =>
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(query)))
    );
  });

  // Todos os 9 cards de assunto sempre visíveis diretamente
  visibleCategoryCards = computed<FaqCategoryCard[]>(() => {
    return this.categoryCards();
  });

  hasMoreCategories = computed<boolean>(() => false);

  @HostListener('document:click')
  onDocumentClick(): void {
    this.isSubjectDropdownOpen.set(false);
  }

  ngOnInit(): void {
    this.faqList.set(this.supportService.getFaqList());
    this.categoryCards.set(this.supportService.getFaqCategoryCards());
    this.subjectOptions = this.supportService.getSubjectOptions();

    if (this.isLoggedIn()) {
      this.userService.getProfile().subscribe({
        next: (profile) => {
          if (profile) {
            this.userName.set(profile.name || profile.socialName || '');
            this.userEmail.set(profile.email);
          }
        },
        error: () => {}
      });
    }
  }

  setTabGroup(group: 'todos' | 'viagem' | 'conta'): void {
    this.activeTabGroup.set(group);
    this.showAllCategories.set(false);
  }

  toggleShowAllCategories(): void {
    this.showAllCategories.update(v => !v);
  }

  toggleCategoryCard(categoryId: string): void {
    const current = this.expandedCategoryIds();
    if (current.includes(categoryId)) {
      this.expandedCategoryIds.set(current.filter(id => id !== categoryId));
    } else {
      this.expandedCategoryIds.set([...current, categoryId]);
    }
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedCategoryIds().includes(categoryId);
  }

  getFaqsByCategory(categoryId: string): FaqItem[] {
    return this.faqList().filter(item => item.categoryId === categoryId);
  }

  toggleFaq(id: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const current = this.expandedFaqIds();
    if (current.includes(id)) {
      this.expandedFaqIds.set(current.filter(item => item !== id));
    } else {
      this.expandedFaqIds.set([...current, id]);
    }
  }

  isFaqExpanded(id: number): boolean {
    return this.expandedFaqIds().includes(id);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  toggleSubjectDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isSubjectDropdownOpen.update(v => !v);
  }

  selectSubject(label: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedSubject.set(label);
    this.isSubjectDropdownOpen.set(false);
  }

  getSlaColorClass(slaHours: number): 'sla-green' | 'sla-yellow' | 'sla-red' {
    if (slaHours <= 8) return 'sla-green';
    if (slaHours <= 16) return 'sla-yellow';
    return 'sla-red';
  }

  onFilesSelected(event: Event): void {
    this.attachmentError.set(null);
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    let currentTotal = this.totalAttachmentSize();
    const newItems: AttachedFileItem[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isValid = allowedTypes.includes(file.type) || allowedExts.includes(ext);

      if (!isValid) {
        this.attachmentError.set(`O arquivo "${file.name}" não é suportado. Utilize apenas PDF, PNG, JPG ou JPEG.`);
        input.value = '';
        return;
      }

      if (currentTotal + file.size > this.maxTotalSizeBytes) {
        const excessMb = ((currentTotal + file.size) / (1024 * 1024)).toFixed(1);
        this.attachmentError.set(
          `Limite de 5 MB excedido! Adicionar "${file.name}" levaria o total para ${excessMb} MB. Limite máximo permitido: 5 MB.`
        );
        input.value = '';
        return;
      }

      const item: AttachedFileItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type || `application/${ext}`
      };

      currentTotal += file.size;
      newItems.push(item);

      const reader = new FileReader();
      reader.onload = () => {
        item.base64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }

    this.attachments.update(curr => [...curr, ...newItems]);
    input.value = '';
  }

  removeAttachment(id: string): void {
    this.attachments.update(list => list.filter(item => item.id !== id));
    if (this.attachments().length === 0) {
      this.attachmentError.set(null);
    }
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      return 'bi-file-earmark-pdf-fill text-danger';
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      return 'bi-file-earmark-image-fill text-primary';
    }
    return 'bi-file-earmark-check-fill text-success';
  }

  formatFileSize(bytes?: number | null): string {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(0) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onSubmitTicket(): void {
    this.errorMessage.set(null);

    const name = this.userName().trim();
    const email = this.userEmail().trim();
    const subj = this.selectedSubject().trim();
    const desc = this.description().trim();

    if (!name || name.length < 2) {
      this.errorMessage.set('Por favor, informe seu nome completo.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      this.errorMessage.set('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!subj) {
      this.errorMessage.set('Por favor, selecione o assunto da sua mensagem.');
      return;
    }

    if (!desc || desc.length < 10) {
      this.errorMessage.set('Por favor, descreva sua solicitação com pelo menos 10 caracteres.');
      return;
    }

    this.isSubmitting.set(true);

    const slaOption = this.currentSubjectSla();
    const files = this.attachments();
    let combinedName: string | undefined = undefined;
    let totalSize: number | undefined = undefined;
    let combinedType: string | undefined = undefined;
    let combinedData: string | undefined = undefined;

    if (files.length === 1) {
      combinedName = files[0].name;
      totalSize = files[0].size;
      combinedType = files[0].type;
      combinedData = files[0].base64;
    } else if (files.length > 1) {
      const names = files.map(f => f.name).join(', ');
      combinedName = names.length > 240 ? `${files.length} anexos (${names.substring(0, 220)}...)` : names;
      totalSize = this.totalAttachmentSize();
      combinedType = 'multiple';
      combinedData = JSON.stringify(files.map(f => ({ name: f.name, size: f.size, type: f.type, data: f.base64 })));
    }

    const payload: SupportTicketRequest = {
      userName: name,
      userEmail: email,
      subject: subj,
      slaHours: slaOption?.slaHours || 24,
      slaDescription: slaOption?.slaDescription || 'até 24 horas úteis',
      description: desc,
      attachmentName: combinedName,
      attachmentSize: totalSize,
      attachmentType: combinedType,
      attachmentData: combinedData
    };

    this.supportService.createTicket(payload).subscribe({
      next: (ticket) => {
        this.isSubmitting.set(false);
        this.successTicket.set(ticket);
        this.isSuccessModalOpen.set(true);
        this.selectedSubject.set('');
        this.description.set('');
        this.attachments.set([]);
        this.attachmentError.set(null);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.message || 'Falha ao registrar chamado. Tente novamente em instantes.');
      }
    });
  }

  closeSuccessModal(): void {
    this.isSuccessModalOpen.set(false);
  }

  goToMyTickets(): void {
    this.isSuccessModalOpen.set(false);
    this.router.navigate(['/profile'], { queryParams: { tab: 'support' } });
  }

  scrollToSection(elementId: string): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
