export interface ForecastDto {
  description?: string;
  minTemperature?: number;
  maxTemperature?: number;
  apparentTemperature?: number;
  precipitationMm?: number;
  precipitationProbabilityPercent?: number;
  weatherCode?: number;
  weatherDescription?: string;
  windSpeedKmH?: number;
}

export interface HistoricalContextDto {
  referencePeriod?: string;
  description?: string;
  meanTemperature?: number;
  minTemperature?: number;
  maxTemperature?: number;
  totalPrecipitationMm?: number;
  rainyDaysCount?: number;
  snowyDaysCount?: number;
  avgWindSpeedKmH?: number;
}

export interface DestinationWeather {
  destinationId: number;
  destinationName: string;
  city?: string;
  country?: string;
  targetDate?: string;
  mode?: string;
  modeDescription?: string;
  summary?: string;
  forecast?: ForecastDto;
  historicalContext?: HistoricalContextDto;
}
