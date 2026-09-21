export interface AnswerOption {
  id: number;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  required?: boolean;
  answers: AnswerOption[];
}

export interface Quiz {
  id: number;
  title: string;
  version: number;
  questions: Question[];
}

export interface SubmitQuizRequest {
  answers: Record<string, number>; // questionId -> answerId
  budgetPerPerson: number;
}
