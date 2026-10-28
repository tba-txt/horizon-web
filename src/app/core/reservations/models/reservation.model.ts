export type TripType = 'ONE_WAY' | 'ROUND_TRIP';
export type ReservationStatus = 'PENDENTE' | 'CONFIRMADA' | 'CONCLUIDA' | 'CANCELADA';
export type PaymentMethod = 'PIX' | 'CARD';
export type SeatClass = 'BASIC' | 'EXECUTIVE' | 'PREMIUM';

export interface PassengerRequest {
  name: string;
  age: number;
}

export interface PassengerResponse {
  id: number;
  name: string;
  age: number;
}

export interface ReservationRequest {
  destinationId: number;
  tripType: TripType;
  outboundFlightId: number;
  outboundSeatClass?: SeatClass | string | null;
  returnFlightId?: number | null;
  returnSeatClass?: SeatClass | string | null;
  passengers: PassengerRequest[];
}

export interface TicketResponse {
  id: number;
  ticketNumber: string;
  reservationId: number;
  passengerName: string;
  seatClass: string;
  generatedAt?: string;
}

export interface FlightDetailInReservation {
  id: number;
  flightNumber: string;
  originAirportCode: string;
  destinationAirportCode: string;
  flightDate: string;
  departureTime: string;
  arrivalTime: string;
  pricePerPerson: number;
  seatClass?: SeatClass | string;
}

export interface ReservationResponse {
  reservationId: number;
  destinationId: number;
  destinationName?: string;
  tripType: TripType;
  departureDate?: string;
  returnDate?: string;
  totalAmount: number;
  status: ReservationStatus;
  paymentDeadline?: string;
  createdAt?: string;
  cancelledAt?: string;
  outboundFlight?: FlightDetailInReservation;
  returnFlight?: FlightDetailInReservation;
  passengers?: PassengerResponse[];
  tickets?: TicketResponse[];
}

export interface MyTripsResponse {
  pending: ReservationResponse[];
  confirmed: ReservationResponse[];
  finished: ReservationResponse[];
  cancelled: ReservationResponse[];
}

/**
 * Rascunho de seleção vindo da busca de voos para o checkout
 */
export interface CheckoutDraft {
  destinationId: number;
  destinationName: string;
  tripType: TripType;
  passengersCount: number;
  outboundFlight: {
    id: number;
    flightNumber: string;
    originAirportCode: string;
    destinationAirportCode: string;
    flightDate: string;
    departureTime: string;
    arrivalTime: string;
    seatClass: SeatClass;
    price: number;
  };
  returnFlight?: {
    id: number;
    flightNumber: string;
    originAirportCode: string;
    destinationAirportCode: string;
    flightDate: string;
    departureTime: string;
    arrivalTime: string;
    seatClass: SeatClass;
    price: number;
  } | null;
  totalPricePerPassenger: number;
  estimatedTotal: number;
}
