import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validador de CPF utilizando o cálculo oficial dos dígitos verificadores (Módulo 11).
 * Rejeita sequências conhecidas de dígitos repetidos e valida ambos os dígitos.
 */
export function cpfValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const rawValue = control.value;
    if (!rawValue) {
      return null; // Deixa o Validators.required cuidar da obrigatoriedade
    }

    const cleanCpf = String(rawValue).replace(/\D/g, '');

    if (cleanCpf.length !== 11) {
      return { invalidCpf: true, message: 'O CPF deve conter exatamente 11 dígitos numéricos.' };
    }

    // Rejeita sequências de dígitos idênticos (000.000.000-00, 111.111.111-11, etc.)
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return { invalidCpf: true, message: 'CPF inválido (dígitos repetidos).' };
    }

    // Validação do 1º dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i), 10) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9), 10)) {
      return { invalidCpf: true, message: 'CPF inválido.' };
    }

    // Validação do 2º dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i), 10) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10), 10)) {
      return { invalidCpf: true, message: 'CPF inválido.' };
    }

    return null;
  };
}

/**
 * Validador para data de nascimento:
 * - Não pode ser data futura.
 * - Deve respeitar a idade mínima exigida pelo backend (mínimo de 1 ano de idade).
 */
export function birthDateValidator(minAge: number = 18): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    // O valor do form deve estar em ISO (YYYY-MM-DD); texto parcial digitado é inválido.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { invalidDate: true, message: 'Informe a data completa (dd/mm/aaaa).' };
    }

    const birthDate = new Date(value + 'T00:00:00');
    const today = new Date();

    if (isNaN(birthDate.getTime())) {
      return { invalidDate: true, message: 'Data inválida.' };
    }

    // Ano mínimo realista (ex: 1900)
    if (birthDate.getFullYear() < 1900) {
      return { invalidYear: true, message: 'Ano de nascimento inválido.' };
    }

    if (birthDate > today) {
      return { futureDate: true, message: 'A data de nascimento não pode ser no futuro.' };
    }

    // Idade em anos
    const minAgeDate = new Date();
    minAgeDate.setFullYear(today.getFullYear() - minAge);

    if (birthDate > minAgeDate) {
      return { minAge: true, message: `Você deve ter pelo menos ${minAge} anos para se cadastrar.` };
    }

    return null;
  };
}

/**
 * Formata uma string de CPF com a máscara 000.000.000-00
 */
export function formatCpf(value: string | null | undefined): string {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validador de nome completo:
 * - Deve conter apenas letras (incluindo acentuação em português), espaços e apóstrofe/hífen.
 * - Mínimo de 3 caracteres.
 * - Rejeita caracteres especiais como %, $, #, números, etc.
 */
export function nameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value ? String(control.value).trim() : '';
    if (!value) return null;

    if (value.length < 3) {
      return { minLength: true, message: 'O nome deve ter no mínimo 3 caracteres.' };
    }

    // Apenas letras (incluindo acentos latinos), apóstrofe, hífen e espaços (sem ranges que pegam @)
    const nameRegex = /^[A-Za-zÀ-ÿ]+([\s'-][A-Za-zÀ-ÿ]+)*$/;
    if (!nameRegex.test(value) || value.includes('@')) {
      return { invalidName: true, message: 'O nome deve conter apenas letras, sem caracteres especiais ou números.' };
    }

    return null;
  };
}

/**
 * Validador estrito de e-mail via regex (formato padrão com usuário, @, domínio e TLD de 2+ letras):
 */
export function strictEmailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value ? String(control.value).trim() : '';
    if (!value) return null;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return { invalidEmail: true, message: 'Informe um formato de email válido (ex: nome@exemplo.com).' };
    }

    return null;
  };
}

