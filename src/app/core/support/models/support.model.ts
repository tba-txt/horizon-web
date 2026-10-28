export interface SupportSubjectOption {
  id: string;
  label: string;
  icon: string;
  slaHours: number;
  slaDescription: string;
  category: 'FINANCEIRO' | 'RESERVAS' | 'DOCUMENTOS' | 'BAGAGEM' | 'GERAL';
  priorityBadge: string;
}

export interface SupportTicketRequest {
  userName: string;
  userEmail: string;
  subject: string;
  slaHours?: number;
  slaDescription?: string;
  description: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  attachmentData?: string;
}

export interface SupportTicketResponse {
  id: number;
  ticketCode: string;
  userId?: number;
  userName: string;
  userEmail: string;
  subject: string;
  slaHours: number;
  slaDescription: string;
  description: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  attachmentData?: string;
  status: 'EM_ATENDIMENTO' | 'RESOLVIDO';
  createdAt: string;
  updatedAt: string;
}

export interface FaqCategoryCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  tabGroup: 'viagem' | 'conta';
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  categoryId: string;
  isPopular?: boolean;
  tags?: string[];
}
