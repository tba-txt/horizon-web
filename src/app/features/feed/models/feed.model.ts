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
  userInteraction?: 'LIKE' | 'DISLIKE' | null;
}

export interface InteractionRequest {
  postId: number;
  interactionType: 'LIKE' | 'DISLIKE';
}
