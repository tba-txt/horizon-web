export interface UserProfile {
  id: number;
  name: string;
  socialName?: string | null;
  email: string;
  cpf: string;
  birthDate: string;
  profileImageUrl?: string | null;
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
  profileImageUrl?: string | null;
}
