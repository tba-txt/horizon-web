import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap, timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FaqCategoryCard, FaqItem, SupportSubjectOption, SupportTicketRequest, SupportTicketResponse } from '../models/support.model';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/support-tickets`;

  // Cache local reativo para atualização imediata na UI
  private localTickets = signal<SupportTicketResponse[]>([]);
  readonly tickets = this.localTickets.asReadonly();

  // Opções de Assunto com SLA explícito e ícones dedicados
  readonly SUBJECT_OPTIONS: SupportSubjectOption[] = [
    {
      id: 'payment-issue',
      label: 'Problemas com Pagamento (PIX / Cartão)',
      icon: 'bi-credit-card-2-front-fill',
      slaHours: 2,
      slaDescription: 'até 2 horas úteis',
      category: 'FINANCEIRO',
      priorityBadge: 'Urgente • Rápido'
    },
    {
      id: 'baggage-seats',
      label: 'Dúvidas sobre Bagagem e Assentos',
      icon: 'bi-luggage-fill',
      slaHours: 4,
      slaDescription: 'até 4 horas úteis',
      category: 'BAGAGEM',
      priorityBadge: 'Resposta Rápida'
    },
    {
      id: 'passenger-correction',
      label: 'Correção de Dados do Passageiro',
      icon: 'bi-person-vcard-fill',
      slaHours: 6,
      slaDescription: 'até 6 horas úteis',
      category: 'DOCUMENTOS',
      priorityBadge: 'Alta Prioridade'
    },
    {
      id: 'seat-classes',
      label: 'Dúvidas sobre Classes (Básico, Executivo, Premium)',
      icon: 'bi-award-fill',
      slaHours: 6,
      slaDescription: 'até 6 horas úteis',
      category: 'RESERVAS',
      priorityBadge: 'Consultoria de Voo'
    },
    {
      id: 'missions-coupon',
      label: 'Dúvidas sobre Cupom das Missões do Feed',
      icon: 'bi-ticket-perforated-fill',
      slaHours: 6,
      slaDescription: 'até 6 horas úteis',
      category: 'GERAL',
      priorityBadge: 'Benefícios Horizon'
    },
    {
      id: 'docs-visa',
      label: 'Exigências de Documentação e Visto',
      icon: 'bi-passport-fill',
      slaHours: 8,
      slaDescription: 'até 8 horas úteis',
      category: 'DOCUMENTOS',
      priorityBadge: 'Orientação de Embarque'
    },
    {
      id: 'flight-change',
      label: 'Alteração de Data ou Voo',
      icon: 'bi-calendar2-range-fill',
      slaHours: 12,
      slaDescription: 'até 12 horas úteis',
      category: 'RESERVAS',
      priorityBadge: 'Prazo Moderado'
    },
    {
      id: 'special-assistance',
      label: 'Assistência Especial ou Acessibilidade',
      icon: 'bi-heart-pulse-fill',
      slaHours: 16,
      slaDescription: 'até 16 horas úteis',
      category: 'RESERVAS',
      priorityBadge: 'Acompanhamento Dedicado'
    },
    {
      id: 'cancel-refund',
      label: 'Cancelamento ou Reembolso',
      icon: 'bi-arrow-counterclockwise',
      slaHours: 24,
      slaDescription: 'até 24 horas úteis',
      category: 'FINANCEIRO',
      priorityBadge: 'Análise Financeira'
    },
    {
      id: 'invoice-receipt',
      label: 'Solicitação de Nota Fiscal ou Recibo',
      icon: 'bi-receipt-cutoff',
      slaHours: 24,
      slaDescription: 'até 24 horas úteis',
      category: 'FINANCEIRO',
      priorityBadge: 'Faturamento'
    },
    {
      id: 'other-feedback',
      label: 'Elogios, Sugestões ou Outros Assuntos',
      icon: 'bi-chat-dots-fill',
      slaHours: 48,
      slaDescription: 'até 48 horas úteis',
      category: 'GERAL',
      priorityBadge: 'Ouvidoria Horizon'
    }
  ];

  // Categorias no formato Cards (estilo PagBank)
  readonly FAQ_CATEGORIES: FaqCategoryCard[] = [
    {
      id: 'voos-reservas',
      title: 'Voos e Reservas',
      description: 'Consulte informações sobre itinerários, emissão de bilhetes e reservas confirmadas.',
      icon: 'bi-airplane',
      tabGroup: 'viagem'
    },
    {
      id: 'bagagens',
      title: 'Bagagens e Franquias',
      description: 'Saiba tudo sobre limites de peso, dimensões da mala de mão e bagagens despachadas.',
      icon: 'bi-luggage',
      tabGroup: 'viagem'
    },
    {
      id: 'classes-voo',
      title: 'Classes de Voo',
      description: 'Conheça os benefícios exclusivos das classes Básico, Executivo e Premium.',
      icon: 'bi-award',
      tabGroup: 'viagem'
    },
    {
      id: 'documentacao',
      title: 'Documentação e Vistos',
      description: 'Regras para embarque nacional, viagens ao Mercosul com RG e passaportes.',
      icon: 'bi-passport',
      tabGroup: 'viagem'
    },
    {
      id: 'checkin-embarque',
      title: 'Check-in e Embarque',
      description: 'Orientações sobre horários no aeroporto, portão de embarque e cartão 3D.',
      icon: 'bi-qr-code-scan',
      tabGroup: 'viagem'
    },
    {
      id: 'alteracoes-cancelamento',
      title: 'Alterações e Reembolso',
      description: 'Como remarcar datas de viagem, solicitar cancelamento e prazos de estorno.',
      icon: 'bi-calendar-event',
      tabGroup: 'viagem'
    },
    {
      id: 'pagamentos',
      title: 'Pagamentos e PIX',
      description: 'Tire dúvidas sobre PIX com aprovação instantânea e parcelamento no cartão.',
      icon: 'bi-credit-card',
      tabGroup: 'conta'
    },
    {
      id: 'seguranca-conta',
      title: 'Segurança e Conta',
      description: 'Gerenciamento de perfil, proteção de dados LGPD e recuperação de acesso.',
      icon: 'bi-shield-lock',
      tabGroup: 'conta'
    },
    {
      id: 'missoes-descontos',
      title: 'Missões e Benefícios',
      description: 'Descubra como desbloquear seu cupom de 10% OFF no Feed e calibrar seu Quiz.',
      icon: 'bi-stars',
      tabGroup: 'conta'
    }
  ];

  // Perguntas Frequentes Ricas organizadas por categoria e destaques populares
  readonly FAQ_DATA: FaqItem[] = [
    // 1. Voos e Reservas
    {
      id: 1,
      categoryId: 'voos-reservas',
      category: 'Voos e Reservas',
      question: 'Como consulto meus voos e reservas confirmadas?',
      answer: 'Você pode acessar todas as suas viagens diretamente na aba "Minhas Viagens" dentro da sua conta. Lá você visualiza itinerário completo, código localizador, cartão de embarque interativo em 3D e opção de download em PDF.',
      tags: ['reservas', 'voos', 'bilhete', 'itinerário'],
      isPopular: true
    },
    {
      id: 2,
      categoryId: 'voos-reservas',
      category: 'Voos e Reservas',
      question: 'Onde encontro o código localizador da minha viagem?',
      answer: 'O código localizador é gerado imediatamente após a confirmação da compra no Checkout e também aparece no topo do seu cartão de embarque dentro de "Minhas Viagens".',
      tags: ['localizador', 'código', 'reserva']
    },
    {
      id: 3,
      categoryId: 'voos-reservas',
      category: 'Voos e Reservas',
      question: 'Posso comprar passagens para mais de um passageiro na mesma reserva?',
      answer: 'Sim! Durante o fluxo de reserva, você pode selecionar a quantidade de passageiros e preencher os dados individuais de cada viajante antes de avançar para o pagamento.',
      tags: ['passageiros', 'grupo', 'família']
    },

    // 2. Bagagens e Franquias
    {
      id: 4,
      categoryId: 'bagagens',
      category: 'Bagagens e Franquias',
      question: 'Qual é o tamanho e peso permitido para a bagagem de mão?',
      answer: 'Todos os passageiros têm direito a 1 bagagem de mão de até 10kg (dimensões máximas 55 x 35 x 25 cm) mais 1 item pessoal (mochila ou bolsa pequena) que deve caber abaixo do assento à frente.',
      tags: ['bagagem', 'mala de mão', 'peso', '10kg'],
      isPopular: true
    },
    {
      id: 5,
      categoryId: 'bagagens',
      category: 'Bagagens e Franquias',
      question: 'Quantas malas despachadas estão inclusas em cada classe?',
      answer: 'Na classe Básico, a viagem contempla a mala de mão de 10kg. Na classe Executivo, você conta com 1 bagagem despachada de até 23kg inclusa. Na classe Premium, são 2 bagagens despachadas de até 23kg cada.',
      tags: ['despachada', '23kg', 'bagagem', 'franquia']
    },
    {
      id: 6,
      categoryId: 'bagagens',
      category: 'Bagagens e Franquias',
      question: 'O que não posso levar na bagagem de mão em voos internacionais?',
      answer: 'Em voos internacionais, líquidos, géis e aerossóis devem estar em frascos de até 100ml cada, acondicionados em uma embalagem plástica transparente vedável de até 1 litro.',
      tags: ['líquidos', '100ml', 'internacional', 'restrições']
    },

    // 3. Classes de Voo
    {
      id: 7,
      categoryId: 'classes-voo',
      category: 'Classes de Voo',
      question: 'Quais são as diferenças entre as classes Básico, Executivo e Premium?',
      answer: 'A Horizon opera exclusivamente com três classes: Básico (tarifa enxuta com bagagem de mão de 10kg), Executivo (assento com espaço extra, 1 mala despachada de 23kg e atendimento ágil) e Premium (poltronas de alto conforto, 2 malas de 23kg, serviço de bordo especial e embarque prioritário).',
      tags: ['classes', 'básico', 'executivo', 'premium'],
      isPopular: true
    },
    {
      id: 8,
      categoryId: 'classes-voo',
      category: 'Classes de Voo',
      question: 'Como a classe escolhida aparece no meu cartão de embarque?',
      answer: 'O seu cartão de embarque e o bilhete oficial em PDF refletem fielmente a classe selecionada no momento da compra (Básico, Executivo ou Premium), garantindo seus benefícios no portão de embarque.',
      tags: ['cartão de embarque', 'classe', 'pdf']
    },
    {
      id: 9,
      categoryId: 'classes-voo',
      category: 'Classes de Voo',
      question: 'Posso solicitar upgrade de classe após concluir minha reserva?',
      answer: 'Sim! Você pode solicitar o upgrade para Executivo ou Premium diretamente pelo nosso Canal de Atendimento até 24 horas antes do horário do voo, sujeito à disponibilidade da aeronave.',
      tags: ['upgrade', 'executivo', 'premium']
    },

    // 4. Documentação e Vistos
    {
      id: 10,
      categoryId: 'documentacao',
      category: 'Documentação e Vistos',
      question: 'Preciso de passaporte para viajar para países do Mercosul?',
      answer: 'Não obrigatoriamente! Pelo acordo do Mercosul (Argentina, Uruguai, Paraguai e Chile), cidadãos brasileiros podem embarcar apresentando apenas o RG civil original em bom estado e com menos de 10 anos de emissão, ou passaporte válido.',
      tags: ['mercosul', 'argentina', 'chile', 'passaporte', 'rg'],
      isPopular: true
    },
    {
      id: 11,
      categoryId: 'documentacao',
      category: 'Documentação e Vistos',
      question: 'Quais documentos são aceitos em voos domésticos no Brasil?',
      answer: 'Para destinos nacionais, são aceitos RG, CNH (física ou digital pelo app oficial), Passaporte brasileiro válido ou Carteira de Identidade Profissional com foto.',
      tags: ['nacional', 'doméstico', 'rg', 'cnh']
    },
    {
      id: 12,
      categoryId: 'documentacao',
      category: 'Documentação e Vistos',
      question: 'Qual a validade mínima do passaporte para Europa, EUA e Ásia?',
      answer: 'Para destinos internacionais fora da América do Sul, exige-se passaporte com validade mínima de 6 meses a contar da data prevista de retorno, além de eventuais vistos ou autorizações eletrônicas.',
      tags: ['passaporte', 'validade', '6 meses', 'visto']
    },

    // 5. Check-in e Embarque
    {
      id: 13,
      categoryId: 'checkin-embarque',
      category: 'Check-in e Embarque',
      question: 'Com quanta antecedência devo chegar ao aeroporto?',
      answer: 'Recomendamos comparecer ao aeroporto com 2 horas de antecedência para voos nacionais e 3 horas de antecedência para voos internacionais.',
      tags: ['antecedência', 'horário', 'aeroporto', 'embarque']
    },
    {
      id: 14,
      categoryId: 'checkin-embarque',
      category: 'Check-in e Embarque',
      question: 'Como baixar meu cartão de embarque oficial em PDF?',
      answer: 'Acesse o menu Minha Conta, clique em "Minhas Viagens", selecione a reserva desejada para abrir o cartão 3D e clique no botão de download de PDF.',
      tags: ['pdf', 'download', 'cartão 3d', 'check-in']
    },

    // 6. Alterações e Reembolso
    {
      id: 15,
      categoryId: 'alteracoes-cancelamento',
      category: 'Alterações e Reembolso',
      question: 'Como solicitar cancelamento ou reembolso de uma reserva?',
      answer: 'Você pode cancelar diretamente em "Minhas Viagens" ou abrir um chamado abaixo selecionando "Cancelamento ou Reembolso" (SLA de até 24 horas úteis).',
      tags: ['cancelamento', 'reembolso', 'estorno']
    },
    {
      id: 16,
      categoryId: 'alteracoes-cancelamento',
      category: 'Alterações e Reembolso',
      question: 'Como corrigir erro de digitação no nome do passageiro?',
      answer: 'Caso tenha digitado alguma letra incorreta no nome do passageiro, abra um chamado com o assunto "Correção de Dados do Passageiro" (SLA de até 6 horas úteis) anexando a foto do documento.',
      tags: ['nome', 'correção', 'passageiro', 'erro']
    },

    // 7. Pagamentos e PIX
    {
      id: 17,
      categoryId: 'pagamentos',
      category: 'Pagamentos e PIX',
      question: 'Como funciona o pagamento via PIX e o parcelamento no Cartão?',
      answer: 'No Checkout da Horizon você pode pagar via PIX com código Copia e Cola e aprovação imediata, ou parcelar no Cartão de Crédito em até 12x sem juros.',
      tags: ['pix', 'cartão', 'parcelamento', 'pagamento']
    },
    {
      id: 18,
      categoryId: 'pagamentos',
      category: 'Pagamentos e PIX',
      question: 'Qual o prazo para o estorno cair na minha conta após cancelamento?',
      answer: 'Pagamentos feitos via PIX são estornados na mesma conta bancária em até 24 horas úteis. Compras em cartão de crédito têm o estorno processado em até 2 faturas subsequentes.',
      tags: ['estorno', 'prazo', 'pix', 'fatura']
    },

    // 8. Segurança e Conta
    {
      id: 19,
      categoryId: 'seguranca-conta',
      category: 'Segurança e Conta',
      question: 'Como recupero minha senha de acesso na Horizon?',
      answer: 'Na tela de login, clique em "Esqueceu a senha?", informe seu e-mail cadastrado e enviaremos um código numérico de verificação de 6 dígitos para redefinição imediata.',
      tags: ['senha', 'recuperação', 'login', 'código']
    },
    {
      id: 20,
      categoryId: 'seguranca-conta',
      category: 'Segurança e Conta',
      question: 'Onde acompanho o andamento dos meus chamados de suporte?',
      answer: 'Ao abrir um chamado no Canal de Atendimento, um protocolo (ex: HZ-2026-01) é gerado e fica disponível na aba "Meus Chamados" acessando Minha Conta, com status Em Atendimento ou Resolvido.',
      tags: ['chamados', 'protocolo', 'suporte', 'ticket']
    },

    // 9. Missões e Benefícios
    {
      id: 21,
      categoryId: 'missoes-descontos',
      category: 'Missões e Benefícios',
      question: 'Como ganhar 10% OFF cumprindo as Missões do Feed?',
      answer: 'Acesse a aba Feed de experiências da Horizon e complete as 3 missões rápidas: finalizar o Quiz de Perfil, interagir com 3 publicações e ler 1 crônica de viagem. O cupom de 10% OFF é liberado na hora para sua próxima reserva!',
      tags: ['cupom', '10% off', 'missões', 'feed', 'desconto'],
      isPopular: true
    },
    {
      id: 22,
      categoryId: 'missoes-descontos',
      category: 'Missões e Benefícios',
      question: 'Como funciona o Quiz de DNA de Viagem da Horizon?',
      answer: 'O Quiz analisa suas preferências entre Ecoturismo/Natureza, Aventura/Montanha, Grandes Cidades e Descanso para recomendar destinos personalizados com a identidade visual do seu perfil.',
      tags: ['quiz', 'dna', 'perfil', 'ecoturismo']
    }
  ];

  constructor() {
    this.loadTicketsFromStorage();
  }

  getSubjectOptions(): SupportSubjectOption[] {
    return this.SUBJECT_OPTIONS;
  }

  getFaqCategoryCards(): FaqCategoryCard[] {
    return this.FAQ_CATEGORIES;
  }

  getFaqList(): FaqItem[] {
    return this.FAQ_DATA;
  }

  getFaqCategories(): string[] {
    return this.FAQ_CATEGORIES.map(c => c.title);
  }

  createTicket(request: SupportTicketRequest): Observable<SupportTicketResponse> {
    return this.http.post<SupportTicketResponse>(this.apiUrl, request).pipe(
      timeout(12000),
      tap(created => {
        this.addTicketToLocal(created);
      }),
      catchError(() => {
        const localCreated = this.createLocalFallbackTicket(request);
        this.addTicketToLocal(localCreated);
        return of(localCreated);
      })
    );
  }

  getMyTickets(email?: string): Observable<SupportTicketResponse[]> {
    const params = email ? `?email=${encodeURIComponent(email)}` : '';
    return this.http.get<SupportTicketResponse[]>(`${this.apiUrl}${params}`).pipe(
      timeout(10000),
      tap(list => {
        if (list && list.length > 0) {
          this.localTickets.set(list);
          this.saveTicketsToStorage(list);
        }
      }),
      catchError(() => {
        const stored = this.getStoredTickets();
        this.localTickets.set(stored);
        return of(stored);
      })
    );
  }

  resolveTicket(id: number): Observable<SupportTicketResponse> {
    return this.http.patch<SupportTicketResponse>(`${this.apiUrl}/${id}/resolve`, {}).pipe(
      timeout(10000),
      tap(updated => {
        this.updateLocalTicket(updated);
      }),
      catchError(() => {
        const current = this.localTickets();
        const updated = current.map(t => t.id === id ? { ...t, status: 'RESOLVIDO' as const, updatedAt: new Date().toISOString() } : t);
        this.localTickets.set(updated);
        this.saveTicketsToStorage(updated);
        const resolved = updated.find(t => t.id === id)!;
        return of(resolved);
      })
    );
  }

  private addTicketToLocal(ticket: SupportTicketResponse): void {
    const current = this.localTickets();
    const exists = current.some(t => t.id === ticket.id || t.ticketCode === ticket.ticketCode);
    const updated = exists ? current : [ticket, ...current];
    this.localTickets.set(updated);
    this.saveTicketsToStorage(updated);
  }

  private updateLocalTicket(ticket: SupportTicketResponse): void {
    const current = this.localTickets();
    const updated = current.map(t => (t.id === ticket.id || t.ticketCode === ticket.ticketCode) ? ticket : t);
    this.localTickets.set(updated);
    this.saveTicketsToStorage(updated);
  }

  private createLocalFallbackTicket(request: SupportTicketRequest): SupportTicketResponse {
    const stored = this.getStoredTickets();
    const nextIdx = stored.length + 1;
    const ticketCode = `HZ-2026-${String(nextIdx).padStart(2, '0')}`;
    const opt = this.SUBJECT_OPTIONS.find(o => o.label === request.subject);

    return {
      id: Date.now(),
      ticketCode,
      userName: request.userName,
      userEmail: request.userEmail,
      subject: request.subject,
      slaHours: request.slaHours || opt?.slaHours || 24,
      slaDescription: request.slaDescription || opt?.slaDescription || 'até 24 horas úteis',
      description: request.description,
      attachmentName: request.attachmentName,
      attachmentSize: request.attachmentSize,
      attachmentType: request.attachmentType,
      attachmentData: request.attachmentData,
      status: 'EM_ATENDIMENTO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private loadTicketsFromStorage(): void {
    const tickets = this.getStoredTickets();
    this.localTickets.set(tickets);
  }

  private getStoredTickets(): SupportTicketResponse[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const data = localStorage.getItem('horizon_support_tickets');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveTicketsToStorage(tickets: SupportTicketResponse[]): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('horizon_support_tickets', JSON.stringify(tickets));
    } catch {}
  }
}
