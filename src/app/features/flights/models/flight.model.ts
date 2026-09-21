export interface Flight {
  id: number;
  destinationId: number;
  originAirportCode: string;
  destinationAirportCode: string;
  flightDate: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  pricePerPerson: number;
  priceExecutive?: number;
  pricePremium?: number;
  totalSeats: number;
  availableSeats: number;
}

export type FlightSeatClass = 'BASIC' | 'EXECUTIVE' | 'PREMIUM';

export interface SelectedFlightBooking {
  flight: Flight;
  seatClass: FlightSeatClass;
  price: number;
}

export interface FlightSearchParams {
  destinationId: number;
  startDate?: string;
  endDate?: string;
}
