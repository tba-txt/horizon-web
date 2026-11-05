export interface UserProfile {
  id: number;
  name: string;
  socialName?: string | null;
  email: string;
  cpf: string;
  birthDate: string;
  phone?: string | null;
  country?: string | null;
  profileImageUrl?: string | null;
  authProvider?: string | null;
  budgetPerPerson?: number | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserUpdateRequest {
  name: string;
  socialName?: string | null;
  email: string;
  cpf: string;
  birthDate: string;
  phone?: string | null;
  country?: string | null;
  profileImageUrl?: string | null;
}
