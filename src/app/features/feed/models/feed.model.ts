export interface PostAttribute {
  attributeId: number;
  attributeName: string;
  weight?: number;
}

export interface Post {
  id: number;
  title: string;
  caption?: string;
  imageUrl?: string;
  destinationId?: number;
  published?: boolean;
  createdAt?: string;
  attributes?: PostAttribute[];
  likesCount?: number;
  dislikesCount?: number;
  userInteraction?: 'LIKE' | 'DISLIKE' | 'VOTE' | null;
  userOptionId?: number | null;
  postType?: 'ARTICLE' | 'DEFAULT' | 'THIS_OR_THAT' | 'TRIVIA';
  thisOrThatOptions?: { id: number, image: string, label: string, votes?: number }[];
  triviaData?: { question: string, options: string[], correctIndex: number, explanation: string };
}

export interface InteractionRequest {
  postId: number;
  interactionType: 'LIKE' | 'DISLIKE';
}

