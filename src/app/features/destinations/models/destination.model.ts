export interface Destination {
  id: number;
  name: string;
  country: string;
  city: string;
  continent?: string;
  description?: string;
  tourismType?: string;
  basePrice?: number;
  imageUrl?: string;
}
