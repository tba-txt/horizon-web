export interface Recommendation {
  destinationId: number;
  destinationName: string;
  country: string;
  city: string;
  tourismType?: string;
  imageUrl?: string;
  basePrice?: number;
  score?: number;
  explanation?: string;
}
