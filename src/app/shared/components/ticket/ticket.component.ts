import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrls: ['./ticket.component.scss']
})
export class TicketComponent {
  @Input() passengerName: string = '';
  @Input() ticketNumber: string = '';
  @Input() origin: string = '';
  @Input() destination: string = '';
  @Input() flightNumber: string = '';
  @Input() departureTime: string = '';
  @Input() arrivalTime: string = '';
  @Input() gate: string = 'A11';
  @Input() seat: string = '21C';
  @Input() date: string = '';
}

