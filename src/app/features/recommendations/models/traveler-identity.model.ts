export interface ProfileAttribute {
  attributeId: number | string;
  attributeName?: string;
  score: number;
}

export interface ProfileResponse {
  hasProfile: boolean;
  message?: string;
  attributes?: ProfileAttribute[];
}

export interface AttributeDimension {
  id: number | string;
  name: string;
  label: string;
  icon: string;
  category: string;
  color: string;
  explicitScore: number;      // 0 to 1 (do Quiz)
  behavioralScore: number;    // 0 to 1 (do Feed)
  combinedScore: number;      // (explicit * 0.6) + (behavioral * 0.4)
  percentage: number;         // 0 to 100%
}

export interface TravelerArchetype {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  quote: string;
  primaryColor: string;
  accentColor: string;
  icon: string;
  superpowers: string[];
}

export interface RadarPoint {
  axis: string;
  label: string;
  angle: number;
  explicitVal: number;
  behavioralVal: number;
  combinedVal: number;
  explicitX: number;
  explicitY: number;
  behavioralX: number;
  behavioralY: number;
  combinedX: number;
  combinedY: number;
  labelX: number;
  labelY: number;
}

export interface TravelerIdentityState {
  hasProfile: boolean;
  userName: string;
  socialName?: string;
  profileImageUrl?: string | null;
  budgetPerPerson?: number | null;
  archetype: TravelerArchetype;
  dimensions: AttributeDimension[];
  topDimensions: AttributeDimension[];
  radarPoints: RadarPoint[];
  explicitPolygon: string;
  behavioralPolygon: string;
  combinedPolygon: string;
  synergyScore: number;        // Sinergia entre Quiz e Feed (0 a 100%)
  totalExplicitAttributes: number;
  totalBehavioralInteractions: number;
}
