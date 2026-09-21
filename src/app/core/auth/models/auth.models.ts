export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
}

export interface User {
  id?: number;
  name?: string;
  email?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  cpf: string;
  password?: string;
  birthDate: string;
  profileImageUrl?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword?: string;
}
