import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Destination } from '../../models/destination.model';

@Component({
  selector: 'app-destination-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './destination-card.component.html',
  styleUrls: ['./destination-card.component.scss']
})
export class DestinationCardComponent {
  @Input() destination!: Destination;
  @Input() isWide: boolean = false;
  
  @Output() discover = new EventEmitter<Destination>();
  @Output() embark = new EventEmitter<Destination>();

  placeholderImage = 'assets/placeholder-dest.jpg';
  isTakingOff = signal(false);

  onDiscover(event: Event) {
    event.stopPropagation();
    this.discover.emit(this.destination);
  }

  onEmbark(event: Event) {
    event.stopPropagation();
    if (this.isTakingOff()) return;
    this.isTakingOff.set(true);
    setTimeout(() => {
      this.embark.emit(this.destination);
      this.isTakingOff.set(false);
    }, 1800);
  }
}
