export type FeedbackType = 'NPS' | 'CSAT';
export type TargetType = 'PLATFORM' | 'TRIP';

export interface FeedbackRequest {
  reservationId?: number | null;
  feedbackType: FeedbackType;
  targetType: TargetType;
  score: number;
  comment?: string;
}

export interface FeedbackHistoryItem {
  id?: string;
  reservationId?: number | null;
  feedbackType: FeedbackType;
  targetType: TargetType;
  score: number;
  comment?: string;
  submittedAt: string;
}
